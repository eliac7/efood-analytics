import { describe, expect, it } from "vitest";
import { analyzeOrders } from "../services/analytics/index.js";
import { calculateYearStats, calculateAllTimeStats } from "../services/analytics/orders/yearStats.js";
import { calculateRestaurantStats } from "../services/analytics/orders/restaurantStats.js";
import { findMostOrderedProduct } from "../services/analytics/orders/productStats.js";
import { calculateTimeStats } from "../services/analytics/orders/timeStats.js";
import { analyticsOrders } from "./fixtures/orders.js";

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
      totalPrice: 35,
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
    expect(restaurants.mostMoneySpent?.totalPrice).toBe(35);

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
});
