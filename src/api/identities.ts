import { keepPreviousData, useQuery } from "@tanstack/react-query";

import api from "@/api/client";
import type { ApiMeta, ApiResponse } from "@/api/client";

export type IdentityStatus = "active" | "inactive" | "blocked" | "deleted";
export type IdentityRoles = Record<string, boolean>;

export type IdentityActor = {
    identityId: string;
    identityName: string;
    alias: string;
};

export type IdentityListItem = {
    identityId: string;
    email: string;
    identityName: string;
    alias: string | null;
    roles: IdentityRoles;
    identityStatus: IdentityStatus;
    createdAt: string;
    identityGroupId?: string | null;
    identityPhone?: string | null;
    identityNID?: string | null;
    identityAddress?: string | null;

    identityDocumentIds?: string[] | null;
    documents?: unknown[]; // Placeholder for joined documents if any

    createdBy?: IdentityActor;
    createdById?: string | null;

    modifiedAt?: string | null;
    modifiedBy?: IdentityActor;
    modifiedById?: string | null;

    deletedAt?: string | null;

    entity?: { type?: string };
};

export type IdentityDetail = IdentityListItem & {
    permissions: Record<string, unknown>;
};

export type IdentityFull = IdentityDetail & {
    // Other joined fields can go here
};

export type IdentitiesListQuery = {
    page?: number;
    itemsPerPage?: number;
    sortColumn?: string;
    sortDirection?: "ASC" | "DESC";
    search?: string | null;
    entityType?: string | null;
    identityRoles?: string[];
    identityStatus?: string[];
};

export type IdentityCreateBody = {
    email: string;
    identityName: string;
    alias: string;
    password: string;
    roles: IdentityRoles;
    permissions: Record<string, unknown>;
    identityStatus: IdentityStatus;
    identityDocumentIds?: string[];
    identityGroupId?: string;
    identityPhone?: string;
    identityNID?: string;
    identityAddress?: string;
};

export type IdentityUpdateBody = {
    identityId: string;
    identityName?: string;
    roles?: IdentityRoles;
    permissions?: Record<string, unknown>;
    identityStatus?: IdentityStatus;
    identityDocumentIds?: string[];
    identityGroupId?: string;
    identityPhone?: string;
    identityNID?: string;
    identityAddress?: string;
};

export type IdentitiesFilterFrom = "identityId" | "email" | "identityName" | "alias" | "identityStatus" | "entityType";

export type IdentitiesFilterOtherFilter = {
    filterFrom: IdentitiesFilterFrom;
    filterValues: Array<string | number>;
};

export type IdentitiesFilterBody = {
    filterFrom: IdentitiesFilterFrom;
    textFilter: string | null;
    otherFilters: IdentitiesFilterOtherFilter[];

    page?: number;
    itemsPerPage?: number;
};

export type IdentitiesFilterResult = {
    data: IdentityListItem[];
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
    return typeof x.success === "boolean" && typeof x.statusCode === "number";
}

type RawListResponse = {
    data: unknown;
    pagination: unknown;
};

function isRawListResponse(x: unknown): x is RawListResponse {
    return isObject(x) && "data" in x && "pagination" in x;
}

function isApiMeta(x: unknown): x is ApiMeta {
    return isObject(x);
}

function sanitizeRoles(x: unknown): IdentityRoles {
    if (Array.isArray(x)) {
        const out: Record<string, boolean> = {};
        for (const r of x) {
            if (typeof r === "string" && r.trim().length > 0) out[r] = true;
        }
        return out;
    }

    if (!isObject(x)) return {};
    const out: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(x)) out[k] = Boolean(v);
    return out;
}

function sanitizeStatus(x: unknown): IdentityStatus {
    if (x === "active" || x === "inactive" || x === "blocked" || x === "deleted") return x;
    return "inactive";
}

function sanitizeListItem(raw: unknown): IdentityListItem | null {
    if (!isObject(raw)) return null;

    const identityId = raw.identityId;
    const email = raw.email;
    const identityName = raw.identityName;

    if (typeof identityId !== "string") return null;
    if (typeof email !== "string") return null;
    if (typeof identityName !== "string") return null;

    const alias = typeof raw.alias === "string" ? raw.alias : null;
    const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";

    return {
        identityId,
        email,
        identityName,
        alias,
        roles: sanitizeRoles(raw.identityRoles || raw.roles),
        identityStatus: sanitizeStatus(raw.identityStatus),
        createdAt,

        identityGroupId: typeof raw.identityGroupId === "string" ? raw.identityGroupId : null,
        identityPhone: typeof raw.identityPhone === "string" ? raw.identityPhone : null,
        identityNID: typeof raw.identityNID === "string" ? raw.identityNID : null,
        identityAddress: typeof raw.identityAddress === "string" ? raw.identityAddress : null,

        createdById: typeof raw.createdById === "string" ? raw.createdById : null,
        modifiedAt: typeof raw.modifiedAt === "string" ? raw.modifiedAt : null,
        modifiedById: typeof raw.modifiedById === "string" ? raw.modifiedById : null,
        deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : null,

        identityDocumentIds: Array.isArray(raw.identityDocumentIds) ? raw.identityDocumentIds : [],
        documents: Array.isArray(raw.documents) ? raw.documents : [],

        entity: isObject(raw.entity)
            ? {
                  type: typeof raw.entity.type === "string" ? raw.entity.type : undefined,
              }
            : undefined,
    };
}

