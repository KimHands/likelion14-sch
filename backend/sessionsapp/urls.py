from django.urls import path
from . import views

urlpatterns = [
    # Quiz
    path("quizzes/", views.quiz_list_create),
    path("quizzes/<int:pk>/", views.quiz_detail),
    path("quizzes/<int:pk>/answer/", views.quiz_answer),
    # Q&A
    path("qna/", views.qna_list_create),
    path("qna/<int:pk>/", views.qna_detail),
    path("qna/<int:pk>/comments/", views.qna_comment_create),
    # Assignment
    path("assignments/", views.assignment_list_create),
    path("assignments/<int:pk>/", views.assignment_detail),
    path("assignments/<int:pk>/submit/", views.assignment_submit),
    path("submissions/<int:pk>/read/", views.submission_mark_read),
    # Announcement
    path("announcements/", views.announcement_list_create),
    # Attendance (출석부)
    path("attendance/", views.attendance_session_list_create),
    path("attendance/<int:pk>/", views.attendance_session_detail),
    path("attendance/<int:pk>/mark/", views.attendance_mark),
    # Groups (학생 그룹)
    path("groups/", views.group_list_create),
    path("groups/<int:pk>/", views.group_delete),
    path("groups/<int:pk>/members/", views.group_update_members),
    path("students/", views.track_students),
    # Reviews (감상평)
    path("reviews/my/", views.my_reviews),
    path("reviews/", views.review_list_create),
    path("reviews/<int:pk>/", views.review_delete),
]
