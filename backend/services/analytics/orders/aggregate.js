import { parseSubmissionDate, toNumber } from "./normalize.js";

export const computeDeliveryTimeStats = (orders) => {
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

export const computeFirstLast = (orders) => {
  let minD = null,
    maxD = null;
  let minS = null,
    maxS = null;

  for (const o of orders) {
    const d = parseSubmissionDate(o?.submission_date);
    if (!d) continue;
    if (!minD || d < minD) {
      minD = d;
      minS = o.submission_date;
    }
    if (!maxD || d > maxD) {
      maxD = d;
      maxS = o.submission_date;
    }
  }
  return { firstOrder: minS, lastOrder: maxS };
};

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
      const dt = toNumber(order.delivery_time);
      if (dt !== null) {
        acc.totalDeliveryTime += dt;
        acc.deliveryTimeCount += 1;
      }

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
      deliveryTimeCount: 0,
      platforms: {},
      paymentMethods: {},
    }
  );
}
