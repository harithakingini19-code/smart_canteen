import os
import re
import json
import logging
from decimal import Decimal
from django.utils import timezone

logger = logging.getLogger(__name__)

# Canonical list of 36 Canteen Items in Picture 2 Order
CANONICAL_CATEGORIES = [
    {'name': 'Breakfast', 'slug': 'breakfast', 'emoji': '🥐'},
    {'name': 'Drinks',    'slug': 'drinks',    'emoji': '🥤'},
    {'name': 'Desserts',  'slug': 'desserts',  'emoji': '🍦'},
    {'name': 'Meals',     'slug': 'meals',     'emoji': '🍱'},
    {'name': 'Snacks',    'slug': 'snacks',    'emoji': '🍕'},
]

CANONICAL_ITEMS = [
    # ── 1. Breakfast (8) ──
    {'name': 'Puttu',               'category': 'Breakfast', 'slug': 'breakfast', 'price': 40.00, 'veg': True,  'prep': 8,  'desc': 'Crispy golden dosa with spiced potato filling, served with coconut chutney & sambar.', 'aliases': ['puttu', 'dosa', 'masala dosa']},
    {'name': 'Idali',               'category': 'Breakfast', 'slug': 'breakfast', 'price': 30.00, 'veg': True,  'prep': 5,  'desc': 'Traditional soft steamed rice and lentil cakes served with steaming sambar and fresh chutney.', 'aliases': ['idali', 'idli', 'idly']},
    {'name': 'Poori Masala',        'category': 'Breakfast', 'slug': 'breakfast', 'price': 50.00, 'veg': True,  'prep': 8,  'desc': 'Two fluffy puffed wheat pooris served with spiced potato bhaji and fresh lemon pickle.', 'aliases': ['poori', 'poori masala', 'puri']},
    {'name': 'Nool Puttu',          'category': 'Breakfast', 'slug': 'breakfast', 'price': 35.00, 'veg': True,  'prep': 10, 'desc': 'Soft string hoppers made from fine rice flour, served with coconut milk, banana, and jaggery.', 'aliases': ['nool puttu', 'puttu', 'string hoppers', 'idiyappam']},
    {'name': 'Gee Dosa',            'category': 'Breakfast', 'slug': 'breakfast', 'price': 45.00, 'veg': True,  'prep': 7,  'desc': 'Crispy paper-thin dosa generously drizzled with golden desi ghee, served with chutney and sambar.', 'aliases': ['gee dosa', 'ghee dosa']},
    {'name': 'Veg Hakka Noodles',   'category': 'Breakfast', 'slug': 'breakfast', 'price': 75.00, 'veg': True,  'prep': 10, 'desc': 'Wok-tossed hakka noodles with crunchy carrots, capsicum, spring onions and light soy sauce.', 'aliases': ['noodles', 'hakka noodles', 'veg hakka noodles', 'chowmein']},
    {'name': 'Paneer Butter Masala','category': 'Breakfast', 'slug': 'breakfast', 'price': 90.00, 'veg': True,  'prep': 12, 'desc': 'Creamy, rich paneer butter masala served with soft butter naan or roti.', 'aliases': ['paneer butter masala', 'butter paneer', 'paneer butter']},
    {'name': 'Medu Vada',           'category': 'Breakfast', 'slug': 'breakfast', 'price': 35.00, 'veg': True,  'prep': 6,  'desc': 'Crispy golden lentil doughnuts flavored with peppercorns and curry leaves, served with chutney & sambar.', 'aliases': ['vada', 'wada', 'medu vada']},

    # ── 2. Drinks (10) ──
    {'name': 'Chaya',               'category': 'Drinks', 'slug': 'drinks', 'price': 15.00, 'veg': True, 'prep': 3, 'desc': 'Classic Kerala-style strong tea brewed with ginger, cardamom, and full-cream milk.', 'aliases': ['chaya', 'chai', 'chay']},
    {'name': 'Mango Smoothie',      'category': 'Drinks', 'slug': 'drinks', 'price': 55.00, 'veg': True, 'prep': 5, 'desc': 'Chilled Alphonso mango blend with thick yogurt, chia seeds, and a drizzle of honey.', 'aliases': ['mango smoothie', 'smoothie', 'mango shake']},
    {'name': 'Filter Coffee',       'category': 'Drinks', 'slug': 'drinks', 'price': 25.00, 'veg': True, 'prep': 3, 'desc': 'South Indian aromatic filter coffee brewed from freshly roasted chicory beans and frothy milk.', 'aliases': ['filter coffee', 'coffee', 'hot coffee']},
    {'name': 'Tea',                 'category': 'Drinks', 'slug': 'drinks', 'price': 12.00, 'veg': True, 'prep': 3, 'desc': 'Classic hot ginger tea with a balanced blend of milk and Assam tea leaves.', 'aliases': ['tea', 'hot tea', 'ginger tea']},
    {'name': 'Lemon Juice',         'category': 'Drinks', 'slug': 'drinks', 'price': 30.00, 'veg': True, 'prep': 3, 'desc': 'Freshly squeezed lemon with crushed mint leaves, rock salt, and ice.', 'aliases': ['lemon juice', 'lemonade', 'nimbu pani']},
    {'name': 'Lime Juice',          'category': 'Drinks', 'slug': 'drinks', 'price': 25.00, 'veg': True, 'prep': 3, 'desc': 'Tangy fresh lime squeezed with chilled water, sugar, rock salt, and mint.', 'aliases': ['lime juice', 'lime']},
    {'name': 'Cold Boost',          'category': 'Drinks', 'slug': 'drinks', 'price': 40.00, 'veg': True, 'prep': 3, 'desc': 'Energizing chilled Boost chocolate malt drink blended with cold milk and ice.', 'aliases': ['cold boost', 'boost']},
    {'name': 'Cold Coffee',         'category': 'Drinks', 'slug': 'drinks', 'price': 45.00, 'veg': True, 'prep': 4, 'desc': 'Chilled blended coffee with milk, sugar, and ice — thick, creamy, and full of flavor.', 'aliases': ['cold coffee', 'iced coffee']},
    {'name': 'Sharjah Shake',       'category': 'Drinks', 'slug': 'drinks', 'price': 70.00, 'veg': True, 'prep': 5, 'desc': 'Iconic Sharjah-style thick shake blended with ripe bananas, dates, cream, saffron, and ice cream.', 'aliases': ['sharjah shake', 'sharjah']},
    {'name': 'Chocolate Shake',     'category': 'Drinks', 'slug': 'drinks', 'price': 60.00, 'veg': True, 'prep': 4, 'desc': 'Thick and creamy chocolate milkshake blended with chocolate ice cream and cocoa powder.', 'aliases': ['chocolate shake', 'choco shake', 'chocolate milkshake']},

    # ── 3. Desserts (5) ──
    {'name': 'Cup Cake',            'category': 'Desserts', 'slug': 'desserts', 'price': 40.00, 'veg': True, 'prep': 3, 'desc': 'Fluffy vanilla and chocolate swirl cupcakes topped with rich buttercream frosting.', 'aliases': ['cup cake', 'cupcake', 'cake']},
    {'name': 'Brownies',            'category': 'Desserts', 'slug': 'desserts', 'price': 55.00, 'veg': True, 'prep': 4, 'desc': 'Warm fudgy dark chocolate brownies with a crusty top and gooey center, served with ice cream.', 'aliases': ['brownies', 'brownie', 'choco brownie']},
    {'name': 'Pudding',             'category': 'Desserts', 'slug': 'desserts', 'price': 45.00, 'veg': True, 'prep': 3, 'desc': 'Silky smooth caramel bread pudding with a golden burnt sugar crust.', 'aliases': ['pudding', 'caramel pudding']},
    {'name': 'Gulab Jamun',         'category': 'Desserts', 'slug': 'desserts', 'price': 40.00, 'veg': True, 'prep': 3, 'desc': 'Warm soft khoya milk dumplings soaked in fragrant cardamom and rose sugar syrup (2 pcs).', 'aliases': ['gulab jamun', 'jamun']},
    {'name': 'Ice Cream',           'category': 'Desserts', 'slug': 'desserts', 'price': 45.00, 'veg': True, 'prep': 3, 'desc': 'Rich creamy vanilla and chocolate scoops served with hot fudge sauce and roasted almonds.', 'aliases': ['ice cream', 'icecream', 'icream', 'ice-cream']},

    # ── 4. Meals (6) ──
    {'name': 'Veg Fried Rice',      'category': 'Meals', 'slug': 'meals', 'price': 85.00,  'veg': True,  'prep': 12, 'desc': 'Wok-tossed basmati rice with crunchy carrots, capsicum, spring onions, garlic, and light soy sauce.', 'aliases': ['veg fried rice', 'fried rice', 'friedrice']},
    {'name': 'Ghee Rice',           'category': 'Meals', 'slug': 'meals', 'price': 80.00,  'veg': True,  'prep': 10, 'desc': 'Aromatic jeera rice tempered in pure desi ghee with whole spices, caramelized onions, and cashews.', 'aliases': ['ghee rice', 'gee rice', 'geerice']},
    {'name': 'Normal Rice Meals',   'category': 'Meals', 'slug': 'meals', 'price': 70.00,  'veg': True,  'prep': 6,  'desc': 'Wholesome full South Indian thali with steamed white rice, dal, sambar, rasam, curd, and appalam.', 'aliases': ['normal rice meals', 'normal rice', 'meals', 'thali', 'rice meal']},
    {'name': 'Chicken Biryani',     'category': 'Meals', 'slug': 'meals', 'price': 120.00, 'veg': False, 'prep': 15, 'desc': 'Classic dum biryani layered with aromatic basmati rice, tender spiced chicken, and raita.', 'aliases': ['chicken biryani', 'biryani', 'briyani']},
    {'name': 'Egg Fried Rice',      'category': 'Meals', 'slug': 'meals', 'price': 95.00,  'veg': False, 'prep': 10, 'desc': 'High-flame wok rice tossed with scrambled farm eggs, spring onions, and savory sauce.', 'aliases': ['egg fried rice', 'egg rice']},
    {'name': 'Paneer Curry',        'category': 'Meals', 'slug': 'meals', 'price': 95.00,  'veg': True,  'prep': 12, 'desc': 'Soft fresh paneer cubes simmered in a rich, buttery tomato and cashew gravy.', 'aliases': ['paneer curry', 'paneer']},

    # ── 5. Snacks (7) ──
    {'name': 'Paneer Roll',         'category': 'Snacks', 'slug': 'snacks', 'price': 65.00, 'veg': True, 'prep': 8, 'desc': 'Tandoori spiced paneer cubes tossed with peppers and onions, wrapped in a warm flaky paratha.', 'aliases': ['paneer roll']},
    {'name': 'Cutlet',              'category': 'Snacks', 'slug': 'snacks', 'price': 35.00, 'veg': True, 'prep': 7, 'desc': 'Crispy golden vegetable cutlets coated in breadcrumbs, served hot with mint chutney.', 'aliases': ['cutlet', 'veg cutlet']},
    {'name': 'Samosa',              'category': 'Snacks', 'slug': 'snacks', 'price': 20.00, 'veg': True, 'prep': 5, 'desc': 'Crispy golden pastry stuffed with spiced potato, green peas, and roasted cumin spices.', 'aliases': ['samosa', 'samoosa', 'samusa']},
    {'name': 'Grilled Sandwich',    'category': 'Snacks', 'slug': 'snacks', 'price': 45.00, 'veg': True, 'prep': 6, 'desc': 'Triple-layer toasted sandwich with fresh veggies, cheese, and green chutney.', 'aliases': ['grilled sandwich', 'sandwich', 'veg sandwich']},
    {'name': 'Veg Burger',          'category': 'Snacks', 'slug': 'snacks', 'price': 60.00, 'veg': True, 'prep': 8, 'desc': 'Crispy veggie patty with fresh lettuce, tomato, cheese slice, and burger sauce.', 'aliases': ['veg burger', 'burger']},
    {'name': 'Donuts',              'category': 'Snacks', 'slug': 'snacks', 'price': 30.00, 'veg': True, 'prep': 4, 'desc': 'Soft fluffy ring donuts with chocolate glaze, rainbow sprinkles, and powdered sugar.', 'aliases': ['donuts', 'donut', 'doughnut']},
    {'name': 'Veg Roll',            'category': 'Snacks', 'slug': 'snacks', 'price': 50.00, 'veg': True, 'prep': 8, 'desc': 'Crispy kathi roll loaded with sauteed crunchy garden vegetables, chat masala, and mint mayo.', 'aliases': ['veg roll', 'roll', 'kathi roll']},
]


