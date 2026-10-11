import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import {
  makeTestCostBreakdown,
  makeTestTimeline,
  testOrders,
  testUser,
} from "../../test/fixtures";
import { useAuth } from "../../Hooks/Auth/useAuth";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import Dashboard from "./Dashboard";
import { NO_DATA } from "../../utils/helpers";

vi.mock("../../Hooks/Auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("react-apexcharts", () => ({
  default: () => <div data-testid="chart" />,
}));

vi.mock("./Map/Map", () => ({
  default: ({ restaurants }: { restaurants?: unknown[] }) => (
    <div data-testid="map">restaurants:{restaurants?.length ?? 0}</div>
  ),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedAxiosGet = vi.spyOn(EfoodAxios, "get");

describe("Dashboard", () => {
  beforeEach(() => {
    mockedUseAuth.mockReturnValue({
      user: testUser,
      login: vi.fn(),
      loginWithSessionId: vi.fn(),
      logout: vi.fn(),
      loading: false,
    });
    mockedAxiosGet.mockReset();
  });

  it("renders cached all-time orders by default", () => {
    renderWithProviders(<Dashboard />, {
      route: "/dashboard",
      state: { user: testUser, orders: testOrders, loading: false },
    });

    expect(screen.getByText("Συνολικές Παραγγελίες")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Συνολική Δαπάνη")).toBeInTheDocument();
    expect(screen.getByText(/49,74/)).toBeInTheDocument();
    expect(screen.getByText("Gyro House")).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByTestId("map")).toHaveTextContent("restaurants:1");
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it("switches displayed stats when a year is selected", async () => {
    renderWithProviders(<Dashboard />, {
      route: "/dashboard",
      state: { user: testUser, orders: testOrders, loading: false },
    });

    const select = screen.getByRole("combobox", { name: "Επιλογή Έτους" });
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "2024", hidden: true }));

    await waitFor(() => {
      expect(screen.getByText("Pasta Place")).toBeInTheDocument();
    });
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/9,99/).length).toBeGreaterThan(0);
    const costs = within(
      screen.getByRole("region", { name: "Ανάλυση κόστους" }),
    );
    expect(costs.getByText("1 παραγγελία")).toBeInTheDocument();
    expect(costs.getByText(/σε 1\/1 παραγγελίες/i)).toBeInTheDocument();
  });

  it("fetches orders when no cached analytics exist", async () => {
    const dispatch = vi.fn();
    mockedAxiosGet.mockResolvedValue({
      data: {
        orders: {
          all: testOrders.all,
          perYear: testOrders.perYear,
          timeline: testOrders.timeline,
        },
      },
    });

    renderWithProviders(<Dashboard />, {
      route: "/dashboard",
      dispatch,
      state: { user: testUser, orders: null, loading: false },
    });

    await waitFor(() => {
      expect(mockedAxiosGet).toHaveBeenCalledWith("/orders", {
        signal: expect.any(AbortSignal),
        headers: { session_id: testUser.session_id },
      });
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "SET_ORDERS",
      requestUser: testUser,
      payload: {
        all: testOrders.all,
        perYear: testOrders.perYear,
        timeline: testOrders.timeline,
      },
    });
  });

  it("renders zero euros correctly and labels delivery time as an estimate", () => {
    const all = {
      ...testOrders.all,
      totalPrice: 0,
      totalOrders: 1,
      totalTips: 0,
      deliveryCost: 0,
      couponAmount: 0,
      averageDeliveryTime: 0,
    };
    renderWithProviders(<Dashboard />, {
      state: { user: testUser, orders: { ...testOrders, all }, loading: false },
    });
    for (const title of [
      "Συνολική Δαπάνη",
      "Μέσος Όρος / Παραγγελία",
      "Συνολικά φιλοδωρήματα",
      "Συνολικά Έξοδα Παράδοσης",
      "Έκπτωση από κουπόνια",
    ]) {
      const card = within(screen.getByText(title).parentElement!);
      expect(card.getByText(/0,00\s*€/)).toBeInTheDocument();
      expect(card.queryByText(NO_DATA)).not.toBeInTheDocument();
    }
    expect(
      within(
        screen.getByText("Μέση εκτίμηση χρόνου παράδοσης").parentElement!,
      ).getByText("0 λεπτά"),
    ).toBeInTheDocument();
    expect(screen.getByText("Μοναδικά καταστήματα")).toBeInTheDocument();
  });

  it("renders unavailable optional amounts without treating them as zero", () => {
    const all = {
      ...testOrders.all,
      totalTips: null,
      deliveryCost: null,
      couponAmount: null,
      averageDeliveryTime: null,
    };
    renderWithProviders(<Dashboard />, {
      state: { user: testUser, orders: { ...testOrders, all }, loading: false },
    });
    for (const title of [
      "Συνολικά φιλοδωρήματα",
      "Συνολικά Έξοδα Παράδοσης",
      "Έκπτωση από κουπόνια",
      "Μέση εκτίμηση χρόνου παράδοσης",
    ]) {
      expect(
        within(screen.getByText(title).parentElement!).getByText(NO_DATA),
      ).toBeInTheDocument();
    }
  });

  it("handles an empty history without displaying an invalid average", () => {
    const all = {
      ...testOrders.all,
      totalOrders: 0,
      totalPrice: 0,
      firstOrder: null,
      lastOrder: null,
      restaurantWithMostMoneySpent: null,
      mostOrderedProduct: null,
      restaurants: [],
    };
    renderWithProviders(<Dashboard />, {
      state: {
        user: testUser,
        orders: { ...testOrders, all, perYear: [] },
        loading: false,
      },
    });
    expect(
      within(
        screen.getByText("Μέσος Όρος / Παραγγελία").parentElement!,
      ).getByText(NO_DATA),
    ).toBeInTheDocument();
    expect(
      within(screen.getByText("Συνολική Δαπάνη").parentElement!).getByText(
        /0,00\s*€/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
    expect(screen.getByTestId("map")).toHaveTextContent("restaurants:0");
  });

  it("keeps cached analytics unchanged when a manual refresh fails", async () => {
    const dispatch = vi.fn();
    mockedAxiosGet.mockRejectedValue(new Error("Network failure"));
    renderWithProviders(<Dashboard />, {
      dispatch,
      state: {
        user: testUser,
        orders: { ...testOrders, timestamp: new Date(0) },
        loading: false,
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Ανανέωση παραγγελιών" }),
    );
    await waitFor(() => {
      expect(
        screen.getByText("Η ανάκτηση παραγγελιών απέτυχε"),
      ).toBeInTheDocument();
    });
    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByText(/49,74/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ανανέωση παραγγελιών" }),
    ).toBeEnabled();
  });

  it("commits a refresh only after the request succeeds", async () => {
    const dispatch = vi.fn();
    let complete!: (value: {
      data: {
        orders: {
          all: typeof testOrders.all;
          perYear: typeof testOrders.perYear;
          timeline: typeof testOrders.timeline;
        };
      };
    }) => void;
    mockedAxiosGet.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    renderWithProviders(<Dashboard />, {
      dispatch,
      state: {
        user: testUser,
        orders: { ...testOrders, timestamp: new Date(0) },
        loading: false,
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Ανανέωση παραγγελιών" }),
    );
    expect(dispatch).not.toHaveBeenCalled();
    const updated = {
      all: {
        ...testOrders.all,
        totalOrders: 5,
        costBreakdown: makeTestCostBreakdown(5),
      },
      perYear: testOrders.perYear,
      timeline: makeTestTimeline(5),
    };
    await act(async () => {
      complete({ data: { orders: updated } });
    });
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: "SET_ORDERS",
        payload: updated,
        requestUser: testUser,
      });
    });
    expect(dispatch).toHaveBeenCalledOnce();
  });
});
