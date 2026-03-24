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

  const sorted = filesWithMeta.sort((a, b) => b.mtime - a.mtime || b.filename.localeCompare(a.filename));
  const toDelete = sorted.slice(keep);

  await Promise.all(toDelete.map(async (file) => rm(file.filePath)));

  return {
    directory,
    retained: sorted.length - toDelete.length,
    removed: toDelete.length
  };
}
