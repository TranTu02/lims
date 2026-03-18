import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import api, { type ApiResponse } from "@/api/client";
import type { ReceiptDetail, ReceiptListItem, ReceiptDeleteResult, ReceiptsCreateBody, ReceiptsCreateFullBody, ReceiptsUpdateBody, ReceiptsDeleteBody } from "@/types/receipt";

export type StandardListQuery = {
    page?: number;
    itemsPerPage?: number;

    search?: string | null;

    sortColumn?: string | null;
    sortDirection?: string | null;

    filters?: Record<string, unknown>;

    [key: string]: unknown;
};

export type ReceiptsGetListInput = {
    query?: StandardListQuery;
    sort?: Record<string, unknown>;
};

export type ReceiptsGetFullInput = {
    receiptId: string;
    query?: Record<string, unknown>;
};

export type ReceiptsCreateInput = {
    body: ReceiptsCreateBody;
    query?: Record<string, unknown>;
};

export type ReceiptsCreateFullInput = {
    body: ReceiptsCreateFullBody;
    query?: Record<string, unknown>;
};

export type ReceiptsUpdateInput = {
    body: ReceiptsUpdateBody;
    query?: Record<string, unknown>;
};

export type ReceiptsDeleteInput = {
    body: ReceiptsDeleteBody;
    query?: Record<string, unknown>;
};

export type ReceiptsExportReportBody = {
    receiptId: string;
    sampleId: string;
    preview: boolean;
    headerHtml: string;
    contentHtml: string;
    replacedByReportId?: string;
};

export type ApiMeta = {
    page: number;
    itemsPerPage: number;

    total?: number;

    totalPages: number;
    [k: string]: unknown;
};

export type ApiError = {
    code: string;
    message: string;
    traceId?: string;
    [k: string]: unknown;
};

export type ListResult<T> = {
    data: T;
    meta: ApiMeta | null;
};

function assertSuccess<T>(res: ApiResponse<T> | any): T {
    if (res?.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }

    if (res?.data !== undefined) {
        return res.data as T;
    }

    return res as T;
}

