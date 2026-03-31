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
const snapshotWithTrends = {
  ...partialSnapshot,
  service: {
    ...partialSnapshot.service,
    trends: {
      ...partialSnapshot.service.trends,
      slaAttainment: [
        { date: '2026-03-20', value: 98.2 },
        { date: '2026-03-21', value: 98.4 },
        { date: '2026-03-22', value: 98.5 },
        { date: '2026-03-23', value: 98.3 },
        { date: '2026-03-24', value: 98.6 }
      ],
      ticketsOpened: [
        { date: '2026-03-20', value: 301 },
        { date: '2026-03-21', value: 299 },
        { date: '2026-03-22', value: 300 },
        { date: '2026-03-23', value: 298 },
        { date: '2026-03-24', value: 297 }
      ],
      ticketsResolved: [
        { date: '2026-03-20', value: 13 },
        { date: '2026-03-21', value: 15 },
        { date: '2026-03-22', value: 12 },
        { date: '2026-03-23', value: 17 },
        { date: '2026-03-24', value: 18 }
      ]
    }
  },
  security: {
    ...partialSnapshot.security,
    trends: {
      ...partialSnapshot.security.trends,
      openCriticalVulnerabilities: [
        { date: '2026-03-20', value: 18 },
        { date: '2026-03-21', value: 16 },
        { date: '2026-03-22', value: 15 },
        { date: '2026-03-23', value: 13 },
        { date: '2026-03-24', value: 11 }
      ],
      openHighVulnerabilities: [
        { date: '2026-03-20', value: 42 },
        { date: '2026-03-21', value: 41 },
        { date: '2026-03-22', value: 40 },
        { date: '2026-03-23', value: 39 },
        { date: '2026-03-24', value: 37 }
      ]
    }
  }
};

