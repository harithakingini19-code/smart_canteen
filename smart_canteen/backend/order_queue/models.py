from django.db import models
from orders.models import Order


class QueueToken(models.Model):
    class Status(models.TextChoices):
        WAITING = 'WAITING', 'Waiting'
        PREPARING = 'PREPARING', 'Preparing'
        READY = 'READY', 'Ready for Pickup'
        PICKED_UP = 'PICKED_UP', 'Picked Up'
        CANCELLED = 'CANCELLED', 'Cancelled'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='queue_token')
    token_number = models.CharField(max_length=20, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING)
    estimated_wait_time_minutes = models.IntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        if not self.token_number:
            last_token = QueueToken.objects.order_by('-id').first()
            if last_token and last_token.token_number.startswith('Q-'):
                try:
                    last_num = int(last_token.token_number.split('-')[1])
                    next_num = last_num + 1
                except ValueError:
                    next_num = 100
            else:
                next_num = 100
            self.token_number = f"Q-{next_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Token {self.token_number} - Order {self.order.order_number} ({self.status})"
