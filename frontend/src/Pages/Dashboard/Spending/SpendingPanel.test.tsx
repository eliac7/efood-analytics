import { fireEvent, render, screen, within } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { makeTestTimeline } from "../../../test/fixtures";
import type { PeriodComparison } from "../../../types";
import SpendingPanel from "./SpendingPanel";

vi.mock("react-apexcharts", () => ({
  default: ({ series, options }: { series: unknown; options: unknown }) => (
    <div data-testid="spending-chart">
      {JSON.stringify({ series, options })}
    </div>
  ),
}));

describe("spending panel", () => {
  it("updates chronological labels, zero amounts, and weekly series when the year changes", () => {
    const timeline = makeTestTimeline();
    const view = render(<SpendingPanel timeline={timeline} year="2025" />, {
      wrapper: MantineProvider,
    });
    const chart = screen.getByTestId("spending-chart");
    expect(chart).toHaveTextContent("03/2025");
    expect(chart).not.toHaveTextContent("12/2024");
    const table = screen.getByRole("table", { name: "Δαπάνη ανά μήνα" });
    expect(
      within(table).getByRole("row", { name: /02\/2025/ }),
    ).toHaveTextContent("0,00 €");
    fireEvent.change(screen.getByLabelText("Ομαδοποίηση δαπάνης"), {
      target: { value: "weeks" },
    });
    expect(
      screen.getByRole("table", { name: "Δαπάνη ανά εβδομάδα" }),
    ).toBeInTheDocument();
    expect(chart).not.toHaveTextContent('03/2025"');
    view.rerender(<SpendingPanel timeline={timeline} year="2024" />);
    expect(chart).toHaveTextContent("30/12/2024–31/12/2024");
    expect(chart).not.toHaveTextContent("/2025");
  });

  it("shows explicit equal dates and absolute changes when the baseline is zero", () => {
    const timeline = makeTestTimeline();
    const comparison: PeriodComparison = {
      key: "days30",
      days: 30,
      current: {
        from: "2025-12-02",
        through: "2025-12-31",
        complete: true,
        totalOrders: 1,
        totalPrice: 10,
        averagePrice: 10,
        medianPrice: 10,
      },
      previous: {
        from: "2025-11-02",
        through: "2025-12-01",
        complete: true,
        totalOrders: 0,
        totalPrice: 0,
        averagePrice: null,
        medianPrice: null,
      },
      change: {
        totalPrice: { absolute: 10, percent: null },
        totalOrders: { absolute: 1, percent: null },
        averagePrice: null,
        medianPrice: null,
      },
    };
    timeline.comparisons = timeline.comparisons.map((c) =>
      c.key === "days30" ? comparison : c,
    );
    renderWithProviders(<SpendingPanel timeline={timeline} year="all" />);
    fireEvent.change(screen.getByLabelText("Περίοδος σύγκρισης"), {
      target: { value: "days30" },
    });
    expect(screen.getByText(/30 πλήρεις ημέρες/)).toHaveTextContent(
      "02/12/2025–31/12/2025",
    );
    const row = within(
      screen.getByRole("table", { name: "Σύγκριση περιόδων" }),
    ).getByRole("row", { name: /^Δαπάνη/ });
    expect(row).toHaveTextContent("+10,00 €");
    expect(row).toHaveTextContent("χωρίς ποσοστό (πριν: 0)");
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it("discloses undated amounts and prevents incomplete comparisons from showing a change", () => {
    renderWithProviders(
      <SpendingPanel timeline={makeTestTimeline()} year="all" />,
    );
    expect(
      screen.getByRole("alert", { name: "Παραγγελίες εκτός γραφήματος" }),
    ).toHaveTextContent("7,00 €");
    expect(
      screen.getByRole("alert", {
        name: "Δεν έχουμε αρκετά στοιχεία για σύγκριση",
      }),
    ).toBeInTheDocument();
    const table = within(
      screen.getByRole("table", { name: "Σύγκριση περιόδων" }),
    );
    expect(
      table.getByRole("columnheader", { name: "Τρέχουσα (ελλιπή στοιχεία)" }),
    ).toBeInTheDocument();
    expect(table.queryByText(/\+\d/)).not.toBeInTheDocument();
  });

  it("shows an empty state and keeps the observed sync date", () => {
    const timeline = makeTestTimeline();
    timeline.months = [];
    timeline.weeks = [];
    timeline.coverage.from = null;
    timeline.coverage.undatedOrders = 0;
    timeline.coverage.undatedAmount = 0;
    renderWithProviders(<SpendingPanel timeline={timeline} year="all" />);
    expect(screen.queryByTestId("spending-chart")).not.toBeInTheDocument();
    expect(screen.getByText(/Ενημερώθηκε:/)).toHaveTextContent("2026");
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });
});
