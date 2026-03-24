export function parseNumericValue(value: string | number): number {
  if (typeof value === "number") {
    return value;
  }

  const normalized = value.replace(/[^0-9.-]/g, "");
  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error(`Unable to parse numeric value from "${value}"`);
  }

  return parsed;
}

export function ensureIsoTimestamp(value: string): string {
  return new Date(value).toISOString();
}
