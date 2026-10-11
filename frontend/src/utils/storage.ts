/** Browsers may deny storage or exceed quota; analytics must still work in memory. */
export const readStorage = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
export const removeStorage = (key: string): void => {
  try { localStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
};
export const writeStorage = (key: string, value: unknown): void => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { removeStorage(key); }
};
