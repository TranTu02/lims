import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import api, { type ApiResponse, type ApiPagination } from "@/api/client";
import { chemicalKeys } from "./chemicalKeys";
import type {
    ChemicalSku,
    ChemicalSupplier,
    ChemicalSkuSupplier,
    ChemicalInventory,
    ChemicalTransactionBlock,
    ChemicalTransaction,
    ChemicalAuditBlock,
    ChemicalAuditDetail,
    AllocateChemicalPayload,
    ReturnChemicalPayload,
    RecalcChemicalPayload,
    CreateTransactionBlockFullPayload,
    ApproveTransactionBlockPayload,
    EstimateChemicalPayload,
    EstimateResponse,
    AllocateStockPayload,
    AllocateStockResponse,
} from "@/types/chemical";

// Helpers
function assertSuccess<T>(res: ApiResponse<T>): T {
    if (!res.success) {
        throw new Error(res.error?.message ?? "API Error");
    }
    return res.data as T;
}

interface ListResult<T> {
    data: T;
    meta: ApiResponse<T>["meta"];
    pagination: ApiPagination | null;
}

function assertSuccessWithMeta<T>(res: ApiResponse<T>): ListResult<T> {
    if (!res.success && res.statusCode !== 404) {
        throw new Error(res.error?.message ?? "API Error");
    }
    if (res.statusCode === 404 || !res.data) {
        return { data: [] as unknown as T, meta: null, pagination: null };
    }
    const meta: ApiPagination | null =
        res.pagination ??
        (res.meta?.pagination as ApiPagination | undefined) ??
        (res.meta?.total !== undefined
            ? {
                  page: (res.meta.page as number) ?? 1,
                  itemsPerPage: (res.meta.itemsPerPage as number) ?? 20,
                  total: res.meta.total as number,
                  totalPages: (res.meta.totalPages as number) ?? 1,
              }
            : null);
    return { data: res.data as T, meta: res.meta, pagination: meta };
}

const noCacheHeaders = { "Cache-Control": "no-cache", Pragma: "no-cache" };

const DEFAULT_LIST_QUERY = {
    page: 1,
    itemsPerPage: 20,
    sortColumn: "createdAt",
    sortDirection: "DESC",
};

