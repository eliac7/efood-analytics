import type { CountMap } from "../types.js";

/**
 * Sort object entries by a reference array order
 * @param {Object} obj - Object to sort
 * @param {string[]} referenceArray - Array defining the desired order
 * @returns {Object} - Sorted object
 */
export function sortByReference(obj: CountMap, referenceArray: readonly string[]): CountMap {
  return Object.fromEntries(
    Object.entries(obj).sort(
      (a, b) => referenceArray.indexOf(a[0]) - referenceArray.indexOf(b[0])
    )
  );
}

/**
 * Sort object entries by value in descending order
 * @param {Object} obj - Object to sort
 * @returns {Object} - Sorted object
 */
export function sortByValueDesc(obj: CountMap): CountMap {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => b[1] - a[1])
  );
}

/**
 * Sort object entries by value in ascending order
 * @param {Object} obj - Object to sort
 * @returns {Object} - Sorted object
 */
export function sortByValueAsc(obj: CountMap): CountMap {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => a[1] - b[1])
  );
}

