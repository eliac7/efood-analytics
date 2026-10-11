export interface Orders {
  all: OrderStats;
  perYear: PerYear[];
  timestamp: Date;
  cacheVersion: number;
  ownerSessionId: string;
  ownerLoginAt: number;
}

export interface OrderStats {
  totalOrders: number;
  totalPrice: number;
  couponAmount: number | null;
  deliveryCost: number | null;
  totalTips: number | null;
  platforms: Platforms;
  paymentMethods: PaymentMethods;
  firstOrder: string | null;
  lastOrder: string | null;
  restaurantWithMostMoneySpent: Restaurant | null;
  restaurants: Restaurant[];
  mostOrderedProduct: MostOrderedProduct | null;
  /** Estimated minutes, not actual delivery duration. */
  averageDeliveryTime: number | null;
  uniqueRestaurants: number;
  weekdays: { [key: string]: number };
  phases: Phases;
  months: { [key: string]: number };
  cities: { [key: string]: number };
  costBreakdown: CostBreakdown;
}

export type CostComponentKey = "productLines" | "delivery" | "service" | "bags" | "tips" |
  "priority" | "smallOrder" | "recycling" | "donation" | "coupon" | "joker";

export interface CostAmount {
  amount: number | null;
  knownAmount: number;
  coveredOrders: number;
}

export interface CostBreakdown {
  components: Record<CostComponentKey, CostAmount>;
  additionalCharges: CostAmount;
  includedTaxes: CostAmount;
  reconciliation: {
    matchedOrders: number;
    mismatchedOrders: number;
    unavailableOrders: number;
    netDifference: number;
    absoluteDifference: number;
  };
}

export interface PerYear extends OrderStats {
  year: string;
}

export interface Restaurant {
  id: string | number;
  name?: string;
  totalPrice: number;
  orders: number;
  longitude?: number | null;
  latitude?: number | null;
  logo?: string | null;
  is_open?: boolean;
  is_favorite?: boolean;
  address?: string;
}

export type PaymentMethods = Record<string, number>;

export type Platforms = Record<string, number>;

export interface Phases {
  morning: number;
  noon: number;
  afternoon: number;
  night: number;
}

export interface MostOrderedProduct {
  name?: string;
  quantity: number;
  totalPrice: number;
  image: string | null;
}

export interface User {
  session_id: string;
  name: string;
  loginAt?: number;
}

export interface LoginResponse {
  session_id: string;
  name: string;
  message: string;
}

export interface initialStateType {
  user: User | null;
  orders: Orders | null;
  loading: boolean;
  authRevision?: number;
}
