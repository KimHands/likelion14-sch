from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


TRACK_FB = [("FRONTEND", "프론트엔드"), ("BACKEND", "백엔드")]
TRACK_AP = [("AI_SERVER", "AI"), ("PLANNING_DESIGN", "기획/디자인")]
TRACK_ALL = TRACK_FB + TRACK_AP


# ──────────────────────────────────────────
# 그룹 A: 프론트엔드 / 백엔드 트랙
# ──────────────────────────────────────────

class Quiz(models.Model):
    track = models.CharField(max_length=30, choices=TRACK_FB)
    title = models.CharField(max_length=200)
    question = models.TextField()
    option_1 = models.CharField(max_length=300)
    option_2 = models.CharField(max_length=300)
    option_3 = models.CharField(max_length=300)
    option_4 = models.CharField(max_length=300)
    option_5 = models.CharField(max_length=300)
    correct_option = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_quizzes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.track}] {self.title}"


class QuizAnswer(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="answers")
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="quiz_answers"
    )
    selected_option = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    is_correct = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("quiz", "student")

    def __str__(self):
        return f"{self.student} → Quiz#{self.quiz_id} ({'O' if self.is_correct else 'X'})"


class QnAPost(models.Model):
    track = models.CharField(max_length=30, choices=TRACK_FB)
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="qna_posts"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.track}] {self.title}"


class QnAComment(models.Model):
    post = models.ForeignKey(QnAPost, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="qna_comments"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author} on Post#{self.post_id}"


# ──────────────────────────────────────────
# 그룹 B: AI/서버, 기획/디자인 트랙
# ──────────────────────────────────────────

class Assignment(models.Model):
    track = models.CharField(max_length=30, choices=TRACK_AP)
    title = models.CharField(max_length=200)
    content = models.TextField()
    deadline = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_assignments"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.track}] {self.title}"


class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="assignment_submissions"
    )
    link = models.URLField(max_length=500)
    submitted_at = models.DateTimeField(auto_now=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    read_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="read_submissions",
    )

    class Meta:
        unique_together = ("assignment", "student")

    def __str__(self):
        return f"{self.student} → {self.assignment.title}"


class Announcement(models.Model):
    track = models.CharField(max_length=30, choices=TRACK_AP)
    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="announcements"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.track}] {self.title}"
