from django.contrib import admin
from .models import QueueToken


@admin.register(QueueToken)
class QueueTokenAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'order', 'status', 'estimated_wait_time_minutes', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('token_number', 'order__order_number')
