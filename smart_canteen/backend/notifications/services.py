from django.core.mail import send_mail
from django.conf import settings
from .models import Notification


def send_email_notification(user, subject, message):
    """Sends email notification using Django send_mail"""
    try:
        if user.email:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@smartcanteen.com'),
                recipient_list=[user.email],
                fail_silently=True
            )
            Notification.objects.create(
                user=user,
                title=subject,
                message=message,
                channel=Notification.Channel.EMAIL
            )
    except Exception as e:
        print(f"Error sending email: {e}")


def send_whatsapp_notification(user, message):
    """Placeholder service for WhatsApp notification integration (Twilio / Meta API)"""
    phone = getattr(user, 'phone_number', None)
    if phone:
        print(f"[WHATSAPP MOCK SENDER] Sending WhatsApp message to {phone}: '{message}'")
        Notification.objects.create(
            user=user,
            title="WhatsApp Notification",
            message=message,
            channel=Notification.Channel.WHATSAPP
        )


def notify_order_status_change(order):
    """Utility to trigger in-app, email, and WhatsApp notifications when order status updates"""
    user = order.user
    title = f"Order #{order.order_number} Update"
    
    status_messages = {
        'CONFIRMED': f"Your order #{order.order_number} has been confirmed! Estimated prep time: {order.estimated_prep_time_minutes} mins.",
        'PREPARING': f"Our chefs are preparing your order #{order.order_number}.",
        'READY_FOR_PICKUP': f"Your order #{order.order_number} is READY for pickup! Token: {getattr(order, 'queue_token', None).token_number if hasattr(order, 'queue_token') else 'N/A'}.",
        'COMPLETED': f"Thank you! Your order #{order.order_number} has been completed.",
        'CANCELLED': f"Your order #{order.order_number} has been cancelled."
    }

    msg = status_messages.get(order.status, f"Order status changed to {order.status}.")

    # In-App Notification
    Notification.objects.create(
        user=user,
        title=title,
        message=msg,
        channel=Notification.Channel.IN_APP
    )

    # Trigger Email & WhatsApp
    send_email_notification(user, title, msg)
    send_whatsapp_notification(user, msg)
