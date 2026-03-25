import { describe, expect, it } from "vitest";
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
});
