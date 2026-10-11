import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderWithProviders } from "../../../test/render";
import type { Restaurant } from "../../../types";
import Map from "./Map";

vi.mock("leaflet-fullscreen/dist/Leaflet.fullscreen.js", () => ({}));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Marker: ({ position, children }: { position: [number, number]; children?: ReactNode }) => (
    <div data-testid="marker" data-position={position.join(",")}>{children}</div>
  ),
  Popup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TileLayer: () => null,
}));

describe("store map", () => {
  it("keeps valid zero coordinates and omits stores with unavailable or invalid coordinates", () => {
    const base: Restaurant = { id: 1, totalPrice: 10, orders: 1 };
    renderWithProviders(<Map restaurants={[
      { ...base, latitude: 0, longitude: 0 },
      { ...base, id: 2, latitude: null, longitude: 23 },
      { ...base, id: 3, latitude: 38 },
      { ...base, id: 4, latitude: NaN, longitude: 23 },
      { ...base, id: 5, latitude: 95, longitude: 23 },
    ]} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(1);
    expect(screen.getByTestId("marker")).toHaveAttribute("data-position", "0,0");
    expect(screen.queryByText("ΚΛΕΙΣΤΟ")).not.toBeInTheDocument();
  });

  it("handles a history with no mapped stores", () => {
    renderWithProviders(<Map restaurants={[]} />);
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });
});
