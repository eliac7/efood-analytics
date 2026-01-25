import { WEEKDAYS_GR, MONTHS_GR, TIME_PHASES } from "../../../constants/locale.js";
import { sortByReference, sortByValueDesc } from "../../../utils/sorting.js";
import { getCityFromOrder, parseSubmissionDate } from "./normalize.js";

/**
 * Get time phase from hour
 * @param {number} hour - Hour (0-23)
 * @returns {string} - Phase name
 */
const getTimePhase = (hour) => {
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
export function calculateTimeStats(orders) {
  const phases = { morning: 0, noon: 0, afternoon: 0, night: 0 };
  const weekdays = {};
  const months = {};
  const cities = {};

  for (const order of orders) {
    const date = parseSubmissionDate(order.submission_date);
    if (!date) continue;
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
    const city = getCityFromOrder(order);
    cities[city] = (cities[city] || 0) + 1;
  }

  return {
    phases: sortByValueDesc(phases),
    weekdays: sortByReference(weekdays, WEEKDAYS_GR),
    months: sortByReference(months, MONTHS_GR),
    cities: sortByValueDesc(cities),
  };
}
