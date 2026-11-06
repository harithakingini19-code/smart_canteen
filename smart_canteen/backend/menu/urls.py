from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, FoodItemViewSet, CouponViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', FoodItemViewSet, basename='fooditem')
router.register(r'coupons', CouponViewSet, basename='coupon')

urlpatterns = [
    path('', FoodItemViewSet.as_view({'get': 'list'}), name='menu-root'),
    path('', include(router.urls)),
]
