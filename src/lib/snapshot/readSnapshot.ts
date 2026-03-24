import { readFile } from "node:fs/promises";
import path from "node:path";
import { snapshotSchema } from "./schema";
import type { Snapshot } from "./types";

export async function readSnapshot(snapshotPath = "data/snapshots/latest.json"): Promise<Snapshot> {
  const resolvedPath = path.resolve(snapshotPath);
  const raw = await readFile(resolvedPath, "utf-8");

  return snapshotSchema.parse(JSON.parse(raw));
}
