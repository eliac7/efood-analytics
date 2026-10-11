import { parseOrderDate } from "./orderDate";
import type { OrderHistoryEntry } from "../types";

const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number =>
  typeof v === "number" &&
  Number.isFinite(v) &&
  Number.isSafeInteger(Math.round(v * 100));
const optionalText = (v: unknown) => v === undefined || typeof v === "string";
const nullableText = (v: unknown) => v === null || typeof v === "string";
const nullableNumber = (v: unknown) => v === null || finite(v);
const onlyKeys = (v: Record<string, unknown>, keys: string[]) =>
  Object.keys(v).every((key) => keys.includes(key));
const AMOUNTS = [
  "coupon",
  "delivery",
  "tips",
  "service",
  "serviceAlias",
  "bags",
  "donation",
  "priority",
  "smallOrder",
  "recycling",
  "includedTaxes",
  "joker",
];

function entry(v: unknown): v is OrderHistoryEntry {
  if (
    !record(v) ||
    !onlyKeys(v, [
      "id",
      "submissionDate",
      "price",
      "restaurant",
      "city",
      "platform",
      "payment",
      "status",
      "estimatedDeliveryMinutes",
      "amounts",
      "products",
    ]) ||
    typeof v.id !== "string" ||
    !v.id.trim() ||
    !(v.submissionDate === null || parseOrderDate(v.submissionDate)) ||
    !finite(v.price) ||
    !record(v.restaurant) ||
    !record(v.amounts) ||
    !Array.isArray(v.products)
  )
    return false;
  const r = v.restaurant;
  return (
    onlyKeys(r, [
      "id",
      "name",
      "address",
      "logo",
      "latitude",
      "longitude",
      "isOpen",
      "isFavorite",
    ]) &&
    ((typeof r.id === "string" && !!r.id.trim()) ||
      (typeof r.id === "number" && Number.isSafeInteger(r.id))) &&
    optionalText(r.name) &&
    optionalText(r.address) &&
    (r.logo === undefined || nullableText(r.logo)) &&
    (r.latitude === undefined || nullableNumber(r.latitude)) &&
    (r.longitude === undefined || nullableNumber(r.longitude)) &&
    (r.isOpen === undefined || typeof r.isOpen === "boolean") &&
    (r.isFavorite === undefined || typeof r.isFavorite === "boolean") &&
    [v.city, v.platform, v.payment].every(
      (value) => typeof value === "string",
    ) &&
    nullableText(v.status) &&
    nullableNumber(v.estimatedDeliveryMinutes) &&
    (v.estimatedDeliveryMinutes === null ||
      (v.estimatedDeliveryMinutes as number) >= 0) &&
    onlyKeys(v.amounts, AMOUNTS) &&
    AMOUNTS.every((key) =>
      nullableNumber((v.amounts as Record<string, unknown>)[key]),
    ) &&
    v.products.every(
      (p) =>
        record(p) &&
        onlyKeys(p, [
          "identity",
          "name",
          "quantity",
          "unitPrice",
          "image",
          "isOffer",
          "isCoupon",
          "isDeliveryDiscount",
          "offerDiscount",
        ]) &&
        (p.identity === null ||
          (typeof p.identity === "string" &&
            /^[a-f0-9]{64}$/.test(p.identity))) &&
        optionalText(p.name) &&
        finite(p.quantity) &&
        p.quantity >= 0 &&
        finite(p.unitPrice) &&
        nullableText(p.image) &&
        [p.isOffer, p.isCoupon, p.isDeliveryDiscount, p.offerDiscount].every(
          (value) => typeof value === "boolean",
        ),
    )
  );
}

export function isOrderHistory(
  v: unknown,
  totalOrders: number,
  totalPrice: number,
): v is OrderHistoryEntry[] {
  if (!Array.isArray(v) || v.length !== totalOrders || !v.every(entry))
    return false;
  return (
    new Set(v.map((order) => order.id)).size === v.length &&
    v.reduce((sum, order) => sum + Math.round(order.price * 100), 0) ===
      Math.round(totalPrice * 100)
  );
}
