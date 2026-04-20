import { keepPreviousData, useQuery } from "@tanstack/react-query";

import api from "@/api/client";
import type { ApiMeta, ApiResponse } from "@/api/client";

import type { EntityInfo } from "@/types/common";
import type { ClientContact, ClientDetail, ClientInvoiceInfo, ClientListItem, ClientSaleScope, ClientsCreateBody, ClientsUpdateBody } from "@/types/crm/client";

export type ClientsListQuery = {
    page?: number;
    itemsPerPage?: number;
    sortColumn?: string;
    sortDirection?: "ASC" | "DESC";
    search?: string | null;
};

export type ClientsDeleteBody = { clientId: string };

export type ClientsFilterFrom = "clientId" | "clientName" | "legalId" | "clientPhone" | "clientEmail" | "clientSaleScope";

export type ClientsFilterOtherFilter = {
    filterFrom: ClientsFilterFrom;
    filterValues: string | number | Array<string | number>;
};

export type ClientsFilterBody = {
    filterFrom: ClientsFilterFrom;
    textFilter: string | null;
    otherFilters: ClientsFilterOtherFilter[];

    page?: number;
    itemsPerPage?: number;
};

export type ClientsListResult = {
    data: ClientListItem[];
    meta: ApiMeta | null;
};

export type ClientsFilterResult = {
    data: ClientListItem[];
    meta: ApiMeta | null;
};

function isObject(x: unknown): x is Record<string, unknown> {
    return typeof x === "object" && x !== null;
}

function ok<T>(data: T, meta: ApiMeta | null = null): ApiResponse<T> {
    return { success: true, statusCode: 200, data, meta, error: null };
}

function fail(code: string, message: string, statusCode = 500): ApiResponse<never> {
    return {
        success: false,
        statusCode,
        data: undefined,
        meta: null,
        error: { code, message },
    };
}

export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiResponse<T> & { success: true; data: T } {
    return res.success === true && typeof res.data !== "undefined";
}

function assertSuccess<T>(res: ApiResponse<T>): T {
    if ("success" in res && res.success === false) throw new Error(res.error?.message ?? "Unknown API error");
    return res.data as T;
}

function stableKey(value: unknown): string {
    const seen = new WeakSet<object>();
    const sorter = (_k: string, v: unknown) => {
        if (v && typeof v === "object") {
            const obj = v as object;
            if (seen.has(obj)) return undefined;
            seen.add(obj);

            if (Array.isArray(v)) return v.map((x) => x);

            return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
        }
        return v;
    };
    return JSON.stringify(value, sorter);
}

function isApiResponseShape(x: unknown): x is ApiResponse<unknown> {
    if (!isObject(x)) return false;
    return typeof x.success === "boolean" && typeof (x as { statusCode?: unknown }).statusCode === "number";
}

type RawListResponse = { data: unknown; pagination: unknown };

function isRawListResponse(x: unknown): x is RawListResponse {
    return isObject(x) && "data" in x && "pagination" in x;
}

function isApiMeta(x: unknown): x is ApiMeta {
    if (!isObject(x)) return false;
    return typeof x.page === "number" && typeof x.itemsPerPage === "number" && typeof x.totalPages === "number";
}

function sStrOrNull(x: unknown): string | null {
    return typeof x === "string" ? x : null;
}

function sStr(x: unknown, fallback = ""): string {
    return typeof x === "string" ? x : fallback;
}

function sStrArrOrNull(x: unknown): string[] | null {
    if (x === null) return null;
    if (!Array.isArray(x)) return null;
    const out: string[] = [];
    for (const it of x) if (typeof it === "string") out.push(it);
    return out;
}

function sSaleScope(x: unknown): ClientSaleScope {
    if (x === null) return null;
    if (typeof x === "string") return x as ClientSaleScope;
    return null;
}

function sEntityInfo(x: unknown): EntityInfo {
    if (isObject(x)) return x as EntityInfo;
    return { type: "" } as EntityInfo;
}

function sContacts(x: unknown): ClientContact[] | null {
    if (x === null) return null;
    if (!Array.isArray(x)) return null;

    const out: ClientContact[] = [];
    for (const it of x) {
        if (!isObject(it)) continue;
        out.push({
            contactId: sStrOrNull(it.contactId),
            contactName: sStrOrNull(it.contactName),
            contactPhone: sStrOrNull(it.contactPhone),
            contactEmail: sStrOrNull(it.contactEmail),
            contactPosition: sStrOrNull(it.contactPosition),
            contactAddress: sStrOrNull(it.contactAddress),
            ...it,
        });
    }
    return out;
}

function sInvoiceInfo(x: unknown): ClientInvoiceInfo | null {
    if (x === null) return null;
    if (!isObject(x)) return null;
    return {
        taxCode: sStrOrNull(x.taxCode),
        taxName: sStrOrNull(x.taxName),
        taxEmail: sStrOrNull(x.taxEmail),
        taxAddress: sStrOrNull(x.taxAddress),
        ...x,
    };
}

