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

export type IdentitiesListQuery = {
  page?: number;
  itemsPerPage?: number;
  sortColumn?: string;
  sortDirection?: "ASC" | "DESC";
  search?: string | null;
  entityType?: string | null;
};

export type IdentityCreateBody = {
  email: string;
  identityName: string;
  alias: string;
  password: string;
  roles: IdentityRoles;
  permissions: Record<string, unknown>;
  identityStatus: IdentityStatus;
};

export type IdentityUpdateBody = {
  identityId: string;
  identityName?: string;
  roles?: IdentityRoles;
  permissions?: Record<string, unknown>;
  identityStatus?: IdentityStatus;
};

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

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function isApiResponse(x: unknown): x is ApiResponse<unknown> {
  const v = x as { success?: unknown; statusCode?: unknown } | null;
  return typeof v?.success === "boolean" && typeof v?.statusCode === "number";
}

function isApiMeta(x: unknown): x is ApiMeta {
  if (!isObject(x)) return false;
  return (
    typeof x.page === "number" &&
    typeof x.itemsPerPage === "number" &&
    typeof x.total === "number" &&
    typeof x.totalPages === "number"
  );
}

type RawListResponse = {
  data: unknown;
  pagination: unknown;
};

function isRawListResponse(x: unknown): x is RawListResponse {
  if (!isObject(x)) return false;
  return "data" in x && "pagination" in x;
}

function sanitizeRoles(x: unknown): IdentityRoles {
  if (!isObject(x)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(x)) out[k] = Boolean(v);
  return out;
}

function sanitizePermissions(x: unknown): Record<string, unknown> {
  if (!isObject(x)) return {};
  return x;
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

  const status = raw.identityStatus;
  const identityStatus: IdentityStatus =
    status === "active" || status === "inactive" || status === "blocked" || status === "deleted"
      ? status
      : "inactive";

  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";

  return {
    identityId,
    email,
    identityName,
    alias,
    roles: sanitizeRoles(raw.roles),
    identityStatus,
    createdAt,

    createdById: typeof raw.createdById === "string" ? raw.createdById : null,
    modifiedAt: typeof raw.modifiedAt === "string" ? raw.modifiedAt : null,
    modifiedById: typeof raw.modifiedById === "string" ? raw.modifiedById : null,
    deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : null,
    entity: isObject(raw.entity) ? { type: typeof raw.entity.type === "string" ? raw.entity.type : undefined } : undefined,
  };
}

function sanitizeDetail(raw: unknown): IdentityDetail | null {
  const base = sanitizeListItem(raw);
  if (!base) return null;

  const r = raw as Record<string, unknown>;
  return {
    ...base,
    permissions: sanitizePermissions(r.permissions),
  };
}

export async function identitiesGetList(input: {
  query: IdentitiesListQuery;
}): Promise<ApiResponse<IdentityListItem[]>> {
  const raw: unknown = (await api.get<unknown, IdentitiesListQuery>(
    "/v2/identities/get/list",
    {
      query: input.query,
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    }
  )) as unknown;

  if (isApiResponse(raw)) {
    return raw as ApiResponse<IdentityListItem[]>;
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
  const raw: unknown = (await api.get<unknown, { identityId: string }>(
    "/v2/identities/get/detail",
    {
      query: input.query,
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    }
  )) as unknown;

  if (isApiResponse(raw)) {
    return raw as ApiResponse<IdentityDetail>;
  }

  const d1 = sanitizeDetail(raw);
  if (d1) return ok(d1);

  if (isObject(raw)) {
    const maybeData = (raw as { data?: unknown }).data;
    const d2 = sanitizeDetail(maybeData);
    if (d2) return ok(d2);
  }

  return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (identity detail)");
}

export async function identitiesCreate(input: { body: IdentityCreateBody }): Promise<ApiResponse<IdentityDetail>> {
    const raw: unknown = (await api.post<unknown, IdentityCreateBody>("/v2/identities/create", {
      body: input.body,
    })) as unknown;
  
    if (isApiResponse(raw)) {
      return raw as ApiResponse<IdentityDetail>;
    }
  
    const d1 = sanitizeDetail(raw);
    if (d1) return ok(d1);
  
    if (isObject(raw)) {
      const maybeData = (raw as { data?: unknown }).data;
      const d2 = sanitizeDetail(maybeData);
      if (d2) return ok(d2);
    }
  
    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (identity create)");
  }
  
export async function identitiesUpdate(input: { body: IdentityUpdateBody }): Promise<ApiResponse<IdentityDetail>> {
    const raw: unknown = (await api.post<unknown, IdentityUpdateBody>("/v2/identities/update", {
      body: input.body,
    })) as unknown;
  
    if (isApiResponse(raw)) {
      return raw as ApiResponse<IdentityDetail>;
    }
  
    const d1 = sanitizeDetail(raw);
    if (d1) return ok(d1);
  
    if (isObject(raw)) {
      const maybeData = (raw as { data?: unknown }).data;
      const d2 = sanitizeDetail(maybeData);
      if (d2) return ok(d2);
    }
  
    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (identity update)");
  }
  
export async function identitiesDelete(input: { body: { identityId: string } }): Promise<ApiResponse<{ identityId: string; deletedAt?: string }>> {
    const raw: unknown = (await api.post<unknown, { identityId: string }>("/v2/identities/delete", {
      body: input.body,
    })) as unknown;
  
    if (isApiResponse(raw)) {
      return raw as ApiResponse<{ identityId: string; deletedAt?: string }>;
    }
  
    if (isObject(raw) && typeof raw.identityId === "string") {
      return ok({ identityId: raw.identityId as string, deletedAt: typeof raw.deletedAt === "string" ? raw.deletedAt : undefined });
    }
  
    if (isObject(raw)) {
      const maybeData = (raw as { data?: unknown }).data;
      if (isObject(maybeData) && typeof maybeData.identityId === "string") {
        return ok({
          identityId: maybeData.identityId as string,
          deletedAt: typeof maybeData.deletedAt === "string" ? maybeData.deletedAt : undefined,
        });
      }
    }
  
    return fail("BAD_RESPONSE_SHAPE", "Unexpected response shape (identity delete)");
  }
  

export const identitiesKeys = {
  all: ["identities"] as const,
  list: (q: IdentitiesListQuery) => [...identitiesKeys.all, "list", q] as const,
  detail: (identityId: string) => [...identitiesKeys.all, "detail", identityId] as const,
};

export function isApiSuccess<T>(
  res: ApiResponse<T>
): res is ApiResponse<T> & { success: true; data: T } {
  return res.success === true && typeof res.data !== "undefined";
}
