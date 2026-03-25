import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Snapshot } from "../src/lib/snapshot/types";
import { mapDattoRmmMetrics, type DattoRmmResponse } from "./sources/dattoRmm";
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
  return {
    status: "stale",
    fetchedAt: new Date(0).toISOString(),
    note: "HaloPSA metrics fetch not implemented",
    data: undefined
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
            label: "Critical Vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.critical,
            context: "Open"
          },
          {
            id: "vulnerability-high",
            label: "High Vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.high,
            context: "Open"
          },
          {
            id: "vulnerability-medium",
            label: "Medium Vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.medium,
            context: "Open"
          },
          {
            id: "vulnerability-low",
            label: "Low Vulnerabilities",
            value: metrics.security.vulnerabilityBySeverity.low,
            context: "Open"
          }
        ]
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
