from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Channel(models.TextChoices):
        IN_APP = 'IN_APP', 'In-App'
        EMAIL = 'EMAIL', 'Email'
        WHATSAPP = 'WHATSAPP', 'WhatsApp'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=150)
    message = models.TextField()
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.IN_APP)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"
