import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../../test/render";
import { makeTestCostBreakdown } from "../../../test/fixtures";
import { COST_COMPONENT_KEYS } from "../../../utils/costs";
import CostBreakdownPanel from "./CostBreakdownPanel";

describe("cost breakdown presentation", () => {
  it("shows partial amounts with coverage and does not draw a complete charge chart", () => {
    const data = makeTestCostBreakdown(2);
    data.components.service = {
      amount: null,
      knownAmount: 1.5,
      coveredOrders: 1,
    };
    renderWithProviders(
      <CostBreakdownPanel data={data} totalOrders={2} totalPrice={10} />,
    );
    const row = screen.getByText("Χρέωση υπηρεσίας").closest("tr")!;
    expect(within(row).getByText("Λείπουν ποσά")).toBeInTheDocument();
    expect(
      within(row).getByText(/Γνωστό ποσό: 1,50.*σε 1\/2/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Λείπουν στοιχεία κόστους")).toBeInTheDocument();
  });

  it("draws a labelled chart for fully known charges and keeps zero discounts", () => {
    const data = makeTestCostBreakdown(1);
    for (const key of COST_COMPONENT_KEYS)
      data.components[key] = { amount: 0, knownAmount: 0, coveredOrders: 1 };
    data.components.service = { amount: 1, knownAmount: 1, coveredOrders: 1 };
    data.additionalCharges = { amount: 1, knownAmount: 1, coveredOrders: 1 };
    data.reconciliation = {
      matchedOrders: 1,
      mismatchedOrders: 0,
      unavailableOrders: 0,
      netDifference: 0,
      absoluteDifference: 0,
    };
    renderWithProviders(
      <CostBreakdownPanel data={data} totalOrders={1} totalPrice={10} />,
    );
    expect(
      screen.getByRole("img", { name: /Χρέωση υπηρεσίας: 1,00/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/10.*%/)).toBeInTheDocument();
    expect(
      within(
        screen.getByText("Επιπλέον έκπτωση κουπονιών (−)").closest("tr")!,
      ).getByText(/0,00/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Σακούλες")).not.toBeInTheDocument();
  });

  it("warns about absolute discrepancies even when their net amount cancels", () => {
    const data = makeTestCostBreakdown(2);
    data.reconciliation = {
      matchedOrders: 0,
      mismatchedOrders: 2,
      unavailableOrders: 0,
      netDifference: 0,
      absoluteDifference: 2,
    };
    renderWithProviders(
      <CostBreakdownPanel data={data} totalOrders={2} totalPrice={20} />,
    );
    expect(screen.getByText("Κάποια ποσά δεν συμφωνούν")).toBeInTheDocument();
    expect(
      screen.getByText(/Οι διαφορές φτάνουν συνολικά τα 2,00/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Δεν είναι έξτρα χρέωση/)).toBeInTheDocument();
  });

  it("handles empty history without percentages or charts", () => {
    renderWithProviders(
      <CostBreakdownPanel
        data={makeTestCostBreakdown(0)}
        totalOrders={0}
        totalPrice={0}
      />,
    );
    expect(
      screen.getByText("Δεν υπάρχουν διαθέσιμα δεδομένα"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });
});
