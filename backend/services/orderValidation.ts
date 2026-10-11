import type { EfoodOrder, EfoodProduct } from "../types.js";
import { parseOrderDate } from "../utils/orderDate.js";
import { UpstreamError } from "../utils/upstreamError.js";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value * 100) <= Number.MAX_SAFE_INTEGER ? value : null;
const nonNegativeAmount = (value: unknown): number | null => {
  const parsed = number(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
};
const id = (value: unknown): string | number | undefined =>
  typeof value === "string" && value.trim() ? value.trim() :
  typeof value === "number" && Number.isSafeInteger(value) ? value : undefined;

function requiredNumber(value: unknown, path: string): number {
  const parsed = number(value);
  if (parsed === null) throw new UpstreamError(`Μη έγκυρο αριθμητικό πεδίο στο ιστορικό: ${path}.`);
  return parsed;
}

function normalizeProduct(value: unknown): EfoodProduct {
  if (!isRecord(value) || typeof value.item_code !== "string") {
    throw new UpstreamError("Μη έγκυρα στοιχεία προϊόντος στο ιστορικό.");
  }
  const quantity = requiredNumber(value.quantity, "products.quantity");
  if (quantity < 0) throw new UpstreamError("Μη έγκυρη ποσότητα προϊόντος στο ιστορικό.");
  const images = isRecord(value.images)
    ? Object.fromEntries(Object.entries(value.images).filter(([, v]) => v === null || typeof v === "string")) : null;
  return {
    ...value, item_code: value.item_code, quantity,
    unit_price: requiredNumber(value.unit_price, "products.unit_price"),
    name: text(value.name), offer_title: text(value.offer_title),
    size_info: text(value.size_info), customisation: text(value.customisation),
    tracking_product_id: text(value.tracking_product_id),
    is_offer: value.is_offer === true, is_coupon: value.is_coupon === true,
    is_delivery_fee_discount: value.is_delivery_fee_discount === true, offer_discount: value.offer_discount === true,
    images: images as Record<string, string | null> | null,
  };
}

export function normalizeOrder(value: unknown, requireId = false): EfoodOrder {
  if (!isRecord(value) || !isRecord(value.restaurant) || !Array.isArray(value.products)) {
    throw new UpstreamError("Λείπουν απαραίτητα στοιχεία παραγγελίας στο ιστορικό.");
  }
  const orderId = id(value.id), restaurantId = id(value.restaurant.id);
  if (restaurantId === undefined || (requireId && orderId === undefined)) {
    throw new UpstreamError("Λείπει έγκυρο αναγνωριστικό από το ιστορικό παραγγελιών.");
  }
  const restaurant = value.restaurant;
  const delivery = isRecord(value.delivery) ? value.delivery : null;
  const estimate = delivery && isRecord(delivery.time_estimation) ? delivery.time_estimation : null;
  const address = isRecord(value.delivery_address) ? value.delivery_address : null;
  const serviceFees = isRecord(value.service_fees) ? value.service_fees : null;
  const donation = isRecord(value.csr) ? value.csr : null;
  return {
    ...value, id: orderId, price: requiredNumber(value.price, "price"),
    submission_date: parseOrderDate(value.submission_date) ? value.submission_date as string : null,
    platform: text(value.platform), payment_type: text(value.payment_type), status: text(value.status),
    coupon: value.coupon === null ? null :
      isRecord(value.coupon) ? { ...value.coupon, amount: number(value.coupon.amount) ?? undefined } : undefined,
    tip: number(value.tip), delivery_cost: number(value.delivery_cost), delivery_time: number(value.delivery_time),
    service_fee: nonNegativeAmount(value.service_fee),
    service_fees: serviceFees ? { total: nonNegativeAmount(serviceFees.total),
      current: nonNegativeAmount(serviceFees.current), late_night: nonNegativeAmount(serviceFees.late_night) } : undefined,
    bags: isRecord(value.bags) ? { amount: nonNegativeAmount(value.bags.amount) } : undefined,
    // The history explicitly reports no donation with an empty csr object.
    csr: donation ? { amount: Object.keys(donation).length === 0 ? 0 : nonNegativeAmount(donation.amount) } : undefined,
    priority_fee: nonNegativeAmount(value.priority_fee), small_order_fee: nonNegativeAmount(value.small_order_fee),
    pvc_recycling_taxes: nonNegativeAmount(value.pvc_recycling_taxes),
    additional_taxes: nonNegativeAmount(value.additional_taxes), joker_discount: nonNegativeAmount(value.joker_discount),
    delivery: estimate ? { time_estimation: { minutes: number(estimate.minutes) } } : undefined,
    restaurant: {
      ...restaurant, id: restaurantId, name: text(restaurant.name), address: text(restaurant.address),
      logo: text(restaurant.logo), latitude: number(restaurant.latitude), longitude: number(restaurant.longitude),
    },
    is_open: typeof value.is_open === "boolean" ? value.is_open : undefined,
    is_favorite: typeof value.is_favorite === "boolean" ? value.is_favorite : undefined,
    delivery_address: address ? { ...address, city: text(address.city), area: text(address.area) } : undefined,
    products: value.products.map(normalizeProduct),
  };
}

export function normalizeOrders(value: unknown, requireIds = false): EfoodOrder[] {
  if (!Array.isArray(value)) throw new UpstreamError("Το ιστορικό παραγγελιών δεν είναι έγκυρη λίστα.");
  return value.map((order) => normalizeOrder(order, requireIds));
}

export function parseOrdersPage(value: unknown): { orders: EfoodOrder[]; hasNext: boolean } {
  if (!isRecord(value) || value.status !== "ok" || !isRecord(value.data) ||
      typeof value.data.hasNext !== "boolean" || !Array.isArray(value.data.orders)) {
    throw new UpstreamError("Το efood επέστρεψε μη έγκυρη απόκριση ιστορικού.");
  }
  const orders = normalizeOrders(value.data.orders, true);
  if (value.data.hasNext && orders.length === 0) {
    throw new UpstreamError("Το ιστορικό σταμάτησε πριν ολοκληρωθεί η λήψη του.");
  }
  return { orders, hasNext: value.data.hasNext };
}
