import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { makeTestHistory } from "../../../test/fixtures";
import OrderHistoryPanel from "./OrderHistoryPanel";

describe("order history", () => {
  it("paginates and sorts locally with undated orders last", () => {
    const history = Array.from({ length: 23 }, (_, index) => ({
      ...makeTestHistory()[0],
      id: `row:${index}`,
      price: index + 1,
    }));
    history[0].submissionDate = null;
    renderWithProviders(<OrderHistoryPanel history={history} />);
    const table = screen.getByRole("table", {
      name: "Οι παραγγελίες σου",
    });
    expect(within(table).getAllByRole("row")).toHaveLength(21);
    expect(screen.getByText(/Σελίδα 1\/2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Επόμενη σελίδα" }));
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(within(table).getAllByRole("row").at(-1)).toHaveTextContent(
      "Χωρίς ημερομηνία",
    );
    fireEvent.change(screen.getByLabelText("Ταξινόμηση παραγγελιών"), {
      target: { value: "high" },
    });
    expect(screen.getByText(/Σελίδα 1\/2/)).toBeInTheDocument();
    expect(within(table).getAllByRole("row")[1]).toHaveTextContent("23,00");
    fireEvent.change(screen.getByLabelText("Παραγγελίες ανά σελίδα"), {
      target: { value: "50" },
    });
    expect(within(table).getAllByRole("row")).toHaveLength(24);
    expect(
      screen.getByRole("button", { name: "Επόμενη σελίδα" }),
    ).toBeDisabled();
    expect(history[0].price).toBe(1);
  });

  it("shows one order's signed product lines and cost coverage in its details", async () => {
    const history = makeTestHistory().slice(1, 2);
    history[0].products.push({
      ...history[0].products[0],
      name: "Discount",
      quantity: 1,
      unitPrice: -1,
      isCoupon: true,
    });
    renderWithProviders(<OrderHistoryPanel history={history} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Λεπτομέρειες παραγγελίας/ }),
    );
    const dialog = within(
      await screen.findByRole("dialog", { name: "Λεπτομέρειες παραγγελίας" }),
    );
    expect(dialog.getByText(/Σύνολο παραγγελίας:.*12,50/)).toBeInTheDocument();
    expect(
      dialog.getByText(/Κατάσταση στο efood: accepted/),
    ).toBeInTheDocument();
    expect(dialog.getByText("Discount")).toBeInTheDocument();
    expect(dialog.getByText(/-1,00/)).toBeInTheDocument();
    expect(
      dialog.getByRole("columnheader", { name: "Στοιχεία για" }),
    ).toBeInTheDocument();
    expect(dialog.getAllByText("1/1").length).toBeGreaterThan(0);
    expect(
      dialog.getAllByText("Δεν υπάρχουν διαθέσιμα δεδομένα").length,
    ).toBeGreaterThan(0);
  });
});
