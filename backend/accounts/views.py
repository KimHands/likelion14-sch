from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
import json
from django.views.decorators.csrf import csrf_exempt

@require_http_methods(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False}, status=401)

    # 지금은 일단 기본 User 기준(추후 role/email_verified 붙임)
    return JsonResponse({
        "authenticated": True,
        "id": request.user.id,
        "email": request.user.email,
        "role": "APPLICANT",        # Sprint 1에서 커스텀 유저 모델로 진짜 role 반환
        "email_verified": True,     # Sprint 1에서 진짜로
    })

@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    body = json.loads(request.body.decode("utf-8"))
    email = body.get("email")
    password = body.get("password")

    user = authenticate(request, username=email, password=password)
    if user is None:
        return JsonResponse({"message": "invalid credentials"}, status=400)

    login(request, user)
    return JsonResponse({"ok": True})

@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({"ok": True})