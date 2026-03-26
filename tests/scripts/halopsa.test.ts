import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/halopsa.response.json" assert { type: "json" };
import report304Fixture from "../fixtures/halopsa.report304.json" assert { type: "json" };
import report347Fixture from "../fixtures/halopsa.report347.json" assert { type: "json" };
import report348Fixture from "../fixtures/halopsa.report348.json" assert { type: "json" };
import report349Fixture from "../fixtures/halopsa.report349.json" assert { type: "json" };
import report350Fixture from "../fixtures/halopsa.report350.json" assert { type: "json" };
import { env } from "../../scripts/config";
import { fetchHaloPsaMetrics } from "../../scripts/fetchAllSources";
import {
  mapHaloPsaMetrics,
  mergeHaloAggregateWithOpenClosedReport,
  mergeHaloAggregateWithSlaAttainmentReports,
  mergeHaloAggregateWithResponseTimeReport,
  mergeHaloAggregateWithResolutionTimeReport
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
    expect(merged.ticketsResolved).toBe(553);
    expect(merged.slaMetPercent).toBe(fixture.slaMetPercent);
    expect(merged.firstResponseMedianMinutes).toBe(fixture.firstResponseMedianMinutes);
    expect(merged.resolutionMedianHours).toBe(fixture.resolutionMedianHours);
  });

  it("merges report 347 average response time into the aggregate payload", () => {
    const merged = mergeHaloAggregateWithResponseTimeReport(
      fixture,
      report347Fixture as HaloReportResponse
    );

    expect(merged.firstResponseMedianMinutes).toBe(104);
    expect(merged.ticketVolume).toBe(fixture.ticketVolume);
  });

  it("merges report 348 average resolution time into the aggregate payload", () => {
    const merged = mergeHaloAggregateWithResolutionTimeReport(
      fixture,
      report348Fixture as HaloReportResponse
    );

    expect(merged.resolutionMedianHours).toBe(0.87);
    expect(merged.ticketsClosed).toBe(fixture.ticketsClosed);
  });

  it("merges response and resolution SLA reports into a blended attainment percentage", () => {
    const merged = mergeHaloAggregateWithSlaAttainmentReports(
      fixture,
      report349Fixture as HaloReportResponse,
      report350Fixture as HaloReportResponse
    );

    expect(merged.slaMetPercent).toBe(98.91);
    expect(merged.ticketVolume).toBe(fixture.ticketVolume);
  });
});

describe("fetchHaloPsaMetrics", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("publishes opened and resolved ticket labels for the public snapshot", async () => {
    const originalEnv = { ...env };
    env.HALOPSA_BASE_URL = "";
    env.HALOPSA_CLIENT_ID = "";
    env.HALOPSA_CLIENT_SECRET = "";

    try {
      const result = await fetchHaloPsaMetrics();
      const summaryLabels = result.data?.summary?.kpis?.map((kpi) => kpi.label) ?? [];
      const serviceLabels = result.data?.service?.metrics?.map((metric) => metric.label) ?? [];
      const serviceContexts = result.data?.service?.metrics?.map((metric) => metric.context) ?? [];

      expect(summaryLabels).toContain("Tickets opened");
      expect(summaryLabels).toContain("Tickets resolved");
      expect(summaryLabels).not.toContain("Tickets handled");
      expect(serviceLabels).toContain("Tickets opened");
      expect(serviceLabels).toContain("Tickets resolved");
      expect(serviceLabels).not.toContain("Tickets handled");
      expect(serviceContexts).toContain("Yesterday");
      expect(serviceContexts).toContain("Rolling 30 days");
    } finally {
      Object.assign(env, originalEnv);
    }
  });

  it("anchors service trend dates to the current publish day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T09:00:00.000Z"));
    const originalEnv = { ...env };
    env.HALOPSA_BASE_URL = "";
    env.HALOPSA_CLIENT_ID = "";
    env.HALOPSA_CLIENT_SECRET = "";

    try {
      const result = await fetchHaloPsaMetrics();
      const trend = result.data?.service?.trends?.slaAttainment ?? [];
      const backlog = result.data?.service?.trends?.backlog ?? [];

      expect(trend.map((point) => point.date)).toEqual(["2026-04-04", "2026-04-05"]);
      expect(backlog.map((point) => point.date)).toEqual(["2026-04-04", "2026-04-05"]);
    } finally {
      Object.assign(env, originalEnv);
    }
  });
});
