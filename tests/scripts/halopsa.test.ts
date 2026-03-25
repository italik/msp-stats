import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/halopsa.response.json" assert { type: "json" };
import report304Fixture from "../fixtures/halopsa.report304.json" assert { type: "json" };
import { fetchHaloPsaMetrics } from "../../scripts/fetchAllSources";
import {
  mapHaloPsaMetrics,
  mergeHaloAggregateWithOpenClosedReport
} from "../../scripts/sources/halopsa";
import type { HaloAggregateResponse, HaloReportResponse } from "../../scripts/sources/halopsa";

describe("mapHaloPsaMetrics", () => {
  it("derives public service KPIs from HaloPSA aggregates", () => {
    const metrics = mapHaloPsaMetrics(fixture);
    expect(metrics.summary.slaAttainment.value).toBe("98.6%");
    expect(metrics.service.firstResponseMedian.value).toBe("14m");
  });

  it("fails fast when required numeric fields are missing or invalid", () => {
    const invalidPayload: HaloAggregateResponse = {
      ticketVolume: 1,
      ticketsClosed: 1,
      ticketsResolved: 1,
      slaMetPercent: NaN,
      firstResponseMedianMinutes: 1,
      resolutionMedianHours: 1
    };

    expect(() => mapHaloPsaMetrics(invalidPayload)).toThrow(
      /HaloPSA payload missing or invalid numeric field "slaMetPercent"/
    );
  });

  it("merges report 304 totals into the aggregate payload while preserving unsupported fields", () => {
    const merged = mergeHaloAggregateWithOpenClosedReport(
      fixture,
      report304Fixture as HaloReportResponse
    );

    expect(merged.ticketVolume).toBe(559);
    expect(merged.ticketsClosed).toBe(553);
    expect(merged.ticketsResolved).toBe(fixture.ticketsResolved);
    expect(merged.slaMetPercent).toBe(fixture.slaMetPercent);
    expect(merged.firstResponseMedianMinutes).toBe(fixture.firstResponseMedianMinutes);
    expect(merged.resolutionMedianHours).toBe(fixture.resolutionMedianHours);
  });
});

describe("fetchHaloPsaMetrics", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("anchors service trend dates to the current publish day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T09:00:00.000Z"));

    const result = await fetchHaloPsaMetrics();
    const trend = result.data?.service?.trends?.slaAttainment ?? [];
    const backlog = result.data?.service?.trends?.backlog ?? [];

    expect(trend.map((point) => point.date)).toEqual(["2026-04-04", "2026-04-05"]);
    expect(backlog.map((point) => point.date)).toEqual(["2026-04-04", "2026-04-05"]);
  });
});
