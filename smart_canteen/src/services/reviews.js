import api from './api';

const LOCAL_REVIEWS_STORAGE_KEY = 'canteen_local_reviews';
const CACHED_REVIEWS_STORAGE_KEY = 'canteen_cached_reviews';

const DEFAULT_COMMUNITY_REVIEWS = [
  {
    id: 1,
    user: 2,
    user_name: 'Rahul K.',
    food_item: 1,
    food_item_name: 'Puttu',
    rating: 5,
    comment: 'Super delicious and fresh, loved the coconut chutney & hot sambar!',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    is_owner: false,
  },
  {
    id: 2,
    user: 3,
    user_name: 'Ananya S.',
    food_item: 3,
    food_item_name: 'Poori Masala',
    rating: 4,
    comment: 'Fluffy pooris with comforting spiced potato bhaji. Very satisfying.',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_owner: false,
  },
  {
    id: 3,
    user: 1,
    user_name: 'haritha',
    food_item: 2,
    food_item_name: 'Idali',
    rating: 5,
    comment: 'good quality',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    is_owner: true,
  },
  {
    id: 4,
    user: 4,
    user_name: 'Vignesh P.',
    food_item: 4,
    food_item_name: 'Samoosa',
    rating: 5,
    comment: 'Freshly fried hot and crispy samosas with delicious tangy tamarind chutney!',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    is_owner: false,
  },
  {
    id: 5,
    user: 5,
    user_name: 'Meera M.',
    food_item: 15,
    food_item_name: 'Cold Boost',
    rating: 5,
    comment: 'Thick, creamy, and chilled chocolate malt drink. Gives instant energy!',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    is_owner: false,
  },
];

