import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../../test/render";
import { testOrders, testUser } from "../../../test/fixtures";
import TimeStampChecker from "./TimeStampChecker";

describe("TimeStampChecker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("disables refresh for fresh data and enables it after one hour", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-01-01T12:00:00");
    vi.setSystemTime(now);
    const refetch = vi.fn().mockResolvedValue({});

    renderWithProviders(<TimeStampChecker refetch={refetch} />, {
      state: {
        user: testUser,
        orders: { ...testOrders, timestamp: now },
        loading: false,
      },
    });
    expect(screen.getByRole("button")).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole("button")).toBeDisabled();

    vi.setSystemTime(new Date("2026-01-01T13:01:00"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByRole("button", { name: "Ανανέωση παραγγελιών" })).toBeEnabled();
  });

  it("refetches without advancing the timestamp before data has been committed", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T13:01:00"));
    let complete!: () => void;
    const refetch = vi.fn(() => new Promise<void>((resolve) => { complete = resolve; }));
    const dispatch = vi.fn();

    renderWithProviders(<TimeStampChecker refetch={refetch} />, {
      dispatch,
      state: {
        user: testUser,
        orders: {
          ...testOrders,
          timestamp: new Date("2026-01-01T12:00:00"),
        },
        loading: false,
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    fireEvent.click(screen.getByRole("button"));

    expect(refetch).toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(dispatch).not.toHaveBeenCalled();
    await act(async () => { complete(); });
    expect(screen.getByRole("button", { name: "Ανανέωση παραγγελιών" })).toBeEnabled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("permits retry after a rejected refresh without changing cached timestamps", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T13:01:00"));
    const refetch = vi.fn().mockRejectedValue(new Error("Request failed"));
    const dispatch = vi.fn();
    renderWithProviders(<TimeStampChecker refetch={refetch} />, {
      dispatch,
      state: { user: testUser, orders: { ...testOrders, timestamp: new Date("2026-01-01T12:00:00") }, loading: false },
    });
    await act(async () => { fireEvent.click(screen.getByRole("button")); });
    expect(refetch).toHaveBeenCalledOnce();
    expect(dispatch).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Ανανέωση παραγγελιών" })).toBeEnabled();
  });
});
