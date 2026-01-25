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
  const s = order?.submission_date;
  return typeof s === "string" && s.length >= 4 ? s.slice(0, 4) : "Unknown";
};

export const getCityFromOrder = (order) =>
  order?.delivery_address?.city ||
  order?.delivery_address?.area ||
  order?.restaurant?.address?.split(",")[1]?.trim() ||
  "Unknown";
