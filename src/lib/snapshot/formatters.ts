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
