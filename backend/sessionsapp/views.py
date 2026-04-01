from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth import get_user_model
from applications.permissions import IsInstructorOrStaff
from .models import (
    Quiz, QuizAnswer, QnAPost, QnAComment,
    Assignment, AssignmentSubmission, Announcement,
    AttendanceSession, AttendanceRecord,
    StudentGroup, ClassReview,
    HomeworkCategory, HomeworkSubmission,
)
from .serializers import (
    QuizListSerializer, QuizDetailSerializer, QuizCreateSerializer, QuizAnswerSerializer,
    QnAPostListSerializer, QnAPostDetailSerializer, QnAPostCreateSerializer,
    QnACommentCreateSerializer,
    AssignmentListSerializer, AssignmentDetailSerializer, AssignmentCreateSerializer,
    SubmissionCreateSerializer, SubmissionSerializer,
    AnnouncementSerializer, AnnouncementCreateSerializer,
    AttendanceSessionListSerializer, AttendanceSessionDetailSerializer,
    AttendanceSessionCreateSerializer, AttendanceMarkSerializer,
    StudentGroupSerializer, StudentGroupCreateSerializer, StudentGroupMembersSerializer,
    ClassReviewSerializer, ClassReviewWriteSerializer,
    HomeworkCategorySerializer, HomeworkCategoryCreateSerializer,
    HomeworkSubmissionSerializer,
)

User = get_user_model()