function sanitizeClientBase(raw: unknown):
    | (Omit<ClientDetail, "clientId" | "clientName"> & {
          entity: EntityInfo;
          clientId: string;
          clientName: string;
      })
    | null {
    if (!isObject(raw)) return null;

    const clientId = raw.clientId;
    const clientName = raw.clientName;

    if (typeof clientId !== "string") return null;
    if (typeof clientName !== "string") return null;

    return {
        entity: sEntityInfo(raw.entity),

        clientId,
        clientName,

        legalId: sStrOrNull(raw.legalId),
        clientAddress: sStrOrNull(raw.clientAddress),
        clientPhone: sStrOrNull(raw.clientPhone),
        clientEmail: sStrOrNull(raw.clientEmail),

        clientSaleScope: sSaleScope(raw.clientSaleScope),
        assignedSaleId: sStrOrNull(raw.assignedSaleId),
        clientScope: sStrOrNull(raw.clientScope),

        availableByIds: sStrArrOrNull(raw.availableByIds),
        availableByName: sStrArrOrNull(raw.availableByName),

        clientContacts: sContacts(raw.clientContacts),

        invoiceInfo: sInvoiceInfo(raw.invoiceInfo),

        totalOrderAmount: sStrOrNull(raw.totalOrderAmount),

        createdAt: sStr(raw.createdAt),
        createdById: sStrOrNull(raw.createdById),
        modifiedAt: sStr(raw.modifiedAt),
        modifiedById: sStrOrNull(raw.modifiedById),
        deletedAt: sStrOrNull(raw.deletedAt),

        orders: Array.isArray(raw.orders) ? raw.orders : undefined,
        quotes: Array.isArray(raw.quotes) ? raw.quotes : undefined,
    };
}

function sanitizeClientListItem(raw: unknown): ClientListItem | null {
    const base = sanitizeClientBase(raw);
    if (!base) return null;

    const r = raw as Record<string, unknown>;
    const total_count = typeof r.total_count === "string" ? r.total_count : "0";

    return {
        ...base,
        total_count,
    };
}

function sanitizeClientDetail(raw: unknown): ClientDetail | null {
    const base = sanitizeClientBase(raw);
    if (!base) return null;
    return { ...base };
}

