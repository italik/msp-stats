# Task 5 Follow-up Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the daily publish script works from any working directory and keep Qualys-derived summary KPIs in sync with security details.

**Architecture:** Anchor file paths off the scripts directory via `import.meta.url` utilities, reuse Qualys mapping outputs to drive both summary KPIs and security entries, and merge KPIs by `id` without wiping unrelated summary items.

**Tech Stack:** TypeScript, tsx, Vitest, Astro.

---

### Task 1: Tests for path anchoring and Qualys summary alignment

**Files:**
- Modify: `tests/scripts/buildSnapshot.test.ts`
- Modify: `tests/scripts/qualys.test.ts`

- [ ] Write failing test asserting `buildSnapshot` reads previous snapshot independent of `process.cwd` and preserves other summary KPIs while updating Qualys ones.
- [ ] Write failing test ensuring `fetchQualysMetrics` also populates summary KPIs that match security current values.
- [ ] Run: `npm exec vitest run tests/scripts/qualys.test.ts tests/scripts/buildSnapshot.test.ts` (expect fail).

### Task 2: Anchor file resolution to repository root

**Files:**
- Modify: `scripts/runDailyPublish.ts`
- Modify: `scripts/fetchAllSources.ts`
- Modify: `scripts/buildSnapshot.ts`

- [ ] Implement shared script-root resolver using `fileURLToPath(import.meta.url)` to build absolute paths for data files and fixtures.
- [ ] Ensure `readPreviousSnapshot` resolves `previousSnapshotPath` relative to repo root, not caller CWD.
- [ ] Update fixture loading in `fetchAllSources` to use anchored paths.
- [ ] Run: `npm exec vitest run tests/scripts/buildSnapshot.test.ts` (expect pass after Task 1 fixes).

### Task 3: Keep Qualys summary KPIs consistent with security details

**Files:**
- Modify: `scripts/fetchAllSources.ts`
- Modify: `scripts/buildSnapshot.ts`
- Modify: `data/snapshots/latest.json` (regenerated via publish)

- [ ] Extend Qualys source data to emit summary KPIs for open critical vulnerabilities and critical vulnerability trend using mapped metrics.
- [ ] Adjust snapshot merge to update/insert Qualys KPIs without clearing unrelated summary items.
- [ ] Regenerate snapshot via `npm run publish:daily` to refresh fixtures/history.

### Task 4: Full verification and commit

**Files:**
- Modify: `data/snapshots/history/2026-03-25.json` (if republished)

- [ ] Run verification: `npm exec vitest run tests/scripts/qualys.test.ts tests/scripts/dattoRmm.test.ts tests/scripts/buildSnapshot.test.ts`
- [ ] Run: `npm run check`
- [ ] Run: `npm run build`
- [ ] Run: `npm run publish:daily`
- [ ] Commit with message `fix: anchor publish paths and sync qualys summary`.
