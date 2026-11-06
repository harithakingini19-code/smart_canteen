from rest_framework import status, permissions, generics, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import PasswordResetToken
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
    StaffRegistrationSerializer, StaffLoginSerializer, AdminLoginSerializer,
    AdminRegistrationSerializer, AdminUserSerializer, AdminCreateStaffSerializer,
    AdminUpdateStaffSerializer
)
from .permissions import IsAdminRole, IsStaffRole

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'User registered successfully',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Login successful',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class TopUpWalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = float(request.data.get('amount', 0))
        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        user.wallet_balance = float(user.wallet_balance) + amount
        user.save()
        return Response({
            'message': f'Successfully added ₹{amount:.2f} to wallet.',
            'wallet_balance': user.wallet_balance,
            'user': UserProfileSerializer(user, context={'request': request}).data
        }, status=status.HTTP_200_OK)



class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.get(email=serializer.validated_data['email'])
        
        # Create token
        token_obj = PasswordResetToken.objects.create(user=user)

        # In production this sends email, here we return token in response for quick testing
        return Response({
            "message": "Password reset token generated.",
            "reset_token": str(token_obj.token),
            "instructions": "Use this reset_token in /api/v1/accounts/reset-password/ to set a new password."
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token_obj = serializer.validated_data['token_obj']
        user = token_obj.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        token_obj.is_used = True
        token_obj.save()

        return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)


class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """Admin endpoint to list, search, inspect, create, update, and manage Users, Students, and Staff."""
    queryset = User.objects.all().order_by('-created_at')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminCreateStaffSerializer
        if self.action in ['update', 'partial_update']:
            return AdminUpdateStaffSerializer
        return AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by('-created_at')

        # Filter by role(s) e.g. role=STUDENT or role=STAFF,ADMIN
        role_param = self.request.query_params.get('role')
        if role_param:
            roles = [r.strip().upper() for r in role_param.split(',') if r.strip()]
            if roles:
                qs = qs.filter(role__in=roles)

        # Search by name, email, username, phone
        search_query = self.request.query_params.get('search')
        if search_query:
            s = search_query.strip()
            from django.db.models import Q
            qs = qs.filter(
                Q(first_name__icontains=s) |
                Q(last_name__icontains=s) |
                Q(email__icontains=s) |
                Q(username__icontains=s) |
                Q(phone_number__icontains=s)
            )

        # Filter by account status (is_active)
        is_active_param = self.request.query_params.get('is_active')
        if is_active_param is not None and is_active_param != '':
            if is_active_param.lower() in ['true', '1', 'active']:
                qs = qs.filter(is_active=True)
            elif is_active_param.lower() in ['false', '0', 'inactive']:
                qs = qs.filter(is_active=False)

        return qs

    def retrieve(self, request, *args, **kwargs):
        """Retrieve individual student or staff user profile with recent order history."""
        user = self.get_object()
        data = AdminUserSerializer(user).data

        # Fetch recent orders for detailed student inspection (Task S.1)
        try:
            from orders.models import Order
            from orders.serializers import OrderSerializer
            recent_orders = Order.objects.filter(user=user).order_by('-created_at')[:10]
            data['recent_orders'] = OrderSerializer(recent_orders, many=True).data
        except Exception:
            data['recent_orders'] = []

        return Response(data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'message': f"Account for {user.email} created successfully.",
            'user': AdminUserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"error": "You cannot delete your own admin account while logged in."},
                status=status.HTTP_400_BAD_REQUEST
            )
        email = user.email
        user.delete()
        return Response(
            {"message": f"User account {email} has been removed successfully."},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        """Deactivate or reactivate a staff or student account (Task S.2)."""
        user = self.get_object()
        if user == request.user:
            return Response(
                {"error": "You cannot deactivate your own admin account."},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = not user.is_active
        user.save()
        status_label = "activated" if user.is_active else "deactivated"
        return Response({
            "message": f"Account for {user.email} has been {status_label}.",
            "is_active": user.is_active,
            "user": AdminUserSerializer(user).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Quick statistics on user counts across roles for the admin dashboard."""
        total_students = User.objects.filter(role=User.Role.STUDENT).count()
        active_students = User.objects.filter(role=User.Role.STUDENT, is_active=True).count()
        total_staff = User.objects.filter(role=User.Role.STAFF).count()
        active_staff = User.objects.filter(role=User.Role.STAFF, is_active=True).count()
        total_admins = User.objects.filter(role=User.Role.ADMIN).count()

        return Response({
            'students': {
                'total': total_students,
                'active': active_students,
                'inactive': total_students - active_students,
            },
            'staff': {
                'total': total_staff,
                'active': active_staff,
                'inactive': total_staff - active_staff,
            },
            'admins': {
                'total': total_admins,
            }
        }, status=status.HTTP_200_OK)


class StaffRegisterView(APIView):
    """Separate endpoint for Staff Signup (Name, Email, Password)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StaffRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Staff account created successfully.',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class StaffLoginView(APIView):
    """Separate endpoint for Staff Sign In (Name, Email, Password)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StaffLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Staff login successful.',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class AdminLoginView(APIView):
    """Separate endpoint for Admin Sign In."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Admin login successful.',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class AdminRegisterView(APIView):
    """Separate endpoint for Admin Self-Registration (secured by admin_code)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AdminRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Admin account created successfully.',
            'user': UserProfileSerializer(user, context={'request': request}).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

