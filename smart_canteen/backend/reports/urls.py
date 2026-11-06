from django.urls import path
from .views import (
    DashboardSummaryView, TopSellingItemsView,
    SalesAnalyticsView, QueuePerformanceReportView
)

urlpatterns = [
    path('dashboard/', DashboardSummaryView.as_view(), name='report-dashboard'),
    path('top-selling/', TopSellingItemsView.as_view(), name='report-top-selling'),
    path('sales-analytics/', SalesAnalyticsView.as_view(), name='report-sales-analytics'),
    path('queue-performance/', QueuePerformanceReportView.as_view(), name='report-queue-performance'),
]
