import {
  CostAmount,
  CostBreakdown,
  CostComponentKey,
  Orders,
  OrderTimeline,
  PeriodMetrics,
  User,
  OrderHistoryEntry,
} from "../types";
import { ORDERS_CACHE_VERSION } from "../utils/constants";
import { COST_COMPONENT_KEYS } from "../utils/costs";

export function makeTestCostBreakdown(
  totalOrders: number,
  productLines = 0,
  delivery = 0,
  tips = 0,
  coupon = 0,
): CostBreakdown {
  const unknown = (): CostAmount => ({
    amount: totalOrders === 0 ? 0 : null,
    knownAmount: 0,
    coveredOrders: 0,
  });
  const known = (amount: number): CostAmount => ({
    amount,
    knownAmount: amount,
    coveredOrders: totalOrders,
  });
  const components = Object.fromEntries(
    COST_COMPONENT_KEYS.map((key) => [key, unknown()]),
  ) as Record<CostComponentKey, CostAmount>;
  Object.assign(components, {
    productLines: known(productLines),
    delivery: known(delivery),
    tips: known(tips),
    coupon: known(coupon),
  });
  return {
    components,
    additionalCharges: unknown(),
    includedTaxes: unknown(),
    reconciliation: {
      matchedOrders: 0,
      mismatchedOrders: 0,
      unavailableOrders: totalOrders,
      netDifference: 0,
      absoluteDifference: 0,
    },
  };
}

export const testUser: User = {
  session_id: "00000000-0000-0000-0000-000000000000",
  name: "Ilias",
  loginAt: new Date("2026-01-01T10:00:00").getTime(),
};

