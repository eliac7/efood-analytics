var router = require("express").Router();
const checkSession = require("../../middlewares/checkSession.js");
const checkResStatus = require("../../middlewares/checkResStatus.js");
const fakeOrders = require("../../tests/postman-orders.json");
const axios = require("axios");

let arrayOrders = [];

async function manipulateOrders(orders) {
  const years = [
    ...new Set(orders.map((order) => order.submission_date.slice(0, 4))),
  ];

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

  return ordersPerYear;
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
    // const response = await getUserOrders(session_id, offset);
    // arrayOrders.push(...response.data.data.orders);
    // if (!response.data.data.hasNext) {
    //   const newOffset = parseInt(offset) + 100;
    //   req.headers.offset = newOffset;
    //   return orders(req, res);
    // } else {
    //   const manipulatedOrders = await manipulateOrders(arrayOrders);
    //   return res.status(200).json({
    //     orders: manipulatedOrders,
    //     message: response.data.message,
    //   });
    // }
    return res.status(200).json({
      orders: fakeOrders,
      message: "OK",
    });
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

module.exports = router;
