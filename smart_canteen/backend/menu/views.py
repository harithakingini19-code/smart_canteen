from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, FoodItem, Coupon
from .serializers import CategorySerializer, FoodItemSerializer, CouponSerializer
from accounts.permissions import IsStaffRole, IsAdminRole

# Categories ordered exactly as requested in Picture 2:
# 1. Breakfast, 2. Drinks, 3. Desserts, 4. Meals, 5. Snacks
_CATS = [
    {'name': 'Breakfast', 'slug': 'breakfast', 'description': 'Fresh morning breakfast items'},
    {'name': 'Drinks',    'slug': 'drinks',    'description': 'Hot & cold beverages'},
    {'name': 'Desserts',  'slug': 'desserts',  'description': 'Sweet treats & ice creams'},
    {'name': 'Meals',     'slug': 'meals',     'description': 'Hearty lunch & dinner meals'},
    {'name': 'Snacks',    'slug': 'snacks',    'description': 'Quick bites and fast food'},
]

# Items in the exact canonical order specified in Picture 2:
_ITEMS = [
    # ── Category 1: Breakfast (8) ──
    ('breakfast', 'Puttu',               'Crispy golden dosa with spiced potato filling, served with fresh coconut chutney & aromatic sambar.',              40.00, True,  True,  8),
    ('breakfast', 'Idali',               'Traditional soft steamed rice and lentil cakes served with steaming hot sambar and fresh coconut chutney.',        30.00, True,  True,  5),
    ('breakfast', 'Poori Masala',        'Two fluffy puffed wheat pooris served with comforting spiced potato bhaji and fresh lemon pickle.',                50.00, True,  True,  8),
    ('breakfast', 'Nool Puttu',          'Soft string hoppers made from fine rice flour, served with coconut milk, banana, and jaggery syrup.',              35.00, True,  True,  10),
    ('breakfast', 'Gee Dosa',            'Crispy paper-thin dosa generously drizzled with golden desi ghee, served with coconut chutney and sambar.',        45.00, True,  True,  7),
    ('breakfast', 'Veg Hakka Noodles',   'Wok-tossed hakka noodles with crunchy carrots, capsicum, spring onions and light soy sauce.',                     75.00, True,  True,  10),
    ('breakfast', 'Paneer Butter Masala','Creamy, rich paneer butter masala served with soft butter naan or roti — a perfect morning indulgence.',           90.00, True,  True,  12),
    ('breakfast', 'Medu Vada',           'Crispy golden lentil doughnuts flavored with crushed peppercorns and curry leaves, served with chutney & sambar.', 35.00, True,  True,  6),

    # ── Category 2: Drinks (10) ──
    ('drinks', 'Chaya',           'Classic Kerala-style strong tea brewed with ginger, cardamom, and full-cream milk. Hot and energizing.',          15.00, True, True, 3),
    ('drinks', 'Mango Smoothie',  'Chilled Alphonso mango blend with thick yogurt, chia seeds, and a drizzle of honey. Tropical bliss!',            55.00, True, True, 5),
    ('drinks', 'Filter Coffee',   'South Indian aromatic filter coffee brewed from freshly roasted chicory beans and frothy hot milk.',              25.00, True, True, 3),
    ('drinks', 'Tea',             'Classic hot ginger tea with a balanced blend of milk and Assam tea leaves. The perfect everyday pick-me-up.',    12.00, True, True, 3),
    ('drinks', 'Lemon Juice',     'Freshly squeezed lemon with crushed mint leaves, rock salt, and ice. Refreshingly chilled.',                     30.00, True, True, 3),
    ('drinks', 'Lime Juice',      'Tangy fresh lime squeezed with chilled water, sugar, rock salt, and mint. Light and refreshing.',                25.00, True, True, 3),
    ('drinks', 'Cold Boost',      'Energizing chilled Boost chocolate malt drink blended with cold milk and ice. Great for a quick energy fix.',    40.00, True, True, 3),
    ('drinks', 'Cold Coffee',     'Chilled blended coffee with milk, sugar, and ice — thick, creamy, and full of bold coffee flavor.',              45.00, True, True, 4),
    ('drinks', 'Sharjah Shake',   'Iconic thick shake blended with ripe bananas, dates, cream, saffron, and ice cream.',                           70.00, True, True, 5),
    ('drinks', 'Chocolate Shake', 'Thick and creamy chocolate milkshake blended with chocolate ice cream, cocoa powder, and cold milk.',            60.00, True, True, 4),

    # ── Category 3: Desserts (5) ──
    ('desserts', 'Cup Cake',    'Fluffy vanilla and chocolate swirl cupcakes topped with rich buttercream frosting and colorful sprinkles.', 40.00, True, True, 3),
    ('desserts', 'Brownies',    'Warm fudgy dark chocolate brownies with a crusty top and gooey center, served with vanilla ice cream.',     55.00, True, True, 4),
    ('desserts', 'Pudding',     'Silky smooth caramel bread pudding with a golden burnt sugar crust. Served warm with caramel drizzle.',     45.00, True, True, 3),
    ('desserts', 'Gulab Jamun', 'Warm soft khoya milk dumplings soaked in fragrant cardamom and rose petal sugar syrup (2 pcs).',           40.00, True, True, 3),
    ('desserts', 'Ice Cream',   'Rich creamy vanilla and chocolate scoops served with hot fudge sauce, wafer crisp, and roasted almonds.',  45.00, True, True, 3),

    # ── Category 4: Meals (6) ──
    ('meals', 'Veg Fried Rice',    'Wok-tossed basmati rice with crunchy carrots, capsicum, spring onions, garlic, and light soy sauce.',                   85.00, True,  True,  12),
    ('meals', 'Ghee Rice',         'Aromatic jeera rice tempered in pure golden desi ghee with whole spices, caramelized onions, and crunchy cashews.',     80.00, True,  True,  10),
    ('meals', 'Normal Rice Meals', 'Wholesome full South Indian thali with steamed white rice, dal, sambar, rasam, curd, and crispy appalam.',              70.00, True,  True,  6),
    ('meals', 'Chicken Biryani',   'Classic dum biryani layered with aromatic basmati rice, tender spiced chicken, saffron, and cucumber raita.',          120.00, True, False, 15),
    ('meals', 'Egg Fried Rice',    'High-flame wok rice tossed with scrambled farm eggs, spring onions, pepper, and savory soya sauce.',                    95.00, True,  False, 10),
    ('meals', 'Paneer Curry',      'Soft fresh paneer cubes simmered in a rich, buttery tomato and cashew gravy with aromatic kasuri methi.',               95.00, True,  True,  12),

    # ── Category 5: Snacks (7) ──
    ('snacks', 'Paneer Roll',      'Tandoori spiced paneer cubes tossed with peppers and onions, wrapped in a warm flaky paratha.',                          65.00, True, True, 8),
    ('snacks', 'Cutlet',           'Crispy golden vegetable cutlets coated in breadcrumbs, served hot with tomato ketchup and mint chutney.',                35.00, True, True, 7),
    ('snacks', 'Samosa',           'Crispy golden pastry stuffed with spiced potato, green peas, and roasted spices, with tamarind & mint chutney.',         20.00, True, True, 5),
    ('snacks', 'Grilled Sandwich', 'Triple-layer toasted sandwich with fresh veggies, cheese, and green chutney, grilled to a golden crisp.',               45.00, True, True, 6),
    ('snacks', 'Veg Burger',       'Crispy veggie patty with fresh lettuce, tomato, cheese slice, and house burger sauce in a toasted bun.',                 60.00, True, True, 8),
    ('snacks', 'Donuts',           'Soft fluffy ring donuts with chocolate glaze, rainbow sprinkles, and a dusting of powdered sugar.',                      30.00, True, True, 4),
    ('snacks', 'Veg Roll',         'Crispy kathi roll loaded with sauteed crunchy garden vegetables, onions, chat masala, and mint mayo.',                   50.00, True, True, 8),
]


