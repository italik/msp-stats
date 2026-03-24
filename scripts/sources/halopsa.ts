export type HaloAggregateResponse = {
  ticketVolume: number;
  ticketsClosed: number;
  ticketsResolved: number;
  slaMetPercent: number;
  firstResponseMedianMinutes: number;
  resolutionMedianHours: number;
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
