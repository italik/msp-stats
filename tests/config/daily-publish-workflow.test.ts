import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const workflowPath = ".github/workflows/daily-publish.yml";

describe("daily publish workflow", () => {
  it("deploys from a freshly committed snapshot instead of reusing the previous Pages build version", async () => {
    const workflow = await readFile(workflowPath, "utf-8");

    expect(workflow).toContain("deploy_only:");
    expect(workflow).toContain("actions: write");
    expect(workflow).toContain("id: snapshot_commit");
    expect(workflow).toContain(
      "git add data/snapshots/latest.json data/snapshots/history"
    );
    expect(workflow).toContain(
      "gh workflow run daily-publish.yml --ref main -f deploy_only=true"
    );
    expect(workflow).toContain("if: env.DEPLOY_ONLY == 'true'");
    expect(workflow).toContain("if: env.DEPLOY_ONLY != 'true'");

    const commitIndex = workflow.indexOf("id: snapshot_commit");
    const dispatchIndex = workflow.indexOf(
      "gh workflow run daily-publish.yml --ref main -f deploy_only=true"
    );
    const uploadIndex = workflow.indexOf("actions/upload-pages-artifact@v4");
    const deployIndex = workflow.indexOf("actions/deploy-pages@v5");

    expect(commitIndex).toBeGreaterThan(-1);
    expect(dispatchIndex).toBeGreaterThan(commitIndex);
    expect(uploadIndex).toBeGreaterThan(dispatchIndex);
    expect(deployIndex).toBeGreaterThan(uploadIndex);
  });
});
