import {
  getYearFromSubmission,
  parseSubmissionDate,
} from "./orders/normalize.js";
import {
  calculateAllTimeStats,
  calculateYearStats,
} from "./orders/yearStats.js";
import type { EfoodOrder, OrderAnalytics } from "../../analyticsTypes.js";
import { normalizeOrders } from "../orderValidation.js";
import { calculateTimeline } from "./orders/timeline.js";
import { toOrderHistory } from "../orderHistory.js";

/**
 * Main function to process and analyze all orders
 * @param {Array} orders - Raw orders from API
 * @returns {Object} - Processed order analytics
 */
export function analyzeOrders(
  orders: EfoodOrder[],
  asOf = new Date(),
): OrderAnalytics {
  const sortedOrders = normalizeOrders(orders).sort((a, b) => {
    const da = parseSubmissionDate(a?.submission_date);
    const db = parseSubmissionDate(b?.submission_date);
    // Newest first
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db.getTime() - da.getTime();
  });

  // Get unique years
  const years = [...new Set(sortedOrders.map(getYearFromSubmission))]
    .filter((y) => y !== "Unknown")
    .sort((a, b) => Number(b) - Number(a));

  // Calculate stats for each year
  const perYear = years.map((year) => {
    const yearOrders = sortedOrders.filter(
      (o) => getYearFromSubmission(o) === year,
    );
    return calculateYearStats(yearOrders, year);
  });

  const all = calculateAllTimeStats(perYear, sortedOrders);

  return {
    all,
    perYear,
    timeline: calculateTimeline(sortedOrders, asOf),
    history: toOrderHistory(sortedOrders),
  };
}
