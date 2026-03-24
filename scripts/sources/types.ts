export type SourceResult<T> = {
  status: "current" | "stale";
  fetchedAt: string;
  note?: string;
  data?: T;
};
