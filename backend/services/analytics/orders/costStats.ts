import type {
  CostAmount,
  CostBreakdown,
  CostComponentKey,
  EfoodOrder,
} from "../../../analyticsTypes.js";
import { toCents } from "./money.js";

export const COST_COMPONENT_KEYS: CostComponentKey[] = [
  "productLines",
  "delivery",
  "service",
  "bags",
  "tips",
  "priority",
  "smallOrder",
  "recycling",
  "donation",
  "coupon",
  "joker",
];
export const ADDITIONAL_CHARGE_KEYS: CostComponentKey[] = [
  "delivery",
  "service",
  "bags",
  "tips",
  "priority",
  "smallOrder",
  "recycling",
  "donation",
];

const amount = (value: unknown): number | null =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0 &&
  Number.isSafeInteger(toCents(value))
    ? toCents(value)
    : null;

function sum(values: (number | null)[]): number | null {
  if (values.some((value) => value === null)) return null;
  const total = (values as number[]).reduce(
    (result, value) => result + value,
    0,
  );
  return Number.isSafeInteger(total) ? total : null;
}

function serviceAmount(order: EfoodOrder): number | null {
  const primary = amount(order.service_fee),
    secondary = amount(order.service_fees?.total);
  if (primary !== null && secondary !== null && primary !== secondary)
    return null;
  return primary ?? secondary;
}

function couponOutsideLines(order: EfoodOrder): number | null {
  const reported = order.coupon === null ? 0 : amount(order.coupon?.amount);
  const embedded = order.products.filter(
    (product) => product.is_coupon && product.unit_price < 0,
  );
  if (embedded.length === 0) return reported;
  const embeddedAmount = sum(
    embedded.map((product) => amount(-product.quantity * product.unit_price)),
  );
  // Only explicit matching coupon adjustments can establish overlap. Never guess from offer names.
  return reported !== null && embeddedAmount === reported ? 0 : null;
}

/** Amounts in cents; product lines retain already embedded signed adjustments. */
function orderComponents(
  order: EfoodOrder,
): Record<CostComponentKey, number | null> {
  return {
    productLines: sum(
      order.products.map((product) => {
        const cents = toCents(product.quantity * product.unit_price);
        return Number.isSafeInteger(cents) ? cents : null;
      }),
    ),
    delivery: amount(order.delivery_cost),
    service: serviceAmount(order),
    bags: amount(order.bags?.amount),
    tips: amount(order.tip),
    priority: amount(order.priority_fee),
    smallOrder: amount(order.small_order_fee),
    recycling: amount(order.pvc_recycling_taxes),
    donation: amount(order.csr?.amount),
    coupon: couponOutsideLines(order),
    joker: amount(order.joker_discount),
  };
}

function summarize(values: (number | null)[]): CostAmount {
  const known = values.filter((value): value is number => value !== null);
  const knownCents = sum(known);
  if (knownCents === null)
    return { amount: null, knownAmount: 0, coveredOrders: 0 };
  return {
    amount: known.length === values.length ? knownCents / 100 : null,
    knownAmount: knownCents / 100,
    coveredOrders: known.length,
  };
}

export function calculateCostStats(orders: EfoodOrder[]): CostBreakdown {
  const rows = orders.map(orderComponents);
  const components = Object.fromEntries(
    COST_COMPONENT_KEYS.map((key) => [
      key,
      summarize(rows.map((row) => row[key])),
    ]),
  ) as Record<CostComponentKey, CostAmount>;
  const reconciliation = {
    matchedOrders: 0,
    mismatchedOrders: 0,
    unavailableOrders: 0,
    netDifference: 0,
    absoluteDifference: 0,
  };
  let netCents = 0,
    absoluteCents = 0;
  orders.forEach((order, index) => {
    const row = rows[index];
    const reconstructed = sum(
      COST_COMPONENT_KEYS.map((key) => {
        const value = row[key];
        return value === null
          ? null
          : key === "coupon" || key === "joker"
            ? -value
            : value;
      }),
    );
    // Delivery discount lines lack a verified gross/net relationship in the observed history.
    const ambiguousDeliveryDiscount = order.products.some(
      (product) => product.is_delivery_fee_discount && product.unit_price < 0,
    );
    if (reconstructed === null || ambiguousDeliveryDiscount) {
      reconciliation.unavailableOrders++;
      return;
    }
    const difference = toCents(order.price) - reconstructed;
    netCents += difference;
    absoluteCents += Math.abs(difference);
    if (Math.abs(difference) <= 1) reconciliation.matchedOrders++;
    else reconciliation.mismatchedOrders++;
  });
  reconciliation.netDifference = netCents / 100;
  reconciliation.absoluteDifference = absoluteCents / 100;
  return {
    components,
    additionalCharges: summarize(
      rows.map((row) => sum(ADDITIONAL_CHARGE_KEYS.map((key) => row[key]))),
    ),
    includedTaxes: summarize(
      orders.map((order) => amount(order.additional_taxes)),
    ),
    reconciliation,
  };
}
