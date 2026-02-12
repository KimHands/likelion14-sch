from django.contrib import admin
from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "generation", "order", "is_visible", "created_at"]
    list_editable = ["order", "is_visible"]
    list_filter = ["generation", "is_visible"]
    search_fields = ["title", "description"]
