export type CountMap = Record<string, number>;

export interface EfoodRestaurant {
  id: string | number;
  name?: string;
  address?: string;
  longitude?: number | null;
  latitude?: number | null;
  logo?: string | null;
  is_open?: boolean;
  [key: string]: unknown;
}

export interface EfoodProduct {
  item_code: string;
  name?: string;
  offer_title?: string;
  quantity: number;
  unit_price: number;
  size_info?: string;
  customisation?: string;
  tracking_product_id?: string;
  is_coupon?: boolean;
  is_delivery_fee_discount?: boolean;
  offer_discount?: boolean;
  is_offer?: boolean;
  images?: Record<string, string | null> | null;
  [key: string]: unknown;
}

export interface EfoodOrder {
  id?: string | number;
  submission_date?: string | null;
  price: number;
  status?: string;
  coupon?: { amount?: number } | null;
  delivery_cost?: number | null;
  tip?: number | null;
  service_fee?: number | null;
  service_fees?: {
    total?: number | null;
    current?: number | null;
    late_night?: number | null;
  };
  bags?: { amount?: number | null };
  csr?: { amount?: number | null };
  priority_fee?: number | null;
  small_order_fee?: number | null;
  pvc_recycling_taxes?: number | null;
  additional_taxes?: number | null;
  joker_discount?: number | null;
  delivery_time?: number | string | null;
  delivery?: {
    time_estimation?: { minutes?: number | null };
  };
  platform?: string;
  payment_type?: string;
  restaurant: EfoodRestaurant;
  is_open?: boolean;
  is_favorite?: boolean;
  delivery_address?: {
    city?: string;
    area?: string;
    [key: string]: unknown;
  };
  products: EfoodProduct[];
  [key: string]: unknown;
}

export interface RestaurantSummary {
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

export interface MostOrderedProduct {
  name?: string;
  quantity: number;
  totalPrice: number;
  image: string | null;
}

export interface CommonOrderStats {
  totalOrders: number;
  totalPrice: number;
  platforms: CountMap;
  paymentMethods: CountMap;
  firstOrder: string | null;
  lastOrder: string | null;
  couponAmount: number | null;
  deliveryCost: number | null;
  totalTips: number | null;
  restaurants: RestaurantSummary[];
  mostOrderedProduct: MostOrderedProduct | null;
  /** Estimated delivery minutes, not elapsed time until actual delivery. */
  averageDeliveryTime: number | null;
  restaurantWithMostMoneySpent: RestaurantSummary | null;
  uniqueRestaurants: number;
  weekdays: CountMap;
  phases: CountMap;
  months: CountMap;
  cities: CountMap;
  costBreakdown: CostBreakdown;
}

export type CostComponentKey =
  | "productLines"
  | "delivery"
  | "service"
  | "bags"
  | "tips"
  | "priority"
  | "smallOrder"
  | "recycling"
  | "donation"
  | "coupon"
  | "joker";

export interface CostAmount {
  /** Complete total, or null when some orders have unavailable data. */
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
    /** Differences for comparable orders only; absolute total prevents cancellation. */
    netDifference: number;
    absoluteDifference: number;
  };
}

export interface YearOrderStats extends CommonOrderStats {
  year: string;
}

export interface OrderAnalytics {
  all: CommonOrderStats;
  perYear: YearOrderStats[];
  timeline: OrderTimeline;
  history: OrderHistoryEntry[];
}

/** Explicit client allowlist: no customer address, notes, attributes or tracking IDs. */
export interface OrderHistoryEntry {
  id: string;
  submissionDate: string | null;
  price: number;
  restaurant: {
    id: string | number;
    name?: string;
    address?: string;
    logo?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    isOpen?: boolean;
    isFavorite?: boolean;
  };
  city: string;
  platform: string;
  payment: string;
  status: string | null;
  estimatedDeliveryMinutes: number | null;
  amounts: {
    coupon: number | null;
    delivery: number | null;
    tips: number | null;
    service: number | null;
    serviceAlias: number | null;
    bags: number | null;
    donation: number | null;
    priority: number | null;
    smallOrder: number | null;
    recycling: number | null;
    includedTaxes: number | null;
    joker: number | null;
  };
  products: {
    identity: string | null;
    name?: string;
    quantity: number;
    unitPrice: number;
    image: string | null;
    isOffer: boolean;
    isCoupon: boolean;
    isDeliveryDiscount: boolean;
    offerDiscount: boolean;
  }[];
}

export interface PeriodMetrics {
  totalOrders: number;
  totalPrice: number;
  averagePrice: number | null;
  medianPrice: number | null;
}

export interface TimeBucket extends PeriodMetrics {
  key: string;
  from: string;
  through: string;
  partial: boolean;
}

export interface ComparedPeriod extends PeriodMetrics {
  from: string;
  through: string;
  complete: boolean;
}

export interface MetricChange {
  absolute: number;
  percent: number | null;
}
export interface PeriodComparison {
  key: string;
  days: number;
  current: ComparedPeriod;
  previous: ComparedPeriod;
  change: {
    totalPrice: MetricChange;
    totalOrders: MetricChange;
    averagePrice: MetricChange | null;
    medianPrice: MetricChange | null;
  } | null;
}

export interface OrderTimeline {
  asOf: string;
  coverage: {
    from: string | null;
    through: string;
    undatedOrders: number;
    undatedAmount: number;
    futureOrders: number;
    futureAmount: number;
  };
  months: TimeBucket[];
  weeks: TimeBucket[];
  comparisons: PeriodComparison[];
}
