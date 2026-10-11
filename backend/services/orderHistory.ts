import { createHash } from "node:crypto";
import type { EfoodOrder, OrderHistoryEntry } from "../analyticsTypes.js";
import {
  getCityFromOrder,
  getEstimatedDeliveryTime,
} from "./analytics/orders/normalize.js";
import { getProductIdentity } from "./analytics/orders/productStats.js";

const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Build every object explicitly; never spread upstream data into the client model. */
export function toOrderHistory(orders: EfoodOrder[]): OrderHistoryEntry[] {
  return orders.map((order, index) => ({
    id: `order:${index}`,
    submissionDate: order.submission_date ?? null,
    price: order.price,
    restaurant: {
      id: order.restaurant.id,
      name: order.restaurant.name,
      address: order.restaurant.address,
      logo: order.restaurant.logo,
      latitude: order.restaurant.latitude,
      longitude: order.restaurant.longitude,
      isOpen: order.is_open,
      isFavorite: order.is_favorite,
    },
    city: getCityFromOrder(order),
    platform: order.platform?.trim() || "unknown",
    payment: order.payment_type?.trim() || "unknown",
    status: order.status ?? null,
    estimatedDeliveryMinutes: getEstimatedDeliveryTime(order),
    amounts: {
      coupon: order.coupon === null ? 0 : number(order.coupon?.amount),
      delivery: number(order.delivery_cost),
      tips: number(order.tip),
      service: number(order.service_fee),
      serviceAlias: number(order.service_fees?.total),
      bags: number(order.bags?.amount),
      donation: number(order.csr?.amount),
      priority: number(order.priority_fee),
      smallOrder: number(order.small_order_fee),
      recycling: number(order.pvc_recycling_taxes),
      includedTaxes: number(order.additional_taxes),
      joker: number(order.joker_discount),
    },
    products: order.products.map((product) => {
      const identity = getProductIdentity(order, product);
      return {
        identity:
          identity === null
            ? null
            : createHash("sha256").update(identity).digest("hex"),
        name: product.name || product.offer_title,
        quantity: product.quantity,
        unitPrice: product.unit_price,
        image: product.images
          ? (Object.values(product.images).find(
              (image) => typeof image === "string" && image.length > 0,
            ) ?? null)
          : null,
        isOffer: product.is_offer === true,
        isCoupon: product.is_coupon === true,
        isDeliveryDiscount: product.is_delivery_fee_discount === true,
        offerDiscount: product.offer_discount === true,
      };
    }),
  }));
}
