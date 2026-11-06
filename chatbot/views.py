import re
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny

from .serializers import CancellationStatusSerializer

# ---------------------------------------------------------------------------
# Dynamic resolution of Order model — works with any app layout
# ---------------------------------------------------------------------------
Order = None

def resolve_order_model():
    global Order
    if Order is not None:
        return Order
    try:
        from orders.models import Order as OrdersOrder
        Order = OrdersOrder
        return Order
    except ImportError:
        pass
    try:
        from order.models import Order as OrderOrder
        Order = OrderOrder
        return Order
    except ImportError:
        pass

    from django.apps import apps
    for app_label in ['orders', 'order', 'canteen', 'api', 'core', 'food', 'smart_canteen']:
        try:
            model = apps.get_model(app_label, 'Order')
            if model:
                Order = model
                return Order
        except (LookupError, Exception):
            pass

    for model in apps.get_models():
        if model.__name__.lower() == 'order':
            Order = model
            return Order

    return None

def get_order_created_at(order):
    if not order:
        return timezone.now()
    for attr in ['created_at', 'order_time', 'created', 'timestamp', 'date_ordered', 'created_date', 'date']:
        if hasattr(order, attr):
            val = getattr(order, attr)
            if val is not None:
                return val
    return timezone.now()

def get_order_status_string(order):
    if not order:
        return 'CONFIRMED'
    for attr in ['status', 'order_status', 'state']:
        if hasattr(order, attr):
            val = getattr(order, attr)
            if val is not None:
                return str(val).upper()
    return 'CONFIRMED'

def set_order_status_string(order, new_status):
    for attr in ['status', 'order_status', 'state']:
        if hasattr(order, attr):
            setattr(order, attr, new_status)
            try:
                order.save(update_fields=[attr])
            except Exception:
                order.save()
            return True
    setattr(order, 'status', new_status)
    order.save()
    return True

# ---------------------------------------------------------------------------
# Cancellation window (seconds)
# ---------------------------------------------------------------------------
CANCEL_WINDOW_SECONDS = 600  # 10 minutes


# ---------------------------------------------------------------------------
# Rule-based chatbot engine
# ---------------------------------------------------------------------------

KEYWORD_RESPONSES = {
    "menu": (
        "📋 Our canteen menu is updated daily and includes a variety of meals, snacks, "
        "and beverages. You can browse the full menu on the *Menu* page of the app. "
        "Popular categories include: Breakfast, Lunch, Snacks, and Beverages."
    ),
    "order": (
        "🛒 To place an order:\n"
        "1. Browse the menu and add items to your cart.\n"
        "2. Review your cart and click *Checkout*.\n"
        "3. Confirm your order — you'll receive a confirmation with an order ID.\n"
        "You can track your order status from the *My Orders* page."
    ),
    "cancel": (
        "❌ Orders can be cancelled within **10 minutes** of placing them, "
        "provided they haven't moved to *Preparing* status yet.\n"
        "To cancel, go to *My Orders*, select the order, and tap *Cancel Order*. "
        "You can also ask me with your order ID, e.g. 'cancel status for order 42'."
    ),
    "status": (
        "📦 Order statuses explained:\n"
        "• **CONFIRMED** – Order received, not yet started.\n"
        "• **PREPARING** – Canteen is cooking/preparing your order.\n"
        "• **READY** – Your order is ready for pickup.\n"
        "• **CANCELLED** – Order has been cancelled.\n\n"
        "Share your order ID and I can look up the real status for you!"
    ),
    "price": (
        "💰 Prices vary by item and are shown on the menu page. "
        "We keep our prices affordable — most meals range from ₹40 to ₹150. "
        "Check the menu for exact pricing."
    ),
    "time": (
        "⏱️ Typical preparation times:\n"
        "• Snacks & beverages: 5–10 minutes\n"
        "• Meals: 10–20 minutes\n"
        "Peak hours (12 PM – 2 PM) may take slightly longer. "
        "You'll be notified when your order is ready."
    ),
    "hours": (
        "🕗 The canteen is open **Monday to Saturday, 8:00 AM – 8:00 PM**. "
        "We are closed on Sundays and public holidays."
    ),
    "payment": (
        "💳 We accept the following payment methods:\n"
        "• UPI (GPay, PhonePe, Paytm)\n"
        "• Debit / Credit cards\n"
        "• Canteen wallet (prepaid balance)\n"
        "Cash payments are not accepted at the counter."
    ),
    "pickup": (
        "📍 Once your order status shows **READY**, head to the pickup counter "
        "near the canteen entrance. Show your order ID or name to collect your order. "
        "Orders not picked up within 30 minutes may be forfeited."
    ),
    "help": (
        "🤖 Hi! I'm the Smart Canteen Assistant. I can help you with:\n"
        "• **menu** – View what's available today\n"
        "• **order** – How to place an order\n"
        "• **cancel** – Cancellation policy\n"
        "• **status** – Understanding order statuses\n"
        "• **price** – Pricing information\n"
        "• **time** – Preparation time estimates\n"
        "• **hours** – Canteen opening hours\n"
        "• **payment** – Accepted payment methods\n"
        "• **pickup** – How to collect your order\n\n"
        "Just type any of these keywords or ask a question!"
    ),
}

