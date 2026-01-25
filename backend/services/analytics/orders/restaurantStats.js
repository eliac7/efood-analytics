/**
 * Calculate restaurant statistics from orders
 * @param {Array} orders - Array of orders
 * @returns {Object} - Restaurant statistics
 */
export function calculateRestaurantStats(orders) {
  const restaurantTotals = new Map();
  const uniqueRestaurants = new Set();

  for (const order of orders) {
    const restaurant = order.restaurant;
    uniqueRestaurants.add(restaurant.id);

    if (!restaurantTotals.has(restaurant.id)) {
      restaurantTotals.set(restaurant.id, {
        id: restaurant.id,
        is_favorite: order.is_favorite,
        address: restaurant.address,
        restaurant: { ...restaurant, is_open: order.is_open },
        total: 0,
        orders: 0,
      });
    }

    const existing = restaurantTotals.get(restaurant.id);
    const orderTotal = order.products.reduce(
      (sum, product) => sum + product.quantity * product.unit_price,
      0
    );
    existing.total += orderTotal;
    existing.orders++;
  }

  // Sort by total spent descending
  const sortedRestaurants = Array.from(restaurantTotals.values()).sort(
    (a, b) => b.total - a.total
  );

  const formatRestaurant = (r) => ({
    id: r.id,
    name: r.restaurant.name,
    totalPrice: Math.round(r.total * 100) / 100,
    orders: r.orders,
    longitude: r.restaurant.longitude,
    latitude: r.restaurant.latitude,
    logo: r.restaurant.logo,
    is_open: r.restaurant.is_open,
    is_favorite: r.is_favorite,
    address: r.address,
  });

  return {
    mostMoneySpent: sortedRestaurants[0]
      ? formatRestaurant(sortedRestaurants[0])
      : null,
    allRestaurants: sortedRestaurants.map(formatRestaurant),
    uniqueCount: uniqueRestaurants.size,
  };
}
