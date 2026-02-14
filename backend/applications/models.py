from django.db import models
from django.conf import settings
from django.utils import timezone


class Application(models.Model):
    STATUS_CHOICES = [
        ("DRAFT", "임시저장"),
        ("SUBMITTED", "제출완료"),
        ("ACCEPTED", "합격"),
        ("REJECTED", "불합격"),
    ]

    TRACK_CHOICES = [
        ("PLANNING_DESIGN", "기획/디자인"),
        ("FRONTEND", "프론트엔드"),
        ("BACKEND", "백엔드"),
        ("AI_SERVER", "AI"),
    ]

    # ✅ 서류/최종 확정 분리
    DECISION_CHOICES = [
        ("PENDING", "미확정"),
        ("ACCEPTED", "합격 확정"),
        ("REJECTED", "불합격 확정"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="DRAFT")
    submitted_at = models.DateTimeField(null=True, blank=True)

    track = models.CharField(max_length=30, choices=TRACK_CHOICES, default="PLANNING_DESIGN")
    one_liner = models.CharField(max_length=100, blank=True)
    portfolio_url = models.URLField(blank=True)
    
    # ✅ 공통 질문
    motivation = models.TextField(blank=True, verbose_name="자기소개 및 지원동기")
    common_growth_experience = models.TextField(blank=True, verbose_name="열정적으로 몽입했던 경험")
    common_time_management = models.TextField(blank=True, verbose_name="시간 관리 계획")
    common_teamwork = models.TextField(blank=True, verbose_name="팀 협업 경험")
    
    # ✅ 기획/디자인 개별 질문
    planning_experience = models.TextField(blank=True, verbose_name="기획/디자인 경험")
    planning_idea = models.TextField(blank=True, verbose_name="사회 문제 해결 아이디어")
    
    # ✅ AI 개별 질문
    ai_programming_level = models.TextField(blank=True, verbose_name="프로그래밍 학습 경험")
    ai_service_impression = models.TextField(blank=True, verbose_name="AI 서비스 인상")
    
    # ✅ 백엔드 개별 질문
    backend_web_process = models.TextField(blank=True, verbose_name="웹 동작 원리")
    backend_code_quality = models.TextField(blank=True, verbose_name="코드 품질 기준")
    
    # ✅ 프론트엔드 개별 질문
    frontend_ui_experience = models.TextField(blank=True, verbose_name="UI/UX 개선 아이디어")
    frontend_design_implementation = models.TextField(blank=True, verbose_name="디자인 구현 우선순위")
    
    # ✅ 기존 experience 필드는 호환성을 위해 유지
    experience = models.TextField(blank=True, verbose_name="기타 경험")

    # ✅ 서류 결과 확정
    doc_decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default="PENDING")
    doc_finalized_at = models.DateTimeField(null=True, blank=True)

    # ✅ 최종 결과 확정(면접 이후)
    final_decision = models.CharField(max_length=20, choices=DECISION_CHOICES, default="PENDING")
    finalized_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("user",)]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["track"]),
            models.Index(fields=["doc_decision"]),
            models.Index(fields=["final_decision"]),
        ]

    def lock(self):
        return self.status != "DRAFT"

    def mark_submitted(self):
        self.status = "SUBMITTED"
        self.submitted_at = timezone.now()

    def finalize_doc(self, decision: str):
        if self.doc_decision != "PENDING":
            return False
        if decision not in ("ACCEPTED", "REJECTED"):
            return False
        self.doc_decision = decision
        self.doc_finalized_at = timezone.now()
        return True

    def finalize_final(self, decision: str):
        if self.final_decision != "PENDING":
            return False
        if decision not in ("ACCEPTED", "REJECTED"):
            return False
        self.final_decision = decision
        self.finalized_at = timezone.now()
        return True

    def __str__(self):
        return f"{self.user.email} - {self.status}"


class ApplicationScore(models.Model):
    KIND_CHOICES = [
        ("DOC", "서류"),
        ("INTERVIEW", "면접"),
    ]

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="scores")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="application_scores")
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)

    score1 = models.PositiveSmallIntegerField(default=0)
    score2 = models.PositiveSmallIntegerField(default=0)
    score3 = models.PositiveSmallIntegerField(default=0)
    comment = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("application", "reviewer", "kind")]
        indexes = [
            models.Index(fields=["kind"]),
            models.Index(fields=["application", "kind"]),
        ]

    @property
    def total(self):
        return (self.score1 or 0) + (self.score2 or 0) + (self.score3 or 0)

    def __str__(self):
        return f"{self.application_id} {self.kind} by {self.reviewer_id}"


class ResultNotificationSettings(models.Model):
    """
    합격/불합격 알림에 표시되는 면접 및 OT 정보를 관리하는 싱글톤 모델
    """
    # 서류 합격자 안내용
    interview_location = models.CharField(
        max_length=200, 
        default="향설생활관 1관 RC218",
        verbose_name="면접 장소"
    )
    interview_date = models.CharField(
        max_length=100, 
        default="2026년 03월 05일",
        verbose_name="면접 일자"
    )
    interview_deadline = models.CharField(
        max_length=100, 
        default="18:00 까지",
        verbose_name="입실 시간"
    )

    # 최종 합격자 안내용
    ot_datetime = models.CharField(
        max_length=100, 
        default="2026년 03월 09일 18:00",
        verbose_name="OT 일시"
    )

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notification_updates",
        verbose_name="수정자"
    )

    class Meta:
        verbose_name = "합격 알림 설정"
        verbose_name_plural = "합격 알림 설정"

    def save(self, *args, **kwargs):
        # 싱글톤 패턴: 항상 ID=1인 레코드만 사용
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get_settings(cls):
        """설정 가져오기 (없으면 기본값으로 생성)"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "합격 알림 설정"