function assertSuccessWithMeta<T>(res: ApiResponse<T> | any): ListResult<T> {
    if (res?.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }

    const meta = (res?.meta ?? res?.pagination ?? null) as ApiMeta | null;

    const normalizedMeta =
        meta && typeof meta === "object"
            ? {
                  ...meta,
                  total: typeof meta.total === "number" ? meta.total : (meta as any).totalItems ?? 0,
              }
            : null;

    return {
        data: (res?.data !== undefined ? res.data : res) as T,
        meta: normalizedMeta,
    };
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

export async function receiptsGetList(input: ReceiptsGetListInput = {}): Promise<ApiResponse<ReceiptListItem[]>> {
    const { query, sort } = input;
    const finalQuery: StandardListQuery = { ...(query ?? {}) };

    if (sort) {
        if (sort.column) finalQuery.sortColumn = String(sort.column);
        if (sort.direction) finalQuery.sortDirection = String(sort.direction);
    }

    return api.get<ReceiptListItem[], StandardListQuery>("/v2/receipts/get/list", {
        query: finalQuery,
        headers: noCacheHeaders,
    });
}

export async function receiptsGetProcessing(input: ReceiptsGetListInput = {}): Promise<ApiResponse<ReceiptDetail[]>> {
    const { query, sort } = input;
    const finalQuery: StandardListQuery = { ...(query ?? {}) };

    if (sort) {
        if (sort.column) finalQuery.sortColumn = String(sort.column);
        if (sort.direction) finalQuery.sortDirection = String(sort.direction);
    }

    return api.get<ReceiptDetail[], StandardListQuery>("/v2/receipts/get/processing", {
        query: finalQuery,
        headers: noCacheHeaders,
    });
}

export async function receiptsGetFull(input: ReceiptsGetFullInput): Promise<ApiResponse<ReceiptDetail>> {
    const { receiptId, query } = input;
    return api.get<ReceiptDetail>("/v2/receipts/get/full", {
        query: { receiptId, ...(query ?? {}) },
        headers: noCacheHeaders,
    });
}

export async function receiptsCreate(input: ReceiptsCreateInput): Promise<ApiResponse<ReceiptDetail>> {
    const { body, query } = input;
    return api.post<ReceiptDetail, ReceiptsCreateBody>("/v2/receipts/create", {
        body,
        query,
    });
}

export async function receiptsCreateFull(input: ReceiptsCreateFullInput): Promise<ApiResponse<ReceiptDetail>> {
    const { body, query } = input;
    return api.post<ReceiptDetail, ReceiptsCreateFullBody>("/v2/receipts/create/full", {
        body,
        query,
    });
}

export async function receiptsUpdate(input: ReceiptsUpdateInput): Promise<ApiResponse<ReceiptDetail>> {
    const { body, query } = input;
    return api.post<ReceiptDetail, ReceiptsUpdateBody>("/v2/receipts/update", {
        body,
        query,
    });
}

export async function receiptsDelete(input: ReceiptsDeleteInput): Promise<ApiResponse<ReceiptDeleteResult>> {
    const { body, query } = input;
    return api.post<ReceiptDeleteResult, ReceiptsDeleteBody>("/v2/receipts/delete", {
        body,
        query,
    });
}

export async function receiptsExportReport(input: { body: ReceiptsExportReportBody }): Promise<ApiResponse<{ base64?: string; pdfBase64?: string; reportId?: string; documentId?: string; fileId?: string }>> {
    return api.post("/v2/receipts/export/report", {
        body: input.body,
    });
}

export type ReceiptsFilterFrom = "receiptStatus" | "clientId" | "receiptCode" | "receiptDeliveryMethod" | "receiptPriority";

export type ReceiptsFilterOtherFilter = {
    filterFrom: ReceiptsFilterFrom;
    filterValues: Array<string | number>;
};

export type ReceiptsFilterBody = {
    filterFrom: ReceiptsFilterFrom;
    textFilter: string | null;
    otherFilters: ReceiptsFilterOtherFilter[];
    limit: number;
};

export type ReceiptsFilterItem = {
    filterValue: string;
    count: number;
};

export type ReceiptsFilterInput = {
    body: ReceiptsFilterBody;
};

export async function receiptsFilter(input: ReceiptsFilterInput): Promise<ApiResponse<ReceiptsFilterItem[]>> {
    return api.post<ReceiptsFilterItem[]>("/v2/receipts/filter", {
        body: input.body,
    });
}

export const receiptsKeys = {
    all: ["receipts"] as const,

    list: (input?: ReceiptsGetListInput) => [...receiptsKeys.all, "list", stableKey(input ?? {})] as const,

    full: (input: ReceiptsGetFullInput) => [...receiptsKeys.all, "full", input.receiptId, stableKey(input.query ?? {})] as const,

    filter: (input: ReceiptsFilterInput) => [...receiptsKeys.all, "filter", stableKey(input)] as const,
};

export function useReceiptsList(input?: ReceiptsGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: receiptsKeys.list(input),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccessWithMeta(await receiptsGetList(input ?? {})),
    });
}

export function useReceiptsProcessing(input?: ReceiptsGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...receiptsKeys.all, "processing", stableKey(input ?? {})] as const,
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccessWithMeta(await receiptsGetProcessing(input ?? {})),
    });
}

export function useReceiptFull(input: ReceiptsGetFullInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: receiptsKeys.full(input),
        enabled: (opts?.enabled ?? true) && Boolean(input.receiptId),
        retry: false,
        queryFn: async () => assertSuccess(await receiptsGetFull(input)),
    });
}

export function useReceiptsFilter(input: ReceiptsFilterInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: receiptsKeys.filter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccess(await receiptsFilter(input)),
    });
}

