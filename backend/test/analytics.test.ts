import { describe, expect, it } from "vitest";
import { analyzeOrders } from "../services/analytics/index.js";
import { calculateYearStats, calculateAllTimeStats } from "../services/analytics/orders/yearStats.js";
import { calculateRestaurantStats } from "../services/analytics/orders/restaurantStats.js";
import { findMostOrderedProduct } from "../services/analytics/orders/productStats.js";
import { calculateTimeStats } from "../services/analytics/orders/timeStats.js";
import { analyticsOrders } from "./fixtures/orders.js";
import type { EfoodOrder } from "../types.js";

describe("order analytics", () => {
  it("analyzes orders across years and excludes invalid dates from per-year buckets", () => {
    const result = analyzeOrders(analyticsOrders);

    expect(result.perYear.map((year) => year.year)).toEqual(["2025", "2024"]);
    expect(result.all.totalOrders).toBe(4);
    expect(result.all.totalPrice).toBe(49.74);
    expect(result.all.firstOrder).toBe("2024-12-31 21:15:00");
    expect(result.all.lastOrder).toBe("2025-04-15 13:00:00");
    expect(result.all.platforms).toEqual({ android: 1, web: 2, ios: 1 });
    expect(result.all.paymentMethods).toEqual({ credit_card: 1, cash: 2, paypal: 1 });
    expect(result.all.averageDeliveryTime).toBe(38);
  });

  it("calculates complete year stats for totals, restaurants, products, and time buckets", () => {
    const orders2025 = analyticsOrders.slice(0, 2);
    const stats = calculateYearStats(orders2025, "2025");

    expect(stats).toMatchObject({
      year: "2025",
      totalOrders: 2,
      totalPrice: 32.75,
      couponAmount: 1,
      deliveryCost: 2,
      totalTips: 2,
      platforms: { web: 1, android: 1 },
      paymentMethods: { cash: 1, credit_card: 1 },
      firstOrder: "2025-03-10 11:30:00",
      lastOrder: "2025-04-15 13:00:00",
      averageDeliveryTime: 30,
      uniqueRestaurants: 1,
    });
    expect(stats.restaurantWithMostMoneySpent).toMatchObject({
      id: 1,
      name: "Gyro House",
      totalPrice: 32.75,
      orders: 2,
    });
    expect(stats.mostOrderedProduct).toEqual({
      name: "Pita",
      quantity: 2,
      totalPrice: 10,
      image: "pita.jpg",
    });
    expect(stats.phases).toEqual({ morning: 1, noon: 1, afternoon: 0, night: 0 });
    expect(stats.weekdays).toEqual({ "Δευτέρα": 1, "Τρίτη": 1 });
    expect(stats.months).toEqual({ "Μάρτιος": 1, "Απρίλιος": 1 });
    expect(stats.cities).toEqual({ Athens: 1, Koukaki: 1 });
  });

  it("calculates all-time stats from per-year stats and all orders", () => {
    const validOrders = analyticsOrders.slice(0, 3);
    const yearStats = [
      calculateYearStats(validOrders.slice(0, 2), "2025"),
      calculateYearStats(validOrders.slice(2), "2024"),
    ];

    const allTime = calculateAllTimeStats(yearStats, validOrders);

    expect(allTime.totalOrders).toBe(3);
    expect(allTime.totalPrice).toBe(42.74);
    expect(allTime.couponAmount).toBe(1.5);
    expect(allTime.deliveryCost).toBe(3);
    expect(allTime.totalTips).toBe(2);
    expect(allTime.uniqueRestaurants).toBe(2);
    expect(allTime.averageDeliveryTime).toBe(38);
    expect(allTime.restaurantWithMostMoneySpent?.name).toBe("Gyro House");
    expect(allTime.mostOrderedProduct?.name).toBe("Pasta");
  });

  it("aggregates restaurants by spend and handles empty inputs", () => {
    const restaurants = calculateRestaurantStats(analyticsOrders.slice(0, 3));

    expect(restaurants.uniqueCount).toBe(2);
    expect(restaurants.allRestaurants.map((restaurant) => restaurant.name)).toEqual([
      "Gyro House",
      "Pasta Place",
    ]);
    expect(restaurants.mostMoneySpent?.totalPrice).toBe(32.75);

    expect(calculateRestaurantStats([])).toEqual({
      mostMoneySpent: null,
      allRestaurants: [],
      uniqueCount: 0,
    });
  });

  it("ignores offer products and returns null when no product qualifies", () => {
    expect(findMostOrderedProduct(analyticsOrders.slice(0, 2))).toEqual({
      name: "Pita",
      quantity: 2,
      totalPrice: 10,
      image: "pita.jpg",
    });

    expect(
      findMostOrderedProduct([
        {
          restaurant: analyticsOrders[0].restaurant,
          products: [
            {
              item_code: "offer-only",
              offer_title: "Offer",
              quantity: 5,
              unit_price: 1,
              is_offer: true,
            },
          ],
        },
      ])
    ).toBeNull();
  });

  it("maps weekdays, months, phases, and city fallbacks correctly", () => {
    const stats = calculateTimeStats(analyticsOrders.slice(0, 3));

    expect(stats.weekdays).toEqual({ "Δευτέρα": 1, "Τρίτη": 2 });
    expect(stats.months).toEqual({ "Μάρτιος": 1, "Απρίλιος": 1, "Δεκέμβριος": 1 });
    expect(stats.phases).toEqual({ night: 1, morning: 1, noon: 1, afternoon: 0 });
    expect(stats.cities).toEqual({ Athens: 1, Koukaki: 1, Patras: 1 });
  });

  it("ranks stores by the reported order total and reconciles to the dashboard", () => {
    const orders = [
      { ...analyticsOrders[0], price: 8, products: [{ ...analyticsOrders[0].products[0], quantity: 1, unit_price: 200 }] },
      { ...analyticsOrders[2], price: 12, products: [{ ...analyticsOrders[2].products[0], quantity: 1, unit_price: 3 }] },
    ];
    const stats = analyzeOrders(orders).all;
    expect(stats.restaurantWithMostMoneySpent?.id).toBe(2);
    expect(stats.restaurants.map((store) => store.totalPrice)).toEqual([12, 8]);
    expect(stats.restaurants.reduce((sum, store) => sum + store.totalPrice, 0)).toBe(stats.totalPrice);
  });

  it("keeps shared product codes in different stores separate", () => {
    const makeOrder = (restaurantId: number, code: string, quantity: number, price: number): EfoodOrder => ({
      ...analyticsOrders[0],
      restaurant: { ...analyticsOrders[0].restaurant, id: restaurantId },
      products: [{ item_code: code, name: `${restaurantId}-${code}`, quantity, unit_price: price }],
    });
    const orders = [makeOrder(1, "shared", 2, 5), makeOrder(2, "shared", 2, 10), makeOrder(3, "other", 3, 4)];
    expect(findMostOrderedProduct(orders)).toMatchObject({ name: "3-other", quantity: 3, totalPrice: 12 });
    expect(findMostOrderedProduct([orders[0], orders[1], orders[1]])).toMatchObject({ name: "2-shared", quantity: 4, totalPrice: 40 });
  });

  it("does not merge different sizes or customisations of a product", () => {
    const base = analyticsOrders[0];
    const product = { item_code: "coffee", name: "Coffee", quantity: 2, unit_price: 3 };
    const result = findMostOrderedProduct([
      { ...base, products: [{ ...product, size_info: "small", customisation: "black" }] },
      { ...base, products: [{ ...product, size_info: "large", customisation: "black" }] },
      { ...base, products: [{ ...product, size_info: "small", customisation: "milk" }] },
      { ...base, products: [{ ...product, item_code: "tea", name: "Tea", quantity: 3 }] },
    ]);
    expect(result).toMatchObject({ name: "Tea", quantity: 3, totalPrice: 9 });
  });

  it("sums money in cents without rounding drift or counting fees twice", () => {
    const orders = Array.from({ length: 10 }, () => ({
      ...analyticsOrders[0], price: 0.1, tip: 0.1, delivery_cost: 0.1,
      coupon: { amount: 0.1 }, service_fee: 0.1, service_fees: { total: 0.1 },
    }));
    const stats = analyzeOrders(orders).all;
    expect(stats).toMatchObject({ totalPrice: 1, totalTips: 1, deliveryCost: 1, couponAmount: 1 });
    expect(stats.restaurants[0].totalPrice).toBe(1);
  });

  it("distinguishes known zero from missing or partially missing monetary data", () => {
    const zeroOrder: EfoodOrder = { ...analyticsOrders[0], tip: 0, delivery_cost: 0, coupon: null };
    const missingOrder: EfoodOrder = { ...zeroOrder, tip: undefined, delivery_cost: null, coupon: undefined };
    expect(analyzeOrders([zeroOrder]).all).toMatchObject({ totalTips: 0, deliveryCost: 0, couponAmount: 0 });
    expect(analyzeOrders([zeroOrder, missingOrder]).all).toMatchObject({ totalTips: null, deliveryCost: null, couponAmount: null });
    expect(analyzeOrders([]).all).toMatchObject({ totalPrice: 0, totalTips: 0, deliveryCost: 0, couponAmount: 0 });
  });

  it("uses explicit delivery estimates and excludes invalid durations", () => {
    const orders: EfoodOrder[] = [
      { ...analyticsOrders[0], delivery_time: 5, delivery: { time_estimation: { minutes: 50 } } },
      { ...analyticsOrders[0], delivery_time: -10 },
      { ...analyticsOrders[0], delivery_time: null },
    ];
    expect(analyzeOrders(orders).all.averageDeliveryTime).toBe(50);
  });

  it("retains new payment types and buckets missing values explicitly", () => {
    const stats = analyzeOrders([
      { ...analyticsOrders[0], platform: undefined, payment_type: "" },
      { ...analyticsOrders[0], platform: "new-platform", payment_type: "new-payment" },
    ]).all;
    expect(stats.platforms).toEqual({ unknown: 1, "new-platform": 1 });
    expect(stats.paymentMethods).toEqual({ unknown: 1, "new-payment": 1 });
  });
});
