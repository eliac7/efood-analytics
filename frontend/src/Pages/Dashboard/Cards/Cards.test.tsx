import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/render";
import { testOrders } from "../../../test/fixtures";
import { NO_DATA } from "../../../utils/helpers";
import HourCard from "./HourCard";
import MapCard from "./MapCard";
import RestaurantCard from "./RestaurantCard";

describe("dashboard card fallbacks", () => {
  it("selects the busiest phase independently of key order", () => {
    renderWithProviders(<HourCard title="Ώρα" value={{ morning: 1, noon: 6, afternoon: 0, night: 2 }} />);
    expect(screen.getByText(/μεσημέρι/)).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
  it("shows no data for empty date buckets and cities", () => {
    renderWithProviders(<><HourCard title="Ώρα" value={{ morning: 0, noon: 0, afternoon: 0, night: 0 }} /><MapCard title="Πόλη" value={{}} /></>);
    expect(screen.getAllByText(NO_DATA)).toHaveLength(2);
  });
  it("selects the city with most orders independently of key order", () => {
    renderWithProviders(<MapCard title="Πόλη" value={{ Athens: 1, Patras: 5 }} />);
    expect(screen.getByText('"Patras"')).toBeInTheDocument();
  });
  it("does not link missing coordinates and uses an image fallback", () => {
    renderWithProviders(<RestaurantCard data={{ ...testOrders.all.restaurants[0], latitude: null, longitude: null, logo: null, is_open: undefined }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", expect.stringContaining("no-avatar"));
  });
  it("links valid zero coordinates", () => {
    renderWithProviders(<RestaurantCard data={{ ...testOrders.all.restaurants[0], latitude: 0, longitude: 0 }} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://maps.google.com/?q=0,0");
  });
});
