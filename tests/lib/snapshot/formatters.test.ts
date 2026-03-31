import { describe, expect, it } from "vitest";
import {
  formatAsOf,
  formatTrendDelta,
  formatTrendValue,
  summarizeTrendPoints
} from "../../../src/lib/snapshot/formatters";

describe("snapshot formatters", () => {
  it("summarizeTrendPoints computes latest, delta, high, and low for count metrics", () => {
    expect(
      summarizeTrendPoints([
        { date: "2026-03-01", value: 10 },
        { date: "2026-03-02", value: 15 },
        { date: "2026-03-03", value: 12 }
      ])
    ).toEqual({
      latest: 12,
      delta: 2,
      high: 15,
      low: 10
    });
  });

  it("summarizeTrendPoints treats a single point as zero delta", () => {
    expect(summarizeTrendPoints([{ date: "2026-03-01", value: 7 }])).toEqual({
      latest: 7,
      delta: 0,
      high: 7,
      low: 7
    });
  });

  it("formatTrendValue formats percent and count values", () => {
    expect(formatTrendValue(98.45, "percent")).toBe("98.5%");
    expect(formatTrendValue(12345, "count")).toBe("12,345");
  });

  it("formatTrendDelta formats percent and count deltas", () => {
    expect(formatTrendDelta(1.25, "percent")).toBe("+1.3 pts");
    expect(formatTrendDelta(0.04, "percent")).toBe("0.0 pts");
    expect(formatTrendDelta(-0.04, "percent")).toBe("0.0 pts");
    expect(formatTrendDelta(-12, "count")).toBe("-12");
    expect(formatTrendDelta(0, "percent")).toBe("0.0 pts");
    expect(formatTrendDelta(0, "count")).toBe("0");
  });

  it("keeps existing formatter exports working", () => {
    expect(formatAsOf("2026-03-31T00:00:00.000Z")).toBe("31 Mar 2026");
  });
});
