import { describe, expect, it } from "vitest";
import fixture from "../fixtures/datto-rmm.response.json" assert { type: "json" };
import { mapDattoRmmMetrics, type DattoRmmResponse } from "../../scripts/sources/dattoRmm";

describe("mapDattoRmmMetrics", () => {
  it("maps patch compliance and device counts", () => {
    const metrics = mapDattoRmmMetrics(fixture as DattoRmmResponse);

    expect(metrics.summary.patchCompliance.value).toBe("94.2%");
    expect(metrics.security.devicesFullyPatched).toBe(1228);
    expect(metrics.security.devicesMissingCriticalPatches).toBe(42);
  });
});
