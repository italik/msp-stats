import { readFile } from 'node:fs/promises';
import { test, expect } from 'vitest';

const pagePath = new URL('../../src/pages/index.astro', import.meta.url);

test('index page exposes dashboard headings', async () => {
  const html = await readFile(pagePath, 'utf-8');
  expect(html).toContain('Italik');
  expect(html).toContain('Service Performance');
  expect(html).toContain('Security Posture');
});
