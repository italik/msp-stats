# Service & Security Detail Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver Task 7 by rendering service/security detail sections with 30-day trends and trust footer, plus UI test coverage.

**Architecture:** Reuse existing Astro layout and Task 6 styling. Surface snapshot metrics and trend sparklines via new formatters/helpers. Footer pulls static copy plus derived years-since-1999 text. Data freshness derives from source-level freshness with overall snapshot fallback.

**Tech Stack:** Astro, TypeScript utilities, Vitest, Playwright-style UI snapshot test (HTML assertions).

---

### Task 7: Service & Security Detail

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/ServicePerformanceSection.astro`
- Modify: `src/components/SecurityPostureSection.astro`
- Modify: `src/components/Sparkline.astro`
- Modify: `src/components/TrustFooter.astro`
- Modify: `src/lib/snapshot/formatters.ts`
- Modify: `tests/ui/index.test.ts`

- [ ] **Step 1: Extend UI test with required assertions**

Add expectations for ticket/security metrics, trends label, years supporting businesses, and freshness copy in `tests/ui/index.test.ts`.

- [ ] **Step 2: Run UI test to confirm failure**

Run: `npm exec vitest run tests/ui/index.test.ts`
Expected: FAIL showing missing text assertions.

- [ ] **Step 3: Implement service section rendering**

Update `ServicePerformanceSection.astro` to render SectionHeading, freshness text (HaloPSA freshness with lastUpdated fallback), metric grid from `snapshot.service.metrics`, and conditional sparklines for `slaAttainment` and `backlog` trends using `Sparkline` component.

- [ ] **Step 4: Implement security section rendering**

Update `SecurityPostureSection.astro` similarly using Qualys freshness fallback, metrics grid from `snapshot.security.metrics`, and sparklines for `openCriticalVulnerabilities` and `openHighVulnerabilities` trends.

- [ ] **Step 5: Support sparkline component and formatting utilities**

Enhance `Sparkline.astro` to accept data/labels and render trend heading "30-day trend". Add helpers in `formatters.ts` for freshness text, metric formatting, sparkline data extraction if needed.

- [ ] **Step 6: Implement trust footer**

Update `TrustFooter.astro` and `index.astro` to show years supporting businesses since 1999, methodology copy referencing HaloPSA, Qualys, Datto RMM, and link to `https://italik.support`.

- [ ] **Step 7: Wire sections into home page**

Ensure `index.astro` uses updated components and passes snapshot props properly.

- [ ] **Step 8: Rerun UI test**

Run: `npm exec vitest run tests/ui/index.test.ts`
Expected: PASS.

- [ ] **Step 9: Build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 10: Commit**

Run:
```bash
git add src/pages/index.astro src/components/ServicePerformanceSection.astro src/components/SecurityPostureSection.astro src/components/Sparkline.astro src/components/TrustFooter.astro src/lib/snapshot/formatters.ts tests/ui/index.test.ts docs/superpowers/plans/2026-03-25-task7-service-security-detail.md
git commit -m "feat: add service and security detail sections"
```

