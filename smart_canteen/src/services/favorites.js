import api from './api';

/** Get all favourites for the current user */
export async function getFavorites() {
  const response = await api.get('/favorites/');
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

/**
 * Add a food item to favourites.
 * @param {number} foodItemId
 */
export async function addFavorite(foodItemId) {
  const response = await api.post('/favorites/', { food_item_id: foodItemId });
  return response.data;
}

/**
 * Remove a favourite by its ID (the Favorite record ID, not FoodItem ID).
 * @param {number} favoriteId
 */
export async function removeFavorite(favoriteId) {
  const response = await api.delete(`/favorites/${favoriteId}/`);
  return response.data;
}

/**
 * Remove a favourite by food item ID (uses the backend's remove-by-item endpoint).
 * @param {number} foodItemId
 */
export async function removeFavoriteByItem(foodItemId) {
  const response = await api.post(`/favorites/remove-by-item/${foodItemId}/`);
  return response.data;
}
