import { describe, expect, it } from "vitest";
import fixture from "../fixtures/halopsa.response.json" assert { type: "json" };
import { mapHaloPsaMetrics } from "../../scripts/sources/halopsa";
import type { HaloAggregateResponse } from "../../scripts/sources/halopsa";

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
});
