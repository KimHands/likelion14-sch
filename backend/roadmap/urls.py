from django.urls import path
from . import views

urlpatterns = [
    path("", views.RoadmapPublicList.as_view()),
    path("admin/", views.RoadmapAdminList.as_view()),
    path("admin/<int:pk>/", views.RoadmapAdminDetail.as_view()),
]
