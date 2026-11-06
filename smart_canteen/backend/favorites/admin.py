from django.contrib import admin
from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'food_item', 'created_at')
    search_fields = ('user__email', 'food_item__name')
