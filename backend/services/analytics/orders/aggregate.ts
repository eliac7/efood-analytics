import { parseSubmissionDate, toNumber } from "./normalize.js";
import type { CountMap, EfoodOrder } from "../../../types.js";

interface AggregateStats {
  totalPrice: number;
  couponAmount: number;
  deliveryCost: number;
  totalTips: number;
  totalDeliveryTime: number;
  deliveryTimeCount: number;
  platforms: CountMap;
  paymentMethods: CountMap;
}

export const computeDeliveryTimeStats = (orders: EfoodOrder[]): { sum: number; count: number } => {
  let sum = 0;
  let count = 0;
  for (const o of orders) {
    const dt = toNumber(o?.delivery_time);
    if (dt !== null) {
      sum += dt;
      count += 1;
    }
  }
  return { sum, count };
};

export const computeFirstLast = (orders: EfoodOrder[]): { firstOrder: string | null; lastOrder: string | null } => {
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
  return orders.reduce<AggregateStats>(
    (acc, order) => {
      acc.totalPrice += order.price;
      acc.couponAmount += order.coupon?.amount || 0;
      acc.deliveryCost += order.delivery_cost || 0;
      acc.totalTips += order.tip || 0;
      const dt = toNumber(order.delivery_time);
      if (dt !== null) {
        acc.totalDeliveryTime += dt;
        acc.deliveryTimeCount += 1;
      }

      // Count platforms
      const platform = order.platform as string;
      acc.platforms[platform] = (acc.platforms[platform] || 0) + 1;

      // Count payment methods
      const paymentType = order.payment_type as string;
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
      platforms: {},
      paymentMethods: {},
    }
  );
}
