export const dateFormat = (dateString: Date) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("el-GR", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(date);
};
export const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};
