from rest_framework import serializers
from .models import Review
from menu.models import FoodItem
from orders.models import OrderItem, Order


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    food_item_name = serializers.CharField(source='food_item.name', read_only=True)
    food_item_image = serializers.SerializerMethodField()
    comment = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)
    rating = serializers.IntegerField(required=True, min_value=1, max_value=5)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = (
            'id',
            'user',
            'user_name',
            'food_item',
            'food_item_name',
            'food_item_image',
            'order',
            'rating',
            'comment',
            'created_at',
            'is_owner',
        )
        read_only_fields = ('id', 'user', 'created_at', 'is_owner')

    def get_user_name(self, obj):
        if not obj.user:
            return 'Anonymous'
        full = (obj.user.get_full_name() or '').strip()
        if full:
            return full
        if obj.user.username:
            return obj.user.username
        if obj.user.email:
            return obj.user.email.split('@')[0]
        return 'Anonymous'

    def get_food_item_image(self, obj):
        if obj.food_item and obj.food_item.image:
            try:
                return obj.food_item.image.url
            except Exception:
                return str(obj.food_item.image)
        return None

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.user_id == request.user.id
        return False

    def validate_comment(self, value):
        if not value or not str(value).strip():
            raise serializers.ValidationError("Review comment cannot be empty.")
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Review comment must be at least 3 characters long.")
        return value.strip()

    def validate_rating(self, value):
        if value is None:
            raise serializers.ValidationError("Please provide a rating between 1 and 5.")
        try:
            val = int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Rating must be an integer between 1 and 5.")
        if val < 1 or val > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5 stars.")
        return val

    def validate(self, attrs):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        # Check only during review creation
        if self.instance is None and user and user.is_authenticated:
            food_item = attrs.get('food_item')
            if not food_item:
                raise serializers.ValidationError({"food_item": "Food item is required."})

            # Check that user has ordered this food item
            has_ordered = OrderItem.objects.filter(
                order__user=user,
                food_item=food_item
            ).exclude(order__status=Order.Status.CANCELLED).exists()

            if not has_ordered:
                raise serializers.ValidationError({
                    "food_item": f"You can only review food items you have ordered. '{food_item.name}' was not found in your orders."
                })

            # Check if user already reviewed this food item
            existing = Review.objects.filter(user=user, food_item=food_item).first()
            if existing:
                raise serializers.ValidationError({
                    "non_field_errors": [
                        f"You have already reviewed '{food_item.name}'. You can edit or delete your existing review instead."
                    ]
                })

        return attrs
