import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/api/client";
import type { ApiResponse, ApiMeta } from "@/api/client";

export type SortDirection = "ASC" | "DESC";

export type ListQuery = {
    page?: number;
    itemsPerPage?: number;
    search?: string | null;
    labSkuType?: string[] | null;
    labInventoryStatus?: string[] | null;
};

export type ListSort = {
    column?: string;
    direction?: SortDirection;
};

export type ListResult<T> = {
    data: T;
    meta: ApiMeta | null;
};

function assertSuccessWithMeta<T>(res: ApiResponse<T>): ListResult<T> {
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }
    const rawAny = res as unknown as Record<string, unknown>;
    const meta = (res.meta ?? rawAny.pagination ?? null) as ApiMeta | null;
    const normalizedMeta =
        meta && typeof meta === "object"
            ? {
                  ...meta,
                  page: typeof meta.page === "string" ? parseInt(meta.page, 10) : meta.page,
                  total: typeof meta.total === "number" ? meta.total : (meta as any).totalItems ?? 0,
              }
            : null;
    return { data: res.data as T, meta: normalizedMeta };
}

function buildListQuery(input?: { query?: ListQuery; sort?: ListSort }): Record<string, unknown> {
    const raw: Record<string, unknown> = {
        page: input?.query?.page,
        itemsPerPage: input?.query?.itemsPerPage,
        search: input?.query?.search ?? undefined,
        "labSkuType[]": input?.query?.labSkuType,
        "labInventoryStatus[]": input?.query?.labInventoryStatus,
        sortColumn: input?.sort?.column,
        sortDirection: input?.sort?.direction,
    };
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== undefined));
}

// ==========================================
// LAB INVENTORY (INSTANCES)
// ==========================================

export type LabInventory = {
    labInventoryId: string;
    labSkuId?: string | null;
    labInventoryCode?: string | null;
    labInventorySerial?: string | null;
    labInventoryStatus?: string | null;
    labInventoryLocation?: string | null;
    labInventoryQty?: number | null;
    labInventoryLastCalibrationDate?: string | null;
    labInventoryNextCalibrationDate?: string | null;
    labInventoryImportDate?: string | null;
    labInventoryExpiryDate?: string | null;
    labInventoryWarrantyExpiryDate?: string | null;
    labInventoryDocumentIds?: string[] | null;
    labInventoryNotes?: string | null;
    createdAt?: string;
    // Joined columns from LabSku (Snapshot/UI usage)
    labSkuName?: string | null;
    labSkuType?: string | null;
    labSkuUnit?: string | null;
    labSkuManufacturer?: string | null;
    labSkuModel?: string | null;
    labSkuSpecifications?: Record<string, unknown> | null;
    // Full Detail Relations
    documents?: any[] | null;
    labInventoryDocuments?: any[] | null;
    activityLogs?: AssetActivityLog[] | null;
};

export type LabInventoryCreateBody = {
    labInventoryId: string;
    labSkuId?: string | null;
    labSkuName?: string | null;
    labSkuType?: string | null;
    labInventoryCode?: string | null;
    labInventorySerial?: string | null;
    labInventoryStatus?: string | null;
    labInventoryLocation?: string | null;
    labInventoryQty?: number | null;
    labInventoryLastCalibrationDate?: string | null;
    labInventoryNextCalibrationDate?: string | null;
    labInventoryImportDate?: string | null;
    labInventoryExpiryDate?: string | null;
    labInventoryWarrantyExpiryDate?: string | null;
    labInventoryDocumentIds?: string[] | null;
    labInventoryNotes?: string | null;
};

export type LabInventoryUpdateBody = LabInventoryCreateBody;

// ==========================================
// LAB SKUS (MASTER CATALOG)
// ==========================================

export type LabSku = {
    labSkuId: string;
    labSkuName: string;
    labSkuCode?: string | null;
    labSkuType?: string | null;
    labSkuUnit?: string | null;
    labSkuManufacturer?: string | null;
    labSkuModel?: string | null;
    labSkuSpecifications?: Record<string, unknown> | null;
    requiresCalibration?: boolean | null;
    createdAt?: string;
};

export type LabSkuCreateBody = {
    labSkuId: string;
    labSkuName: string;
    labSkuCode?: string | null;
    labSkuType?: string | null;
    labSkuUnit?: string | null;
    labSkuManufacturer?: string | null;
    labSkuModel?: string | null;
    labSkuSpecifications?: Record<string, unknown> | null;
    requiresCalibration?: boolean | null;
};

export type LabSkuUpdateBody = LabSkuCreateBody;

// ==========================================
// ASSET ACTIVITY LOGS
// ==========================================

export type AssetActivityLog = {
    logId: string;
    assetId: string;
    assetTable?: string | null;
    logType?: string | null;
    logDescription?: string | null;
    logLocation?: string | null;
    logData?: Record<string, unknown> | null;
    commonKeys?: string[] | null;
    actionTime?: string | null;
    createdAt?: string;
    createdById?: string | null;
};

export type AssetActivityLogCreateBody = Omit<AssetActivityLog, "createdAt" | "createdById">;

// ==========================================
// API DEFINITION
// ==========================================

