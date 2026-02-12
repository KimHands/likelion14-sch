from django.contrib import admin
from .models import (
    Quiz, QuizAnswer, QnAPost, QnAComment,
    Assignment, AssignmentSubmission, Announcement,
)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("title", "track", "created_by", "created_at")
    list_filter = ("track",)


@admin.register(QuizAnswer)
class QuizAnswerAdmin(admin.ModelAdmin):
    list_display = ("quiz", "student", "selected_option", "is_correct", "created_at")
    list_filter = ("is_correct",)


@admin.register(QnAPost)
class QnAPostAdmin(admin.ModelAdmin):
    list_display = ("title", "track", "author", "created_at")
    list_filter = ("track",)


@admin.register(QnAComment)
class QnACommentAdmin(admin.ModelAdmin):
    list_display = ("post", "author", "created_at")


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ("title", "track", "deadline", "created_by", "created_at")
    list_filter = ("track",)


@admin.register(AssignmentSubmission)
class AssignmentSubmissionAdmin(admin.ModelAdmin):
    list_display = ("assignment", "student", "submitted_at", "is_read")
    list_filter = ("is_read",)


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "track", "author", "created_at")
    list_filter = ("track",)
