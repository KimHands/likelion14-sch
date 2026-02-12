from rest_framework import serializers
from .models import (
    Quiz, QuizAnswer, QnAPost, QnAComment,
    Assignment, AssignmentSubmission, Announcement,
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
