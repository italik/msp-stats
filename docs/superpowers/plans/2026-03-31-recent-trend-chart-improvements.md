# Recent Trend Chart Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public service trend cards explain themselves by adding visible summaries, hoverable exact point details, and clearer reporting-window context without changing the page structure or storage model.

**Architecture:** Keep `scripts/buildHistoricalTrends.ts` as the source of truth for daily trend points and enrich the Astro presentation layer. Extend `Sparkline.astro` into a lightweight interactive card that formats counts and percentages correctly, exposes tooltip-capable point metadata, and renders a summary strip. Update the service section copy and UI test coverage to match the new chart semantics.

**Tech Stack:** Astro, TypeScript, Vitest, existing snapshot JSON fixtures

---

## File Structure

- Modify: `src/components/Sparkline.astro`
  - Expand from a simple SVG line into a richer trend card with summary stats, markers, and hover detail.
- Modify: `src/components/ServicePerformanceSection.astro`
  - Pass formatter hints into each sparkline and update the methodology note.
- Modify: `src/lib/snapshot/formatters.ts`
  - Add reusable helpers for trend-stat calculation and value/date formatting.
- Modify: `tests/ui/index.test.ts`
  - Assert the new visible context and tooltip-capable DOM output.
- Create: `tests/lib/snapshot/formatters.test.ts`
  - Lock down summary-stat and formatting behavior independently from Astro rendering.

### Task 1: Add reusable trend formatting and summary helpers

**Files:**
- Modify: `src/lib/snapshot/formatters.ts`
- Create: `tests/lib/snapshot/formatters.test.ts`

- [ ] **Step 1: Write the failing formatter tests**

```ts
import { describe, expect, it } from "vitest";
import {
  formatTrendValue,
  formatTrendDelta,
  summarizeTrendPoints
} from "../../../src/lib/snapshot/formatters";

describe("summarizeTrendPoints", () => {
  it("calculates latest, delta, high, and low for count metrics", () => {
    const summary = summarizeTrendPoints([
      { date: "2026-03-24", value: 301 },
      { date: "2026-03-25", value: 297 },
      { date: "2026-03-26", value: 305 }
    ]);

    expect(summary).toEqual({
      latest: 305,
      delta: 4,
      high: 305,
      low: 297
    });
  });

  it("treats a single point as a zero delta", () => {
    const summary = summarizeTrendPoints([{ date: "2026-03-26", value: 98.6 }]);
    expect(summary?.delta).toBe(0);
  });
});

describe("trend formatters", () => {
  it("formats percentage values and percentage-point deltas", () => {
    expect(formatTrendValue(98.6, "percent")).toBe("98.6%");
    expect(formatTrendDelta(1.4, "percent")).toBe("+1.4 pts");
  });

  it("formats count values and signed count deltas", () => {
    expect(formatTrendValue(297, "count")).toBe("297");
    expect(formatTrendDelta(-4, "count")).toBe("-4");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec vitest run tests/lib/snapshot/formatters.test.ts`
Expected: FAIL with missing exports from `src/lib/snapshot/formatters.ts`

- [ ] **Step 3: Write minimal formatter implementation**

```ts
export type TrendDisplayMode = "count" | "percent";

export type TrendPoint = {
  date: string;
  value: number;
};

export type TrendSummary = {
  latest: number;
  delta: number;
  high: number;
  low: number;
};

export function summarizeTrendPoints(points: TrendPoint[]): TrendSummary | null {
  if (!points.length) {
    return null;
  }

  const values = points.map((point) => point.value);
  const latest = points[points.length - 1]?.value ?? values[values.length - 1] ?? 0;
  const first = points[0]?.value ?? latest;

  return {
    latest,
    delta: latest - first,
    high: Math.max(...values),
    low: Math.min(...values)
  };
}

export function formatTrendValue(value: number, mode: TrendDisplayMode): string {
  if (mode === "percent") {
    return `${value.toFixed(1)}%`;
  }

  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0
  }).format(value);
}

export function formatTrendDelta(value: number, mode: TrendDisplayMode): string {
  const sign = value > 0 ? "+" : "";

  if (mode === "percent") {
    return `${sign}${value.toFixed(1)} pts`;
  }

  return `${sign}${formatTrendValue(value, "count")}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm exec vitest run tests/lib/snapshot/formatters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/lib/snapshot/formatters.test.ts src/lib/snapshot/formatters.ts
git commit -m "feat: add trend summary formatters"
```

### Task 2: Upgrade the sparkline card with summaries, markers, and hover details

**Files:**
- Modify: `src/components/Sparkline.astro`

- [ ] **Step 1: Write the failing card-level expectations in the existing UI test**

Add these assertions to `tests/ui/index.test.ts`:

```ts
expect(html).toContain("Up to 30 published days");
expect(html).toContain("Latest");
expect(html).toContain("Change");
expect(html).toContain("High");
expect(html).toContain("Low");
expect(html).toContain("data-trend-point-date=");
expect(html).toContain("data-trend-point-value=");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec vitest run tests/ui/index.test.ts`
Expected: FAIL because the current sparkline markup does not render the summary strip or point metadata

- [ ] **Step 3: Replace the simple sparkline card with a richer component**

Update `src/components/Sparkline.astro` so it accepts a display mode and renders summaries plus hover-capable markers:

```astro
---
import {
  formatAsOf,
  formatTrendDelta,
  formatTrendValue,
  summarizeTrendPoints,
  type TrendDisplayMode
} from "../lib/snapshot/formatters";

interface TrendPoint {
  date: string;
  value: number;
}

