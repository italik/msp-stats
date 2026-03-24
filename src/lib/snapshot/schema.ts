import { z } from "zod";

const numericString = z.union([z.string(), z.number()]);

const trendPointSchema = z.object({
  date: z.string(),
  value: z.number()
});

const trendMapSchema = z.object({}).catchall(z.array(trendPointSchema));

const kpiSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: numericString,
  context: z.string().optional(),
  direction: z.enum(["up", "down", "steady"]).optional()
});

const metricSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: numericString,
  context: z.string().optional(),
  direction: z.enum(["up", "down", "steady"]).optional()
});

const currentEntrySchema = z.object({
  label: z.string(),
  value: numericString,
  context: z.string().optional()
});

const serviceCurrentSchema = z
  .object({
    slaAttainment: currentEntrySchema,
    resolvedTickets: currentEntrySchema
  })
  .catchall(currentEntrySchema);

const securityCurrentSchema = z
  .object({
    patchCompliance: currentEntrySchema,
    devicesFullyPatched: currentEntrySchema
  })
  .catchall(currentEntrySchema);

const statusSchema = z.enum(["current", "stale"]);

export const snapshotSchema = z.object({
  generatedAt: z.string(),
  overall: z.object({
    lastUpdated: z.string()
  }),
  summary: z.object({
    title: z.string(),
    kpis: z.array(kpiSchema)
  }),
  service: z.object({
    current: serviceCurrentSchema,
    metrics: z.array(metricSchema),
    trends: trendMapSchema
  }),
  security: z.object({
    current: securityCurrentSchema,
    metrics: z.array(metricSchema),
    trends: trendMapSchema
  }),
  sources: z.array(
    z.object({
      name: z.string(),
      status: statusSchema,
      lastSuccessfulRefresh: z.string().optional(),
      note: z.string().optional()
    })
  )
});
