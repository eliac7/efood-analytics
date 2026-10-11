import { toNumber } from "./normalize.js";

export const toCents = (amount: number): number =>
  Math.round((amount + Math.sign(amount) * Number.EPSILON) * 100);

/** A partial sum must not be presented as a complete monetary total. */
export function sumKnownAmounts<T>(
  values: T[],
  getAmount: (value: T) => unknown
): number | null {
  let cents = 0;
  for (const value of values) {
    const amount = toNumber(getAmount(value));
    if (amount === null) return null;
    cents += toCents(amount);
  }
  return cents / 100;
}
