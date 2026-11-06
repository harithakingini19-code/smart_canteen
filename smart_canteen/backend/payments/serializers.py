from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Payment
        fields = ('id', 'order', 'order_number', 'transaction_id', 'payment_method', 'status', 'amount', 'timestamp')
        read_only_fields = ('id', 'transaction_id', 'timestamp')


class ProcessPaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.Method.choices)


class AdminPaymentSerializer(serializers.ModelSerializer):
    """Admin-only payment transaction serializer with customer and order inspection (Task S.3)."""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()
    customer_id = serializers.SerializerMethodField()
    order_items_count = serializers.SerializerMethodField()
    order_status = serializers.CharField(source='order.status', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id',
            'order',
            'order_number',
            'transaction_id',
            'payment_method',
            'status',
            'amount',
            'timestamp',
            'customer_name',
            'customer_email',
            'customer_id',
            'order_items_count',
            'order_status',
        )
        read_only_fields = fields

    def get_customer_name(self, obj):
        try:
            if obj.order and obj.order.user:
                u = obj.order.user
                full_name = f"{u.first_name} {u.last_name}".strip()
                return full_name or u.username or u.email
        except Exception:
            pass
        return "Customer"

    def get_customer_email(self, obj):
        try:
            if obj.order and obj.order.user:
                return obj.order.user.email
        except Exception:
            pass
        return ""

    def get_customer_id(self, obj):
        try:
            if obj.order and obj.order.user:
                return obj.order.user.id
        except Exception:
            pass
        return None

    def get_order_items_count(self, obj):
        try:
            if obj.order:
                return obj.order.items.count()
        except Exception:
            pass
        return 0

