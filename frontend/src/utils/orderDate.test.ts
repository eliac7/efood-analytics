import { describe, expect, it } from "vitest";
import { parseOrderDate, getOrderDateParts } from "./orderDate";
import { parseOrderDate as parseBackend } from "../../../backend/utils/orderDate";
import { dateFormat, NO_DATA } from "./helpers";

describe("Athens date consistency", () => {
  it("agrees with the backend across offsets, year boundaries, and DST", () => {
    for (const input of ["2025-12-31T23:30:00Z", "2025-07-01 13:00:00", "2025-01-01 13:00:00",
      "2025-10-26T03:30:00+03:00", "2025-10-26T03:30:00+02:00", "2025-03-30 03:30:00", "2025-02-30 12:00:00"]) {
      expect(parseOrderDate(input)?.toISOString()).toBe(parseBackend(input)?.toISOString());
    }
    expect(getOrderDateParts(parseOrderDate("2025-12-31T23:30:00Z")!)).toMatchObject({ year: 2026, month: 1, day: 1, hour: 1 });
  });
  it("renders Athens civil time and rejects impossible dates", () => {
    expect(dateFormat("2025-07-01T10:00:00Z")).toContain("13:00");
    expect(dateFormat("2025-02-30 12:00:00")).toBe(NO_DATA);
  });
});
