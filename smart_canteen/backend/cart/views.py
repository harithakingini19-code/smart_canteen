from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from menu.models import FoodItem, Coupon


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def get(self, request):
        cart = self.get_cart(request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def delete(self, request):
        """Clear cart"""
        cart = self.get_cart(request.user)
        cart.items.all().delete()
        cart.coupon = None
        cart.save()
        return Response({'message': 'Cart cleared successfully'}, status=status.HTTP_200_OK)


class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Add item to cart"""
        food_item_id = request.data.get('food_item_id')
        quantity = int(request.data.get('quantity', 1))

        if not food_item_id or quantity <= 0:
            return Response({'error': 'Valid food_item_id and quantity are required'}, status=status.HTTP_400_BAD_REQUEST)

        food_item = get_object_or_404(FoodItem, id=food_item_id)
        if not food_item.is_available or getattr(food_item, 'quantity_available', 1) <= 0:
            return Response({'error': f"'{food_item.name}' is currently out of stock and cannot be added to cart."}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(cart=cart, food_item=food_item)

        new_total_qty = (cart_item.quantity + quantity) if not created else quantity
        avail_qty = getattr(food_item, 'quantity_available', None)
        if avail_qty is not None and new_total_qty > avail_qty:
            return Response({
                'error': f"Only {avail_qty} item(s) of '{food_item.name}' are available in stock."
            }, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = new_total_qty
        cart_item.save()

        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_200_OK)


class UpdateCartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, item_id):
        """Update item quantity"""
        quantity = int(request.data.get('quantity', 1))
        cart = get_object_or_404(Cart, user=request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        if quantity <= 0:
            cart_item.delete()
        else:
            food_item = cart_item.food_item
            if not food_item.is_available or getattr(food_item, 'quantity_available', 1) <= 0:
                return Response({'error': f"'{food_item.name}' is currently out of stock."}, status=status.HTTP_400_BAD_REQUEST)
            avail_qty = getattr(food_item, 'quantity_available', None)
            if avail_qty is not None and quantity > avail_qty:
                return Response({'error': f"Only {avail_qty} item(s) of '{food_item.name}' are available."}, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = quantity
            cart_item.save()

        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_200_OK)

    def delete(self, request, item_id):
        """Remove item from cart"""
        cart = get_object_or_404(Cart, user=request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()
        return Response(CartSerializer(cart, context={'request': request}).data, status=status.HTTP_200_OK)


class ApplyCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        cart = get_object_or_404(Cart, user=request.user)

        if not code:
            cart.coupon = None
            cart.save()
            return Response({'message': 'Coupon removed', 'cart': CartSerializer(cart, context={'request': request}).data})

        try:
            coupon = Coupon.objects.get(code__iexact=code)
            if coupon.is_valid(cart.total_price):
                cart.coupon = coupon
                cart.save()
                return Response({
                    'message': 'Coupon applied successfully!',
                    'cart': CartSerializer(cart, context={'request': request}).data
                })
            else:
                return Response({'error': 'Coupon is invalid or expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except Coupon.DoesNotExist:
            return Response({'error': 'Invalid coupon code.'}, status=status.HTTP_404_NOT_FOUND)
