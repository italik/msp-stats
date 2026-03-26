import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./buildSnapshot";
import { applyHistoricalTrends, readHistorySnapshots } from "./buildHistoricalTrends";
import { fetchAllSources } from "./fetchAllSources";
import { persistHistory } from "./persistHistory";
import { writeLatestSnapshot } from "./writeLatestSnapshot";

async function run(): Promise<void> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(__dirname, "..");
  const resolveRepoPath = (...segments: string[]) => path.resolve(repoRoot, ...segments);

  const latestPath = resolveRepoPath("data/snapshots/latest.json");
  const historyDir = resolveRepoPath("data/snapshots/history");

  const sources = await fetchAllSources();
  const snapshot = await buildSnapshot({
    previousSnapshotPath: latestPath,
    sources
  });
  const historySnapshots = await readHistorySnapshots(historyDir);
  const snapshotWithTrends = applyHistoricalTrends({
    historySnapshots,
    currentSnapshot: snapshot,
    keep: 30
  });

  await writeLatestSnapshot({ path: latestPath, snapshot: snapshotWithTrends });

  const historyName = `${snapshotWithTrends.generatedAt.slice(0, 10)}.json`;
  await persistHistory({
    directory: historyDir,
    keep: 30,
    file: { name: historyName, contents: JSON.stringify(snapshotWithTrends, null, 2) }
  });
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
