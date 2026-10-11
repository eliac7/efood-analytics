import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../../test/render";
import StoresPanel from "./StoresPanel";
import type { StoreRow } from "../../../utils/storeAnalytics";

vi.mock("../Map/Map", () => ({
  default: ({
    restaurants,
    metric,
    selectedId,
  }: {
    restaurants: StoreRow[];
    metric: string;
    selectedId: string | null;
  }) => (
    <div data-testid="map">
      {restaurants.length}:{metric}:{selectedId ?? "none"}
    </div>
  ),
}));

describe("stores panel", () => {
  it("keeps all stores on the map when ranking is limited and lets users select a store or its orders", () => {
    const onShowOrders = vi.fn();
    const restaurants = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: `Store ${i + 1}`,
      totalPrice: 12 - i,
      orders: i + 1,
      latitude: i === 0 ? null : 38,
      longitude: 23 + i / 100,
    }));
    renderWithProviders(
      <StoresPanel
        restaurants={restaurants}
        history={[]}
        totalPrice={78}
        onShowOrders={onShowOrders}
      />,
    );
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    expect(screen.getByTestId("map")).toHaveTextContent("12:amount:none");
    expect(screen.getByText(/Στον χάρτη: 11 από 12/)).toBeInTheDocument();
    expect(within(table).getByText("Χωρίς θέση")).toBeInTheDocument();
    expect(within(table).getByText("15,4%")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Στον χάρτη: Store 2" }),
    );
    expect(screen.getByTestId("map")).toHaveTextContent("12:amount:2");
    expect(
      screen.getByRole("heading", { name: "Τα καταστήματα που παραγγέλνεις" }),
    ).toHaveFocus();
    fireEvent.change(screen.getByLabelText("Προβολή χάρτη"), {
      target: { value: "orders" },
    });
    expect(screen.getByTestId("map")).toHaveTextContent("12:orders:2");
    fireEvent.click(screen.getByRole("button", { name: "Όλα τα καταστήματα" }));
    expect(screen.getByTestId("map")).toHaveTextContent("12:orders:none");
    fireEvent.change(screen.getByLabelText("Κατάταξη καταστημάτων"), {
      target: { value: "orders" },
    });
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("Store 12");
    fireEvent.change(screen.getByLabelText("Εμφάνιση καταστημάτων"), {
      target: { value: "10" },
    });
    expect(within(table).getAllByRole("row")).toHaveLength(11);
    fireEvent.change(screen.getByLabelText("Εμφάνιση καταστημάτων"), {
      target: { value: "all" },
    });
    expect(within(table).getAllByRole("row")).toHaveLength(13);
    fireEvent.click(
      screen.getByRole("button", { name: "Παραγγελίες: Store 1" }),
    );
    expect(onShowOrders).toHaveBeenCalledWith("1");
  });
  it("keeps unlocated stores accessible and explains empty results", () => {
    const { unmount } = renderWithProviders(
      <StoresPanel
        restaurants={[{ id: 1, name: "A", totalPrice: 0, orders: 1 }]}
        history={[]}
        totalPrice={0}
        onShowOrders={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Δεν έχουμε διαθέσιμες θέσεις για αυτά τα καταστήματα."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Παραγγελίες: A" }),
    ).toBeEnabled();
    expect(screen.queryByLabelText("Προβολή χάρτη")).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    unmount();
    renderWithProviders(
      <StoresPanel
        restaurants={[]}
        history={[]}
        totalPrice={0}
        onShowOrders={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Δεν βρέθηκαν καταστήματα με αυτή την επιλογή."),
    ).toBeInTheDocument();
  });
});
