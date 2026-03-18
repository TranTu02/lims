import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import api, { type ApiResponse } from "@/api/client";
import type { SampleDetail, SampleListItem, SamplesCreateBody, SamplesUpdateBody, SamplesBulkUpdateBody } from "@/types/sample";

export type SamplesGetListQuery = {
    page?: number;
    itemsPerPage?: number;
    sortColumn?: string | null;
    sortDirection?: "ASC" | "DESC" | string;
    search?: string | null;

    receiptId?: string;
    sampleStatus?: string | string[];
    sampleStorageLoc?: string | string[];
    sampleMarks?: string[];

    [key: string]: unknown;
};

export type SamplesGetListInput = {
    query?: SamplesGetListQuery;
    sort?: Record<string, unknown>;
};

const noCacheHeaders = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
} as const;

export async function samplesGetList(input: SamplesGetListInput = {}): Promise<ApiResponse<SampleListItem[]>> {
    const { query, sort } = input;
    const finalQuery: Record<string, unknown> = { ...(query ?? {}) };

    if (sort) {
        if (sort.column) finalQuery.sortColumn = sort.column;
        if (sort.direction) finalQuery.sortDirection = sort.direction;
    }

    return api.get<SampleListItem[]>("/v2/samples/get/list", {
        query: finalQuery,
        headers: noCacheHeaders,
    });
}

export type SamplesGetFullInput = { sampleId: string };

export async function samplesGetFull(input: SamplesGetFullInput): Promise<ApiResponse<SampleDetail>> {
    return api.get<SampleDetail>("/v2/samples/get/full", {
        query: input,
        headers: noCacheHeaders,
    });
}

export async function samplesGetProcessing(input: SamplesGetListInput = {}): Promise<ApiResponse<SampleListItem[]>> {
    const { query, sort } = input;
    const finalQuery: Record<string, unknown> = { ...(query ?? {}) };

    if (sort) {
        if (sort.column) finalQuery.sortColumn = sort.column;
        if (sort.direction) finalQuery.sortDirection = sort.direction;
    }

    return api.get<SampleListItem[]>("/v2/samples/get/processing", {
        query: finalQuery,
        headers: noCacheHeaders,
    });
}

export async function samplesCreate(body: SamplesCreateBody): Promise<ApiResponse<SampleDetail>> {
    return api.post<SampleDetail, SamplesCreateBody>("/v2/samples/create", {
        body,
    });
}

export async function samplesCreateFull(body: any): Promise<ApiResponse<SampleDetail>> {
    return api.post<SampleDetail, any>("/v2/samples/create/full", {
        body,
    });
}

export async function samplesUpdate(body: SamplesUpdateBody): Promise<ApiResponse<SampleDetail>> {
    return api.post<SampleDetail, SamplesUpdateBody>("/v2/samples/update", {
        body,
    });
}

export type SamplesBulkUpdateResult = {
    updatedCount: number;
    [key: string]: unknown;
};

export async function samplesBulkUpdate(body: SamplesBulkUpdateBody): Promise<ApiResponse<SamplesBulkUpdateResult>> {
    return api.post<SamplesBulkUpdateResult, SamplesBulkUpdateBody>("/v2/samples/bulk-update", {
        body,
    });
}

export type ApiMeta = {
    page: number;
    itemsPerPage: number;

    total?: number;

    totalPages: number;
    [k: string]: unknown;
};

export type ListResult<T> = {
    data: T;
    meta: ApiMeta | null;
};