// API Client Wrapper
export const chemicalApi = {
    skus: {
        list: (input?: any) => api.post<ChemicalSku[]>("/v2/chemicalskus/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        detail: (input: { id: string }) => api.post<ChemicalSku>("/v2/chemicalskus/get/detail", { query: { id: input.id }, headers: noCacheHeaders }),
        full: (input: { id: string }) => api.post<ChemicalSku>("/v2/chemicalskus/get/full", { query: { id: input.id }, headers: noCacheHeaders }),
        create: (input: { body: any }) => api.post<ChemicalSku>("/v2/chemicalskus/create", { body: input.body }),
        update: (input: { body: any }) => api.post<ChemicalSku>("/v2/chemicalskus/update", { body: input.body }),
        delete: (input: { body: any }) => api.post<any>("/v2/chemicalskus/delete", { body: input.body }),
        recalc: (input: { body: RecalcChemicalPayload }) => api.post<any>("/v2/chemicalskus/recalc", { body: input.body }),
    },
    suppliers: {
        list: (input?: any) => api.post<ChemicalSupplier[]>("/v2/chemicalsuppliers/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        detail: (input: { id: string }) => api.post<ChemicalSupplier>("/v2/chemicalsuppliers/get/detail", { query: { id: input.id }, headers: noCacheHeaders }),
        full: (input: { id: string }) => api.post<ChemicalSupplier>("/v2/chemicalsuppliers/get/full", { query: { id: input.id }, headers: noCacheHeaders }),
        create: (input: { body: any }) => api.post<ChemicalSupplier>("/v2/chemicalsuppliers/create", { body: input.body }),
        update: (input: { body: any }) => api.post<ChemicalSupplier>("/v2/chemicalsuppliers/update", { body: input.body }),
        delete: (input: { body: any }) => api.post<any>("/v2/chemicalsuppliers/delete", { body: input.body }),
    },
    skuSuppliers: {
        list: (input?: any) => api.post<ChemicalSkuSupplier[]>("/v2/chemicalskusuppliers/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        full: (input: { id: string }) => api.post<ChemicalSkuSupplier>("/v2/chemicalskusuppliers/get/full", { query: { id: input.id }, headers: noCacheHeaders }),
        create: (input: { body: any }) => api.post<ChemicalSkuSupplier>("/v2/chemicalskusuppliers/create", { body: input.body }),
        update: (input: { body: any }) => api.post<ChemicalSkuSupplier>("/v2/chemicalskusuppliers/update", { body: input.body }),
        delete: (input: { body: any }) => api.post<any>("/v2/chemicalskusuppliers/delete", { body: input.body }),
    },
    inventories: {
        list: (input?: any) => api.post<ChemicalInventory[]>("/v2/chemicalinventories/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        detail: (input: { id: string }) => api.post<ChemicalInventory>("/v2/chemicalinventories/get/detail", { query: { id: input.id }, headers: noCacheHeaders }),
        full: (input: { id: string }) => api.post<ChemicalInventory>("/v2/chemicalinventories/get/full", { query: { id: input.id }, headers: noCacheHeaders }),
        create: (input: { body: any }) => api.post<ChemicalInventory>("/v2/chemicalinventories/create", { body: input.body }),
        update: (input: { body: any }) => api.post<ChemicalInventory>("/v2/chemicalinventories/update", { body: input.body }),
        delete: (input: { body: any }) => api.post<any>("/v2/chemicalinventories/delete", { body: input.body }),
        allocate: (input: { body: AllocateChemicalPayload }) => api.post<any>("/v2/chemicalinventories/allocate", { body: input.body }),
        return: (input: { body: ReturnChemicalPayload }) => api.post<any>("/v2/chemicalinventories/return", { body: input.body }),
    },
    transactionBlocks: {
        list: (input?: any) => api.post<ChemicalTransactionBlock[]>("/v2/chemicaltransactionblocks/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        detail: (input: { id: string }) => api.post<ChemicalTransactionBlock>("/v2/chemicaltransactionblocks/get/detail", { query: { id: input.id }, headers: noCacheHeaders }),
        full: (input: { id: string }) => api.post<ChemicalTransactionBlock>("/v2/chemicaltransactionblocks/get/full", { query: { id: input.id }, headers: noCacheHeaders }),
        createFull: (input: { body: CreateTransactionBlockFullPayload }) => api.post<ChemicalTransactionBlock>("/v2/chemicaltransactionblocks/createfull", { body: input.body }),
        approve: (input: { body: ApproveTransactionBlockPayload }) => api.post<ChemicalTransactionBlock>("/v2/chemicaltransactionblocks/approve", { body: input.body }),
        estimate: (input: { body: EstimateChemicalPayload }) => api.post<EstimateResponse>("/v2/chemicaltransactionblocks/estimate", { body: input.body }),
        allocate: (input: { body: AllocateStockPayload }) => api.post<AllocateStockResponse>("/v2/chemicaltransactionblocks/allocate", { body: input.body }),
    },
    transactions: {
        list: (input?: any) => api.post<ChemicalTransaction[]>("/v2/chemicaltransactions/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        full: (input: { id: string }) => api.post<ChemicalTransaction>("/v2/chemicaltransactions/get/full", { query: { id: input.id }, headers: noCacheHeaders }),
    },
    auditBlocks: {
        list: (input?: any) => api.post<ChemicalAuditBlock[]>("/v2/chemicalauditblocks/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        detail: (input: { id: string }) => api.post<ChemicalAuditBlock>("/v2/chemicalauditblocks/get/detail", { query: { id: input.id }, headers: noCacheHeaders }),
        full: (input: { id: string }) => api.post<ChemicalAuditBlock>("/v2/chemicalauditblocks/get/full", { query: { id: input.id }, headers: noCacheHeaders }),
        create: (input: { body: any }) => api.post<ChemicalAuditBlock>("/v2/chemicalauditblocks/create", { body: input.body }),
        update: (input: { body: any }) => api.post<ChemicalAuditBlock>("/v2/chemicalauditblocks/update", { body: input.body }),
    },
    auditDetails: {
        list: (input?: any) => api.post<ChemicalAuditDetail[]>("/v2/chemicalauditdetails/get/list", { query: { ...DEFAULT_LIST_QUERY, ...(input?.query ?? {}) }, headers: noCacheHeaders }),
        update: (input: { body: any }) => api.post<ChemicalAuditDetail>("/v2/chemicalauditdetails/update", { body: input.body }),
    },
};

// --- HOOKS ---

export function useChemicalSkusList(input?: any, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.skus.list(input),
        queryFn: async () => assertSuccessWithMeta(await chemicalApi.skus.list(input)),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

export function useChemicalSkuFull(id: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.skus.full(id),
        queryFn: async () => assertSuccess(await chemicalApi.skus.full({ id })),
        enabled: !!id && (opts?.enabled ?? true),
    });
}

export function useChemicalSuppliersList(input?: any, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.suppliers.list(input),
        queryFn: async () => assertSuccessWithMeta(await chemicalApi.suppliers.list(input)),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

export function useChemicalInventoriesList(input?: any, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.inventories.list(input),
        queryFn: async () => assertSuccessWithMeta(await chemicalApi.inventories.list(input)),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

export function useChemicalAllocateMutation() {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: async (input: { body: AllocateChemicalPayload }) => assertSuccess(await chemicalApi.inventories.allocate(input)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: chemicalKeys.all });
            toast.success(String(t("common.saveSuccess")));
        },
        onError: (err: any) => toast.error(err.message || String(t("common.error"))),
    });
}

export function useChemicalTransactionBlockFull(id: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.transactionBlocks.full(id),
        queryFn: async () => assertSuccess(await chemicalApi.transactionBlocks.full({ id })),
        enabled: !!id && (opts?.enabled ?? true),
    });
}

export function useChemicalTransactionBlocksList(input?: any, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.transactionBlocks.list(input),
        queryFn: async () => assertSuccessWithMeta(await chemicalApi.transactionBlocks.list(input)),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

export function useChemicalSupplierFull(id: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.suppliers.full(id),
        queryFn: async () => assertSuccess(await chemicalApi.suppliers.full({ id })),
        enabled: !!id && (opts?.enabled ?? true),
    });
}

export function useChemicalInventoryFull(id: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.inventories.full(id),
        queryFn: async () => assertSuccess(await chemicalApi.inventories.full({ id })),
        enabled: !!id && (opts?.enabled ?? true),
    });
}

