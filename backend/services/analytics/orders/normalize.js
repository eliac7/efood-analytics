export const toNumber = (v) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

// Handles "YYYY-MM-DD HH:mm:ss" safely (and keeps local-time semantics).
export const parseSubmissionDate = (s) => {
  if (!s || typeof s !== "string") return null;
  const isoLike = s.includes("T") ? s : s.replace(" ", "T");
  const d = new Date(isoLike);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const getYearFromSubmission = (order) => {
  const date = parseSubmissionDate(order?.submission_date);
  return date ? String(date.getFullYear()) : "Unknown";
};

export const getCityFromOrder = (order) =>
  order?.delivery_address?.city ||
  order?.delivery_address?.area ||
  order?.restaurant?.address?.split(",")[1]?.trim() ||
  "Unknown";
