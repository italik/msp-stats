import type { SourceResult } from "./sources/types";

type FetchAllSourcesResult = {
  halopsa: SourceResult<unknown>;
  qualys: SourceResult<unknown>;
  dattoRmm: SourceResult<unknown>;
};

export async function fetchHaloPsaMetrics(): Promise<SourceResult<unknown>> {
  return {
    status: "stale",
    fetchedAt: new Date(0).toISOString(),
    note: "HaloPSA metrics fetch not implemented",
    data: undefined
  };
}

export async function fetchQualysMetrics(): Promise<SourceResult<unknown>> {
  return {
    status: "stale",
    fetchedAt: new Date(0).toISOString(),
    note: "Qualys metrics fetch not implemented",
    data: undefined
  };
}

export async function fetchDattoRmmMetrics(): Promise<SourceResult<unknown>> {
  return {
    status: "stale",
    fetchedAt: new Date(0).toISOString(),
    note: "Datto RMM metrics fetch not implemented",
    data: undefined
  };
}

export async function fetchAllSources(): Promise<FetchAllSourcesResult> {
  return {
    halopsa: await fetchHaloPsaMetrics(),
    qualys: await fetchQualysMetrics(),
    dattoRmm: await fetchDattoRmmMetrics()
  };
}
