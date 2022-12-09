export interface UserContextProps {
  user: User | null;
  setUser: (user: User | null) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
}

export interface OrderRootProps {
  orders: Order[];
  message: string;
}

export interface Order {
  year: string;
  totalOrders: number;
  totalPrice: number;
  platforms: Platforms;
  paymentMethods: PaymentMethods;
  firstOrder: string;
  lastOrder: string;
  couponAmount: number;
  deliveryCost: number;
  totalTips: number;
  restaurants: Restaurant[];
  mostOrderedProduct: MostOrderedProduct;
  mediumDeliveryTime: number;
}

export interface Platforms {
  android?: number;
  web: number;
  ios?: number;
}

export interface PaymentMethods {
  googlepay?: number;
  paypal?: number;
  cash: number;
  credit_card?: number;
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

export interface MostOrderedProduct {
  name: string;
  orders: number;
  totalPrice: string;
}

export interface User {
  session_id: string;
  name: string;
  orders?: Order[];
}
