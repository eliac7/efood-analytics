import express from "express";
const router = express.Router();
import checkSession from "../../middlewares/checkSession.js";
import checkResStatus from "../../middlewares/checkResStatus.js";
import { readFile } from "fs/promises";

import axios from "axios";

let arrayOrders = [];

let fakeOrders = async () => {
  try {
    return JSON.parse(await readFile("./data/postman-orders.json", "utf-8"));
  } catch (err) {
    console.log(err);
  }
};

async function manipulateOrders(orders) {
  const years = [
    ...new Set(orders.map((order) => order.submission_date.slice(0, 4))),
  ];

  const findMostOrderedProduct = (data) => {
    // Create an object to store the total quantity and amount spent on each product
    const productTotals = {};

    // Loop through the data
    for (const order of data) {
      // Loop through the products in the current order
      for (const product of order.products) {
        // If the product is not yet in the productTotals object,
        // add it and set its total quantity and amount spent to 0
        if (!productTotals[product.item_code]) {
          productTotals[product.item_code] = {
            product,
            quantity: 0,
            amountSpent: 0,
          };
        }

        // Get the current product's total quantity and amount spent
        const currentTotalQuantity = productTotals[product.item_code].quantity;
        const currentTotalAmountSpent =
          productTotals[product.item_code].amountSpent;

        // Calculate the total price for the current product
        const totalPrice = product.quantity * product.unit_price;

        // Add the quantity and amount spent for the current product to the current totals
        productTotals[product.item_code].quantity =
          currentTotalQuantity + product.quantity;
        productTotals[product.item_code].amountSpent =
          currentTotalAmountSpent + totalPrice;
      }
    }

    // Find the product with the highest total quantity
    let mostOrderedProduct = null;
    let highestTotalQuantity = 0;
    for (const productCode in productTotals) {
      const productTotal = productTotals[productCode];
      if (productTotal.quantity > highestTotalQuantity) {
        mostOrderedProduct = productTotal.product;
        highestTotalQuantity = productTotal.quantity;
      }
    }

    // Return the product name, total quantity, and total amount spent
    return {
      name: mostOrderedProduct.name,
      quantity: highestTotalQuantity,
      amountSpent:
        Math.round(
          productTotals[mostOrderedProduct.item_code].amountSpent * 100
        ) / 100,
    };
  };

  const findRestaurantWithMostMoneySpent = (data) => {
    // Create an object to store the total money spent at each restaurant
    const restaurantTotals = {};

    // Loop through the data
    for (const order of data) {
      // Get the restaurant for the current order
      const restaurant = order.restaurant;

      // If the restaurant is not yet in the restaurantTotals object,
      // add it and set its total to 0
      if (!restaurantTotals[restaurant.id]) {
        restaurantTotals[restaurant.id] = {
          restaurant: {
            ...restaurant,
            is_open: order.is_open,
          },
          total: 0,
        };
      }

      // Get the current restaurant's total
      const currentTotal = restaurantTotals[restaurant.id].total;

      // Calculate the total price for the current order
      let totalPrice = 0;
      for (const product of order.products) {
        totalPrice += product.quantity * product.unit_price;
      }

      // Add the total price for the current order to the current total
      restaurantTotals[restaurant.id].total = currentTotal + totalPrice;
    }

    // Find the restaurant with the highest total money spent
    let mostMoneySpent = null;
    let highestTotal = 0;
    for (const restaurantId in restaurantTotals) {
      const restaurantTotal = restaurantTotals[restaurantId];
      if (restaurantTotal.total > highestTotal) {
        mostMoneySpent = restaurantTotal.restaurant;
        highestTotal = restaurantTotal.total;
      }
    }

    // Return the restaurant name, total amount spent, and longitude and latitude, logo, and is_open
    return {
      name: mostMoneySpent.name,
      total: Math.round(highestTotal * 100) / 100,
      longitude: mostMoneySpent.longitude,
      latitude: mostMoneySpent.latitude,
      logo: mostMoneySpent.logo,
      is_open: mostMoneySpent.is_open,
    };
  };

  const ordersPerYear = years.map((year) => {
    const ordersInYear = orders.filter(
      (order) => order.submission_date.slice(0, 4) === year
    );

    const lastOrder = ordersInYear[0].submission_date;
    const firstOrder = ordersInYear[ordersInYear.length - 1].submission_date;

    const totalPrice = ordersInYear.reduce((acc, order) => {
      return acc + order.price;
    }, 0);

    const platforms = ordersInYear.reduce((acc, order) => {
      if (acc[order.platform]) {
        acc[order.platform] += 1;
      } else {
        acc[order.platform] = 1;
      }
      return acc;
    }, {});

    const paymentMethods = ordersInYear.reduce((acc, order) => {
      if (acc[order.payment_type]) {
        acc[order.payment_type] += 1;
      } else {
        acc[order.payment_type] = 1;
      }
      return acc;
    }, {});

    const couponAmount = ordersInYear.reduce((acc, order) => {
      if (order.coupon) {
        acc += order.coupon.amount;
      }
      return acc;
    }, 0);

    const deliveryCost = ordersInYear.reduce((acc, order) => {
      if (order.delivery_cost) {
        acc += order.delivery_cost;
      }
      return acc;
    }, 0);

    const mediumDeliveryTime = ordersInYear.reduce((acc, order) => {
      return acc + order.delivery_time;
    }, 0);

    const totalTips = ordersInYear.reduce((acc, order) => {
      if (order.tip) {
        acc += order.tip;
      }
      return acc;
    }, 0);

    let restaurants = ordersInYear.reduce((acc, order) => {
      if (acc[order.restaurant.name]) {
        acc[order.restaurant.name].orders += 1;
        acc[order.restaurant.name].totalPrice += order.price;
        acc[order.restaurant.name].id = order.restaurant.id;
        acc[order.restaurant.name].logo = order.restaurant.logo;
        acc[order.restaurant.name].longitude = order.restaurant.longitude;
        acc[order.restaurant.name].latitude = order.restaurant.latitude;
        acc[order.restaurant.name].is_open = order.is_open;
      } else {
        acc[order.restaurant.name] = {
          orders: 1,
          totalPrice: order.price,
          id: order.restaurant.id,
          logo: order.restaurant.logo,
          longitude: order.restaurant.longitude,
          latitude: order.restaurant.latitude,
          is_open: order.is_open,
        };
      }
      return acc;
    }, {});

    restaurants = Object.entries(restaurants)
      .sort((a, b) => b[1].totalPrice - a[1].totalPrice)
      .map((restaurant) => {
        restaurant[1].totalPrice = restaurant[1].totalPrice.toFixed(2);
        return restaurant;
      });

    restaurants = restaurants.map((restaurant) => {
      return {
        name: restaurant[0],
        orders: restaurant[1].orders,
        totalPrice: restaurant[1].totalPrice,
        id: restaurant[1].id,
        logo: restaurant[1].logo,
        longitude: restaurant[1].longitude,
        latitude: restaurant[1].latitude,
        is_open: restaurant[1].is_open,
      };
    });

    const products = ordersInYear.reduce((acc, order) => {
      order.products.forEach((product) => {
        if (acc[product.name]) {
          acc[product.name].orders += product.quantity;
          acc[product.name].totalPrice += product.unit_price * product.quantity;
        } else {
          acc[product.name] = {
            orders: product.quantity,
            totalPrice: product.unit_price * product.quantity,
          };
        }
      });
      return acc;
    }, {});

    let mostOrderedProduct = Object.entries(products)
      .sort((a, b) => b[1].orders - a[1].orders)
      .map((product) => {
        product[1].totalPrice = product[1].totalPrice.toFixed(2);
        return product;
      });

    mostOrderedProduct = mostOrderedProduct.map((product) => {
      return {
        name: product[0],
        orders: product[1].orders,
        totalPrice: product[1].totalPrice,
      };
    });

    mostOrderedProduct = mostOrderedProduct[0];

    return {
      year,
      totalOrders: ordersInYear.length,
      totalPrice: Math.round(totalPrice * 100) / 100,
      platforms,
      paymentMethods,
      firstOrder,
      lastOrder,
      couponAmount,
      deliveryCost,
      totalTips,
      restaurants,
      mostOrderedProduct,
      mediumDeliveryTime: Math.round(mediumDeliveryTime / ordersInYear.length),
    };
  });

  const ordersAllTime = ordersPerYear.reduce(
    (acc, year) => {
      acc.totalOrders += year.totalOrders;
      acc.totalPrice += year.totalPrice;
      acc.couponAmount += year.couponAmount;
      acc.deliveryCost += year.deliveryCost;
      acc.totalTips += year.totalTips;

      // add the first and last order
      acc.firstOrder = ordersPerYear[ordersPerYear.length - 1].firstOrder;
      acc.lastOrder = ordersPerYear[0].lastOrder;

      // add the platforms and paymentMethods
      Object.entries(year.platforms).forEach((platform) => {
        if (acc.platforms[platform[0]]) {
          acc.platforms[platform[0]] += platform[1];
        } else {
          acc.platforms[platform[0]] = platform[1];
        }
      });
      Object.entries(year.paymentMethods).forEach((paymentMethod) => {
        if (acc.paymentMethods[paymentMethod[0]]) {
          acc.paymentMethods[paymentMethod[0]] += paymentMethod[1];
        } else {
          acc.paymentMethods[paymentMethod[0]] = paymentMethod[1];
        }
      });

      acc.RestaurantWithMostMoneySpent =
        findRestaurantWithMostMoneySpent(orders);
      acc.MostOrderedProduct = findMostOrderedProduct(orders);

      return acc;
    },
    {
      totalOrders: 0,
      totalPrice: 0,
      couponAmount: 0,
      deliveryCost: 0,
      totalTips: 0,
      platforms: {},
      paymentMethods: {},
      firstOrder: null,
      lastOrder: null,
    }
  );

  const finalOrders = {
    all: ordersAllTime,
    perYear: ordersPerYear,
  };

  return finalOrders;
}

