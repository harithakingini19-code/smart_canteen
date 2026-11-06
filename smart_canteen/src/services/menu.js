import api from './api';

// Categories in the EXACT order from Picture 2:
// 1. Breakfast, 2. Drinks, 3. Desserts, 4. Meals, 5. Snacks
export const DEFAULT_CATEGORIES = [
  { id: 'breakfast', name: 'Breakfast', slug: 'breakfast', description: 'Fresh morning breakfast items' },
  { id: 'drinks',    name: 'Drinks',    slug: 'drinks',    description: 'Hot & cold beverages' },
  { id: 'desserts',  name: 'Desserts',  slug: 'desserts',  description: 'Sweet treats & ice creams' },
  { id: 'meals',     name: 'Meals',     slug: 'meals',     description: 'Hearty lunch & dinner meals' },
  { id: 'snacks',    name: 'Snacks',    slug: 'snacks',    description: 'Quick bites and fast food' },
];

// Canonical order of all 36 items matching Picture 2:
export const CANONICAL_ORDER = [
  // 🥐 Breakfast (8)
  'puttu',
  'idali',
  'poori masala',
  'samoosa',
  'gee dosa',
  'veg hakka noodles',
  'paneer butter masala',
  'medu vada',

  // 🥤 Drinks (10)
  'chaya',
  'mango smoothie',
  'filter coffee',
  'tea',
  'lemon juice',
  'lime juice',
  'cold boost',
  'cold coffee',
  'sharjah shake',
  'chocolate shake',

  // 🍦 Desserts (5)
  'cup cake',
  'brownies',
  'pudding',
  'gulab jamun',
  'ice cream',

  // 🍱 Meals (6)
  'veg fried rice',
  'ghee rice',
  'normal rice meals',
  'chicken biryani',
  'egg fried rice',
  'paneer curry',

  // 🍕 Snacks (7)
  'paneer roll',
  'cutlet',
  'samosa',
  'grilled sandwich',
  'veg burger',
  'donuts',
  'veg roll',
];

