from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import Application
from .serializers import ApplicationFormSerializer


def get_or_create_app(user):
    app, _ = Application.objects.get_or_create(user=user)
    return app


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_application(request):
    app = get_or_create_app(request.user)

    # 제출본/드래프트 분리해 보여주기:
    # - 제출/처리 상태면 application으로 내려주고 draft는 null
    # - DRAFT면 draft로 내려주고 application은 null (혹은 동일하게 내려줘도 되지만 프론트 혼동 방지)
    form = ApplicationFormSerializer(app).data

    if app.status == "DRAFT":
        return Response(
            {"status": app.status, "application": None, "draft": form},
            status=200,
        )
    else:
        return Response(
            {"status": app.status, "application": form, "draft": None},
            status=200,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def save_draft(request):
    app = get_or_create_app(request.user)

    if app.lock():
        return Response({"ok": False, "error": "LOCKED"}, status=drf_status.HTTP_409_CONFLICT)

    ser = ApplicationFormSerializer(app, data=request.data, partial=True)
    if not ser.is_valid():
        return Response({"ok": False, "errors": ser.errors}, status=drf_status.HTTP_400_BAD_REQUEST)

    ser.save(status="DRAFT")  # draft 저장 유지
    return Response({"ok": True}, status=200)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_application(request):
    app = get_or_create_app(request.user)

    if app.lock():
        return Response({"ok": False, "error": "LOCKED"}, status=drf_status.HTTP_409_CONFLICT)

    ser = ApplicationFormSerializer(app, data=request.data)
    if not ser.is_valid():
        return Response({"ok": False, "errors": ser.errors}, status=drf_status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        ser.save()
        app.mark_submitted()
        app.save(update_fields=["status", "submitted_at", "updated_at"])

    return Response({"ok": True, "status": app.status}, status=200)

