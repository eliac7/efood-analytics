import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import {
  Alert,
  Button,
  Group,
  Stack,
  Text,
  useComputedColorScheme,
} from "@mantine/core";
import "leaflet/dist/leaflet.css";
import "leaflet-fullscreen/dist/Leaflet.fullscreen.js";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import * as L from "leaflet";
import noAvatar from "../../../Assets/Images/no-avatar.webp";
import { dateFormat, formatAmount } from "../../../utils/helpers";
import {
  formatStoreShare,
  groupStorePoints,
  storePointRadius,
  type StoreMetric,
  type StorePoint,
  type StoreRow,
} from "../../../utils/storeAnalytics";
import styles from "./Map.module.css";
import {
  createStoreClusterIndex,
  getStoreMapItems,
  getStoreRevealZoom,
  storeMapItemValue,
  STORE_MAP_MAX_ZOOM,
  type StoreClusterIndex,
  type StoreMapItem,
} from "../../../utils/storeClusters";

interface Props {
  restaurants: StoreRow[];
  metric: StoreMetric;
  selectedId: string | null;
  focusRequest: number;
  onSelect: (id: string) => void;
  onShowOrders: (id: string) => void;
}

function Viewport({
  points,
  selectedId,
  focusRequest,
  model,
}: {
  points: StorePoint[];
  selectedId: string | null;
  focusRequest: number;
  model: StoreClusterIndex;
}) {
  const map = useMap();
  useEffect(() => {
    const selected = points.find((point) =>
      point.stores.some((store) => String(store.id) === selectedId),
    );
    if (selected)
      map.setView(selected.position, getStoreRevealZoom(model, selected.key), {
        animate: false,
      });
    else if (points.length) {
      map.closePopup();
      map.fitBounds(L.latLngBounds(points.map((point) => point.position)), {
        padding: [35, 35],
        maxZoom: 14,
        animate: false,
      });
    }
  }, [map, points, selectedId, focusRequest, model]);
  return null;
}

function StorePointMarker({
  point,
  radius,
  selectedId,
  focusRequest,
  onSelect,
  onShowOrders,
  dark,
}: {
  point: StorePoint;
  radius: number;
  selectedId: string | null;
  focusRequest: number;
  onSelect: Props["onSelect"];
  onShowOrders: Props["onShowOrders"];
  dark: boolean;
}) {
  const ref = useRef<L.Marker>(null);
  const selected = point.stores.some(
    (store) => String(store.id) === selectedId,
  );
  const store =
    point.stores.find((item) => String(item.id) === selectedId) ||
    point.stores[0];
  const popupStores = [store, ...point.stores.filter((item) => item !== store)];
  const logo = store.logo || noAvatar;
  const size = Math.max(18, radius);
  const label =
    point.stores.length === 1
      ? store.name || "Άγνωστο κατάστημα"
      : `${store.name || "Άγνωστο κατάστημα"} — ${point.stores.length} καταστήματα στην ίδια θέση`;
  const icon = useMemo(
    () =>
      L.icon({
        iconUrl: logo,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
        popupAnchor: [0, -size],
        tooltipAnchor: [0, -size],
        className: `${styles.storeIcon} ${dark ? styles.darkStore : ""} ${selected ? styles.selectedStore : ""}`,
      }),
    [logo, size, dark, selected],
  );
  useEffect(() => {
    const element = ref.current?.getElement();
    if (!element) return;
    element.setAttribute("aria-label", label);
    if (!(element instanceof HTMLImageElement)) return;
    const fallback = () => {
      if (element.getAttribute("src") !== noAvatar) element.src = noAvatar;
    };
    element.addEventListener("error", fallback);
    if (element.complete && element.naturalWidth === 0) fallback();
    return () => element.removeEventListener("error", fallback);
  }, [icon, label]);
  useEffect(() => {
    if (selected) {
      ref.current?.openPopup();
    }
  }, [selected, selectedId, focusRequest, icon]);
  return (
    <Marker
      ref={ref}
      position={point.position}
      icon={icon}
      keyboard
      title={label}
      alt={label}
      zIndexOffset={selected ? 500 : 0}
      eventHandlers={{
        click: () => onSelect(String(store.id)),
        keydown: ({ originalEvent }) => {
          if (!originalEvent.repeat && originalEvent.key === " ") {
            originalEvent.preventDefault();
            onSelect(String(store.id));
            ref.current?.openPopup();
          }
        },
      }}
    >
      <Tooltip>
        {point.stores.length === 1
          ? point.stores[0].name || "Άγνωστο κατάστημα"
          : `${point.stores.length} καταστήματα στην ίδια θέση`}
      </Tooltip>
      <Popup minWidth={180} maxWidth={240} autoPanPadding={[10, 10]}>
        <Stack gap="sm" className={styles.popupContent}>
          {point.stores.length > 1 ? (
            <Text fw={700}>
              {point.stores.length} καταστήματα στην ίδια θέση
            </Text>
          ) : null}
          {popupStores.map((store) => (
            <div key={String(store.id)}>
              <Text fw={700}>{store.name || "Άγνωστο κατάστημα"}</Text>
              <Text size="sm">Ποσό: {formatAmount(store.totalPrice)}</Text>
              <Text size="sm">Παραγγελίες: {store.orders}</Text>
              <Text size="sm">Μέσο ποσό: {formatAmount(store.average)}</Text>
              <Text size="sm">
                Μερίδιο εξόδων: {formatStoreShare(store.share)}
              </Text>
              <Text size="xs">
                Πρώτη παραγγελία: {dateFormat(store.firstOrder)}
              </Text>
              <Text size="xs">
                Τελευταία παραγγελία: {dateFormat(store.lastOrder)}
              </Text>
              {store.undatedOrders > 0 ? (
                <Text size="xs">Χωρίς ημερομηνία: {store.undatedOrders}</Text>
              ) : null}
              <Group mt="xs">
                <Button
                  size="xs"
                  onClick={() => onShowOrders(String(store.id))}
                  aria-label={`Δες παραγγελίες: ${store.name || "Άγνωστο κατάστημα"}`}
                >
                  Δες παραγγελίες
                </Button>
              </Group>
            </div>
          ))}
        </Stack>
      </Popup>
    </Marker>
  );
}

