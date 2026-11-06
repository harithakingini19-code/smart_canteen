import uuid
from django.db import models
from orders.models import Order


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = 'CASH', 'Cash on Counter'
        ONLINE = 'ONLINE', 'Online Payment (UPI/Card)'
        WALLET = 'WALLET', 'Wallet Balance'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    payment_method = models.CharField(max_length=20, choices=Method.choices, default=Method.CASH)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.order.order_number} ({self.status})"
