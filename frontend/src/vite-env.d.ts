/// <reference types="vite/client" />

import "react-leaflet";

declare module "react-leaflet" {
  interface MapContainerProps {
    fullscreenControl?: boolean;
  }
}
