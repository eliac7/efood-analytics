const express = require("express");
const app = express();
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
let orders = [];
const port = process.env.PORT || 3002;
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

async function getUserSession(body) {
  //Fetch to Efood API
  const DEFAULT_URL = "https://thingproxy.freeboard.io/fetch/";
  const USER_LOGIN = "https://api.e-food.gr/api/v1/user/login";
  const url = DEFAULT_URL + USER_LOGIN;

  const { data } = await axios.post(url, body);
  if (data.status === "ok") {
    const session_id = await data.data.session_id;
    const name = await data.data.user.first_name_in_vocative;
    return Promise.resolve({ session_id, name });
  } else {
    return Promise.reject(data.message);
  }
}

async function getUserOrders(tkn, num) {
  const DEFAULT_URL = "https://thingproxy.freeboard.io/fetch/";
  const USER_ORDERS = `https://api.e-food.gr/api/v1/user/orders/history?limit=100&offset=${num}&mode=extended`;
  const URL = DEFAULT_URL + USER_ORDERS;

  const { data } = await axios.get(URL, {
    headers: {
      "X-core-session-id": tkn,
    },
  });
  if (data.status === "ok") {
    const res = data.data;
    return Promise.resolve(res);
  } else {
    return Promise.reject(data.message);
  }
}

