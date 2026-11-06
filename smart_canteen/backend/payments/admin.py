from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'order', 'payment_method', 'status', 'amount', 'timestamp')
    list_filter = ('payment_method', 'status', 'timestamp')
    search_fields = ('transaction_id', 'order__order_number')