export const testOrders: Orders = {
  history: makeTestHistory(),
  timeline: makeTestTimeline(),
  cacheVersion: ORDERS_CACHE_VERSION,
  ownerSessionId: testUser.session_id,
  ownerLoginAt: testUser.loginAt!,
  timestamp: new Date("2026-01-01T10:30:00"),
  all: {
    costBreakdown: makeTestCostBreakdown(4, 51.99, 3, 2, 1.5),
    totalOrders: 4,
    totalPrice: 49.74,
    couponAmount: 1.5,
    deliveryCost: 3,
    totalTips: 2,
    platforms: { web: 2, android: 1, ios: 1 },
    paymentMethods: { cash: 2, credit_card: 1, paypal: 1 },
    firstOrder: "2024-12-31 21:15:00",
    lastOrder: "2025-04-15 13:00:00",
    restaurantWithMostMoneySpent: {
      id: 1,
      name: "Gyro House",
      totalPrice: 32.75,
      orders: 2,
      longitude: 23.72,
      latitude: 37.98,
      logo: "gyro.png",
      is_open: true,
      is_favorite: true,
      address: "Main 1, Athens",
    },
    restaurants: [
      {
        id: 1,
        name: "Gyro House",
        totalPrice: 32.75,
        orders: 2,
        longitude: 23.72,
        latitude: 37.98,
        logo: "gyro.png",
        is_open: true,
        is_favorite: true,
        address: "Main 1, Athens",
      },
    ],
    mostOrderedProduct: {
      name: "Pasta",
      quantity: 3,
      totalPrice: 9.99,
      image: "pasta.jpg",
    },
    averageDeliveryTime: 38,
    uniqueRestaurants: 3,
    weekdays: { Δευτέρα: 1, Τρίτη: 2 },
    phases: { night: 1, morning: 1, noon: 1, afternoon: 0 },
    months: { Μάρτιος: 1, Απρίλιος: 1, Δεκέμβριος: 1 },
    cities: { Athens: 2, Patras: 1 },
  },
  perYear: [
    {
      year: "2025",
      costBreakdown: makeTestCostBreakdown(2, 35, 2, 2, 1),
      totalOrders: 2,
      totalPrice: 32.75,
      couponAmount: 1,
      deliveryCost: 2,
      totalTips: 2,
      platforms: { web: 1, android: 1 },
      paymentMethods: { cash: 1, credit_card: 1 },
      firstOrder: "2025-03-10 11:30:00",
      lastOrder: "2025-04-15 13:00:00",
      restaurantWithMostMoneySpent: {
        id: 1,
        name: "Gyro House",
        totalPrice: 32.75,
        orders: 2,
        longitude: 23.72,
        latitude: 37.98,
        logo: "gyro.png",
        is_open: true,
        is_favorite: true,
        address: "Main 1, Athens",
      },
      restaurants: [],
      mostOrderedProduct: {
        name: "Pita",
        quantity: 2,
        totalPrice: 10,
        image: "pita.jpg",
      },
      averageDeliveryTime: 30,
      uniqueRestaurants: 1,
      weekdays: { Δευτέρα: 1, Τρίτη: 1 },
      phases: { morning: 1, noon: 1, afternoon: 0, night: 0 },
      months: { Μάρτιος: 1, Απρίλιος: 1 },
      cities: { Athens: 1, Koukaki: 1 },
    },
    {
      year: "2024",
      costBreakdown: makeTestCostBreakdown(1, 9.99, 1, 0, 0.5),
      totalOrders: 1,
      totalPrice: 9.99,
      couponAmount: 0.5,
      deliveryCost: 1,
      totalTips: 0,
      platforms: { web: 0, ios: 1 },
      paymentMethods: { paypal: 1 },
      firstOrder: "2024-12-31 21:15:00",
      lastOrder: "2024-12-31 21:15:00",
      restaurantWithMostMoneySpent: {
        id: 2,
        name: "Pasta Place",
        totalPrice: 9.99,
        orders: 1,
        longitude: 21.73,
        latitude: 38.25,
        logo: "pasta.png",
        is_open: true,
        is_favorite: false,
        address: "Port 2, Patras",
      },
      restaurants: [],
      mostOrderedProduct: {
        name: "Pasta",
        quantity: 3,
        totalPrice: 9.99,
        image: "pasta.jpg",
      },
      averageDeliveryTime: 45,
      uniqueRestaurants: 1,
      weekdays: { Τρίτη: 1 },
      phases: { night: 1, morning: 0, noon: 0, afternoon: 0 },
      months: { Δεκέμβριος: 1 },
      cities: { Patras: 1 },
    },
  ],
};

export function makeTestHistory(totalOrders = 4): OrderHistoryEntry[] {
  const entry = (
    id: number,
    date: string | null,
    price: number,
    store: number,
    name: string,
    payment: string,
    product: string,
    quantity: number,
    unitPrice: number,
  ): OrderHistoryEntry => ({
    id: `order:${id}`,
    submissionDate: date,
    price,
    restaurant: {
      id: store,
      name,
      address: "Public store address",
      isOpen: true,
      isFavorite: store === 1,
    },
    city: store === 1 ? "Athens" : "Patras",
    platform: store === 2 ? "ios" : "web",
    payment,
    status: "accepted",
    estimatedDeliveryMinutes: 30,
    amounts: {
      coupon: 0,
      delivery: 0,
      tips: 0,
      service: null,
      serviceAlias: null,
      bags: null,
      donation: null,
      priority: null,
      smallOrder: null,
      recycling: null,
      includedTaxes: null,
      joker: null,
    },
    products: [
      {
        identity: String(id + 1).repeat(64),
        name: product,
        quantity,
        unitPrice,
        image: `${product.toLowerCase()}.jpg`,
        isOffer: false,
        isCoupon: false,
        isDeliveryDiscount: false,
        offerDiscount: false,
      },
    ],
  });
  const values = [
    entry(
      0,
      "2025-04-15 13:00:00",
      20.25,
      1,
      "Gyro House",
      "credit_card",
      "Burger",
      1,
      15,
    ),
    entry(
      1,
      "2025-03-10 11:30:00",
      12.5,
      1,
      "Gyro House",
      "cash",
      "Pita",
      2,
      5,
    ),
    entry(
      2,
      "2024-12-31 21:15:00",
      9.99,
      2,
      "Pasta Place",
      "paypal",
      "Pasta",
      3,
      3.33,
    ),
    entry(3, null, 7, 3, "Invalid Date Cafe", "cash", "Coffee", 1, 7),
  ];
  Object.assign(values[0].amounts, { tips: 1.5 });
  values[0].platform = "android";
  values[0].products.push({
    ...values[0].products[0],
    identity: "a".repeat(64),
    name: "Ignored Offer",
    quantity: 10,
    unitPrice: 1,
    isOffer: true,
  });
  Object.assign(values[1].amounts, { tips: 0.5, delivery: 2, coupon: 1 });
  Object.assign(values[2].amounts, { delivery: 1, coupon: 0.5 });
  for (let index = 4; index < totalOrders; index++)
    values.push(
      entry(index, null, 0, 3, "Invalid Date Cafe", "cash", "Coffee", 0, 0),
    );
  return values.slice(0, totalOrders);
}

