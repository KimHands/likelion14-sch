from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated

from .models import Application, ResultNotificationSettings


def _decision_or_pending(app, field_name: str) -> str:
    """
    ✅ Application에 필드가 있으면 그 값을 쓰고,
    없으면 PENDING으로 처리(방어 코드)
    """
    v = getattr(app, field_name, None)
    if v in ("PENDING", "ACCEPTED", "REJECTED"):
        return v
    return "PENDING"


class MyResultView(APIView):
    """
    GET /api/results/my
    로그인한 사용자의 합불 결과 모달용 데이터 반환
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        app = Application.objects.select_related("user").filter(user=user).first()
        if not app:
            # 지원서가 없으면 모달 띄울 근거가 없으니 ok:true + null
            return Response({"ok": True, "result": None}, status=200)

        u = app.user

        # ✅ 결정 값 (없으면 PENDING)
        doc_decision = _decision_or_pending(app, "doc_decision")
        final_decision = _decision_or_pending(app, "final_decision")

        # ✅ 데이터베이스에서 설정 가져오기
        settings = ResultNotificationSettings.get_settings()
        
        result = {
            "name": getattr(u, "name", "") or "-",
            "student_id": getattr(u, "student_id", "") or "-",
            "department": getattr(u, "department", "") or "-",
            "track": app.track,

            "doc_decision": doc_decision,
            "final_decision": final_decision,

            # ✅ DB에서 가져온 안내 정보 (개별 설정 있으면 우선, 없으면 전역 설정 사용)
            "interview_location": app.personal_interview_location or settings.interview_location,
            "interview_date": app.personal_interview_datetime or settings.interview_date,
            "interview_deadline": settings.interview_deadline,
            "ot_datetime": settings.ot_datetime,
        }

        return Response({"ok": True, "result": result}, status=200)