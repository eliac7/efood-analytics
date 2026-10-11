import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { useImperativeHandle, useRef, type ReactNode, type Ref } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type { Icon, DivIcon } from "leaflet";
import { MantineProvider } from "@mantine/core";
import { renderWithProviders } from "../../../test/render";
import { buildStoreRows } from "../../../utils/storeAnalytics";
import Map from "./Map";
import noAvatar from "../../../Assets/Images/no-avatar.webp";

const { map, openPopup, tileEvents } = vi.hoisted(() => ({
  map: {
    setView: vi.fn(),
    fitBounds: vi.fn(),
    closePopup: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getZoom: vi.fn(() => 14),
    getContainer: vi.fn(() => ({ focus: vi.fn() })),
  },
  openPopup: vi.fn(),
  tileEvents: { error: () => {} },
}));
vi.mock("leaflet-fullscreen/dist/Leaflet.fullscreen.js", () => ({}));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  ),
  useMap: () => map,
  Marker: ({
    children,
    eventHandlers,
    alt,
    ref,
    icon,
    position,
  }: {
    children?: ReactNode;
    eventHandlers: {
      click: () => void;
      keydown: (event: { originalEvent: KeyboardEvent }) => void;
    };
    alt: string;
    icon: Icon | DivIcon;
    position: [number, number];
    ref: Ref<{
      getElement: () => HTMLElement | null;
      openPopup: () => void;
    }>;
  }) => {
    const element = useRef<HTMLButtonElement>(null);
    const image = useRef<HTMLImageElement>(null);
    const iconUrl = "iconUrl" in icon.options ? icon.options.iconUrl : null;
    useImperativeHandle(ref, () => ({
      getElement: () => (iconUrl ? image.current : element.current),
      openPopup,
    }));
    return (
      <div
        data-testid={iconUrl ? "marker" : "cluster"}
        data-position={position.join(",")}
        data-radius={(icon.options.iconSize as [number, number])[0] / 2}
        data-icon-class={icon.options.className}
      >
        <button
          ref={element}
          aria-label={alt}
          onClick={eventHandlers.click}
          onKeyDown={(event) =>
            eventHandlers.keydown({ originalEvent: event.nativeEvent })
          }
        >
          {iconUrl ? <img ref={image} src={iconUrl} alt={alt} /> : "Ομάδα"}
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
  beforeEach(() => {
    vi.stubEnv("VITE_APP_MAPBOX_TOKEN", "test-map-token");
    map.getZoom.mockReturnValue(14);
  });
  afterEach(() => vi.unstubAllEnvs());
  const restaurants = buildStoreRows(
    [
      {
        id: 1,
        name: "A",
        logo: "https://example.com/a.webp",
        totalPrice: 10,
        orders: 1,
        latitude: 0,
        longitude: 0,
        is_open: true,
      },
      {
        id: 2,
        name: "B",
        logo: "https://example.com/b.webp",
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
    fireEvent.click(screen.getByRole("button", { name: /^A — 2 καταστήματα/ }));
    expect(base.onSelect).toHaveBeenCalledWith("1");
  });

  it("shows store logos and falls back when a logo is missing or fails to load", () => {
    renderWithProviders(<Map {...base} />);
    const markers = screen.getAllByTestId("marker");
    const logo = within(markers[0]).getByRole("img");
    expect(logo).toHaveAttribute("src", "https://example.com/a.webp");
    expect(within(markers[1]).getByRole("img")).toHaveAttribute(
      "src",
      noAvatar,
    );
    fireEvent.error(logo);
    expect(logo).toHaveAttribute("src", noAvatar);
    fireEvent.error(logo);
    expect(logo).toHaveAttribute("src", noAvatar);
  });

  it("shows and selects the chosen store's logo when stores share a position", () => {
    const { rerender } = render(<Map {...base} selectedId="1" />, {
      wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
    });
    rerender(<Map {...base} selectedId="2" />);
    const marker = screen.getAllByTestId("marker")[0];
    expect(within(marker).getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/b.webp",
    );
    fireEvent.click(
      within(marker).getByRole("button", { name: /^B — 2 καταστήματα/ }),
    );
    expect(base.onSelect).toHaveBeenLastCalledWith("2");
    expect(
      screen.getByRole("button", { name: "Δες παραγγελίες: A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Δες παραγγελίες: B" }),
    ).toBeInTheDocument();
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

  it("expands a cluster without selecting a store or applying any order filter", () => {
    const close = buildStoreRows(
      [
        {
          id: 1,
          name: "A",
          orders: 1,
          totalPrice: 10,
          latitude: 38,
          longitude: 23,
        },
        {
          id: 2,
          name: "B",
          orders: 3,
          totalPrice: 30,
          latitude: 38.00001,
          longitude: 23.00001,
        },
      ],
      [],
      40,
    );
    renderWithProviders(<Map {...base} restaurants={close} />);
    expect(screen.getByTestId("cluster")).toBeInTheDocument();
    map.setView.mockClear();
    fireEvent.click(
      screen.getByRole("button", { name: /2 καταστήματα, 40,00/ }),
    );
    expect(map.setView).toHaveBeenCalledWith(expect.anything(), 18, {
      animate: false,
    });
    expect(base.onSelect).not.toHaveBeenCalled();
    expect(base.onShowOrders).not.toHaveBeenCalled();
    for (const key of ["Enter", " "]) {
      map.setView.mockClear();
      fireEvent.keyDown(
        screen.getByRole("button", { name: /2 καταστήματα, 40,00/ }),
        { key },
      );
      expect(map.setView).toHaveBeenCalledTimes(1);
    }
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
