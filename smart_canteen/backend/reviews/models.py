from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from menu.models import FoodItem
from orders.models import Order


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='reviews')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'food_item', 'order')

    def __str__(self):
        return f"{self.user.email} rated {self.food_item.name} {self.rating}/5"
