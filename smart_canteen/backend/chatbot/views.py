from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from .services import handle_chatbot_message


class ChatbotMessageView(APIView):
    """
    Sprint 6: AI Chatbot Support endpoint.
    Permits any visitor to ask about food items, prices, and availability.
    Safely retrieves and protects authenticated user order and payment data.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        """
        Returns initial greeting, suggestions, and chatbot status.
        """
        user = request.user if request.user.is_authenticated else None
        user_name = user.first_name or user.username if user else None

        initial_msg = (
            f"Hello {user_name}! 👋 How can I help you today?"
            if user_name
            else "Hello! 👋 Welcome to Smart Canteen AI Assistant. How can I help you today?"
        )

        suggestions = [
            "What food is available today?",
            "Show menu prices",
            "Show my recent orders",
            "When will my order be ready for pickup?",
            "Check my payment status",
        ]

        return Response({
            'status': 'online',
            'greeting': initial_msg,
            'suggestions': suggestions,
            'is_authenticated': bool(user),
            'timestamp': timezone.now().isoformat(),
        })

    def post(self, request):
        """
        Receives user chat message and returns accurate AI or rule-based response.
        """
        message = request.data.get('message', '')
        if not isinstance(message, str):
            return Response(
                {'error': 'Invalid request: "message" field must be a text string.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not message.strip():
            return Response(
                {
                    'reply': "Please type a question or select a suggestion below to get started!",
                    'suggestions': [
                        "What food is available today?",
                        "Show menu prices",
                        "Show my recent orders",
                        "When will my order be ready for pickup?",
                    ],
                    'timestamp': timezone.now().isoformat(),
                },
                status=status.HTTP_200_OK
            )

        try:
            result = handle_chatbot_message(user_message=message, user=request.user)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as err:
            import logging
            logging.getLogger(__name__).exception(f"Chatbot view error: {err}")
            return Response(
                {
                    'reply': (
                        "🍽️ **Smart Canteen Menu is Ready!**\n\n"
                        "Our canteen is open with fresh items across **Breakfast, Drinks, Desserts, Meals, and Snacks**.\n"
                        "Please ask: *'What food is available today?'* or choose a suggestion below!"
                    ),
                    'error': str(err),
                    'suggestions': [
                        "What food is available today?",
                        "Show menu prices",
                        "Show my recent orders",
                        "When will my order be ready for pickup?",
                    ],
                    'timestamp': timezone.now().isoformat(),
                },
                status=status.HTTP_200_OK
            )
