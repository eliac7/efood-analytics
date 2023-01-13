export interface Orders {
  all: All;
  perYear: PerYear[];
}

export interface All {
  totalOrders: number;
  totalPrice: number;
  couponAmount: number;
  deliveryCost: number;
  totalTips: number;
  platforms: Platforms;
  paymentMethods: PaymentMethods;
  firstOrder: Date;
  lastOrder: Date;
  RestaurantWithMostMoneySpent: Restaurant;
  restaurants: Restaurant[];
  MostOrderedProduct: MostOrderedProduct;
}

export interface MostOrderedProduct {
  name: string;
  quantity: number;
  totalPrice: number;
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

export interface PaymentMethods {
  paypal?: number;
  cash?: number;
  googlepay?: number;
  credit_card?: number;
  applepay?: number;
}

export interface Platforms {
  web: number;
  android?: number;
  ios?: number;
}

export interface PerYear {
  year: string;
  totalOrders: number;
  totalPrice: number;
  platforms: Platforms;
  paymentMethods: PaymentMethods;
  firstOrder: Date;
  lastOrder: Date;
  couponAmount: number;
  deliveryCost: number;
  totalTips: number;
  restaurants: Restaurant[];
  mostOrderedProduct: MostOrderedProductClass;
  mediumDeliveryTime: number;
}

export interface MostOrderedProductClass {
  name: string;
  quantity: number;
  totalPrice: string;
}
export interface MostOrderedProduct {
  name: string;
  quantity: number;
  totalPrice: number;
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