def get_live_menu_context():
    """
    Retrieves live food items and categories safely from the database.
    Falls back gracefully to CANONICAL_ITEMS if DB is empty or during migration.
    """
    categories = []
    items = []

    try:
        from menu.views import ensure_canteen_items
        ensure_canteen_items()
    except Exception as e:
        logger.warning(f"ensure_canteen_items warning: {e}")

    try:
        from menu.models import Category, FoodItem
        db_cats = list(Category.objects.filter(is_active=True).values('id', 'name', 'slug'))
        if db_cats:
            categories = db_cats
    except Exception as e:
        logger.warning(f"Could not load categories from DB: {e}")

    if not categories:
        categories = [{'id': c['slug'], 'name': c['name'], 'slug': c['slug']} for c in CANONICAL_CATEGORIES]

    try:
        from menu.models import FoodItem
        # Safe query avoiding unmigrated columns if any
        try:
            qs = FoodItem.objects.all().select_related('category').order_by('sort_order', 'id')
        except Exception:
            qs = FoodItem.objects.all().select_related('category').order_by('id')

        for f in qs:
            cat_name = f.category.name if f.category else 'General'
            items.append({
                'id': f.id,
                'name': f.name,
                'category__name': cat_name,
                'category_name': cat_name,
                'category_slug': (f.category.slug if f.category else 'general').lower(),
                'price': float(f.price),
                'is_available': bool(f.is_available),
                'is_vegetarian': bool(f.is_vegetarian),
                'preparation_time_minutes': f.preparation_time_minutes or 15,
                'description': f.description or '',
            })
    except Exception as e:
        logger.warning(f"Could not load food items from DB: {e}")

    # If database returned no items or fewer than 20, merge/fallback to canonical items
    if len(items) < 20:
        existing_names = {i['name'].lower().strip() for i in items}
        for idx, ci in enumerate(CANONICAL_ITEMS, start=100):
            if ci['name'].lower().strip() not in existing_names:
                items.append({
                    'id': idx,
                    'name': ci['name'],
                    'category__name': ci['category'],
                    'category_name': ci['category'],
                    'category_slug': ci['slug'],
                    'price': float(ci['price']),
                    'is_available': True,
                    'is_vegetarian': ci['veg'],
                    'preparation_time_minutes': ci['prep'],
                    'description': ci['desc'],
                    'aliases': ci.get('aliases', []),
                })

    return categories, items


