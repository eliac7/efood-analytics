import type { EfoodOrder, EfoodRestaurant, RestaurantSummary } from "../../../types.js";
import { toCents } from "./money.js";

interface RestaurantAccumulator {
  id: string | number;
  is_favorite?: boolean;
  address?: string;
  restaurant: EfoodRestaurant;
  totalCents: number;
  orders: number;
}

interface RestaurantStats {
  mostMoneySpent: RestaurantSummary | null;
  allRestaurants: RestaurantSummary[];
  uniqueCount: number;
}

/**
 * Calculate restaurant statistics from orders
 * @param {Array} orders - Array of orders
 * @returns {Object} - Restaurant statistics
 */
export function calculateRestaurantStats(orders: EfoodOrder[]): RestaurantStats {
  const restaurantTotals = new Map<string, RestaurantAccumulator>();

  for (const order of orders) {
    const restaurant = order.restaurant;
    const restaurantId = String(restaurant.id);

    if (!restaurantTotals.has(restaurantId)) {
      restaurantTotals.set(restaurantId, {
        id: restaurant.id,
        is_favorite: order.is_favorite,
        address: restaurant.address,
        restaurant: { ...restaurant, is_open: order.is_open },
        totalCents: 0,
        orders: 0,
      });
    }

    const existing = restaurantTotals.get(restaurantId);
    if (!existing) continue;
    // Includes the same discounts and charges as the dashboard's order total.
    existing.totalCents += toCents(order.price);
    existing.orders++;
  }

  // Sort by total spent descending
  const sortedRestaurants = Array.from(restaurantTotals.values()).sort(
    (a, b) => b.totalCents - a.totalCents
  );

  const formatRestaurant = (r: RestaurantAccumulator): RestaurantSummary => ({
    id: r.id,
    name: r.restaurant.name,
    totalPrice: r.totalCents / 100,
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
    uniqueCount: restaurantTotals.size,
  };
}
