import type { Snapshot } from "./types";

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

type Direction = "up" | "down" | "flat" | undefined;

export type DisplayMetric = {
  id: string;
  label: string;
  value: string | number;
  context: string;
  direction?: Direction;
};

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

export function buildServiceMetrics(snapshot: Snapshot): DisplayMetric[] {
  const { service } = snapshot;
  const metrics: DisplayMetric[] = [];

  if (service.current?.resolvedTickets) {
    metrics.push({
      id: "tickets-handled",
      label: "Tickets handled",
      value: service.current.resolvedTickets.value,
      context: "Ticket volume"
    });
    metrics.push({
      id: "resolved-tickets",
      label: "Resolved tickets",
      value: service.current.resolvedTickets.value,
      context: service.current.resolvedTickets.context
    });
  }

  if (service.current?.slaAttainment) {
    metrics.push({
      id: "sla-attainment",
      label: service.current.slaAttainment.label,
      value: service.current.slaAttainment.value,
      context: service.current.slaAttainment.context
    });
  }

  metrics.push(...service.metrics.map((metric) => ({ ...metric })));

  return metrics;
}

export function buildSecurityMetrics(snapshot: Snapshot): DisplayMetric[] {
  const { security } = snapshot;
  const metrics: DisplayMetric[] = [];

  if (security.current?.patchCompliance) {
    metrics.push({
      id: "patch-compliance",
      label: "Patch compliance",
      value: security.current.patchCompliance.value,
      context: security.current.patchCompliance.context
    });
  }

  if (security.current?.devicesFullyPatched) {
    metrics.push({
      id: "devices-fully-patched",
      label: "Devices fully patched",
      value: security.current.devicesFullyPatched.value,
      context: security.current.devicesFullyPatched.context
    });
  }

  metrics.push(...security.metrics.map((metric) => ({ ...metric })));

  return metrics;
}
