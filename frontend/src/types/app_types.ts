export interface Orders {
  all: All;
  perYear: PerYear[];
  timestamp: Date;
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
  mostOrderedProduct: MostOrderedProduct;
  averageDeliveryTime: number;
  uniqueRestaurants: number;
  weekdays: { [key: string]: number };
  phases: Phases;
  months: { [key: string]: number };
  cities: { [key: string]: number };
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
  mostOrderedProduct: MostOrderedProduct;
  averageDeliveryTime: number;
  RestaurantWithMostMoneySpent: Restaurant;
  uniqueRestaurants: number;
  weekdays: { [key: string]: number };
  phases: Phases;
  months: { [key: string]: number };
  cities: { [key: string]: number };
}

export interface Phases {
  morning: number;
  noon: number;
  afternoon: number;
  night: number;
}

export interface MostOrderedProduct {
  name: string;
  quantity: number;
  totalPrice: number;
  image: string | null;
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
