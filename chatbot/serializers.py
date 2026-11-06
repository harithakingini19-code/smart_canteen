from rest_framework import serializers
from .models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'session', 'role', 'content', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'session_key', 'created_at', 'messages']
        read_only_fields = ['id', 'created_at']


class CancellationStatusSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    status = serializers.CharField()
    can_cancel = serializers.BooleanField()
    seconds_remaining = serializers.IntegerField()
    created_at = serializers.DateTimeField(required=False, allow_null=True)
    message = serializers.CharField()