export function useChemicalTransactionFull(id: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.transactions.full(id),
        queryFn: async () => assertSuccess(await chemicalApi.transactions.full({ id })),
        enabled: !!id && (opts?.enabled ?? true),
    });
}

export function useChemicalCreateTransactionBlock() {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: async (input: { body: CreateTransactionBlockFullPayload }) => assertSuccess(await chemicalApi.transactionBlocks.createFull(input)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: chemicalKeys.transactionBlocks.all() });
            qc.invalidateQueries({ queryKey: chemicalKeys.inventories.all() });
            qc.invalidateQueries({ queryKey: chemicalKeys.skus.all() });
            toast.success(String(t("common.saveSuccess")));
        },
        onError: (err: any) => toast.error(err.message || String(t("common.error"))),
    });
}

export function useChemicalTransactionsList(input?: any, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.transactions.list(input),
        queryFn: async () => assertSuccessWithMeta(await chemicalApi.transactions.list(input)),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

// --- AUDIT HOOKS ---

export function useChemicalAuditBlocksList(input?: any, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.auditBlocks.list(input),
        queryFn: async () => assertSuccessWithMeta(await chemicalApi.auditBlocks.list(input)),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

export function useChemicalAuditBlockFull(id: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.auditBlocks.full(id),
        queryFn: async () => assertSuccess(await chemicalApi.auditBlocks.full({ id })),
        enabled: !!id && (opts?.enabled ?? true),
    });
}

export function useChemicalAuditDetailsList(input?: any, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: chemicalKeys.auditDetails.list(input),
        queryFn: async () => assertSuccessWithMeta(await chemicalApi.auditDetails.list(input)),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
    });
}

export function useChemicalAuditDetailUpdate() {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: async (input: { body: any }) => assertSuccess(await chemicalApi.auditDetails.update(input)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: chemicalKeys.auditBlocks.all() });
            qc.invalidateQueries({ queryKey: chemicalKeys.auditDetails.all() });
            toast.success(String(t("common.saveSuccess")));
        },
        onError: (err: any) => toast.error(err.message || String(t("common.error"))),
    });
}

// --- NEW HOOKS: Approve / Estimate / Allocate ---

export function useApproveTransactionBlock() {
    const qc = useQueryClient();
    const { t } = useTranslation();
    return useMutation({
        mutationFn: async (input: { body: ApproveTransactionBlockPayload }) => assertSuccess(await chemicalApi.transactionBlocks.approve(input)),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: chemicalKeys.transactionBlocks.all() });
            qc.invalidateQueries({ queryKey: chemicalKeys.inventories.all() });
            qc.invalidateQueries({ queryKey: chemicalKeys.skus.all() });
            toast.success("Phiếu đã được duyệt thành công");
        },
        onError: (err: any) => toast.error(err.message || String(t("common.error"))),
    });
}

export function useEstimateChemicals() {
    const { t } = useTranslation();
    return useMutation({
        mutationFn: async (input: { body: EstimateChemicalPayload }) => assertSuccess(await chemicalApi.transactionBlocks.estimate(input)),
        onError: (err: any) => toast.error(err.message || String(t("common.error"))),
    });
}

export function useAllocateStock() {
    const { t } = useTranslation();
    return useMutation({
        mutationFn: async (input: { body: AllocateStockPayload }) => assertSuccess(await chemicalApi.transactionBlocks.allocate(input)),
        onError: (err: any) => toast.error(err.message || String(t("common.error"))),
    });
}