export const DEFAULT_CANTEEN_FOOD_ITEMS = [

  // ════════════════════════════════════════════════
  //  1. BREAKFAST (8 items in Picture 2 order)
  // ════════════════════════════════════════════════
  {
    id: 1,
    name: 'Puttu',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Crispy golden dosa with spiced potato filling, served with fresh coconut chutney & aromatic sambar.',
    price: 40.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 8,
    image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&h=300&fit=crop&auto=format',
    aliases: ['puttu', 'dosa', 'masala dosa']
  },
  {
    id: 2,
    name: 'Idali',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Traditional soft steamed rice and lentil cakes served with steaming hot sambar and fresh coconut chutney.',
    price: 30.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 5,
    image: '/images/food/idali_sambar.jpg',
    aliases: ['idali', 'idli', 'idly', 'idli sambar', 'idali sambar', 'idali smbar']
  },
  {
    id: 3,
    name: 'Poori Masala',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Two fluffy puffed wheat pooris served with comforting spiced potato bhaji and fresh lemon pickle.',
    price: 50.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 8,
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=300&fit=crop&auto=format',
    aliases: ['poori', 'poori masala', 'puri', 'puri masala']
  },
  {
    id: 4,
    name: 'Samoosa',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Crispy golden triangular pastry stuffed with spiced potato, green peas, and roasted spices, served with tamarind & mint chutney.',
    price: 20.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 5,
    image: '/images/food/samoosa.jpg',
    aliases: ['samoosa', 'samosa', 'samusa', 'samosas', 'nool puttu']
  },
  {
    id: 5,
    name: 'Gee Dosa',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Crispy paper-thin dosa generously drizzled with golden desi ghee, served with coconut chutney and sambar.',
    price: 45.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 7,
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&h=300&fit=crop&auto=format',
    aliases: ['gee dosa', 'ghee dosa', 'seedose', 'gheedosa']
  },
  {
    id: 6,
    name: 'Veg Hakka Noodles',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Wok-tossed hakka noodles with crunchy carrots, capsicum, spring onions and light soy sauce.',
    price: 75.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 10,
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop&auto=format',
    aliases: ['noodles', 'hakka noodles', 'veg noodles', 'chowmein']
  },
  {
    id: 7,
    name: 'Paneer Butter Masala',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Creamy, rich paneer butter masala served with soft butter naan or roti — a perfect morning indulgence.',
    price: 90.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 12,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop&auto=format',
    aliases: ['paneer butter masala', 'paneer masala', 'butter paneer']
  },
  {
    id: 8,
    name: 'Medu Vada',
    category: 'breakfast',
    category_name: 'Breakfast',
    category_slug: 'breakfast',
    description: 'Crispy golden lentil doughnuts flavored with crushed peppercorns and curry leaves, served with chutney & sambar.',
    price: 35.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 6,
    image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400&h=300&fit=crop&auto=format',
    aliases: ['vada', 'wada', 'medu vada']
  },

  // ════════════════════════════════════════════════
  //  2. DRINKS (10 items in Picture 2 order)
  // ════════════════════════════════════════════════
  {
    id: 9,
    name: 'Chaya',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Classic Kerala-style strong tea brewed with ginger, cardamom, and full-cream milk. Hot and energizing.',
    price: 15.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop&auto=format',
    aliases: ['chaya', 'chai', 'chay', 'tea', 'masala chai']
  },
  {
    id: 10,
    name: 'Mango Smoothie',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Chilled Alphonso mango blend with thick yogurt, chia seeds, and a drizzle of honey. Tropical bliss!',
    price: 55.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 5,
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=300&fit=crop&auto=format',
    aliases: ['mango smoothie', 'mango shake', 'smoothie']
  },
  {
    id: 11,
    name: 'Filter Coffee',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'South Indian aromatic filter coffee brewed from freshly roasted chicory beans and frothy hot milk.',
    price: 25.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&auto=format',
    aliases: ['filter coffee', 'coffee', 'hot coffee', 'kapi']
  },
  {
    id: 12,
    name: 'Tea',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Classic hot ginger tea with a balanced blend of milk and Assam tea leaves. The perfect everyday pick-me-up.',
    price: 12.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop&auto=format',
    aliases: ['tea', 'hot tea', 'ginger tea']
  },
  {
    id: 13,
    name: 'Lemon Juice',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Freshly squeezed lemon with crushed mint leaves, rock salt, and ice. Refreshingly chilled.',
    price: 30.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop&auto=format',
    aliases: ['lemon juice', 'lemonade', 'nimbu pani']
  },
  {
    id: 14,
    name: 'Lime Juice',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Tangy fresh lime squeezed with chilled water, sugar, rock salt, and mint. Light and refreshing.',
    price: 25.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1603569283847-aa295f0d016a?w=400&h=300&fit=crop&auto=format',
    aliases: ['lime', 'lime juice', 'fresh lime']
  },
  {
    id: 15,
    name: 'Cold Boost',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Energizing chilled Boost chocolate malt drink blended with cold milk and ice. Great for a quick energy fix.',
    price: 40.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: '/images/food/cold_boost.jpg',
    aliases: ['cold boost', 'boost', 'boost drink']
  },
  {
    id: 16,
    name: 'Cold Coffee',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Chilled blended coffee with milk, sugar, and ice — thick, creamy, and full of bold coffee flavor.',
    price: 45.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 4,
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop&auto=format',
    aliases: ['cold coffee', 'iced coffee', 'coffee shake']
  },
  {
    id: 17,
    name: 'Sharjah Shake',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'The iconic Sharjah-style thick shake blended with ripe bananas, dates, cream, saffron, and ice cream.',
    price: 70.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 5,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&auto=format',
    aliases: ['sharjah shake', 'sharjah', 'sharjah milk shake']
  },
  {
    id: 18,
    name: 'Chocolate Shake',
    category: 'drinks',
    category_name: 'Drinks',
    category_slug: 'drinks',
    description: 'Thick and creamy chocolate milkshake blended with chocolate ice cream, cocoa powder, and cold milk.',
    price: 60.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 4,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop&auto=format',
    aliases: ['chocolate shake', 'choco shake', 'chocolate milkshake']
  },

  // ════════════════════════════════════════════════
  //  3. DESSERTS (5 items in Picture 2 order)
  // ════════════════════════════════════════════════
  {
    id: 19,
    name: 'Cup Cake',
    category: 'desserts',
    category_name: 'Desserts',
    category_slug: 'desserts',
    description: 'Fluffy vanilla and chocolate swirl cupcakes topped with rich buttercream frosting and colorful sprinkles.',
    price: 40.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400&h=300&fit=crop&auto=format',
    aliases: ['cup cake', 'cupcake', 'muffin']
  },
  {
    id: 20,
    name: 'Brownies',
    category: 'desserts',
    category_name: 'Desserts',
    category_slug: 'desserts',
    description: 'Warm fudgy dark chocolate brownies with a crusty top and gooey center, served with vanilla ice cream.',
    price: 55.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 4,
    image: '/images/food/chocolate_brownie.jpg',
    aliases: ['brownies', 'brownie', 'chocolate brownie', 'chocolate brownies', 'chocolate browine']
  },
  {
    id: 21,
    name: 'Pudding',
    category: 'desserts',
    category_name: 'Desserts',
    category_slug: 'desserts',
    description: 'Silky smooth caramel bread pudding with a golden burnt sugar crust. Served warm with caramel drizzle.',
    price: 45.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop&auto=format',
    aliases: ['pudding', 'caramel pudding', 'bread pudding']
  },
  {
    id: 22,
    name: 'Gulab Jamun',
    category: 'desserts',
    category_name: 'Desserts',
    category_slug: 'desserts',
    description: 'Warm soft khoya milk dumplings soaked in fragrant cardamom and rose petal sugar syrup (2 pcs).',
    price: 40.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: '/images/food/gulab_jamun.jpg',
    aliases: ['jamun', 'gulab jamun', 'gulabjamun']
  },
  {
    id: 23,
    name: 'Ice Cream',
    category: 'desserts',
    category_name: 'Desserts',
    category_slug: 'desserts',
    description: 'Rich creamy vanilla and chocolate scoops served with hot fudge sauce, wafer crisp, and roasted almonds.',
    price: 45.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 3,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&auto=format',
    aliases: ['icream', 'icecream', 'ice-cream', 'ice cream']
  },

  // ════════════════════════════════════════════════
  //  4. MEALS (6 items in Picture 2 order)
  // ════════════════════════════════════════════════
  {
    id: 24,
    name: 'Veg Fried Rice',
    category: 'meals',
    category_name: 'Meals',
    category_slug: 'meals',
    description: 'Wok-tossed basmati rice with crunchy carrots, capsicum, spring onions, garlic, and light soy sauce.',
    price: 85.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 12,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&auto=format',
    aliases: ['fried rice', 'friedrice', 'veg fried rice']
  },
  {
    id: 25,
    name: 'Ghee Rice',
    category: 'meals',
    category_name: 'Meals',
    category_slug: 'meals',
    description: 'Aromatic jeera rice tempered in pure golden desi ghee with whole spices, caramelized onions, and crunchy cashews.',
    price: 80.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 10,
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&h=300&fit=crop&auto=format',
    aliases: ['gee rice', 'gheerice', 'geerice', 'ghee rice']
  },
  {
    id: 26,
    name: 'Normal Rice Meals',
    category: 'meals',
    category_name: 'Meals',
    category_slug: 'meals',
    description: 'Wholesome full South Indian thali with steamed white rice, dal, sambar, rasam, curd, and crispy appalam.',
    price: 70.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 6,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop&auto=format',
    aliases: ['normal rice', 'normalrice', 'meals rice', 'rice meal', 'rice meals']
  },
  {
    id: 27,
    name: 'Chicken Biryani',
    category: 'meals',
    category_name: 'Meals',
    category_slug: 'meals',
    description: 'Classic dum biryani layered with aromatic basmati rice, tender spiced chicken, saffron, and cucumber raita.',
    price: 120.00,
    is_available: true,
    is_vegetarian: false,
    preparation_time_minutes: 15,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&auto=format',
    aliases: ['biryani', 'chicken biryani', 'briyani']
  },
  {
    id: 28,
    name: 'Egg Fried Rice',
    category: 'meals',
    category_name: 'Meals',
    category_slug: 'meals',
    description: 'High-flame wok rice tossed with scrambled farm eggs, spring onions, pepper, and savory soya sauce.',
    price: 95.00,
    is_available: true,
    is_vegetarian: false,
    preparation_time_minutes: 10,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&auto=format',
    aliases: ['egg fried rice', 'egg rice']
  },
  {
    id: 29,
    name: 'Paneer Curry',
    category: 'meals',
    category_name: 'Meals',
    category_slug: 'meals',
    description: 'Soft fresh paneer cubes simmered in a rich, buttery tomato and cashew gravy with aromatic kasuri methi.',
    price: 95.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 12,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop&auto=format',
    aliases: ['paneer curry', 'paneer gravy']
  },

  // ════════════════════════════════════════════════
  //  5. SNACKS (7 items in Picture 2 order)
  // ════════════════════════════════════════════════
  {
    id: 30,
    name: 'Paneer Roll',
    category: 'snacks',
    category_name: 'Snacks',
    category_slug: 'snacks',
    description: 'Tandoori spiced paneer cubes tossed with peppers and onions, wrapped in a warm flaky paratha.',
    price: 65.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 8,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&auto=format',
    aliases: ['paneer roll', 'paneer wrap']
  },
  {
    id: 31,
    name: 'Cutlet',
    category: 'snacks',
    category_name: 'Snacks',
    category_slug: 'snacks',
    description: 'Crispy golden vegetable cutlets coated in breadcrumbs, served piping hot with tomato ketchup and mint chutney.',
    price: 35.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 7,
    image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=300&fit=crop&auto=format',
    aliases: ['cutlet', 'veg cutlet', 'patties']
  },
  {
    id: 32,
    name: 'Samosa',
    category: 'snacks',
    category_name: 'Snacks',
    category_slug: 'snacks',
    description: 'Crispy golden pastry stuffed with spiced potato, green peas, and roasted spices, served with tamarind & mint chutney.',
    price: 20.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 5,
    image: '/images/food/samoosa.jpg',
    aliases: ['samoosa', 'samosa', 'samusa', 'samosas']
  },
  {
    id: 33,
    name: 'Grilled Sandwich',
    category: 'snacks',
    category_name: 'Snacks',
    category_slug: 'snacks',
    description: 'Triple-layer toasted sandwich with fresh veggies, cheese, and green chutney, grilled to a golden crisp.',
    price: 45.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 6,
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop&auto=format',
    aliases: ['grilled sandwich', 'sandwich', 'toast']
  },
  {
    id: 34,
    name: 'Veg Burger',
    category: 'snacks',
    category_name: 'Snacks',
    category_slug: 'snacks',
    description: 'Crispy veggie patty with fresh lettuce, tomato, cheese slice, and house burger sauce in a toasted bun.',
    price: 60.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 8,
    image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=300&fit=crop&auto=format',
    aliases: ['burger', 'veg burger']
  },
  {
    id: 35,
    name: 'Donuts',
    category: 'snacks',
    category_name: 'Snacks',
    category_slug: 'snacks',
    description: 'Soft fluffy ring donuts with chocolate glaze, rainbow sprinkles, and a dusting of powdered sugar.',
    price: 30.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 4,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop&auto=format',
    aliases: ['donuts', 'donut', 'doughnut', 'doughnuts']
  },
  {
    id: 36,
    name: 'Veg Roll',
    category: 'snacks',
    category_name: 'Snacks',
    category_slug: 'snacks',
    description: 'Crispy kathi roll loaded with sauteed crunchy garden vegetables, onions, chat masala, and mint mayo.',
    price: 50.00,
    is_available: true,
    is_vegetarian: true,
    preparation_time_minutes: 8,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop&auto=format',
    aliases: ['veg roll', 'roll', 'kathi roll', 'wrap']
  },
];

