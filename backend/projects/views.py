from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as drf_status

from applications.permissions import IsInstructorOrStaff
from .models import Project
from .serializers import ProjectListSerializer, ProjectCreateUpdateSerializer


@api_view(["GET", "POST"])
@parser_classes([MultiPartParser, FormParser])
def project_list_create(request):
    if request.method == "GET":
        # ?all=true → 관리자 전체 조회 (비공개 포함)
        if request.query_params.get("all") == "true":
            if not IsInstructorOrStaff().has_permission(request, None):
                return Response({"detail": "권한 없음"}, status=drf_status.HTTP_403_FORBIDDEN)
            qs = Project.objects.all()
        else:
            qs = Project.objects.filter(is_visible=True)
        ser = ProjectListSerializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    # POST — 생성 (INSTRUCTOR only)
    if not IsInstructorOrStaff().has_permission(request, None):
        return Response({"detail": "권한 없음"}, status=drf_status.HTTP_403_FORBIDDEN)

    ser = ProjectCreateUpdateSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=drf_status.HTTP_400_BAD_REQUEST)
    proj = ser.save(created_by=request.user)
    out = ProjectListSerializer(proj, context={"request": request})
    return Response(out.data, status=drf_status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@parser_classes([MultiPartParser, FormParser])
def project_detail(request, pk):
    try:
        proj = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({"detail": "Not found"}, status=drf_status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        ser = ProjectListSerializer(proj, context={"request": request})
        return Response(ser.data)

    # PATCH / DELETE — INSTRUCTOR only
    if not IsInstructorOrStaff().has_permission(request, None):
        return Response({"detail": "권한 없음"}, status=drf_status.HTTP_403_FORBIDDEN)

    if request.method == "PATCH":
        ser = ProjectCreateUpdateSerializer(proj, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=drf_status.HTTP_400_BAD_REQUEST)
        proj = ser.save()
        out = ProjectListSerializer(proj, context={"request": request})
        return Response(out.data)

    # DELETE
    proj.delete()
    return Response(status=drf_status.HTTP_204_NO_CONTENT)
