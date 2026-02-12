from django.contrib import admin
from .models import Application, ApplicationScore, ResultNotificationSettings


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "track", "status", "doc_decision", "final_decision", "submitted_at"]
    list_filter = ["status", "track", "doc_decision", "final_decision"]
    search_fields = ["user__email", "user__name"]


@admin.register(ApplicationScore)
class ApplicationScoreAdmin(admin.ModelAdmin):
    list_display = ["id", "application", "reviewer", "kind", "total", "created_at"]
    list_filter = ["kind"]


@admin.register(ResultNotificationSettings)
class ResultNotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ["id", "interview_location", "interview_date", "ot_datetime", "updated_at", "updated_by"]
    
    def has_add_permission(self, request):
        # 싱글톤이므로 추가 불가
        return not ResultNotificationSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        # 삭제 불가
        return False