def get_user_order_context(user):
    """
    Retrieves orders, queue tokens, and payments strictly for the authenticated user.
    Never exposes another user's private data. Handles missing relations safely.
    """
    if not user or not user.is_authenticated:
        return []

    try:
        from orders.models import Order
        orders = Order.objects.filter(user=user).order_by('-created_at')[:8].prefetch_related(
            'items', 'payment', 'queue_token'
        )
        order_data = []
        for o in orders:
            items_summary = []
            try:
                for item in o.items.all():
                    sub = float(item.subtotal) if item.subtotal is not None else 0.0
                    items_summary.append(f"{item.quantity}x {item.food_item_name} (₹{sub:.2f})")
            except Exception:
                pass

            payment_info = None
            try:
                p = getattr(o, 'payment', None)
                if p:
                    payment_info = {
                        'transaction_id': str(getattr(p, 'transaction_id', '')),
                        'method': getattr(p, 'payment_method', 'CASH'),
                        'status': getattr(p, 'status', 'PENDING'),
                        'amount': float(getattr(p, 'amount', 0.0) or 0.0),
                    }
            except Exception:
                payment_info = None

            queue_info = None
            try:
                q = getattr(o, 'queue_token', None)
                if q:
                    queue_info = {
                        'token_number': getattr(q, 'token_number', ''),
                        'status': getattr(q, 'status', 'WAITING'),
                        'estimated_wait_time_minutes': getattr(q, 'estimated_wait_time_minutes', 15) or 15,
                    }
            except Exception:
                queue_info = None

            tot = float(o.total_amount) if o.total_amount is not None else 0.0
            fin = float(o.final_amount) if o.final_amount is not None else tot

            order_data.append({
                'order_number': o.order_number,
                'status': o.status,
                'payment_status': o.payment_status,
                'total_amount': tot,
                'final_amount': fin,
                'items': items_summary,
                'pickup_time': o.pickup_time or 'ASAP',
                'created_at': o.created_at.strftime('%d %b %Y, %I:%M %p') if o.created_at else 'Recent',
                'payment': payment_info,
                'queue': queue_info,
            })
        return order_data
    except Exception as e:
        logger.warning(f"Error fetching user order context: {e}")
        return []


