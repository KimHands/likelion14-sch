from django.urls import path
from .views import login_view, logout_view, me_view, email_send_code, email_verify, signup_view

urlpatterns = [
    # 안전장치: 슬래시가 있든 없든 다 받아줍니다!
    path("login", login_view),
    path("login/", login_view),
    
    path("logout", logout_view),
    path("me", me_view),

    path("email/send-code", email_send_code),
    path("email/verify", email_verify),

    path("signup", signup_view),
]
