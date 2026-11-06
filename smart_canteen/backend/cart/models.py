from django.db import models
from django.conf import settings
from menu.models import FoodItem, Coupon
from decimal import Decimal


class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_price(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def discount_amount(self):
        if self.coupon and self.coupon.is_valid(self.total_price):
            return self.coupon.calculate_discount(self.total_price)
        return Decimal('0.00')

    @property
    def final_price(self):
        return max(Decimal('0.00'), self.total_price - self.discount_amount)

    def __str__(self):
        return f"Cart of {self.user.email}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'food_item')

    @property
    def subtotal(self):
        return self.food_item.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.food_item.name}"
