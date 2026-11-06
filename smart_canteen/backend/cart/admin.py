from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'coupon', 'total_price', 'discount_amount', 'final_price', 'updated_at')
    inlines = [CartItemInline]
