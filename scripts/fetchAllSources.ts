import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Snapshot } from "../src/lib/snapshot/types";
import { env } from "./config";
import { mapDattoRmmMetrics, type DattoRmmResponse } from "./sources/dattoRmm";
import {
  mergeHaloAggregateWithOpenClosedReport,
  mapHaloPsaMetrics,
  type HaloAggregateResponse,
  type HaloReportResponse
} from "./sources/halopsa";
import { httpGet, httpPostForm } from "./sources/http";
import { mapQualysMetrics, type QualysResponse } from "./sources/qualys";
import type { SourceResult } from "./sources/types";

type FetchAllSourcesResult = {
  halopsa: SourceResult<Partial<Snapshot>>;
  qualys: SourceResult<Partial<Snapshot>>;
  dattoRmm: SourceResult<Partial<Snapshot>>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const resolveRepoPath = (...segments: string[]) => path.resolve(repoRoot, ...segments);

function formatTrendDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildTwoPointTrendDates(fetchedAt: string): [string, string] {
  const latest = new Date(fetchedAt);
  const previous = new Date(latest);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return [formatTrendDate(previous), formatTrendDate(latest)];
}

type HaloTokenResponse = {
  access_token: string;
};

function hasHaloLiveConfig(): boolean {
  return Boolean(
    env.HALOPSA_BASE_URL && env.HALOPSA_CLIENT_ID && env.HALOPSA_CLIENT_SECRET
  );
}

function normalizeHaloBaseUrl(baseUrl: string): string {
  const withProtocol = /^https?:\/\//i.test(baseUrl) ? baseUrl : `https://${baseUrl}`;
  return withProtocol.replace(/\/+$/, "");
}

async function fetchHaloReportOpenClosedToday(
  baseUrl: string,
  reportId: string
): Promise<HaloReportResponse> {
  const token = await httpPostForm<HaloTokenResponse>(`${baseUrl}/auth/token`, {
    grant_type: "client_credentials",
    client_id: env.HALOPSA_CLIENT_ID,
    client_secret: env.HALOPSA_CLIENT_SECRET,
    scope: "all"
  });

  return httpGet<HaloReportResponse>(
    `${baseUrl}/api/Report/${encodeURIComponent(reportId)}?loadreport=true`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`
      }
    }
  );
}

export async function fetchHaloPsaMetrics(): Promise<SourceResult<Partial<Snapshot>>> {
  const fetchedAt = new Date().toISOString();
  const fixturePayload = await loadFixture<HaloAggregateResponse>("halopsa.response.json");
  let payload = fixturePayload;
  let note = "Using HaloPSA fixture payload";

  if (hasHaloLiveConfig()) {
    try {
      const baseUrl = normalizeHaloBaseUrl(env.HALOPSA_BASE_URL);
      const reportPayload = await fetchHaloReportOpenClosedToday(
        baseUrl,
        env.HALOPSA_REPORT_OPEN_CLOSED_TODAY_ID
      );
      payload = mergeHaloAggregateWithOpenClosedReport(fixturePayload, reportPayload);
      note = `HaloPSA report ${env.HALOPSA_REPORT_OPEN_CLOSED_TODAY_ID} live for opened/closed counts; remaining service metrics fixture-backed`;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown error";
      note = `Using HaloPSA fixture payload; live report fetch failed: ${reason}`;
    }
  }

  const metrics = mapHaloPsaMetrics(payload);
  const [priorDate, currentDate] = buildTwoPointTrendDates(fetchedAt);

  const slaTrend = [
    { date: priorDate, value: 98.4 },
    { date: currentDate, value: Number(metrics.summary.slaAttainment.value.replace("%", "")) }
  ];

  const backlogTrend = [
    { date: priorDate, value: 42 },
    { date: currentDate, value: 37 }
  ];

  return {
    status: "current",
    fetchedAt,
    note,
    data: {
      summary: {
        kpis: [
          {
            id: "tickets-handled",
            label: "Tickets handled",
            value: metrics.summary.ticketsHandled.value,
            context: "Closed in period"
          },
          {
            id: "sla-attainment",
            label: "SLA attainment",
            value: metrics.summary.slaAttainment.value,
            context: "Rolling 30 days"
          },
          {
            id: "ticket-volume",
            label: "Ticket volume",
            value: metrics.service.ticketVolume.value,
            context: "Opened in period"
          }
        ]
      },
      service: {
        current: {
          slaAttainment: {
            label: "SLA attainment",
            value: metrics.summary.slaAttainment.value,
            context: "Rolling 30 days"
          },
          ticketsHandled: {
            label: "Tickets handled",
            value: metrics.summary.ticketsHandled.value,
            context: "Closed in period"
          },
          ticketVolume: {
            label: "Ticket volume",
            value: metrics.service.ticketVolume.value,
            context: "Opened in period"
          },
          resolvedTickets: {
            label: "Resolved tickets",
            value: metrics.service.resolvedTickets.value,
            context: "Resolved in period"
          }
        },
        metrics: [
          {
            id: "tickets-handled",
            label: "Tickets handled",
            value: metrics.summary.ticketsHandled.value,
            context: "Closed in period"
          },
          {
            id: "ticket-volume",
            label: "Ticket volume",
            value: metrics.service.ticketVolume.value,
            context: "Opened in period"
          },
          {
            id: "resolved-tickets",
            label: "Resolved tickets",
            value: metrics.service.resolvedTickets.value,
            context: "Resolved in period"
          },
          {
            id: "first-response-median",
            label: "Median first response",
            value: metrics.service.firstResponseMedian.value,
            context: "Across all tickets"
          },
          {
            id: "resolution-median",
            label: "Median time to resolution",
            value: metrics.service.resolutionMedian.value,
            context: "Across all tickets"
          }
        ],
        trends: {
          slaAttainment: slaTrend,
          backlog: backlogTrend
        }
      }
    }
  };
}

async function loadFixture<T>(filename: string): Promise<T> {
  const filePath = resolveRepoPath("tests/fixtures", filename);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

export async function fetchQualysMetrics(): Promise<SourceResult<Partial<Snapshot>>> {
  const fetchedAt = new Date().toISOString();
  const payload = await loadFixture<QualysResponse>("qualys.response.json");
  const metrics = mapQualysMetrics(payload);
  const [priorDate, currentDate] = buildTwoPointTrendDates(fetchedAt);
  const vulnerabilityTrend = [
    { date: priorDate, value: 18 },
    { date: currentDate, value: 15 }
  ];
  const highVulnerabilityTrend = [
    { date: priorDate, value: 24 },
    { date: currentDate, value: metrics.security.vulnerabilityBySeverity.high }
  ];

  return {
    status: "current",
    fetchedAt,
    note: "Using Qualys fixture payload",
    data: {
      summary: {
        kpis: [
          {
            id: "open-critical-vulnerabilities",
            label: "Open Critical Vulnerabilities",
            value: metrics.summary.openCriticalVulnerabilities.value,
            context: "Current open critical findings"
          },
          {
            id: "critical-vulnerability-trend",
            label: "Critical Vulnerability Trend",
            value: metrics.summary.criticalVulnerabilityTrend.value,
            direction: metrics.summary.criticalVulnerabilityTrend.direction,
            context: "Delta vs previous period"
          }
        ]
      },
      security: {
        current: {
          openCriticalVulnerabilities: {
            label: "Open Critical Vulnerabilities",
            value: metrics.summary.openCriticalVulnerabilities.value,
            context: "Current open critical findings"
          },
          criticalVulnerabilityTrend: {
            label: "Critical Vulnerability Trend",
            value: metrics.summary.criticalVulnerabilityTrend.value,
            context: "Delta vs previous period"
          }
        },
        metrics: [
          {
            id: "vulnerability-critical",
            label: "Open critical vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.critical,
            context: "Open"
          },
          {
            id: "vulnerability-high",
            label: "Open high vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.high,
            context: "Open"
          },
          {
            id: "vulnerability-medium",
            label: "Open medium vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.medium,
            context: "Open"
          },
          {
            id: "vulnerability-low",
            label: "Open low vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.low,
            context: "Open"
          }
        ],
        trends: {
          openCriticalVulnerabilities: vulnerabilityTrend,
          openHighVulnerabilities: highVulnerabilityTrend
        }
      }
    }
  };
}

export async function fetchDattoRmmMetrics(): Promise<SourceResult<Partial<Snapshot>>> {
  const fetchedAt = new Date().toISOString();
  const payload = await loadFixture<DattoRmmResponse>("datto-rmm.response.json");
  const metrics = mapDattoRmmMetrics(payload);

  return {
    status: "current",
    fetchedAt,
    note: "Using Datto RMM fixture payload",
    data: {
      security: {
        current: {
          patchCompliance: {
            label: "Patch Compliance",
            value: metrics.summary.patchCompliance.value,
            context: "Fleet-wide"
          },
          devicesFullyPatched: {
            label: "Devices Fully Patched",
            value: metrics.security.devicesFullyPatched,
            context: "Across managed fleet"
          },
          devicesMissingCriticalPatches: {
            label: "Devices Missing Critical Patches",
            value: metrics.security.devicesMissingCriticalPatches,
            context: "Across managed fleet"
          }
        },
        metrics: [
          {
            id: "devices-fully-patched",
            label: "Devices Fully Patched",
            value: metrics.security.devicesFullyPatched,
            context: "Across managed fleet"
          },
          {
            id: "devices-missing-critical",
            label: "Devices Missing Critical Patches",
            value: metrics.security.devicesMissingCriticalPatches,
            context: "Across managed fleet"
          }
        ]
      }
    }
  };
}

export async function fetchAllSources(): Promise<FetchAllSourcesResult> {
  return {
    halopsa: await fetchHaloPsaMetrics(),
    qualys: await fetchQualysMetrics(),
    dattoRmm: await fetchDattoRmmMetrics()
  };
}