# ── Quiz ──────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def quiz_list_create(request):
    if request.method == "GET":
        track = request.query_params.get("track")
        qs = Quiz.objects.all()
        if track:
            qs = qs.filter(track=track)
        # INSTRUCTOR는 correct_option 포함
        if request.user.role == "INSTRUCTOR" or request.user.is_staff:
            ser = QuizDetailSerializer(qs, many=True, context={"request": request})
        else:
            ser = QuizListSerializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    # POST — INSTRUCTOR only
    if request.user.role != "INSTRUCTOR" and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    ser = QuizCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save(created_by=request.user)
    return Response(ser.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def quiz_detail(request, pk):
    try:
        quiz = Quiz.objects.get(pk=pk)
    except Quiz.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if request.user.role == "INSTRUCTOR" or request.user.is_staff:
        ser = QuizDetailSerializer(quiz, context={"request": request})
    else:
        ser = QuizListSerializer(quiz, context={"request": request})
    return Response(ser.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def quiz_answer(request, pk):
    try:
        quiz = Quiz.objects.get(pk=pk)
    except Quiz.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if QuizAnswer.objects.filter(quiz=quiz, student=request.user).exists():
        return Response({"detail": "이미 답변을 제출했습니다."}, status=status.HTTP_400_BAD_REQUEST)

    ser = QuizAnswerSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    selected = ser.validated_data["selected_option"]
    is_correct = selected == quiz.correct_option

    QuizAnswer.objects.create(
        quiz=quiz,
        student=request.user,
        selected_option=selected,
        is_correct=is_correct,
    )
    return Response({
        "selected_option": selected,
        "correct_option": quiz.correct_option,
        "is_correct": is_correct,
    })


# ── Q&A ───────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def qna_list_create(request):
    if request.method == "GET":
        track = request.query_params.get("track")
        qs = QnAPost.objects.all()
        if track:
            qs = qs.filter(track=track)
        ser = QnAPostListSerializer(qs, many=True)
        return Response(ser.data)

    ser = QnAPostCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save(author=request.user)
    return Response(ser.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def qna_detail(request, pk):
    try:
        post = QnAPost.objects.prefetch_related("comments__author").get(pk=pk)
    except QnAPost.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    ser = QnAPostDetailSerializer(post)
    return Response(ser.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def qna_comment_create(request, pk):
    try:
        post = QnAPost.objects.get(pk=pk)
    except QnAPost.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    ser = QnACommentCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save(post=post, author=request.user)
    return Response(ser.data, status=status.HTTP_201_CREATED)


# ── Assignment ────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def assignment_list_create(request):
    if request.method == "GET":
        track = request.query_params.get("track")
        qs = Assignment.objects.all()
        if track:
            qs = qs.filter(track=track)
        ser = AssignmentListSerializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    if request.user.role != "INSTRUCTOR" and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    ser = AssignmentCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save(created_by=request.user)
    return Response(ser.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def assignment_detail(request, pk):
    try:
        assignment = Assignment.objects.prefetch_related("submissions__student").get(pk=pk)
    except Assignment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    ser = AssignmentDetailSerializer(assignment, context={"request": request})
    return Response(ser.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def assignment_submit(request, pk):
    try:
        assignment = Assignment.objects.get(pk=pk)
    except Assignment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    ser = SubmissionCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    sub, created = AssignmentSubmission.objects.update_or_create(
        assignment=assignment,
        student=request.user,
        defaults={"link": ser.validated_data["link"]},
    )
    return Response(SubmissionSerializer(sub).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(["PATCH"])
@permission_classes([IsInstructorOrStaff])
def submission_mark_read(request, pk):
    try:
        sub = AssignmentSubmission.objects.get(pk=pk)
    except AssignmentSubmission.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    sub.is_read = True
    sub.read_at = timezone.now()
    sub.read_by = request.user
    sub.save(update_fields=["is_read", "read_at", "read_by"])
    return Response(SubmissionSerializer(sub).data)


# ── Announcement ──────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def announcement_list_create(request):
    if request.method == "GET":
        track = request.query_params.get("track")
        qs = Announcement.objects.all()
        if track:
            qs = qs.filter(track=track)
        ser = AnnouncementSerializer(qs, many=True)
        return Response(ser.data)

    if request.user.role != "INSTRUCTOR" and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    ser = AnnouncementCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save(author=request.user)
    return Response(ser.data, status=status.HTTP_201_CREATED)


# ── Attendance ──────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def attendance_session_list_create(request):
    """
    GET  /api/sessions/attendance/?track=FULLSTACK  — 출석 세션 목록
    POST /api/sessions/attendance/                  — 출석 세션 생성 (INSTRUCTOR)
    """
    if request.method == "GET":
        track = request.query_params.get("track")
        qs = AttendanceSession.objects.all()
        if track:
            qs = qs.filter(track=track)
        ser = AttendanceSessionListSerializer(qs, many=True)
        return Response(ser.data)

    if request.user.role != "INSTRUCTOR" and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    ser = AttendanceSessionCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    att_session = ser.save(created_by=request.user)

    # 해당 트랙 수강생 자동 등록 (ABSENT 기본값)
    students = User.objects.filter(role="STUDENT", education_track=att_session.track)
    AttendanceRecord.objects.bulk_create([
        AttendanceRecord(session=att_session, student=s, status="ABSENT")
        for s in students
    ], ignore_conflicts=True)

    detail_ser = AttendanceSessionDetailSerializer(att_session)
    return Response(detail_ser.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def attendance_session_detail(request, pk):
    """
    GET /api/sessions/attendance/<id>/  — 출석 세션 상세 (출석 명단 포함)
    세션 생성 이후 신규 등록 학생도 자동 추가
    """
    try:
        att_session = AttendanceSession.objects.prefetch_related("records__student").get(pk=pk)
    except AttendanceSession.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    # 해당 트랙 신규 수강생 자동 보완
    existing_ids = set(att_session.records.values_list("student_id", flat=True))
    new_students = User.objects.filter(
        role="STUDENT", education_track=att_session.track
    ).exclude(id__in=existing_ids)
    if new_students.exists():
        AttendanceRecord.objects.bulk_create([
            AttendanceRecord(session=att_session, student=s, status="ABSENT")
            for s in new_students
        ], ignore_conflicts=True)
        att_session = AttendanceSession.objects.prefetch_related("records__student").get(pk=pk)

    ser = AttendanceSessionDetailSerializer(att_session)
    return Response(ser.data)


@api_view(["PATCH"])
@permission_classes([IsInstructorOrStaff])
def attendance_mark(request, pk):
    """
    PATCH /api/sessions/attendance/<id>/mark/
    body: { student_id: int, status: "PRESENT"|"ABSENT"|"LATE" }
    """
    try:
        att_session = AttendanceSession.objects.get(pk=pk)
    except AttendanceSession.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    ser = AttendanceMarkSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    record, _ = AttendanceRecord.objects.get_or_create(
        session=att_session,
        student_id=ser.validated_data["student_id"],
        defaults={"status": "ABSENT"},
    )
    record.status = ser.validated_data["status"]
    record.marked_by = request.user
    record.save(update_fields=["status", "marked_by", "marked_at"])

    from .serializers import AttendanceRecordSerializer
    return Response(AttendanceRecordSerializer(record).data)


# ── StudentGroup ──────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def group_list_create(request):
    """
    GET  /api/sessions/groups/?track=FULLSTACK  — 그룹 목록
    POST /api/sessions/groups/                  — 그룹 생성 (INSTRUCTOR)
    """
    if request.method == "GET":
        track = request.query_params.get("track")
        qs = StudentGroup.objects.prefetch_related("members")
        if track:
            qs = qs.filter(track=track)
        return Response(StudentGroupSerializer(qs, many=True).data)

    if request.user.role != "INSTRUCTOR" and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    ser = StudentGroupCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    group = ser.save(created_by=request.user)
    return Response(StudentGroupSerializer(group).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsInstructorOrStaff])
def group_delete(request, pk):
    """DELETE /api/sessions/groups/<id>/"""
    try:
        StudentGroup.objects.get(pk=pk).delete()
    except StudentGroup.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["PATCH"])
@permission_classes([IsInstructorOrStaff])
def group_update_members(request, pk):
    """
    PATCH /api/sessions/groups/<id>/members/
    body: { member_ids: [int, ...] }
    """
    try:
        group = StudentGroup.objects.prefetch_related("members").get(pk=pk)
    except StudentGroup.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    ser = StudentGroupMembersSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    group.members.set(User.objects.filter(id__in=ser.validated_data["member_ids"], role="STUDENT"))
    return Response(StudentGroupSerializer(group).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def track_students(request):
    """
    GET /api/sessions/students/?track=FULLSTACK
    학생 목록 + 소속 그룹 정보 포함
    """
    track = request.query_params.get("track")
    qs = User.objects.filter(role="STUDENT").prefetch_related("student_groups")
    if track:
        qs = qs.filter(education_track=track)
    data = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "groups": [{"id": g.id, "name": g.name} for g in u.student_groups.all()],
        }
        for u in qs
    ]
    return Response(data)


# ── ClassReview (수업 감상평) ──────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def class_review_list_create(request):
    """
    GET  /api/sessions/class-reviews/?track=FULLSTACK  — 감상평 목록 조회
    POST /api/sessions/class-reviews/                  — 감상평 작성 (학생)
    """
    if request.method == "GET":
        track = request.query_params.get("track")
        qs = ClassReview.objects.select_related("author")
        if track:
            qs = qs.filter(track=track)
        return Response(ClassReviewSerializer(qs, many=True).data)

    ser = ClassReviewWriteSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    review = ser.save(author=request.user)
    return Response(ClassReviewSerializer(review).data, status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def class_review_delete(request, pk):
    """DELETE /api/sessions/class-reviews/<id>/  — 본인 감상평 삭제"""
    try:
        review = ClassReview.objects.get(pk=pk)
    except ClassReview.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if review.author != request.user and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    review.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_class_reviews(request):
    """GET /api/sessions/class-reviews/my/  — 내가 작성한 감상평 목록"""
    reviews = ClassReview.objects.filter(author=request.user).select_related("author")
    return Response(ClassReviewSerializer(reviews, many=True).data)


# ── HomeworkCategory (과제 갤러리 카테고리) ──────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def homework_category_list_create(request):
    """
    GET  /api/sessions/homework-categories/?track=FULLSTACK  — 카테고리 목록
    POST /api/sessions/homework-categories/                   — 카테고리 생성 (INSTRUCTOR)
    """
    if request.method == "GET":
        track = request.query_params.get("track", "FULLSTACK")
        qs = HomeworkCategory.objects.filter(track=track).prefetch_related("submissions__student")
        ser = HomeworkCategorySerializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    if request.user.role != "INSTRUCTOR" and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    ser = HomeworkCategoryCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    category = ser.save(created_by=request.user)
    return Response(
        HomeworkCategorySerializer(category, context={"request": request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsInstructorOrStaff])
def homework_category_delete(request, pk):
    """DELETE /api/sessions/homework-categories/<id>/"""
    try:
        HomeworkCategory.objects.get(pk=pk).delete()
    except HomeworkCategory.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def homework_submit(request, pk):
    """
    POST /api/sessions/homework-categories/<id>/submit/
    multipart/form-data: { pdf_file: File }  — PDF만 허용
    """
    try:
        category = HomeworkCategory.objects.get(pk=pk)
    except HomeworkCategory.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    pdf = request.FILES.get("pdf_file")
    if not pdf:
        return Response({"detail": "pdf_file 필드가 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)
    if not pdf.name.lower().endswith(".pdf") or pdf.content_type != "application/pdf":
        return Response({"detail": "PDF 파일만 업로드 가능합니다."}, status=status.HTTP_400_BAD_REQUEST)

    sub, created = HomeworkSubmission.objects.update_or_create(
        category=category,
        student=request.user,
        defaults={"pdf_file": pdf},
    )
    return Response(
        HomeworkSubmissionSerializer(sub, context={"request": request}).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def homework_submission_delete(request, pk):
    """DELETE /api/sessions/homework-submissions/<id>/  — 본인 제출 삭제"""
    try:
        sub = HomeworkSubmission.objects.get(pk=pk)
    except HomeworkSubmission.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    if sub.student != request.user and not request.user.is_staff:
        return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
    sub.pdf_file.delete(save=False)
    sub.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
