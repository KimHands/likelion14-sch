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
    # ClassReviews (수업 감상평 - 학생이 작성)
    path("class-reviews/my/", views.my_class_reviews),
    path("class-reviews/", views.class_review_list_create),
    path("class-reviews/<int:pk>/", views.class_review_delete),
    # Homework Gallery (과제 갤러리 - 풀스택 PDF 제출)
    path("homework-categories/", views.homework_category_list_create),
    path("homework-categories/<int:pk>/", views.homework_category_delete),
    path("homework-categories/<int:pk>/submit/", views.homework_submit),
    path("homework-submissions/<int:pk>/", views.homework_submission_delete),
]
