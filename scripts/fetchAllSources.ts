import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Snapshot } from "../src/lib/snapshot/types";
import { mapDattoRmmMetrics, type DattoRmmResponse } from "./sources/dattoRmm";
import {
  mapHaloPsaMetrics,
  type HaloAggregateResponse
} from "./sources/halopsa";
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

export async function fetchHaloPsaMetrics(): Promise<SourceResult<Partial<Snapshot>>> {
  const fetchedAt = new Date().toISOString();
  const payload = await loadFixture<HaloAggregateResponse>("halopsa.response.json");
  const metrics = mapHaloPsaMetrics(payload);

  const slaTrend = [
    { date: "2026-03-20", value: 98.4 },
    { date: "2026-03-21", value: Number(metrics.summary.slaAttainment.value.replace("%", "")) }
  ];

  const backlogTrend = [
    { date: "2026-03-20", value: 42 },
    { date: "2026-03-21", value: 37 }
  ];

  return {
    status: "current",
    fetchedAt,
    note: "Using HaloPSA fixture payload",
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
  const vulnerabilityTrend = [
    { date: "2026-03-20", value: 18 },
    { date: "2026-03-21", value: 15 }
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
          openHighVulnerabilities: vulnerabilityTrend
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
