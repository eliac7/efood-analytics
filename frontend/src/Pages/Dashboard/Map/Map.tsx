import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
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
}: {
  points: StorePoint[];
  selectedId: string | null;
  focusRequest: number;
}) {
  const map = useMap();
  useEffect(() => {
    const selected = points.find((point) =>
      point.stores.some((store) => String(store.id) === selectedId),
    );
    if (selected) map.setView(selected.position, 14, { animate: false });
    else if (points.length) {
      map.closePopup();
      map.fitBounds(L.latLngBounds(points.map((point) => point.position)), {
        padding: [35, 35],
        maxZoom: 14,
        animate: false,
      });
    }
  }, [map, points, selectedId, focusRequest]);
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
  const ref = useRef<L.CircleMarker>(null);
  const selected = point.stores.some(
    (store) => String(store.id) === selectedId,
  );
  const popupStores = [...point.stores].sort(
    (a, b) =>
      Number(String(b.id) === selectedId) - Number(String(a.id) === selectedId),
  );
  useEffect(() => {
    if (selected) ref.current?.openPopup();
  }, [selected, focusRequest]);
  return (
    <CircleMarker
      ref={ref}
      center={point.position}
      radius={radius}
      pathOptions={{
        color: selected
          ? dark
            ? "#ffd43b"
            : "#9c6500"
          : dark
            ? "#74c0fc"
            : "#1864ab",
        fillColor: dark ? "#339af0" : "#228be6",
        fillOpacity: 0.65,
        weight: selected ? 4 : 2,
      }}
      eventHandlers={{ click: () => onSelect(String(point.stores[0].id)) }}
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
    </CircleMarker>
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
  const maximum = Math.max(
    0,
    ...points.map((point) =>
      metric === "amount" ? point.amount : point.orders,
    ),
  );
  const largest =
    metric === "amount" ? formatAmount(maximum) : `${maximum} παραγγελίες`;
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
      <Text size="xs" mb="xs">
        Κλίμακα: ο μεγαλύτερος κύκλος αντιστοιχεί σε {largest}. Οι μικρότεροι
        κύκλοι διατηρούν ένα ελάχιστο μέγεθος για να φαίνονται.
      </Text>
      <MapContainer
        className={styles.canvas}
        center={[37.98, 23.72]}
        zoom={7}
        maxZoom={18}
        scrollWheelZoom={false}
        fullscreenControl={true}
      >
        <Viewport
          points={points}
          selectedId={selectedId}
          focusRequest={focusRequest}
        />
        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/${dark ? "dark" : "light"}-v11/tiles/{z}/{x}/{y}?access_token=${mapToken}`}
          eventHandlers={{ tileerror: () => setTileError(true) }}
          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {points.map((point) => (
          <StorePointMarker
            key={point.key}
            point={point}
            radius={storePointRadius(
              metric === "amount" ? point.amount : point.orders,
              maximum,
            )}
            selectedId={selectedId}
            focusRequest={focusRequest}
            onSelect={onSelect}
            onShowOrders={onShowOrders}
            dark={dark}
          />
        ))}
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
