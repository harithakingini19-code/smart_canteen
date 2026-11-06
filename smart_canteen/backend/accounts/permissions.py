from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Allows access only to Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role())


class IsStaffRole(BasePermission):
    """Allows access to Staff and Admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff_role())


class IsStudentRole(BasePermission):
    """Allows access to Student users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'STUDENT')
