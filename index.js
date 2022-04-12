const express = require("express");
const app = express();
const axios = require("axios");
const fetch = require("node-fetch");
const cors = require("cors");
const fs = require("fs");
let orders = [];
const port = process.env.PORT || 3002;
require("dotenv").config();

app.use(cors());
app.use(express.json());

async function getUserSession(body) {
  //Fetch to Efood API
  const DEFAULT_URL = "https://thingproxy.freeboard.io/fetch/";
  const USER_LOGIN = "https://api.e-food.gr/api/v1/user/login";
  const url = DEFAULT_URL + USER_LOGIN;

  const { data } = await axios.post(url, body);
  if (data.status === "ok") {
    const res = await data.data.session_id;
    return Promise.resolve(res);
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

async function Logic(orders) {
  //Get the first order
  const firstOrder = new Date(orders[0].submission_date).toLocaleDateString(
    "el-GR"
  );
  //Get the last order
  const lastOrder = new Date(
    orders[orders.length - 1].submission_date
  ).toLocaleDateString("el-GR");

  //Total orders
  const totalOrders = orders.length;

  //Get total price of all orders
  let totalPrice = 0;
  orders.forEach((order) => {
    totalPrice += order.price;
  });

  totalPrice = totalPrice.toFixed(2);

  //Get all the restaurants
  const restaurants = [];
  orders.forEach((order) => {
    if (!restaurants.includes(order.restaurant.name)) {
      restaurants.push(order.restaurant.name);
    }
  });
  //Remove any duplicates
  const uniqueRestaurants = [...new Set(restaurants)];

  console.log(
    firstOrder,
    lastOrder,
    totalOrders,
    totalPrice,
    uniqueRestaurants.length
  );
}

app.post("/api/v1/efood", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(500).json({ error: "Please enter e-mail or password." });
    return;
  }

  try {
    const token = await getUserSession(req.body);
    let data = await getUserOrders(token, 0);
    let offset = 100;
    data.orders.forEach((order) => {
      orders.push(order);
    });

    while (data.hasNext) {
      data = await getUserOrders(token, offset);
      data.orders.forEach((order) => {
        orders.push(order);
      });
      offset += 100;
    }

    console.log(orders.length);
    res.status(200).json(orders);
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
