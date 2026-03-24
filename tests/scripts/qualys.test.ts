import { describe, expect, it } from "vitest";
import fixture from "../fixtures/qualys.response.json" assert { type: "json" };
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
