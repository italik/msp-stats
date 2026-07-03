import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const workflowPath = ".github/workflows/daily-publish.yml";

describe("daily publish workflow", () => {
  it("publishes the built site to the gh-pages branch instead of the Pages artifact deploy API", async () => {
    const workflow = await readFile(workflowPath, "utf-8");

    expect(workflow).toContain("id: snapshot_commit");
    expect(workflow).toContain(
      "git add data/snapshots/latest.json data/snapshots/history"
    );
    expect(workflow).toContain("id: branch_deploy");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("git worktree add -B gh-pages");
    expect(workflow).toContain("switch --orphan gh-pages");
    expect(workflow).toContain("cp -a dist/. ../msp-stats-gh-pages/");
    expect(workflow).toContain("touch ../msp-stats-gh-pages/.nojekyll");
    expect(workflow).toContain("git -C ../msp-stats-gh-pages push origin gh-pages");
    expect(workflow).toContain("id: request_pages_build");
    expect(workflow).toContain("gh api --method POST repos/${GITHUB_REPOSITORY}/pages/builds");
    expect(workflow).not.toContain("actions/deploy-pages");
    expect(workflow).not.toContain("actions/upload-pages-artifact");

    const commitIndex = workflow.indexOf("id: snapshot_commit");
    const branchDeployIndex = workflow.indexOf("id: branch_deploy");
    const buildRequestIndex = workflow.indexOf("id: request_pages_build");

    expect(commitIndex).toBeGreaterThan(-1);
    expect(branchDeployIndex).toBeGreaterThan(commitIndex);
    expect(buildRequestIndex).toBeGreaterThan(branchDeployIndex);
  });
});