def try_external_ai_service(user_message, user, categories, menu_items, user_orders):
    """
    Calls an external AI API (Gemini or OpenAI) if configured via environment variables.
    Returns response string if successful, or None to fall back to rule-based engine.
    """
    gemini_key = os.getenv('GEMINI_API_KEY')
    openai_key = os.getenv('OPENAI_API_KEY')

    if not gemini_key and not openai_key:
        return None

    try:
        available_menu_str = "\n".join([
            f"- {item['name']} (Category: {item.get('category__name') or item.get('category_name')}, Price: ₹{float(item['price']):.2f}, "
            f"{'Veg' if item['is_vegetarian'] else 'Non-Veg'}, "
            f"{'In Stock' if item['is_available'] else 'OUT OF STOCK'}, "
            f"Prep: ~{item.get('preparation_time_minutes', 15)}m)"
            for item in menu_items
        ])

        if user and user.is_authenticated:
            user_info_str = f"User: {user.first_name or user.username} ({user.email}).\nUser Orders:\n"
            if user_orders:
                for o in user_orders:
                    t_num = o['queue']['token_number'] if o.get('queue') else 'None'
                    user_info_str += (
                        f"• Order #{o['order_number']}: Status={o['status']}, Payment={o['payment_status']} (₹{o['final_amount']:.2f}), "
                        f"Items=[{', '.join(o['items'])}], Token={t_num}, "
                        f"Placed at={o['created_at']}\n"
                    )
            else:
                user_info_str += "The user has not placed any orders yet.\n"
        else:
            user_info_str = "User is not logged in. If they ask about their personal orders or payments, instruct them to log in."

        system_prompt = (
            "You are the AI Assistant for Smart Canteen Management System.\n"
            "Your role is to help users with: available food items, food prices, order details, order history, "
            "payment status, and order preparation/pickup status.\n"
            "STRICT RULES:\n"
            "1. Never invent food items, prices, or availability. Use only the provided Menu database.\n"
            "2. If an item is not in the menu, state clearly that it is not available in our canteen.\n"
            "3. Only discuss the authenticated user's own orders. Never reveal another user's information.\n"
            "4. If an unauthenticated user asks about orders, payments, or pickup status, ask them to log in.\n"
            "5. Be concise, polite, helpful, and format prices with the ₹ symbol.\n\n"
            f"MENU DATABASE:\n{available_menu_str}\n\n"
            f"USER CONTEXT:\n{user_info_str}"
        )

        if gemini_key:
            import urllib.request
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{system_prompt}\n\nUser Question: {user_message}"}]}
                ]
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                reply = data['candidates'][0]['content']['parts'][0]['text']
                return reply.strip()
    except Exception as e:
        logger.warning(f"External AI call failed: {e}. Falling back to rule-based engine.")

    return None


