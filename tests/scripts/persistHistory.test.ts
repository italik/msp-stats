import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { persistHistory } from "../../scripts/persistHistory";

const historyDir = "tests/tmp/history";

describe("persistHistory", () => {
  beforeEach(async () => {
    await rm(historyDir, { recursive: true, force: true });
    await mkdir(historyDir, { recursive: true });
  });

  it("keeps the newest 30 daily snapshots", async () => {
    const dates = Array.from({ length: 35 }, (_, index) => index + 1);

    for (const day of dates) {
      const filename = `2026-03-${String(day).padStart(2, "0")}.json`;
      const filePath = path.join(historyDir, filename);
      await writeFile(filePath, JSON.stringify({ id: day }));
    }

    const result = await persistHistory({ directory: historyDir, keep: 30 });
    const files = await readdir(historyDir);

    expect(result.retained).toBeLessThanOrEqual(30);
    expect(files.length).toBeLessThanOrEqual(30);
    expect(files).not.toContain("2026-03-01.json");
  });
});
