export interface Root {
  orders: Orders;
  message: string;
}

export interface Orders {
  all: All;
  perYear: PerYear[];
  timestamp: number;
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
  restaurants: Restaurant[];
  MostOrderedProduct: MostOrderedProduct;
}

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
  id: number;
  name: string;
  totalPrice: number;
  orders: number;
  longitude: number;
  latitude: number;
  logo: string;
  is_open: boolean;
  is_favorite: boolean;
  address: string;
}

export interface Restaurant {
  id: number;
  name: string;
  totalPrice: number;
  orders: number;
  longitude: number;
  latitude: number;
  logo: string;
  is_open: boolean;
  is_favorite: boolean;
  address: string;
}

export interface MostOrderedProduct {
  name: string;
  quantity: number;
  amountSpent: number;
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
  restaurants: Restaurant2[];
  mostOrderedProduct: MostOrderedProduct2;
  mediumDeliveryTime: number;
}

export interface Platforms2 {
  web: number;
  android?: number;
  ios?: number;
}

export interface PaymentMethods2 {
  cash: number;
  paypal?: number;
  googlepay?: number;
  credit_card?: number;
  applepay?: number;
}

export interface Restaurant2 {
  name: string;
  orders: number;
  totalPrice: number;
  id: number;
  logo: string;
  longitude: number;
  latitude: number;
  is_open: boolean;
  is_favorite: boolean;
  address: string;
}

export interface MostOrderedProduct2 {
  name: string;
  orders: number;
  totalPrice: string;
}

export interface User {
  session_id: string;
  name: string;
}

export interface initialStateType {
  user: User | null;
  orders: Orders | null;
  loading: boolean;
}
