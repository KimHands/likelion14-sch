from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health(request):
    return JsonResponse({"ok": True})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health", health),
    path("api/auth/", include("users.urls")),
    path("api/applications/", include("applications.urls")),
    path("api/sessions/", include("sessionsapp.urls")),
    path("api/projects/", include("projects.urls")),
    path("api/roadmap/", include("roadmap.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
