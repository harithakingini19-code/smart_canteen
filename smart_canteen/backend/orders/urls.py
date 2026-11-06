from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlaceOrderView, OrderViewSet

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('place-order/', PlaceOrderView.as_view(), name='place-order'),
    path('', include(router.urls)),
]
