from rest_framework import serializers
from .models import Order, OrderItem
from menu.serializers import FoodItemSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ('id', 'food_item', 'food_item_name', 'unit_price', 'quantity', 'subtotal')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    queue_number = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'order_number', 'user', 'user_email', 'user_name',
            'status', 'payment_status', 'total_amount', 'discount_amount',
            'final_amount', 'special_instructions', 'pickup_time', 'estimated_prep_time_minutes',
            'queue_number', 'items', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'order_number', 'user', 'created_at', 'updated_at')

    def get_queue_number(self, obj):
        if hasattr(obj, 'queue_token'):
            return obj.queue_token.token_number
        return None


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ('status', 'payment_status', 'estimated_prep_time_minutes')
