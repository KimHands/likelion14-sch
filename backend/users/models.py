from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager


class EmailVerification(models.Model):
    email = models.EmailField(db_index=True)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    verified_at = models.DateTimeField(null=True, blank=True)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.email} (expires {self.expires_at})"


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("APPLICANT", "지원자"),
        ("STUDENT", "수강생"),
        ("INSTRUCTOR", "교육자"),
    ]

    # ✅ 교육 트랙(최종 합격 확정 시 반영)
    TRACK_CHOICES = [
        ("PLANNING_DESIGN", "기획/디자인"),
        ("FRONTEND", "프론트엔드"),
        ("BACKEND", "백엔드"),
        ("AI_SERVER", "AI"),
    ]

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=50)
    student_id = models.CharField(max_length=20)
    department = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="APPLICANT")
    email_verified = models.BooleanField(default=False)

    # ✅ 새 필드
    education_track = models.CharField(
        max_length=30,
        choices=TRACK_CHOICES,
        null=True,
        blank=True,
        default=None,
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email