export function makeTestTimeline(
  totalOrders = 4,
  totalPrice = 49.74,
): OrderTimeline {
  const values = [
    { day: "2024-12-31", price: 9.99 },
    { day: "2025-03-10", price: 12.5 },
    { day: "2025-04-15", price: 20.25 },
  ];
  const metrics = (from: string, through: string): PeriodMetrics => {
    const prices = values
      .filter((v) => v.day >= from && v.day <= through)
      .map((v) => v.price)
      .sort((a, b) => a - b);
    const total = prices.reduce((sum, p) => sum + Math.round(p * 100), 0);
    return {
      totalOrders: prices.length,
      totalPrice: total / 100,
      averagePrice: prices.length
        ? Math.round(total / prices.length) / 100
        : null,
      medianPrice: prices.length ? prices[Math.floor(prices.length / 2)] : null,
    };
  };
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const buckets = (weekly: boolean) => {
    const result: OrderTimeline["months"] = [];
    for (
      let date = new Date(weekly ? "2024-12-30" : "2024-12-01");
      key(date) <= "2026-01-01";
    ) {
      const from = key(date),
        end = new Date(date);
      if (weekly)
        end.setUTCDate(end.getUTCDate() + 6 - ((end.getUTCDay() + 6) % 7));
      else end.setUTCMonth(end.getUTCMonth() + 1, 0);
      if (end.getUTCFullYear() > date.getUTCFullYear())
        end.setUTCFullYear(date.getUTCFullYear(), 11, 31);
      const through = key(end);
      result.push({
        key: weekly ? from : from.slice(0, 7),
        from,
        through,
        partial: from < "2024-12-31" || through >= "2026-01-01",
        ...metrics(from, through),
      });
      date = new Date(end);
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return result;
  };
  const empty = {
    totalOrders: 0,
    totalPrice: 0,
    averagePrice: null,
    medianPrice: null,
    complete: false,
  };
  return {
    asOf: "2026-01-01T08:30:00.000Z",
    coverage: {
      from: "2024-12-31",
      through: "2026-01-01",
      undatedOrders: totalOrders - 3,
      undatedAmount: (Math.round(totalPrice * 100) - 4274) / 100,
      futureOrders: 0,
      futureAmount: 0,
    },
    months: buckets(false),
    weeks: buckets(true),
    comparisons: [
      "month",
      "days30",
      "days90",
      "year:2026",
      "year:2025",
      "year:2024",
    ].map((key) => ({
      key,
      days: 0,
      current: { ...empty, from: "2026-01-01", through: "2026-01-01" },
      previous: { ...empty, from: "2025-01-01", through: "2025-01-01" },
      change: null,
    })),
  };
}
