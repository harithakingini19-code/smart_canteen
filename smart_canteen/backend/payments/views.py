from rest_framework import status, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta, datetime, time
from .models import Payment
from .serializers import PaymentSerializer, ProcessPaymentSerializer, AdminPaymentSerializer
from orders.models import Order
from accounts.permissions import IsStaffRole, IsAdminRole


def _day_range(day):
    """Return timezone-aware (start, end) datetimes for a given date in the current timezone."""
    current_tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(day, time.min), current_tz)
    end = timezone.make_aware(datetime.combine(day, time.max), current_tz)
    return start, end


class ProcessPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ProcessPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        payment_method = serializer.validated_data['payment_method']

        user = request.user
        if user.is_staff_role():
            order = get_object_or_404(Order, id=order_id)
        else:
            order = get_object_or_404(Order, id=order_id, user=user)

        # Handle wallet payment check
        if payment_method == Payment.Method.WALLET:
            if user.wallet_balance < order.final_amount:
                return Response({'error': f'Insufficient wallet balance (₹{user.wallet_balance:.2f}). Please top up your wallet.'}, status=status.HTTP_400_BAD_REQUEST)
            user.wallet_balance = float(user.wallet_balance) - float(order.final_amount)
            user.save()

        # Check or create payment record
        is_completed = payment_method in [Payment.Method.ONLINE, Payment.Method.WALLET] or user.is_staff_role()
        payment, created = Payment.objects.get_or_create(
            order=order,
            defaults={
                'payment_method': payment_method,
                'amount': order.final_amount,
                'status': Payment.Status.COMPLETED if is_completed else Payment.Status.PENDING
            }
        )

        if not created:
            payment.payment_method = payment_method
            if is_completed:
                payment.status = Payment.Status.COMPLETED
            payment.save()

        # Update order payment status
        if payment.status == Payment.Status.COMPLETED:
            order.payment_status = Order.PaymentStatus.COMPLETED
            order.save()

        return Response({
            'message': 'Payment processed successfully',
            'payment': PaymentSerializer(payment).data
        }, status=status.HTTP_200_OK)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_role():
            return Payment.objects.all()
        return Payment.objects.filter(order__user=user)


class AdminPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only viewset to inspect payment records, search, filter, and get financial stats (Task S.3)."""
    queryset = Payment.objects.all().select_related('order', 'order__user').order_by('-timestamp')
    serializer_class = AdminPaymentSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = Payment.objects.all().select_related('order', 'order__user').order_by('-timestamp')

        # Filter by payment status (COMPLETED, PENDING, FAILED, REFUNDED)
        st = self.request.query_params.get('status')
        if st and st.upper() != 'ALL':
            qs = qs.filter(status=st.upper())

        # Filter by payment method (CASH, ONLINE, WALLET)
        pm = self.request.query_params.get('method')
        if pm and pm.upper() != 'ALL':
            qs = qs.filter(payment_method=pm.upper())

        # Filter by date (YYYY-MM-DD) — use explicit range to avoid MySQL TZ issues
        date_str = self.request.query_params.get('date')
        if date_str:
            try:
                d = datetime.strptime(date_str, '%Y-%m-%d').date()
                d_start, d_end = _day_range(d)
                qs = qs.filter(timestamp__range=(d_start, d_end))
            except ValueError:
                pass

        # Search by transaction ID, order number, customer name, customer email
        search = self.request.query_params.get('search')
        if search:
            s = search.strip()
            qs = qs.filter(
                Q(transaction_id__icontains=s) |
                Q(order__order_number__icontains=s) |
                Q(order__user__email__icontains=s) |
                Q(order__user__first_name__icontains=s) |
                Q(order__user__last_name__icontains=s) |
                Q(order__user__username__icontains=s)
            )

        return qs

    @action(detail=False, methods=['get'], url_path='analytics')
    def analytics(self, request):
        """Financial metrics and daily sales breakdown based on real DB records (Task S.3)."""
        # All completed payments
        completed_payments = Payment.objects.filter(status=Payment.Status.COMPLETED)
        total_revenue = completed_payments.aggregate(total=Sum('amount'))['total'] or 0.00
        completed_count = completed_payments.count()

        all_payments = Payment.objects.all()
        total_transactions = all_payments.count()
        pending_count = all_payments.filter(status=Payment.Status.PENDING).count()
        failed_count = all_payments.filter(status=Payment.Status.FAILED).count()
        refunded_count = all_payments.filter(status=Payment.Status.REFUNDED).count()

        # Today's completed revenue (using explicit datetime range to avoid MySQL TZ issues)
        today = timezone.localdate()
        today_start, today_end = _day_range(today)
        today_completed = completed_payments.filter(timestamp__range=(today_start, today_end))
        today_revenue = today_completed.aggregate(total=Sum('amount'))['total'] or 0.00
        today_count = today_completed.count()

        # Average order value of completed payments
        avg_order_value = completed_payments.aggregate(avg=Avg('amount'))['avg'] or 0.00

        # Method breakdown
        method_stats = list(
            completed_payments.values('payment_method').annotate(
                total_amount=Sum('amount'),
                count=Count('id')
            )
        )
        for m in method_stats:
            m['total_amount'] = float(m['total_amount'] or 0)

        # Daily sales breakdown for the last 14 days
        # Use explicit datetime range per day to avoid MySQL CONVERT_TZ / __date issues
        daily_breakdown = []
        for i in range(13, -1, -1):
            day = today - timedelta(days=i)
            day_start, day_end = _day_range(day)
            day_payments = completed_payments.filter(timestamp__range=(day_start, day_end))
            day_rev = day_payments.aggregate(total=Sum('amount'))['total'] or 0.00
            daily_breakdown.append({
                'date': day.strftime('%Y-%m-%d'),
                'day_name': day.strftime('%a'),
                'orders_count': day_payments.count(),
                'revenue': float(day_rev),
            })

        return Response({
            'total_revenue': float(total_revenue),
            'completed_count': completed_count,
            'total_transactions': total_transactions,
            'pending_count': pending_count,
            'failed_count': failed_count,
            'refunded_count': refunded_count,
            'today_revenue': float(today_revenue),
            'today_orders_count': today_count,
            'average_order_value': round(float(avg_order_value), 2),
            'method_breakdown': method_stats,
            'daily_sales': daily_breakdown,
        }, status=status.HTTP_200_OK)

