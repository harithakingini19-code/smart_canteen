import api from './api';

/** Get current user's cart */
export async function getCart() {
  const response = await api.get('/cart/');
  return response.data;
}

/**
 * Add a food item to cart.
 * @param {number} foodItemId
 * @param {number} quantity
 */
export async function addToCart(foodItemId, quantity = 1) {
  const response = await api.post('/cart/add/', { food_item_id: foodItemId, quantity });
  return response.data;
}

/**
 * Update quantity of a cart item. If quantity <= 0, item is deleted.
 * @param {number} itemId - CartItem ID (not FoodItem ID)
 * @param {number} quantity
 */
export async function updateCartItem(itemId, quantity) {
  const response = await api.patch(`/cart/item/${itemId}/`, { quantity });
  return response.data;
}

/**
 * Remove a cart item entirely.
 * @param {number} itemId - CartItem ID
 */
export async function removeCartItem(itemId) {
  const response = await api.delete(`/cart/item/${itemId}/`);
  return response.data;
}

/** Clear the entire cart */
export async function clearCart() {
  const response = await api.delete('/cart/');
  return response.data;
}
