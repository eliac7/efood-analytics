import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useImperativeHandle, type ReactNode, type Ref } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { renderWithProviders } from "../../../test/render";
import { buildStoreRows } from "../../../utils/storeAnalytics";
import Map from "./Map";

const { map, openPopup, tileEvents } = vi.hoisted(() => ({
  map: { setView: vi.fn(), fitBounds: vi.fn(), closePopup: vi.fn() },
  openPopup: vi.fn(),
  tileEvents: { error: () => {} },
}));
vi.mock("leaflet-fullscreen/dist/Leaflet.fullscreen.js", () => ({}));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  useMap: () => map,
  CircleMarker: ({
    center,
    radius,
    children,
    ref,
    eventHandlers,
  }: {
    center: [number, number];
    radius: number;
    children?: ReactNode;
    ref: Ref<{ openPopup: () => void }>;
    eventHandlers: { click: () => void };
  }) => {
    useImperativeHandle(ref, () => ({ openPopup }));
    return (
      <div
        data-testid="marker"
        data-position={center.join(",")}
        data-radius={radius}
      >
        <button
          aria-label={`Σημείο ${center.join(",")}`}
          onClick={eventHandlers.click}
        >
          Σημείο
        </button>
        {children}
      </div>
    );
  },
  Popup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  TileLayer: ({
    eventHandlers,
  }: {
    eventHandlers: { tileerror: () => void };
  }) => {
    tileEvents.error = eventHandlers.tileerror;
    return null;
  },
}));

describe("store map", () => {
  beforeEach(() => vi.stubEnv("VITE_APP_MAPBOX_TOKEN", "test-map-token"));
  afterEach(() => vi.unstubAllEnvs());
  const restaurants = buildStoreRows(
    [
      {
        id: 1,
        name: "A",
        totalPrice: 10,
        orders: 1,
        latitude: 0,
        longitude: 0,
        is_open: true,
      },
      {
        id: 2,
        name: "B",
        totalPrice: 30,
        orders: 3,
        latitude: 0,
        longitude: 0,
      },
      {
        id: 3,
        name: "C",
        totalPrice: 60,
        orders: 1,
        latitude: 38,
        longitude: 23,
      },
      { id: 4, totalPrice: 20, orders: 1, latitude: null, longitude: 23 },
      { id: 5, totalPrice: 0, orders: 1, latitude: 95, longitude: 23 },
    ],
    [],
    120,
  );
  const base = {
    restaurants,
    metric: "amount" as const,
    selectedId: null,
    focusRequest: 0,
    onSelect: vi.fn(),
    onShowOrders: vi.fn(),
  };

  it("caps the overview zoom, groups coincident stores, and uses shares including unmapped spending", () => {
    renderWithProviders(<Map {...base} />);
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
    expect(screen.getAllByTestId("marker")[0]).toHaveAttribute(
      "data-position",
      "0,0",
    );
    expect(
      screen.getByText("2 καταστήματα στην ίδια θέση"),
    ).toBeInTheDocument();
    expect(screen.getByText("Μερίδιο εξόδων: 25%")).toBeInTheDocument();
    expect(map.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxZoom: 14 }),
    );
    expect(screen.queryByText(/ΑΝΟΙΧΤΟ|ΚΛΕΙΣΤΟ/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Δες παραγγελίες: B" }));
    expect(base.onShowOrders).toHaveBeenCalledWith("2");
    fireEvent.click(screen.getByRole("button", { name: "Σημείο 0,0" }));
    expect(base.onSelect).toHaveBeenCalledWith("1");
  });

  it("focuses the selected store and updates marker sizes without resetting the viewport", () => {
    const { rerender } = render(
      <Map {...base} selectedId="3" focusRequest={1} />,
      {
        wrapper: ({ children }) => (
          <MantineProvider>{children}</MantineProvider>
        ),
      },
    );
    expect(map.setView).toHaveBeenCalledWith([38, 23], 14, { animate: false });
    expect(openPopup).toHaveBeenCalled();
    const before = screen
      .getAllByTestId("marker")[0]
      .getAttribute("data-radius");
    map.setView.mockClear();
    map.fitBounds.mockClear();
    rerender(<Map {...base} selectedId="3" focusRequest={1} metric="orders" />);
    expect(
      screen.getAllByTestId("marker")[0].getAttribute("data-radius"),
    ).not.toBe(before);
    expect(map.setView).not.toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();
    rerender(<Map {...base} focusRequest={2} />);
    expect(map.closePopup).toHaveBeenCalled();
    expect(map.fitBounds).toHaveBeenCalled();
  });

  it("explains tile failures and missing configuration without hiding the table flow", () => {
    renderWithProviders(<Map {...base} />);
    act(() => tileEvents.error());
    expect(
      screen.getByText("Το υπόβαθρο του χάρτη δεν φορτώθηκε"),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("marker")).toHaveLength(2);
  });

  it("does not create a map for an empty history or missing token", () => {
    const { unmount } = renderWithProviders(<Map {...base} restaurants={[]} />);
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
    unmount();
    vi.stubEnv("VITE_APP_MAPBOX_TOKEN", "");
    renderWithProviders(<Map {...base} />);
    expect(
      screen.getByText(/Ο χάρτης δεν είναι διαθέσιμος/),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });
});
