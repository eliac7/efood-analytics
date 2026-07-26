import type { EfoodOrder } from "../../../types.js";

export const toNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

// Handles "YYYY-MM-DD HH:mm:ss" safely (and keeps local-time semantics).
export const parseSubmissionDate = (s: unknown): Date | null => {
  if (!s || typeof s !== "string") return null;
  const isoLike = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(isoLike);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getYearFromSubmission = (order: Pick<EfoodOrder, "submission_date">): string => {
  const date = parseSubmissionDate(order?.submission_date);
  return date ? String(date.getFullYear()) : "Unknown";
};

export const getCityFromOrder = (order: Pick<EfoodOrder, "delivery_address" | "restaurant">): string =>
  order?.delivery_address?.city ||
  order?.delivery_address?.area ||
  order?.restaurant?.address?.split(",")[1]?.trim() ||
  "Unknown";
