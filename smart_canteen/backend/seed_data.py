# -*- coding: utf-8 -*-
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from menu.models import Category, FoodItem

def seed():
    print("Seeding Smart Canteen categories and menu items in Picture 2 order...")
    
    # Categories ordered exactly as requested in Picture 2:
    cats_data = [
        {'name': 'Breakfast', 'slug': 'breakfast', 'description': 'Fresh morning breakfast items'},
        {'name': 'Drinks',    'slug': 'drinks',    'description': 'Hot & cold beverages'},
        {'name': 'Desserts',  'slug': 'desserts',  'description': 'Sweet treats & ice creams'},
        {'name': 'Meals',     'slug': 'meals',     'description': 'Hearty lunch & dinner meals'},
        {'name': 'Snacks',    'slug': 'snacks',    'description': 'Quick bites and fast food'},
    ]

    cat_map = {}
    for cdata in cats_data:
        cat, _ = Category.objects.get_or_create(
            slug=cdata['slug'],
            defaults={'name': cdata['name'], 'description': cdata['description']}
        )
        cat_map[cdata['slug']] = cat

    # All 36 items in the exact canonical order specified in Picture 2:
    items_data = [
        # ── 1. Breakfast (8) ──
        ('breakfast', 'Puttu',               'Crispy golden dosa with spiced potato filling, served with fresh coconut chutney & aromatic sambar.',              40.00, True,  True,  8),
        ('breakfast', 'Idali',               'Traditional soft steamed rice and lentil cakes served with steaming hot sambar and fresh coconut chutney.',        30.00, True,  True,  5),
        ('breakfast', 'Poori Masala',        'Two fluffy puffed wheat pooris served with comforting spiced potato bhaji and fresh lemon pickle.',                50.00, True,  True,  8),
        ('breakfast', 'Samoosa',             'Crispy golden triangular pastry stuffed with spiced potato, green peas, and roasted spices, served with tamarind & mint chutney.', 20.00, True,  True,  5),
        ('breakfast', 'Gee Dosa',            'Crispy paper-thin dosa generously drizzled with golden desi ghee, served with coconut chutney and sambar.',        45.00, True,  True,  7),
        ('breakfast', 'Veg Hakka Noodles',   'Wok-tossed hakka noodles with crunchy carrots, capsicum, spring onions and light soy sauce.',                     75.00, True,  True,  10),
        ('breakfast', 'Paneer Butter Masala','Creamy, rich paneer butter masala served with soft butter naan or roti — a perfect morning indulgence.',           90.00, True,  True,  12),
        ('breakfast', 'Medu Vada',           'Crispy golden lentil doughnuts flavored with crushed peppercorns and curry leaves, served with chutney & sambar.', 35.00, True,  True,  6),

        # ── 2. Drinks (10) ──
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

        # ── 3. Desserts (5) ──
        ('desserts', 'Cup Cake',    'Fluffy vanilla and chocolate swirl cupcakes topped with rich buttercream frosting and colorful sprinkles.', 40.00, True, True, 3),
        ('desserts', 'Brownies',    'Warm fudgy dark chocolate brownies with a crusty top and gooey center, served with vanilla ice cream.',     55.00, True, True, 4),
        ('desserts', 'Pudding',     'Silky smooth caramel bread pudding with a golden burnt sugar crust. Served warm with caramel drizzle.',     45.00, True, True, 3),
        ('desserts', 'Gulab Jamun', 'Warm soft khoya milk dumplings soaked in fragrant cardamom and rose petal sugar syrup (2 pcs).',           40.00, True, True, 3),
        ('desserts', 'Ice Cream',   'Rich creamy vanilla and chocolate scoops served with hot fudge sauce, wafer crisp, and roasted almonds.',  45.00, True, True, 3),

        # ── 4. Meals (6) ──
        ('meals', 'Veg Fried Rice',    'Wok-tossed basmati rice with crunchy carrots, capsicum, spring onions, garlic, and light soy sauce.',                   85.00, True,  True,  12),
        ('meals', 'Ghee Rice',         'Aromatic jeera rice tempered in pure golden desi ghee with whole spices, caramelized onions, and crunchy cashews.',     80.00, True,  True,  10),
        ('meals', 'Normal Rice Meals', 'Wholesome full South Indian thali with steamed white rice, dal, sambar, rasam, curd, and crispy appalam.',              70.00, True,  True,  6),
        ('meals', 'Chicken Biryani',   'Classic dum biryani layered with aromatic basmati rice, tender spiced chicken, saffron, and cucumber raita.',          120.00, True, False, 15),
        ('meals', 'Egg Fried Rice',    'High-flame wok rice tossed with scrambled farm eggs, spring onions, pepper, and savory soya sauce.',                    95.00, True,  False, 10),
        ('meals', 'Paneer Curry',      'Soft fresh paneer cubes simmered in a rich, buttery tomato and cashew gravy with aromatic kasuri methi.',               95.00, True,  True,  12),

        # ── 5. Snacks (7) ──
        ('snacks', 'Paneer Roll',      'Tandoori spiced paneer cubes tossed with peppers and onions, wrapped in a warm flaky paratha.',                          65.00, True, True, 8),
        ('snacks', 'Cutlet',           'Crispy golden vegetable cutlets coated in breadcrumbs, served hot with tomato ketchup and mint chutney.',                35.00, True, True, 7),
        ('snacks', 'Samosa',           'Crispy golden pastry stuffed with spiced potato, green peas, and roasted spices, with tamarind & mint chutney.',         20.00, True, True, 5),
        ('snacks', 'Grilled Sandwich', 'Triple-layer toasted sandwich with fresh veggies, cheese, and green chutney, grilled to a golden crisp.',               45.00, True, True, 6),
        ('snacks', 'Veg Burger',       'Crispy veggie patty with fresh lettuce, tomato, cheese slice, and house burger sauce in a toasted bun.',                 60.00, True, True, 8),
        ('snacks', 'Donuts',           'Soft fluffy ring donuts with chocolate glaze, rainbow sprinkles, and a dusting of powdered sugar.',                      30.00, True, True, 4),
        ('snacks', 'Veg Roll',         'Crispy kathi roll loaded with sauteed crunchy garden vegetables, onions, chat masala, and mint mayo.',                   50.00, True, True, 8),
    ]

    FoodItem.objects.filter(name='Masala Dosa').update(name='Puttu')

    for idx, (slug, name, desc, price, avail, veg, prep) in enumerate(items_data, start=1):
        FoodItem.objects.update_or_create(
            name=name,
            defaults={
                'category': cat_map[slug],
                'description': desc,
                'price': price,
                'is_available': avail,
                'quantity_available': 50,
                'is_vegetarian': veg,
                'preparation_time_minutes': prep,
                'sort_order': idx,
            }
        )

    print(f"Seeding completed successfully! Total items: {FoodItem.objects.count()}")

if __name__ == '__main__':
    seed()