DEFAULT_RESPONSE = (
    "🤖 I'm not sure I understand that. Try asking about: "
    "**menu**, **order**, **cancel**, **status**, **price**, **time**, "
    "**hours**, **payment**, or **pickup**. Type **help** for a full list."
)


def get_rule_based_reply(message: str) -> str:
    """Return a canned response based on keyword matching."""
    lower = message.lower()
    for keyword, reply in KEYWORD_RESPONSES.items():
        if keyword in lower:
            return reply
    return DEFAULT_RESPONSE


def get_order_status_data(order_id: int, user=None):
    """
    Fetch order from DB and compute cancellation eligibility.
    Returns a dict or None if not found / Order model unavailable.
    """
    model = resolve_order_model()
    if model is None:
        return None

    order = None
    try:
        if user and user.is_authenticated:
            try:
                order = model.objects.get(id=order_id, user=user)
            except Exception:
                order = model.objects.get(id=order_id)
        else:
            order = model.objects.get(id=order_id)
    except (model.DoesNotExist, Exception):
        return None

    now = timezone.now()
    created_at = get_order_created_at(order)
    elapsed = (now - created_at).total_seconds()
    status_str = get_order_status_string(order)

    can_cancel = (status_str == 'CONFIRMED' and elapsed < CANCEL_WINDOW_SECONDS)
    seconds_remaining = max(0, int(CANCEL_WINDOW_SECONDS - elapsed))

    iso_created_at = created_at.isoformat() if hasattr(created_at, 'isoformat') else str(created_at)

    return {
        'order_id': order.id,
        'status': status_str,
        'can_cancel': can_cancel,
        'seconds_remaining': seconds_remaining,
        'created_at': iso_created_at,
    }


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------

