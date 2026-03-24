import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { readSnapshot } from "../../src/lib/snapshot/readSnapshot";

const fixturePath = fileURLToPath(new URL("../fixtures/snapshot.valid.json", import.meta.url));

describe("readSnapshot", () => {
  it("returns the normalized snapshot when given a fixture path", async () => {
    const parsed = await readSnapshot(fixturePath);

    expect(parsed.summary.title).toBe("Trust, measured daily");
    expect(parsed.overall.lastUpdated).toBeTruthy();
  });
});
