from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models


def validate_file_size_5mb(value):
    if value.size > 5 * 1024 * 1024:
        from django.core.exceptions import ValidationError
        raise ValidationError("파일 크기는 5MB 이하여야 합니다.")


def validate_file_size_20mb(value):
    if value.size > 20 * 1024 * 1024:
        from django.core.exceptions import ValidationError
        raise ValidationError("파일 크기는 20MB 이하여야 합니다.")


class Project(models.Model):
    title = models.CharField(max_length=200)
    generation = models.PositiveSmallIntegerField(help_text="기수 (예: 13)")
    description = models.TextField(blank=True, help_text="한 줄소개")
    detail = models.TextField(blank=True, help_text="서비스 상세 설명")
    tech_stack = models.CharField(max_length=500, blank=True, help_text="쉼표 구분 기술 스택")
    github_url = models.URLField(blank=True)
    team_members = models.CharField(max_length=500, blank=True, help_text="쉼표 구분 팀원")
    thumbnail = models.ImageField(
        upload_to="projects/thumbnails/",
        validators=[
            FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp", "gif"]),
            validate_file_size_5mb,
        ],
    )
    pdf_file = models.FileField(
        upload_to="projects/pdfs/",
        validators=[
            FileExtensionValidator(allowed_extensions=["pdf"]),
            validate_file_size_20mb,
        ],
    )
    order = models.PositiveIntegerField(default=0)
    is_visible = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return f"[{self.generation}기] {self.title}"
