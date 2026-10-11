import Supercluster from "supercluster";
import { toCents } from "../../../backend/services/analytics/orders/money.js";
import type { StoreMetric, StorePoint } from "./storeAnalytics";

interface Totals {
  cents: number;
  orders: number;
  storeCount: number;
}
interface InputProperties extends Totals {
  pointKey: string;
}
export interface StoreClusterIndex {
  index: Supercluster<InputProperties, Totals>;
  points: Map<string, StorePoint>;
}
export type StoreMapItem =
  | {
      kind: "point";
      key: string;
      point: StorePoint;
    }
  | {
      kind: "cluster";
      key: string;
      id: number;
      position: [number, number];
      amount: number;
      orders: number;
      storeCount: number;
      expansionZoom: number;
    };

const WORLD: [number, number, number, number] = [-180, -90, 180, 90];
export const STORE_MAP_MAX_ZOOM = 18;

/** One immutable spatial index per filtered set; metric changes reuse it. */
export function createStoreClusterIndex(
  points: StorePoint[],
): StoreClusterIndex {
  const index = new Supercluster<InputProperties, Totals>({
    radius: 60,
    extent: 256,
    maxZoom: STORE_MAP_MAX_ZOOM - 1,
    map: ({ cents, orders, storeCount }) => ({ cents, orders, storeCount }),
    reduce: (total, value) => {
      total.cents += value.cents;
      total.orders += value.orders;
      total.storeCount += value.storeCount;
    },
  });
  index.load(
    points.map((point) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.position[1], point.position[0]],
      },
      properties: {
        pointKey: point.key,
        cents: toCents(point.amount),
        orders: point.orders,
        storeCount: point.stores.length,
      },
    })),
  );
  return { index, points: new Map(points.map((point) => [point.key, point])) };
}

/** Keep the same worldwide set when panning; zoom alone changes its grouping. */
export function getStoreMapItems(
  model: StoreClusterIndex,
  zoom: number,
): StoreMapItem[] {
  return model.index
    .getClusters(WORLD, Math.floor(zoom))
    .map((feature): StoreMapItem => {
      const p = feature.properties;
      if ("cluster" in p && p.cluster === true) {
        return {
          kind: "cluster",
          key: `cluster:${p.cluster_id}`,
          id: p.cluster_id,
          position: [
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0],
          ],
          amount: p.cents / 100,
          orders: p.orders,
          storeCount: p.storeCount,
          expansionZoom: Math.min(
            STORE_MAP_MAX_ZOOM,
            model.index.getClusterExpansionZoom(p.cluster_id),
          ),
        };
      }
      if (!("pointKey" in p))
        throw new Error("Store cluster contains an unknown point");
      const point = model.points.get(p.pointKey);
      if (!point) throw new Error("Store cluster contains an unknown point");
      return { kind: "point", key: `point:${point.key}`, point };
    });
}

export function getStoreRevealZoom(
  model: StoreClusterIndex,
  pointKey: string,
): number {
  for (let zoom = 14; zoom <= STORE_MAP_MAX_ZOOM; zoom++) {
    if (
      getStoreMapItems(model, zoom).some(
        (item) => item.kind === "point" && item.point.key === pointKey,
      )
    )
      return zoom;
  }
  return STORE_MAP_MAX_ZOOM;
}

export function storeMapItemValue(
  item: StoreMapItem,
  metric: StoreMetric,
): number {
  const value = item.kind === "point" ? item.point : item;
  return metric === "amount" ? value.amount : value.orders;
}
