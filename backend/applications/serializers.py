from rest_framework import serializers
from .models import Application, ApplicationScore, ResultNotificationSettings


# ✅ (views.py에서 import 하는 serializer)
class ApplicationFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            "track", 
            "one_liner", 
            "portfolio_url", 
            # 공통 질문
            "motivation",
            "common_growth_experience",
            "common_time_management",
            "common_teamwork",
            # 기획/디자인
            "planning_experience",
            "planning_idea",
            # AI
            "ai_programming_level",
            "ai_service_impression",
            # 백엔드
            "backend_web_process",
            "backend_code_quality",
            # 프론트엔드
            "frontend_ui_experience",
            "frontend_design_implementation",
            # 기타
            "experience",
        ]


# ✅ 내 지원서 조회 응답
class MyApplicationSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Application.STATUS_CHOICES)
    application = ApplicationFormSerializer(allow_null=True)
    draft = ApplicationFormSerializer(allow_null=True)


class ApplicationScoreSerializer(serializers.ModelSerializer):
    reviewer = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationScore
        fields = [
            "id",
            "kind",
            "score1", "score2", "score3",
            "total",
            "comment",
            "created_at", "updated_at",
            "reviewer",
        ]

    def get_total(self, obj):
        return obj.total

    def get_reviewer(self, obj):
        u = obj.reviewer
        return {
            "id": u.id,
            "name": getattr(u, "name", ""),
            "email": getattr(u, "email", ""),
        }


class AdminApplicationSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    # ✅ ListView annotate 값들
    doc_avg = serializers.FloatField(required=False, allow_null=True)
    interview_avg = serializers.FloatField(required=False, allow_null=True)
    total_avg = serializers.FloatField(required=False, allow_null=True)

    doc_count = serializers.IntegerField(required=False, allow_null=True)
    interview_count = serializers.IntegerField(required=False, allow_null=True)

    # ✅ 점수 목록
    doc_scores = serializers.SerializerMethodField()
    interview_scores = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id", "status", "submitted_at",
            "track", "one_liner", "portfolio_url", 
            # 공통 질문
            "motivation", "common_growth_experience", "common_time_management", "common_teamwork",
            # 기획/디자인
            "planning_experience", "planning_idea",
            # AI
            "ai_programming_level", "ai_service_impression",
            # 백엔드
            "backend_web_process", "backend_code_quality",
            # 프론트엔드
            "frontend_ui_experience", "frontend_design_implementation",
            # 기타
            "experience",
            "created_at", "updated_at",

            # ✅ 확정 결과(서류/최종)
            "doc_decision", "doc_finalized_at",
            "final_decision", "finalized_at",

            # ✅ 개별 면접 일정
            "personal_interview_datetime", "personal_interview_location",

            # ✅ 평균/카운트
            "doc_avg", "interview_avg", "total_avg",
            "doc_count", "interview_count",

            "doc_scores", "interview_scores",
            "user",
        ]

    def get_user(self, obj):
        u = obj.user
        return {
            "id": u.id,
            "email": u.email,
            "name": getattr(u, "name", ""),
            "student_id": getattr(u, "student_id", ""),
            "department": getattr(u, "department", ""),
            "phone": getattr(u, "phone", ""),
            "role": getattr(u, "role", ""),
            "email_verified": getattr(u, "email_verified", False),
            "education_track": getattr(u, "education_track", None),
        }

    def get_doc_scores(self, obj):
        qs = getattr(obj, "_prefetched_scores", None)
        if qs is None:
            qs = obj.scores.select_related("reviewer").all()
        doc = [s for s in qs if s.kind == "DOC"]
        return ApplicationScoreSerializer(doc, many=True).data

    def get_interview_scores(self, obj):
        qs = getattr(obj, "_prefetched_scores", None)
        if qs is None:
            qs = obj.scores.select_related("reviewer").all()
        iv = [s for s in qs if s.kind == "INTERVIEW"]
        return ApplicationScoreSerializer(iv, many=True).data


class AdminApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ["status"]

    def validate_status(self, value):
        allowed = {"ACCEPTED", "REJECTED"}
        if value not in allowed:
            raise serializers.ValidationError(f"status must be one of {sorted(list(allowed))}")
        return value


class ApplicationScoreUpsertSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=["DOC", "INTERVIEW"])
    score1 = serializers.IntegerField(min_value=0, max_value=100, required=False, default=0)
    score2 = serializers.IntegerField(min_value=0, max_value=100, required=False, default=0)
    score3 = serializers.IntegerField(min_value=0, max_value=100, required=False, default=0)
    comment = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        kind = attrs.get("kind")
        if kind in ("DOC", "INTERVIEW"):
            if attrs.get("score1", 0) > 40:
                raise serializers.ValidationError({"score1": ["score1 max is 40"]})
            if attrs.get("score2", 0) > 30:
                raise serializers.ValidationError({"score2": ["score2 max is 30"]})
            if attrs.get("score3", 0) > 20:
                raise serializers.ValidationError({"score3": ["score3 max is 20"]})
        return attrs


# ✅ 서류/최종 확정 요청용
class AdminDecisionFinalizeSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["ACCEPTED", "REJECTED"])


# ✅ 개별 면접 일정 설정 Serializer
class PersonalInterviewScheduleSerializer(serializers.Serializer):
    personal_interview_datetime = serializers.CharField(required=False, allow_blank=True, default="")
    personal_interview_location = serializers.CharField(required=False, allow_blank=True, default="")


# ✅ 합격 알림 설정 Serializer
class ResultNotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultNotificationSettings
        fields = [
            "interview_location",
            "interview_date",
            "interview_deadline",
            "ot_datetime",
            "doc_result_open",
            "final_result_open",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]