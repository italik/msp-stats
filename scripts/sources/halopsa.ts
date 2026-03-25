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
    ticketsClosed
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
