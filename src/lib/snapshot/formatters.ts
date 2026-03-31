import type { Snapshot } from "./types";

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

const countFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0
});

const signedCountFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 0,
  signDisplay: "always"
});

const percentFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const signedPercentFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "always"
});

export function parseNumericValue(value: string | number): number {
  if (typeof value === "number") {
    return value;
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`Unable to parse numeric value from "${value}"`);
  }

  const digits = normalized.replace(/[^0-9.-]/g, "");
  if (!digits) {
    throw new Error(`Unable to parse numeric value from "${value}"`);
  }

  const parsed = Number(digits);
  if (Number.isNaN(parsed)) {
    throw new Error(`Unable to parse numeric value from "${value}"`);
  }

  return parsed;
}

export function ensureIsoTimestamp(value: string): string {
  return new Date(value).toISOString();
}

export function summarizeTrendPoints(points: TrendPoint[]): TrendSummary | null {
  if (points.length === 0) {
    return null;
  }

  const latest = points[points.length - 1].value;
  const first = points[0].value;
  let high = points[0].value;
  let low = points[0].value;

  for (const point of points.slice(1)) {
    if (point.value > high) {
      high = point.value;
    }

    if (point.value < low) {
      low = point.value;
    }
  }

  return {
    latest,
    delta: latest - first,
    high,
    low
  };
}

export function formatTrendValue(value: number, mode: TrendDisplayMode): string {
  if (mode === "percent") {
    return `${percentFormatter.format(value)}%`;
  }

  return countFormatter.format(value);
}

export function formatTrendDelta(value: number, mode: TrendDisplayMode): string {
  if (value === 0) {
    return mode === "percent" ? `${percentFormatter.format(0)} pts` : countFormatter.format(0);
  }

  if (mode === "percent") {
    return `${signedPercentFormatter.format(value)} pts`;
  }

  return signedCountFormatter.format(value);
}

export function formatAsOf(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(date));
}

export function resolveSourceFreshness(
  sources: Snapshot["sources"],
  sourceName: string,
  fallback: string
): string {
  const match = sources.find(
    (source) => source.name.toLowerCase() === sourceName.toLowerCase()
  );

  return match?.lastSuccessfulRefresh ?? fallback;
}

export function yearsSupportingBusinesses(sinceYear = 1999, now = new Date()): number {
  const currentYear = now.getUTCFullYear();
  return Math.max(currentYear - sinceYear, 0);
}
