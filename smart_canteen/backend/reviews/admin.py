from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'food_item', 'rating', 'comment', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('user__email', 'food_item__name', 'comment')