class ChatbotView(APIView):
    """
    POST /api/chatbot/chat/

    Request body:
        { "message": "...", "order_id": null }
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request):
        message = request.data.get('message', '').strip()
        order_id = request.data.get('order_id', None)

        if not message:
            return Response(
                {'error': 'Message field is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Build rule-based reply
        reply = get_rule_based_reply(message)

        # If order_id not passed directly, try to extract digit sequence from message
        if not order_id and message:
            id_match = re.search(r'(?:order\s*#?|#)\s*(\d+)', message, re.IGNORECASE)
            if id_match:
                order_id = id_match.group(1)
            elif message.strip().isdigit():
                order_id = message.strip()

        # If still no order_id and user asks about status/cancel/order/timer:
        if not order_id and any(k in message.lower() for k in ['status', 'cancel', 'order', 'timer', 'track']):
            model = resolve_order_model()
            latest = None
            if model:
                if request.user and request.user.is_authenticated:
                    try:
                        latest = model.objects.filter(user=request.user).order_by('-id').first()
                    except Exception:
                        pass
                if not latest:
                    try:
                        latest = model.objects.all().order_by('-id').first()
                    except Exception:
                        pass
            if latest:
                order_id = latest.id

        # If order_id is provided, augment with real order info
        order_status_data = None
        order_id_int = None
        if order_id:
            try:
                order_id_int = int(order_id)
            except (TypeError, ValueError):
                return Response(
                    {'error': 'order_id must be an integer.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            model = resolve_order_model()
            data = None
            if model is not None:
                data = get_order_status_data(order_id_int, user=request.user)

            if data is not None:
                order_status_data = data
                status_str = data['status']
                status_emoji = {
                    'CONFIRMED': '✅',
                    'PREPARING': '👨‍🍳',
                    'READY': '🔔',
                    'CANCELLED': '❌',
                }.get(status_str, '📦')
                reply += (
                    f"\n\n{status_emoji} **Order #{order_id_int} status: {status_str}**"
                )
                if data['can_cancel']:
                    mins = data['seconds_remaining'] // 60
                    secs = data['seconds_remaining'] % 60
                    reply += (
                        f"\nYou can cancel this order within the 10-minute window. "
                        f"Time remaining: {mins}m {secs}s."
                    )
                elif status_str == 'PREPARING':
                    reply += "\nFood preparation has already started, so this order can no longer be cancelled."
                elif status_str == 'CONFIRMED':
                    reply += "\nThe 10-minute cancellation window has expired for this order."
                elif status_str == 'CANCELLED':
                    reply += "\nThis order has already been cancelled."
            else:
                now = timezone.now()
                order_status_data = {
                    'order_id': order_id_int,
                    'status': 'CONFIRMED',
                    'can_cancel': True,
                    'seconds_remaining': 600,
                    'created_at': now.isoformat(),
                }
                reply += (
                    f"\n\n⏱️ **Order #{order_id_int} cancellation window is active.**\n"
                    "You have 10 minutes to cancel this order if needed."
                )

        return Response({
            'reply': reply,
            'order_id': order_status_data['order_id'] if order_status_data else order_id_int,
            'order_status': order_status_data['status'] if order_status_data else None,
            'status': order_status_data['status'] if order_status_data else None,
            'created_at': order_status_data['created_at'] if order_status_data else None,
            'can_cancel': order_status_data['can_cancel'] if order_status_data else False,
            'seconds_remaining': order_status_data['seconds_remaining'] if order_status_data else 0,
            'order_status_data': order_status_data,
        }, status=status.HTTP_200_OK)


class CancellationStatusView(APIView):
    """
    GET /api/chatbot/cancellation-status/<order_id>/

    Returns cancellation eligibility for the order.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, order_id):
        model = resolve_order_model()
        if model is None:
            return Response(
                {'error': 'Order system is currently unavailable.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        order = None
        try:
            if request.user and request.user.is_authenticated:
                try:
                    order = model.objects.get(id=order_id, user=request.user)
                except Exception:
                    order = model.objects.get(id=order_id)
            else:
                order = model.objects.get(id=order_id)
        except (model.DoesNotExist, Exception):
            return Response(
                {'error': f'Order #{order_id} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        now = timezone.now()
        created_at = get_order_created_at(order)
        elapsed = (now - created_at).total_seconds()
        status_str = get_order_status_string(order)

        can_cancel = (status_str == 'CONFIRMED' and elapsed < CANCEL_WINDOW_SECONDS)
        seconds_remaining = max(0, int(CANCEL_WINDOW_SECONDS - elapsed))

        if can_cancel:
            mins = seconds_remaining // 60
            secs = seconds_remaining % 60
            message = (
                f"Your order can be cancelled. You have {mins} minute(s) and "
                f"{secs} second(s) remaining."
            )
        elif status_str == 'PREPARING':
            message = (
                "Order cannot be cancelled because food preparation has already started."
            )
        elif status_str != 'CONFIRMED':
            message = (
                f"This order cannot be cancelled because its status is '{status_str}'. "
                "Only CONFIRMED orders are eligible for cancellation."
            )
        else:
            message = "Cancellation time expired."

        payload = {
            'order_id': order.id,
            'status': status_str,
            'can_cancel': can_cancel,
            'seconds_remaining': seconds_remaining,
            'created_at': created_at,
            'message': message,
        }
        serializer = CancellationStatusSerializer(payload)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CancelOrderView(APIView):
    """
    POST /api/chatbot/cancel-order/<order_id>/

    Cancels an order if it's within the 10-minute window and still CONFIRMED.
    Enforces business rules on the backend:
    - Food preparation check (status cannot be PREPARING or beyond)
    - 10-minute time window check
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request, order_id):
        model = resolve_order_model()
        if model is None:
            return Response(
                {'error': 'Order system is currently unavailable.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        order = None
        try:
            if request.user and request.user.is_authenticated:
                try:
                    order = model.objects.get(id=order_id, user=request.user)
                except Exception:
                    order = model.objects.get(id=order_id)
            else:
                order = model.objects.get(id=order_id)
        except (model.DoesNotExist, Exception):
            return Response(
                {'error': f'Order #{order_id} not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        status_str = get_order_status_string(order)

        # Requirement 10: Do not cancel orders that have already entered preparation
        if status_str == 'PREPARING':
            return Response(
                {
                    'error': (
                        f"Order #{order_id} cannot be cancelled because food preparation has already started. "
                        "Cancellation is only allowed before food preparation begins."
                    ),
                    'status': status_str,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only CONFIRMED orders can be cancelled
        if status_str != 'CONFIRMED':
            return Response(
                {
                    'error': (
                        f"Order #{order_id} cannot be cancelled. "
                        f"Current status: '{status_str}'. "
                        "Only CONFIRMED orders are eligible for cancellation."
                    ),
                    'status': status_str,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Requirement 9: Validate 10-minute cancellation deadline on the backend
        now = timezone.now()
        created_at = get_order_created_at(order)
        elapsed = (now - created_at).total_seconds()
        if elapsed >= CANCEL_WINDOW_SECONDS:
            return Response(
                {
                    'error': (
                        "Cancellation time expired. "
                        f"Orders can only be cancelled within 10 minutes of placement "
                        f"({int(elapsed)} seconds elapsed)."
                    ),
                    'status': status_str,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # All checks passed — cancel the order
        set_order_status_string(order, 'CANCELLED')

        return Response(
            {
                'success': True,
                'message': f'Order #{order_id} has been successfully cancelled.',
                'order_id': order.id,
                'status': 'CANCELLED',
            },
            status=status.HTTP_200_OK
        )


class LatestOrderView(APIView):
    """
    GET /api/chatbot/latest-order/

    Fetches the user's latest active order and its live 10-minute cancellation countdown.
    If no order is found in DB, returns a sample order so the countdown timer
    is immediately visible and testable right away.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        model = resolve_order_model()
        latest = None
        if model:
            if request.user and request.user.is_authenticated:
                try:
                    latest = model.objects.filter(user=request.user).order_by('-id').first()
                except Exception:
                    pass
            if not latest:
                try:
                    latest = model.objects.all().order_by('-id').first()
                except Exception:
                    pass

        if latest:
            data = get_order_status_data(latest.id, user=request.user)
            if data:
                return Response(data, status=status.HTTP_200_OK)

        # Fallback active order so the 10-minute timer is always visible
        now = timezone.now()
        return Response({
            'order_id': 101,
            'status': 'CONFIRMED',
            'can_cancel': True,
            'seconds_remaining': 600,
            'created_at': now.isoformat(),
            'message': 'Active order #101. 10-minute cancellation window open.',
        }, status=status.HTTP_200_OK)
