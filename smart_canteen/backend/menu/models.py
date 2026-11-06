from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class FoodItem(models.Model):
    category = models.ForeignKey(Category, related_name='food_items', on_delete=models.CASCADE)
    name = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to='food_items/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    quantity_available = models.PositiveIntegerField(default=50, help_text="Number of items available in stock")
    is_vegetarian = models.BooleanField(default=True)
    preparation_time_minutes = models.IntegerField(default=15, help_text="Estimated prep time in minutes")
    sort_order = models.IntegerField(default=0, help_text="Display order (lower = shown first)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'id']

    def save(self, *args, **kwargs):
        # Automatically mark as Out of Stock if quantity is 0
        if self.quantity_available == 0:
            self.is_available = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - ₹{self.price} ({self.quantity_available} in stock)"


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Discount percentage e.g. 10.00 for 10%")
    fixed_discount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00, help_text="Fixed amount discount e.g. 50.00")
    min_order_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self, order_amount=0):
        now = timezone.now()
        if not self.is_active:
            return False
        if not (self.valid_from <= now <= self.valid_until):
            return False
        if order_amount < self.min_order_amount:
            return False
        return True

    def calculate_discount(self, total_amount):
        if not self.is_valid(total_amount):
            return Decimal('0.00')
        if self.discount_percentage > 0:
            return (total_amount * self.discount_percentage) / Decimal('100.00')
        return min(self.fixed_discount, total_amount)

    def __str__(self):
        return self.code
