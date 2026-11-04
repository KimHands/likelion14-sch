import json
import re
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import Client, TestCase
from django.utils import timezone

from .models import EmailVerification

User = get_user_model()

EMAIL = "new@sch.ac.kr"
PASSWORD = "demo-pass-1234"


class AuthApiTestCase(TestCase):
    def post(self, path, **body):
        return self.client.post(path, json.dumps(body), content_type="application/json")

    def send_code(self, path="/api/auth/email/send-code", email=EMAIL):
        response = self.post(path, email=email)
        self.assertEqual(response.status_code, 200)
        return re.search(r"\d{6}", mail.outbox[-1].body).group()

    def verify(self, code, email=EMAIL):
        return self.post("/api/auth/email/verify", email=email, code=code)

    def signup(self, email=EMAIL):
        return self.post(
            "/api/auth/signup",
            email=email,
            password=PASSWORD,
            name="테스트",
            student_id="20260001",
            department="컴퓨터소프트웨어공학과",
        )

    def login(self, password=PASSWORD, email=EMAIL):
        return self.post("/api/auth/login", email=email, password=password)


class SignupTests(AuthApiTestCase):
    def test_verified_email_can_sign_up_and_log_in(self):
        self.verify(self.send_code())

        self.assertEqual(self.signup().status_code, 200)
        self.assertEqual(self.login().status_code, 200)

        me = self.client.get("/api/auth/me").json()
        self.assertEqual(me["email"], EMAIL)
        self.assertEqual(me["role"], "APPLICANT")
        self.assertTrue(me["email_verified"])

    def test_non_school_email_is_rejected(self):
        response = self.post("/api/auth/email/send-code", email="new@gmail.com")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "SCHOOL_EMAIL_REQUIRED")
        self.assertEqual(len(mail.outbox), 0)

    def test_code_is_not_stored_in_plain_text(self):
        code = self.send_code()

        self.assertNotEqual(EmailVerification.objects.get(email=EMAIL).code_hash, code)

    def test_wrong_code_does_not_verify(self):
        code = self.send_code()
        wrong_code = "000000" if code != "000000" else "111111"

        self.assertEqual(self.verify(wrong_code).status_code, 400)
        self.assertEqual(self.signup().status_code, 403)

    def test_expired_code_does_not_verify(self):
        code = self.send_code()
        EmailVerification.objects.filter(email=EMAIL).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )

        self.assertEqual(self.verify(code).status_code, 400)

    def test_signup_requires_verification(self):
        response = self.signup()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"], "EMAIL_NOT_VERIFIED")
        self.assertFalse(User.objects.filter(email=EMAIL).exists())

    def test_signup_window_closes_after_ten_minutes(self):
        self.verify(self.send_code())
        EmailVerification.objects.filter(email=EMAIL).update(
            verified_at=timezone.now() - timedelta(minutes=11)
        )

        response = self.signup()

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"], "EMAIL_VERIFICATION_EXPIRED")

    def test_duplicate_email_is_rejected(self):
        self.verify(self.send_code())
        self.signup()

        self.assertEqual(self.signup().status_code, 409)


class LoginTests(AuthApiTestCase):
    def setUp(self):
        User.objects.create_user(email=EMAIL, password=PASSWORD, email_verified=True)

    def test_wrong_password_is_rejected(self):
        self.assertEqual(self.login(password="wrong-password").status_code, 401)
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_logout_ends_session(self):
        self.login()
        self.post("/api/auth/logout")

        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)

    def test_login_requires_csrf_token(self):
        self.client = Client(enforce_csrf_checks=True)

        self.assertEqual(self.login().status_code, 403)

    def test_login_succeeds_with_csrf_token(self):
        self.client = Client(enforce_csrf_checks=True)
        self.client.get("/api/auth/csrf")
        token = self.client.cookies["csrftoken"].value

        response = self.client.post(
            "/api/auth/login",
            json.dumps({"email": EMAIL, "password": PASSWORD}),
            content_type="application/json",
            headers={"X-CSRFToken": token},
        )

        self.assertEqual(response.status_code, 200)


class PasswordResetTests(AuthApiTestCase):
    NEW_PASSWORD = "changed-pass-5678"

    def setUp(self):
        User.objects.create_user(email=EMAIL, password=PASSWORD, email_verified=True)

    def reset(self):
        return self.post("/api/auth/password/reset", email=EMAIL, password=self.NEW_PASSWORD)

    def test_verified_user_can_reset_password(self):
        self.verify(self.send_code("/api/auth/password/send-code"))

        self.assertEqual(self.reset().status_code, 200)
        self.assertEqual(self.login(password=PASSWORD).status_code, 401)
        self.assertEqual(self.login(password=self.NEW_PASSWORD).status_code, 200)

    def test_reset_requires_verification(self):
        self.assertEqual(self.reset().status_code, 403)
        self.assertEqual(self.login().status_code, 200)

    def test_unknown_email_gets_same_response_without_mail(self):
        response = self.post("/api/auth/password/send-code", email="nobody@sch.ac.kr")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