function assertSuccess<T>(res: ApiResponse<T>): T {
    // Backend list endpoints return { data, pagination } without `success`
    // Mutation endpoints return { success, statusCode, data, meta, error }
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
    const meta = (res.meta ?? rawAny.pagination ?? null) as ApiMeta | null;

    if (!meta) return { data: res.data as T, meta: null };

    const total = typeof meta.total === "number" ? meta.total : (meta as any).totalItems ?? 0;
    const itemsPerPage = typeof meta.itemsPerPage === "number" ? meta.itemsPerPage : 10;
    const totalPages = typeof meta.totalPages === "number" ? meta.totalPages : Math.ceil(total / itemsPerPage);

    const normalizedMeta: ApiMeta = {
        ...meta,
        page: typeof meta.page === "string" ? parseInt(meta.page as unknown as string, 10) : meta.page || 1,
        total,
        totalPages,
        itemsPerPage,
    };

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

export type SamplesFilterFrom = "sampleStatus" | "receiptId" | "sampleTypeId" | "sampleTypeName" | "productType" | "sampleStorageLoc";

export type SamplesFilterOtherFilter = {
    filterFrom: SamplesFilterFrom;
    filterValues: Array<string | number>;
};

export type SamplesFilterBody = {
    filterFrom: SamplesFilterFrom;
    textFilter: string | null;
    otherFilters: SamplesFilterOtherFilter[];
    limit: number;
};

export type SamplesFilterItem = {
    filterValue: string;
    count: number;
};

export type SamplesFilterInput = {
    body: SamplesFilterBody;
};

export async function samplesFilter(input: SamplesFilterInput): Promise<ApiResponse<SamplesFilterItem[]>> {
    return api.post<SamplesFilterItem[]>("/v2/samples/filter", {
        body: input.body,
    });
}

export type SamplesDeleteBody = {
    sampleId: string;
    [key: string]: unknown;
};

export type SamplesDeleteResult = {
    sampleId?: string;
    [key: string]: unknown;
};

export type SamplesDeleteInput = {
    body: SamplesDeleteBody;
    query?: Record<string, unknown>;
};

export async function samplesDelete(input: SamplesDeleteInput): Promise<ApiResponse<SamplesDeleteResult>> {
    return api.post<SamplesDeleteResult, SamplesDeleteBody>("/v2/samples/delete", {
        body: input.body,
        query: input.query,
    });
}

export const samplesKeys = {
    all: ["operations", "samples"] as const,

    list: (input?: SamplesGetListInput) => [...samplesKeys.all, "list", stableKey(input ?? {})] as const,

    full: (input: SamplesGetFullInput) => [...samplesKeys.all, "full", input.sampleId] as const,

    filter: (input: SamplesFilterInput) => [...samplesKeys.all, "filter", stableKey(input.body)] as const,

    allPages: (input?: SamplesGetListInput) => [...samplesKeys.all, "allPages", stableKey(input ?? {})] as const,
} as const;

export function useSamplesList(input?: SamplesGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: samplesKeys.list(input),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccessWithMeta(await samplesGetList(input ?? {})),
    });
}

export function useSampleFull(input: SamplesGetFullInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: samplesKeys.full(input),
        enabled: (opts?.enabled ?? true) && Boolean(input.sampleId),
        retry: false,
        queryFn: async () => {
            const raw = await api.getRaw<unknown>("/v2/samples/get/full", {
                query: input,
                headers: noCacheHeaders,
            });
            if (raw && typeof raw === "object") {
                if ("success" in raw && "data" in raw) {
                    if ((raw as any).success === false) throw new Error((raw as any).error?.message || "Unknown error");
                    return (raw as any).data as SampleDetail;
                }
                return raw as SampleDetail;
            }
            throw new Error("Invalid response format");
        },
    });
}

export function useSamplesProcessing(input?: SamplesGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...samplesKeys.list(input), "processing"],
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccessWithMeta(await samplesGetProcessing(input ?? {})),
    });
}

export function useSamplesFilter(input: SamplesFilterInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: samplesKeys.filter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccess(await samplesFilter(input)),
    });
}

export async function samplesGetAllPages(input: SamplesGetListInput = {}): Promise<ListResult<SampleListItem[]>> {
    const first = await samplesGetList(input);
    const firstRes = assertSuccessWithMeta(first);

    const totalPages = firstRes.meta?.totalPages ?? 1;
    const all: SampleListItem[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

    for (let p = 2; p <= totalPages; p += 1) {
        const res = await samplesGetList({
            query: { ...(input.query ?? {}), page: p },
            sort: input.sort,
        });
        const pageRes = assertSuccessWithMeta(res);
        if (Array.isArray(pageRes.data)) all.push(...pageRes.data);
    }

    return { data: all, meta: firstRes.meta ?? null };
}

export function useSamplesAll(input?: SamplesGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: samplesKeys.allPages(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => samplesGetAllPages(input ?? {}),
    });
}