export async function clientsGetList(input: { query: ClientsListQuery }): Promise<ApiResponse<ClientListItem[]>> {
    const raw: unknown = await api.getRaw<unknown, ClientsListQuery>("/v2/clients/get/list", {
        query: input.query,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (isApiResponseShape(raw)) {
        const asApi = raw as ApiResponse<unknown>;

        if (asApi.success && Array.isArray(asApi.data)) {
            const items: ClientListItem[] = [];
            for (const it of asApi.data) {
                const s = sanitizeClientListItem(it);
                if (s) items.push(s);
            }
            return ok(items, (asApi.meta ?? null) as ApiMeta | null);
        }

        return asApi as ApiResponse<ClientListItem[]>;
    }

    if (isRawListResponse(raw)) {
        const dataUnknown = (raw as { data: unknown }).data;
        const paginationUnknown = (raw as { pagination: unknown }).pagination;

        if (!Array.isArray(dataUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "clients list: data is not an array");
        }
        if (!isApiMeta(paginationUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "clients list: pagination is invalid");
        }

        const items: ClientListItem[] = [];
        for (const it of dataUnknown) {
            const s = sanitizeClientListItem(it);
            if (s) items.push(s);
        }

        return ok(items, paginationUnknown);
    }

    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (clients list)");
}

export async function clientsGetDetail(input: { query: { clientId: string } }): Promise<ApiResponse<ClientDetail>> {
    const raw: unknown = await api.getRaw<unknown, { clientId: string }>("/v2/clients/get/detail", {
        query: input.query,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (isApiResponseShape(raw)) {
        const asApi = raw as ApiResponse<unknown>;
        if (asApi.success) {
            const d1 = sanitizeClientDetail(asApi.data);
            if (d1) return ok(d1, (asApi.meta ?? null) as ApiMeta | null);
        }
        return asApi as ApiResponse<ClientDetail>;
    }

    const d1 = sanitizeClientDetail(raw);
    if (d1) return ok(d1);

    if (isObject(raw)) {
        const maybeData = (raw as { data?: unknown }).data;
        const d2 = sanitizeClientDetail(maybeData);
        if (d2) return ok(d2);
    }

    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (client detail)");
}

export async function clientsGetFull(input: { query: { clientId: string } }): Promise<ApiResponse<ClientDetail>> {
    const raw: unknown = await api.getRaw<unknown, { clientId: string }>("/v2/clients/get/full", {
        query: input.query,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (isApiResponseShape(raw)) {
        const asApi = raw as ApiResponse<unknown>;
        if (asApi.success) {
            const d1 = sanitizeClientDetail(asApi.data);
            if (d1) return ok(d1, (asApi.meta ?? null) as ApiMeta | null);
        }
        return asApi as ApiResponse<ClientDetail>;
    }

    const d1 = sanitizeClientDetail(raw);
    if (d1) return ok(d1);

    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (client full)");
}

export async function clientsCreate(input: { body: ClientsCreateBody }): Promise<ApiResponse<ClientDetail>> {
    const res = await api.post<ClientDetail, ClientsCreateBody>("/v2/clients/create", { body: input.body });

    if (res.success) {
        const d = sanitizeClientDetail(res.data);
        if (d) return ok(d, res.meta ?? null);
    }
    return res;
}

export async function clientsUpdate(input: { body: ClientsUpdateBody }): Promise<ApiResponse<ClientDetail>> {
    const res = await api.post<ClientDetail, ClientsUpdateBody>("/v2/clients/update", {
        body: input.body,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (res.success) {
        const d = sanitizeClientDetail(res.data);
        if (d) return ok(d, res.meta ?? null);
    }
    return res;
}

export async function clientsDelete(input: { body: ClientsDeleteBody }): Promise<ApiResponse<null | { clientId: string } | boolean>> {
    return api.post<null | { clientId: string } | boolean, ClientsDeleteBody>("/v2/clients/delete", { body: input.body });
}

export async function clientsFilter(input: { body: ClientsFilterBody }): Promise<ApiResponse<ClientListItem[]>> {
    const raw: unknown = await api.postRaw<unknown, ClientsFilterBody>("/v2/clients/filter", {
        body: input.body,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (isApiResponseShape(raw)) {
        const asApi = raw as ApiResponse<unknown>;

        if (asApi.success && Array.isArray(asApi.data)) {
            const items: ClientListItem[] = [];
            for (const it of asApi.data) {
                const s = sanitizeClientListItem(it);
                if (s) items.push(s);
            }
            return ok(items, (asApi.meta ?? null) as ApiMeta | null);
        }

        return asApi as ApiResponse<ClientListItem[]>;
    }

    if (isRawListResponse(raw)) {
        const dataUnknown = (raw as { data: unknown }).data;
        const paginationUnknown = (raw as { pagination: unknown }).pagination;

        if (!Array.isArray(dataUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "clients filter: data is not an array");
        }
        if (!isApiMeta(paginationUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "clients filter: pagination is invalid");
        }

        const items: ClientListItem[] = [];
        for (const it of dataUnknown) {
            const s = sanitizeClientListItem(it);
            if (s) items.push(s);
        }

        return ok(items, paginationUnknown);
    }

    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (clients filter)");
}

export const clientsKeys = {
    all: ["clients"] as const,

    list: (q: ClientsListQuery) => [...clientsKeys.all, "list", q] as const,
    detail: (clientId: string) => [...clientsKeys.all, "detail", clientId] as const,

    allList: (input: { query: ClientsListQuery }) => [...clientsKeys.all, "all", stableKey(input)] as const,

    filter: (input: { body: ClientsFilterBody }) => [...clientsKeys.all, "filter", stableKey(input)] as const,
};

export function useClientsList(input: { query: ClientsListQuery }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: clientsKeys.list(input.query),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const res = await clientsGetList(input);
            return {
                data: isApiSuccess(res) ? res.data : ([] as ClientListItem[]),
                meta: res.meta ?? null,
            } satisfies ClientsListResult;
        },
    });
}

export function useClientsDetail(input: { query: { clientId: string } }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: clientsKeys.detail(input.query.clientId),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const res = await clientsGetDetail(input);
            return assertSuccess(res);
        },
    });
}

export function useClientsFull(input: { query: { clientId: string } }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...clientsKeys.detail(input.query.clientId), "full"],
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const res = await clientsGetFull(input);
            return assertSuccess(res);
        },
    });
}

export function useClientsAll(input: { query: ClientsListQuery }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: clientsKeys.allList(input),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const firstRes = await clientsGetList({ query: input.query });

            if (!firstRes.success) {
                return { data: [] as ClientListItem[], meta: firstRes.meta ?? null };
            }

            const meta = firstRes.meta ?? null;
            const totalPages = (isObject(meta) && typeof meta.totalPages === "number" ? meta.totalPages : 1) ?? 1;

            const all: ClientListItem[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const pageRes = await clientsGetList({
                    query: { ...input.query, page: p },
                });

                if (pageRes.success && Array.isArray(pageRes.data)) {
                    all.push(...pageRes.data);
                }
            }

            return { data: all, meta };
        },
    });
}

export function useClientsFilter(input: { body: ClientsFilterBody }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: clientsKeys.filter(input),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const res = await clientsFilter(input);
            return {
                data: assertSuccess(res),
                meta: res.meta ?? null,
            } satisfies ClientsFilterResult;
        },
    });
}
