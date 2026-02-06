export const analysesKeys = {
    all: ["analyses"] as const,
  
    lists: () => [...analysesKeys.all, "list"] as const,
    list: (body?: unknown, query?: unknown) =>
      [...analysesKeys.lists(), { body: body ?? null, query: query ?? null }] as const,
  
    details: () => [...analysesKeys.all, "detail"] as const,
    detail: (analysisId: string | null) =>
      [...analysesKeys.details(), { analysisId }] as const,
  };
  