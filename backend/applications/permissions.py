from rest_framework.permissions import BasePermission

class IsInstructorOrStaff(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        if not u or not u.is_authenticated:
            return False
        if getattr(u, "is_staff", False) or getattr(u, "is_superuser", False):
            return True
        return getattr(u, "role", "") == "INSTRUCTOR"