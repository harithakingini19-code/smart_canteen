from django.db import migrations

# Exact display order as specified by user:
# Breakfast: Masala Dosa, Idali, Poori Masala, Nool Puttu, Gee Dosa, Veg Hakka Noodles, Paneer Butter Masala, Medu Vada
# Drinks: Chaya, Mango Smoothie, Filter Coffee, Tea, Lemon Juice, Lime Juice, Cold Boost, Cold Coffee, Sharjah Shake, Chocolate Shake
# Desserts: Cup Cake, Brownies, Pudding, Gulab Jamun, Ice Cream
# Meals: Veg Fried Rice, Ghee Rice, Normal Rice Meals, Chicken Biryani, Egg Fried Rice, Paneer Curry
# Snacks: Paneer Roll, Cutlet, Samosa, Grilled Sandwich, Veg Burger, Donuts, Veg Roll

SORT_ORDER_MAP = [
    # (name, sort_order)
    # Breakfast group (1–8)
    ('Puttu',                1),
    ('Masala Dosa',          1),
    ('Idali',                2),
    ('Poori Masala',         3),
    ('Nool Puttu',           4),
    ('Gee Dosa',             5),
    ('Veg Hakka Noodles',    6),
    ('Paneer Butter Masala', 7),
    ('Medu Vada',            8),
    # Drinks group (9–18)
    ('Chaya',                9),
    ('Mango Smoothie',       10),
    ('Filter Coffee',        11),
    ('Tea',                  12),
    ('Lemon Juice',          13),
    ('Lime Juice',           14),
    ('Cold Boost',           15),
    ('Cold Coffee',          16),
    ('Sharjah Shake',        17),
    ('Chocolate Shake',      18),
    # Desserts group (19–23)
    ('Cup Cake',             19),
    ('Brownies',             20),
    ('Pudding',              21),
    ('Gulab Jamun',          22),
    ('Ice Cream',            23),
    # Meals group (24–29)
    ('Veg Fried Rice',       24),
    ('Ghee Rice',            25),
    ('Normal Rice Meals',    26),
    ('Chicken Biryani',      27),
    ('Egg Fried Rice',       28),
    ('Paneer Curry',         29),
    # Snacks group (30–36)
    ('Paneer Roll',          30),
    ('Cutlet',               31),
    ('Samosa',               32),
    ('Grilled Sandwich',     33),
    ('Veg Burger',           34),
    ('Donuts',               35),
    ('Veg Roll',             36),
]


def set_sort_orders(apps, schema_editor):
    FoodItem = apps.get_model('menu', 'FoodItem')
    for name, order in SORT_ORDER_MAP:
        FoodItem.objects.filter(name=name).update(sort_order=order)


def unset_sort_orders(apps, schema_editor):
    FoodItem = apps.get_model('menu', 'FoodItem')
    FoodItem.objects.all().update(sort_order=0)


class Migration(migrations.Migration):

    dependencies = [
        ('menu', '0003_add_sort_order'),
    ]

    operations = [
        migrations.RunPython(set_sort_orders, reverse_code=unset_sort_orders),
    ]
