export const samplesKeys = {
    all: ["operations", "samples"] as const,
    list: (
      query: Record<string, unknown> | undefined,
      sort?: Record<string, unknown> | undefined,
    ) => ["operations", "samples", "list", query ?? {}, sort ?? {}] as const,
    detail: (sampleId: string) => ["operations", "samples", "detail", sampleId] as const,
  } as const;
  