export const generalInventoryApi = {
    labInventories: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<LabInventory[]>("/v2/lab-inventories/get/list", { query: buildListQuery(input) }),
        get: (input: { labInventoryId: string }) =>
            api.get<LabInventory>("/v2/lab-inventories/get/full", { query: { labInventoryId: input.labInventoryId } }),
        create: (input: { body: LabInventoryCreateBody }) =>
            api.post<LabInventory>("/v2/lab-inventories/create", { body: input.body }),
        update: (input: { body: LabInventoryUpdateBody }) =>
            api.put<LabInventory>("/v2/lab-inventories/update", { body: input.body }),
        delete: (input: { labInventoryId: string }) =>
            api.delete<{ success: boolean }>(`/v2/lab-inventories/delete/${input.labInventoryId}`),
    },
    labSkus: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<LabSku[]>("/v2/lab-skus/get/list", { query: buildListQuery(input) }),
        get: (input: { labSkuId: string }) =>
            api.get<LabSku>("/v2/lab-skus/get/detail", { query: { labSkuId: input.labSkuId } }),
        create: (input: { body: LabSkuCreateBody }) =>
            api.post<LabSku>("/v2/lab-skus/create", { body: input.body }),
        update: (input: { body: LabSkuUpdateBody }) =>
            api.put<LabSku>("/v2/lab-skus/update", { body: input.body }),
        delete: (input: { labSkuId: string }) =>
            api.delete<{ success: boolean }>(`/v2/lab-skus/delete/${input.labSkuId}`),
    },
    assetLogs: {
        list: (input?: { query?: ListQuery; sort?: ListSort; assetId?: string }) =>
            api.get<AssetActivityLog[]>("/v2/asset-activity-logs/get/list", { query: { ...buildListQuery(input), assetId: input?.assetId } }),
        create: (input: { body: AssetActivityLogCreateBody }) =>
            api.post<AssetActivityLog>("/v2/asset-activity-logs/create", { body: input.body }),
    },
};

// ==========================================
// REACT QUERY HOOKS (LAB INVENTORIES/EQUIPMENT)
// ==========================================

export function useLabInventory(labInventoryId: string | null) {
    return useQuery({
        queryKey: ["general-labinventory-detail", labInventoryId],
        queryFn: async () => {
            if (!labInventoryId) return null;
            const res = await generalInventoryApi.labInventories.get({ labInventoryId });
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi tải thiết bị");
            return res.data;
        },
        enabled: !!labInventoryId,
    });
}

export function useLabInventoryList(input?: { query?: ListQuery; sort?: ListSort }) {
    return useQuery({
        queryKey: ["general-labinventory-list", input],
        queryFn: async () => assertSuccessWithMeta(await generalInventoryApi.labInventories.list(input)),
        placeholderData: keepPreviousData,
    });
}

export function useCreateLabInventory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { body: LabInventoryCreateBody }) => {
            const res = await generalInventoryApi.labInventories.create(input);
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi tạo thiết bị");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labinventory-list"] }),
    });
}

export function useUpdateLabInventory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { body: LabInventoryUpdateBody }) => {
            const res = await generalInventoryApi.labInventories.update(input);
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi cập nhật thiết bị");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labinventory-list"] }),
    });
}

export function useDeleteLabInventory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (labInventoryId: string) => {
            const res = await generalInventoryApi.labInventories.delete({ labInventoryId });
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi xóa thiết bị");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labinventory-list"] }),
    });
}

// ==========================================
// REACT QUERY HOOKS (LAB SKUS)
// ==========================================
export function useLabSkusList(input?: { query?: ListQuery; sort?: ListSort }) {
    return useQuery({
        queryKey: ["general-labskus-list", input],
        queryFn: async () => assertSuccessWithMeta(await generalInventoryApi.labSkus.list(input)),
        placeholderData: keepPreviousData,
    });
}

export function useCreateLabSku() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { body: LabSkuCreateBody }) => {
            const res = await generalInventoryApi.labSkus.create(input);
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi tạo danh mục");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labskus-list"] }),
    });
}

export function useUpdateLabSku() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { body: LabSkuUpdateBody }) => {
            const res = await generalInventoryApi.labSkus.update(input);
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi cập nhật danh mục");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labskus-list"] }),
    });
}

export function useDeleteLabSku() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (labSkuId: string) => {
            const res = await generalInventoryApi.labSkus.delete({ labSkuId });
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi xóa danh mục");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labskus-list"] }),
    });
}

// ==========================================
// REACT QUERY HOOKS (ASSET LOGS)
// ==========================================
export function useAssetLogsList(input?: { query?: ListQuery; sort?: ListSort; assetId?: string }) {
    return useQuery({
        queryKey: ["general-assetlogs-list", input],
        queryFn: async () => assertSuccessWithMeta(await generalInventoryApi.assetLogs.list(input)),
        placeholderData: keepPreviousData,
    });
}

export function useCreateAssetLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { body: AssetActivityLogCreateBody }) => {
            const res = await generalInventoryApi.assetLogs.create(input);
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi thêm nhật ký");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-assetlogs-list"] }),
    });
}