async function getUserOrders(session_id, offset) {
  const orders_url = `https://api.e-food.gr/api/v1/user/orders/history?limit=100&offset=${offset}&mode=extended`;
  const orders_headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    "x-core-session-id": session_id,
  };
  const response = await axios.get(orders_url, { headers: orders_headers });
  return response;
}

async function orders(req, res) {
  const { session_id, offset = 0 } = req.headers;

  try {
    if (process.env.NODE_ENV === "development") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return res.status(200).json(await fakeOrders());
    } else {
      const response = await getUserOrders(session_id, offset);
      arrayOrders.push(...response.data.data.orders);
      if (response.data.data.hasNext) {
        const newOffset = parseInt(offset) + 100;
        req.headers.offset = newOffset;
        return orders(req, res);
      } else {
        const manipulatedOrders = await manipulateOrders(arrayOrders);
        return res.status(200).json({
          orders: manipulatedOrders,
          message: response.data.message,
        });
      }
    }
  } catch (err) {
    const statusCode = err?.response?.status;
    if (statusCode === 429) {
      const retryAfter = err.response.headers["retry-after"];
      const retryAfterInMinutes = Math.ceil(retryAfter / 60);
      return res.status(429).json({
        message: `Too many requests. Please try again in ${retryAfterInMinutes} minutes`,
      });
    }
    return res.status(400).json({ message: err.message });
  }
}

router.get("/", [checkSession, checkResStatus], orders);
router.all("/", (req, res) => {
  res
    .status(405)
    .json({ message: "Method not allowed. Plesae use GET method" });
});

export default router;