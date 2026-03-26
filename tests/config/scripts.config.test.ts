import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const configModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), "scripts/config.ts")
).href;
let importNonce = 0;

async function loadConfigModule() {
  importNonce += 1;
  return await import(`${configModuleUrl}?t=${importNonce}`);
}

describe("scripts config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to defaults when no local .env file exists", async () => {
    const originalCwd = process.cwd();
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "msp-stats-config-"));

    try {
      process.chdir(tempDir);
      const module = await loadConfigModule();

      expect(module.env.HALOPSA_BASE_URL).toBe("");
      expect(module.env.HALOPSA_REPORT_OPEN_CLOSED_TODAY_ID).toBe("304");
      expect(module.env.HALOPSA_REPORT_RESPONSE_TIME_ID).toBe("352");
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
