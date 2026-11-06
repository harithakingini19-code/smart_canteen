from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Avg, Count
from .models import Review
from .serializers import ReviewSerializer
from menu.models import FoodItem
from orders.models import OrderItem, Order


class IsReviewAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of a review (or staff/admin) to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user or not user.is_authenticated:
            return False
        is_staff_or_admin = getattr(user, 'role', '') in ['ADMIN', 'STAFF'] or getattr(user, 'is_staff', False)
        return obj.user == user or is_staff_or_admin


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().select_related('user', 'food_item')
    serializer_class = ReviewSerializer
    permission_classes = [IsReviewAuthorOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'ordered_items']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsReviewAuthorOrReadOnly()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Review.objects.all().select_related('user', 'food_item').order_by('-created_at')
        food_item_id = self.request.query_params.get('food_item', None)
        if food_item_id:
            queryset = queryset.filter(food_item_id=food_item_id)
        
        my_reviews = self.request.query_params.get('my_reviews', None)
        if my_reviews and str(my_reviews).lower() in ['true', '1']:
            if self.request.user.is_authenticated:
                queryset = queryset.filter(user=self.request.user)
            else:
                queryset = queryset.none()
                
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(food_item__name__icontains=search.strip())

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        review = self.get_object()
        if review.user != self.request.user and not (getattr(self.request.user, 'role', '') in ['ADMIN', 'STAFF']):
            raise PermissionDenied("You do not have permission to edit this review.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user != self.request.user and not (getattr(self.request.user, 'role', '') in ['ADMIN', 'STAFF']):
            raise PermissionDenied("You do not have permission to delete this review.")
        instance.delete()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def ordered_items(self, request):
        """
        Returns all unique food items ordered by the current user,
        annotated with whether the user has already reviewed them.
        """
        items = (
            OrderItem.objects.filter(order__user=request.user)
            .exclude(order__status=Order.Status.CANCELLED)
            .select_related('food_item', 'order')
            .order_by('-order__created_at')
        )

        seen_food_ids = set()
        user_reviews = {r.food_item_id: r for r in Review.objects.filter(user=request.user)}
        result = []

        for item in items:
            food_item = item.food_item
            food_id = item.food_item_id or (food_item.id if food_item else None)
            if not food_id or food_id in seen_food_ids:
                continue
            seen_food_ids.add(food_id)

            rev = user_reviews.get(food_id)

            img_url = None
            if food_item and food_item.image:
                try:
                    img_url = food_item.image.url
                except Exception:
                    img_url = str(food_item.image)

            category_name = ''
            if food_item and hasattr(food_item, 'category') and food_item.category:
                category_name = getattr(food_item.category, 'name', '')

            price = str(food_item.price) if food_item else str(item.unit_price)

            result.append({
                'food_item_id': food_id,
                'food_item_name': item.food_item_name or (food_item.name if food_item else 'Food Item'),
                'category_name': category_name,
                'price': price,
                'image': img_url,
                'order_id': item.order_id,
                'order_number': item.order.order_number if item.order else '',
                'has_reviewed': rev is not None,
                'review_id': rev.id if rev else None,
                'rating': rev.rating if rev else None,
                'comment': rev.comment if rev else None,
            })

        return Response(result)

    @action(detail=False, methods=['get'], url_path='summary/(?P<food_item_id>\d+)')
    def rating_summary(self, request, food_item_id=None):
        reviews = Review.objects.filter(food_item_id=food_item_id)
        stats = reviews.aggregate(avg_rating=Avg('rating'), total_reviews=Count('id'))
        
        return Response({
            'food_item_id': int(food_item_id) if food_item_id else None,
            'avg_rating': round(stats['avg_rating'] or 0.0, 1),
            'total_reviews': stats['total_reviews']
        })

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Overall reviews statistics across all food items"""
        reviews = Review.objects.all()
        stats = reviews.aggregate(avg_rating=Avg('rating'), total_reviews=Count('id'))
        return Response({
            'avg_rating': round(stats['avg_rating'] or 0.0, 1),
            'total_reviews': stats['total_reviews']
        })
