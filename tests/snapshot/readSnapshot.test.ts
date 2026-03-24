import { describe, expect, it } from "vitest";
import { readSnapshot } from "../../src/lib/snapshot/readSnapshot";

describe("readSnapshot", () => {
  it("returns the normalized snapshot from the latest data file", async () => {
    const parsed = await readSnapshot();

    expect(parsed.summary.title).toBe("Trust, measured daily");
    expect(parsed.overall.lastUpdated).toBeTruthy();
  });
});
