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
