from django.urls import path
from .views import CartView, CartItemView, UpdateCartItemView, ApplyCouponView

urlpatterns = [
    path('', CartView.as_view(), name='cart-detail'),
    path('add/', CartItemView.as_view(), name='cart-add-item'),
    path('item/<int:item_id>/', UpdateCartItemView.as_view(), name='cart-update-item'),
    path('apply-coupon/', ApplyCouponView.as_view(), name='cart-apply-coupon'),
]
