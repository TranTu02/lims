import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/api/client";
import type { ApiResponse, ApiMeta } from "@/api/client";

export type SortDirection = "ASC" | "DESC";

export type ListQuery = {
    page?: number;
    itemsPerPage?: number;
    search?: string | null;
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
        sortColumn: input?.sort?.column,
        sortDirection: input?.sort?.direction,
    };
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== undefined));
}

// ==========================================
// LAB INVENTORY (EQUIPMENT)
// ==========================================

export type LabInventory = {
    labInventoryId: string;
    labInventoryName: string;
    labInventoryCode?: string | null;
    labInventoryStatus?: string | null;
    labInventoryLocation?: string | null;
    labInventorySpecifications?: Record<string, unknown> | null;
    labInventoryDocumentIds?: string[] | null;
    labInventoryDocuments?: any[] | null;
    labInventoryManufacturer?: string | null;
    labInventoryModel?: string | null;
    labInventorySerial?: string | null;
    labInventoryImportDate?: string | null;
    labInventoryWarrantyExpiryDate?: string | null;
    labInventoryNotes?: string | null;
    labInventoryLastCalibrationDate?: string | null;
    labInventoryNextCalibrationDate?: string | null;
    createdAt?: string;
};

export type LabInventoryCreateBody = {
    labInventoryId: string;
    labInventoryName: string;
    labInventoryCode?: string | null;
    labInventoryStatus?: string | null;
    labInventoryLocation?: string | null;
    labInventorySpecifications?: Record<string, unknown> | null;
    labInventoryDocumentIds?: string[] | null;
    labInventoryManufacturer?: string | null;
    labInventoryModel?: string | null;
    labInventorySerial?: string | null;
    labInventoryImportDate?: string | null;
    labInventoryWarrantyExpiryDate?: string | null;
    labInventoryNotes?: string | null;
    labInventoryLastCalibrationDate?: string | null;
    labInventoryNextCalibrationDate?: string | null;
};

export type LabInventoryUpdateBody = LabInventoryCreateBody;

// ==========================================
// LAB TOOLS
// ==========================================

export type LabTool = {
    labToolId: string;
    labToolName: string;
    labToolCode?: string | null;
    labToolType?: string | null;
    labToolSpecifications?: Record<string, unknown> | null;
    labToolStatus?: string | null;
    requiresCalibration?: boolean | null;
    lastCalibrationDate?: string | null;
    nextCalibrationDate?: string | null;
    createdAt?: string;
};

export type LabToolCreateBody = {
    labToolId: string;
    labToolName: string;
    labToolCode?: string | null;
    labToolType?: string | null;
    labToolSpecifications?: Record<string, unknown> | null;
    labToolStatus?: string | null;
    requiresCalibration?: boolean | null;
    lastCalibrationDate?: string | null;
    nextCalibrationDate?: string | null;
};

export type LabToolUpdateBody = LabToolCreateBody;

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
            api.get<LabInventory[]>("/v2/lab-inventories/get/list", buildListQuery(input)),
        get: (input: { labInventoryId: string }) =>
            api.get<LabInventory>("/v2/lab-inventories/get/full", { query: { labInventoryId: input.labInventoryId } }),
        create: (input: { body: LabInventoryCreateBody }) =>
            api.post<LabInventory>("/v2/lab-inventories/create", { body: input.body }),
        update: (input: { body: LabInventoryUpdateBody }) =>
            api.put<LabInventory>("/v2/lab-inventories/update", { body: input.body }),
        delete: (input: { labInventoryId: string }) =>
            api.delete<{ success: boolean }>(`/v2/lab-inventories/delete/${input.labInventoryId}`),
    },
    labTools: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<LabTool[]>("/v2/lab-tools/get/list", buildListQuery(input)),
        create: (input: { body: LabToolCreateBody }) =>
            api.post<LabTool>("/v2/lab-tools/create", { body: input.body }),
        update: (input: { body: LabToolUpdateBody }) =>
            api.put<LabTool>("/v2/lab-tools/update", { body: input.body }),
        delete: (input: { labToolId: string }) =>
            api.delete<{ success: boolean }>(`/v2/lab-tools/delete/${input.labToolId}`),
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
// REACT QUERY HOOKS (LAB TOOLS)
// ==========================================
export function useLabToolsList(input?: { query?: ListQuery; sort?: ListSort }) {
    return useQuery({
        queryKey: ["general-labtools-list", input],
        queryFn: async () => assertSuccessWithMeta(await generalInventoryApi.labTools.list(input)),
        placeholderData: keepPreviousData,
    });
}

export function useCreateLabTool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { body: LabToolCreateBody }) => {
            const res = await generalInventoryApi.labTools.create(input);
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi tạo dụng cụ");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labtools-list"] }),
    });
}

export function useUpdateLabTool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { body: LabToolUpdateBody }) => {
            const res = await generalInventoryApi.labTools.update(input);
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi cập nhật dụng cụ");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labtools-list"] }),
    });
}

export function useDeleteLabTool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (labToolId: string) => {
            const res = await generalInventoryApi.labTools.delete({ labToolId });
            if ("success" in res && res.success === false) throw new Error(res.error?.message || "Lỗi xóa dụng cụ");
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["general-labtools-list"] }),
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
