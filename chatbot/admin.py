from django.contrib import admin
from .models import ChatSession, ChatMessage


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_key', 'created_at']
    list_filter = ['created_at']
    search_fields = ['session_key', 'user__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'short_content', 'timestamp']
    list_filter = ['role', 'timestamp']
    search_fields = ['content', 'session__session_key']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']

    @admin.display(description='Content Preview')
    def short_content(self, obj):
        return obj.content[:80] + ('...' if len(obj.content) > 80 else '')
