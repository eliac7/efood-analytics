import { ORDER_TIME_ZONE, parseOrderDate } from "./orderDate";

export const NO_DATA = "Δεν υπάρχουν διαθέσιμα δεδομένα";

export const highestCount = (counts: Record<string, number>) =>
  Object.entries(counts).filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0];

export const dateFormat = (dateString: string | Date | null | undefined) => {
  if (dateString == null) return NO_DATA;
  const date = typeof dateString === "string" ? parseOrderDate(dateString) : dateString;
  if (!date || Number.isNaN(date.getTime())) return NO_DATA;
  return new Intl.DateTimeFormat("el-GR", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: ORDER_TIME_ZONE,
  }).format(date);
};
export const formatAmount = (amount: number | null | undefined) => {
  if (amount == null || !Number.isFinite(amount)) return NO_DATA;
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

export const timeFormat = (time: number | null | undefined) => {
  if (time == null || !Number.isFinite(time) || time < 0) return NO_DATA;
  // will be given in minutes and will be converted to hours and minutes and will be returned as a string
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  if (hours === 0) {
    return `${minutes} λεπτά`;
  }

  return `${hours} ώρες ${minutes} λεπτά`;
};