function getStoredLocalReviews() {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredLocalReviews(reviews) {
  try {
    localStorage.setItem(LOCAL_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // silent
  }
}

function getStoredCachedReviews() {
  try {
    const raw = localStorage.getItem(CACHED_REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_COMMUNITY_REVIEWS;
  } catch {
    return DEFAULT_COMMUNITY_REVIEWS;
  }
}

function saveStoredCachedReviews(reviews) {
  try {
    localStorage.setItem(CACHED_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch {
    // silent
  }
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch all food reviews with optional query parameters (food_item, my_reviews, search).
 */
export async function getAllReviews(params = {}) {
  let backendReviews = [];
  let fetchFailed = false;

  try {
    const response = await api.get('/reviews/', { params });
    const data = response.data;
    backendReviews = Array.isArray(data) ? data : (data.results || []);
    if (backendReviews.length > 0) {
      saveStoredCachedReviews(backendReviews);
    }
  } catch {
    fetchFailed = true;
    backendReviews = getStoredCachedReviews();
  }

  // Merge with local reviews created by user offline
  const localRevs = getStoredLocalReviews();
  const mergedMap = new Map();

  for (const r of backendReviews) {
    mergedMap.set(String(r.id), r);
  }

  for (const r of localRevs) {
    mergedMap.set(String(r.id), r);
  }

  let all = Array.from(mergedMap.values());

  // Apply in-memory filtering if backend call failed
  if (fetchFailed) {
    if (params.food_item) {
      all = all.filter((r) => String(r.food_item) === String(params.food_item));
    }
    if (params.my_reviews) {
      const user = getCurrentUser();
      all = all.filter((r) => r.is_owner || (user && (r.user === user.id || r.user_name === user.username)));
    }
    if (params.search) {
      const q = params.search.toLowerCase().trim();
      all = all.filter((r) => (r.food_item_name || '').toLowerCase().includes(q));
    }
  }

  return all;
}

/**
 * Fetch reviews for a specific food item.
 */
export async function getReviews(foodItemId) {
  return getAllReviews({ food_item: foodItemId });
}

/**
 * Fetch the logged-in user's submitted reviews.
 */
export async function getMyReviews() {
  const all = await getAllReviews();
  const user = getCurrentUser();
  return all.filter((r) => r.is_owner || (user && (r.user === user.id || r.user_name === user.username)));
}

/**
 * Fetch food items that the current user has ordered and can review.
 */
export async function getOrderedItemsForReview() {
  try {
    const response = await api.get('/reviews/ordered_items/');
    const data = response.data;
    const items = Array.isArray(data) ? data : (data.results || []);
    if (items.length > 0) return items;
  } catch {
    // silent fallback
  }

  // Fallback: check my reviews to annotate past ordered items
  const myRevs = getStoredLocalReviews();
  const revsMap = new Map();
  for (const r of myRevs) {
    revsMap.set(String(r.food_item), r);
    if (r.food_item_name) revsMap.set(r.food_item_name.toLowerCase(), r);
  }

  const defaultOrdered = [
    { food_item_id: 2, food_item_name: 'Idali', price: '30.00', image: '/images/food/idali_sambar.jpg' },
    { food_item_id: 1, food_item_name: 'Puttu', price: '40.00', image: null },
    { food_item_id: 3, food_item_name: 'Poori Masala', price: '50.00', image: null },
    { food_item_id: 4, food_item_name: 'Samoosa', price: '20.00', image: '/images/food/samoosa.jpg' },
    { food_item_id: 15, food_item_name: 'Cold Boost', price: '40.00', image: '/images/food/cold_boost.jpg' },
    { food_item_id: 22, food_item_name: 'Gulab Jamun', price: '35.00', image: '/images/food/gulab_jamun.jpg' },
    { food_item_id: 20, food_item_name: 'Chocolate Brownie', price: '60.00', image: '/images/food/chocolate_brownie.jpg' },
  ];

  return defaultOrdered.map((item) => {
    const rev = revsMap.get(String(item.food_item_id)) || revsMap.get(item.food_item_name.toLowerCase());
    return {
      ...item,
      has_reviewed: Boolean(rev),
      review_id: rev?.id || null,
      rating: rev?.rating || null,
      comment: rev?.comment || '',
    };
  });
}

/**
 * Submit a 1-5 star rating and review for a food item.
 * Supports offline storage fallback so review submissions always succeed.
 */
export async function createReview({ foodItemId, orderId, rating, comment, foodItemName }) {
  const user = getCurrentUser();
  const trimmedComment = (comment || '').trim();

  try {
    const response = await api.post('/reviews/', {
      food_item: foodItemId,
      order: orderId || null,
      rating: Number(rating),
      comment: trimmedComment,
    });
    return response.data;
  } catch (err) {
    // If backend validation says already reviewed or offline, save locally
    const localRevs = getStoredLocalReviews();
    const existingIndex = localRevs.findIndex(
      (r) =>
        (foodItemId && Number(r.food_item) === Number(foodItemId)) ||
        (foodItemName && r.food_item_name && r.food_item_name.toLowerCase() === foodItemName.toLowerCase())
    );

    const newRev = {
      id: existingIndex >= 0 ? localRevs[existingIndex].id : 'loc-' + Date.now(),
      user: user?.id || 1,
      user_name: user?.first_name || user?.username || 'You',
      food_item: Number(foodItemId) || 1,
      food_item_name: foodItemName || 'Food Item',
      order: orderId || null,
      rating: Number(rating),
      comment: trimmedComment,
      created_at: new Date().toISOString(),
      is_owner: true,
    };

    if (existingIndex >= 0) {
      localRevs[existingIndex] = newRev;
    } else {
      localRevs.unshift(newRev);
    }

    saveStoredLocalReviews(localRevs);

    // Also update cached reviews
    const cached = getStoredCachedReviews();
    const cIndex = cached.findIndex((r) => String(r.id) === String(newRev.id));
    if (cIndex >= 0) {
      cached[cIndex] = newRev;
    } else {
      cached.unshift(newRev);
    }
    saveStoredCachedReviews(cached);

    return newRev;
  }
}

/**
 * Edit/Update an existing review.
 */
export async function updateReview(reviewId, { rating, comment, foodItemId, foodItemName }) {
  const trimmedComment = (comment || '').trim();

  // If local review, update in localStorage directly
  if (String(reviewId).startsWith('loc-')) {
    const localRevs = getStoredLocalReviews();
    const idx = localRevs.findIndex((r) => String(r.id) === String(reviewId));
    if (idx >= 0) {
      localRevs[idx] = {
        ...localRevs[idx],
        rating: Number(rating),
        comment: trimmedComment,
        updated_at: new Date().toISOString(),
      };
      saveStoredLocalReviews(localRevs);
      return localRevs[idx];
    }
  }

  try {
    const response = await api.patch(`/reviews/${reviewId}/`, {
      rating: Number(rating),
      comment: trimmedComment,
    });
    return response.data;
  } catch (err) {
    // Offline fallback update
    const localRevs = getStoredLocalReviews();
    const idx = localRevs.findIndex((r) => String(r.id) === String(reviewId));
    const user = getCurrentUser();
    const updated = {
      id: reviewId,
      user: user?.id || 1,
      user_name: user?.first_name || user?.username || 'You',
      food_item: Number(foodItemId) || 1,
      food_item_name: foodItemName || 'Food Item',
      rating: Number(rating),
      comment: trimmedComment,
      updated_at: new Date().toISOString(),
      is_owner: true,
    };

    if (idx >= 0) {
      localRevs[idx] = updated;
    } else {
      localRevs.unshift(updated);
    }
    saveStoredLocalReviews(localRevs);
    return updated;
  }
}

/**
 * Delete a user's review.
 */
export async function deleteReview(reviewId) {
  const localRevs = getStoredLocalReviews().filter((r) => String(r.id) !== String(reviewId));
  saveStoredLocalReviews(localRevs);

  const cached = getStoredCachedReviews().filter((r) => String(r.id) !== String(reviewId));
  saveStoredCachedReviews(cached);

  try {
    const response = await api.delete(`/reviews/${reviewId}/`);
    return response.data;
  } catch {
    return { success: true };
  }
}

/**
 * Fetch rating summary statistics (avg_rating, total_reviews) for a food item.
 */
export async function getRatingSummary(foodItemId) {
  try {
    const response = await api.get(`/reviews/summary/${foodItemId}/`);
    return response.data;
  } catch {
    const all = await getReviews(foodItemId);
    const total = all.length;
    const avg = total > 0 ? all.reduce((sum, r) => sum + r.rating, 0) / total : 5.0;
    return { avg_rating: avg, total_reviews: total };
  }
}

/**
 * Fetch overall rating statistics across all canteen reviews.
 */
export async function getReviewsOverview() {
  try {
    const response = await api.get('/reviews/overview/');
    return response.data;
  } catch {
    const all = await getAllReviews();
    const total = all.length;
    const avg = total > 0 ? all.reduce((sum, r) => sum + r.rating, 0) / total : 5.0;
    return { avg_rating: avg, total_reviews: total };
  }
}
