import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import { writeLatestSnapshot } from "../../scripts/writeLatestSnapshot";

const targetPath = "tests/tmp/latest.json";

describe("writeLatestSnapshot", () => {
  beforeEach(async () => {
    // isolate per-test by recreating only the target directory, leaving sibling fixtures untouched
    const dir = path.dirname(targetPath);
    await rm(targetPath, { force: true });
    await mkdir(dir, { recursive: true });
  });

  it("writes the latest normalized snapshot to disk", async () => {
    const payload = { generatedAt: "2026-03-24T05:15:00.000Z" };

    const result = await writeLatestSnapshot({ path: targetPath, snapshot: payload } as never);
    const written = JSON.parse(await readFile(targetPath, "utf-8"));

    expect(result.path).toBe(targetPath);
    expect(written.generatedAt).toBe(payload.generatedAt);
  });
});
