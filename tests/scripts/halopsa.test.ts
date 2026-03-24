import { describe, expect, it } from "vitest";
import fixture from "../fixtures/halopsa.response.json" assert { type: "json" };
import { mapHaloPsaMetrics } from "../../scripts/sources/halopsa";

describe("mapHaloPsaMetrics", () => {
  it("derives public service KPIs from HaloPSA aggregates", () => {
    const metrics = mapHaloPsaMetrics(fixture);
    expect(metrics.summary.slaAttainment.value).toBe("98.6%");
    expect(metrics.service.firstResponseMedian.value).toBe("14m");
  });
});
