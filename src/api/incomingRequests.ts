// src/api/incomingRequests.ts
// API hooks cho bảng crm.incomingRequests — Yêu cầu tiếp nhận

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import api, { type ApiResponse } from "@/api/client";
import { assertList, type ListQuery, type ListResponse } from "@/api/crm/shared";
import { crmKeys } from "@/api/crm/crmKeys";
import { receiptsKeys } from "@/api/receipts";

import type { IncomingRequestListItem, IncomingRequestDetail, IncomingRequestCreateBody, IncomingRequestUpdateBody } from "@/types/incomingRequest";

// ── Query Key factory ────────────────────────────────────────────────────────
export const incomingRequestsKeys = {
    all: ["crm", "incomingRequests"] as const,

    list: (query?: Record<string, unknown>) => [...incomingRequestsKeys.all, "list", query ?? {}] as const,

    detail: (requestId: string) => [...incomingRequestsKeys.all, "detail", requestId] as const,
};

// ── Input types ──────────────────────────────────────────────────────────────
export type IncomingRequestsGetListInput = {
    query?: ListQuery;
    sort?: Record<string, unknown>;
};

export type IncomingRequestsGetDetailInput = {
    params: { requestId: string };
};

export type IncomingRequestsCreateInput = { body: IncomingRequestCreateBody };
export type IncomingRequestsUpdateInput = { body: IncomingRequestUpdateBody };
export type IncomingRequestsDeleteInput = { params: { requestId: string } };

// ── No-cache headers ─────────────────────────────────────────────────────────
const noCacheHeaders = {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
} as const;

// ── GET List ─────────────────────────────────────────────────────────────────
export async function incomingRequestsGetList(input: IncomingRequestsGetListInput = {}): Promise<ListResponse<IncomingRequestListItem>> {
    const finalQuery = { ...(input.query ?? {}), ...(input.sort ?? {}) };

    const res = await api.getRaw<ListResponse<IncomingRequestListItem>>("/v2/incoming-orders/get/list", { query: finalQuery, headers: noCacheHeaders });

    return assertList(res);
}

// ── GET Detail ───────────────────────────────────────────────────────────────
export async function incomingRequestsGetDetail(input: IncomingRequestsGetDetailInput): Promise<IncomingRequestDetail> {
    return api.getRaw<IncomingRequestDetail>("/v2/incoming-orders/get/detail", { query: input.params, headers: noCacheHeaders });
}

// ── POST Create ──────────────────────────────────────────────────────────────
export async function incomingRequestsCreate(input: IncomingRequestsCreateInput): Promise<IncomingRequestDetail> {
    return api.postRaw<IncomingRequestDetail, IncomingRequestCreateBody>("/v2/incoming-orders/create", { body: input.body });
}

// ── POST Update (status, receiptId, ...) ─────────────────────────────────────
export async function incomingRequestsUpdate(input: IncomingRequestsUpdateInput): Promise<IncomingRequestDetail> {
    return api.postRaw<IncomingRequestDetail, IncomingRequestUpdateBody>("/v2/incoming-orders/update", { body: input.body });
}

// ── POST Delete ──────────────────────────────────────────────────────────────
export async function incomingRequestsDelete(input: IncomingRequestsDeleteInput): Promise<{ deleted: true }> {
    return api.postRaw<{ deleted: true }, { requestId: string }>("/v2/incoming-orders/delete", { body: input.params });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export function useIncomingRequestsList(input?: IncomingRequestsGetListInput, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: incomingRequestsKeys.list(input?.query as Record<string, unknown>),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: () => incomingRequestsGetList(input ?? {}),
    });
}

export function useIncomingRequestDetail(requestId: string, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: incomingRequestsKeys.detail(requestId),
        enabled: (opts?.enabled ?? true) && Boolean(requestId),
        retry: false,
        queryFn: () => incomingRequestsGetDetail({ params: { requestId } }),
    });
}

// ── Mutation: Update (đánh dấu Converted, link receiptId) ────────────────────
export function useIncomingRequestMutationUpdate() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (input: IncomingRequestsUpdateInput) => incomingRequestsUpdate(input),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: incomingRequestsKeys.all, exact: false });
            toast.success(String(t("common.toast.saved")));
        },
        onError: () => toast.error(String(t("common.toast.failed"))),
    });
}

// ── Mutation: Delete ─────────────────────────────────────────────────────────
export function useIncomingRequestMutationDelete() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: (input: IncomingRequestsDeleteInput) => incomingRequestsDelete(input),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: incomingRequestsKeys.all, exact: false });
            toast.success(String(t("common.toast.deleted")));
        },
        onError: () => toast.error(String(t("common.toast.failed"))),
    });
}

// ── Mutation: Fast-Convert → receipts/create/full + update incoming status ──
export function useIncomingRequestConvert() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (payload: { receiptBody: Record<string, unknown>; requestId: string }) => {
            // 1. Tạo Receipt Full (receipt + samples + analyses) in one shot
            const receiptRes = await api.post<unknown, Record<string, unknown>>("/v2/receipts/create/full", { body: payload.receiptBody });

            // Extract receiptId from response
            const created = receiptRes as ApiResponse<Record<string, unknown>>;
            const receiptId = (created.data as Record<string, unknown>)?.receiptId as string | undefined;

            // 2. Cập nhật incoming request → Converted
            if (receiptId) {
                await incomingRequestsUpdate({
                    body: {
                        requestId: payload.requestId,
                        incomingStatus: "Converted",
                        receiptId,
                    },
                });
            }

            return created;
        },

        onSuccess: async () => {
            // Invalidate cả incoming list lẫn receipts list
            await Promise.all([
                qc.invalidateQueries({ queryKey: incomingRequestsKeys.all, exact: false }),
                qc.invalidateQueries({ queryKey: receiptsKeys.all, exact: false }),
                qc.invalidateQueries({ queryKey: crmKeys.orders.all, exact: false }),
            ]);
            toast.success(String(t("reception.incomingRequests.convertSuccess", { defaultValue: "Tạo phiếu tiếp nhận thành công!" })));
        },
        onError: () => {
            toast.error(String(t("reception.incomingRequests.convertError", { defaultValue: "Tạo phiếu thất bại, vui lòng thử lại." })));
        },
    });
}
