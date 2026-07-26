import { describe, expect, it } from "vitest";
import { dateFormat, formatAmount, timeFormat } from "./helpers";

describe("format helpers", () => {
  it("formats dates for Greek users", () => {
    const formatted = dateFormat("2025-03-10T11:30:00");

    expect(formatted).toContain("10");
    expect(formatted).toContain("2025");
    expect(formatted.toLocaleLowerCase("el-GR")).toContain("μαρ");
    expect(formatted).toContain("11");
    expect(formatted).toContain("30");
  });

  it("formats euro amounts", () => {
    const formatted = formatAmount(12.5);

    expect(formatted).toContain("12,50");
    expect(formatted).toContain("€");
  });

  it("formats minute durations", () => {
    expect(timeFormat(45)).toBe("45 λεπτά");
    expect(timeFormat(125)).toBe("2 ώρες 5 λεπτά");
  });
});