def ensure_canteen_items():
    """Ensure all 36 canteen food items are in the database with their correct category, sort_order, and quantity."""
    # 1. Safely ensure database columns sort_order & quantity_available exist
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            engine = connection.settings_dict.get('ENGINE', '')
            if 'sqlite' in engine:
                cursor.execute("PRAGMA table_info(menu_fooditem);")
                columns = [row[1] for row in cursor.fetchall()]
                if columns and 'sort_order' not in columns:
                    cursor.execute("ALTER TABLE menu_fooditem ADD COLUMN sort_order INTEGER DEFAULT 0;")
                if columns and 'quantity_available' not in columns:
                    cursor.execute("ALTER TABLE menu_fooditem ADD COLUMN quantity_available INTEGER DEFAULT 50;")
            else:
                # MySQL / MariaDB
                cursor.execute("""
                    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_fooditem';
                """)
                columns = [row[0] for row in cursor.fetchall()]
                if columns and 'sort_order' not in columns:
                    cursor.execute("ALTER TABLE menu_fooditem ADD COLUMN sort_order INT DEFAULT 0;")
                if columns and 'quantity_available' not in columns:
                    cursor.execute("ALTER TABLE menu_fooditem ADD COLUMN quantity_available INT UNSIGNED DEFAULT 50;")
    except Exception:
        pass

    # 2. Try applying any pending Django migrations programmatically
    try:
        from django.core.management import call_command
        call_command('migrate', interactive=False)
    except Exception:
        pass

    # 3. Ensure categories and all 36 items exist
    try:
        cat_map = {}
        for cdata in _CATS:
            cat, _ = Category.objects.get_or_create(
                slug=cdata['slug'],
                defaults={'name': cdata['name'], 'description': cdata['description']}
            )
            cat_map[cdata['slug']] = cat

        # Rename any existing 'Masala Dosa' to 'Puttu'
        try:
            FoodItem.objects.filter(name='Masala Dosa').update(name='Puttu')
        except Exception:
            pass

        for idx, (slug, name, desc, price, avail, veg, prep) in enumerate(_ITEMS, start=1):
            existing = FoodItem.objects.filter(name=name).first()
            if existing:
                # Keep user-updated availability and quantity; sync other canonical metadata
                existing.category = cat_map[slug]
                existing.description = desc
                existing.price = price
                existing.is_vegetarian = veg
                existing.preparation_time_minutes = prep
                existing.sort_order = idx
                if getattr(existing, 'quantity_available', None) is None:
                    existing.quantity_available = 50
                # If quantity is 0, keep it out of stock
                if existing.quantity_available == 0:
                    existing.is_available = False
                existing.save()
            else:
                FoodItem.objects.create(
                    name=name,
                    category=cat_map[slug],
                    description=desc,
                    price=price,
                    is_available=avail,
                    quantity_available=50,
                    is_vegetarian=veg,
                    preparation_time_minutes=prep,
                    sort_order=idx
                )
    except Exception:
        pass


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStaffRole()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        ensure_canteen_items()
        return Category.objects.all()