/**
 * Deduplicate food items by canonical name.
 * If multiple items have the same name (case-insensitive):
 *  1. Prefer available item over out-of-stock item (e.g. Paneer Butter Masala ₹90 vs ₹110 Sold Out)
 *  2. Prefer item that has an image
 */
export function deduplicateFoodItems(items = []) {
  if (!Array.isArray(items)) return [];
  const map = new Map();

  for (const item of items) {
    if (!item) continue;
    const rawName = (item.name || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (!rawName) continue;

    if (!map.has(rawName)) {
      map.set(rawName, item);
    } else {
      const existing = map.get(rawName);
      // Priority 1: Available item wins over unavailable item
      if (!existing.is_available && item.is_available) {
        map.set(rawName, item);
      } else if (existing.is_available === item.is_available) {
        // Priority 2: Item with image wins
        if (!existing.image && item.image) {
          map.set(rawName, item);
        }
      }
    }
  }

  return Array.from(map.values());
}

/** Sort any food item array to exactly follow CANONICAL_ORDER from Picture 2 and remove duplicates */
export function sortItemsByCanonicalOrder(items = []) {
  const deduped = deduplicateFoodItems(items);
  const orderMap = new Map();
  CANONICAL_ORDER.forEach((name, idx) => {
    orderMap.set(name.toLowerCase().trim(), idx);
  });
  // Also map 'masala dosa' to the same position as 'puttu'
  if (!orderMap.has('masala dosa') && orderMap.has('puttu')) {
    orderMap.set('masala dosa', orderMap.get('puttu'));
  }
  // Also map 'nool puttu' to the 4th position if it ever appears
  if (!orderMap.has('nool puttu') && orderMap.has('samoosa')) {
    orderMap.set('nool puttu', orderMap.get('samoosa'));
  }

  return [...deduped].sort((a, b) => {
    // If staff added a custom item, surface it at the top so it is immediately visible
    if (a.is_custom && !b.is_custom) return -1;
    if (!a.is_custom && b.is_custom) return 1;
    if (a.is_custom && b.is_custom) {
      return (b.id || 0) - (a.id || 0);
    }

    const nameA = (a.name || '').toLowerCase().trim();
    const nameB = (b.name || '').toLowerCase().trim();

    const idxA = orderMap.has(nameA) ? orderMap.get(nameA) : 999;
    const idxB = orderMap.has(nameB) ? orderMap.get(nameB) : 999;

    if (idxA !== idxB) {
      return idxA - idxB;
    }
    return (b.id || 0) - (a.id || 0);
  });
}

/** Filter default food items locally when backend is offline or empty */
export function filterDefaultFoodItems(items = DEFAULT_CANTEEN_FOOD_ITEMS, params = {}) {
  let list = [...items];

  // Search filter
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim();
    list = list.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const cat = (item.category_name || '').toLowerCase();
      const aliases = item.aliases || [];

      return (
        name.includes(q) ||
        desc.includes(q) ||
        cat.includes(q) ||
        aliases.some((a) => a.includes(q) || q.includes(a))
      );
    });
  }

  // Category filter: checks category_slug or category_name against string slug
  if (params.category && params.category !== 'all') {
    const catTarget = String(params.category).toLowerCase().trim();
    list = list.filter((item) => {
      const itemCatName = (item.category_name || '').toLowerCase().trim();
      const itemCatSlug = (item.category_slug || '').toLowerCase().trim();
      const itemCat = String(item.category || '').toLowerCase().trim();
      return (
        itemCatName === catTarget ||
        itemCatSlug === catTarget ||
        itemCat === catTarget
      );
    });
  }

  if (params.is_available !== undefined) {
    const avail = params.is_available === true || params.is_available === 'true';
    list = list.filter((item) => item.is_available === avail);
  }

  if (params.is_vegetarian !== undefined) {
    const veg = params.is_vegetarian === true || params.is_vegetarian === 'true';
    list = list.filter((item) => item.is_vegetarian === veg);
  }

  return sortItemsByCanonicalOrder(list).map((item) => {
    const qty = item.quantity_available !== undefined
      ? parseInt(item.quantity_available, 10)
      : (item.is_available ? 50 : 0);
    const validQty = isNaN(qty) ? 0 : Math.max(0, qty);
    const isAvail = validQty > 0 ? (item.is_available !== false) : false;
    return {
      ...item,
      quantity_available: validQty,
      is_available: isAvail,
    };
  });
}