test('index page renders key dashboard sections', { timeout: 60000 }, async () => {
  const originalSnapshot = await readFile(latestSnapshotPath, 'utf-8');
  await rm(buildDir, { recursive: true, force: true });

  try {
    await writeFile(latestSnapshotPath, JSON.stringify(snapshotWithTrends, null, 2));
    await execFileAsync('npm', ['run', 'build', '--', '--outDir', buildDir], { cwd: repoRoot });
    const html = await readFile(path.join(buildDir, 'index.html'), 'utf-8');
    const firstBuildTooltipIds = [...html.matchAll(/id="(sparkline-[^"]+)"/g)].map((match) => match[1]);
    await rm(buildDir, { recursive: true, force: true });
    await execFileAsync('npm', ['run', 'build', '--', '--outDir', buildDir], { cwd: repoRoot });
    const rebuiltHtml = await readFile(path.join(buildDir, 'index.html'), 'utf-8');
    const normalizedHtml = html.replace(/\s+/g, ' ');
    expect(html).toContain('Trust, measured daily');
    expect(html).toContain('How we measure ourselves');
    expect(html).toContain('Service Performance');
    expect(html).toContain('Tickets opened');
    expect(html).toContain('Tickets resolved');
    expect(html).not.toContain('Tickets handled');
    expect(normalizedHtml).toContain(
      "Tickets opened and tickets resolved show yesterday's service activity. SLA attainment shows the rolling 30-day result captured on each publish day."
    );
    expect(normalizedHtml).toMatch(
      /<p class="sparkline-title"[^>]*>SLA attainment<\/p>[\s\S]*?<dt[^>]*>Latest<\/dt> <dd[^>]*>98.6%<\/dd>[\s\S]*?<dt[^>]*>Change<\/dt> <dd[^>]*>\+0.4 pts<\/dd>[\s\S]*?<dt[^>]*>High<\/dt> <dd[^>]*>98.6%<\/dd>[\s\S]*?<dt[^>]*>Low<\/dt> <dd[^>]*>98.2%<\/dd>/
    );
    expect(normalizedHtml).toMatch(
      /<p class="sparkline-title"[^>]*>Tickets opened<\/p>[\s\S]*?<dt[^>]*>Latest<\/dt> <dd[^>]*>297<\/dd>[\s\S]*?<dt[^>]*>Change<\/dt> <dd[^>]*>-4<\/dd>[\s\S]*?<dt[^>]*>High<\/dt> <dd[^>]*>301<\/dd>[\s\S]*?<dt[^>]*>Low<\/dt> <dd[^>]*>297<\/dd>/
    );
    expect(normalizedHtml).toMatch(
      /<p class="sparkline-title"[^>]*>Tickets resolved<\/p>[\s\S]*?<dt[^>]*>Latest<\/dt> <dd[^>]*>18<\/dd>[\s\S]*?<dt[^>]*>Change<\/dt> <dd[^>]*>\+5<\/dd>[\s\S]*?<dt[^>]*>High<\/dt> <dd[^>]*>18<\/dd>[\s\S]*?<dt[^>]*>Low<\/dt> <dd[^>]*>12<\/dd>/
    );
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
    expect(html).toContain('Up to 30 published days');
    expect(html).toContain('Latest');
    expect(html).toContain('Change');
    expect(html).toContain('High');
    expect(html).toContain('Low');
    expect(html).toContain('data-trend-point-date');
    expect(html).toContain('data-trend-point-value');
    expect(html).not.toMatch(/<button[^>]*class="sparkline-marker"/);
    expect((html.match(/class="sparkline-inspector"/g) ?? []).length).toBe(3);
    expect((html.match(/>Inspect daily values</g) ?? []).length).toBe(3);
    expect(normalizedHtml).toMatch(
      /<p class="sparkline-title"[^>]*>SLA attainment<\/p>[\s\S]*?class="sparkline-inspector"[\s\S]*?Inspect daily values[\s\S]*?20 Mar 2026[\s\S]*?98.2%/
    );
    const tooltipIds = firstBuildTooltipIds;
    const rebuiltTooltipIds = [...rebuiltHtml.matchAll(/id="(sparkline-[^"]+)"/g)].map((match) => match[1]);
    expect(tooltipIds.length).toBeGreaterThanOrEqual(10);
    expect(new Set(tooltipIds).size).toBe(tooltipIds.length);
    expect(rebuiltTooltipIds).toEqual(tooltipIds);
    expect(html).toContain('style="--sparkline-x: 100%; --sparkline-y: 0%;"');
    expect(html).toContain('style="--sparkline-x: 0%; --sparkline-y: 100%;"');
    expect(html).toContain('Tickets opened');
    expect(html).toContain('Tickets resolved');
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

test('sparkline requires explicit display mode wiring', async () => {
  const [sparklineSource, serviceSource, securitySource] = await Promise.all([
    readFile(fileURLToPath(new URL('../../src/components/Sparkline.astro', import.meta.url)), 'utf-8'),
    readFile(fileURLToPath(new URL('../../src/components/ServicePerformanceSection.astro', import.meta.url)), 'utf-8'),
    readFile(fileURLToPath(new URL('../../src/components/SecurityPostureSection.astro', import.meta.url)), 'utf-8')
  ]);

  expect(sparklineSource).toContain('displayMode: TrendDisplayMode;');
  expect(sparklineSource).not.toContain('displayMode?: TrendDisplayMode;');
  expect(sparklineSource).not.toContain('displayMode ??');
  expect(sparklineSource).not.toContain('label.toLowerCase().includes("attainment")');
  expect(sparklineSource).not.toContain('randomUUID');
  expect(sparklineSource).toContain('class="sparkline-inspector"');
  expect(sparklineSource).toContain('Inspect daily values');
  expect(sparklineSource).not.toMatch(/<button[\s\S]*class="sparkline-marker"/);

  expect((serviceSource.match(/displayMode="percent"/g) ?? []).length).toBe(1);
  expect((serviceSource.match(/displayMode="count"/g) ?? []).length).toBe(2);
  expect((securitySource.match(/displayMode="count"/g) ?? []).length).toBe(2);
});
