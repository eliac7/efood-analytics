import { WEEKDAYS_GR, MONTHS_GR, TIME_PHASES } from "../constants/locale.js";
import { sortByReference, sortByValueDesc } from "../utils/sorting.js";

/**
 * Find the most ordered product from order data
 * @param {Array} orders - Array of orders
 * @returns {Object} - Most ordered product info
 */
export function findMostOrderedProduct(orders) {
  const productTotals = {};

  for (const order of orders) {
    for (const product of order.products) {
      if (product.is_offer) continue;

      if (!productTotals[product.item_code]) {
        productTotals[product.item_code] = {
          product,
          quantity: 0,
          amountSpent: 0,
        };
      }

      productTotals[product.item_code].quantity += product.quantity;
      productTotals[product.item_code].amountSpent +=
        product.quantity * product.unit_price;
    }
  }

  // Find product with highest quantity
  let mostOrdered = null;
  let highestQuantity = 0;

  for (const productCode in productTotals) {
    if (productTotals[productCode].quantity > highestQuantity) {
      mostOrdered = productTotals[productCode].product;
      highestQuantity = productTotals[productCode].quantity;
    }
  }

  if (!mostOrdered) return null;

  // Get first non-null image
  const image = mostOrdered.images
    ? Object.values(mostOrdered.images).find((img) => img !== null) || null
    : null;

  return {
    name: mostOrdered.name || mostOrdered.offer_title,
    quantity: highestQuantity,
    totalPrice: Math.round(productTotals[mostOrdered.item_code].amountSpent * 100) / 100,
    image,
  };
}

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
    mostMoneySpent: sortedRestaurants[0] ? formatRestaurant(sortedRestaurants[0]) : null,
    allRestaurants: sortedRestaurants.map(formatRestaurant),
    uniqueCount: uniqueRestaurants.size,
  };
}

/**
 * Get time phase from hour
 * @param {number} hour - Hour (0-23)
 * @returns {string} - Phase name
 */
const getTimePhase = (hour) => {
  if (hour >= TIME_PHASES.morning.start && hour < TIME_PHASES.morning.end) return "morning";
  if (hour >= TIME_PHASES.noon.start && hour < TIME_PHASES.noon.end) return "noon";
  if (hour >= TIME_PHASES.afternoon.start && hour < TIME_PHASES.afternoon.end) return "afternoon";
  return "night";
}

/**
 * Calculate time-based statistics for orders
 * @param {Array} orders - Array of orders
 * @returns {Object} - Time statistics
 */
export function calculateTimeStats(orders) {
  const phases = { morning: 0, noon: 0, afternoon: 0, night: 0 };
  const weekdays = {};
  const months = {};
  const cities = {};

  for (const order of orders) {
    const date = new Date(order.submission_date);
    const day = date.getDay();
    const month = date.getMonth();
    const hour = date.getHours();

    // Count phases
    phases[getTimePhase(hour)]++;

    // Count weekdays
    const dayName = WEEKDAYS_GR[day];
    weekdays[dayName] = (weekdays[dayName] || 0) + 1;

    // Count months
    const monthName = MONTHS_GR[month];
    months[monthName] = (months[monthName] || 0) + 1;

    // Count cities
    const city = order.restaurant.address?.split(",")[1]?.trim() || "Unknown";
    cities[city] = (cities[city] || 0) + 1;
  }

  return {
    phases: sortByValueDesc(phases),
    weekdays: sortByReference(weekdays, WEEKDAYS_GR),
    months: sortByReference(months, MONTHS_GR),
    cities: sortByValueDesc(cities),
  };
}

/**
 * Calculate aggregate statistics for a set of orders
 * @param {Array} orders - Array of orders
 * @returns {Object} - Aggregated stats
 */
export function calculateAggregateStats(orders) {
  return orders.reduce(
    (acc, order) => {
      acc.totalPrice += order.price;
      acc.couponAmount += order.coupon?.amount || 0;
      acc.deliveryCost += order.delivery_cost || 0;
      acc.totalTips += order.tip || 0;
      acc.totalDeliveryTime += order.delivery_time || 0;

      // Count platforms
      acc.platforms[order.platform] = (acc.platforms[order.platform] || 0) + 1;

      // Count payment methods
      acc.paymentMethods[order.payment_type] =
        (acc.paymentMethods[order.payment_type] || 0) + 1;

      return acc;
    },
    {
      totalPrice: 0,
      couponAmount: 0,
      deliveryCost: 0,
      totalTips: 0,
      totalDeliveryTime: 0,
      platforms: {},
      paymentMethods: {},
    }
  );
}

