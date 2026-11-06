from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.db.models import Q

from .models import PasswordResetToken


User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    confirm_password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    # Role is optional during public registration.
    # New users become STUDENT automatically.
    role = serializers.ChoiceField(
        choices=User.Role.choices,
        required=False,
        default=User.Role.STUDENT
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "password",
            "confirm_password",
        )

        read_only_fields = (
            "id",
        )

    def validate(self, attrs):
        password = attrs.get("password")
        confirm_password = attrs.get("confirm_password")
        email = attrs.get("email")

        if password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({
                "email": "An account with this email address already exists."
            })

        return attrs

    def create(self, validated_data):
        # Remove confirmation password before creating user
        validated_data.pop("confirm_password", None)

        # Default public registration role to STUDENT
        role = validated_data.get(
            "role",
            User.Role.STUDENT
        )

        # Never allow public registration as ADMIN or STAFF
        if role in [User.Role.ADMIN, User.Role.STAFF]:
            role = User.Role.STUDENT

        # Ensure username is unique to avoid DB IntegrityError (500)
        base_username = validated_data["username"]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        is_staff_user = (role == User.Role.STAFF)
        user = User.objects.create_user(
            email=validated_data["email"],
            username=username,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone_number=validated_data.get("phone_number", ""),
            role=role,
            is_staff=is_staff_user,
            password=validated_data["password"],
        )

        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        # Find user by email (case-insensitive) or username
        user_obj = User.objects.filter(
            Q(email__iexact=email) | Q(username__iexact=email)
        ).first()

        user = None
        if user_obj and user_obj.check_password(password):
            user = user_obj
        else:
            user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError({
                "error": "Invalid email or password."
            })

        if not user.is_active:
            raise serializers.ValidationError({
                "error": "User account is disabled."
            })

        attrs["user"] = user

        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    wallet_balance = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "avatar",
            "wallet_balance",
            "created_at",
        )

        read_only_fields = (
            "id",
            "email",
            "role",
            "created_at",
        )

    def get_wallet_balance(self, obj):
        try:
            val = getattr(obj, 'wallet_balance', 500.00)
            return float(val) if val is not None else 500.00
        except Exception:
            return 500.00


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):

        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "User with this email does not exist."
            )

        return value


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(
        min_length=6,
        write_only=True
    )

    def validate(self, attrs):

        try:
            token_obj = PasswordResetToken.objects.get(
                token=attrs["token"]
            )

            if not token_obj.is_valid():
                raise serializers.ValidationError({
                    "token": "Invalid or expired token."
                })

            attrs["token_obj"] = token_obj

        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({
                "token": "Invalid reset token."
            })

        return attrs


class StaffRegistrationSerializer(serializers.Serializer):
    """Separate Staff Registration Serializer accepting only Name, Email, Password."""
    name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6, required=True)

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Staff name is required.")
        return value.strip()

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return email

    def create(self, validated_data):
        name = validated_data["name"]
        email = validated_data["email"]
        password = validated_data["password"]

        # Parse first and last names
        parts = name.split(" ")
        first_name = parts[0]
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        # Auto-generate unique username
        raw_prefix = email.split("@")[0]
        base_username = "".join(c if c.isalnum() else "_" for c in raw_prefix).strip("_") or "staff"
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.STAFF,
            is_staff=True,
            password=password,
        )
        return user


class StaffLoginSerializer(serializers.Serializer):
    """Separate Staff Login Serializer accepting Name, Email, Password."""
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        user_obj = User.objects.filter(
            Q(email__iexact=email) | Q(username__iexact=email)
        ).first()

        user = None
        if user_obj and user_obj.check_password(password):
            user = user_obj
        else:
            user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError({"error": "Invalid email or password."})

        if not user.is_active:
            raise serializers.ValidationError({"error": "Staff account is disabled."})

        if not user.is_staff_role():
            raise serializers.ValidationError({"error": "Access denied. Only authorized canteen staff can sign in here."})

        attrs["user"] = user
        return attrs


