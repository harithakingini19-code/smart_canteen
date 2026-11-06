from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Task

User = get_user_model()


class StaffMemberSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'role']

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name or obj.username or obj.email


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    assigned_to_email = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'task_id',
            'name',
            'description',
            'assigned_to',
            'assigned_to_name',
            'assigned_to_email',
            'priority',
            'status',
            'due_date',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'task_id', 'created_by', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            full_name = f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip()
            return full_name or obj.assigned_to.username or obj.assigned_to.email
        return 'Unassigned'

    def get_assigned_to_email(self, obj):
        return obj.assigned_to.email if obj.assigned_to else ''

    def get_created_by_name(self, obj):
        if obj.created_by:
            full_name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return full_name or obj.created_by.username or obj.created_by.email
        return 'System'
