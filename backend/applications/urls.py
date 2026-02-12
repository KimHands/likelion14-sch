from django.urls import path
from . import views
from .views_admin import (
    AdminApplicationListView,
    AdminApplicationDetailView,
    AdminApplicationStatusUpdateView,
    AdminApplicationScoresView,
    AdminApplicationDocFinalizeView,
    AdminApplicationFinalizeView,
    AdminResultNotificationSettingsView,
)
from .view_results import MyResultView

urlpatterns = [
    path("my", views.my_application),
    path("draft", views.save_draft),
    path("submit", views.submit_application),

    path("admin", AdminApplicationListView.as_view()),
    path("admin/<int:app_id>", AdminApplicationDetailView.as_view()),
    path("admin/<int:app_id>/status", AdminApplicationStatusUpdateView.as_view()),

    # ✅ 점수 API
    path("admin/<int:app_id>/scores", AdminApplicationScoresView.as_view()),

    # ✅ 확정 API (서류/최종 분리)
    path("admin/<int:app_id>/doc-finalize", AdminApplicationDocFinalizeView.as_view()),
    path("admin/<int:app_id>/finalize", AdminApplicationFinalizeView.as_view()),
    
    # ✅ 합격 알림 설정 API
    path("admin/notification-settings", AdminResultNotificationSettingsView.as_view()),
    
    path("results/my", MyResultView.as_view()),
]