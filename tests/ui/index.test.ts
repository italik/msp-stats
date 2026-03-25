import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test, expect } from 'vitest';

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const buildDir = fileURLToPath(new URL('./astro-build-output', import.meta.url));

test('index page renders key dashboard sections', async () => {
  await rm(buildDir, { recursive: true, force: true });
  await execFileAsync('npm', ['run', 'build', '--', '--outDir', buildDir], { cwd: repoRoot });
  const html = await readFile(path.join(buildDir, 'index.html'), 'utf-8');
  expect(html).toContain('Trust, measured daily');
  expect(html).toContain('How we measure ourselves');
  expect(html).toContain('Service Performance');
  expect(html).toContain('Security Posture');
  expect(html).toContain('Last updated');
  expect(html).toContain('Service SLA Trend');
  expect(html).toContain('Critical Vulnerabilities');
  expect(html).toContain('High Vulnerabilities');
  expect(html).toContain('Devices Fully Patched');
  expect(html).toContain('Incidents');
  expect(html).toContain('Vulnerabilities');
  expect(html).toContain('30-day trend');
  expect(html).toContain('Years supporting businesses since 1999');
  expect(html).toContain('Data current as of');
  await rm(buildDir, { recursive: true, force: true });
});
