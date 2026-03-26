import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import task7Snapshot from "../fixtures/snapshot.task7.json" assert { type: "json" };
import { applyHistoricalTrends, readHistorySnapshots } from "../../scripts/buildHistoricalTrends";
import type { Snapshot } from "../../src/lib/snapshot/types";

function cloneSnapshot(overrides: Partial<Snapshot>): Snapshot {
  const snapshot = structuredClone(task7Snapshot) as Snapshot;
  return {
    ...snapshot,
    ...overrides,
    overall: {
      ...snapshot.overall,
      ...(overrides.overall ?? {})
    },
    service: {
      ...snapshot.service,
      ...(overrides.service ?? {})
    },
    security: {
      ...snapshot.security,
      ...(overrides.security ?? {})
    }
  };
}

describe("applyHistoricalTrends", () => {
  it("builds service and security trends from retained daily snapshots", () => {
    const history = [
      cloneSnapshot({
        generatedAt: "2026-03-25T08:00:00.000Z",
        overall: { lastUpdated: "2026-03-25T08:00:00.000Z" },
        service: {
          ...task7Snapshot.service,
          current: {
            ...task7Snapshot.service.current,
            slaAttainment: { label: "SLA attainment", value: "97.1%", context: "Rolling 30 days" },
            ticketVolume: { label: "Tickets opened", value: "101", context: "Yesterday" },
            resolvedTickets: { label: "Tickets resolved", value: "98", context: "Yesterday" }
          }
        },
        security: {
          ...task7Snapshot.security,
          current: {
            ...task7Snapshot.security.current,
            openCriticalVulnerabilities: {
              label: "Open Critical Vulnerabilities",
              value: "14",
              context: "Current open critical findings"
            }
          },
          metrics: task7Snapshot.security.metrics.map((metric) =>
            metric.id === "vulnerability-high" ? { ...metric, value: 25 } : metric
          )
        }
      })
    ];

    const current = cloneSnapshot({
      generatedAt: "2026-03-26T08:00:00.000Z",
      overall: { lastUpdated: "2026-03-26T08:00:00.000Z" },
      service: {
        ...task7Snapshot.service,
        current: {
          ...task7Snapshot.service.current,
          slaAttainment: { label: "SLA attainment", value: "98.4%", context: "Rolling 30 days" },
          ticketVolume: { label: "Tickets opened", value: "111", context: "Yesterday" },
          resolvedTickets: { label: "Tickets resolved", value: "109", context: "Yesterday" }
        }
      },
      security: {
        ...task7Snapshot.security,
        current: {
          ...task7Snapshot.security.current,
          openCriticalVulnerabilities: {
            label: "Open Critical Vulnerabilities",
            value: "12",
            context: "Current open critical findings"
          }
        },
        metrics: task7Snapshot.security.metrics.map((metric) =>
          metric.id === "vulnerability-high" ? { ...metric, value: 21 } : metric
        )
      }
    });

    const snapshot = applyHistoricalTrends({
      historySnapshots: history,
      currentSnapshot: current,
      keep: 30
    });

    expect(snapshot.service.trends.slaAttainment).toEqual([
      { date: "2026-03-25", value: 97.1 },
      { date: "2026-03-26", value: 98.4 }
    ]);
    expect(snapshot.service.trends.ticketsOpened).toEqual([
      { date: "2026-03-24", value: 101 },
      { date: "2026-03-25", value: 111 }
    ]);
    expect(snapshot.service.trends.ticketsResolved).toEqual([
      { date: "2026-03-24", value: 98 },
      { date: "2026-03-25", value: 109 }
    ]);
    expect(snapshot.security.trends.openCriticalVulnerabilities).toEqual([
      { date: "2026-03-25", value: 14 },
      { date: "2026-03-26", value: 12 }
    ]);
    expect(snapshot.security.trends.openHighVulnerabilities).toEqual([
      { date: "2026-03-25", value: 25 },
      { date: "2026-03-26", value: 21 }
    ]);
  });

  it("returns an empty history set when the history directory does not exist yet", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "msp-stats-history-"));
    const missingDir = path.join(tempDir, "history");

    try {
      await expect(readHistorySnapshots(missingDir)).resolves.toEqual([]);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
