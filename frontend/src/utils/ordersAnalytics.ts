import type { EfoodOrder } from "../../../backend/analyticsTypes.js";
import { calculateAllTimeStats } from "../../../backend/services/analytics/orders/yearStats.js";
import { calculateTimeline } from "../../../backend/services/analytics/orders/timeline.js";
import { calculateCostStats } from "../../../backend/services/analytics/orders/costStats.js";
import { toCents } from "../../../backend/services/analytics/orders/money.js";
import type { Orders, OrderHistoryEntry, OrderStats } from "../types";
import { getOrderDateParts, parseOrderDate } from "./orderDate";

export interface OrderFilters {
  search: string;
  restaurant: string;
  payment: string;
  from: string;
  through: string;
  min: string;
  max: string;
}
export const EMPTY_ORDER_FILTERS: OrderFilters = {
  search: "",
  restaurant: "",
  payment: "",
  from: "",
  through: "",
  min: "",
  max: "",
};
export const hasOrderFilters = (filters: OrderFilters) =>
  Object.values(filters).some((value) => value !== "");
const PAYMENT_LABELS = new Map([
  ["cash", "Μετρητά"],
  ["credit_card", "Κάρτα"],
  ["paypal", "PayPal"],
  ["applepay", "Apple Pay"],
  ["googlepay", "Google Pay"],
  ["unknown", "Άγνωστος τρόπος"],
]);
export const paymentLabel = (value: string) =>
  PAYMENT_LABELS.get(value) ?? value;
const normalizedSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("el-GR")
    .trim();
const validDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
const validAmount = (value: string) =>
  /^\d+(?:[.,]\d{1,2})?$/.test(value) &&
  Number.isSafeInteger(Math.round(Number(value.replace(",", ".")) * 100));
const filterCents = (value: string) =>
  Math.round(Number(value.replace(",", ".")) * 100);

export function validateOrderFilters(filters: OrderFilters): string | null {
  if (
    (filters.from && !validDay(filters.from)) ||
    (filters.through && !validDay(filters.through))
  )
    return "Βάλε μια έγκυρη ημερομηνία.";
  if (filters.from && filters.through && filters.from > filters.through)
    return "Η ημερομηνία «Από» δεν μπορεί να είναι μετά την «Έως».";
  if (
    (filters.min && !validAmount(filters.min)) ||
    (filters.max && !validAmount(filters.max))
  )
    return "Βάλε ποσά από 0 και πάνω, με έως 2 δεκαδικά.";
  if (
    filters.min &&
    filters.max &&
    filterCents(filters.min) > filterCents(filters.max)
  )
    return "Το ελάχιστο ποσό δεν μπορεί να ξεπερνά το μέγιστο.";
  return null;
}

export function historyToAnalyticsOrder(entry: OrderHistoryEntry): EfoodOrder {
  const a = entry.amounts;
  return {
    id: entry.id,
    price: entry.price,
    submission_date: entry.submissionDate,
    platform: entry.platform,
    payment_type: entry.payment,
    restaurant: {
      id: entry.restaurant.id,
      name: entry.restaurant.name,
      address: entry.restaurant.address,
      logo: entry.restaurant.logo,
      latitude: entry.restaurant.latitude,
      longitude: entry.restaurant.longitude,
    },
    is_open: entry.restaurant.isOpen,
    is_favorite: entry.restaurant.isFavorite,
    delivery_address: { city: entry.city },
    delivery: { time_estimation: { minutes: entry.estimatedDeliveryMinutes } },
    coupon: { amount: a.coupon ?? undefined },
    tip: a.tips,
    delivery_cost: a.delivery,
    service_fee: a.service,
    service_fees: { total: a.serviceAlias },
    bags: { amount: a.bags },
    csr: { amount: a.donation },
    priority_fee: a.priority,
    small_order_fee: a.smallOrder,
    pvc_recycling_taxes: a.recycling,
    additional_taxes: a.includedTaxes,
    joker_discount: a.joker,
    products: entry.products.map((product) => ({
      item_code: product.identity ?? "",
      name: product.identity === null ? undefined : product.name,
      quantity: product.quantity,
      unit_price: product.unitPrice,
      images: { preview: product.image },
      is_offer: product.isOffer,
      is_coupon: product.isCoupon,
      is_delivery_fee_discount: product.isDeliveryDiscount,
      offer_discount: product.offerDiscount,
    })),
  };
}

