import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import ClassReview, HomeworkCategory, HomeworkSubmission

User = get_user_model()

TEMP_MEDIA_ROOT = tempfile.mkdtemp()


def make_student(email):
    return User.objects.create_user(
        email=f"{email}@sch.ac.kr",
        password="demo-pass-1234",
        role="STUDENT",
        email_verified=True,
        education_track="FULLSTACK",
    )


def upload(name="homework.pdf", content_type="application/pdf"):
    return SimpleUploadedFile(name, b"%PDF-1.4 demo", content_type=content_type)


@override_settings(MEDIA_ROOT=TEMP_MEDIA_ROOT)
class HomeworkUploadTests(APITestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        cache.clear()  # DRF throttle 카운터가 테스트 사이에 이어지지 않게 한다
        self.student = make_student("student")
        self.category = HomeworkCategory.objects.create(
            title="1주차 과제", week=1, created_by=self.student
        )
        self.url = f"/api/sessions/homework-categories/{self.category.id}/submit/"
        self.client.force_authenticate(self.student)

    def submit(self, pdf_file):
        return self.client.post(self.url, {"pdf_file": pdf_file}, format="multipart")

    def test_pdf_is_saved(self):
        response = self.submit(upload())

        self.assertEqual(response.status_code, 201)
        self.assertEqual(HomeworkSubmission.objects.get().student, self.student)

    def test_resubmission_replaces_previous_entry(self):
        self.submit(upload())

        self.assertEqual(self.submit(upload()).status_code, 200)
        self.assertEqual(HomeworkSubmission.objects.count(), 1)

    def test_non_pdf_is_rejected(self):
        invalid_uploads = (
            upload(name="homework.exe"),
            upload(content_type="text/plain"),
        )
        for invalid_upload in invalid_uploads:
            with self.subTest(name=invalid_upload.name):
                self.assertEqual(self.submit(invalid_upload).status_code, 400)

        self.assertFalse(HomeworkSubmission.objects.exists())

    def test_login_is_required(self):
        self.client.force_authenticate(None)

        self.assertIn(self.submit(upload()).status_code, (401, 403))

    def test_only_owner_can_delete_submission(self):
        submission_id = self.submit(upload()).json()["id"]
        url = f"/api/sessions/homework-submissions/{submission_id}/"

        self.client.force_authenticate(make_student("other"))
        self.assertEqual(self.client.delete(url).status_code, 403)

        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(HomeworkSubmission.objects.exists())

    def test_only_students_on_the_track_can_submit(self):
        users = {
            "applicant": User.objects.create_user(
                email="applicant@sch.ac.kr", password="demo-pass-1234", role="APPLICANT"
            ),
            "instructor": User.objects.create_user(
                email="instructor@sch.ac.kr", password="demo-pass-1234", role="INSTRUCTOR"
            ),
            "other_track": User.objects.create_user(
                email="ai@sch.ac.kr",
                password="demo-pass-1234",
                role="STUDENT",
                education_track="AI_SERVER",
            ),
        }
        for label, user in users.items():
            with self.subTest(label):
                self.client.force_authenticate(user)
                self.assertEqual(self.submit(upload()).status_code, 403)

        self.assertFalse(HomeworkSubmission.objects.exists())


class ClassReviewPrivacyTests(APITestCase):
    URL = "/api/sessions/class-reviews/"

    def setUp(self):
        cache.clear()  # DRF throttle 카운터가 테스트 사이에 이어지지 않게 한다
        self.author = make_student("author")
        self.reader = make_student("reader")
        self.instructor = User.objects.create_user(
            email="instructor@sch.ac.kr", password="demo-pass-1234", role="INSTRUCTOR"
        )
        self.review = ClassReview.objects.create(
            author=self.author, track="FULLSTACK", content="데모 감상평"
        )

    def listed_review(self, user):
        self.client.force_authenticate(user)
        return self.client.get(self.URL, {"track": "FULLSTACK"}).json()[0]

    def test_students_do_not_receive_author_identity(self):
        for user in (self.reader, self.author):
            with self.subTest(user=user.email):
                review = self.listed_review(user)
                self.assertNotIn("author_id", review)
                self.assertNotIn("author_name", review)

    def test_is_mine_marks_only_own_review(self):
        self.assertTrue(self.listed_review(self.author)["is_mine"])
        self.assertFalse(self.listed_review(self.reader)["is_mine"])

    def test_created_and_my_reviews_do_not_expose_author_identity(self):
        self.client.force_authenticate(self.author)
        created = self.client.post(
            self.URL, {"track": "FULLSTACK", "content": "새 감상평"}, format="json"
        ).json()
        mine = self.client.get(f"{self.URL}my/").json()[0]

        for review in (created, mine):
            self.assertNotIn("author_name", review)
            self.assertTrue(review["is_mine"])

    def test_instructor_can_see_author(self):
        self.assertEqual(self.listed_review(self.instructor)["author_id"], self.author.id)