/** Fetch all active categories with reliable fallback in Picture 2 order */
export async function fetchCategories() {
  try {
    const response = await api.get('/menu/categories/');
    const data = response.data;
    const list = Array.isArray(data) ? data : (data.results || []);
    if (list.length > 0) {
      // Reorder categories according to Picture 2: Breakfast, Drinks, Desserts, Meals, Snacks
      const catOrder = ['breakfast', 'drinks', 'desserts', 'meals', 'snacks'];
      return [...list].sort((a, b) => {
        const slugA = (a.slug || a.name || '').toLowerCase();
        const slugB = (b.slug || b.name || '').toLowerCase();
        const idxA = catOrder.indexOf(slugA);
        const idxB = catOrder.indexOf(slugB);
        return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
      });
    }
  } catch (err) {
    // Return fallback categories if backend is unavailable
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Resolves a food item image string to an accessible URL.
 * Supports:
 *  - Full URLs (http / https)
 *  - Data URLs (data:image/...)
 *  - Frontend static assets (/images/food/...)
 *  - Backend uploads (food_items/...)
 */
export function resolveFoodImageUrl(img) {
  if (!img) return null;
  const str = String(img).trim();
  if (!str) return null;
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
    return str;
  }
  if (str.startsWith('/') || str.startsWith('./')) {
    return str;
  }
  return `http://127.0.0.1:8000/${str.replace(/^\/+/, '')}`;
}

/**
 * Global map of food name/alias to default realistic image URL
 */
export const DEFAULT_IMAGE_MAP = {};
DEFAULT_CANTEEN_FOOD_ITEMS.forEach((d) => {
  if (d.image) {
    DEFAULT_IMAGE_MAP[d.name.toLowerCase().trim()] = d.image;
    if (Array.isArray(d.aliases)) {
      d.aliases.forEach((a) => {
        DEFAULT_IMAGE_MAP[a.toLowerCase().trim()] = d.image;
      });
    }
  }
});

/**
 * Get the realistic image URL for any food item object.
 * Looks up food.image, then exact name, then aliases, then keywords.
 */
export function getFoodItemImage(food) {
  if (!food) return null;
  if (food.image) return resolveFoodImageUrl(food.image);

  const rawName = (food.name || '').toLowerCase().trim();
  if (DEFAULT_IMAGE_MAP[rawName]) {
    return resolveFoodImageUrl(DEFAULT_IMAGE_MAP[rawName]);
  }

  // Check aliases on the food item
  if (Array.isArray(food.aliases)) {
    for (const a of food.aliases) {
      const aliasKey = a.toLowerCase().trim();
      if (DEFAULT_IMAGE_MAP[aliasKey]) {
        return resolveFoodImageUrl(DEFAULT_IMAGE_MAP[aliasKey]);
      }
    }
  }

  // Partial substring search
  for (const [key, url] of Object.entries(DEFAULT_IMAGE_MAP)) {
    if (rawName && (rawName.includes(key) || key.includes(rawName))) {
      return resolveFoodImageUrl(url);
    }
  }

  return null;
}

export const CUSTOM_FOOD_STORAGE_KEY = 'canteen_custom_food_items';

/** Read custom food items created by staff from local storage */
export function getCustomFoodItems() {
  try {
    const raw = localStorage.getItem(CUSTOM_FOOD_STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return items.map((item) => {
      if ((item.name || '').toLowerCase().trim() === 'masala dosa') {
        return { ...item, name: 'Puttu' };
      }
      return item;
    });
  } catch (e) {
    return [];
  }
}

/** Save or update a custom food item in local storage */
export function saveCustomFoodItem(item) {
  try {
    const list = getCustomFoodItems();
    const idx = list.findIndex(
      (x) => x.id === item.id || (x.name && x.name.toLowerCase().trim() === (item.name || '').toLowerCase().trim())
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.unshift(item);
    }
    localStorage.setItem(CUSTOM_FOOD_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save custom food item to localStorage', e);
  }
}

/** Delete a custom food item from local storage */
export function deleteCustomFoodItem(id) {
  try {
    const list = getCustomFoodItems().filter((x) => x.id !== id && String(x.id) !== String(id));
    localStorage.setItem(CUSTOM_FOOD_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to delete custom food item', e);
  }
}

/** Helper to get readable category name */
export function getCategoryDisplayName(categoryKey) {
  if (!categoryKey) return 'General';
  const match = DEFAULT_CATEGORIES.find(
    (c) => c.id === categoryKey || c.slug === categoryKey || c.name.toLowerCase() === String(categoryKey).toLowerCase()
  );
  if (match) return match.name;
  return String(categoryKey).charAt(0).toUpperCase() + String(categoryKey).slice(1);
}

/**
 * Create a new food item (Staff / Admin action).
 * Sends to Django backend when available and persists locally so the item
 * immediately appears across all pages (Home, Staff Portal, Admin).
 */
export async function createFoodItem(itemData) {
  const categorySlug = String(itemData.category || 'snacks').toLowerCase().trim();
  const categoryName = getCategoryDisplayName(categorySlug);
  const isVeg = itemData.is_vegetarian !== false;
  const rawQty = itemData.quantity_available !== undefined ? itemData.quantity_available : itemData.quantity;
  const quantity = Math.max(0, parseInt(rawQty, 10) || 0);
  const isAvail = quantity === 0 ? false : (itemData.is_available !== false);
  const price = parseFloat(itemData.price) || 0;
  const prep = parseInt(itemData.preparation_time_minutes, 10) || 12;

  let backendItem = null;

  // 1. Try sending to backend
  try {
    let payload;
    let headers = {};

    if (itemData.imageFile instanceof File) {
      payload = new FormData();
      payload.append('name', itemData.name.trim());
      payload.append('category', categorySlug);
      payload.append('price', price);
      payload.append('is_vegetarian', isVeg ? 'true' : 'false');
      payload.append('is_available', isAvail ? 'true' : 'false');
      payload.append('quantity_available', quantity);
      payload.append('preparation_time_minutes', prep);
      payload.append('description', itemData.description || '');
      payload.append('image', itemData.imageFile);
      headers['Content-Type'] = 'multipart/form-data';
    } else {
      payload = {
        name: itemData.name.trim(),
        category: categorySlug,
        price: price,
        is_vegetarian: isVeg,
        is_available: isAvail,
        quantity_available: quantity,
        preparation_time_minutes: prep,
        description: itemData.description || '',
      };
      if (itemData.imageUrl) {
        payload.image = itemData.imageUrl;
      }
    }

    const response = await api.post('/menu/items/', payload, { headers });
    backendItem = response.data;
  } catch (err) {
    console.warn('Backend food creation failed or offline. Storing locally in custom items.', err);
  }

  // 2. Prepare comprehensive food item object
  const newFoodItem = {
    id: backendItem?.id || (Date.now()),
    name: (backendItem?.name || itemData.name).trim(),
    category: categorySlug,
    category_name: categoryName,
    category_slug: categorySlug,
    description: backendItem?.description || itemData.description || '',
    price: parseFloat(backendItem?.price || price),
    is_vegetarian: backendItem?.is_vegetarian !== undefined ? backendItem.is_vegetarian : isVeg,
    quantity_available: backendItem?.quantity_available !== undefined
      ? parseInt(backendItem.quantity_available, 10)
      : quantity,
    is_available: backendItem?.is_available !== undefined
      ? backendItem.is_available
      : isAvail,
    preparation_time_minutes: backendItem?.preparation_time_minutes || prep,
    image: backendItem?.image || itemData.imagePreview || itemData.imageUrl || null,
    created_at: backendItem?.created_at || new Date().toISOString(),
    is_custom: true,
  };

  // 3. Save to localStorage for instant visibility & resilience
  saveCustomFoodItem(newFoodItem);

  return newFoodItem;
}

/**
 * Fetch food items with optional filters.
 * Returns items strictly sorted in Picture 2 canonical order without duplicates.
 */
export async function fetchFoodItems(params = {}) {
  const cleanParams = {};
  if (params.search) cleanParams.search = params.search;
  if (params.category && params.category !== 'all') cleanParams.category = params.category;
  if (params.is_available !== undefined) cleanParams.is_available = params.is_available;
  if (params.is_vegetarian !== undefined) cleanParams.is_vegetarian = params.is_vegetarian;
  if (params.min_price) cleanParams.min_price = params.min_price;
  if (params.max_price) cleanParams.max_price = params.max_price;

  let backendItems = [];
  try {
    const response = await api.get('/menu/items/', { params: cleanParams });
    const data = response.data;
    backendItems = Array.isArray(data) ? data : (data.results || []);
  } catch (err) {
    // Backend offline / error
  }

  // Inject realistic image and update renamed items
  backendItems = backendItems.map((item) => {
    const raw = (item.name || '').toLowerCase().trim();
    if (raw === 'masala dosa') {
      return {
        ...item,
        name: 'Puttu',
        aliases: [...(item.aliases || []), 'masala dosa', 'dosa', 'puttu'],
      };
    }
    if (raw === 'nool puttu') {
      return {
        ...item,
        name: 'Samoosa',
        description: 'Crispy golden triangular pastry stuffed with spiced potato, green peas, and roasted spices, served with tamarind & mint chutney.',
        price: 20.00,
        preparation_time_minutes: 5,
        image: '/images/food/samoosa.jpg',
      };
    }
    if (!item.image) {
      const img = getFoodItemImage(item);
      if (img) return { ...item, image: img };
    }
    return item;
  });

  // Read staff-created custom items from local storage
  const localCustom = getCustomFoodItems().map((c) => ({
    ...c,
    image: c.image ? resolveFoodImageUrl(c.image) : getFoodItemImage(c),
  }));

  // Merge: local custom items first, backend items, then default items
  const backendNames = new Set(
    backendItems.map((i) => (i.name || '').toLowerCase().trim())
  );
  const customNames = new Set(
    localCustom.map((i) => (i.name || '').toLowerCase().trim())
  );

  const missingDefaults = DEFAULT_CANTEEN_FOOD_ITEMS.filter(
    (d) => !backendNames.has(d.name.toLowerCase().trim()) && !customNames.has(d.name.toLowerCase().trim())
  );

  // Combine local custom items + backend items + missing defaults
  const combined = [...localCustom, ...backendItems, ...missingDefaults];
  const deduplicated = deduplicateFoodItems(combined);

  return filterDefaultFoodItems(deduplicated, params);
}

/** Fetch a single food item by ID */
export async function fetchFoodItem(id) {
  try {
    const response = await api.get(`/menu/items/${id}/`);
    const item = response.data;
    if (!item.image) {
      const img = getFoodItemImage(item);
      if (img) return { ...item, image: img };
    }
    return item;
  } catch (err) {
    const local = getCustomFoodItems().find((i) => i.id === Number(id) || String(i.id) === String(id));
    if (local) return local;
    const found = DEFAULT_CANTEEN_FOOD_ITEMS.find((i) => i.id === Number(id));
    if (found) return found;
    throw err;
  }
}

/**
 * Toggle food item availability (Staff / Admin).
 */
export async function toggleFoodAvailability(id, is_available) {
  // Also update local custom item if applicable
  const customList = getCustomFoodItems();
  const matchIdx = customList.findIndex((i) => i.id === Number(id) || String(i.id) === String(id));
  if (matchIdx >= 0) {
    const cur = customList[matchIdx];
    const newAvail = is_available !== undefined ? Boolean(is_available) : !cur.is_available;
    let newQty = cur.quantity_available !== undefined ? cur.quantity_available : (newAvail ? 20 : 0);
    if (newAvail && newQty === 0) newQty = 20;
    const updated = {
      ...cur,
      is_available: newAvail,
      quantity_available: newQty,
    };
    customList[matchIdx] = updated;
    localStorage.setItem(CUSTOM_FOOD_STORAGE_KEY, JSON.stringify(customList));
  }

  const payload = is_available !== undefined ? { is_available } : {};
  try {
    const response = await api.post(`/menu/items/${id}/toggle_availability/`, payload);
    return response.data;
  } catch (err) {
    if (matchIdx >= 0) {
      return customList[matchIdx];
    }
    const item = DEFAULT_CANTEEN_FOOD_ITEMS.find((i) => i.id === Number(id));
    if (item) {
      item.is_available = is_available !== undefined ? Boolean(is_available) : !item.is_available;
      if (item.is_available && (item.quantity_available === 0 || item.quantity_available === undefined)) {
        item.quantity_available = 20;
      }
      return { ...item };
    }
    throw err;
  }
}

/**
 * Update available quantity for a food item (Staff / Admin action).
 * If quantity is 0, item automatically becomes Out of Stock (is_available = false).
 * If quantity is > 0, item automatically becomes In Stock (is_available = true).
 */
export async function updateFoodQuantity(id, quantity) {
  const qty = Math.max(0, parseInt(quantity, 10) || 0);
  const isAvail = qty > 0;

  // 1. Update local custom item if applicable
  const customList = getCustomFoodItems();
  const matchIdx = customList.findIndex((i) => i.id === Number(id) || String(i.id) === String(id));
  if (matchIdx >= 0) {
    const cur = customList[matchIdx];
    const updated = {
      ...cur,
      quantity_available: qty,
      is_available: isAvail,
    };
    customList[matchIdx] = updated;
    localStorage.setItem(CUSTOM_FOOD_STORAGE_KEY, JSON.stringify(customList));
  }

  // 2. Also update DEFAULT_CANTEEN_FOOD_ITEMS in-memory instance
  const defItem = DEFAULT_CANTEEN_FOOD_ITEMS.find((i) => i.id === Number(id));
  if (defItem) {
    defItem.quantity_available = qty;
    defItem.is_available = isAvail;
  }

  // 3. Send to backend
  try {
    const response = await api.post(`/menu/items/${id}/update_quantity/`, { quantity_available: qty });
    return response.data;
  } catch (err) {
    if (matchIdx >= 0) {
      return customList[matchIdx];
    }
    if (defItem) {
      return { ...defItem };
    }
    throw err;
  }
}

/**
 * Decrease available quantities across all ordered items (called after customer places an order).
 * If any food item's quantity reaches 0, it is automatically marked Out of Stock.
 */
export function decrementFoodQuantities(orderedItems = []) {
  if (!Array.isArray(orderedItems) || orderedItems.length === 0) return;
  const customList = getCustomFoodItems();
  let modified = false;

  for (const ord of orderedItems) {
    const foodId = ord.food_item || ord.food_item_id || ord.id;
    const foodName = (ord.food_item_name || ord.name || '').toLowerCase().trim();
    const qtyOrdered = parseInt(ord.quantity, 10) || 1;

    // Check custom items
    const idx = customList.findIndex(
      (c) => (foodId && (c.id === Number(foodId) || String(c.id) === String(foodId))) ||
             (foodName && (c.name || '').toLowerCase().trim() === foodName)
    );
    if (idx >= 0) {
      const cur = customList[idx];
      const prevQty = cur.quantity_available !== undefined ? cur.quantity_available : (cur.is_available ? 50 : 0);
      const newQty = Math.max(0, prevQty - qtyOrdered);
      customList[idx] = {
        ...cur,
        quantity_available: newQty,
        is_available: newQty > 0 ? cur.is_available : false,
      };
      modified = true;
    }

    // Check default items
    const defItem = DEFAULT_CANTEEN_FOOD_ITEMS.find(
      (d) => (foodId && d.id === Number(foodId)) || (foodName && d.name.toLowerCase().trim() === foodName)
    );
    if (defItem) {
      const prevQty = defItem.quantity_available !== undefined ? defItem.quantity_available : (defItem.is_available ? 50 : 0);
      defItem.quantity_available = Math.max(0, prevQty - qtyOrdered);
      if (defItem.quantity_available === 0) {
        defItem.is_available = false;
      }
    }
  }

  if (modified) {
    try {
      localStorage.setItem(CUSTOM_FOOD_STORAGE_KEY, JSON.stringify(customList));
    } catch {}
  }
}
