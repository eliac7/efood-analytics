import type { Orders, OrderStats, Restaurant, User } from "../types";
import { COST_COMPONENT_KEYS } from "./costs";

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
const count = (v: unknown): v is number =>
  finite(v) && Number.isSafeInteger(v) && v >= 0;
const nullableNumber = (v: unknown) => v === null || finite(v);
const nullableString = (v: unknown) => v === null || typeof v === "string";
const optionalString = (v: unknown) => v === undefined || nullableString(v);
const optionalText = (v: unknown) => v === undefined || typeof v === "string";
const countMap = (v: unknown) => record(v) && Object.values(v).every(count);

function isCostAmount(v: unknown, totalOrders: number, signed = false): boolean {
  if (!record(v) || !count(v.coveredOrders) || v.coveredOrders > totalOrders ||
      !finite(v.knownAmount) || (!signed && v.knownAmount < 0) ||
      (v.coveredOrders === 0 && v.knownAmount !== 0)) return false;
  return v.coveredOrders === totalOrders ? finite(v.amount) && v.amount === v.knownAmount : v.amount === null;
}

function isCostBreakdown(v: unknown, totalOrders: number): boolean {
  if (!record(v) || !record(v.components) || !record(v.reconciliation)) return false;
  const components = v.components, r = v.reconciliation;
  return COST_COMPONENT_KEYS.every((key) => isCostAmount(components[key], totalOrders, key === "productLines")) &&
    isCostAmount(v.additionalCharges, totalOrders) && isCostAmount(v.includedTaxes, totalOrders) &&
    count(r.matchedOrders) && count(r.mismatchedOrders) && count(r.unavailableOrders) &&
    r.matchedOrders + r.mismatchedOrders + r.unavailableOrders === totalOrders &&
    finite(r.netDifference) && finite(r.absoluteDifference) && r.absoluteDifference >= 0 &&
    Math.round(r.absoluteDifference * 100) >= Math.abs(Math.round(r.netDifference * 100));
}

export const isUser = (v: unknown): v is User =>
  record(v) &&
  typeof v.session_id === "string" &&
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
    v.session_id,
  ) &&
  typeof v.name === "string";

function isRestaurant(v: unknown): v is Restaurant {
  return (
    record(v) &&
    ((typeof v.id === "string" && v.id.trim().length > 0) ||
      (finite(v.id) && Number.isSafeInteger(v.id))) &&
    finite(v.totalPrice) &&
    count(v.orders) &&
    optionalText(v.name) &&
    optionalText(v.address) &&
    optionalString(v.logo) &&
    (v.latitude === undefined || nullableNumber(v.latitude)) &&
    (v.longitude === undefined || nullableNumber(v.longitude)) &&
    (v.is_open === undefined || typeof v.is_open === "boolean") &&
    (v.is_favorite === undefined || typeof v.is_favorite === "boolean")
  );
}

function isOrderStats(v: unknown): v is OrderStats {
  if (!record(v)) return false;
  const product = v.mostOrderedProduct;
  return (
    count(v.totalOrders) &&
    isCostBreakdown(v.costBreakdown, v.totalOrders) &&
    finite(v.totalPrice) &&
    count(v.uniqueRestaurants) &&
    nullableNumber(v.totalTips) &&
    nullableNumber(v.deliveryCost) &&
    nullableNumber(v.couponAmount) &&
    nullableNumber(v.averageDeliveryTime) &&
    nullableString(v.firstOrder) &&
    nullableString(v.lastOrder) &&
    countMap(v.platforms) &&
    countMap(v.paymentMethods) &&
    countMap(v.weekdays) &&
    countMap(v.months) &&
    countMap(v.cities) &&
    record(v.phases) &&
    ["morning", "noon", "afternoon", "night"].every((key) =>
      count((v.phases as Record<string, unknown>)[key]),
    ) &&
    Array.isArray(v.restaurants) &&
    v.restaurants.every(isRestaurant) &&
    (v.restaurantWithMostMoneySpent === null ||
      isRestaurant(v.restaurantWithMostMoneySpent)) &&
    (product === null ||
      (record(product) &&
        optionalText(product.name) &&
        finite(product.quantity) &&
        product.quantity > 0 &&
        finite(product.totalPrice) &&
        nullableString(product.image)))
  );
}

export function isOrderAnalytics(
  v: unknown,
): v is Pick<Orders, "all" | "perYear"> {
  return (
    record(v) &&
    isOrderStats(v.all) &&
    Array.isArray(v.perYear) &&
    v.perYear.every(
      (year) =>
        record(year) &&
        typeof year.year === "string" &&
        /^\d{4}$/.test(year.year) &&
        isOrderStats(year),
    )
  );
}

export function parseOrderAnalyticsResponse(
  v: unknown,
): Pick<Orders, "all" | "perYear"> {
  if (!record(v) || !isOrderAnalytics(v.orders))
    throw new Error("Η απόκριση στατιστικών δεν είναι έγκυρη.");
  return v.orders;
}
