import type { CostComponentKey } from "../types";

export const COST_COMPONENT_KEYS: CostComponentKey[] = ["productLines", "delivery", "service", "bags", "tips",
  "priority", "smallOrder", "recycling", "donation", "coupon", "joker"];
export const CHARGE_KEYS: CostComponentKey[] = ["delivery", "service", "bags", "tips", "priority", "smallOrder", "recycling", "donation"];

export const COST_LABELS: Record<CostComponentKey, string> = {
  productLines: "Προϊόντα και προσαρμογές τιμών",
  delivery: "Παράδοση", service: "Χρέωση υπηρεσίας", bags: "Σακούλες", tips: "Φιλοδωρήματα",
  priority: "Προτεραιότητα", smallOrder: "Χρέωση μικρής παραγγελίας", recycling: "Τέλος ανακύκλωσης",
  donation: "Δωρεές", coupon: "Κουπόνια εκτός τιμών προϊόντων", joker: "Πεινιάτα",
};

export const CHARGE_COLORS: Record<string, string> = {
  delivery: "#2563eb", service: "#7c3aed", bags: "#0d9488", tips: "#ea580c",
  priority: "#c026d3", smallOrder: "#dc2626", recycling: "#16a34a", donation: "#475569",
};
