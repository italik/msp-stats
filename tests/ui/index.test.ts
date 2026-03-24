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
  expect(html).toContain('Italik');
  expect(html).toContain('Service Performance');
  expect(html).toContain('Security Posture');
  await rm(buildDir, { recursive: true, force: true });
});
