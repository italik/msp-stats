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

  it("does not throw when previous snapshot file is missing", async () => {
    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/does-not-exist.json",
      sources: {
        halopsa: { status: "stale", fetchedAt: staleTimestamp },
        qualys: { status: "stale", fetchedAt: staleTimestamp },
        dattoRmm: { status: "stale", fetchedAt: staleTimestamp }
      }
    });

    expect(snapshot.overall.lastUpdated).toBeDefined();
    expect(snapshot.service.current.slaAttainment.label).toBe("SLA Attainment");
  });

  it("merges partial current source fragments without wiping existing fields", async () => {
    const sources: BuildSources = {
      halopsa: {
        status: "current",
        fetchedAt: staleTimestamp,
        data: {
          service: {
            current: {
              resolvedTickets: { label: "Resolved Tickets", value: 999, context: "YTD" }
            }
          }
        }
      },
      qualys: { status: "stale", fetchedAt: staleTimestamp },
      dattoRmm: { status: "stale", fetchedAt: staleTimestamp }
    };

    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/snapshot.valid.json",
      sources
    });

    expect(snapshot.service.current.resolvedTickets.value).toBe(999);
    expect(snapshot.service.current.slaAttainment.value).toBe("99.8%");
  });
});
