import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Snapshot } from "../src/lib/snapshot/types";

type WriteLatestSnapshotOptions = {
  path: string;
  snapshot: Snapshot;
};

type WriteLatestSnapshotResult = {
  path: string;
};

export async function writeLatestSnapshot(
  options: WriteLatestSnapshotOptions
): Promise<WriteLatestSnapshotResult> {
  const resolvedPath = path.resolve(options.path);
  const directory = path.dirname(resolvedPath);

  await mkdir(directory, { recursive: true });
  await writeFile(resolvedPath, JSON.stringify(options.snapshot, null, 2), "utf-8");

  return { path: options.path };
}
