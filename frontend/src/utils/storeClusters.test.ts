import { describe, expect, it } from "vitest";
import { buildStoreRows, groupStorePoints } from "./storeAnalytics";
import {
  createStoreClusterIndex,
  getStoreMapItems,
  getStoreRevealZoom,
  storeMapItemValue,
} from "./storeClusters";

const rows = buildStoreRows(
  [
    { id: "a", totalPrice: 0.1, orders: 1, latitude: 37.98, longitude: 23.72 },
    { id: "b", totalPrice: 0.2, orders: 4, latitude: 37.98, longitude: 23.72 },
    {
      id: "c",
      totalPrice: 9.7,
      orders: 2,
      latitude: 37.98001,
      longitude: 23.72001,
    },
    { id: "d", totalPrice: 20, orders: 3, latitude: 38.25, longitude: 21.73 },
    { id: "e", totalPrice: 0, orders: 1, latitude: -38, longitude: -23 },
    { id: "missing", totalPrice: 100, orders: 10 },
  ],
  [],
  130,
);

describe("store map clusters", () => {
  it("groups near positions by zoom and counts stores, including coincident stores, rather than input points or orders", () => {
    const points = groupStorePoints(rows);
    const model = createStoreClusterIndex(points);
    const cluster = getStoreMapItems(model, 10).find(
      (item) => item.kind === "cluster",
    );
    expect(cluster).toMatchObject({
      kind: "cluster",
      storeCount: 3,
      orders: 7,
      amount: 10,
    });
    if (cluster?.kind !== "cluster") throw new Error("Expected a cluster");
    expect(cluster.expansionZoom).toBeGreaterThan(10);
    expect(cluster.expansionZoom).toBeLessThanOrEqual(18);
    const expanded = getStoreMapItems(model, 18);
    expect(expanded.every((item) => item.kind === "point")).toBe(true);
    expect(expanded).toHaveLength(4);
    expect(
      expanded.find(
        (item) => item.kind === "point" && item.point.stores.length === 2,
      ),
    ).toMatchObject({ point: { amount: 0.3, orders: 5 } });
  });

  it("conserves cents, order count and store count at every zoom and switches metrics on the same index", () => {
    const model = createStoreClusterIndex(groupStorePoints(rows));
    for (let zoom = 0; zoom <= 18; zoom++) {
      const items = getStoreMapItems(model, zoom);
      expect(
        Math.round(
          items.reduce(
            (sum, item) => sum + storeMapItemValue(item, "amount"),
            0,
          ) * 100,
        ),
      ).toBe(3000);
      expect(
        items.reduce((sum, item) => sum + storeMapItemValue(item, "orders"), 0),
      ).toBe(11);
      expect(
        items.reduce(
          (sum, item) =>
            sum +
            (item.kind === "cluster"
              ? item.storeCount
              : item.point.stores.length),
          0,
        ),
      ).toBe(5);
    }
    expect(rows[0].totalPrice).toBe(0.1);
    expect(rows[0].share).toBeCloseTo((0.1 / 130) * 100);
  });

  it("reveals a selected store even inside a dense cluster and supports empty or zero-valued sets", () => {
    const points = groupStorePoints(rows);
    const model = createStoreClusterIndex(points);
    const dense = points.find((point) =>
      point.stores.some((store) => store.id === "c"),
    )!;
    const far = points.find((point) =>
      point.stores.some((store) => store.id === "d"),
    )!;
    expect(getStoreRevealZoom(model, dense.key)).toBe(18);
    expect(getStoreRevealZoom(model, far.key)).toBe(14);
    expect(getStoreMapItems(createStoreClusterIndex([]), 7)).toEqual([]);
    const zero = createStoreClusterIndex(
      groupStorePoints(rows.filter((row) => row.id === "e")),
    );
    expect(storeMapItemValue(getStoreMapItems(zero, 7)[0], "amount")).toBe(0);
  });
});
