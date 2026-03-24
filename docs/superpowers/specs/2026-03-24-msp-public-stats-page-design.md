# MSP Public Stats Page Design

Date: 2026-03-24
Status: Approved for planning

## Summary

Build a public-facing, branded HTML trust page for Italik that publishes aggregate daily MSP performance and security metrics. The page is intended to increase customer trust through transparent reporting rather than act as an internal operations console.

The page will present:

- A top-level trust summary with key headline metrics
- A service performance section sourced from HaloPSA
- A security posture section sourced from Qualys and Datto RMM
- Short historical trends for key metrics
- Visible freshness and source-health indicators

The page will follow the tone and visual direction of [italik.support](https://italik.support): credible, straightforward, warm, and professional. It should feel more modern and polished than the existing site while remaining recognizably part of the same brand.

## Goals

- Publish a public dashboard that improves trust through transparent MSP-wide reporting
- Show aggregate Italik-wide metrics only
- Refresh data once per day and display a clear last-updated timestamp
- Combine scale indicators and outcome indicators in the headline summary
- Provide enough detail for customers to validate the claims without exposing sensitive internal data
- Keep the public site fast, low-risk, and simple to host

## Non-Goals

- Customer-specific or tenant-specific views
- Live or near-real-time monitoring
- Device-level, client-level, technician-level, or CVE-level public disclosures
- An internal dashboard for operations teams
- A BI-style portal with deep filtering or drill-down

## Chosen Approach

Use a static site plus a scheduled daily data build.

A private daily collector will pull source data from HaloPSA, Qualys, and Datto RMM, normalize it into a single snapshot format, and publish versioned snapshot data for the public site to read. The public HTML page will render only the prepared snapshot data and will not call vendor APIs directly from the browser.

This approach is preferred because it gives the best balance of:

- Strong security posture for a public page
- Low operational overhead
- Fast load times and easy caching
- Full visual control for Italik branding
- Predictable behavior when a data source fails

## Audience and Success Criteria

Primary audience:

- Existing customers validating whether Italik is operating credibly
- Prospective customers evaluating whether Italik appears trustworthy and competent

Success means:

- Visitors can understand Italik's current service and security performance in under one minute
- The page reads like a trust report, not an internal dashboard
- The page remains useful even if one source is temporarily stale
- No sensitive operational or customer data is exposed

## Architecture

High-level flow:

`HaloPSA + Qualys + Datto RMM -> daily aggregation job -> normalized snapshot JSON -> branded static HTML page`

### Private integration layer

The integration layer is responsible for:

- Authenticating to HaloPSA, Qualys, and Datto RMM
- Pulling daily aggregate metrics
- Calculating derived metrics and trend deltas
- Validating source payloads
- Writing a normalized snapshot artifact
- Preserving the previous known-good values when a source fails validation

### Public presentation layer

The public site is responsible for:

- Reading only the normalized snapshot data
- Rendering a modern branded trust page
- Showing source freshness and stale indicators
- Displaying headline KPIs and short trend views

The browser must not have direct access to vendor credentials or vendor APIs.

## Data Freshness and Publication Model

- Refresh cadence: daily
- Publication model: latest snapshot plus short history for trends
- Each section must display a visible freshness timestamp
- The page-level header should also display a "last updated" timestamp

The system should keep a small historical series so the UI can render short 30-day or 90-day trend charts without querying source systems at runtime.

## Information Architecture

### 1. Hero summary

The page opens with:

- A clear trust-oriented headline
- A short explanation of what the report represents
- A compact KPI grid mixing scale and outcomes
- A visible last-updated timestamp

Recommended headline KPI mix:

- Managed endpoints
- Tickets handled in the reporting window
- SLA attainment
- Median first response time
- Patch compliance percentage
- Current open critical vulnerabilities
- Critical vulnerability trend versus prior period

### 2. How we measure ourselves

A short explanatory band should state where each major metric family comes from:

- HaloPSA for service performance
- Qualys for vulnerability posture
- Datto RMM for patching and device update status

This section should be brief and plain-English, aimed at credibility rather than technical detail.

### 3. Service Performance

This section should cover:

- Ticket volume
- Resolved tickets
- SLA met percentage
- Median first response time
- Median resolution time
- Backlog trend
- A short 30-day or 90-day trend view

The emphasis should be on customer-visible outcomes, not internal queue mechanics.

### 4. Security Posture

This section should cover:

- Devices fully patched
- Devices missing critical patches
- Vulnerability counts by severity
- Open critical vulnerability trend
- Open high vulnerability trend
- Optional median remediation age for critical issues if the data is reliable enough

This section should show whether risk is trending in the right direction without exposing sensitive detail.

### 5. Trust reinforcement footer section

The page should end with supporting proof rather than a heavy sales CTA. Appropriate content includes:

- Years in business
- Relevant certifications or partner status
- A short methodology note
- A link back to the main Italik website

## Metric Rules

All public metrics must be:

- Aggregate
- Explainable
- Consistent over time
- Safe to publish publicly

### Disclosure rules

Do publish:

- MSP-wide counts
- Percentages
- Period-based operational outcomes
- Trend deltas

Do not publish:

- Customer-specific data
- Named clients
- Device-level records
- Technician-level performance data
- Specific vulnerable assets
- CVE-level public exposure details
- Internal segmentation or sensitive estate structure

### Period clarity

Every metric label must clearly indicate its reporting window, such as:

- "Last 30 days"
- "Current snapshot"
- "Compared with previous 30 days"

## Snapshot Schema Requirements

The normalized snapshot should support at least these groups:

- `generated_at`
- `overall.last_updated`
- `overall.kpis[]`
- `service.current`
- `service.trends`
- `security.current`
- `security.trends`
- `sources`

Each source entry should include:

- Source name
- Status: current or stale
- Last successful refresh timestamp
- Optional note if values were carried forward

The schema must be stable so the frontend can render partial data safely.

## Reliability and Failure Handling

The system must fail conservatively.

- If a source payload is incomplete or invalid, do not publish zeros or blank values in place of real metrics
- Retain the previous known-good values for that source area
- Mark the affected section as stale and show the last successful update date
- If one source fails, the rest of the page should still render normally

The collector should also produce a simple internal quality result that records:

- Which sources succeeded
- Which metrics were derived
- Which values were carried forward

The public UI can expose a simplified version of that status.

## UX and Branding Direction

The visual direction should align with Italik's current public brand:

- Straightforward, credible language
- Warm professional tone
- Strong whitespace
- Clean typography
- Restrained use of accent colour

The page should feel modern and intentional, but not like a flashy product dashboard. It should look closer to a trust report or capability statement with data support.

## Testing Strategy

Testing should cover three layers.

### Integration tests

- Validate each source adapter against mocked HaloPSA, Qualys, and Datto RMM responses
- Ensure derived metrics are calculated correctly

### Schema tests

- Validate snapshot shape and required fields
- Ensure stale-source payloads still conform to schema

### Frontend rendering tests

- Ensure the page renders with full data
- Ensure the page renders when one source is stale
- Ensure charts and KPI blocks degrade gracefully when a metric is unavailable

## Phasing Recommendation

Build in a single initial phase with these boundaries:

- Public aggregate dashboard only
- Daily refresh only
- One summary section plus two detail sections
- Lightweight trend views only

Future expansion can add more data sources or richer history, but those are out of scope for the first implementation plan.

## Key Decisions Captured

- Public aggregate dashboard, not customer-specific views
- Full transparency with real numbers rather than curated status bands
- Daily refresh cadence
- Top-of-page summary followed by service and security sections
- Headline KPI mix should combine scale and trust signals
- Include short trends, not a trend-heavy analytics experience
- Static site plus scheduled data build is the selected architecture