async function invalidateSamplesLists(qc: ReturnType<typeof useQueryClient>) {
    await qc.invalidateQueries({
        queryKey: [...samplesKeys.all, "list"],
        exact: false,
        refetchType: "active",
    });

    await qc.invalidateQueries({
        queryKey: [...samplesKeys.all, "allPages"],
        exact: false,
        refetchType: "active",
    });
}

export function useCreateSample() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (body: SamplesCreateBody) => assertSuccess(await samplesCreate(body)),

        onSuccess: async () => {
            await invalidateSamplesLists(qc);
            toast.success(t("reception.samples.createSuccess"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useUpdateSample() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (body: SamplesUpdateBody) => assertSuccess(await samplesUpdate(body)),

        onSuccess: async (updated) => {
            const sampleId = (updated as { sampleId?: string }).sampleId;

            if (typeof sampleId === "string" && sampleId) {
                qc.setQueryData(samplesKeys.full({ sampleId }), updated);
            }

            await invalidateSamplesLists(qc);
            toast.success(t("reception.samples.updateSuccess"));
        },

        onError: () => toast.error(t("reception.samples.updateError")),
    });
}

export function useBulkUpdateSamples() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (body: SamplesBulkUpdateBody) => assertSuccess(await samplesBulkUpdate(body)),

        onSuccess: async () => {
            await invalidateSamplesLists(qc);
            toast.success(String(t("inventory.samples.bulkUpdateSuccess", { defaultValue: "Cập nhật hàng loạt thành công!" })));
        },

        onError: (err: any) => {
            toast.error(err?.message || String(t("inventory.samples.bulkUpdateError", { defaultValue: "Cập nhật hàng loạt thất bại!" })));
        },
    });
}

export function useDeleteSample() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: SamplesDeleteInput) => assertSuccess(await samplesDelete(input)),

        onMutate: async (vars) => {
            const sampleId = vars.body.sampleId?.trim() ?? "";
            if (!sampleId) {
                return { sampleId: "", snapshot: [] as Array<[unknown, unknown]> };
            }

            await qc.cancelQueries({ queryKey: samplesKeys.all, exact: false });

            const snapshot = qc.getQueriesData({
                queryKey: samplesKeys.all,
                exact: false,
            });

            qc.setQueriesData(
                {
                    predicate: (q) => {
                        const k = q.queryKey;
                        return Array.isArray(k) && k[0] === "operations" && k[1] === "samples" && (k[2] === "list" || k[2] === "allPages");
                    },
                },
                (old) => removeSampleFromCachedList(old, sampleId),
            );

            qc.removeQueries({
                queryKey: [...samplesKeys.all, "full", sampleId],
                exact: true,
            });

            return { sampleId, snapshot };
        },

        onError: (_err, _vars, ctx) => {
            const snap = ctx as { snapshot?: Array<[unknown, unknown]> } | undefined;

            if (snap?.snapshot) {
                for (const [key, data] of snap.snapshot) {
                    if (Array.isArray(key)) qc.setQueryData(key, data);
                }
            }

            toast.error(t("common.toast.failed"));
        },

        onSuccess: () => {
            toast.success(t("common.toast.deleted"));
        },

        onSettled: async () => {
            await invalidateSamplesLists(qc);
        },
    });
}

function removeSampleFromCachedList(old: unknown, sampleId: string): unknown {
    if (old && typeof old === "object" && "data" in (old as Record<string, unknown>)) {
        const cur = old as { data: SampleListItem[]; meta?: unknown | null };
        return {
            ...cur,
            data: (cur.data ?? []).filter((x) => x.sampleId !== sampleId),
        };
    }
    if (Array.isArray(old)) {
        return (old as SampleListItem[]).filter((x) => x.sampleId !== sampleId);
    }
    return old;
}
