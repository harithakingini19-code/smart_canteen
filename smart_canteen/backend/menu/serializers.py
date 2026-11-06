from rest_framework import serializers
from .models import Category, FoodItem, Coupon


class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'is_active', 'items_count', 'created_at')

    def get_items_count(self, obj):
        return obj.food_items.filter(is_available=True).count()


class FoodItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = FoodItem
        fields = (
            'id', 'category', 'category_name', 'name', 'description', 'price',
            'image', 'is_available', 'quantity_available', 'is_vegetarian', 'preparation_time_minutes',
            'created_at', 'updated_at'
        )

    def to_internal_value(self, data):
        # Allow category to be passed as category ID, slug, or name
        try:
            if hasattr(data, 'copy'):
                data = data.copy()
            cat_val = data.get('category')
            if cat_val is not None and not str(cat_val).isdigit():
                cat = (
                    Category.objects.filter(slug__iexact=str(cat_val)).first()
                    or Category.objects.filter(name__iexact=str(cat_val)).first()
                )
                if not cat:
                    cat = Category.objects.create(
                        name=str(cat_val).title(),
                        slug=str(cat_val).lower().replace(' ', '-')
                    )
                data['category'] = cat.id

            # Parse quantity_available (also accept 'quantity')
            if 'quantity' in data and 'quantity_available' not in data:
                data['quantity_available'] = data['quantity']
            if 'quantity_available' in data:
                try:
                    data['quantity_available'] = max(0, int(data['quantity_available']))
                except (ValueError, TypeError):
                    data['quantity_available'] = 0

            # Ensure is_vegetarian and is_available booleans parse correctly if sent as strings in multipart
            for bool_field in ('is_vegetarian', 'is_available'):
                if bool_field in data:
                    val = data[bool_field]
                    if isinstance(val, str):
                        data[bool_field] = val.lower() in ('true', '1', 'yes')

            # If quantity_available is 0, food item is automatically out of stock
            if data.get('quantity_available') == 0:
                data['is_available'] = False
        except Exception:
            pass
        return super().to_internal_value(data)


class CouponSerializer(serializers.ModelSerializer):
    is_valid_now = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = (
            'id', 'code', 'discount_percentage', 'fixed_discount',
            'min_order_amount', 'valid_from', 'valid_until', 'is_active',
            'is_valid_now', 'created_at'
        )

    def get_is_valid_now(self, obj):
        return obj.is_valid()
