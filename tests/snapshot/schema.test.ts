import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { snapshotSchema } from "../../src/lib/snapshot/schema";

const fixturePath = new URL("../fixtures/snapshot.valid.json", import.meta.url);

async function loadParsedSnapshot() {
  const raw = await readFile(fixturePath, "utf-8");
  return snapshotSchema.parse(JSON.parse(raw));
}

describe("snapshot schema", () => {
  it("parses the fixture and exposes the required kpis", async () => {
    const parsed = await loadParsedSnapshot();

    expect(parsed.summary.kpis.length).toBe(8);
    expect(parsed.summary.kpis.map((kpi) => kpi.id)).toContain("managed-endpoints");
    expect(parsed.summary.kpis.map((kpi) => kpi.id)).toContain("critical-vulnerability-trend");
    expect(parsed.summary.kpis.map((kpi) => kpi.id)).toContain("open-critical-vulnerabilities");
    expect(parsed.overall.lastUpdated).toMatch(/T/);

    expect(parsed.service.current.slaAttainment.value).toBeDefined();
    expect(parsed.service.current.resolvedTickets.value).toBeDefined();
    expect(parsed.security.current.patchCompliance.value).toBeDefined();
    expect(parsed.security.current.devicesFullyPatched.value).toBeDefined();
  });
});