function ClusterMarker({
  item,
  radius,
  dark,
}: {
  item: Extract<StoreMapItem, { kind: "cluster" }>;
  radius: number;
  dark: boolean;
}) {
  const map = useMap();
  const size = Math.max(18, radius);
  const ref = useRef<L.Marker>(null);
  const label = `${item.storeCount} καταστήματα, ${formatAmount(item.amount)}, ${item.orders} παραγγελίες. Πάτησε για μεγέθυνση.`;
  const icon = useMemo(
    () =>
      L.divIcon({
        className: `${styles.clusterIcon} ${dark ? styles.darkCluster : ""}`,
        html: `<span>${item.storeCount}</span>`,
        iconSize: [size * 2, size * 2],
        iconAnchor: [size, size],
      }),
    [dark, size, item.storeCount],
  );
  useEffect(() => {
    ref.current?.getElement()?.setAttribute("aria-label", label);
  }, [icon, label]);
  const expand = () => {
    map.closePopup();
    map.setView(item.position, item.expansionZoom, { animate: false });
    map.getContainer().focus({ preventScroll: true });
  };
  return (
    <Marker
      ref={ref}
      position={item.position}
      icon={icon}
      keyboard
      title={label}
      alt={label}
      eventHandlers={{
        click: expand,
        keydown: ({ originalEvent }) => {
          if (
            !originalEvent.repeat &&
            (originalEvent.key === "Enter" || originalEvent.key === " ")
          ) {
            originalEvent.preventDefault();
            expand();
          }
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -size]}>
        <div>
          <strong>{item.storeCount} καταστήματα</strong>
          <br />
          Ποσό: {formatAmount(item.amount)}
          <br />
          Παραγγελίες: {item.orders}
          <br />
          Πάτησε για μεγέθυνση.
        </div>
      </Tooltip>
    </Marker>
  );
}

function ClusteredStores({
  model,
  metric,
  selectedId,
  focusRequest,
  onSelect,
  onShowOrders,
  dark,
  legendHost,
}: Omit<Props, "restaurants"> & {
  model: StoreClusterIndex;
  dark: boolean;
  legendHost: HTMLDivElement | null;
}) {
  const map = useMap();
  const subscribe = useCallback(
    (notify: () => void) => {
      map.on("zoomend", notify);
      return () => {
        map.off("zoomend", notify);
      };
    },
    [map],
  );
  const getZoom = useCallback(() => Math.floor(map.getZoom()), [map]);
  const zoom = useSyncExternalStore(subscribe, getZoom);
  const items = useMemo(() => getStoreMapItems(model, zoom), [model, zoom]);
  const maximum = Math.max(
    0,
    ...items.map((item) => storeMapItemValue(item, metric)),
  );
  const legend =
    metric === "amount"
      ? formatAmount(maximum)
      : `${maximum} ${maximum === 1 ? "παραγγελία" : "παραγγελίες"}`;
  return (
    <>
      {legendHost
        ? createPortal(
            <Text size="xs" role="status">
              Μεγαλύτερος κύκλος: {legend}
              <br />
              Αριθμός στην ομάδα = καταστήματα. Οι μικροί κύκλοι διατηρούν ένα
              ελάχιστο μέγεθος για να φαίνονται.
            </Text>,
            legendHost,
          )
        : null}
      {items.map((item) =>
        item.kind === "cluster" ? (
          <ClusterMarker
            key={item.key}
            item={item}
            radius={storePointRadius(storeMapItemValue(item, metric), maximum)}
            dark={dark}
          />
        ) : (
          <StorePointMarker
            key={item.key}
            point={item.point}
            radius={storePointRadius(storeMapItemValue(item, metric), maximum)}
            selectedId={selectedId}
            focusRequest={focusRequest}
            onSelect={onSelect}
            onShowOrders={onShowOrders}
            dark={dark}
          />
        ),
      )}
    </>
  );
}

function StoreMapCanvas({
  points,
  metric,
  selectedId,
  focusRequest,
  onSelect,
  onShowOrders,
  dark,
  mapToken,
}: Omit<Props, "restaurants"> & {
  points: StorePoint[];
  dark: boolean;
  mapToken: string;
}) {
  const [tileError, setTileError] = useState(false);
  const [legendHost, setLegendHost] = useState<HTMLDivElement | null>(null);
  const model = useMemo(() => createStoreClusterIndex(points), [points]);
  return (
    <div className={styles.root} role="region" aria-label="Χάρτης καταστημάτων">
      {tileError ? (
        <Alert
          color="orange"
          title="Το υπόβαθρο του χάρτη δεν φορτώθηκε"
          mb="sm"
        >
          Τα καταστήματα και τα ποσά σου παραμένουν στον πίνακα.
        </Alert>
      ) : null}
      <div ref={setLegendHost} className={styles.legend} />
      <MapContainer
        className={styles.canvas}
        center={[37.98, 23.72]}
        zoom={7}
        maxZoom={STORE_MAP_MAX_ZOOM}
        scrollWheelZoom={false}
        fullscreenControl={true}
      >
        <Viewport
          points={points}
          selectedId={selectedId}
          focusRequest={focusRequest}
          model={model}
        />
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/${dark ? "dark" : "light"}-v11/tiles/{z}/{x}/{y}?access_token=${mapToken}`}
          eventHandlers={{ tileerror: () => setTileError(true) }}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <ClusteredStores
          model={model}
          metric={metric}
          selectedId={selectedId}
          focusRequest={focusRequest}
          onSelect={onSelect}
          onShowOrders={onShowOrders}
          dark={dark}
          legendHost={legendHost}
        />
      </MapContainer>
    </div>
  );
}

export default function Map({ restaurants, ...props }: Props) {
  const scheme = useComputedColorScheme("light");
  const mapToken = import.meta.env.VITE_APP_MAPBOX_TOKEN;
  const points = useMemo(() => groupStorePoints(restaurants), [restaurants]);
  if (!points.length) return null;
  if (!mapToken)
    return (
      <Alert color="orange" mt="sm">
        Ο χάρτης δεν είναι διαθέσιμος αυτή τη στιγμή. Μπορείς να δεις τα
        καταστήματα και τις παραγγελίες τους στον πίνακα.
      </Alert>
    );
  return (
    <StoreMapCanvas
      points={points}
      {...props}
      dark={scheme === "dark"}
      mapToken={mapToken}
    />
  );
}
