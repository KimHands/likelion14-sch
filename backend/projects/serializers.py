from rest_framework import serializers
from .models import Project


class ProjectListSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id", "title", "generation", "description", "detail",
            "tech_stack", "github_url", "team_members",
            "thumbnail_url", "pdf_url",
            "order", "is_visible", "created_at", "updated_at",
        ]

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            return obj.thumbnail.url
        return None

    def get_pdf_url(self, obj):
        if obj.pdf_file:
            return obj.pdf_file.url
        return None


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "title", "generation", "description", "detail",
            "tech_stack", "github_url", "team_members",
            "thumbnail", "pdf_file",
            "order", "is_visible",
        ]
        extra_kwargs = {
            "thumbnail": {"required": False},
            "pdf_file": {"required": False},
        }
