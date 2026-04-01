from rest_framework import serializers
from .models import (
    Quiz, QuizAnswer, QnAPost, QnAComment,
    Assignment, AssignmentSubmission, Announcement,
    AttendanceSession, AttendanceRecord,
    StudentGroup, ClassReview,
    HomeworkCategory, HomeworkSubmission,
)


# ── Quiz ──────────────────────────────────

class QuizListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    my_answer = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            "id", "track", "title", "question",
            "option_1", "option_2", "option_3", "option_4", "option_5",
            "created_by_name", "created_at", "my_answer",
        ]

    def get_my_answer(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if not user or not user.is_authenticated:
            return None
        ans = obj.answers.filter(student=user).first()
        if not ans:
            return None
        return {"selected_option": ans.selected_option, "is_correct": ans.is_correct}


class QuizDetailSerializer(QuizListSerializer):
    """INSTRUCTOR용: correct_option 포함"""
    class Meta(QuizListSerializer.Meta):
        fields = QuizListSerializer.Meta.fields + ["correct_option"]


class QuizCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = [
            "track", "title", "question",
            "option_1", "option_2", "option_3", "option_4", "option_5",
            "correct_option",
        ]


class QuizAnswerSerializer(serializers.Serializer):
    selected_option = serializers.IntegerField(min_value=1, max_value=5)


# ── Q&A ───────────────────────────────────

class QnACommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", read_only=True)
    author_role = serializers.CharField(source="author.role", read_only=True)

    class Meta:
        model = QnAComment
        fields = ["id", "author_name", "author_role", "content", "created_at"]


class QnAPostListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", read_only=True)
    comment_count = serializers.IntegerField(source="comments.count", read_only=True)

    class Meta:
        model = QnAPost
        fields = ["id", "track", "title", "author_name", "comment_count", "created_at"]


class QnAPostDetailSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", read_only=True)
    comments = QnACommentSerializer(many=True, read_only=True)

    class Meta:
        model = QnAPost
        fields = ["id", "track", "title", "content", "author_name", "comments", "created_at"]


class QnAPostCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QnAPost
        fields = ["track", "title", "content"]


class QnACommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QnAComment
        fields = ["content"]


# ── Assignment ────────────────────────────

class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    read_by_name = serializers.CharField(source="read_by.name", read_only=True, default=None)

    class Meta:
        model = AssignmentSubmission
        fields = [
            "id", "student_name", "link", "submitted_at",
            "is_read", "read_at", "read_by_name",
        ]


class AssignmentListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    my_submission = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            "id", "track", "title", "content", "deadline",
            "created_by_name", "created_at", "my_submission",
        ]

    def get_my_submission(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if not user or not user.is_authenticated:
            return None
        sub = obj.submissions.filter(student=user).first()
        if not sub:
            return None
        return SubmissionSerializer(sub).data


class AssignmentDetailSerializer(AssignmentListSerializer):
    submissions = serializers.SerializerMethodField()

    class Meta(AssignmentListSerializer.Meta):
        fields = AssignmentListSerializer.Meta.fields + ["submissions"]

    def get_submissions(self, obj):
        user = self.context["request"].user
        if user.role == "INSTRUCTOR" or user.is_staff:
            return SubmissionSerializer(obj.submissions.all(), many=True).data
        # STUDENT: 본인 제출만
        return SubmissionSerializer(
            obj.submissions.filter(student=user), many=True
        ).data


class AssignmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ["track", "title", "content", "deadline"]


class SubmissionCreateSerializer(serializers.Serializer):
    link = serializers.URLField(max_length=500)


# ── Announcement ──────────────────────────

class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", read_only=True)

    class Meta:
        model = Announcement
        fields = ["id", "track", "title", "content", "author_name", "created_at"]


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ["track", "title", "content"]


# ── Attendance ─────────────────────────────

class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_id = serializers.IntegerField(source="student.id", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = ["id", "student_id", "student_name", "status", "marked_at"]


class AttendanceSessionListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)

    class Meta:
        model = AttendanceSession
        fields = ["id", "track", "title", "date", "created_by_name", "created_at"]


class AttendanceSessionDetailSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    records = AttendanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = AttendanceSession
        fields = ["id", "track", "title", "date", "created_by_name", "created_at", "records"]


class AttendanceSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSession
        fields = ["track", "title", "date"]


class AttendanceMarkSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    status = serializers.ChoiceField(choices=["PRESENT", "ABSENT", "LATE"])


# ── StudentGroup ────────────────────────────

class GroupMemberSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.CharField()


class StudentGroupSerializer(serializers.ModelSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = StudentGroup
        fields = ["id", "track", "name", "members", "member_count", "created_by_name", "created_at"]

    def get_member_count(self, obj):
        return obj.members.count()


class StudentGroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGroup
        fields = ["track", "name"]


class StudentGroupMembersSerializer(serializers.Serializer):
    member_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)


# ── ClassReview ────────────────────────────

class ClassReviewSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", read_only=True)

    class Meta:
        model = ClassReview
        fields = ["id", "author_id", "author_name", "track", "content", "created_at", "updated_at"]


class ClassReviewWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassReview
        fields = ["track", "content"]


# ── HomeworkCategory / HomeworkSubmission ──────────────

class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.name", read_only=True)
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = HomeworkSubmission
        fields = ["id", "student_id", "student_name", "pdf_url", "submitted_at"]

    def get_pdf_url(self, obj):
        request = self.context.get("request")
        if request and obj.pdf_file:
            return request.build_absolute_uri(obj.pdf_file.url)
        return obj.pdf_file.url if obj.pdf_file else None


class HomeworkCategorySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    submissions = serializers.SerializerMethodField()
    my_submission = serializers.SerializerMethodField()
    submission_count = serializers.IntegerField(source="submissions.count", read_only=True)

    class Meta:
        model = HomeworkCategory
        fields = [
            "id", "track", "title", "week",
            "created_by_name", "created_at",
            "submission_count", "submissions", "my_submission",
        ]

    def get_submissions(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if user and (user.role == "INSTRUCTOR" or user.is_staff):
            return HomeworkSubmissionSerializer(
                obj.submissions.all(), many=True, context=self.context
            ).data
        return []

    def get_my_submission(self, obj):
        user = self.context.get("request") and self.context["request"].user
        if not user or not user.is_authenticated:
            return None
        sub = obj.submissions.filter(student=user).first()
        if not sub:
            return None
        return HomeworkSubmissionSerializer(sub, context=self.context).data


class HomeworkCategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkCategory
        fields = ["track", "title", "week"]
