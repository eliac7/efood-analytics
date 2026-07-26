import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../test/render";
import { testOrders, testUser } from "../../test/fixtures";
import { useAuth } from "../../Hooks/Auth/useAuth";
import EfoodAxios from "../../Services/EfoodAxios/Efoodaxios";
import Dashboard from "./Dashboard";

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
  });

  it("fetches orders when no cached analytics exist", async () => {
    const dispatch = vi.fn();
    mockedAxiosGet.mockResolvedValue({
      data: {
        orders: { all: testOrders.all, perYear: testOrders.perYear },
      },
    });

    renderWithProviders(<Dashboard />, {
      route: "/dashboard",
      dispatch,
      state: { user: testUser, orders: null, loading: false },
    });

    await waitFor(() => {
      expect(mockedAxiosGet).toHaveBeenCalledWith("/orders", {
        headers: { session_id: testUser.session_id },
      });
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: "SET_ORDERS",
      payload: { all: testOrders.all, perYear: testOrders.perYear },
    });
  });
});
