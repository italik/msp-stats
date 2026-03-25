export type HaloAggregateResponse = {
  ticketVolume: number;
  ticketsClosed: number;
  ticketsResolved: number;
  slaMetPercent: number;
  firstResponseMedianMinutes: number;
  resolutionMedianHours: number;
};

type HaloReportRow = {
  "Ticket Type"?: string;
  "Tickets Opened Today"?: string | number;
  "Tickets Closed Today"?: string | number;
  "Delta (Open - Closed)"?: string | number;
};

export type HaloReportResponse = {
  report?: {
    loaded?: boolean;
    rows?: HaloReportRow[];
  };
};

type MetricValue = {
  value: string;
};

type HaloPsaMetrics = {
  summary: {
    ticketsHandled: MetricValue;
    slaAttainment: MetricValue;
  };
  service: {
    ticketVolume: MetricValue;
    resolvedTickets: MetricValue;
    firstResponseMedian: MetricValue;
    resolutionMedian: MetricValue;
  };
};

function assertNumericField(
  payload: HaloAggregateResponse,
  field: keyof HaloAggregateResponse
): number {
  const value = payload[field];

  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`HaloPSA payload missing or invalid numeric field "${String(field)}"`);
  }

  return value;
}

function parseReportNumber(value: string | number | undefined, field: string): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  throw new Error(`HaloPSA report payload missing or invalid numeric field "${field}"`);
}

export function mergeHaloAggregateWithOpenClosedReport(
  base: HaloAggregateResponse,
  reportPayload: HaloReportResponse
): HaloAggregateResponse {
  const rows = reportPayload.report?.rows;

  if (!reportPayload.report?.loaded || !Array.isArray(rows)) {
    throw new Error('HaloPSA report payload did not include loaded report rows');
  }

  let ticketVolume = 0;
  let ticketsClosed = 0;

  for (const row of rows) {
    ticketVolume += parseReportNumber(row["Tickets Opened Today"], "Tickets Opened Today");
    ticketsClosed += parseReportNumber(row["Tickets Closed Today"], "Tickets Closed Today");
  }

  return {
    ...base,
    ticketVolume,
    ticketsClosed,
    ticketsResolved: ticketsClosed
  };
}

function averageFromReportRows(
  reportPayload: HaloReportResponse,
  field: string,
  digits: number
): number {
  const rows = reportPayload.report?.rows;

  if (!reportPayload.report?.loaded || !Array.isArray(rows) || rows.length === 0) {
    throw new Error("HaloPSA report payload did not include loaded report rows");
  }

  const total = rows.reduce((sum, row) => sum + parseReportNumber(row[field as keyof HaloReportRow], field), 0);
  const average = total / rows.length;

  return Number(average.toFixed(digits));
}

export function mergeHaloAggregateWithResponseTimeReport(
  base: HaloAggregateResponse,
  reportPayload: HaloReportResponse
): HaloAggregateResponse {
  return {
    ...base,
    firstResponseMedianMinutes: averageFromReportRows(reportPayload, "Response Time", 0)
  };
}

export function mergeHaloAggregateWithResolutionTimeReport(
  base: HaloAggregateResponse,
  reportPayload: HaloReportResponse
): HaloAggregateResponse {
  return {
    ...base,
    resolutionMedianHours: averageFromReportRows(reportPayload, "Resolution Time (Hours)", 2)
  };
}

function sumReportField(
  reportPayload: HaloReportResponse,
  countField: string,
  withinField: string
): { total: number; within: number } {
  const rows = reportPayload.report?.rows;

  if (!reportPayload.report?.loaded || !Array.isArray(rows) || rows.length === 0) {
    throw new Error("HaloPSA report payload did not include loaded report rows");
  }

  return rows.reduce(
    (acc, row) => ({
      total: acc.total + parseReportNumber(row[countField as keyof HaloReportRow], countField),
      within: acc.within + parseReportNumber(row[withinField as keyof HaloReportRow], withinField)
    }),
    { total: 0, within: 0 }
  );
}

export function mergeHaloAggregateWithSlaAttainmentReports(
  base: HaloAggregateResponse,
  resolutionReport: HaloReportResponse,
  responseReport: HaloReportResponse
): HaloAggregateResponse {
  const resolution = sumReportField(resolutionReport, "CountOfFaults", "WithinSLAFaults");
  const response = sumReportField(responseReport, "CountOfFaults", "WithinResponseSLAFaults");
  const total = resolution.total + response.total;

  if (total === 0) {
    throw new Error("HaloPSA SLA reports did not contain any faults to aggregate");
  }

  const within = resolution.within + response.within;

  return {
    ...base,
    slaMetPercent: Number(((within / total) * 100).toFixed(2))
  };
}

export function mapHaloPsaMetrics(payload: HaloAggregateResponse): HaloPsaMetrics {
  const ticketVolume = assertNumericField(payload, "ticketVolume");
  const ticketsClosed = assertNumericField(payload, "ticketsClosed");
  const ticketsResolved = assertNumericField(payload, "ticketsResolved");
  const slaMetPercent = assertNumericField(payload, "slaMetPercent");
  const firstResponseMedianMinutes = assertNumericField(payload, "firstResponseMedianMinutes");
  const resolutionMedianHours = assertNumericField(payload, "resolutionMedianHours");

  return {
    summary: {
      ticketsHandled: { value: String(ticketsClosed) },
      slaAttainment: { value: `${slaMetPercent.toFixed(1)}%` }
    },
    service: {
      ticketVolume: { value: String(ticketVolume) },
      resolvedTickets: { value: String(ticketsResolved) },
      firstResponseMedian: { value: `${firstResponseMedianMinutes}m` },
      resolutionMedian: { value: `${resolutionMedianHours}h` }
    }
  };
}
