from rest_framework import generics
from rest_framework.permissions import AllowAny
from applications.permissions import IsInstructorOrStaff
from .models import RoadmapItem
from .serializers import RoadmapItemSerializer


class RoadmapPublicList(generics.ListAPIView):
    """공개 GET - Home 페이지용"""
    queryset = RoadmapItem.objects.all()
    serializer_class = RoadmapItemSerializer
    permission_classes = [AllowAny]


class RoadmapAdminList(generics.ListCreateAPIView):
    """관리자 목록/생성"""
    queryset = RoadmapItem.objects.all()
    serializer_class = RoadmapItemSerializer
    permission_classes = [IsInstructorOrStaff]


class RoadmapAdminDetail(generics.RetrieveUpdateDestroyAPIView):
    """관리자 수정/삭제"""
    queryset = RoadmapItem.objects.all()
    serializer_class = RoadmapItemSerializer
    permission_classes = [IsInstructorOrStaff]
