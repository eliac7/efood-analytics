import {
  calculateAggregateStats,
  computeFirstLast,
} from "./aggregate.js";
import { findMostOrderedProduct } from "./productStats.js";
import { calculateRestaurantStats } from "./restaurantStats.js";
import { calculateTimeStats } from "./timeStats.js";
import type { CommonOrderStats, EfoodOrder, YearOrderStats } from "../../../types.js";

/**
 * Calculate statistics for a single year
 * @param {Array} orders - Orders for the year
 * @param {string} year - Year string
 * @returns {Object} - Year statistics
 */
export function calculateYearStats(orders: EfoodOrder[], year: string): YearOrderStats {
  const aggregateStats = calculateAggregateStats(orders);
  const timeStats = calculateTimeStats(orders);
  const restaurantStats = calculateRestaurantStats(orders);
  const mostOrderedProduct = findMostOrderedProduct(orders);

  const { firstOrder, lastOrder } = computeFirstLast(orders);
  const avgDelivery =
    aggregateStats.deliveryTimeCount > 0
      ? Math.round(
          aggregateStats.totalDeliveryTime / aggregateStats.deliveryTimeCount
        )
      : null;

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
    averageDeliveryTime: avgDelivery,
    restaurantWithMostMoneySpent: restaurantStats.mostMoneySpent,
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
export function calculateAllTimeStats(
  yearStats: YearOrderStats[],
  allOrders: EfoodOrder[]
): CommonOrderStats {
  const aggregateStats = calculateAggregateStats(allOrders);
  const restaurantStats = calculateRestaurantStats(allOrders);
  const timeStats = calculateTimeStats(allOrders);
  const mostOrderedProduct = findMostOrderedProduct(allOrders);
  const { firstOrder, lastOrder } = computeFirstLast(allOrders);

  return {
    totalOrders: allOrders.length,
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
    averageDeliveryTime:
      aggregateStats.deliveryTimeCount > 0
        ? Math.round(
            aggregateStats.totalDeliveryTime / aggregateStats.deliveryTimeCount
          )
        : null,
    restaurantWithMostMoneySpent: restaurantStats.mostMoneySpent,
    uniqueRestaurants: restaurantStats.uniqueCount,
    weekdays: timeStats.weekdays,
    phases: timeStats.phases,
    months: timeStats.months,
    cities: timeStats.cities,
  };
}
