import api, { type ApiResponse } from "@/api/client";
import type {
  AnalysisDetail,
  AnalysisListItem,
  AnalysesCreateBody,
  AnalysesDeleteBody,
  AnalysesDeleteResult,
  AnalysesUpdateBody,
  ListMeta,
} from "@/types/analysis";

export type AnalysesGetListQuery = {
  page?: number;
  itemsPerPage?: number;
  sampleId?: string;
  parameterName?: string;
  analysisStatus?: string;
  analysisResultStatus?: string;
  [key: string]: unknown;
};

export type AnalysesGetListInput = {
  query?: AnalysesGetListQuery;
};

export async function analysesGetList(
  input: AnalysesGetListInput = {}
): Promise<ApiResponse<AnalysisListItem[]>> {
  const res = await api.get<AnalysisListItem[]>("/v2/analyses/get/list", {
    query: input.query,
    headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
  });

  if (!res.success) return res;

  return {
    ...res,
    data: Array.isArray(res.data) ? res.data : [],
    meta: (res.meta ?? null) as ListMeta | null,
  };
}
export type AnalysesCreateInput = {
  body: AnalysesCreateBody;
  query?: Record<string, unknown>;
};

export async function analysesCreate(
  input: AnalysesCreateInput
): Promise<ApiResponse<AnalysisDetail>> {
  const res = await api.post<AnalysisDetail, AnalysesCreateBody>(
    "/v2/analyses/create",
    {
      body: input.body,
      query: input.query,
    }
  );

  if (!res.success) return res;
  return res;
}

export type AnalysesUpdateInput = {
  body: AnalysesUpdateBody;
  query?: Record<string, unknown>;
};

export async function analysesUpdate(
  input: AnalysesUpdateInput
): Promise<ApiResponse<AnalysisDetail>> {
  const res = await api.post<AnalysisDetail, AnalysesUpdateBody>(
    "/v2/analyses/update",
    {
      body: input.body,
      query: input.query,
    }
  );

  if (!res.success) return res;
  return res;
}

export type AnalysesDeleteInput = {
  body: AnalysesDeleteBody;
  query?: Record<string, unknown>;
};

export async function analysesDelete(
  input: AnalysesDeleteInput
): Promise<ApiResponse<AnalysesDeleteResult>> {
  const res = await api.post<AnalysesDeleteResult, AnalysesDeleteBody>(
    "/v2/analyses/delete",
    {
      body: input.body,
      query: input.query,
    }
  );

  if (!res.success) return res;

  const raw = res.data as unknown as
    | AnalysesDeleteResult
    | { receiptId?: string; deletedAt?: string; deletedBy?: unknown }
    | undefined;

  if (raw && typeof (raw as { receiptId?: unknown }).receiptId === "string") {
    return {
      ...res,
      data: {
        analysisId: (raw as { receiptId: string }).receiptId,
        deletedAt: (raw as { deletedAt?: string }).deletedAt ?? "",
        deletedBy: (raw as { deletedBy?: AnalysesDeleteResult["deletedBy"] })
          .deletedBy as AnalysesDeleteResult["deletedBy"],
      },
    };
  }

  return res;
}