async function Logic(orders, name) {
  //Get the first order
  const firstOrder = new Date(
    orders[orders.length - 1].submission_date
  ).toLocaleDateString("el-GR");
  //Get the last order
  const lastOrder = new Date(orders[0].submission_date).toLocaleDateString(
    "el-GR"
  );

  //Total orders
  const totalOrders = orders.length;

  //Get total price of all orders, all the restaurants, tips, payment methods
  let totalPrice = 0;
  let totalTips = 0;
  let deliveryCost = 0;
  let restaurants = [];
  let paymentMethods = {
    paypal: 0,
    cash: 0,
    credit_card: 0,
  };
  let platforms = {
    web: 0,
    ios: 0,
    android: 0,
  };
  let totalProducts = [];
  let mediumTotalDeliveryTime = 0;
  let ordersByYear = {};
  let couponAmount = 0;
  orders.forEach((order) => {
    totalPrice += order.price;
    restaurants.push({
      name: order.restaurant.name,
      longitude: order.restaurant.longitude,
      latitude: order.restaurant.latitude,
      logo: order.restaurant.logo,
      times: 0,
      amount: 0,
    });

    totalTips += order.tip;

    switch (order.payment_type) {
      case "paypal":
        paymentMethods.paypal++;
        break;
      case "cash":
        paymentMethods.cash++;
        break;
      case "credit_card":
        paymentMethods.credit_card++;
        break;
      default:
        break;
    }

    switch (order.platform) {
      case "web":
        platforms.web++;
        break;
      case "ios":
        platforms.ios++;
        break;
      case "android":
        platforms.android++;
        break;
      default:
        break;
    }

    order.products.map((product) => {
      let image;

      if (product.images) {
        const {
          original,
          menu_item,
          popular_item,
          banner_item,
          featured_item,
        } = product.images;
        if (original) {
          image = original;
        } else if (menu_item) {
          image = menu_item;
        } else if (popular_item) {
          image = popular_item;
        } else if (banner_item) {
          image = banner_item;
        } else {
          image = featured_item;
        }
      }

      totalProducts.push({
        name: product.name,
        quantity: product.quantity,
        customisation: product.customisation || null,
        price: product.full_price,
        image,
      });
    });

    deliveryCost += order.delivery_cost;
    mediumTotalDeliveryTime += order.delivery_time;

    //Get orders by year and with total amount
    const year = new Date(order.submission_date).getFullYear();
    if (ordersByYear[year]) {
      ordersByYear[year].amount += order.price;
      ordersByYear[year].times++;
      ordersByYear[year].amount = parseFloat(
        ordersByYear[year].amount.toFixed(2)
      );
    } else {
      ordersByYear[year] = {
        amount: order.price,
        times: 1,
      };

      ordersByYear[year].amount = parseFloat(
        ordersByYear[year].amount.toFixed(2)
      );
    }

    if (order.coupon) {
      couponAmount += order.coupon.amount;
    }
  });
  //Get the medium of delivery time by the total orders

  const mediumDeliveryTime = Math.round(mediumTotalDeliveryTime / totalOrders);

  totalPrice = totalPrice.toFixed(2);
  //Remove duplicate restaurants
  let removedRestaurants = restaurants.filter(
    (arr, index, self) => index === self.findIndex((t) => t.name === arr.name)
  );

  //Most frequent restaurant

  restaurants.forEach((item) => {
    removedRestaurants.forEach((store) => {
      if (item.name === store.name) {
        store.times++;
      }
    });
  });

  removedRestaurants.sort((a, b) => (b.times > a.times ? 1 : -1));

  //Get the total amount have been spent of each restaurant
  orders.forEach((order) => {
    removedRestaurants.forEach((store) => {
      if (order.restaurant.name === store.name) {
        store.amount += Number(order.price);
      }
      store.amount = Number(store.amount.toFixed(2));
    });
  });

  //Remove duplicate products
  let removedProducts = totalProducts.filter(
    (arr, index, self) => index === self.findIndex((t) => t.name === arr.name)
  );

  //On removedPoducts count the quantity of each product from all the orders and add the total price of each product
  removedProducts.forEach((product) => {
    let total = 0;
    totalProducts.forEach((item) => {
      if (product.name === item.name) {
        total += item.quantity;
      }
    });
    product.quantity = total;
    product.totalPrice = Number(product.price * total).toFixed(2);
  });

  //Sort the products by quantity
  removedProducts.sort((a, b) => (b.quantity > a.quantity ? 1 : -1));

  // console.log(
  //   "First order: " + firstOrder,
  //   "Last order: " + lastOrder,
  //   "Total orders: " + totalOrders,
  //   "Total money: " + totalPrice,
  //   "Total tips: " + totalTips,
  //   "Restaurants" + removedRestaurants,
  //   "Frequent restaurant: " + removedRestaurants[0].name,
  //   removedRestaurants[0].times,
  //   "Unique restaurants: " + removedRestaurants.length,
  //   "Payment methods: " + paymentMethods,
  //   "Platforms: " + platforms,
  //   "Delivery cost on Efood: " + deliveryCost,
  //   "Most frequent product: " + removedProducts[0].name,
  //   "Most frequent product quantity: " + removedProducts[0].totalPrice,
  //   "Medium delivery time: " + mediumDeliveryTime + " minutes",
  //   "Orders by year: " + ordersByYear,
  //   "Coupon amount: " + couponAmount
  // );

  return {
    firstOrder,
    lastOrder,
    totalOrders,
    totalPrice,
    totalTips,
    restaurants: removedRestaurants,
    paymentMethods,
    platforms,
    deliveryCost,
    frequentProducct: {
      name: removedProducts[0].name,
      price: removedProducts[0].totalPrice,
    },
    mediumDeliveryTime,
    ordersByYear,
    couponAmount,
    name,
  };
}

app.post("/api/v1/efood", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(500).json({ error: "Please enter e-mail or password." });
    return;
  }

  try {
    // const { session_id, name } = await getUserSession(req.body);
    // let data = await getUserOrders(session_id, 0);
    // let offset = 100;
    // data.orders.forEach((order) => {
    //   orders.push(order);
    // });

    // while (data.hasNext) {
    //   data = await getUserOrders(session_id, offset);
    //   data.orders.forEach((order) => {
    //     orders.push(order);
    //   });
    //   offset += 100;
    // }

    let rawdata = fs.readFileSync("orders.json");
    let orders = JSON.parse(rawdata);
    let name = "Efood";
    const result = await Logic(orders, name);

    //delay to simulate the time of the request
    setTimeout(() => {
      res.status(200).json(result);
    }, 1000);
  } catch (error) {
    res.status(403).send({ error });
  }
});

app.get("*", (req, res) => {
  res.status(404).json({
    status: 404,
    message: "Page not found",
  });
});

app.listen(port, () => console.log(`Listening on ${port}`));
