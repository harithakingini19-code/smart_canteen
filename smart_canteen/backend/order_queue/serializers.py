from rest_framework import serializers
from .models import QueueToken


class QueueTokenSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.CharField(source='order.user.get_full_name', read_only=True)
    order_items_count = serializers.IntegerField(source='order.items.count', read_only=True)
    user_id = serializers.IntegerField(source='order.user.id', read_only=True)
    user = serializers.IntegerField(source='order.user.id', read_only=True)
    queue_number = serializers.CharField(source='token_number', read_only=True)

    class Meta:
        model = QueueToken
        fields = (
            'id', 'order', 'order_number', 'customer_name', 'order_items_count',
            'user_id', 'user', 'queue_number',
            'token_number', 'status', 'estimated_wait_time_minutes', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'token_number', 'created_at', 'updated_at')

