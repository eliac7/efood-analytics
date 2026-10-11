import type { EfoodOrder, EfoodProduct, MostOrderedProduct } from "../../../types.js";
import { toCents } from "./money.js";

interface ProductTotal {
  product: EfoodProduct;
  quantity: number;
  amountSpentCents: number;
}

/**
 * Find the most ordered product from order data
 * @param {Array} orders - Array of orders
 * @returns {Object} - Most ordered product info
 */
export function findMostOrderedProduct(
  orders: Array<Pick<EfoodOrder, "restaurant" | "products">>
): MostOrderedProduct | null {
  const productTotals = new Map<string, ProductTotal>();

  for (const order of orders) {
    for (const product of order.products) {
      if (product.is_offer) continue;

      const key = JSON.stringify([
        String(order.restaurant.id),
        product.item_code,
        product.size_info ?? "",
        product.customisation ?? "",
      ]);
      if (!productTotals.has(key)) {
        productTotals.set(key, {
          product,
          quantity: 0,
          amountSpentCents: 0,
        });
      }

      const total = productTotals.get(key)!;
      total.quantity += product.quantity;
      total.amountSpentCents += toCents(product.quantity * product.unit_price);
    }
  }

  // Find product with highest quantity
  let mostOrdered: ProductTotal | null = null;

  for (const total of productTotals.values()) {
    if (total.quantity > (mostOrdered?.quantity ?? 0)) {
      mostOrdered = total;
    }
  }

  if (!mostOrdered) return null;

  // Get first non-null image
  const { product } = mostOrdered;
  const image = product.images
    ? Object.values(product.images).find((img): img is string => typeof img === "string" && img.length > 0) || null
    : null;

  return {
    name: product.name || product.offer_title,
    quantity: mostOrdered.quantity,
    totalPrice: mostOrdered.amountSpentCents / 100,
    image,
  };
}
