# Recent Trend Chart Improvements Design

Date: 2026-03-31

## Goal

Improve the public `Recent trend` section so each chart is understandable without leaving the page. The charts should give customers enough context to interpret the line, understand the visible date window, and inspect exact point values on hover.

## Scope

This design applies to the current service trend cards on the public dashboard:

- `SLA attainment`
- `Tickets opened`
- `Tickets resolved`

It does not add new routes, separate detail pages, or external charting libraries.

## Current Problem

The existing sparkline cards show only a line, a latest value, and a start date. They do not explain the visible history window clearly enough, do not expose exact per-point values in the UI, and do not summarise what changed over the visible period. The result looks polished but is too opaque for a trust-oriented report.

## Design Summary

Keep the current three-card layout, but make each card self-explanatory:

- fixed eyebrow label: `Up to 30 published days`
- visible point markers on the line
- hover tooltip with exact date and value for the nearest point
- compact summary strip with `Latest`, `Change`, `High`, and `Low`
- clearer methodology note for mixed metric windows

This keeps the page lightweight and public-facing while making the charts meaningfully more useful.

## Interaction Model

Each chart card continues to render on-page with no drill-through navigation.

### Default state

Each card shows:

- the metric name
- the fixed history label `Up to 30 published days`
- the sparkline with visible markers
- a summary strip containing `Latest`, `Change`, `High`, and `Low`

### Hover state

Hovering a point or the line reveals a lightweight tooltip inside the card showing:

- the exact trend date
- the metric label
- the exact numeric value for that point

Example:

- `27 Mar 2026`
- `Tickets opened: 297`

### Touch and non-hover devices

The summary strip remains the primary source of context on devices without hover. Hover details are an enhancement, not a dependency.

## Data Semantics

Trend lines continue to use the retained daily snapshot history already stored in `data/snapshots/history`.

The visible chart label remains fixed as `Up to 30 published days`, even when fewer than 30 daily snapshots exist. The rendered points still reflect only the available retained history.

Metric semantics:

- `SLA attainment` represents the rolling 30-day value captured on each publish day
- `Tickets opened` represents the previous day's opened count
- `Tickets resolved` represents the previous day's resolved count

The tooltip must use the actual stored point date already assigned during historical trend construction. This is important because yesterday-based ticket metrics and publish-day SLA metrics do not share the same reporting basis.

## Summary Statistics

Each card computes its summary values from the visible points:

- `Latest`: most recent point value
- `Change`: latest minus earliest visible point
- `High`: highest visible point
- `Low`: lowest visible point

Formatting rules:

- `SLA attainment` uses percentage formatting and expresses `Change` as percentage points
- `Tickets opened` and `Tickets resolved` use integer formatting and express `Change` as raw count difference

If fewer than two points exist, `Change` should still render safely using the available data rather than suppressing the whole summary block.

## Copy Changes

Replace the current trend note with:

`Tickets opened and tickets resolved show yesterday's service activity. SLA attainment shows the rolling 30-day result captured on each publish day.`

This is shorter and clearer than the current wording while staying accurate.

## Implementation Shape

### Presentation layer

Enhance `src/components/Sparkline.astro` to:

- render visible markers
- compute summary statistics
- expose tooltip-capable per-point metadata
- render the fixed history label
- format percentage and count metrics correctly

Update `src/components/ServicePerformanceSection.astro` to:

- use the revised methodology note
- pass the required display mode or formatter hints to the sparkline component

### Data layer

Keep `scripts/buildHistoricalTrends.ts` as the source of truth for historical points. No new persistence model is required.

Only minimal data-shape changes are acceptable, and only if needed to support tooltip metadata cleanly.

## Accessibility

The chart should remain understandable without hover:

- summary statistics must always be visible
- tooltip data should be present in accessible text or attributes
- the SVG should retain a clear `aria-label`

If a fully keyboard-navigable per-point tooltip is too large for this change, the first implementation may prioritise visible summaries and pointer hover while keeping the DOM structured for a later accessibility enhancement.

## Testing

Add or update focused tests to verify:

- the label `Up to 30 published days` appears
- each card renders `Latest`, `Change`, `High`, and `Low`
- the updated methodology note appears
- exact point date/value data is present in the DOM for tooltip use
- percentage and count formatting remain correct

No new end-to-end route test is required for this change.

## Non-Goals

This design does not include:

- separate detailed report pages
- cross-chart comparisons in a single combined graph
- external charting packages
- customer-configurable date ranges
- security trend redesign in the same change
