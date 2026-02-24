from django.urls import path
from .views import (
    login_view, logout_view, me_view,
    email_send_code, email_verify, signup_view,
    csrf_cookie_view,
    password_send_code, password_reset,
)

urlpatterns = [
    path("csrf", csrf_cookie_view),
    path("login", login_view),
    path("logout", logout_view),
    path("me", me_view),

    path("email/send-code", email_send_code),
    path("email/verify", email_verify),

    path("signup", signup_view),

    path("password/send-code", password_send_code),
    path("password/reset", password_reset),
]
