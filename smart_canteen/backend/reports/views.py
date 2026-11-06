from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from orders.models import Order, OrderItem
from menu.models import FoodItem
from order_queue.models import QueueToken
from accounts.models import User
from accounts.permissions import IsStaffRole, IsAdminRole


class DashboardSummaryView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        today = timezone.now().date()
        
        # Today's orders & revenue
        today_orders = Order.objects.filter(created_at__date=today).exclude(status=Order.Status.CANCELLED)
        today_revenue = today_orders.aggregate(total=Sum('final_amount'))['total'] or 0.00
        
        # All time metrics
        total_orders = Order.objects.exclude(status=Order.Status.CANCELLED).count()
        total_revenue = Order.objects.exclude(status=Order.Status.CANCELLED).aggregate(total=Sum('final_amount'))['total'] or 0.00
        total_students = User.objects.filter(role=User.Role.STUDENT).count()
        
        # Queue metrics
        active_queue_count = QueueToken.objects.filter(status__in=[QueueToken.Status.WAITING, QueueToken.Status.PREPARING]).count()
        pending_orders_count = Order.objects.filter(status__in=[Order.Status.CONFIRMED, Order.Status.PREPARING]).count()

        return Response({
            'today_sales': float(today_revenue),
            'today_orders_count': today_orders.count(),
            'total_revenue': float(total_revenue),
            'total_orders': total_orders,
            'total_students': total_students,
            'active_queue_count': active_queue_count,
            'pending_orders_count': pending_orders_count
        }, status=status.HTTP_200_OK)


class TopSellingItemsView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        top_items = OrderItem.objects.values(
            'food_item_name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_sales=Sum('subtotal')
        ).order_by('-total_quantity')[:10]

        return Response({'top_selling_items': list(top_items)}, status=status.HTTP_200_OK)


class SalesAnalyticsView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        # Last 7 days sales breakdown
        today = timezone.now().date()
        sales_by_day = []
        
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            day_orders = Order.objects.filter(created_at__date=day).exclude(status=Order.Status.CANCELLED)
            day_revenue = day_orders.aggregate(total=Sum('final_amount'))['total'] or 0.00
            sales_by_day.append({
                'date': day.strftime('%Y-%m-%d'),
                'day_name': day.strftime('%a'),
                'orders_count': day_orders.count(),
                'revenue': float(day_revenue)
            })

        return Response({'daily_sales': sales_by_day}, status=status.HTTP_200_OK)


class QueuePerformanceReportView(APIView):
    permission_classes = [IsStaffRole]

    def get(self, request):
        avg_wait = QueueToken.objects.aggregate(avg_time=Avg('estimated_wait_time_minutes'))['avg_time'] or 15
        completed_tokens = QueueToken.objects.filter(status=QueueToken.Status.PICKED_UP).count()
        cancelled_tokens = QueueToken.objects.filter(status=QueueToken.Status.CANCELLED).count()

        return Response({
            'average_estimated_wait_minutes': round(float(avg_wait), 1),
            'completed_tokens': completed_tokens,
            'cancelled_tokens': cancelled_tokens
        }, status=status.HTTP_200_OK)
