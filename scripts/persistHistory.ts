import { mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";

type PersistHistoryOptions = {
  directory: string;
  keep: number;
};

type PersistHistoryResult = {
  directory: string;
  retained: number;
  removed: number;
};

export async function persistHistory(options: PersistHistoryOptions): Promise<PersistHistoryResult> {
  const { directory, keep } = options;
  await mkdir(directory, { recursive: true });

  const entries = await readdir(directory);
  const filesWithMeta = await Promise.all(
    entries.map(async (filename) => {
      const filePath = path.join(directory, filename);
      const meta = await stat(filePath);
      return { filename, filePath, mtime: meta.mtimeMs };
    })
  );

  // Retain newest by snapshot/date encoded in filename (e.g., YYYY-MM-DD.json).
  // When names tie, fall back to mtime to avoid nondeterminism.
  const sorted = filesWithMeta.sort((a, b) => {
    const nameOrder = b.filename.localeCompare(a.filename);
    if (nameOrder !== 0) return nameOrder;
    return b.mtime - a.mtime;
  });

  const toDelete = sorted.slice(keep);
  await Promise.all(toDelete.map(async (file) => rm(file.filePath)));

  return {
    directory,
    retained: sorted.length - toDelete.length,
    removed: toDelete.length
  };
}
