import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import api, { type ApiResponse } from "@/api/client";
import type { StandardListQuery, ApiMeta, ListResult } from "@/api/receipts"; // Reusing standard definitions
import { QUERY_KEYS } from "@/config/query-keys";
import type {
    ShipmentDetail,
    ShipmentListItem,
    ShipmentDeleteResult,
    ShipmentsCreateBody,
    ShipmentsUpdateBody,
    ShipmentsDeleteBody,
} from "@/types/shipment";

export type ShipmentsGetListInput = {
    query?: StandardListQuery;
    sort?: Record<string, unknown>;
};

export type ShipmentsGetDetailInput = {
    id?: string;
    trackingNumber?: string;
};

export type ShipmentsCreateInput = {
    body: ShipmentsCreateBody;
};

export type ShipmentsUpdateInput = {
    body: ShipmentsUpdateBody;
};

export type ShipmentsDeleteInput = {
    body: ShipmentsDeleteBody;
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

const noCacheHeaders = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
} as const;

export async function shipmentsGetList(input: ShipmentsGetListInput = {}): Promise<ApiResponse<ShipmentListItem[]>> {
    const { query, sort } = input;
    const finalQuery: StandardListQuery = { ...(query ?? {}) };

    if (sort) {
        if (sort.column) finalQuery.sortColumn = String(sort.column);
        if (sort.direction) finalQuery.sortDirection = String(sort.direction);
    }

    return api.get<ShipmentListItem[], StandardListQuery>("/v2/shipments/get/list", {
        query: finalQuery,
        headers: noCacheHeaders,
    });
}

export async function shipmentsGetDetail(input: ShipmentsGetDetailInput): Promise<ApiResponse<ShipmentDetail>> {
    return api.get<ShipmentDetail>("/v2/shipments/get/detail", {
        query: { id: input.id },
        headers: noCacheHeaders,
    });
}

export async function shipmentsGetFull(input: ShipmentsGetDetailInput): Promise<ApiResponse<ShipmentDetail>> {
    return api.get<ShipmentDetail>("/v2/shipments/get/full", {
        query: { 
            shipmentId: input.id, 
            trackingNumber: input.trackingNumber 
        },
        headers: noCacheHeaders,
    });
}

export async function shipmentsCreate(input: ShipmentsCreateInput): Promise<ApiResponse<ShipmentDetail>> {
    return api.post<ShipmentDetail, ShipmentsCreateBody>("/v2/shipments/create", {
        body: input.body,
    });
}

export async function shipmentsEnumList(enumType: string): Promise<ApiResponse<string[]>> {
    return api.get<string[]>("/v2/enum/get/list", {
        query: { enumType },
        headers: noCacheHeaders,
    });
}

export async function shipmentsUpdate(input: ShipmentsUpdateInput): Promise<ApiResponse<ShipmentDetail>> {
    return api.post<ShipmentDetail, ShipmentsUpdateBody>("/v2/shipments/update", {
        body: input.body,
    });
}

export async function shipmentsDelete(input: ShipmentsDeleteInput): Promise<ApiResponse<ShipmentDeleteResult>> {
    return api.post<ShipmentDeleteResult, ShipmentsDeleteBody>("/v2/shipments/delete", {
        body: input.body,
    });
}

// ─── Address Helper API ─────────────────────────────────────────────────────

export type VtpProvince = { provinceId: number; provinceName: string; provinceCode: string };
export type VtpDistrict = { provinceId: number; districtValue: string; districtName: string; districtId: number };
export type VtpWard     = { wardId: number; wardName: string; districtId: number };

export type AddressParseResult = {
    address: string;
    wardId: number | null;
    wardName: string | null;
    districtId: number | null;
    districtName: string | null;
    provinceId: number | null;
    provinceName: string | null;
    isValid: boolean;
};

type AddressBaseQuery = {
    shipmentCarrier?: string;   // default: "VIETTEL_POST"
    addressType?: "OLD" | "NEW" | string; // default: "NEW"
};

