from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


TRACK_FS = [("FULLSTACK", "풀스택")]
TRACK_AP = [("AI_SERVER", "AI"), ("PLANNING_DESIGN", "기획/디자인")]
TRACK_ALL = TRACK_FS + TRACK_AP


# ──────────────────────────────────────────
# 그룹 A: 풀스택 트랙
# ──────────────────────────────────────────

class Quiz(models.Model):
    track = models.CharField(max_length=30, choices=TRACK_FS)
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
    track = models.CharField(max_length=30, choices=TRACK_FS)
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


# ──────────────────────────────────────────
# 출석부
# ──────────────────────────────────────────

class AttendanceSession(models.Model):
    """교육 세션별 출석부 (트랙별 관리)"""
    track = models.CharField(max_length=30, choices=TRACK_ALL)
    title = models.CharField(max_length=200)
    date = models.DateField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendance_sessions"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"[{self.track}] {self.title} ({self.date})"


class AttendanceRecord(models.Model):
    """개별 출석 기록"""
    ATTENDANCE_CHOICES = [
        ("PRESENT", "출석"),
        ("ABSENT", "결석"),
        ("LATE", "지각"),
    ]

    session = models.ForeignKey(
        AttendanceSession, on_delete=models.CASCADE, related_name="records"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendance_records"
    )
    status = models.CharField(max_length=10, choices=ATTENDANCE_CHOICES, default="ABSENT")
    marked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marked_attendances",
    )
    marked_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("session", "student")
        ordering = ["student__name"]

    def __str__(self):
        return f"{self.student.name} - {self.session.title} ({self.status})"


# ──────────────────────────────────────────
# 학생 그룹
# ──────────────────────────────────────────

class StudentGroup(models.Model):
    """트랙별 학생 그룹"""
    track = models.CharField(max_length=30, choices=TRACK_ALL)
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="student_groups",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_groups",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"[{self.track}] {self.name}"


# ──────────────────────────────────────────
# 수업 감상평 (학생이 수업 후 작성)
# ──────────────────────────────────────────

class ClassReview(models.Model):
    """학생이 수업을 듣고 작성하는 감상 및 후기"""
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="class_reviews",
    )
    track = models.CharField(max_length=30, choices=TRACK_ALL)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.track}] {self.author.name}의 감상평"


# ──────────────────────────────────────────
# 과제 갤러리 (풀스택 트랙 PDF 제출)
# ──────────────────────────────────────────

class HomeworkCategory(models.Model):
    """관리자가 생성하는 주차별 과제 카테고리"""
    track = models.CharField(max_length=30, choices=TRACK_FS, default="FULLSTACK")
    title = models.CharField(max_length=200)
    week = models.PositiveSmallIntegerField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="homework_categories"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["week", "-created_at"]

    def __str__(self):
        return f"[{self.track}] {self.week}주차 - {self.title}"


def homework_pdf_upload_path(instance, filename):
    return f"homework/{instance.category.track}/{instance.category.week}주차/{filename}"


class HomeworkSubmission(models.Model):
    """학생의 과제 PDF 제출물"""
    category = models.ForeignKey(
        HomeworkCategory, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="homework_submissions"
    )
    pdf_file = models.FileField(upload_to=homework_pdf_upload_path)
    submitted_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("category", "student")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.name} → {self.category}"
