from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProcessPaymentView, PaymentViewSet, AdminPaymentViewSet

router = DefaultRouter()
router.register(r'history', PaymentViewSet, basename='payment-history')
router.register(r'admin/transactions', AdminPaymentViewSet, basename='admin-payments')

urlpatterns = [
    path('process/', ProcessPaymentView.as_view(), name='payment-process'),
    path('', include(router.urls)),
]
