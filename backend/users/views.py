import json
import logging
import secrets
from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from django.views.decorators.csrf import ensure_csrf_cookie

from .models import EmailVerification

User = get_user_model()
logger = logging.getLogger(__name__)

EMAIL_CODE_EXPIRE_MINUTES = 2
EMAIL_VERIFICATION_VALID_MINUTES = 10  # ✅ 인증 성공 후 회원가입 가능 유효시간(10분)


def _json(request):
    try:
        return json.loads(request.body or "{}")
    except Exception:
        return {}


@require_http_methods(["POST"])
def email_send_code(request):
    """
    body: { "email": "xxx@sch.ac.kr" }
    return: { ok: true, expires_in: 120 }
    """
    data = _json(request)
    email = (data.get("email") or "").strip().lower()

    if not email:
        return JsonResponse({"ok": False, "error": "EMAIL_REQUIRED"}, status=400)

    # 학교 메일만 허용(원하면 삭제 가능)
    if not email.endswith("@sch.ac.kr"):
        return JsonResponse({"ok": False, "error": "SCHOOL_EMAIL_REQUIRED"}, status=400)

    # 이미 가입 + 이미 인증된 유저면 재발송 필요 없게
    user = User.objects.filter(email=email).first()
    if user and user.email_verified:
        return JsonResponse({"ok": True, "already_verified": True, "expires_in": 0})

    code = f"{secrets.randbelow(900000) + 100000}"
    expires_at = timezone.now() + timedelta(minutes=EMAIL_CODE_EXPIRE_MINUTES)

    # 이전 인증코드 삭제 (코드 재사용 방지)
    EmailVerification.objects.filter(email=email, verified_at__isnull=True).delete()

    EmailVerification.objects.create(
        email=email,
        code_hash=make_password(code),
        expires_at=expires_at,
    )

    send_mail(
        subject="[LIKELION] 이메일 인증 코드",
        message=f"인증 코드: {code}\n({EMAIL_CODE_EXPIRE_MINUTES}분 이내 입력해주세요)",
        from_email=None,  # DEFAULT_FROM_EMAIL 사용
        recipient_list=[email],
    )

    logger.debug("[EMAIL VERIFY] to=%s expires_in=%d", email, EMAIL_CODE_EXPIRE_MINUTES * 60)

    return JsonResponse({"ok": True, "expires_in": EMAIL_CODE_EXPIRE_MINUTES * 60})


@require_http_methods(["POST"])
def email_verify(request):
    """
    body: { "email": "...", "code": "123456" }
    return: { ok: true, verified: true, user_exists: bool }
    """
    data = _json(request)
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()

    if not email or not code:
        return JsonResponse({"ok": False, "error": "EMAIL_AND_CODE_REQUIRED"}, status=400)

    record = (
        EmailVerification.objects
        .filter(email=email)
        .order_by("-created_at")
        .first()
    )

    # 통일된 에러 메시지로 이메일 열거 공격 방지
    if not record or record.is_expired() or not check_password(code, record.code_hash):
        return JsonResponse({"ok": False, "error": "INVALID_OR_EXPIRED"}, status=400)

    # ✅ 인증 완료 기록 남김 (회원가입 전/후 모두)
    record.verified_at = timezone.now()
    record.save(update_fields=["verified_at"])

    user = User.objects.filter(email=email).first()
    if not user:
        return JsonResponse({"ok": True, "verified": True, "user_exists": False})

    user.email_verified = True
    user.save(update_fields=["email_verified"])

    return JsonResponse({"ok": True, "verified": True, "user_exists": True})


@require_http_methods(["POST"])
def login_view(request):
    data = _json(request)
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = authenticate(request, email=email, password=password)
    if not user:
        return JsonResponse({"ok": False, "error": "INVALID_CREDENTIALS"}, status=401)

    login(request, user)
    return JsonResponse({"ok": True})


@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})


_TRACK_TO_FRONTEND = {
    "PLANNING_DESIGN": "PLANNING",
    "FRONTEND": "FRONTEND",
    "BACKEND": "BACKEND",
    "AI_SERVER": "AI",
}


@ensure_csrf_cookie
@require_http_methods(["GET"])
def csrf_cookie_view(request):
    """CSRF 쿠키를 설정하는 엔드포인트 (로그인/회원가입 전 호출)"""
    return JsonResponse({"ok": True})


@ensure_csrf_cookie
@require_http_methods(["GET"])
def me_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "NOT_AUTHENTICATED"}, status=401)

    u = request.user
    data = {
        "id": u.id,
        "email": u.email,
        "role": u.role,
        "email_verified": u.email_verified,

        # ✅ 기본정보 자동채움용 필드
        "name": u.name,
        "student_id": u.student_id,
        "department": u.department,
        "phone": u.phone,
    }

    # ✅ STUDENT/INSTRUCTOR인 경우 트랙 정보 포함
    if u.education_track:
        data["track"] = _TRACK_TO_FRONTEND.get(u.education_track, u.education_track)

    return JsonResponse(data)


@require_http_methods(["POST"])
def signup_view(request):
    """
    이메일 인증 완료(verified_at 존재 + 10분 이내) 해야만 가입 가능
    body:
    {
      "email": "xxx@sch.ac.kr",
      "password": "...",
      "name": "...",
      "student_id": "...",
      "department": "...",
      "phone": "010-0000-0000" (optional)
    }
    """
    data = _json(request)

    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    name = (data.get("name") or "").strip()
    student_id = (data.get("student_id") or "").strip()
    department = (data.get("department") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not email or not password:
        return JsonResponse({"ok": False, "error": "EMAIL_PASSWORD_REQUIRED"}, status=400)

    # 학교메일 강제
    if not email.endswith("@sch.ac.kr"):
        return JsonResponse({"ok": False, "error": "SCHOOL_EMAIL_REQUIRED"}, status=400)

    # 기본정보 필수 (phone은 선택)
    if not name or not student_id or not department:
        return JsonResponse({"ok": False, "error": "PROFILE_REQUIRED"}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"ok": False, "error": "EMAIL_EXISTS"}, status=409)

    # ✅ 이메일 인증 완료 여부 체크 (verified_at)
    record = (
        EmailVerification.objects
        .filter(email=email)
        .order_by("-created_at")
        .first()
    )

    if not record or not record.verified_at:
        return JsonResponse({"ok": False, "error": "EMAIL_NOT_VERIFIED"}, status=403)

    # ✅ 인증 후 유효시간(10분) 초과 시 가입 불가
    if timezone.now() - record.verified_at > timedelta(minutes=EMAIL_VERIFICATION_VALID_MINUTES):
        return JsonResponse({"ok": False, "error": "EMAIL_VERIFICATION_EXPIRED"}, status=403)

    # 유저 생성 (가입 시점에 verified True로 박아줌)
    user = User.objects.create_user(
        email=email,
        password=password,
        name=name,
        student_id=student_id,
        department=department,
        phone=phone,
        email_verified=True,  # ✅ 가입 시 인증된 이메일로 확정
        role="APPLICANT",
    )

    return JsonResponse({"ok": True, "id": user.id})