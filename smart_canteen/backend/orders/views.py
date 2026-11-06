from rest_framework import status, permissions, generics, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderStatusUpdateSerializer
from cart.models import Cart
from order_queue.models import QueueToken
from notifications.services import notify_order_status_change
from accounts.permissions import IsStaffRole, IsAdminRole


class PlaceOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        cart = get_object_or_404(Cart, user=request.user)
        if not cart.items.exists():
            return Response({'error': 'Cart is empty. Add items before placing an order.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check availability of items and available stock quantity
        for item in cart.items.select_related('food_item'):
            food = item.food_item
            if not food.is_available or getattr(food, 'quantity_available', 1) <= 0:
                return Response({
                    'error': f"Item '{food.name}' is currently out of stock. Please remove it from your cart before placing the order."
                }, status=status.HTTP_400_BAD_REQUEST)
            if hasattr(food, 'quantity_available') and item.quantity > food.quantity_available:
                return Response({
                    'error': f"Only {food.quantity_available} item(s) of '{food.name}' are available. Please reduce the quantity in your cart before placing the order."
                }, status=status.HTTP_400_BAD_REQUEST)

        total_amount = cart.total_price
        discount_amount = cart.discount_amount
        final_amount = cart.final_price
        special_instructions = request.data.get('special_instructions', '')
        pickup_time = request.data.get('pickup_time', 'ASAP')

        # Max preparation time among items
        max_prep_time = max([item.food_item.preparation_time_minutes for item in cart.items.all()], default=15)

        # Create Order
        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
            coupon=cart.coupon,
            special_instructions=special_instructions,
            pickup_time=pickup_time,
            estimated_prep_time_minutes=max_prep_time,
            status=Order.Status.CONFIRMED,
            payment_status=Order.PaymentStatus.PENDING
        )

        # Create OrderItems and automatically decrease available quantity
        for cart_item in cart.items.select_related('food_item'):
            OrderItem.objects.create(
                order=order,
                food_item=cart_item.food_item,
                food_item_name=cart_item.food_item.name,
                unit_price=cart_item.food_item.price,
                quantity=cart_item.quantity,
                subtotal=cart_item.subtotal
            )
            # Decrease available quantity and mark out of stock if 0
            food = cart_item.food_item
            if hasattr(food, 'quantity_available'):
                food.quantity_available = max(0, food.quantity_available - cart_item.quantity)
                if food.quantity_available == 0:
                    food.is_available = False
                food.save()

        # Create Queue Token automatically
        QueueToken.objects.create(
            order=order,
            estimated_wait_time_minutes=max_prep_time,
            status=QueueToken.Status.WAITING
        )

        # Clear Cart
        cart.items.all().delete()
        cart.coupon = None
        cart.save()

        # Trigger notification
        notify_order_status_change(order)

        return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'update_status', 'incoming_orders']:
            return [IsStaffRole()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_role():
            return Order.objects.all()
        return Order.objects.filter(user=user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        order = self.get_object()
        
        # Customers can only cancel if status is CONFIRMED
        if not request.user.is_staff_role() and order.status != Order.Status.CONFIRMED:
            return Response({'error': 'Order cannot be cancelled as preparation has already started.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = Order.Status.CANCELLED
        order.save()

        # Restore food quantities
        for item in order.items.select_related('food_item'):
            if item.food_item and hasattr(item.food_item, 'quantity_available'):
                food = item.food_item
                food.quantity_available += item.quantity
                if food.quantity_available > 0 and not food.is_available:
                    food.is_available = True
                food.save()

        # Update queue token status if exists
        if hasattr(order, 'queue_token'):
            order.queue_token.status = QueueToken.Status.CANCELLED
            order.queue_token.save()

        notify_order_status_change(order)

        return Response({'message': 'Order cancelled successfully.', 'order': OrderSerializer(order, context={'request': request}).data})

    @action(detail=True, methods=['patch'], permission_classes=[IsStaffRole])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Synchronize queue token status
        if hasattr(order, 'queue_token'):
            qt = order.queue_token
            if order.status == Order.Status.PREPARING:
                qt.status = QueueToken.Status.PREPARING
            elif order.status == Order.Status.READY_FOR_PICKUP:
                qt.status = QueueToken.Status.READY
            elif order.status == Order.Status.COMPLETED:
                qt.status = QueueToken.Status.PICKED_UP
            elif order.status == Order.Status.CANCELLED:
                qt.status = QueueToken.Status.CANCELLED
            qt.save()

        notify_order_status_change(order)

        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=False, methods=['get'], permission_classes=[IsStaffRole])
    def incoming_orders(self, request):
        active_orders = Order.objects.filter(
            status__in=[Order.Status.CONFIRMED, Order.Status.PREPARING, Order.Status.READY_FOR_PICKUP]
        ).order_by('-created_at')
        serializer = self.get_serializer(active_orders, many=True)
        return Response(serializer.data)
