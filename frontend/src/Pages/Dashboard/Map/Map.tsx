import { useRef, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
import { Restaurant, Restaurant2 } from "../../../types/app_types";
import { Badge, useMantineColorScheme } from "@mantine/core";

const Map = ({
  restaurants,
}: {
  restaurants: Restaurant[] | Restaurant2[] | undefined;
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const { colorScheme } = useMantineColorScheme();

  const markers = restaurants?.map((restaurant) => (
    <Marker
      key={restaurant.id}
      position={[restaurant.latitude, restaurant.longitude]}
      icon={L.icon({
        iconUrl: restaurant.logo,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        className: "rounded-full",
      })}
    >
      <Popup>
        <div className="flex flex-col items-center">
          <img
            src={restaurant.logo}
            alt={restaurant.name}
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
          <Badge
            color={restaurant.is_open ? "green" : "red"}
            variant="filled"
            className="mt-2"
          >
            {restaurant.is_open ? "ΑΝΟΙΧΤΟ" : "ΚΛΕΙΣΤΟ"}
          </Badge>
        </div>
      </Popup>
    </Marker>
  ));

  const bounds =
    restaurants &&
    new L.LatLngBounds(
      restaurants.map((restaurant) => [
        restaurant.latitude,
        restaurant.longitude,
      ])
    );

  useEffect(() => {
    if (mapRef.current && restaurants) {
      mapRef.current.fitBounds(bounds as L.LatLngBoundsExpression);
    }
  }, [restaurants]);

  const tiles = {
    light:
      "https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWxpYWM3IiwiYSI6ImNsY29yYmoxeTAxOWgzc2xyMDBkcHRqNnEifQ.23Rw0ga3E8B8Z-hITio6CQ",
    dark: "https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZWxpYWM3IiwiYSI6ImNsY29yYmoxeTAxOWgzc2xyMDBkcHRqNnEifQ.23Rw0ga3E8B8Z-hITio6CQ",
  };

  return (
    <MapContainer
      className="w-full h-[500px] rounded-md shadow-md my-6"
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
    >
      <TileLayer
        url={tiles[colorScheme]}
        ref={tileLayerRef}
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers}
    </MapContainer>
  );
};

export default Map;