class FoodItemViewSet(viewsets.ModelViewSet):
    queryset = FoodItem.objects.all()
    serializer_class = FoodItemSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_availability', 'update_quantity']:
            return [IsStaffRole()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        ensure_canteen_items()
        try:
            queryset = FoodItem.objects.all().order_by('sort_order', 'id')
        except Exception:
            queryset = FoodItem.objects.all().order_by('id')

        # Search parameter (supports food name, description, category name)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search) | Q(category__name__icontains=search)
            )

        # Category filter (supports category ID, slug, or name)
        category_param = self.request.query_params.get('category', None)
        if category_param:
            if category_param.isdigit():
                queryset = queryset.filter(category_id=int(category_param))
            else:
                queryset = queryset.filter(
                    Q(category__slug__iexact=category_param) | Q(category__name__iexact=category_param)
                )

        # Availability filter
        is_available = self.request.query_params.get('is_available', None)
        if is_available is not None:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')

        # Vegetarian filter
        is_veg = self.request.query_params.get('is_vegetarian', None)
        if is_veg is not None:
            queryset = queryset.filter(is_vegetarian=is_veg.lower() == 'true')

        # Price range filter
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset.order_by('sort_order', 'id')

    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsStaffRole])
    def toggle_availability(self, request, pk=None):
        """Staff action to quickly set or toggle food item availability (Available vs Out of Stock)"""
        item = self.get_object()
        if 'is_available' in request.data:
            val = request.data['is_available']
            if isinstance(val, str):
                target = val.lower() in ['true', '1', 'available']
            else:
                target = bool(val)
        else:
            target = not item.is_available

        item.is_available = target
        # If staff manually sets item to Available but quantity was 0, restore default stock (20)
        if target and item.quantity_available == 0:
            item.quantity_available = 20
        # If staff sets item Out of Stock, availability is false
        item.save()
        return Response(FoodItemSerializer(item, context={'request': request}).data)

    @action(detail=True, methods=['post', 'patch'], permission_classes=[IsStaffRole])
    def update_quantity(self, request, pk=None):
        """Staff action to update the available quantity of a food item."""
        item = self.get_object()
        raw_qty = request.data.get('quantity_available', request.data.get('quantity'))
        if raw_qty is None:
            return Response({'error': 'Quantity is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            qty = int(raw_qty)
            if qty < 0:
                return Response({'error': 'Quantity must be a non-negative whole number (0 or greater).'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Quantity must be a valid whole number.'}, status=status.HTTP_400_BAD_REQUEST)

        item.quantity_available = qty
        if qty == 0:
            item.is_available = False
        else:
            # If quantity increased above 0 and item was marked unavailable, automatically make available
            if not item.is_available:
                item.is_available = True
        item.save()
        return Response(FoodItemSerializer(item, context={'request': request}).data)


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def validate_coupon(self, request):
        code = request.data.get('code')
        order_amount = float(request.data.get('order_amount', 0))

        if not code:
            return Response({'error': 'Coupon code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            coupon = Coupon.objects.get(code__iexact=code)
            if coupon.is_valid(order_amount):
                discount = coupon.calculate_discount(order_amount)
                return Response({
                    'valid': True,
                    'coupon': CouponSerializer(coupon).data,
                    'discount_amount': float(discount),
                    'final_amount': max(0.0, order_amount - float(discount))
                })
            else:
                return Response({
                    'valid': False,
                    'message': 'Coupon is invalid, expired, or minimum order amount not met.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except Coupon.DoesNotExist:
            return Response({'valid': False, 'message': 'Coupon not found.'}, status=status.HTTP_404_NOT_FOUND)
