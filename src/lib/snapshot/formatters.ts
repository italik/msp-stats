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

import type { Snapshot } from "./types";

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
