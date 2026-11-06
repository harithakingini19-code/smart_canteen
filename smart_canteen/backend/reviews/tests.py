from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from menu.models import Category, FoodItem
from orders.models import Order, OrderItem
from reviews.models import Review

User = get_user_model()


class ReviewAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create two test users
        self.user1 = User.objects.create_user(
            username='student1',
            email='student1@canteen.local',
            first_name='Alice',
            last_name='Student',
            password='Password@123',
            role='STUDENT'
        )

        self.user2 = User.objects.create_user(
            username='student2',
            email='student2@canteen.local',
            first_name='Bob',
            last_name='Faculty',
            password='Password@123',
            role='FACULTY'
        )

        # Create Category and Food Items
        self.category = Category.objects.create(name='Breakfast', slug='breakfast')
        self.food1 = FoodItem.objects.create(
            name='Masala Dosa',
            category=self.category,
            price=40.00,
            is_available=True
        )
        self.food2 = FoodItem.objects.create(
            name='Cold Coffee',
            category=self.category,
            price=35.00,
            is_available=True
        )

        # Create an Order for user1 with food1
        self.order1 = Order.objects.create(
            user=self.user1,
            total_amount=40.00,
            final_amount=40.00,
            status=Order.Status.COMPLETED,
            payment_status=Order.PaymentStatus.COMPLETED
        )
        self.order_item1 = OrderItem.objects.create(
            order=self.order1,
            food_item=self.food1,
            food_item_name=self.food1.name,
            unit_price=40.00,
            quantity=1,
            subtotal=40.00
        )

    def test_anonymous_cannot_create_review(self):
        res = self.client.post('/api/reviews/', {
            'food_item': self.food1.id,
            'rating': 5,
            'comment': 'Delicious crispy dosa!'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cannot_review_unopened_food_item(self):
        """User cannot review an item they have not ordered."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post('/api/reviews/', {
            'food_item': self.food2.id,  # user1 has not ordered food2
            'rating': 4,
            'comment': 'Good coffee'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('food_item', res.data)

    def test_successful_review_submission_and_saving(self):
        """User can review an item they have ordered, saved in database."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post('/api/reviews/', {
            'food_item': self.food1.id,
            'order': self.order1.id,
            'rating': 5,
            'comment': 'Crispy golden dosa, loved the coconut chutney!'
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.count(), 1)
        rev = Review.objects.first()
        self.assertEqual(rev.user, self.user1)
        self.assertEqual(rev.food_item, self.food1)
        self.assertEqual(rev.rating, 5)
        self.assertEqual(rev.comment, 'Crispy golden dosa, loved the coconut chutney!')

    def test_empty_review_comment_rejected(self):
        """Validates that empty or whitespace-only reviews are rejected."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post('/api/reviews/', {
            'food_item': self.food1.id,
            'rating': 5,
            'comment': '   '
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('comment', res.data)

    def test_invalid_star_rating_rejected(self):
        """Validates that ratings below 1 or above 5 are rejected."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.post('/api/reviews/', {
            'food_item': self.food1.id,
            'rating': 6,
            'comment': 'Too good'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        res2 = self.client.post('/api/reviews/', {
            'food_item': self.food1.id,
            'rating': 0,
            'comment': 'Too bad'
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_view_other_users_reviews(self):
        """Any user (even unauthenticated) can view submitted reviews."""
        # Create a review directly
        Review.objects.create(
            user=self.user1,
            food_item=self.food1,
            order=self.order1,
            rating=5,
            comment='Outstanding dosa!'
        )

        # Unauthenticated request
        self.client.logout()
        res = self.client.get('/api/reviews/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        results = res.data if isinstance(res.data, list) else res.data.get('results', [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['food_item_name'], 'Masala Dosa')
        self.assertEqual(results[0]['rating'], 5)
        self.assertEqual(results[0]['user_name'], 'Alice Student')

    def test_edit_own_review(self):
        """User can edit their own review."""
        review = Review.objects.create(
            user=self.user1,
            food_item=self.food1,
            order=self.order1,
            rating=4,
            comment='Good taste'
        )

        self.client.force_authenticate(user=self.user1)
        res = self.client.patch(f'/api/reviews/{review.id}/', {
            'rating': 5,
            'comment': 'Updated: absolutely incredible taste!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        review.refresh_from_db()
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.comment, 'Updated: absolutely incredible taste!')

    def test_cannot_edit_other_user_review(self):
        """User cannot edit another user's review."""
        review = Review.objects.create(
            user=self.user1,
            food_item=self.food1,
            order=self.order1,
            rating=4,
            comment='Alice review'
        )

        self.client.force_authenticate(user=self.user2)
        res = self.client.patch(f'/api/reviews/{review.id}/', {
            'rating': 1,
            'comment': 'Malicious edit'
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_own_review(self):
        """User can delete their own review."""
        review = Review.objects.create(
            user=self.user1,
            food_item=self.food1,
            order=self.order1,
            rating=4,
            comment='Will be deleted'
        )

        self.client.force_authenticate(user=self.user1)
        res = self.client.delete(f'/api/reviews/{review.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Review.objects.count(), 0)

    def test_ordered_items_endpoint(self):
        """Endpoint returns ordered items with review status for authenticated user."""
        self.client.force_authenticate(user=self.user1)
        res = self.client.get('/api/reviews/ordered_items/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['food_item_id'], self.food1.id)
        self.assertEqual(res.data[0]['food_item_name'], 'Masala Dosa')
        self.assertFalse(res.data[0]['has_reviewed'])
