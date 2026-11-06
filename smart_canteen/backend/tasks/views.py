from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model

from accounts.permissions import IsStaffRole
from .models import Task
from .serializers import TaskSerializer, StaffMemberSerializer

User = get_user_model()


class TaskViewSet(viewsets.ModelViewSet):
    """
    Staff Task Management ViewSet.
    Provides role-based access control:
    - Admin: can create, assign, edit, delete, and view all tasks across all staff.
    - Staff: can only view tasks assigned to their logged-in user ID, and update status of their assigned tasks.
    """
    queryset = Task.objects.all().select_related('assigned_to', 'created_by')
    serializer_class = TaskSerializer
    permission_classes = [IsStaffRole]

    def get_queryset(self):
        user = self.request.user
        qs = Task.objects.all().select_related('assigned_to', 'created_by').order_by('-created_at')

        # Role-based restriction: Staff members can ONLY view tasks assigned to their logged-in user ID
        if not user.is_admin_role():
            qs = qs.filter(assigned_to=user)

        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param and status_param.upper() != 'ALL':
            qs = qs.filter(status=status_param.upper())

        # Filter by priority
        priority_param = self.request.query_params.get('priority')
        if priority_param and priority_param.upper() != 'ALL':
            qs = qs.filter(priority=priority_param.upper())

        # Filter by assigned staff (user id) - only applicable for Admin
        if user.is_admin_role():
            assigned_to_param = self.request.query_params.get('assigned_to')
            if assigned_to_param and assigned_to_param != 'ALL':
                if assigned_to_param == 'unassigned':
                    qs = qs.filter(assigned_to__isnull=True)
                else:
                    qs = qs.filter(assigned_to_id=assigned_to_param)

        # Search by task_id, name, description, or assigned staff name/email
        search_query = self.request.query_params.get('search')
        if search_query:
            query = search_query.strip()
            qs = qs.filter(
                Q(task_id__icontains=query) |
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(assigned_to__first_name__icontains=query) |
                Q(assigned_to__last_name__icontains=query) |
                Q(assigned_to__email__icontains=query)
            )

        return qs

    def create(self, request, *args, **kwargs):
        """Only Admin can create new tasks."""
        if not request.user.is_admin_role():
            return Response(
                {'error': 'Permission denied. Only Administrators can create new tasks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        """Only Admin can edit tasks."""
        if not request.user.is_admin_role():
            return Response(
                {'error': 'Permission denied. Only Administrators can edit tasks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Only Admin can edit tasks."""
        if not request.user.is_admin_role():
            return Response(
                {'error': 'Permission denied. Only Administrators can edit tasks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only Admin can delete tasks."""
        if not request.user.is_admin_role():
            return Response(
                {'error': 'Permission denied. Only Administrators can delete tasks.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """
        Returns summary counts for dashboard KPI cards.
        - For Admin: all tasks across the canteen.
        - For Staff: scoped strictly to tasks assigned to their logged-in user ID.
        """
        user = request.user
        if user.is_admin_role():
            base_qs = Task.objects.all()
        else:
            base_qs = Task.objects.filter(assigned_to=user)

        total = base_qs.count()
        pending = base_qs.filter(status=Task.Status.PENDING).count()
        in_progress = base_qs.filter(status=Task.Status.IN_PROGRESS).count()
        completed = base_qs.filter(status=Task.Status.COMPLETED).count()

        return Response({
            'total': total,
            'pending': pending,
            'in_progress': in_progress,
            'completed': completed,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='staff-members')
    def staff_members(self, request):
        """Returns active staff members who can be assigned to tasks."""
        staff = User.objects.filter(
            role__in=[User.Role.STAFF, User.Role.ADMIN],
            is_active=True
        ).order_by('first_name', 'last_name')
        serializer = StaffMemberSerializer(staff, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """
        Updates the status of a specific task.
        - Admin can update status of any task.
        - Staff can update status of their own assigned tasks (Pending -> In Progress -> Completed).
        """
        task = self.get_object()

        # Extra safety check: if non-admin staff, task must belong to them
        if not request.user.is_admin_role() and task.assigned_to_id != request.user.id:
            return Response(
                {'error': 'You can only update status for tasks assigned to you.'},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        if not new_status:
            return Response({'error': 'Status is required.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_statuses = [choice[0] for choice in Task.Status.choices]
        if new_status.upper() not in valid_statuses:
            return Response(
                {'error': f"Invalid status '{new_status}'. Valid choices: {valid_statuses}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        task.status = new_status.upper()
        task.save(update_fields=['status', 'updated_at'])
        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)
