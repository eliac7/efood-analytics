export interface Platforms {
  web: number;
  android: number;
  ios: number;
}

export interface PaymentMethods {
  cash: number;
  paypal: number;
  googlepay: number;
  credit_card: number;
  applepay: number;
}

export interface RestaurantWithMostMoneySpent {
  name: string;
  total: number;
  longitude: number;
  latitude: number;
  logo: string;
  is_open: boolean;
}

export interface MostOrderedProduct {
  name: string;
  quantity: number;
  amountSpent: number;
}

export interface MostOrderedProduct2 {
  name: string;
  orders: number;
  totalPrice: string;
}

export interface All {
  totalOrders: number;
  totalPrice: number;
  couponAmount: number;
  deliveryCost: number;
  totalTips: number;
  platforms: Platforms;
  paymentMethods: PaymentMethods;
  firstOrder: string;
  lastOrder: string;
  RestaurantWithMostMoneySpent: RestaurantWithMostMoneySpent;
  MostOrderedProduct: MostOrderedProduct;
}

export interface Platforms2 {
  web: number;
  android: number;
  ios?: number;
}

export interface PaymentMethods2 {
  cash: number;
  paypal: number;
  googlepay: number;
  credit_card: number;
  applepay?: number;
}

export interface Restaurant {
  name: string;
  orders: number;
  totalPrice: string;
  id: number;
  logo: string;
  longitude: number;
  latitude: number;
  is_open: boolean;
}

export interface PerYear {
  year: string;
  totalOrders: number;
  totalPrice: number;
  platforms: Platforms2;
  paymentMethods: PaymentMethods2;
  firstOrder: string;
  lastOrder: string;
  couponAmount: number;
  deliveryCost: number;
  totalTips: number;
  restaurants: Restaurant[];
  mostOrderedProduct: MostOrderedProduct2;
  mediumDeliveryTime: number;
}

export interface Orders {
  all: All;
  perYear: PerYear[];
}

export interface RootObject {
  orders: Orders;
  message: string;
}

export interface User {
  session_id: string;
  name: string;
}

export type initialStateType = {
  user: User | null;
  orders: Orders | null;
  loading: boolean;
};

export const initialState = {
  user: null,
  orders: null,
  loading: true,
};
