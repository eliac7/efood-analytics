import { describe, expect, it } from "vitest";
import { makeTestHistory } from "../test/fixtures";
import {
  buildStoreRows,
  groupStorePoints,
  hasStoreLocation,
  sortStores,
  storePointRadius,
} from "./storeAnalytics";

describe("store analytics", () => {
  it("uses all selected spending for shares, including unmapped stores; dates include only the supplied history", () => {
    const history = makeTestHistory();
    const rows = buildStoreRows(
      [
        {
          id: "1",
          name: "Gyro",
          totalPrice: 32.75,
          orders: 2,
          latitude: 0,
          longitude: 0,
        },
        { id: 2, name: "Pasta", totalPrice: 9.99, orders: 1, latitude: null },
        { id: 3, name: "Cafe", totalPrice: 7, orders: 1 },
      ],
      history,
      49.74,
    );
    expect(rows[0].share).toBeCloseTo((32.75 / 49.74) * 100);
    expect(rows.reduce((sum, row) => sum + row.share!, 0)).toBeCloseTo(100);
    expect(rows[0].average).toBe(16.375);
    expect(rows[0].firstOrder).toBe("2025-03-10T09:30:00.000Z");
    expect(rows[0].lastOrder).toBe("2025-04-15T10:00:00.000Z");
    expect(rows[2]).toMatchObject({
      firstOrder: null,
      lastOrder: null,
      undatedOrders: 1,
    });
    const filtered = buildStoreRows([rows[0]], history.slice(0, 1), 20.25);
    expect(filtered[0].firstOrder).toBe(filtered[0].lastOrder);
    expect(hasStoreLocation(rows[0])).toBe(true);
    for (const latitude of [null, undefined, NaN, Infinity, 91])
      expect(hasStoreLocation({ ...rows[0], latitude })).toBe(false);
  });

  it("sorts by spending, frequency or average without changing the source and handles zero totals", () => {
    const rows = buildStoreRows(
      [
        { id: 1, name: "A", totalPrice: 30, orders: 3 },
        { id: 2, name: "B", totalPrice: 40, orders: 1 },
      ],
      [],
      70,
    );
    expect(sortStores(rows, "amount").map((s) => s.id)).toEqual([2, 1]);
    expect(sortStores(rows, "orders").map((s) => s.id)).toEqual([1, 2]);
    expect(sortStores(rows, "average").map((s) => s.id)).toEqual([2, 1]);
    expect(rows.map((s) => s.id)).toEqual([1, 2]);
    expect(
      buildStoreRows([{ id: 1, orders: 1, totalPrice: 0 }], [], 0)[0],
    ).toMatchObject({ average: 0, share: null });
    expect(
      buildStoreRows([{ id: 1, orders: 0, totalPrice: 0 }], [], 0)[0].average,
    ).toBeNull();
  });

  it("keeps coincident stores available together and scales circle area instead of radius", () => {
    const rows = buildStoreRows(
      [
        { id: 1, orders: 1, totalPrice: 0.1, latitude: 0, longitude: 0 },
        { id: 2, orders: 2, totalPrice: 0.2, latitude: 0, longitude: 0 },
        { id: 3, orders: 1, totalPrice: 4, latitude: 99, longitude: 0 },
      ],
      [],
      4.3,
    );
    const points = groupStorePoints(rows);
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({
      amount: 0.3,
      orders: 3,
      position: [0, 0],
    });
    expect(points[0].stores.map((s) => s.id)).toEqual([1, 2]);
    expect(storePointRadius(25, 100)).toBe(storePointRadius(100, 100) / 2);
    expect(storePointRadius(0, 100)).toBe(6);
    expect(storePointRadius(0, 0)).toBe(6);
  });
});
