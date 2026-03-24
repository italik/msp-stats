import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../../scripts/buildSnapshot";
import type { SourceResult } from "../../scripts/sources/types";

type BuildSources = {
  halopsa: SourceResult<unknown>;
  qualys: SourceResult<unknown>;
  dattoRmm: SourceResult<unknown>;
};

describe("buildSnapshot", () => {
  const staleTimestamp = "2026-03-24T12:20:00.000Z";

  it("carries forward stale source values instead of zeroing them", async () => {
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: { status: "current", fetchedAt: staleTimestamp, data: {} },
      dattoRmm: { status: "current", fetchedAt: staleTimestamp, data: {} }
    };

    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/snapshot.valid.json",
      sources
    });

    const carriedForward = snapshot.service.current.slaAttainment.value;
    expect(carriedForward).toBe("99.8%");
    expect(snapshot.sources.find((source) => source.name === "HaloPSA")?.status).toBe("stale");
    expect(snapshot.sources.find((source) => source.name === "HaloPSA")?.note).toContain(
      "Previous known-good values carried forward"
    );
  });
});
