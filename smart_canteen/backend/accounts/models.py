import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        STAFF = "STAFF", "Staff"
        STUDENT = "STUDENT", "Student"
        FACULTY = "FACULTY", "Faculty"

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    avatar = models.ImageField(
        upload_to="avatars/",
        blank=True,
        null=True
    )

    wallet_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=500.00
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def is_admin_role(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    def is_staff_role(self):
        return (
            self.role in [self.Role.STAFF, self.Role.ADMIN]
            or self.is_staff
            or self.is_superuser
        )

    def __str__(self):
        return f"{self.email} ({self.role})"


class PasswordResetToken(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reset_tokens"
    )

    token = models.CharField(
        max_length=100,
        unique=True,
        default=uuid.uuid4
    )

    created_at = models.DateTimeField(auto_now_add=True)

    is_used = models.BooleanField(default=False)

    def is_valid(self):
        return (
            not self.is_used
            and (timezone.now() - self.created_at).total_seconds() < 3600
        )

    def __str__(self):
        return f"Reset token for {self.user.email}"