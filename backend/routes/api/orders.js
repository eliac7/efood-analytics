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
  const weekdaysName = [
    "Δευτέρα",
    "Τρίτη",
    "Τετάρτη",
    "Πέμπτη",
    "Παρασκευή",
    "Σάββατο",
    "Κυριακή",
  ];

  const monthsName = [
    "Ιανουάριος",
    "Φεβρουάριος",
    "Μάρτιος",
    "Απρίλιος",
    "Μάϊος",
    "Ιούνιος",
    "Ιούλιος",
    "Αύγουστος",
    "Σεπτέμβριος",
    "Οκτώβριος",
    "Νοέμβριος",
    "Δεκέμβριος",
  ];

  const findMostOrderedProduct = (data) => {
    // Create an object to store the total quantity and amount spent on each product
    const productTotals = {};

    // Loop through the data
    for (const order of data) {
      // Loop through the products in the current order
      for (const product of order.products) {
        // If the product is an offer, skip it
        if (product.is_offer) {
          continue;
        }

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

    // Check if all keys inside the "images" object are null
    let isAllNull = true;
    for (let key in mostOrderedProduct.images) {
      if (mostOrderedProduct.images[key] !== null) {
        isAllNull = false;
        break;
      }
    }

    // If all keys inside the "images" object are null, set the image to null othwerise set it to the first image in the "images" object that is not null
    let image = null;
    if (!isAllNull) {
      for (let key in mostOrderedProduct.images) {
        if (mostOrderedProduct.images[key] !== null) {
          image = mostOrderedProduct.images[key];
          break;
        }
      }
    }

    // Return the product name, total quantity, total amount spent and image
    return {
      name: mostOrderedProduct.name || mostOrderedProduct.offer_title,
      quantity: highestTotalQuantity,
      totalPrice:
        Math.round(
          productTotals[mostOrderedProduct.item_code].amountSpent * 100
        ) / 100,
      image: image,
    };
  };

  const calculateRestaurantTotals = (
    data,
    mostMoneySpentCallback,
    allRestaurantsCallback,
    uniqueRestaurantsCallback
  ) => {
    // Create an array to store the total money spent at each restaurant
    const restaurantTotals = [];
    const uniqueRestaurants = new Set();

    // Loop through the data
    for (const order of data) {
      // Get the restaurant for the current order
      const restaurant = order.restaurant;

      uniqueRestaurants.add(restaurant.id);

      // Check if the restaurant is already in the restaurantTotals array
      let existingRestaurant = restaurantTotals.find(
        (r) => r.id === restaurant.id
      );
      if (!existingRestaurant) {
        // If the restaurant is not yet in the restaurantTotals array,
        // add it and set its total and orders to 0
        existingRestaurant = {
          id: restaurant.id,
          is_favorite: order.is_favorite,
          address: restaurant.address,
          restaurant: {
            ...restaurant,
            is_open: order.is_open,
          },
          total: 0,
          orders: 0,
        };
        restaurantTotals.push(existingRestaurant);
      }

      // Calculate the total price for the current order
      let totalPrice = 0;
      for (const product of order.products) {
        totalPrice += product.quantity * product.unit_price;
      }

      // Add the total price for the current order to the current total, and increment the orders count
      existingRestaurant.total += totalPrice;
      existingRestaurant.orders++;
    }

    // Sort the array of restaurants by total money spent in descending order
    restaurantTotals.sort((a, b) => b.total - a.total);

    // Call the mostMoneySpentCallback function with the restaurant with the most money spent as an argument
    mostMoneySpentCallback({
      id: restaurantTotals[0].id,
      name: restaurantTotals[0].restaurant.name,
      totalPrice: Math.round(restaurantTotals[0].total * 100) / 100,
      orders: restaurantTotals[0].orders,
      longitude: restaurantTotals[0].restaurant.longitude,
      latitude: restaurantTotals[0].restaurant.latitude,
      logo: restaurantTotals[0].restaurant.logo,
      is_open: restaurantTotals[0].restaurant.is_open,
      is_favorite: restaurantTotals[0].is_favorite,
      address: restaurantTotals[0].address,
    });

    // Call the allRestaurantsCallback function with the array of all restaurants as an argument
    allRestaurantsCallback(
      restaurantTotals.map((r) => ({
        id: r.id,
        name: r.restaurant.name,
        totalPrice: Math.round(r.total * 100) / 100,
        orders: r.orders,
        longitude: r.restaurant.longitude,
        latitude: r.restaurant.latitude,
        logo: r.restaurant.logo,
        is_open: r.restaurant.is_open,
        is_favorite: r.is_favorite,
        address: r.address,
      }))
    );

    uniqueRestaurantsCallback(uniqueRestaurants.size);
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

    const averageDeliveryTime = ordersInYear.reduce((acc, order) => {
      return acc + order.delivery_time;
    }, 0);

    const totalTips = ordersInYear.reduce((acc, order) => {
      if (order.tip) {
        acc += order.tip;
      }
      return acc;
    }, 0);

    const uniqueRestaurants = new Set();
    let phases = { morning: 0, noon: 0, afternoon: 0, night: 0 };
    let weekdays = {};
    let months = {};
    let cities = {};

    for (const order of ordersInYear) {
      uniqueRestaurants.add(order.restaurant.id);
      const day = new Date(order.submission_date).getDay();
      const month = new Date(order.submission_date).getMonth();

      const monthName = monthsName[month];
      if (months[monthName]) {
        months[monthName] += 1;
      } else {
        months[monthName] = 1;
      }

      const dayName = weekdaysName[day];
      if (weekdays[dayName]) {
        weekdays[dayName] += 1;
      } else {
        weekdays[dayName] = 1;
      }
      const submissionTime = new Date(order.submission_date);
      const hour = submissionTime.getHours();
      if (hour >= 6 && hour < 12) {
        phases.morning += 1;
      }
      if (hour >= 12 && hour < 17) {
        phases.noon += 1;
      }
      if (hour >= 17 && hour < 20) {
        phases.afternoon += 1;
      }

      if (hour >= 20 || hour < 6) {
        phases.night += 1;
      }
      const city = order.restaurant.address.split(",")[1].trim();
      if (cities[city]) {
        cities[city] += 1;
      } else {
        cities[city] = 1;
      }
    }

    // sort cities by number of orders
    cities = Object.keys(cities)
      .sort((a, b) => cities[b] - cities[a])
      .reduce((acc, key) => {
        acc[key] = cities[key];
        return acc;
      }, {});

    // sort months by monthsName, so that the order is always the same (January, February, March, etc.)
    months = Object.keys(months)
      .sort((a, b) => monthsName.indexOf(a) - monthsName.indexOf(b))
      .reduce((acc, key) => {
        acc[key] = months[key];
        return acc;
      }, {});

    // sort phases by number
    phases = Object.keys(phases)
      .sort((a, b) => phases[b] - phases[a])
      .reduce((acc, key) => {
        acc[key] = phases[key];
        return acc;
      }, {});

    // sort weekdays by weekdaysName, so that the order is always the same (Sunday, Monday, Tuesday, etc.)
    weekdays = Object.keys(weekdays)
      .sort((a, b) => weekdaysName.indexOf(a) - weekdaysName.indexOf(b))
      .reduce((acc, key) => {
        acc[key] = weekdays[key];
        return acc;
      }, {});

    let restaurants = ordersInYear.reduce((acc, order) => {
      if (acc[order.restaurant.name]) {
        acc[order.restaurant.name].orders += 1;
        acc[order.restaurant.name].totalPrice += order.price;
        acc[order.restaurant.name].id = order.restaurant.id;
        acc[order.restaurant.name].logo = order.restaurant.logo;
        acc[order.restaurant.name].longitude = order.restaurant.longitude;
        acc[order.restaurant.name].latitude = order.restaurant.latitude;
        acc[order.restaurant.name].is_open = order.is_open;
        acc[order.restaurant.name].is_favorite = order.is_favorite;
        acc[order.restaurant.name].address = order.restaurant.address;
      } else {
        acc[order.restaurant.name] = {
          orders: 1,
          totalPrice: order.price,
          id: order.restaurant.id,
          logo: order.restaurant.logo,
          longitude: order.restaurant.longitude,
          latitude: order.restaurant.latitude,
          is_open: order.is_open,
          is_favorite: order.is_favorite,
          address: order.restaurant.address,
        };
      }
      return acc;
    }, {});

    restaurants = Object.entries(restaurants)
      .sort((a, b) => b[1].totalPrice - a[1].totalPrice)
      .map((restaurant) => {
        restaurant[1].totalPrice = restaurant[1].totalPrice;
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
        is_favorite: restaurant[1].is_favorite,
        address: restaurant[1].address,
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
            image: product.image,
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
        quantity: product[1].orders,
        totalPrice: product[1].totalPrice,
        image: product[1].image ? product[1].image : null,
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
      averageDeliveryTime: Math.round(
        averageDeliveryTime / ordersInYear.length
      ),
      RestaurantWithMostMoneySpent: restaurants[0],
      uniqueRestaurants: uniqueRestaurants.size,
      weekdays,
      phases,
      months,
      cities,
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

      // medium delivery time
      acc.averageDeliveryTime += year.averageDeliveryTime;

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

      // Call the calculateRestaurantTotals function to get the most money spent and all restaurants data
      calculateRestaurantTotals(
        orders,
        (mostMoneySpent) => {
          acc.RestaurantWithMostMoneySpent = mostMoneySpent;
        },
        (allRestaurants) => {
          acc.restaurants = allRestaurants;
        },
        (uniqueRestaurants) => {
          acc.uniqueRestaurants = uniqueRestaurants;
        }
      );

      acc.mostOrderedProduct = findMostOrderedProduct(orders);

      const entries = Object.entries(year.weekdays);
      const accWeekdays = acc.weekdays;

      entries.forEach(([day, orders]) => {
        const isNumber = typeof orders === "number";
        const isDay = accWeekdays[day];

        if (isDay && isNumber) {
          accWeekdays[day] += orders;
        } else {
          accWeekdays[day] = orders;
        }
      });
      acc.weekdays = Object.fromEntries(
        Object.entries(acc.weekdays).sort(
          (a, b) => weekdaysName.indexOf(a[0]) - weekdaysName.indexOf(b[0])
        )
      );

      // add time of day
      Object.entries(year.phases).forEach(([time, orders]) => {
        if (acc.phases[time] && typeof orders === "number") {
          acc.phases[time] += orders;
        } else {
          acc.phases[time] = orders;
        }
      });

      // Sort them by number of orders in descending order
      // sort phases by number of orders
      acc.phases = Object.fromEntries(
        Object.entries(acc.phases).sort((a, b) => b[1] - a[1])
      );

      Object.entries(year.months).forEach(([month, orders]) => {
        if (acc.months[month] && typeof orders === "number") {
          acc.months[month] += orders;
        } else {
          acc.months[month] = orders;
        }
      });

      // Sort them by keeping the order of the monthsName array
      //Creating the object
      acc.months = Object.fromEntries(
        //Sorting the entries
        Object.entries(acc.months).sort(
          //Sorting the months
          (a, b) => monthsName.indexOf(a[0]) - monthsName.indexOf(b[0])
        )
      );

      Object.entries(year.cities).forEach(([city, orders]) => {
        if (acc.cities[city] && typeof orders === "number") {
          acc.cities[city] += orders;
        } else {
          acc.cities[city] = orders;
        }
      });

      // Sort them by number of orders in descending order

      acc.cities = Object.fromEntries(
        Object.entries(acc.cities).sort((a, b) => b[1] - a[1])
      );

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
      averageDeliveryTime: 0,
      RestaurantWithMostMoneySpent: null,
      restaurants: [],
      mostOrderedProduct: null,
      uniqueRestaurants: 0,
      weekdays: {},
      phases: {},
      months: {},
      cities: {},
    }
  );
  ordersAllTime.averageDeliveryTime = Math.round(
    ordersAllTime.averageDeliveryTime / ordersPerYear.length
  );

  const finalOrders = {
    all: ordersAllTime,
    perYear: ordersPerYear,
  };

  return finalOrders;
}

async function getUserOrders(session_id, offset) {
  const orders_url = new URL(
    "https://api.e-food.gr/api/v1/user/orders/history"
  );

  orders_url.searchParams.append("limit", 100);
  orders_url.searchParams.append("offset", offset);
  orders_url.searchParams.append("mode", "extended");

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
      const manipulatedOrders = await manipulateOrders(arrayOrders);
      if (response.data.data.hasNext) {
        const newOffset = parseInt(offset) + 100;
        req.headers.offset = newOffset;
        return orders(req, res);
      } else {
        arrayOrders = [];
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
