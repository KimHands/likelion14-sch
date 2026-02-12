from django.urls import path
from . import views

urlpatterns = [
    path("", views.project_list_create),
    path("<int:pk>/", views.project_detail),
]