def generate_rule_based_response(user_message, user, categories, menu_items, user_orders):
    """
    Intelligent, deterministic rule-based assistant.
    Provides 100% accurate, factual answers from the canteen database and canonical items.
    """
    msg = (user_message or '').lower().strip()
    user_name = user.first_name or user.username if (user and user.is_authenticated) else 'there'

    # ── 1. GREETINGS & IDENTITY ─────────────────────────────────────────
    greeting_patterns = [
        r'\b(hi|hello|hey|namaste|good morning|good afternoon|good evening|sup|howdy)\b'
    ]
    if any(re.search(p, msg) for p in greeting_patterns) and len(msg.split()) <= 4:
        auth_note = (
            f"You are logged in as **{user_name}**."
            if (user and user.is_authenticated)
            else "You can browse food items and prices, or sign in to check your orders and payments."
        )
        return (
            f"Hello {user_name}! 👋 Welcome to the Smart Canteen AI Assistant.\n\n"
            f"{auth_note}\n\n"
            "I can help you with:\n"
            "• 🍽️ **Available food items** and current menu\n"
            "• 💰 **Food prices** and vegetarian options\n"
            "• 🧾 **Your order details** and order history\n"
            "• 💳 **Payment status** for your orders\n"
            "• ⏱️ **Order preparation** and pickup status\n\n"
            "What would you like to know today?"
        )

    # ── 2. ORDER PREPARATION & PICKUP STATUS ───────────────────────────
    pickup_keywords = ['pickup', 'pick up', 'ready', 'preparing', 'wait time', 'when will my order', 'queue', 'token']
    if any(k in msg for k in pickup_keywords) and ('order' in msg or 'food' in msg or 'token' in msg or 'status' in msg or 'ready' in msg):
        if not user or not user.is_authenticated:
            return (
                "🔐 **Sign In Required**\n\n"
                "To check your order preparation and pickup status, please sign in to your Smart Canteen account. "
                "I will only display your private order information."
            )

        if not user_orders:
            return (
                "🧾 You have no active or previous orders found in your account.\n\n"
                "Once you place an order, you can ask me anytime to check its preparation and pickup status!"
            )

        active_orders = [o for o in user_orders if o['status'] in ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP']]

        if active_orders:
            lines = ["📍 **Active Order Preparation & Pickup Status:**\n"]
            for o in active_orders:
                st = o['status']
                token = o['queue']['token_number'] if o.get('queue') and o['queue'].get('token_number') else 'N/A'
                wait_m = o['queue']['estimated_wait_time_minutes'] if o.get('queue') and o['queue'].get('estimated_wait_time_minutes') else 15

                if st == 'READY_FOR_PICKUP':
                    badge = "🔔 **READY FOR PICKUP!**"
                    action_note = "Your food is ready at the canteen counter. Please show your token to collect it!"
                elif st == 'PREPARING':
                    badge = "👨‍🍳 **Preparing in Kitchen**"
                    action_note = f"Your food is currently being cooked. Estimated wait time: ~{wait_m} minutes."
                else:
                    badge = "⏳ **Order Confirmed**"
                    action_note = f"Order received and waiting for kitchen preparation. Token #{token} assigned."

                items_text = ', '.join(o['items']) if o['items'] else 'Canteen items'
                lines.append(
                    f"• **Order #{o['order_number']}** (Token: `{token}`)\n"
                    f"  Status: {badge}\n"
                    f"  Items: {items_text}\n"
                    f"  Scheduled Pickup: {o['pickup_time']}\n"
                    f"  Note: {action_note}\n"
                )
            lines.append("You can also view live queue progress on the **Live Queue** tab!")
            return "\n".join(lines)
        else:
            latest = user_orders[0]
            token = latest['queue']['token_number'] if latest.get('queue') and latest['queue'].get('token_number') else 'N/A'
            return (
                f"You have no orders currently in preparation or waiting for pickup.\n\n"
                f"Your most recent order **#{latest['order_number']}** (Token: `{token}`) was "
                f"**{latest['status']}** on {latest['created_at']}.\n\n"
                "Would you like to place a new order today?"
            )

    # ── 3. PAYMENT STATUS INQUIRY ──────────────────────────────────────
    payment_keywords = ['payment', 'paid', 'transaction', 'refund', 'upi', 'pay status']
    if any(k in msg for k in payment_keywords):
        if not user or not user.is_authenticated:
            return (
                "🔐 **Sign In Required**\n\n"
                "To inspect your payment details and transaction status, please log in to your account. "
                "Only you can access your private payment records."
            )

        if not user_orders:
            return (
                "💳 No payment transactions found. You haven't placed any orders yet.\n"
                "Once you place an order, you can complete payment via Online (UPI/Card), Cash on Counter, or Wallet."
            )

        order_match = re.search(r'ORD-[0-9]{8}-[0-9]{4}', user_message, re.IGNORECASE)
        if order_match:
            target_num = order_match.group(0).upper()
            found = next((o for o in user_orders if o['order_number'].upper() == target_num), None)
            if found:
                p = found.get('payment')
                p_status = found['payment_status']
                method = p['method'] if p else 'Counter/Online'
                tx_id = p['transaction_id'] if p else 'N/A'
                amount = found['final_amount']
                return (
                    f"💳 **Payment Details for Order #{found['order_number']}:**\n\n"
                    f"• **Payment Status:** `{p_status}`\n"
                    f"• **Total Amount:** ₹{amount:.2f}\n"
                    f"• **Payment Method:** {method}\n"
                    f"• **Transaction Ref:** `{tx_id}`\n"
                    f"• **Order Status:** {found['status']}"
                )
            else:
                return (
                    f"I could not find order `{target_num}` associated with your account. "
                    "Please check the order reference number in your My Orders section."
                )

        lines = ["💳 **Your Recent Payment Records:**\n"]
        for o in user_orders[:4]:
            p_status = o['payment_status']
            icon = "✅" if p_status == 'COMPLETED' else "⏳" if p_status == 'PENDING' else "❌"
            method = o['payment']['method'] if o.get('payment') else 'Counter/Online'
            lines.append(
                f"• {icon} **Order #{o['order_number']}**: ₹{o['final_amount']:.2f}\n"
                f"  Payment: **{p_status}** ({method}) | Order: {o['status']}"
            )
        lines.append("\nTip: If you have a PENDING payment, click 'Pay Now' in My Orders to complete it.")
        return "\n".join(lines)

    # ── 4. ORDER DETAILS & ORDER HISTORY ──────────────────────────────
    order_keywords = ['order', 'orders', 'history', 'my order', 'recent order', 'last order', 'track']
    if any(k in msg for k in order_keywords):
        if not user or not user.is_authenticated:
            return (
                "🔐 **Sign In Required**\n\n"
                "Please sign in to your Smart Canteen account to view your order history and details. "
                "Each user's order records are kept strictly private."
            )

        if not user_orders:
            return (
                "🧾 You haven't placed any orders yet.\n\n"
                "Browse our popular food items and add them to your cart to make your first order!"
            )

        order_match = re.search(r'ORD-[0-9]{8}-[0-9]{4}', user_message, re.IGNORECASE)
        if order_match:
            target_num = order_match.group(0).upper()
            found = next((o for o in user_orders if o['order_number'].upper() == target_num), None)
            if found:
                token = found['queue']['token_number'] if found.get('queue') and found['queue'].get('token_number') else 'N/A'
                items_str = "\n  - " + "\n  - ".join(found['items']) if found['items'] else "\n  - Canteen items"
                return (
                    f"🧾 **Order Details for #{found['order_number']}:**\n\n"
                    f"• **Placed On:** {found['created_at']}\n"
                    f"• **Current Status:** `{found['status']}`\n"
                    f"• **Token Number:** `{token}`\n"
                    f"• **Payment Status:** `{found['payment_status']}` (Total: ₹{found['final_amount']:.2f})\n"
                    f"• **Scheduled Pickup:** {found['pickup_time']}\n"
                    f"• **Items Ordered:**{items_str}"
                )
            else:
                return (
                    f"No order found matching `{target_num}` under your account. "
                    "Please verify the order number in your 'My Orders' panel."
                )

        lines = ["🧾 **Your Recent Orders:**\n"]
        for o in user_orders[:4]:
            token = o['queue']['token_number'] if o.get('queue') and o['queue'].get('token_number') else 'None'
            lines.append(
                f"• **#{o['order_number']}** (Token: `{token}`)\n"
                f"  Status: **{o['status']}** | Payment: **{o['payment_status']}**\n"
                f"  Total: ₹{o['final_amount']:.2f} ({len(o['items'])} items)\n"
                f"  Date: {o['created_at']}\n"
            )
        lines.append("You can expand and track any order with live updates in **My Orders**.")
        return "\n".join(lines)

    # ── 5. SPECIFIC FOOD ITEM LOOKUP (Availability & Price) ───────────
    # First check aliases
    for item in menu_items:
        item_name = item['name'].lower()
        matched = False
        if re.search(r'\b' + re.escape(item_name) + r'\b', msg):
            matched = True
        elif len(item_name) > 3 and item_name in msg:
            matched = True
        else:
            aliases = item.get('aliases') or []
            for a in aliases:
                if re.search(r'\b' + re.escape(a.lower()) + r'\b', msg) or (len(a) > 3 and a.lower() in msg):
                    matched = True
                    break

        if matched:
            price_val = float(item.get('price', 0.0) or 0.0)
            veg_badge = "🌱 Vegetarian" if item.get('is_vegetarian') else "🍗 Non-Vegetarian"
            avail_str = "✅ **In Stock & Available**" if item.get('is_available', True) else "❌ **Currently Sold Out**"
            desc = f"_{item['description']}_\n\n" if item.get('description') else ""
            cat_name = item.get('category_name') or item.get('category__name') or 'Canteen Special'
            prep = item.get('preparation_time_minutes', 10)

            return (
                f"🍽️ **{item['name']}**\n\n"
                f"{desc}"
                f"• **Price:** ₹{price_val:.2f}\n"
                f"• **Availability:** {avail_str}\n"
                f"• **Dietary:** {veg_badge}\n"
                f"• **Category:** {cat_name}\n"
                f"• **Estimated Prep Time:** ~{prep} minutes\n\n"
                + ("You can add this item to your cart from the main menu!" if item.get('is_available', True)
                   else "Please check back later or choose another delicious item from the menu.")
            )

    # ── 6. VEGETARIAN / DIETARY QUERIES ─────────────────────────────────
    if any(k in msg for k in ['veg', 'vegetarian', 'pure veg']) and 'non' not in msg:
        veg_items = [i for i in menu_items if i.get('is_vegetarian') and i.get('is_available', True)]
        if veg_items:
            lines = ["🌱 **Available Vegetarian Items:**\n"]
            for item in veg_items[:12]:
                lines.append(f"• **{item['name']}** - ₹{float(item['price']):.2f} (~{item.get('preparation_time_minutes', 10)}m)")
            lines.append(f"\n_...plus {len(veg_items) - 12} more pure veg choices in our menu!_" if len(veg_items) > 12 else "")
            lines.append("\nAll items are freshly prepared with hygienic ingredients.")
            return "\n".join(lines)
        return "Currently there are no vegetarian items in stock. Please check back shortly!"

    if any(k in msg for k in ['non-veg', 'non veg', 'chicken', 'meat', 'egg']):
        non_veg_items = [i for i in menu_items if not i.get('is_vegetarian') and i.get('is_available', True)]
        if non_veg_items:
            lines = ["🍗 **Available Non-Vegetarian Items:**\n"]
            for item in non_veg_items:
                lines.append(f"• **{item['name']}** - ₹{float(item['price']):.2f} (~{item.get('preparation_time_minutes', 15)}m)")
            return "\n".join(lines)
        return "No non-vegetarian items are currently in stock. Please browse our vegetarian specials!"

    # ── 7. CATEGORY SPECIFIC QUERIES ──────────────────────────────────
    for cat in categories:
        cat_name = cat['name'].lower()
        cat_slug = cat.get('slug', '').lower()
        if cat_name in msg or (cat_slug and cat_slug in msg):
            cat_items = [
                i for i in menu_items
                if (i.get('category_slug') or '').lower() == cat_slug
                or (i.get('category__name') or '').lower() == cat_name
                or (i.get('category_name') or '').lower() == cat_name
            ]
            if cat_items:
                lines = [f"🍽️ **{cat['name']} Menu:**\n"]
                for i in cat_items:
                    avail = "In Stock" if i.get('is_available', True) else "Sold Out"
                    veg = "🌱" if i.get('is_vegetarian') else "🍗"
                    lines.append(f"• {veg} **{i['name']}** - ₹{float(i['price']):.2f} ({avail})")
                lines.append("\nYou can select this category on the Home page to order!")
                return "\n".join(lines)

    # ── 8. GENERAL FOOD AVAILABILITY / MENU / PRICES ──────────────────
    availability_keywords = ['available', 'menu', 'food', 'items', 'eat', 'dish', 'dishes', 'what do you have', 'lunch', 'breakfast', 'dinner', 'snacks', 'drinks', 'dessert']
    price_keywords = ['price', 'prices', 'rate', 'rates', 'cost', 'how much', 'cheap', 'expensive']

    if any(k in msg for k in price_keywords + availability_keywords):
        available_items = [i for i in menu_items if i.get('is_available', True)]
        if not available_items:
            available_items = menu_items

        # Group items by the 5 canonical categories
        category_order = ['Breakfast', 'Drinks', 'Desserts', 'Meals', 'Snacks']
        cat_emojis = {
            'Breakfast': '🥐',
            'Drinks': '🥤',
            'Desserts': '🍦',
            'Meals': '🍱',
            'Snacks': '🍕',
        }

        # If user asked about prices specifically
        if any(k in msg for k in price_keywords):
            lines = ["💰 **Smart Canteen Menu & Prices:**\n"]
            for cat in category_order:
                cat_items = [
                    i for i in available_items
                    if (i.get('category__name') or i.get('category_name') or '').lower() == cat.lower()
                    or (i.get('category_slug') or '').lower() == cat.lower()
                ]
                if cat_items:
                    emoji = cat_emojis.get(cat, '🍽️')
                    lines.append(f"{emoji} **{cat}:**")
                    item_strs = [
                        f"{i['name']} (₹{float(i['price']):.2f})"
                        for i in cat_items
                    ]
                    lines.append("• " + "  • ".join(item_strs) + "\n")
            lines.append("All prices include taxes. Feel free to ask about any specific dish!")
            return "\n".join(lines)

        # General available menu ("What food is available today?")
        lines = ["🍽️ **Today's Available Menu at Smart Canteen:**\n"]
        for cat in category_order:
            cat_items = [
                i for i in available_items
                if (i.get('category__name') or i.get('category_name') or '').lower() == cat.lower()
                or (i.get('category_slug') or '').lower() == cat.lower()
            ]
            if cat_items:
                emoji = cat_emojis.get(cat, '🍽️')
                lines.append(f"{emoji} **{cat} ({len(cat_items)}):**")
                item_strs = []
                for i in cat_items:
                    v = "🌱" if i.get('is_vegetarian') else "🍗"
                    item_strs.append(f"**{i['name']}** (₹{float(i['price']):.2f}) {v}")
                lines.append("• " + "\n• ".join(item_strs) + "\n")

        lines.append("✨ You can add any of these items to your cart right from the Home page!")
        return "\n".join(lines)

    # ── 9. WALLET & CANTEEN INFO ───────────────────────────────────────
    if 'wallet' in msg:
        if user and user.is_authenticated:
            bal = float(getattr(user, 'wallet_balance', 0.00) or 0.00)
            return (
                f"💳 **Your Canteen Wallet:**\n\n"
                f"• Current Balance: **₹{bal:.2f}**\n\n"
                "You can use your wallet balance for instant, 1-click checkout, or top up your balance "
                "via the **Wallet** action on the home screen!"
            )
        else:
            return "💳 Smart Canteen supports digital wallet payments for seamless 1-click orders. Please sign in to view and top up your wallet!"

    # ── 10. DEFAULT HELPFUL FALLBACK ────────────────────────────────────
    return (
        "🤖 I am the Smart Canteen AI Assistant. I can help you with:\n\n"
        "• 🍔 **Available Food Items:** Ask _'What food is available today?'_ or _'Show vegetarian options'_\n"
        "• 💰 **Food Prices:** Ask _'How much is a samosa?'_ or _'Show menu prices'_\n"
        "• 🧾 **Order Details & History:** Ask _'Show my orders'_ or _'Status of ORD-...'_\n"
        "• 💳 **Payment Status:** Ask _'Check my payment status'_\n"
        "• ⏱️ **Pickup Status:** Ask _'When will my order be ready for pickup?'_\n\n"
        "What would you like to know?"
    )


def handle_chatbot_message(user_message, user):
    """
    Main entrypoint for chatbot queries.
    1. Validates input.
    2. Safely fetches live project data.
    3. Tries configured AI service; falls back gracefully to rule-based engine.
    4. Guarantees a friendly, non-crashing response at all times.
    """
    clean_msg = (user_message or '').strip()
    if not clean_msg:
        return {
            'reply': "Please type a question or choose one of the suggestions below to get started!",
            'suggestions': [
                "What food is available today?",
                "Show menu prices",
                "Show my recent orders",
                "When will my order be ready for pickup?",
            ],
            'timestamp': timezone.now().isoformat(),
        }

    try:
        # Fetch live project data with safe fallbacks
        categories, menu_items = get_live_menu_context()
        user_orders = get_user_order_context(user)

        # Try external AI first (if configured in environment)
        ai_reply = try_external_ai_service(clean_msg, user, categories, menu_items, user_orders)

        if ai_reply:
            reply_text = ai_reply
        else:
            reply_text = generate_rule_based_response(clean_msg, user, categories, menu_items, user_orders)

    except Exception as e:
        logger.exception(f"Error handling chatbot message: {e}")
        # Build graceful fallback with canonical items
        reply_text = generate_rule_based_response(clean_msg, user, CANONICAL_CATEGORIES, CANONICAL_ITEMS, [])

    # Contextual smart suggestions
    suggestions = []
    lower_msg = clean_msg.lower()
    if 'order' in lower_msg or 'status' in lower_msg:
        suggestions = ["When will my order be ready for pickup?", "Check my payment status", "What food is available today?"]
    elif 'price' in lower_msg or 'menu' in lower_msg or 'food' in lower_msg:
        suggestions = ["Show vegetarian items", "What food is available today?", "Show menu prices"]
    elif 'payment' in lower_msg:
        suggestions = ["Show my recent orders", "What food is available today?", "Check my payment status"]
    else:
        suggestions = [
            "What food is available today?",
            "Show menu prices",
            "Show my recent orders",
            "When will my order be ready for pickup?",
        ]

    return {
        'reply': reply_text,
        'suggestions': suggestions,
        'timestamp': timezone.now().isoformat(),
    }
