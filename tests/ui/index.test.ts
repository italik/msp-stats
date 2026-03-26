import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test, expect } from 'vitest';
import partialSnapshot from '../fixtures/snapshot.partial.json' assert { type: 'json' };

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const buildDir = fileURLToPath(new URL('./astro-build-output', import.meta.url));
const latestSnapshotPath = fileURLToPath(new URL('../../data/snapshots/latest.json', import.meta.url));

test('index page renders key dashboard sections', async () => {
  const originalSnapshot = await readFile(latestSnapshotPath, 'utf-8');
  await rm(buildDir, { recursive: true, force: true });

  try {
    await writeFile(latestSnapshotPath, JSON.stringify(partialSnapshot, null, 2));
    await execFileAsync('npm', ['run', 'build', '--', '--outDir', buildDir], { cwd: repoRoot });
    const html = await readFile(path.join(buildDir, 'index.html'), 'utf-8');
    expect(html).toContain('Trust, measured daily');
    expect(html).toContain('How we measure ourselves');
    expect(html).toContain('Service Performance');
    expect(html).toContain('Tickets opened');
    expect(html).toContain('Tickets resolved');
    expect(html).not.toContain('Tickets handled');
    expect(html).not.toContain('Security Posture');
    expect(html).toContain('Security integrations are in progress');
    expect(html).toContain('Last updated');
    expect(html).toContain('Current');
    expect(html).toContain('Last successful update');
    expect(html).toContain('Status: Current');
    expect(html).toContain('Live source status');
    expect(html).toContain('Data current as of');
    expect(html).not.toContain('HaloPSA reports 304');
    expect(html).toContain('Coming Soon');
    expect(html).toContain('Qualys');
    expect(html).toContain('Datto RMM');
    expect(html).toContain('Vulnerability posture, including open critical and high findings');
    expect(html).toContain('Patch compliance, devices fully patched, devices missing critical patches');
    expect(html).toContain('how consistently');
    expect(html).toContain('we keep customer estates up to date');
    expect(html).not.toContain('Open Critical Vulnerabilities');
    expect(html).not.toContain('Critical Vulnerability Trend');
    expect(html).not.toContain('Trust Index');
    expect(html).toContain('Years supporting businesses since 1999');
  } finally {
    await writeFile(latestSnapshotPath, originalSnapshot);
    await rm(buildDir, { recursive: true, force: true });
  }
});