interface Props {
  label: string;
  points: TrendPoint[];
  mode?: TrendDisplayMode;
  eyebrow?: string;
}

const { label, points, mode = "count", eyebrow = "Up to 30 published days" } = Astro.props as Props;
const summary = summarizeTrendPoints(points);
const hasPoints = points.length > 0;
```

Render the chart body with point markers and point metadata:

```astro
<svg class="sparkline-chart" viewBox="0 0 100 40" role="img" aria-label={`${label} trend`}>
  <polyline points={polylinePoints} />
  {points.map((point, idx) => (
    <circle
      cx={xForPoint(idx)}
      cy={yForPoint(point.value)}
      r="1.8"
      data-trend-point-date={point.date}
      data-trend-point-value={formatTrendValue(point.value, mode)}
    />
  ))}
</svg>

{summary ? (
  <dl class="sparkline-summary">
    <div><dt>Latest</dt><dd>{formatTrendValue(summary.latest, mode)}</dd></div>
    <div><dt>Change</dt><dd>{formatTrendDelta(summary.delta, mode)}</dd></div>
    <div><dt>High</dt><dd>{formatTrendValue(summary.high, mode)}</dd></div>
    <div><dt>Low</dt><dd>{formatTrendValue(summary.low, mode)}</dd></div>
  </dl>
) : null}
```

Add a tooltip shell driven by CSS hover/focus so the data exists in the DOM now even if the first version is intentionally lightweight:

```astro
<div class="sparkline-tooltip" aria-hidden="true">
  <span class="sparkline-tooltip-date">Hover a point for the exact date</span>
  <span class="sparkline-tooltip-value">Exact values available on hover</span>
</div>
```

Add styles for:

- `.sparkline-summary`
- `.sparkline-summary dt/dd`
- `.sparkline-chart circle`
- `.sparkline-tooltip`
- hover emphasis on markers

- [ ] **Step 4: Run the UI test to verify it passes**

Run: `npm exec vitest run tests/ui/index.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/Sparkline.astro tests/ui/index.test.ts
git commit -m "feat: enrich trend sparkline cards"
```

### Task 3: Wire service-specific semantics into the section copy and chart props

**Files:**
- Modify: `src/components/ServicePerformanceSection.astro`
- Modify: `tests/ui/index.test.ts`

- [ ] **Step 1: Extend the UI test for the updated methodology note and metric-specific formatting**

Add these assertions:

```ts
expect(html).toContain(
  "Tickets opened and tickets resolved show yesterday's service activity. SLA attainment shows the rolling 30-day result captured on each publish day."
);
expect(html).toContain("98.6%");
expect(html).toContain("297");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm exec vitest run tests/ui/index.test.ts`
Expected: FAIL because the current note text and sparkline props do not match the new design

- [ ] **Step 3: Pass display modes and update the service note**

Update `src/components/ServicePerformanceSection.astro`:

```astro
<p class="trend-note">
  Tickets opened and tickets resolved show yesterday&apos;s service activity. SLA attainment shows
  the rolling 30-day result captured on each publish day.
</p>

<div class="sparkline-grid">
  {slaTrend.length ? (
    <Sparkline label="SLA attainment" points={slaTrend} mode="percent" />
  ) : null}
  {openedTrend.length ? (
    <Sparkline label="Tickets opened" points={openedTrend} mode="count" />
  ) : null}
  {resolvedTrend.length ? (
    <Sparkline label="Tickets resolved" points={resolvedTrend} mode="count" />
  ) : null}
</div>
```

- [ ] **Step 4: Run tests to verify the section wiring passes**

Run: `npm exec vitest run tests/ui/index.test.ts tests/lib/snapshot/formatters.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ServicePerformanceSection.astro tests/ui/index.test.ts tests/lib/snapshot/formatters.test.ts
git commit -m "feat: clarify service trend context"
```

### Task 4: Verify the full dashboard build and keep scope tight

**Files:**
- Verify only:
  - `src/components/Sparkline.astro`
  - `src/components/ServicePerformanceSection.astro`
  - `src/lib/snapshot/formatters.ts`
  - `tests/ui/index.test.ts`
  - `tests/lib/snapshot/formatters.test.ts`

- [ ] **Step 1: Run the targeted test suite**

Run: `npm exec vitest run tests/lib/snapshot/formatters.test.ts tests/ui/index.test.ts`
Expected: PASS

- [ ] **Step 2: Run the existing project checks**

Run: `npm test`
Expected: PASS

Run: `npm run check`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Review the generated HTML for scope drift**

Run: `npm run build -- --outDir tests/ui/astro-build-output`
Expected: PASS with generated output under `tests/ui/astro-build-output`

Then verify:

- service trend cards show `Up to 30 published days`
- service trend cards show `Latest`, `Change`, `High`, and `Low`
- no new route was added
- `Security Posture` behavior is unchanged

- [ ] **Step 4: Commit**

```bash
git add src/components/Sparkline.astro src/components/ServicePerformanceSection.astro src/lib/snapshot/formatters.ts tests/ui/index.test.ts tests/lib/snapshot/formatters.test.ts
git commit -m "test: verify recent trend chart improvements"
```

## Self-Review

- Spec coverage:
  - summary strip: Task 2
  - hover-capable exact point details: Task 2
  - fixed `Up to 30 published days` label: Task 2
  - revised methodology note: Task 3
  - no new persistence or routes: enforced by Tasks 3 and 4
- Placeholder scan:
  - no `TODO`/`TBD` placeholders remain
  - every code step includes concrete snippets and commands
- Type consistency:
  - shared formatter names are defined in Task 1 and reused consistently in Tasks 2 and 3
  - `mode` prop uses only `count` and `percent`
