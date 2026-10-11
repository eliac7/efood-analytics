export const ORDER_TIME_ZONE = "Europe/Athens";
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ORDER_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function getOrderDateParts(date: Date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const year = Number(parts.year), month = Number(parts.month), day = Number(parts.day);
  return {
    year, month, day, hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
  };
}

/** Offset-free history timestamps are Athens wall time, never server local time. */
export function parseOrderDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:?\d{2})?$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi, se, fraction, zone] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const hour = Number(h), minute = Number(mi), second = Number(se);
  const milliseconds = Number((fraction ?? "").padEnd(3, "0"));
  const wall = new Date(0);
  wall.setUTCFullYear(year, month - 1, day);
  wall.setUTCHours(hour, minute, second, milliseconds);
  if (year < 100 || wall.getUTCFullYear() !== year || wall.getUTCMonth() !== month - 1 ||
      wall.getUTCDate() !== day || wall.getUTCHours() !== hour || wall.getUTCMinutes() !== minute ||
      wall.getUTCSeconds() !== second) return null;
  if (zone) {
    const isoZone = zone === "Z" || zone.includes(":") ? zone : `${zone.slice(0, 3)}:${zone.slice(3)}`;
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${se}.${String(milliseconds).padStart(3, "0")}${isoZone}`);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  // Probe both sides of DST; reject nonexistent spring-forward wall times.
  const offsets = new Set<number>();
  for (const delta of [-86400000, 0, 86400000]) {
    const probe = new Date(wall.getTime() + delta);
    const p = getOrderDateParts(probe);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, milliseconds);
    offsets.add(represented - probe.getTime());
  }
  const candidates = [...offsets].map((offset) => new Date(wall.getTime() - offset)).filter((date) => {
    const p = getOrderDateParts(date);
    return p.year === year && p.month === month && p.day === day && p.hour === hour &&
      p.minute === minute && p.second === second;
  }).sort((a, b) => a.getTime() - b.getTime());
  // A repeated autumn hour has no disambiguating offset in the upstream data.
  return candidates[0] ?? null;
}
