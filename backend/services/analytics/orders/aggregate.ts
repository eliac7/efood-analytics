import { getEstimatedDeliveryTime, parseSubmissionDate } from "./normalize.js";
import { sumKnownAmounts, toCents } from "./money.js";
import type { CountMap, EfoodOrder } from "../../../analyticsTypes.js";

interface AggregateStats {
  totalPrice: number;
  couponAmount: number | null;
  deliveryCost: number | null;
  totalTips: number | null;
  totalDeliveryTime: number;
  deliveryTimeCount: number;
  platforms: CountMap;
  paymentMethods: CountMap;
}

export const computeDeliveryTimeStats = (
  orders: EfoodOrder[],
): { sum: number; count: number } => {
  let sum = 0;
  let count = 0;
  for (const o of orders) {
    const dt = getEstimatedDeliveryTime(o);
    if (dt !== null) {
      sum += dt;
      count += 1;
    }
  }
  return { sum, count };
};

export const computeFirstLast = (
  orders: EfoodOrder[],
): { firstOrder: string | null; lastOrder: string | null } => {
  let minD: Date | null = null,
    maxD: Date | null = null;
  let minS: string | null = null,
    maxS: string | null = null;

  for (const o of orders) {
    const d = parseSubmissionDate(o?.submission_date);
    if (!d) continue;
    if (!minD || d < minD) {
      minD = d;
      minS = o.submission_date as string;
    }
    if (!maxD || d > maxD) {
      maxD = d;
      maxS = o.submission_date as string;
    }
  }
  return { firstOrder: minS, lastOrder: maxS };
};

/**
 * Calculate aggregate statistics for a set of orders
 * @param {Array} orders - Array of orders
 * @returns {Object} - Aggregated stats
 */
export function calculateAggregateStats(orders: EfoodOrder[]): AggregateStats {
  let totalPriceCents = 0;
  const stats = orders.reduce<AggregateStats>(
    (acc, order) => {
      totalPriceCents += toCents(order.price);
      const dt = getEstimatedDeliveryTime(order);
      if (dt !== null) {
        acc.totalDeliveryTime += dt;
        acc.deliveryTimeCount += 1;
      }

      // Count platforms
      const platform = order.platform?.trim() || "unknown";
      acc.platforms[platform] = (acc.platforms[platform] || 0) + 1;

      // Count payment methods
      const paymentType = order.payment_type?.trim() || "unknown";
      acc.paymentMethods[paymentType] =
        (acc.paymentMethods[paymentType] || 0) + 1;

      return acc;
    },
    {
      totalPrice: 0,
      couponAmount: 0,
      deliveryCost: 0,
      totalTips: 0,
      totalDeliveryTime: 0,
      deliveryTimeCount: 0,
      platforms: Object.create(null) as CountMap,
      paymentMethods: Object.create(null) as CountMap,
    },
  );
  stats.totalPrice = totalPriceCents / 100;
  stats.couponAmount = sumKnownAmounts(orders, (order) =>
    order.coupon === null ? 0 : order.coupon?.amount,
  );
  stats.deliveryCost = sumKnownAmounts(orders, (order) => order.delivery_cost);
  stats.totalTips = sumKnownAmounts(orders, (order) => order.tip);
  return stats;
}
