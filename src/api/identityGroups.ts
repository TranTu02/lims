import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api, { type ApiResponse, type ApiMeta } from "@/api/client";
import type { IdentityListItem } from "./identities";

export type IdentityGroup = {
    identityGroupId: string;
    identityGroupName: string;
    identityGroupMainRole: string;
    identityGroupAlias: string | null;
    identityGroupInChargeId: string | null;
    identityIds: string[];
    identityGroupDescription: string | null;
    createdAt?: string;
    createdById?: string | null;
    modifiedAt?: string | null;
    modifiedById?: string | null;
    deletedAt?: string | null;
};

export type IdentityGroupFull = IdentityGroup & {
    identities?: IdentityListItem[];
    identityGroupInCharge?: IdentityListItem;
};

export type IdentityGroupsListQuery = {
    page?: number;
    itemsPerPage?: number;
    identityGroupMainRole?: string[];
    search?: string;
    option?: "full" | "minimal";
};

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

function assertSuccess<T>(res: unknown): T {
    if (res && typeof res === "object") {
        const r = res as Record<string, unknown>;
        if ("success" in r && r["success"] === false) {
            const error = r["error"] as { message?: string } | undefined;
            throw new Error(error?.message ?? "Unknown API error");
        }
        if ("data" in r) return r["data"] as T;
    }
    return res as T;
}

export async function identityGroupsGetList(input: { query: IdentityGroupsListQuery }): Promise<ApiResponse<IdentityGroup[]>> {
    return api.get<IdentityGroup[]>("/v2/identity-groups/get/list", {
        query: input.query,
    });
}

export async function identityGroupsGetFull(input: { query: { identityGroupId: string } }): Promise<ApiResponse<IdentityGroupFull>> {
    return api.get<IdentityGroupFull>("/v2/identity-groups/get/full", {
        query: input.query,
    });
}

export const identityGroupsKeys = {
    all: ["identityGroups"] as const,
    list: (query: IdentityGroupsListQuery) => [...identityGroupsKeys.all, "list", stableKey(query)] as const,
    full: (identityGroupId: string) => [...identityGroupsKeys.all, "full", identityGroupId] as const,
};

export function useIdentityGroupsList(input: { query: IdentityGroupsListQuery }, opts?: { enabled?: boolean }) {
    return useQuery<{ data: IdentityGroup[]; meta: ApiMeta | null }>({
        queryKey: identityGroupsKeys.list(input.query),
        enabled: opts?.enabled ?? true,
        placeholderData: keepPreviousData,
        queryFn: async () => {
            const res = await identityGroupsGetList(input);
            const data = assertSuccess<IdentityGroup[]>(res);
            // Handle pagination from either 'meta' or 'pagination' field
            const r = res as unknown as Record<string, unknown>;
            const meta = (r?.meta ?? r?.pagination ?? null) as ApiMeta | null;
            return { data, meta };
        },
    });
}

export function useIdentityGroupFull(identityGroupId: string | null, opts?: { enabled?: boolean }) {
    return useQuery<IdentityGroupFull | null>({
        queryKey: identityGroupsKeys.full(identityGroupId ?? ""),
        enabled: !!identityGroupId && (opts?.enabled ?? true),
        queryFn: async () => {
            if (!identityGroupId) return null;
            const res = await identityGroupsGetFull({ query: { identityGroupId } });
            return assertSuccess<IdentityGroupFull>(res);
        },
    });
}
