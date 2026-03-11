import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import api, { type ApiResponse } from "@/api/client";
import type {
    AnalysisDetail,
    AnalysisListItem,
    AnalysesCreateBody,
    AnalysesCreateBulkBody,
    AnalysesDeleteBody,
    AnalysesDeleteResult,
    AnalysesGetListBody,
    AnalysesUpdateBody,
    AnalysesBulkUpdateBody,
    ListMeta,
} from "@/types/analysis";

type ListResult<T> = {
    data: T;
    meta: ListMeta | null;
};

function assertSuccess<T>(res: ApiResponse<T>): T {
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }
    return res.data as T;
}

function assertSuccessWithMeta<T>(res: ApiResponse<T>): ListResult<T> {
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }

    const rawAny = res as unknown as Record<string, unknown>;
    const meta = (res.meta ?? rawAny.pagination ?? null) as ListMeta | null;

    const normalizedMeta =
        meta && typeof meta === "object"
            ? ({
                  ...meta,
                  page: typeof meta.page === "string" ? parseInt(meta.page as unknown as string, 10) : meta.page,
                  total:
                      typeof (meta as { total?: unknown }).total === "number"
                          ? (meta as { total: number }).total
                          : typeof (meta as { totalItems?: unknown }).totalItems === "number"
                            ? (meta as unknown as { totalItems: number }).totalItems
                            : 0,
              } as ListMeta)
            : null;

    return { data: res.data as T, meta: normalizedMeta };
}

function stableKey(value: unknown): string {
    const seen = new WeakSet<object>();

    const sorter = (_k: string, v: unknown) => {
        if (v && typeof v === "object") {
            const obj = v as object;
            if (seen.has(obj)) return undefined;
            seen.add(obj);

            if (Array.isArray(v)) return v.map((x) => x);

            const entries = Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
            return Object.fromEntries(entries);
        }
        return v;
    };

    return JSON.stringify(value, sorter);
}

const noCacheHeaders = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
} as const;

export type AnalysesGetListInput = {
    query?: AnalysesGetListBody;
};

export type AnalysesCreateInput = {
    body: AnalysesCreateBody;
    query?: Record<string, unknown>;
};

export type AnalysesUpdateInput = {
    body: AnalysesUpdateBody;
    query?: Record<string, unknown>;
};

export type AnalysesBulkUpdateInput = {
    body: AnalysesBulkUpdateBody;
    query?: Record<string, unknown>;
};

export type AnalysesCreateBulkInput = {
    body: AnalysesCreateBulkBody;
    query?: Record<string, unknown>;
};

export type AnalysesDeleteInput = {
    body: AnalysesDeleteBody;
    query?: Record<string, unknown>;
};

export async function analysesGetList(input: AnalysesGetListInput = {}): Promise<ApiResponse<AnalysisListItem[]>> {
    const res = await api.get<AnalysisListItem[]>("/v2/analyses/get/list", {
        query: input.query,
        headers: noCacheHeaders,
    });

    if ("success" in res && res.success === false) return res;

    return {
        ...res,
        data: Array.isArray(res.data) ? res.data : [],
        meta: (res.meta ?? null) as ListMeta | null,
    };
}

export type AnalysesGetDetailInput = { analysisId: string };
export async function analysesGetDetail(input: AnalysesGetDetailInput): Promise<ApiResponse<AnalysisDetail>> {
    return api.get<AnalysisDetail>("/v2/analyses/get/detail", {
        query: { analysisId: input.analysisId },
        headers: noCacheHeaders,
    });
}

export async function analysesGetProcessing(input: AnalysesGetListInput = {}): Promise<ApiResponse<AnalysisListItem[]>> {
    const res = await api.get<AnalysisListItem[]>("/v2/analyses/get/processing", {
        query: input.query,
        headers: noCacheHeaders,
    });

    if ("success" in res && res.success === false) return res;

    return {
        ...res,
        data: Array.isArray(res.data) ? res.data : [],
        meta: (res.meta ?? null) as ListMeta | null,
    };
}

export async function analysesCreate(input: AnalysesCreateInput): Promise<ApiResponse<AnalysisDetail>> {
    return api.post<AnalysisDetail, AnalysesCreateBody>("/v2/analyses/create", {
        body: input.body,
        query: input.query,
    });
}

export async function analysesUpdate(input: AnalysesUpdateInput): Promise<ApiResponse<AnalysisDetail>> {
    return api.post<AnalysisDetail, AnalysesUpdateBody>("/v2/analyses/update", {
        body: input.body,
        query: input.query,
    });
}

export async function analysesUpdateBulk(input: AnalysesBulkUpdateInput): Promise<ApiResponse<void>> {
    return api.post<void, AnalysesBulkUpdateBody>("/v2/analyses/update/bulk", {
        body: input.body,
        query: input.query,
    });
}

export async function analysesCreateBulk(input: AnalysesCreateBulkInput): Promise<ApiResponse<AnalysisDetail[]>> {
    return api.post<AnalysisDetail[], AnalysesCreateBulkBody>("/v2/analyses/create/bulk", {
        body: input.body,
        query: input.query,
    });
}

export type HandoverPdfInput = {
    analyses: string[];
    html: string;
    handoverBy?: string;
    receivedBy?: string;
    filename?: string;
};

export async function analysesGenerateHandoverPdf(input: HandoverPdfInput): Promise<Blob> {
    const response = await api.postRaw<Blob, HandoverPdfInput>("/v2/analyses/generate/handover-pdf", {
        body: input,
        responseType: "blob",
    });
    return response;
}

