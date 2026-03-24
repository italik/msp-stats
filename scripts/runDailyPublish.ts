import path from "node:path";
import { buildSnapshot } from "./buildSnapshot";
import { fetchAllSources } from "./fetchAllSources";
import { persistHistory } from "./persistHistory";
import { writeLatestSnapshot } from "./writeLatestSnapshot";

async function run(): Promise<void> {
  const latestPath = path.resolve("data/snapshots/latest.json");
  const historyDir = path.resolve("data/snapshots/history");

  const sources = await fetchAllSources();
  const snapshot = await buildSnapshot({
    previousSnapshotPath: latestPath,
    sources
  });

  await writeLatestSnapshot({ path: latestPath, snapshot });

  const historyName = `${snapshot.generatedAt.slice(0, 10)}.json`;
  await persistHistory({
    directory: historyDir,
    keep: 30,
    file: { name: historyName, contents: JSON.stringify(snapshot, null, 2) }
  });
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
