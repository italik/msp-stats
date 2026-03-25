import { describe, expect, it } from "vitest";
import { buildSnapshot } from "../../scripts/buildSnapshot";
import type { Snapshot } from "../../src/lib/snapshot/types";
import type { SourceResult } from "../../scripts/sources/types";

type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

type BuildSnapshotOptions = Parameters<typeof buildSnapshot>[0];

type BuildSources = {
  halopsa: SourceResult<DeepPartial<Snapshot>>;
  qualys: SourceResult<DeepPartial<Snapshot>>;
  dattoRmm: SourceResult<DeepPartial<Snapshot>>;
};

const toBuildSnapshotSources = (sources: BuildSources): BuildSnapshotOptions["sources"] =>
  sources as unknown as BuildSnapshotOptions["sources"];

describe("buildSnapshot", () => {
  const staleTimestamp = "2026-03-24T12:20:00.000Z";
  const dattoOnlyMetric = {
    id: "devices-fully-patched",
    label: "Devices Fully Patched",
    value: 1200,
    context: ""
  };
  const qualysSummaryKpis = [
    {
      id: "critical-vulnerability-trend",
      label: "Critical Vulnerability Trend",
      value: "-1",
      context: "Delta vs previous period",
      direction: "down" as const
    },
    {
      id: "open-critical-vulnerabilities",
      label: "Open Critical Vulnerabilities",
      value: "10",
      context: "Current open critical findings"
    }
  ];

  it("carries forward stale source values instead of zeroing them", async () => {
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: { status: "current", fetchedAt: staleTimestamp, data: {} },
      dattoRmm: { status: "current", fetchedAt: staleTimestamp, data: {} }
    };

    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/snapshot.valid.json",
      sources: toBuildSnapshotSources(sources)
    });

    const carriedForward = snapshot.service.current.slaAttainment.value;
    expect(carriedForward).toBe("99.8%");
    expect(snapshot.sources.find((source) => source.name === "HaloPSA")?.status).toBe("stale");
    expect(snapshot.sources.find((source) => source.name === "HaloPSA")?.note).toContain(
      "Previous known-good values carried forward"
    );
  });

  it("does not throw when previous snapshot file is missing", async () => {
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: { status: "stale", fetchedAt: staleTimestamp },
      dattoRmm: { status: "stale", fetchedAt: staleTimestamp }
    };

    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/does-not-exist.json",
      sources: toBuildSnapshotSources(sources)
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
      sources: toBuildSnapshotSources(sources)
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
      sources: toBuildSnapshotSources(sources),
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
      sources: toBuildSnapshotSources(sources),
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
      sources: toBuildSnapshotSources(sources)
    });

    const haloStatus = snapshot.sources.find((source) => source.name === "HaloPSA");
    expect(haloStatus?.lastSuccessfulRefresh).toBe("2026-03-24T12:20:00Z");
  });

  it("resolves previous snapshot relative to the repo root, not the caller CWD", async () => {
    const originalCwd = process.cwd();
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: { status: "stale", fetchedAt: staleTimestamp },
      dattoRmm: { status: "stale", fetchedAt: staleTimestamp }
    };

    try {
      process.chdir("/");
      const snapshot = await buildSnapshot({
        previousSnapshotPath: "tests/fixtures/snapshot.valid.json",
        sources: toBuildSnapshotSources(sources),
        generatedAt: staleTimestamp
      });

      expect(snapshot.service.current.slaAttainment.value).toBe("99.8%");
    } finally {
      process.chdir(originalCwd);
    }
  });

  it("updates Qualys summary KPIs while preserving unrelated summary items", async () => {
    const sources: BuildSources = {
      halopsa: { status: "stale", fetchedAt: staleTimestamp },
      qualys: {
        status: "current",
        fetchedAt: staleTimestamp,
        data: {
          summary: { kpis: qualysSummaryKpis },
          security: {
            current: {
              openCriticalVulnerabilities: {
                label: "Open Critical Vulnerabilities",
                value: qualysSummaryKpis[1].value,
                context: qualysSummaryKpis[1].context
              },
              criticalVulnerabilityTrend: {
                label: "Critical Vulnerability Trend",
                value: qualysSummaryKpis[0].value,
                context: qualysSummaryKpis[0].context
              }
            }
          }
        }
      },
      dattoRmm: { status: "stale", fetchedAt: staleTimestamp }
    };

    const snapshot = await buildSnapshot({
      previousSnapshotPath: "tests/fixtures/snapshot.valid.json",
      sources: toBuildSnapshotSources(sources),
      generatedAt: staleTimestamp
    });

    const kpis = snapshot.summary.kpis;
    const trend = kpis.find((kpi) => kpi.id === "critical-vulnerability-trend");
    const openCrit = kpis.find((kpi) => kpi.id === "open-critical-vulnerabilities");
    const trustIndex = kpis.find((kpi) => kpi.id === "trust-index");

    expect(trend?.value).toBe("-1");
    expect(trend?.direction).toBe("down");
    expect(openCrit?.value).toBe("10");
    expect(trustIndex?.value).toBe("92%");
  });
});
