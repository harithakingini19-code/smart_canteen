from django.contrib import admin
from .models import Category, FoodItem, Coupon


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'is_active', 'created_at')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'category', 'price', 'is_available', 'is_vegetarian', 'preparation_time_minutes')
    list_filter = ('category', 'is_available', 'is_vegetarian')
    search_fields = ('name', 'description')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('id', 'code', 'discount_percentage', 'fixed_discount', 'min_order_amount', 'valid_until', 'is_active')
    list_filter = ('is_active', 'valid_until')
    search_fields = ('code',)