export function useCreateReceipt() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: ReceiptsCreateInput) => assertSuccess(await receiptsCreate(input)),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: receiptsKeys.all, exact: false });
            toast.success(t("reception.receipts.createSuccess"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useCreateReceiptFull() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: ReceiptsCreateFullInput) => assertSuccess(await receiptsCreateFull(input)),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: receiptsKeys.all, exact: false });
            toast.success(t("reception.receipts.createSuccess"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useUpdateReceipt() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: ReceiptsUpdateInput) => assertSuccess(await receiptsUpdate(input)),

        onSuccess: async (updated) => {
            const receiptId = (updated as unknown as { receiptId?: string }).receiptId;

            if (typeof receiptId === "string" && receiptId) {
                qc.setQueriesData({ queryKey: [...receiptsKeys.all, "full", receiptId], exact: false }, updated);
            }

            await qc.invalidateQueries({ queryKey: receiptsKeys.all, exact: false });
            toast.success(t("reception.receipts.updateSuccess"));
        },

        onError: () => toast.error(t("reception.receipts.updateError")),
    });
}

export function useDeleteReceipt() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: ReceiptsDeleteInput) => assertSuccess(await receiptsDelete(input)),

        onMutate: async (vars) => {
            const receiptId = (vars.body as unknown as { receiptId?: string }).receiptId ?? "";

            if (!receiptId) return { receiptId: "" };

            await qc.cancelQueries({ queryKey: receiptsKeys.all, exact: false });

            const snapshot = qc.getQueriesData({ queryKey: receiptsKeys.all, exact: false });

            qc.setQueriesData(
                {
                    predicate: (q) => {
                        const k = q.queryKey;
                        return Array.isArray(k) && k[0] === "receipts" && (k[1] === "all" || k[1] === "list");
                    },
                },
                (old) => removeReceiptFromCachedList(old, receiptId),
            );

            qc.removeQueries({
                queryKey: [...receiptsKeys.all, "full", receiptId],
                exact: false,
            });

            return { receiptId, snapshot };
        },

        onError: (_err, _vars, ctx) => {
            const snap = ctx as { snapshot?: Array<[unknown, unknown]> } | undefined;
            if (snap?.snapshot) {
                for (const [key, data] of snap.snapshot) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    qc.setQueryData(key as any, data);
                }
            }
            toast.error(t("common.toast.failed"));
        },

        onSuccess: () => {
            toast.success(t("common.toast.deleted"));
        },

        onSettled: async () => {
            await qc.invalidateQueries({ queryKey: receiptsKeys.all, exact: false, refetchType: "active" });
        },
    });
}

export function useExportReport() {
    return useMutation({
        mutationFn: async (input: { body: ReceiptsExportReportBody }) => assertSuccess(await receiptsExportReport(input)),
    });
}

function removeReceiptFromCachedList(old: unknown, receiptId: string): unknown {
    if (old && typeof old === "object" && "data" in (old as Record<string, unknown>)) {
        const cur = old as { data: ReceiptListItem[]; meta?: unknown | null };
        return { ...cur, data: (cur.data ?? []).filter((x) => x.receiptId !== receiptId) };
    }
    if (Array.isArray(old)) {
        return (old as ReceiptListItem[]).filter((x) => x.receiptId !== receiptId);
    }
    return old;
}

export function useReceiptsAll(input?: { query?: StandardListQuery; sort?: Record<string, unknown> }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...receiptsKeys.all, "all", stableKey(input ?? {})] as const,
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => {
            const first = await receiptsGetList(input ?? {});
            const firstRes = assertSuccessWithMeta(first);

            const totalPages = firstRes.meta?.totalPages ?? 1;
            const all: ReceiptListItem[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const res = await receiptsGetList({
                    query: { ...(input?.query ?? {}), page: p },
                    sort: input?.sort,
                });
                const pageRes = assertSuccessWithMeta(res);
                if (Array.isArray(pageRes.data)) all.push(...pageRes.data);
            }

            return { data: all, meta: firstRes.meta ?? null };
        },
    });
}
