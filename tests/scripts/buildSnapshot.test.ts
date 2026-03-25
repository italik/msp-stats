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
  const dattoOnlyMetric = {
    id: "devices-fully-patched",
    label: "Devices Fully Patched",
    value: 1200,
    context: ""
  };

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
    const haloStatus = snapshot.sources.find((source) => source.name === "HaloPSA");
    expect(haloStatus?.lastSuccessfulRefresh).toBe(staleTimestamp);
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

  it("replaces prior-day metrics when fresh security metrics are provided", async () => {
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: { status: "stale", fetchedAt: staleTimestamp },
      dattoRmm: {
        status: "current",
        fetchedAt: staleTimestamp,
        data: {
          security: {
            metrics: [dattoOnlyMetric]
          }
        }
      }
    };

    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/snapshot.valid.json",
      sources,
      generatedAt: staleTimestamp
    });

    expect(snapshot.security.metrics).toEqual([dattoOnlyMetric]);
  });

  it("retains security metrics from multiple sources instead of overwriting", async () => {
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: {
        status: "current",
        fetchedAt: staleTimestamp,
        data: {
          security: {
            metrics: [
              { id: "vuln-critical", label: "Critical Vulnerabilities", value: 12, context: "" }
            ]
          }
        }
      },
      dattoRmm: {
        status: "current",
        fetchedAt: staleTimestamp,
        data: {
          security: {
            metrics: [
              { id: "devices-fully-patched", label: "Devices Fully Patched", value: 1200, context: "" }
            ]
          }
        }
      }
    };

    const snapshot = await buildSnapshot({
      sources,
      generatedAt: staleTimestamp
    });

    const metricIds = snapshot.security.metrics.map((metric) => metric.id);
    expect(metricIds).toContain("vuln-critical");
    expect(metricIds).toContain("devices-fully-patched");
  });

  it("preserves freshness from aliased previous source names when stale", async () => {
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: { status: "stale", fetchedAt: staleTimestamp },
      dattoRmm: { status: "stale", fetchedAt: staleTimestamp }
    };

    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/snapshot.valid.json",
      sources
    });

    const haloStatus = snapshot.sources.find((source) => source.name === "HaloPSA");
    expect(haloStatus?.lastSuccessfulRefresh).toBe("2026-03-24T12:20:00Z");
  });
});