export function getHistoryDay(entry: OrderHistoryEntry): string | null {
  const date = parseOrderDate(entry.submissionDate);
  if (!date) return null;
  const p = getOrderDateParts(date);
  return `${String(p.year).padStart(4, "0")}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export const getOrderCostBreakdown = (entry: OrderHistoryEntry) =>
  calculateCostStats([historyToAnalyticsOrder(entry)]);
export const productLineAmount = (quantity: number, unitPrice: number) =>
  toCents(quantity * unitPrice) / 100;

/** One selected set feeds all dashboard widgets; comparisons retain the same non-date cohort. */
export function buildFilteredView(
  orders: Orders,
  year: string,
  filters: OrderFilters,
) {
  const error = validateOrderFilters(filters);
  if (error) throw new Error(error);
  const search = normalizedSearch(filters.search);
  const cohort = orders.history.filter(
    (entry) =>
      (!search ||
        normalizedSearch(entry.restaurant.name ?? "").includes(search)) &&
      (!filters.restaurant ||
        String(entry.restaurant.id) === filters.restaurant) &&
      (!filters.payment || entry.payment === filters.payment) &&
      (!filters.min || toCents(entry.price) >= filterCents(filters.min)) &&
      (!filters.max || toCents(entry.price) <= filterCents(filters.max)),
  );
  const selected = cohort.filter((entry) => {
    if (year === "all" && !filters.from && !filters.through) return true;
    const day = getHistoryDay(entry);
    return (
      day !== null &&
      (year === "all" || day.startsWith(`${year}-`)) &&
      (!filters.from || day >= filters.from) &&
      (!filters.through || day <= filters.through)
    );
  });
  const excludedUndated =
    cohort.filter((entry) => getHistoryDay(entry) === null).length -
    selected.filter((entry) => getHistoryDay(entry) === null).length;
  const raw = selected.map(historyToAnalyticsOrder),
    comparisonOrders = cohort.map(historyToAnalyticsOrder);
  const stats = calculateAllTimeStats([], raw);
  const baseline = !hasOrderFilters(filters)
    ? year === "all"
      ? orders.all
      : orders.perYear.find((value) => value.year === year)
    : undefined;
  const all: OrderStats = baseline ?? {
    ...stats,
    phases: {
      morning: stats.phases.morning ?? 0,
      noon: stats.phases.noon ?? 0,
      afternoon: stats.phases.afternoon ?? 0,
      night: stats.phases.night ?? 0,
    },
  };
  const custom = !!(filters.from || filters.through);
  const from = [
    filters.from ||
      orders.timeline.coverage.from ||
      orders.timeline.coverage.through,
    year === "all" ? "" : `${year}-01-01`,
  ]
    .sort()
    .at(-1)!;
  const through = [
    filters.through || orders.timeline.coverage.through,
    year === "all" ? orders.timeline.coverage.through : `${year}-12-31`,
  ].sort()[0];
  const scope = custom ? { from, through } : undefined;
  const timeline = calculateTimeline(raw, new Date(orders.timeline.asOf), {
    coverageFrom: orders.timeline.coverage.from,
    comparisonOrders,
    comparisonPeriod: scope,
    comparisonYear: year === "all" ? undefined : Number(year),
  });
  // Partial month/week boundaries reflect the selected dates, not an invented full-period total.
  if (scope)
    for (const bucket of [...timeline.months, ...timeline.weeks])
      bucket.partial ||=
        bucket.from < scope.from || bucket.through > scope.through;
  return { all, timeline, history: selected, scope, excludedUndated };
}
