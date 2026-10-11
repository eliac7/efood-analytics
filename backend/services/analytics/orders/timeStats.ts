import {
  WEEKDAYS_GR,
  MONTHS_GR,
  TIME_PHASES,
} from "../../../constants/locale.js";
import { sortByReference, sortByValueDesc } from "../../../utils/sorting.js";
import { getCityFromOrder, parseSubmissionDate } from "./normalize.js";
import type { CountMap, EfoodOrder } from "../../../analyticsTypes.js";
import { getOrderDateParts } from "../../../utils/orderDate.js";

/**
 * Get time phase from hour
 * @param {number} hour - Hour (0-23)
 * @returns {string} - Phase name
 */
const getTimePhase = (hour: number): string => {
  if (hour >= TIME_PHASES.morning.start && hour < TIME_PHASES.morning.end)
    return "morning";
  if (hour >= TIME_PHASES.noon.start && hour < TIME_PHASES.noon.end)
    return "noon";
  if (hour >= TIME_PHASES.afternoon.start && hour < TIME_PHASES.afternoon.end)
    return "afternoon";
  return "night";
};

/**
 * Calculate time-based statistics for orders
 * @param {Array} orders - Array of orders
 * @returns {Object} - Time statistics
 */
export function calculateTimeStats(orders: EfoodOrder[]): {
  phases: CountMap;
  weekdays: CountMap;
  months: CountMap;
  cities: CountMap;
} {
  const phases: CountMap = { morning: 0, noon: 0, afternoon: 0, night: 0 };
  const weekdays: CountMap = {};
  const months: CountMap = {};
  const cities: CountMap = Object.create(null) as CountMap;

  for (const order of orders) {
    // Location remains usable even when an order's timestamp is unavailable.
    const city = getCityFromOrder(order);
    cities[city] = (cities[city] || 0) + 1;
    const date = parseSubmissionDate(order.submission_date);
    if (!date) continue;
    const parts = getOrderDateParts(date);
    const day = parts.weekday === 0 ? 6 : parts.weekday - 1;
    const month = parts.month - 1;
    const hour = parts.hour;

    // Count phases
    phases[getTimePhase(hour)]++;

    // Count weekdays
    const dayName = WEEKDAYS_GR[day];
    weekdays[dayName] = (weekdays[dayName] || 0) + 1;

    // Count months
    const monthName = MONTHS_GR[month];
    months[monthName] = (months[monthName] || 0) + 1;
  }

  return {
    phases: sortByValueDesc(phases),
    weekdays: sortByReference(weekdays, WEEKDAYS_GR),
    months: sortByReference(months, MONTHS_GR),
    cities: sortByValueDesc(cities),
  };
}
