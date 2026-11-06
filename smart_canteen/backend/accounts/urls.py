from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, ProfileView, LogoutView,
    ForgotPasswordView, ResetPasswordView, AdminUserManagementViewSet,
    TopUpWalletView, StaffRegisterView, StaffLoginView, AdminLoginView, AdminRegisterView
)

router = DefaultRouter()
router.register(r'admin/users', AdminUserManagementViewSet, basename='admin-users')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('topup-wallet/', TopUpWalletView.as_view(), name='topup_wallet'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),

    # Separate Staff & Admin Auth Endpoints
    path('staff/register/', StaffRegisterView.as_view(), name='staff_register'),
    path('staff/login/', StaffLoginView.as_view(), name='staff_login'),
    path('admin/login/', AdminLoginView.as_view(), name='admin_login'),
    path('admin/register/', AdminRegisterView.as_view(), name='admin_register'),

    path('', include(router.urls)),
]