function coerceDeleteResult(data: unknown): AnalysesDeleteResult | null {
    if (data && typeof data === "object" && "analysisId" in data && typeof (data as { analysisId?: unknown }).analysisId === "string") {
        return data as AnalysesDeleteResult;
    }

    if (data && typeof data === "object" && "receiptId" in data && typeof (data as { receiptId?: unknown }).receiptId === "string") {
        const receiptId = (data as { receiptId: string }).receiptId;
        const deletedAt = typeof (data as { deletedAt?: unknown }).deletedAt === "string" ? (data as unknown as { deletedAt: string }).deletedAt : "";

        const deletedBy = (data as { deletedBy?: unknown }).deletedBy;

        return {
            analysisId: receiptId,
            deletedAt,
            deletedBy: deletedBy as AnalysesDeleteResult["deletedBy"],
        };
    }

    return null;
}

export async function analysesDelete(input: AnalysesDeleteInput): Promise<ApiResponse<AnalysesDeleteResult>> {
    const res = await api.post<AnalysesDeleteResult, AnalysesDeleteBody>("/v2/analyses/delete", { body: input.body, query: input.query });

    if ("success" in res && res.success === false) return res;

    const coerced = coerceDeleteResult(res.data);
    return coerced ? { ...res, data: coerced } : res;
}

export type AnalysesFilterFrom = "analysisStatus" | "analysisResultStatus" | "parameterName" | "parameterId" | "matrixId" | "sampleId" | "technicianId" | "protocolCode" | "analysisLocation";

export type AnalysesFilterOtherFilter = {
    filterFrom: AnalysesFilterFrom;
    filterValues: Array<string | number>;
};

export type AnalysesFilterBody = {
    filterFrom: AnalysesFilterFrom;
    textFilter: string | null;
    otherFilters: AnalysesFilterOtherFilter[];
    limit: number;
};

export type AnalysesFilterItem = {
    filterValue: string;
    count: number;
};

export type AnalysesFilterInput = {
    body: AnalysesFilterBody;
};

export async function analysesFilter(input: AnalysesFilterInput): Promise<ApiResponse<AnalysesFilterItem[]>> {
    return api.post<AnalysesFilterItem[]>("/v2/analyses/filter", {
        body: input.body,
    });
}

export const analysesKeys = {
    all: ["analyses"] as const,

    lists: () => [...analysesKeys.all, "list"] as const,
    list: (input?: AnalysesGetListInput) => [...analysesKeys.lists(), stableKey(input ?? {})] as const,

    details: () => [...analysesKeys.all, "detail"] as const,
    detail: (analysisId: string | null) => [...analysesKeys.details(), { analysisId }] as const,

    filter: (input: AnalysesFilterInput) => [...analysesKeys.all, "filter", stableKey(input)] as const,
} as const;

export function useAnalysesList(input?: AnalysesGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: analysesKeys.list(input),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccessWithMeta(await analysesGetList(input ?? {})),
    });
}

export function useAnalysisDetail(input: AnalysesGetDetailInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: analysesKeys.detail(input.analysisId),
        enabled: (opts?.enabled ?? true) && Boolean(input.analysisId),
        retry: false,
        queryFn: async () => assertSuccess(await analysesGetDetail(input)),
    });
}

export function useAnalysesProcessing(input?: AnalysesGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...analysesKeys.lists(), "processing", stableKey(input ?? {})],
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccessWithMeta(await analysesGetProcessing(input ?? {})),
    });
}

export function useAnalysesFilter(input: AnalysesFilterInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: analysesKeys.filter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccess(await analysesFilter(input)),
    });
}

export function useCreateAnalysis() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: AnalysesCreateInput) => assertSuccess(await analysesCreate(input)),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
            toast.success(t("common.toast.success"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useUpdateAnalysis() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: AnalysesUpdateInput) => assertSuccess(await analysesUpdate(input)),

        onSuccess: async (updated) => {
            const analysisId = (updated as unknown as { analysisId?: string }).analysisId ?? null;

            if (analysisId) {
                qc.setQueriesData({ queryKey: [...analysesKeys.all, "detail"], exact: false }, updated);
            }

            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
            toast.success(t("common.toast.success"));
        },

        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useDeleteAnalysis() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: AnalysesDeleteInput) => assertSuccess(await analysesDelete(input)),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
            toast.success(t("common.toast.deleted"));
        },

        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useGenerateHandoverPdf() {
    return useMutation({
        mutationFn: (input: HandoverPdfInput) => analysesGenerateHandoverPdf(input),
        onError: (error) => {
            console.error("Failed to generate PDF:", error);
            toast.error("Không thể xuất file PDF. Vui lòng thử lại.");
        },
    });
}

export function useAnalysesUpdateBulk() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: AnalysesBulkUpdateInput) => assertSuccess(await analysesUpdateBulk(input)),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
            toast.success(t("common.toast.success"));
        },

        onError: (err: unknown) => {
            console.error("Bulk update failed:", err);
            toast.error(t("common.toast.failed"));
        },
    });
}

export function useAnalysesCreateBulk() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: AnalysesCreateBulkInput) => assertSuccess(await analysesCreateBulk(input)),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
            toast.success(t("common.toast.success"));
        },

        onError: (err: unknown) => {
            console.error("Bulk create failed:", err);
            toast.error(t("common.toast.failed"));
        },
    });
}
