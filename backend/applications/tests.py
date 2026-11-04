from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APITestCase

from .models import Application, ApplicationScore, ResultNotificationSettings

User = get_user_model()


def make_user(email, role="APPLICANT"):
    return User.objects.create_user(
        email=f"{email}@sch.ac.kr",
        password="demo-pass-1234",
        role=role,
        email_verified=True,
    )


def make_application(user, track="FRONTEND", doc_decision="PENDING"):
    return Application.objects.create(
        user=user, status="SUBMITTED", track=track, doc_decision=doc_decision
    )


class ApplicationApiTestCase(APITestCase):
    def setUp(self):
        cache.clear()  # DRF throttle 카운터가 테스트 사이에 이어지지 않게 한다
        self.applicant = make_user("applicant")
        self.instructor = make_user("instructor", role="INSTRUCTOR")

    def as_user(self, user):
        self.client.force_authenticate(user)


class ApplicantFlowTests(ApplicationApiTestCase):
    def setUp(self):
        super().setUp()
        self.as_user(self.applicant)

    def status_of_my_application(self):
        return Application.objects.get(user=self.applicant).status

    def test_draft_keeps_content_without_submitting(self):
        response = self.client.post(
            "/api/applications/draft", {"track": "BACKEND", "motivation": "임시 답변"}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.status_of_my_application(), "DRAFT")
        my = self.client.get("/api/applications/my").json()
        self.assertIsNone(my["application"])
        self.assertEqual(my["draft"]["motivation"], "임시 답변")

    def test_submit_changes_status_and_records_time(self):
        response = self.client.post("/api/applications/submit", {"track": "BACKEND"}, format="json")

        self.assertEqual(response.status_code, 200)
        application = Application.objects.get(user=self.applicant)
        self.assertEqual(application.status, "SUBMITTED")
        self.assertIsNotNone(application.submitted_at)

    def test_submitted_application_cannot_be_changed(self):
        self.client.post("/api/applications/submit", {"track": "BACKEND", "motivation": "제출본"}, format="json")

        for path in ("/api/applications/draft", "/api/applications/submit"):
            response = self.client.post(path, {"track": "AI_SERVER", "motivation": "수정"}, format="json")
            self.assertEqual(response.status_code, 409)

        application = Application.objects.get(user=self.applicant)
        self.assertEqual(application.track, "BACKEND")
        self.assertEqual(application.motivation, "제출본")

    def test_closed_track_rejects_submission(self):
        settings = ResultNotificationSettings.get_settings()
        settings.track_backend_open = False
        settings.save()

        response = self.client.post("/api/applications/submit", {"track": "BACKEND"}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "TRACK_CLOSED")
        self.assertEqual(self.status_of_my_application(), "DRAFT")

    def test_login_is_required(self):
        self.client.force_authenticate(None)

        for path in ("/api/applications/my", "/api/applications/results/my"):
            self.assertIn(self.client.get(path).status_code, (401, 403))


class AdminPermissionTests(ApplicationApiTestCase):
    def assert_admin_api_status(self, expected):
        application_id = self.application.id
        requests = [
            ("get", "/api/applications/admin", None),
            ("get", "/api/applications/admin/export", None),
            ("get", f"/api/applications/admin/{application_id}", None),
            ("post", f"/api/applications/admin/{application_id}/scores", {"kind": "DOC"}),
            ("patch", f"/api/applications/admin/{application_id}/doc-finalize", {"decision": "ACCEPTED"}),
            ("patch", f"/api/applications/admin/{application_id}/finalize", {"decision": "ACCEPTED"}),
        ]
        for method, path, body in requests:
            with self.subTest(path=path):
                response = getattr(self.client, method)(path, body, format="json")
                self.assertIn(response.status_code, expected)

    def setUp(self):
        super().setUp()
        self.application = make_application(self.applicant)

    def test_anonymous_user_is_blocked(self):
        self.assert_admin_api_status((401, 403))

    def test_applicant_is_blocked(self):
        self.as_user(self.applicant)
        self.assert_admin_api_status((403,))

    def test_student_is_blocked(self):
        self.as_user(make_user("student", role="STUDENT"))
        self.assert_admin_api_status((403,))

    def test_blocked_users_change_nothing(self):
        self.as_user(self.applicant)
        self.assert_admin_api_status((403,))

        self.application.refresh_from_db()
        self.assertEqual(self.application.doc_decision, "PENDING")
        self.assertFalse(ApplicationScore.objects.exists())


