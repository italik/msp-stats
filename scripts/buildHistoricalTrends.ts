import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { snapshotSchema } from "../src/lib/snapshot/schema";
import type { Snapshot } from "../src/lib/snapshot/types";

type ApplyHistoricalTrendsOptions = {
  historySnapshots: Snapshot[];
  currentSnapshot: Snapshot;
  keep?: number;
};

function asTrendNumber(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[% ,]/g, "");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shiftSnapshotDate(snapshot: Snapshot, days = 0): string {
  const date = new Date(snapshot.generatedAt);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function buildTrend(
  snapshots: Snapshot[],
  extractor: (snapshot: Snapshot) => number | null,
  dateForSnapshot: (snapshot: Snapshot) => string,
  keep: number
) {
  const pointsByDate = new Map<string, { date: string; value: number }>();

  for (const snapshot of snapshots) {
    const value = extractor(snapshot);
    if (value === null) {
      continue;
    }

    const date = dateForSnapshot(snapshot);
    pointsByDate.set(date, { date, value });
  }

  return Array.from(pointsByDate.values()).slice(-keep);
}

export function applyHistoricalTrends(options: ApplyHistoricalTrendsOptions): Snapshot {
  const { historySnapshots, currentSnapshot, keep = 30 } = options;
  const snapshots = [...historySnapshots, currentSnapshot].sort((a, b) =>
    a.generatedAt.localeCompare(b.generatedAt)
  );

  return {
    ...currentSnapshot,
    service: {
      ...currentSnapshot.service,
      trends: {
        slaAttainment: buildTrend(
          snapshots,
          (snapshot) => asTrendNumber(snapshot.service.current.slaAttainment?.value),
          (snapshot) => shiftSnapshotDate(snapshot),
          keep
        ),
        ticketsOpened: buildTrend(
          snapshots,
          (snapshot) => asTrendNumber(snapshot.service.current.ticketVolume?.value),
          (snapshot) => shiftSnapshotDate(snapshot, -1),
          keep
        ),
        ticketsResolved: buildTrend(
          snapshots,
          (snapshot) => asTrendNumber(snapshot.service.current.resolvedTickets?.value),
          (snapshot) => shiftSnapshotDate(snapshot, -1),
          keep
        )
      }
    },
    security: {
      ...currentSnapshot.security,
      trends: {
        openCriticalVulnerabilities: buildTrend(
          snapshots,
          (snapshot) => asTrendNumber(snapshot.security.current.openCriticalVulnerabilities?.value),
          (snapshot) => shiftSnapshotDate(snapshot),
          keep
        ),
        openHighVulnerabilities: buildTrend(
          snapshots,
          (snapshot) =>
            asTrendNumber(
              snapshot.security.metrics.find((metric) => metric.id === "vulnerability-high")?.value
            ),
          (snapshot) => shiftSnapshotDate(snapshot),
          keep
        )
      }
    }
  };
}

export async function readHistorySnapshots(historyDir: string): Promise<Snapshot[]> {
  let entries;
  try {
    entries = await readdir(historyDir, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  const filenames = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  const snapshots = await Promise.all(
    filenames.map(async (filename) => {
      const raw = await readFile(path.join(historyDir, filename), "utf-8");
      return snapshotSchema.parse(JSON.parse(raw));
    })
  );

  return snapshots.sort((a, b) => a.generatedAt.localeCompare(b.generatedAt));
}
