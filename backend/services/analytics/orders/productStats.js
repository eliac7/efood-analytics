/**
 * Find the most ordered product from order data
 * @param {Array} orders - Array of orders
 * @returns {Object} - Most ordered product info
 */
export function findMostOrderedProduct(orders) {
  const productTotals = {};

  for (const order of orders) {
    for (const product of order.products) {
      if (product.is_offer) continue;

      if (!productTotals[product.item_code]) {
        productTotals[product.item_code] = {
          product,
          quantity: 0,
          amountSpent: 0,
        };
      }

      productTotals[product.item_code].quantity += product.quantity;
      productTotals[product.item_code].amountSpent +=
        product.quantity * product.unit_price;
    }
  }

  // Find product with highest quantity
  let mostOrdered = null;
  let highestQuantity = 0;

  for (const productCode in productTotals) {
    if (productTotals[productCode].quantity > highestQuantity) {
      mostOrdered = productTotals[productCode].product;
      highestQuantity = productTotals[productCode].quantity;
    }
  }

  if (!mostOrdered) return null;

  // Get first non-null image
  const image = mostOrdered.images
    ? Object.values(mostOrdered.images).find((img) => img !== null) || null
    : null;

  return {
    name: mostOrdered.name || mostOrdered.offer_title,
    quantity: highestQuantity,
    totalPrice:
      Math.round(productTotals[mostOrdered.item_code].amountSpent * 100) / 100,
    image,
  };
}
