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

export function mapHaloPsaMetrics(payload: HaloAggregateResponse): HaloPsaMetrics {
  return {
    summary: {
      ticketsHandled: { value: String(payload.ticketsClosed) },
      slaAttainment: { value: `${payload.slaMetPercent.toFixed(1)}%` }
    },
    service: {
      ticketVolume: { value: String(payload.ticketVolume) },
      resolvedTickets: { value: String(payload.ticketsResolved) },
      firstResponseMedian: { value: `${payload.firstResponseMedianMinutes}m` },
      resolutionMedian: { value: `${payload.resolutionMedianHours}h` }
    }
  };
}