export async function addressGetProvinces(opts: AddressBaseQuery = {}): Promise<ApiResponse<VtpProvince[]>> {
    return api.get<VtpProvince[]>("/v2/shipments/getAddress/listProvinces", {
        query: { shipmentCarrier: "VIETTEL_POST", addressType: "NEW", ...opts },
        headers: noCacheHeaders,
    });
}

export async function addressGetDistricts(provinceId: number, opts: AddressBaseQuery = {}): Promise<ApiResponse<VtpDistrict[]>> {
    return api.get<VtpDistrict[]>("/v2/shipments/getAddress/listDistricts", {
        query: { provinceId, shipmentCarrier: "VIETTEL_POST", addressType: "NEW", ...opts },
        headers: noCacheHeaders,
    });
}

export async function addressGetWards(districtId: number, opts: AddressBaseQuery = {}): Promise<ApiResponse<VtpWard[]>> {
    return api.get<VtpWard[]>("/v2/shipments/getAddress/listWards", {
        query: { districtId, shipmentCarrier: "VIETTEL_POST", addressType: "NEW", ...opts },
        headers: noCacheHeaders,
    });
}

export async function addressParseAddress(
    address: string,
    opts: AddressBaseQuery = {}
): Promise<ApiResponse<AddressParseResult>> {
    return api.get<AddressParseResult>("/v2/shipments/getAddress/parse", {
        query: { address, shipmentCarrier: "VIETTEL_POST", addressType: "NEW", ...opts },
        headers: noCacheHeaders,
    });
}



export function useShipmentsList(input?: ShipmentsGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...QUERY_KEYS.shipments.lists(), JSON.stringify(input ?? {})] as const,
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => assertSuccessWithMeta(await shipmentsGetList(input ?? {})),
    });
}

export function useShipmentsEnumList(enumType: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ["enum", enumType] as const,
        enabled: opts?.enabled ?? true,
        staleTime: 5 * 60 * 1000,
        queryFn: async () => assertSuccess(await shipmentsEnumList(enumType)),
    });
}

export function useShipmentDetail(id: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: QUERY_KEYS.shipments.detail(id),
        enabled: (opts?.enabled ?? true) && Boolean(id),
        retry: false,
        queryFn: async () => assertSuccess(await shipmentsGetDetail({ id })),
    });
}

export function useShipmentFull(idOrTracking: string, opts?: { enabled?: boolean; trackingNumber?: string }) {
    const shipmentId = opts?.trackingNumber ? undefined : idOrTracking;
    
    return useQuery({
        queryKey: [...QUERY_KEYS.shipments.detail(shipmentId || opts?.trackingNumber || "none"), "full"] as const,
        enabled: (opts?.enabled ?? true) && (Boolean(shipmentId) || Boolean(opts?.trackingNumber)),
        retry: false,
        queryFn: async () => assertSuccess(await shipmentsGetFull({ 
            id: shipmentId, 
            trackingNumber: opts?.trackingNumber 
        })),
    });
}

export function useCreateShipment() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: ShipmentsCreateInput) => assertSuccess(await shipmentsCreate(input)),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: QUERY_KEYS.shipments.all, exact: false });
            toast.success(t("common.toast.created"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useUpdateShipment() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: ShipmentsUpdateInput) => assertSuccess(await shipmentsUpdate(input)),
        onSuccess: async (updated) => {
            const shipmentId = (updated as unknown as { shipmentId?: string }).shipmentId;
            if (typeof shipmentId === "string" && shipmentId) {
                qc.setQueriesData({ queryKey: QUERY_KEYS.shipments.detail(shipmentId), exact: false }, updated);
            }
            await qc.invalidateQueries({ queryKey: QUERY_KEYS.shipments.all, exact: false });
            toast.success(t("common.toast.saved"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useDeleteShipment() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: ShipmentsDeleteInput) => assertSuccess(await shipmentsDelete(input)),
        onSuccess: () => {
            toast.success(t("common.toast.deleted"));
        },
        onError: () => {
            toast.error(t("common.toast.failed"));
        },
        onSettled: async () => {
            await qc.invalidateQueries({ queryKey: QUERY_KEYS.shipments.all, exact: false, refetchType: "active" });
        },
    });
}
