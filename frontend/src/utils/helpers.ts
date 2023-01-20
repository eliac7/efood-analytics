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

export const timeFormat = (time: number) => {
  // will be given in minutes and will be converted to hours and minutes and will be returned as a string
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  if (hours === 0) {
    return `${minutes} λεπτά`;
  }

  return `${hours} ώρες ${minutes} λεπτά`;
};
