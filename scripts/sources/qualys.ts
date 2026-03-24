type SeverityCounts = {
  critical: number;
  high: number;
  medium: number;
  low: number;
};

export type QualysResponse = {
  vulnerabilities: {
    open: SeverityCounts;
    trend: {
      criticalDelta: number;
    };
  };
};

type MetricValue = {
  value: string;
  direction?: "up" | "down" | "flat";
};

export type QualysMetrics = {
  summary: {
    openCriticalVulnerabilities: MetricValue;
    criticalVulnerabilityTrend: MetricValue;
  };
  security: {
    vulnerabilityBySeverity: SeverityCounts;
  };
};

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Qualys payload missing or invalid numeric field "${field}"`);
  }
  return value;
}

export function mapQualysMetrics(payload: QualysResponse): QualysMetrics {
  const open = payload?.vulnerabilities?.open;
  const trend = payload?.vulnerabilities?.trend;

  const critical = assertNumber(open?.critical, "vulnerabilities.open.critical");
  const high = assertNumber(open?.high, "vulnerabilities.open.high");
  const medium = assertNumber(open?.medium, "vulnerabilities.open.medium");
  const low = assertNumber(open?.low, "vulnerabilities.open.low");
  const criticalDelta = assertNumber(
    trend?.criticalDelta,
    "vulnerabilities.trend.criticalDelta"
  );

  const direction = criticalDelta > 0 ? "up" : criticalDelta < 0 ? "down" : "flat";

  return {
    summary: {
      openCriticalVulnerabilities: { value: String(critical) },
      criticalVulnerabilityTrend: { value: String(criticalDelta), direction }
    },
    security: {
      vulnerabilityBySeverity: { critical, high, medium, low }
    }
  };
}