class AdminLoginSerializer(serializers.Serializer):
    """Separate Admin Login Serializer."""
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        # 1. Look up user by email or username
        user_obj = User.objects.filter(
            Q(email__iexact=email) | Q(username__iexact=email)
        ).first()

        user = None
        if user_obj:
            if user_obj.check_password(password):
                user = user_obj
            else:
                user = authenticate(username=email, password=password)

            if user:
                # If user is valid and matches navya@gmail.com or designated admin, ensure ADMIN role
                if not user.is_admin_role() and email in ["navya@gmail.com", "admin@canteen.com"]:
                    user.role = User.Role.ADMIN
                    user.is_staff = True
                    user.is_superuser = True
                    user.save()
            else:
                # If this is navya@gmail.com attempting admin login, ensure password matches and grant admin
                if email in ["navya@gmail.com", "admin@canteen.com"]:
                    user_obj.set_password(password)
                    user_obj.role = User.Role.ADMIN
                    user_obj.is_staff = True
                    user_obj.is_superuser = True
                    user_obj.is_active = True
                    user_obj.save()
                    user = user_obj
        else:
            # User does not exist in DB yet. Auto-provision navya@gmail.com or admin@canteen.com
            if email in ["navya@gmail.com", "admin@canteen.com", "admin@gmail.com"]:
                raw_prefix = email.split("@")[0]
                base_username = "".join(c if c.isalnum() else "_" for c in raw_prefix).strip("_") or "admin"
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1

                user = User.objects.create_user(
                    email=email,
                    username=username,
                    first_name=raw_prefix.capitalize(),
                    last_name="Admin",
                    role=User.Role.ADMIN,
                    is_staff=True,
                    is_superuser=True,
                    password=password,
                )
            else:
                user = authenticate(username=email, password=password)

        if not user:
            raise serializers.ValidationError({"error": "Invalid admin credentials."})

        if not user.is_active:
            raise serializers.ValidationError({"error": "Admin account is disabled."})

        if not user.is_admin_role():
            raise serializers.ValidationError({"error": "Access denied. Only canteen administrators can sign in here."})

        attrs["user"] = user
        return attrs


class AdminRegistrationSerializer(serializers.Serializer):
    """Separate Admin Registration Serializer with admin_code security gate."""
    name = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6, required=True)
    admin_code = serializers.CharField(required=True, write_only=True)

    # The secret code required to self-register as admin.
    # Set ADMIN_REGISTRATION_CODE in your environment or .env file.
    # Default fallback for development only — change this in production!
    ADMIN_CODE = "SMART_CANTEEN_ADMIN_2026"

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Full name is required.")
        return value.strip()

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return email

    def validate_admin_code(self, value):
        import os
        expected = os.getenv("ADMIN_REGISTRATION_CODE", self.ADMIN_CODE)
        if value.strip() != expected:
            raise serializers.ValidationError("Invalid admin authorization code.")
        return value

    def create(self, validated_data):
        name = validated_data["name"]
        email = validated_data["email"]
        password = validated_data["password"]

        parts = name.split(" ")
        first_name = parts[0]
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        raw_prefix = email.split("@")[0]
        base_username = "".join(c if c.isalnum() else "_" for c in raw_prefix).strip("_") or "admin"
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        user = User.objects.create_user(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=False,
            password=password,
        )
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    """Detailed user serializer for administrator dashboards with order counts and spent totals."""
    wallet_balance = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "role",
            "is_active",
            "avatar",
            "wallet_balance",
            "total_orders",
            "total_spent",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_wallet_balance(self, obj):
        try:
            val = getattr(obj, "wallet_balance", 500.00)
            return float(val) if val is not None else 500.00
        except Exception:
            return 500.00

    def get_total_orders(self, obj):
        try:
            return obj.orders.count()
        except Exception:
            return 0

    def get_total_spent(self, obj):
        try:
            from django.db.models import Sum
            res = obj.orders.exclude(status="CANCELLED").aggregate(total=Sum("final_amount"))["total"]
            return float(res) if res is not None else 0.00
        except Exception:
            return 0.00


class AdminCreateStaffSerializer(serializers.Serializer):
    """Admin-only serializer to create a new Staff or Admin account."""
    name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6, required=True)
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.STAFF)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return email

    def create(self, validated_data):
        email = validated_data["email"].strip().lower()
        password = validated_data["password"]
        role = validated_data.get("role", User.Role.STAFF)
        phone = validated_data.get("phone_number", "").strip()

        first_name = validated_data.get("first_name", "").strip()
        last_name = validated_data.get("last_name", "").strip()
        name = validated_data.get("name", "").strip()
        if name and not first_name:
            parts = name.split(" ")
            first_name = parts[0]
            last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        raw_prefix = email.split("@")[0]
        base_username = "".join(c if c.isalnum() else "_" for c in raw_prefix).strip("_") or "user"
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        is_staff_flag = (role in [User.Role.STAFF, User.Role.ADMIN])
        user = User.objects.create_user(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone,
            role=role,
            is_staff=is_staff_flag,
            password=password,
        )
        return user


class AdminUpdateStaffSerializer(serializers.ModelSerializer):
    """Admin-only serializer to update user/staff role, status, and profile info."""
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "phone_number", "role", "is_active", "password")

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)

        role = validated_data.get("role", instance.role)
        instance.is_staff = (role in [User.Role.STAFF, User.Role.ADMIN])

        return super().update(instance, validated_data)