/**
 * Calculate statistics for a single year
 * @param {Array} orders - Orders for the year
 * @param {string} year - Year string
 * @returns {Object} - Year statistics
 */
export function calculateYearStats(orders, year) {
  const aggregateStats = calculateAggregateStats(orders);
  const timeStats = calculateTimeStats(orders);
  const restaurantStats = calculateRestaurantStats(orders);
  const mostOrderedProduct = findMostOrderedProduct(orders);

  const firstOrder = orders[orders.length - 1]?.submission_date;
  const lastOrder = orders[0]?.submission_date;

  return {
    year,
    totalOrders: orders.length,
    totalPrice: Math.round(aggregateStats.totalPrice * 100) / 100,
    platforms: aggregateStats.platforms,
    paymentMethods: aggregateStats.paymentMethods,
    firstOrder,
    lastOrder,
    couponAmount: aggregateStats.couponAmount,
    deliveryCost: aggregateStats.deliveryCost,
    totalTips: aggregateStats.totalTips,
    restaurants: restaurantStats.allRestaurants,
    mostOrderedProduct,
    averageDeliveryTime: Math.round(aggregateStats.totalDeliveryTime / orders.length),
    RestaurantWithMostMoneySpent: restaurantStats.mostMoneySpent,
    uniqueRestaurants: restaurantStats.uniqueCount,
    weekdays: timeStats.weekdays,
    phases: timeStats.phases,
    months: timeStats.months,
    cities: timeStats.cities,
  };
}

/**
 * Calculate all-time statistics by aggregating year stats
 * @param {Array} yearStats - Array of year statistics
 * @param {Array} allOrders - All orders
 * @returns {Object} - All-time statistics
 */
export function calculateAllTimeStats(yearStats, allOrders) {
  const restaurantStats = calculateRestaurantStats(allOrders);
  const timeStats = calculateTimeStats(allOrders);
  const mostOrderedProduct = findMostOrderedProduct(allOrders);

  const allTime = yearStats.reduce(
    (acc, year) => {
      acc.totalOrders += year.totalOrders;
      acc.totalPrice += year.totalPrice;
      acc.couponAmount += year.couponAmount;
      acc.deliveryCost += year.deliveryCost;
      acc.totalTips += year.totalTips;
      acc.totalDeliveryTime += year.averageDeliveryTime;

      // Merge platforms
      Object.entries(year.platforms).forEach(([platform, count]) => {
        acc.platforms[platform] = (acc.platforms[platform] || 0) + count;
      });

      // Merge payment methods
      Object.entries(year.paymentMethods).forEach(([method, count]) => {
        acc.paymentMethods[method] = (acc.paymentMethods[method] || 0) + count;
      });

      return acc;
    },
    {
      totalOrders: 0,
      totalPrice: 0,
      couponAmount: 0,
      deliveryCost: 0,
      totalTips: 0,
      totalDeliveryTime: 0,
      platforms: {},
      paymentMethods: {},
    }
  );

  return {
    totalOrders: allTime.totalOrders,
    totalPrice: Math.round(allTime.totalPrice * 100) / 100,
    platforms: allTime.platforms,
    paymentMethods: allTime.paymentMethods,
    firstOrder: yearStats[yearStats.length - 1]?.firstOrder,
    lastOrder: yearStats[0]?.lastOrder,
    couponAmount: allTime.couponAmount,
    deliveryCost: allTime.deliveryCost,
    totalTips: allTime.totalTips,
    restaurants: restaurantStats.allRestaurants,
    mostOrderedProduct,
    averageDeliveryTime: Math.round(allTime.totalDeliveryTime / yearStats.length),
    RestaurantWithMostMoneySpent: restaurantStats.mostMoneySpent,
    uniqueRestaurants: restaurantStats.uniqueCount,
    weekdays: timeStats.weekdays,
    phases: timeStats.phases,
    months: timeStats.months,
    cities: timeStats.cities,
  };
}

/**
 * Main function to process and analyze all orders
 * @param {Array} orders - Raw orders from API
 * @returns {Object} - Processed order analytics
 */
export function analyzeOrders(orders) {
  // Get unique years
  const years = [...new Set(orders.map((order) => order.submission_date.slice(0, 4)))];

  // Calculate stats for each year
  const perYear = years.map((year) => {
    const yearOrders = orders.filter(
      (order) => order.submission_date.slice(0, 4) === year
    );
    return calculateYearStats(yearOrders, year);
  });

  const all = calculateAllTimeStats(perYear, orders);

  return { all, perYear };
}

