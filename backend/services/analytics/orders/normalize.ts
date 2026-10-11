import type { EfoodOrder } from "../../../types.js";
import { getOrderDateParts, parseOrderDate } from "../../../utils/orderDate.js";

export const toNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

export const getEstimatedDeliveryTime = (order: EfoodOrder): number | null => {
  const minutes =
    toNumber(order.delivery?.time_estimation?.minutes) ??
    toNumber(order.delivery_time);
  return minutes !== null && minutes >= 0 ? minutes : null;
};

export const parseSubmissionDate = parseOrderDate;

export const getYearFromSubmission = (order: Pick<EfoodOrder, "submission_date">): string => {
  const date = parseSubmissionDate(order?.submission_date);
  return date ? String(getOrderDateParts(date).year) : "Unknown";
};

export const getCityFromOrder = (order: Pick<EfoodOrder, "delivery_address" | "restaurant">): string =>
  order?.delivery_address?.city?.trim() ||
  order?.delivery_address?.area?.trim() ||
  order?.restaurant?.address?.split(",")[1]?.trim() ||
  "Unknown";
