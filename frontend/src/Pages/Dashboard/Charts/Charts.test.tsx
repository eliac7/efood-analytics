import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { renderWithProviders } from "../../../test/render";
import { NO_DATA } from "../../../utils/helpers";
import WeekdayChart from "./WeekdayChart";
import PlatformAndPaymentChart from "./PlatformAndPaymentChart";

vi.mock("react-apexcharts", () => ({ default: ({ options }: { options: { xaxis?: { categories: string[] } } }) =>
  <div data-testid="chart">{options.xaxis?.categories.join(",")}</div> }));

describe("chart periods", () => {
  it("updates axis categories together with the selected period", () => {
    const { rerender } = render(<WeekdayChart data={{ March: 2, December: 1 }} title="Months" color="blue" />,
      { wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider> });
    expect(screen.getByTestId("chart")).toHaveTextContent("March,December");
    rerender(<WeekdayChart data={{ December: 1 }} title="Months" color="blue" />);
    expect(screen.getByTestId("chart")).toHaveTextContent(/^December$/);
  });
  it("shows a fallback instead of drawing charts without observations", () => {
    renderWithProviders(<><WeekdayChart data={{}} title="Months" color="blue" />
      <PlatformAndPaymentChart data={{ web: 0 }} title="Platforms" color="green" /></>);
    expect(screen.getAllByText(NO_DATA)).toHaveLength(2);
    expect(screen.queryByTestId("chart")).not.toBeInTheDocument();
  });
});
