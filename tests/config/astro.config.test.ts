import { afterEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const configModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), "astro.config.mjs")
).href;
let importNonce = 0;

async function loadConfig() {
  importNonce += 1;
  return (await import(`${configModuleUrl}?t=${importNonce}`)).default;
}

describe("astro config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the repository base path on GitHub Pages deployments", async () => {
    vi.stubEnv("GITHUB_ACTIONS", "true");
    vi.stubEnv("GITHUB_REPOSITORY", "italik/msp-stats");

    const config = await loadConfig();

    expect(config.base).toBe("/msp-stats");
  });

  it("allows explicit base overrides for a custom domain launch", async () => {
    vi.stubEnv("GITHUB_ACTIONS", "true");
    vi.stubEnv("GITHUB_REPOSITORY", "italik/msp-stats");
    vi.stubEnv("PUBLIC_SITE_BASE", "/");

    const config = await loadConfig();

    expect(config.base).toBe("/");
  });
});
