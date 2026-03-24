import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Snapshot } from "../src/lib/snapshot/types";
import type { SourceResult } from "./sources/types";

type BuildSnapshotOptions = {
  previousSnapshotPath?: string;
  generatedAt?: string;
  sources: {
    halopsa: SourceResult<Partial<Snapshot>>;
    qualys: SourceResult<Partial<Snapshot>>;
    dattoRmm: SourceResult<Partial<Snapshot>>;
  };
};

async function readPreviousSnapshot(previousSnapshotPath?: string): Promise<Snapshot | null> {
  if (!previousSnapshotPath) {
    return null;
  }

  const resolved = path.resolve(previousSnapshotPath);
  const raw = await readFile(resolved, "utf-8");
  return JSON.parse(raw) as Snapshot;
}

function buildSourceStatus(options: {
  name: string;
  source?: SourceResult<Partial<Snapshot>>;
  previous?: Snapshot;
}): Snapshot["sources"][number] {
  const { name, source, previous } = options;
  const previousStatus = previous?.sources?.find((entry) => entry.name === name);
  const previousLastUpdated = previous?.overall?.lastUpdated;

  if (!source) {
    return (
      previousStatus ?? {
        name,
        status: "stale",
        lastSuccessfulRefresh: previousLastUpdated ?? new Date(0).toISOString()
      }
    );
  }

  if (source.status === "stale") {
    return {
      name,
      status: "stale",
      lastSuccessfulRefresh:
        previousStatus?.lastSuccessfulRefresh ?? previousLastUpdated ?? source.fetchedAt,
      note: source.note ?? "Previous known-good values carried forward"
    };
  }

  return {
    name,
    status: "current",
    lastSuccessfulRefresh: source.fetchedAt,
    note: source.note
  };
}

function selectSection<K extends keyof Snapshot>(
  key: K,
  previous: Snapshot,
  source?: SourceResult<Partial<Snapshot>>
): Snapshot[K] {
  if (source && source.status === "current" && source.data && key in source.data) {
    return (source.data[key] as Snapshot[K]) ?? previous[key];
  }

  return previous[key];
}

export async function buildSnapshot(options: BuildSnapshotOptions): Promise<Snapshot> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const previous =
    (await readPreviousSnapshot(options.previousSnapshotPath)) ??
    ({
      generatedAt,
      overall: { lastUpdated: generatedAt },
      summary: { title: "", kpis: [] },
      service: {
        current: {
          slaAttainment: { label: "SLA Attainment", value: 0, context: "" },
          resolvedTickets: { label: "Resolved Tickets", value: 0, context: "" }
        },
        metrics: [],
        trends: {}
      },
      security: {
        current: {
          patchCompliance: { label: "Patch Compliance", value: 0, context: "" },
          devicesFullyPatched: { label: "Devices Fully Patched", value: 0, context: "" }
        },
        metrics: [],
        trends: {}
      },
      sources: []
    } as Snapshot);

  const { halopsa, qualys, dattoRmm } = options.sources;

  const snapshot: Snapshot = {
    generatedAt,
    overall: selectSection("overall", previous, dattoRmm ?? qualys ?? halopsa),
    summary: selectSection("summary", previous, dattoRmm ?? qualys ?? halopsa),
    service: selectSection("service", previous, halopsa),
    security: selectSection("security", previous, qualys),
    sources: [
      buildSourceStatus({ name: "HaloPSA", source: halopsa, previous }),
      buildSourceStatus({ name: "Qualys", source: qualys, previous }),
      buildSourceStatus({ name: "Datto RMM", source: dattoRmm, previous })
    ]
  };

  return snapshot;
}
