from django.urls import path
from .views import ChatbotMessageView

urlpatterns = [
    path('', ChatbotMessageView.as_view(), name='chatbot_message'),
]
