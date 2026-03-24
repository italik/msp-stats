export type DattoRmmResponse = {
  patchCompliance: number;
  devices: {
    fullyPatched: number;
    missingCriticalPatches: number;
  };
};

type MetricValue = {
  value: string;
};

export type DattoRmmMetrics = {
  summary: {
    patchCompliance: MetricValue;
  };
  security: {
    devicesFullyPatched: number;
    devicesMissingCriticalPatches: number;
  };
};

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Datto RMM payload missing or invalid numeric field \"${field}\"`);
  }
  return value;
}

export function mapDattoRmmMetrics(payload: DattoRmmResponse): DattoRmmMetrics {
  const patchCompliance = assertNumber(payload?.patchCompliance, "patchCompliance");
  const fullyPatched = assertNumber(payload?.devices?.fullyPatched, "devices.fullyPatched");
  const missingCritical = assertNumber(
    payload?.devices?.missingCriticalPatches,
    "devices.missingCriticalPatches"
  );

  return {
    summary: {
      patchCompliance: { value: `${(patchCompliance * 100).toFixed(1)}%` }
    },
    security: {
      devicesFullyPatched: fullyPatched,
      devicesMissingCriticalPatches: missingCritical
    }
  };
}
