from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.ChatbotView.as_view(), name='chatbot-chat'),
    path('cancellation-status/<int:order_id>/', views.CancellationStatusView.as_view(), name='cancellation-status'),
    path('cancel-order/<int:order_id>/', views.CancelOrderView.as_view(), name='cancel-order'),
    path('latest-order/', views.LatestOrderView.as_view(), name='latest-order'),
]
