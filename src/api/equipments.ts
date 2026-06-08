import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import type { ApiResponse, ApiMeta } from "@/api/client";
import type { Equipment, EquipmentLog, TechnicianOption } from "@/types/equipment";

export type ListQuery = {
    page?: number;
    itemsPerPage?: number;
    search?: string | null;
    equipmentId?: string | null;
    equipmentLogType?: string | null;
    sortColumn?: string | null;
    sortDirection?: string | null;
    otherFilters?: any[] | null;
};

export type ListResult<T> = {
    data: T;
    meta: ApiMeta | null;
};

function assertSuccessWithMeta<T>(res: ApiResponse<T>): ListResult<T> {
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }
    const rawAny = res as unknown as Record<string, any>;
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

export const equipmentsApi = {
    equipments: {
        list: (query?: ListQuery) =>
            api.get<Equipment[]>("/v2/equipments/get/list", { query: query as any }),
        technicians: () =>
            api.get<TechnicianOption[]>("/v2/equipments/get/technicians"),
        full: (id: string) =>
            api.get<Equipment>("/v2/equipments/get/full", { query: { id } }),
        create: (body: Partial<Equipment>) =>
            api.post<Equipment>("/v2/equipments/create", { body }),
        update: (body: Partial<Equipment>) =>
            api.post<Equipment>("/v2/equipments/update", { body }),
        delete: (equipmentId: string) =>
            api.post<{ success: boolean }>("/v2/equipments/delete", { body: { equipmentId } }),
    },
    logs: {
        list: (query?: ListQuery) =>
            api.get<EquipmentLog[]>("/v2/equipmentLogs/get/list", { query: query as any }),
        create: (body: Partial<EquipmentLog>) =>
            api.post<EquipmentLog>("/v2/equipmentLogs/create", { body }),
    }
};

export function useEquipmentsList(query?: ListQuery) {
    return useQuery({
        queryKey: ["equipments-list", query],
        queryFn: async () => assertSuccessWithMeta(await equipmentsApi.equipments.list(query)),
        placeholderData: keepPreviousData,
    });
}

export function useEquipmentTechnicians() {
    return useQuery({
        queryKey: ["equipment-technicians"],
        queryFn: async () => {
            const res = await equipmentsApi.equipments.technicians();
            if ("success" in res && res.success === false) {
                throw new Error(res.error?.message || "Lỗi tải danh sách kỹ thuật viên");
            }
            return res.data;
        }
    });
}

export function useEquipmentFull(id: string | null) {
    return useQuery({
        queryKey: ["equipment-full", id],
        queryFn: async () => {
            if (!id) return null;
            const res = await equipmentsApi.equipments.full(id);
            if ("success" in res && res.success === false) {
                throw new Error(res.error?.message || "Lỗi tải thông tin chi tiết thiết bị");
            }
            return res.data;
        },
        enabled: !!id,
    });
}

export function useCreateEquipment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body: Partial<Equipment>) => {
            const res = await equipmentsApi.equipments.create(body);
            if ("success" in res && res.success === false) {
                throw new Error(res.error?.message || "Lỗi tạo thiết bị");
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipments-list"] });
        }
    });
}

export function useUpdateEquipment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body: Partial<Equipment>) => {
            const res = await equipmentsApi.equipments.update(body);
            if ("success" in res && res.success === false) {
                throw new Error(res.error?.message || "Lỗi cập nhật thiết bị");
            }
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["equipments-list"] });
            queryClient.invalidateQueries({ queryKey: ["equipment-full", variables.equipmentId] });
        }
    });
}

export function useDeleteEquipment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (equipmentId: string) => {
            const res = await equipmentsApi.equipments.delete(equipmentId);
            if ("success" in res && res.success === false) {
                throw new Error(res.error?.message || "Lỗi xóa thiết bị");
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["equipments-list"] });
        }
    });
}

export function useEquipmentLogsList(query?: ListQuery) {
    return useQuery({
        queryKey: ["equipment-logs-list", query],
        queryFn: async () => assertSuccessWithMeta(await equipmentsApi.logs.list(query)),
        placeholderData: keepPreviousData,
    });
}

export function useCreateEquipmentLog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (body: Partial<EquipmentLog>) => {
            const res = await equipmentsApi.logs.create(body);
            if ("success" in res && res.success === false) {
                throw new Error(res.error?.message || "Lỗi tạo nhật ký");
            }
            return res.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["equipment-logs-list"] });
            queryClient.invalidateQueries({ queryKey: ["equipment-full", variables.equipmentId] });
        }
    });
}

export type AnalyticaBalanceOption = {
    equipmentId: string;
    equipmentName: string;
    [key: string]: any;
};

export function useAnalyticaBalances() {
    return useQuery({
        queryKey: ["analytica-balances"],
        queryFn: async () => {
            const res = await api.get<AnalyticaBalanceOption[]>("/v2/enum/get/list", {
                query: { enumType: "analyticaBalance" }
            });
            if ("success" in res && res.success === false) {
                throw new Error(res.error?.message || "Lỗi tải danh mục cân phân tích");
            }
            return res.data || [];
        }
    });
}
