import { afterEach, describe, expect, it, vi } from "vitest";
import fixture from "../fixtures/qualys.response.json" assert { type: "json" };
import { fetchQualysMetrics } from "../../scripts/fetchAllSources";
import { mapQualysMetrics, type QualysResponse } from "../../scripts/sources/qualys";

describe("mapQualysMetrics", () => {
  it("maps critical vulnerability totals and trends", () => {
    const metrics = mapQualysMetrics(fixture as QualysResponse);

    expect(metrics.summary.openCriticalVulnerabilities.value).toBe("12");
    expect(metrics.summary.criticalVulnerabilityTrend.value).toBe("-3");
    expect(metrics.summary.criticalVulnerabilityTrend.direction).toBe("down");
  expect(metrics.security.vulnerabilityBySeverity.critical).toBe(12);
  });
});

describe("fetchQualysMetrics", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("omits direction on security.current entries", async () => {
    const result = await fetchQualysMetrics();
    const current = result.data?.security?.current;

    expect(current).toBeDefined();
    if (!current) return;

    const hasDirection = (entry: Record<string, unknown>) =>
      Object.prototype.hasOwnProperty.call(entry, "direction");

    expect(hasDirection(current.openCriticalVulnerabilities)).toBe(false);
    expect(hasDirection(current.criticalVulnerabilityTrend)).toBe(false);
  });

  it("populates summary KPIs consistent with security details", async () => {
    const result = await fetchQualysMetrics();
    const current = result.data?.security?.current;
    const summaryKpis = result.data?.summary?.kpis ?? [];

    const openCritical = summaryKpis.find((kpi) => kpi.id === "open-critical-vulnerabilities");
    const trend = summaryKpis.find((kpi) => kpi.id === "critical-vulnerability-trend");

    expect(openCritical?.value).toBe(current?.openCriticalVulnerabilities?.value);
    expect(openCritical?.direction).toBeUndefined();
    expect(trend?.value).toBe(current?.criticalVulnerabilityTrend?.value);
    expect(trend?.direction).toBeDefined();
  });

  it("anchors vulnerability trend dates to the current publish day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-05T09:00:00.000Z"));

    const result = await fetchQualysMetrics();
    const criticalTrend = result.data?.security?.trends?.openCriticalVulnerabilities ?? [];
    const highTrend = result.data?.security?.trends?.openHighVulnerabilities ?? [];

    expect(criticalTrend.map((point) => point.date)).toEqual(["2026-04-04", "2026-04-05"]);
    expect(highTrend.map((point) => point.date)).toEqual(["2026-04-04", "2026-04-05"]);
  });
});
