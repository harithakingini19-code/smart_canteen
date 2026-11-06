from django.db import models
from django.conf import settings
from menu.models import FoodItem


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'food_item')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} -> {self.food_item.name}"
