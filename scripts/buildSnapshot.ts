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
  try {
    const raw = await readFile(resolved, "utf-8");
    return JSON.parse(raw) as Snapshot;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

function buildSourceStatus(options: {
  name: string;
  source?: SourceResult<Partial<Snapshot>>;
  previous?: Snapshot;
  hasPrevious: boolean;
}): Snapshot["sources"][number] {
  const { name, source, previous, hasPrevious } = options;
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
        previousStatus?.lastSuccessfulRefresh ??
        (hasPrevious ? previousLastUpdated : undefined) ??
        source.fetchedAt ??
        new Date(0).toISOString(),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep<T>(previous: T, patch?: Partial<T>): T {
  if (patch === undefined) return previous;
  if (!isRecord(previous) || !isRecord(patch)) {
    return (patch as T) ?? previous;
  }

  const result: Record<string, unknown> = { ...previous };
  const keys = new Set([...Object.keys(previous), ...Object.keys(patch)]);

  for (const key of keys) {
    const prevValue = (previous as Record<string, unknown>)[key];
    const patchValue = (patch as Record<string, unknown>)[key];

    if (Array.isArray(patchValue)) {
      if (Array.isArray(prevValue)) {
        const prevArray = prevValue as Array<unknown>;
        const patchArray = patchValue as Array<unknown>;

        const arraysContainObjectsWithId =
          prevArray.every((item) => isRecord(item) && "id" in item) &&
          patchArray.every((item) => isRecord(item) && "id" in item);

        if (arraysContainObjectsWithId) {
          const mergedById = new Map<string, unknown>();
          for (const item of prevArray as Array<Record<string, unknown>>) {
            mergedById.set(String(item.id), item);
          }
          for (const item of patchArray as Array<Record<string, unknown>>) {
            mergedById.set(String(item.id), item);
          }
          result[key] = Array.from(mergedById.values());
        } else {
          result[key] = patchArray;
        }
      } else {
        result[key] = patchValue;
      }
      continue;
    }

    if (patchValue === undefined) {
      result[key] = prevValue;
      continue;
    }

    if (isRecord(prevValue) && isRecord(patchValue)) {
      result[key] = mergeDeep(prevValue, patchValue);
    } else {
      result[key] = patchValue;
    }
  }

  return result as T;
}

export async function buildSnapshot(options: BuildSnapshotOptions): Promise<Snapshot> {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const seed: Snapshot = {
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
  };

  const loadedPrevious = await readPreviousSnapshot(options.previousSnapshotPath);
  const previous = loadedPrevious ?? seed;
  const hasPrevious = Boolean(loadedPrevious);
  const { halopsa, qualys, dattoRmm } = options.sources;

  let merged = { ...previous } as Snapshot;
  const orderedSources: Array<SourceResult<Partial<Snapshot>> | undefined> = [
    halopsa,
    qualys,
    dattoRmm
  ];

  for (const source of orderedSources) {
    if (source?.status === "current" && source.data) {
      merged = mergeDeep(merged, source.data);
    }
  }

  merged.generatedAt = generatedAt;
  merged.overall = { ...(merged.overall ?? {}), lastUpdated: generatedAt };

  merged.sources = [
    buildSourceStatus({ name: "HaloPSA", source: halopsa, previous, hasPrevious }),
    buildSourceStatus({ name: "Qualys", source: qualys, previous, hasPrevious }),
    buildSourceStatus({ name: "Datto RMM", source: dattoRmm, previous, hasPrevious })
  ];

  return merged;
}
