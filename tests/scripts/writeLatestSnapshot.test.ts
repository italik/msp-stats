import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { writeLatestSnapshot } from "../../scripts/writeLatestSnapshot";

const targetPath = "tests/tmp/latest.json";

describe("writeLatestSnapshot", () => {
  beforeEach(async () => {
    await rm(path.dirname(targetPath), { recursive: true, force: true });
    await mkdir(path.dirname(targetPath), { recursive: true });
  });

  it("writes the latest normalized snapshot to disk", async () => {
    const payload = { generatedAt: "2026-03-24T05:15:00.000Z" };

    const result = await writeLatestSnapshot({ path: targetPath, snapshot: payload } as never);
    const written = JSON.parse(await readFile(targetPath, "utf-8"));

    expect(result.path).toBe(targetPath);
    expect(written.generatedAt).toBe(payload.generatedAt);
  });
});
