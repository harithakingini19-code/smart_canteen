from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Favorite
from .serializers import FavoriteSerializer
from menu.models import FoodItem


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        food_item_id = request.data.get('food_item_id')
        food_item = get_object_or_404(FoodItem, id=food_item_id)

        favorite, created = Favorite.objects.get_or_create(user=request.user, food_item=food_item)
        if not created:
            return Response({'message': 'Item is already in favorites'}, status=status.HTTP_200_OK)

        serializer = self.get_serializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='remove-by-item/(?P<food_item_id>\d+)')
    def remove_by_item(self, request, food_item_id=None):
        favorite = Favorite.objects.filter(user=request.user, food_item_id=food_item_id).first()
        if favorite:
            favorite.delete()
            return Response({'message': 'Removed from favorites'}, status=status.HTTP_200_OK)
        return Response({'error': 'Item not found in favorites'}, status=status.HTTP_404_NOT_FOUND)
