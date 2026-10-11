import { useRef, useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-fullscreen/dist/Leaflet.fullscreen.js";
import "leaflet-fullscreen/dist/leaflet.fullscreen.css";
import * as L from "leaflet";
import { Restaurant } from "../../../types";
import { Badge, useMantineColorScheme } from "@mantine/core";
import noAvatar from "../../../Assets/Images/no-avatar.webp";
const maptkn = import.meta.env.VITE_APP_MAPBOX_TOKEN;

const Map = ({ restaurants }: { restaurants: Restaurant[] | undefined }) => {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const { colorScheme } = useMantineColorScheme();

  const locatedRestaurants = useMemo(
    () => (restaurants ?? []).filter(
      (restaurant): restaurant is Restaurant & { latitude: number; longitude: number } =>
        typeof restaurant.latitude === "number" &&
        Number.isFinite(restaurant.latitude) &&
        Math.abs(restaurant.latitude) <= 90 &&
        typeof restaurant.longitude === "number" &&
        Number.isFinite(restaurant.longitude) &&
        Math.abs(restaurant.longitude) <= 180
    ),
    [restaurants]
  );

  const markers = locatedRestaurants.map((restaurant) => (
    <Marker
      key={restaurant.id}
      position={[restaurant.latitude, restaurant.longitude]}
      icon={L.icon({
        iconUrl: restaurant.logo || noAvatar,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        className: "rounded-full",
      })}
    >
      <Popup minWidth={300} maxWidth={500}>
        <div className="flex flex-col items-center min-w-[200px]">
          <img
            src={restaurant.logo || noAvatar}
            alt={restaurant.name ?? "Κατάστημα"}
            className="w-20 h-20 rounded-full"
          />
          <h1 className="text-lg font-semibold text-center">
            {restaurant.name}
          </h1>

          <Badge color="cyan" variant="filled">
            {restaurant.orders}{" "}
            {restaurant.orders === 1 ? "ΠΑΡΑΓΓΕΛΙΑ" : "ΠΑΡΑΓΓΕΛΙΕΣ"}
          </Badge>
          <Badge color="cyan" variant="filled" className="mt-2">
            {new Intl.NumberFormat("el-GR", {
              style: "currency",
              currency: "EUR",
            }).format(restaurant.totalPrice)}{" "}
            ΞΟΔΕΥΤΗΚΑΝ
          </Badge>
          {restaurant.orders > 1 && (
            <Badge color="cyan" variant="filled" className="mt-2">
              {new Intl.NumberFormat("el-GR", {
                style: "currency",
                currency: "EUR",
              }).format(restaurant.totalPrice / restaurant.orders)}{" "}
              / Μ.Ο. ΠΑΡΑΓΓΕΛΙΑΣ
            </Badge>
          )}
          {restaurant.is_open !== undefined ? (
            <Badge
              color={restaurant.is_open ? "green" : "red"}
              variant="filled"
              className="mt-2"
            >
              {restaurant.is_open ? "ΑΝΟΙΧΤΟ" : "ΚΛΕΙΣΤΟ"}
            </Badge>
          ) : null}
        </div>
      </Popup>
    </Marker>
  ));

  const bounds = useMemo(() => {
    if (locatedRestaurants.length === 0) return null;
    return new L.LatLngBounds(
      locatedRestaurants.map((restaurant) => [
        restaurant.latitude,
        restaurant.longitude,
      ]),
    );
  }, [locatedRestaurants]);

  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression);
    }
  }, [bounds]);

  const tiles: Record<string, string> = {
    light: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${maptkn}`,
    dark: `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${maptkn}`,
  };

  return (
    <MapContainer
      className="w-full h-150 rounded-md shadow-md my-6"
      attributionControl={true}
      zoomControl={true}
      doubleClickZoom={true}
      scrollWheelZoom={true}
      dragging={true}
      easeLinearity={0.35}
      center={[37.880695, 25.1410391]}
      zoom={7}
      boundsOptions={{ padding: [50, 50] }}
      ref={mapRef}
      fullscreenControl={true}
    >
      <TileLayer
        url={tiles[colorScheme] || tiles.light}
        ref={tileLayerRef}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers}
    </MapContainer>
  );
};

export default Map;