function sanitizeDetail(raw: unknown): IdentityDetail | null {
    const base = sanitizeListItem(raw);
    if (!base) return null;

    const r = raw as Record<string, unknown>;
    return {
        ...base,
        permissions: isObject(r.permissions) ? r.permissions : {},
    };
}

export async function identitiesGetList(input: { query: IdentitiesListQuery }): Promise<ApiResponse<IdentityListItem[]>> {
    const raw: unknown = await api.getRaw<unknown, IdentitiesListQuery>("/v2/identities/get/list", {
        query: input.query,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (isApiResponseShape(raw)) {
        const asApi = raw as ApiResponse<unknown>;

        if (asApi.success && Array.isArray(asApi.data)) {
            const items: IdentityListItem[] = [];
            for (const it of asApi.data) {
                const s = sanitizeListItem(it);
                if (s) items.push(s);
            }
            return ok(items, (asApi.meta ?? null) as ApiMeta | null);
        }

        return asApi as ApiResponse<IdentityListItem[]>;
    }

    if (isRawListResponse(raw)) {
        const dataUnknown = (raw as { data: unknown }).data;
        const paginationUnknown = (raw as { pagination: unknown }).pagination;

        if (!Array.isArray(dataUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "identities list: data is not an array");
        }
        if (!isApiMeta(paginationUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "identities list: pagination is invalid");
        }

        const items: IdentityListItem[] = [];
        for (const it of dataUnknown) {
            const s = sanitizeListItem(it);
            if (s) items.push(s);
        }

        return ok(items, paginationUnknown);
    }

    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (identities list)");
}

export async function identitiesGetDetail(input: {
  query: { identityId: string };
}): Promise<ApiResponse<IdentityDetail>> {
  const raw: unknown = await api.getRaw<unknown, { identityId: string }>(
    "/v2/identities/get/detail",
    {
      query: { identityId: input.query.identityId },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    }
  );

  if (isApiResponseShape(raw)) {
    const asApi = raw as ApiResponse<unknown>;
    if (asApi.success) {
      const d1 = sanitizeDetail(asApi.data);
      if (d1) return ok(d1, (asApi.meta ?? null) as ApiMeta | null);
    }
    return asApi as ApiResponse<IdentityDetail>;
  }

  const d1 = sanitizeDetail(raw);
  if (d1) return ok(d1);

  if (isObject(raw)) {
    const maybeData = (raw as { data?: unknown }).data;
    const d2 = sanitizeDetail(maybeData);
    if (d2) return ok(d2);
  }

  return fail(
    "BAD_RESPONSE_SHAPE",
    "Unexpected response shape (identity detail)"
  );
}

export async function identitiesGetFull(input: {
  query: { identityId: string };
}): Promise<ApiResponse<IdentityFull>> {
  const raw: unknown = await api.getRaw<unknown, { identityId: string }>(
    "/v2/identities/get/full",
    {
      query: { identityId: input.query.identityId },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    }
  );

  if (isApiResponseShape(raw)) {
    const asApi = raw as ApiResponse<unknown>;
    if (asApi.success) {
      const d1 = sanitizeDetail(asApi.data);
      if (d1) return ok(d1 as IdentityFull, (asApi.meta ?? null) as ApiMeta | null);
    }
    return asApi as ApiResponse<IdentityFull>;
  }

  const d1 = sanitizeDetail(raw);
  if (d1) return ok(d1 as IdentityFull);

  return fail(
    "BAD_RESPONSE_SHAPE",
    "Unexpected response shape (identity full)"
  );
}

export async function identitiesCreate(input: { body: IdentityCreateBody }): Promise<ApiResponse<IdentityDetail>> {
    const res = await api.post<IdentityDetail, IdentityCreateBody>("/v2/identities/create", { body: input.body });

    if (res.success) {
        const d = sanitizeDetail(res.data);
        if (d) return ok(d, res.meta ?? null);
    }
    return res;
}

export async function identitiesUpdate(input: { body: IdentityUpdateBody }): Promise<ApiResponse<IdentityDetail>> {
    const res = await api.post<IdentityDetail, IdentityUpdateBody>("/v2/identities/update", { body: input.body });

    if (res.success) {
        const d = sanitizeDetail(res.data);
        if (d) return ok(d, res.meta ?? null);
    }
    return res;
}

export async function identitiesDelete(input: { body: { identityId: string } }): Promise<ApiResponse<{ identityId: string; deletedAt?: string }>> {
    return api.post<{ identityId: string; deletedAt?: string }, { identityId: string }>("/v2/identities/delete", { body: input.body });
}

export async function identitiesAddRole(input: { body: { identityId: string; roleCode: string } }): Promise<ApiResponse<unknown>> {
    return api.post<unknown, { identityId: string; roleCode: string }>("/v2/identities/update/add-role", { body: input.body });
}

export async function identitiesRemoveRole(input: { body: { identityId: string; roleCode: string } }): Promise<ApiResponse<unknown>> {
    return api.post<unknown, { identityId: string; roleCode: string }>("/v2/identities/update/remove-role", { body: input.body });
}

export async function identitiesUpdatePolicy(input: { body: { identityId: string; policyCode: string; status: string } }): Promise<ApiResponse<unknown>> {
    return api.post<unknown, { identityId: string; policyCode: string; status: string }>("/v2/identities/update/update-policy", { body: input.body });
}

export async function identitiesFilter(input: { body: IdentitiesFilterBody }): Promise<ApiResponse<IdentityListItem[]>> {
    const raw: unknown = await api.postRaw<unknown, IdentitiesFilterBody>("/v2/identities/filter", { body: input.body });

    if (isApiResponseShape(raw)) {
        const asApi = raw as ApiResponse<unknown>;

        if (asApi.success && Array.isArray(asApi.data)) {
            const items: IdentityListItem[] = [];
            for (const it of asApi.data) {
                const s = sanitizeListItem(it);
                if (s) items.push(s);
            }
            return ok(items, (asApi.meta ?? null) as ApiMeta | null);
        }

        return asApi as ApiResponse<IdentityListItem[]>;
    }

    if (isRawListResponse(raw)) {
        const dataUnknown = (raw as { data: unknown }).data;
        const paginationUnknown = (raw as { pagination: unknown }).pagination;

        if (!Array.isArray(dataUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "identities filter: data is not an array");
        }
        if (!isApiMeta(paginationUnknown)) {
            return fail("BAD_RESPONSE_SHAPE", "identities filter: pagination is invalid");
        }

        const items: IdentityListItem[] = [];
        for (const it of dataUnknown) {
            const s = sanitizeListItem(it);
            if (s) items.push(s);
        }

        return ok(items, paginationUnknown);
    }

    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (identities filter)");
}

export const identitiesKeys = {
    all: ["identities"] as const,

    list: (q: IdentitiesListQuery) => [...identitiesKeys.all, "list", q] as const,
    detail: (identityId: string) => [...identitiesKeys.all, "detail", identityId] as const,

    allList: (input: { query: IdentitiesListQuery }) => [...identitiesKeys.all, "all", stableKey(input)] as const,

    filter: (input: { body: IdentitiesFilterBody }) => [...identitiesKeys.all, "filter", stableKey(input)] as const,

    full: (identityId: string) => [...identitiesKeys.all, "full", identityId] as const,
};

export function useIdentitiesList(input: { query: IdentitiesListQuery }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: identitiesKeys.list(input.query),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const res = await identitiesGetList({ query: input.query });

            if (!res.success) {
                return { data: [] as IdentityListItem[], meta: res.meta ?? null };
            }

            return { data: res.data as IdentityListItem[], meta: res.meta ?? null };
        },
    });
}

export function useIdentitiesAll(input: { query: IdentitiesListQuery }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: identitiesKeys.allList(input),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const firstRes = await identitiesGetList({ query: input.query });

            if (!firstRes.success) {
                return { data: [] as IdentityListItem[], meta: firstRes.meta ?? null };
            }

            const meta = firstRes.meta ?? null;
            const totalPages = meta?.totalPages ?? 1;

            const all: IdentityListItem[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const pageRes = await identitiesGetList({
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

export function useIdentitiesFilter(input: { body: IdentitiesFilterBody }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: identitiesKeys.filter(input),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            const res = await identitiesFilter(input);
            return {
                data: assertSuccess(res),
                meta: res.meta ?? null,
            } satisfies IdentitiesFilterResult;
        },
    });
}

export function useIdentityFull(identityId: string | null, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: identitiesKeys.full(identityId ?? ""),
        enabled: (opts?.enabled ?? true) && Boolean(identityId),
        retry: false,
        queryFn: async () => {
            if (!identityId) throw new Error("identityId is required");
            const res = await identitiesGetFull({ query: { identityId } });
            return assertSuccess(res);
        },
    });
}
