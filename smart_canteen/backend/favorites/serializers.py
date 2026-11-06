from rest_framework import serializers
from .models import Favorite
from menu.serializers import FoodItemSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    food_item = FoodItemSerializer(read_only=True)
    food_item_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Favorite
        fields = ('id', 'food_item', 'food_item_id', 'created_at')
        read_only_fields = ('id', 'created_at')
