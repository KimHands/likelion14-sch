from django.contrib import admin
from .models import RoadmapItem


@admin.register(RoadmapItem)
class RoadmapItemAdmin(admin.ModelAdmin):
    list_display = ("label", "half", "row", "col_start", "col_span", "order")
    list_filter = ("half",)
    ordering = ("half", "row", "order")