class ScoringTests(ApplicationApiTestCase):
    def setUp(self):
        super().setUp()
        self.application = make_application(self.applicant)
        self.url = f"/api/applications/admin/{self.application.id}/scores"
        self.as_user(self.instructor)

    def post_score(self, kind="DOC", score1=30, score2=20, score3=10):
        body = {"kind": kind, "score1": score1, "score2": score2, "score3": score3}
        return self.client.post(self.url, body, format="json")

    def test_same_reviewer_updates_existing_score(self):
        self.assertTrue(self.post_score(score1=30).json()["created"])
        self.assertFalse(self.post_score(score1=35).json()["created"])

        score = ApplicationScore.objects.get()
        self.assertEqual(score.score1, 35)
        self.assertEqual(score.total, 65)

    def test_reviewers_and_kinds_are_scored_separately(self):
        self.post_score(kind="DOC")
        self.post_score(kind="INTERVIEW")
        self.as_user(make_user("reviewer2", role="INSTRUCTOR"))
        self.post_score(kind="DOC")

        self.assertEqual(ApplicationScore.objects.count(), 3)

    def test_scores_over_item_limit_are_rejected(self):
        over_limits = ({"score1": 41}, {"score2": 31}, {"score3": 21})
        for over_limit in over_limits:
            with self.subTest(**over_limit):
                self.assertEqual(self.post_score(**over_limit).status_code, 400)

        self.assertFalse(ApplicationScore.objects.exists())


class FinalizeTests(ApplicationApiTestCase):
    def setUp(self):
        super().setUp()
        self.as_user(self.instructor)

    def finalize_doc(self, application, decision="ACCEPTED"):
        url = f"/api/applications/admin/{application.id}/doc-finalize"
        return self.client.patch(url, {"decision": decision}, format="json")

    def finalize(self, application, decision="ACCEPTED"):
        url = f"/api/applications/admin/{application.id}/finalize"
        return self.client.patch(url, {"decision": decision}, format="json")

    def test_final_decision_requires_accepted_document(self):
        for doc_decision in ("PENDING", "REJECTED"):
            with self.subTest(doc_decision=doc_decision):
                user = make_user(f"doc-{doc_decision.lower()}")
                application = make_application(user, doc_decision=doc_decision)

                self.assertEqual(self.finalize(application).status_code, 400)

                application.refresh_from_db()
                user.refresh_from_db()
                self.assertEqual(application.final_decision, "PENDING")
                self.assertEqual(user.role, "APPLICANT")

    def test_doc_decision_cannot_be_changed_once_finalized(self):
        application = make_application(self.applicant)

        self.assertEqual(self.finalize_doc(application).status_code, 200)
        self.assertEqual(self.finalize_doc(application, "REJECTED").status_code, 400)

        application.refresh_from_db()
        self.assertEqual(application.doc_decision, "ACCEPTED")

    def test_final_decision_cannot_be_changed_once_finalized(self):
        application = make_application(self.applicant, doc_decision="ACCEPTED")

        self.assertEqual(self.finalize(application, "REJECTED").status_code, 200)
        self.assertEqual(self.finalize(application, "ACCEPTED").status_code, 400)

        self.applicant.refresh_from_db()
        self.assertEqual(self.applicant.role, "APPLICANT")

    def test_accepted_applicant_becomes_student_on_education_track(self):
        expected_tracks = {
            "FRONTEND": "FULLSTACK",
            "BACKEND": "FULLSTACK",
            "AI_SERVER": "AI_SERVER",
            "PLANNING_DESIGN": "PLANNING_DESIGN",
        }
        for track, education_track in expected_tracks.items():
            with self.subTest(track=track):
                user = make_user(f"accepted-{track.lower()}")
                application = make_application(user, track=track, doc_decision="ACCEPTED")

                self.assertEqual(self.finalize(application).status_code, 200)

                user.refresh_from_db()
                self.assertEqual(user.role, "STUDENT")
                self.assertEqual(user.education_track, education_track)

    def test_rejected_applicant_keeps_role(self):
        application = make_application(self.applicant, doc_decision="ACCEPTED")

        self.assertEqual(self.finalize(application, "REJECTED").status_code, 200)

        self.applicant.refresh_from_db()
        self.assertEqual(self.applicant.role, "APPLICANT")
        self.assertIsNone(self.applicant.education_track)


class ResultVisibilityTests(ApplicationApiTestCase):
    def setUp(self):
        super().setUp()
        self.application = Application.objects.create(
            user=self.applicant,
            status="SUBMITTED",
            doc_decision="ACCEPTED",
            final_decision="REJECTED",
        )
        self.settings = ResultNotificationSettings.get_settings()
        self.as_user(self.applicant)

    def my_result(self):
        return self.client.get("/api/applications/results/my").json()["result"]

    def open_results(self, doc=False, final=False):
        self.settings.doc_result_open = doc
        self.settings.final_result_open = final
        self.settings.save()

    def test_results_stay_pending_until_opened(self):
        self.open_results()

        result = self.my_result()
        self.assertEqual(result["doc_decision"], "PENDING")
        self.assertEqual(result["final_decision"], "PENDING")

    def test_doc_and_final_results_open_separately(self):
        self.open_results(doc=True)

        result = self.my_result()
        self.assertEqual(result["doc_decision"], "ACCEPTED")
        self.assertEqual(result["final_decision"], "PENDING")

    def test_opened_final_result_is_visible(self):
        self.open_results(doc=True, final=True)

        self.assertEqual(self.my_result()["final_decision"], "REJECTED")

    def test_personal_interview_schedule_overrides_default(self):
        self.application.personal_interview_location = "개별 면접 장소"
        self.application.save()

        self.assertEqual(self.my_result()["interview_location"], "개별 면접 장소")
