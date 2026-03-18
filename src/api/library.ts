import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import api from "@/api/client";

export type SortDirection = "ASC" | "DESC";
export type ApiNumber = number | string;

export type ListQuery = {
    page?: number;
    itemsPerPage?: number;
    search?: string | null;

    parameterId?: string | null;
    protocolId?: string | null;
    sampleTypeId?: string | null;
};

export type ListSort = {
    column?: string;
    direction?: SortDirection;
};

import type { ApiResponse, ApiMeta, ApiError } from "@/api/client";
export type { ApiResponse, ApiMeta, ApiError };

export type ListResult<T> = {
    data: T;
    meta: ApiMeta | null;
};

function assertSuccess<T>(res: ApiResponse<T>): T {
    // Backend list endpoints return { data, pagination } without `success`
    // Mutation endpoints return { success, statusCode, data, meta, error }
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }
    // Some backend detail endpoints return domain data directly (no { success, data } wrapper).
    // Detect this: if res.data is undefined AND the response has no `success` key, treat res itself as T.
    if (res.data === undefined && !("success" in res)) {
        return res as unknown as T;
    }
    return res.data as T;
}

function assertSuccessWithMeta<T>(res: ApiResponse<T>): ListResult<T> {
    // Backend list endpoints return { data, pagination } without `success`
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }

    // Handle both `meta` (wrapped) and `pagination` (raw backend) formats
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

function stableKey(value: unknown): string {
    // stable stringify (sorted keys) cho object/array
    const seen = new WeakSet<object>();

    const sorter = (_k: string, v: unknown) => {
        if (v && typeof v === "object") {
            const obj = v as object;
            if (seen.has(obj)) return undefined;
            seen.add(obj);

            if (Array.isArray(v)) return v.map((x) => x);
            const entries = Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
            return Object.fromEntries(entries);
        }
        return v;
    };

    return JSON.stringify(value, sorter);
}

function buildListQuery(input?: { query?: ListQuery; sort?: ListSort }): Record<string, unknown> {
    const raw: Record<string, unknown> = {
        page: input?.query?.page,
        itemsPerPage: input?.query?.itemsPerPage,
        search: input?.query?.search ?? undefined,

        parameterId: input?.query?.parameterId ?? undefined,
        protocolId: input?.query?.protocolId ?? undefined,
        sampleTypeId: input?.query?.sampleTypeId ?? undefined,

        sortColumn: input?.sort?.column,
        sortDirection: input?.sort?.direction,
    };

    // Remove keys whose value is null or undefined so Axios does not
    // serialize them as the literal string "null"/"undefined" in the URL.
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== undefined));
}

export type IdentityExpanded = {
    identityId: string;
    identityName: string;
    alias?: string;
};

/** Phạm vi công nhận: key là tên chứng nhận (e.g. "VILAS997", "TDC"), value là boolean */
export type ProtocolAccreditation = Record<string, boolean>;

export type Matrix = {
    matrixId: string;
    parameterId: string;
    protocolId: string;
    sampleTypeId: string;

    protocolCode?: string | null;
    protocolSource?: string | null;
    chemicals?: ProtocolChemical[] | null;
    protocolAccreditation?: ProtocolAccreditation;

    parameterName?: string | null;
    sampleTypeName?: string | null;

    feeBeforeTax: ApiNumber;
    taxRate?: ApiNumber | null;
    feeAfterTax: ApiNumber;

    LOD?: string | null;
    LOQ?: string | null;
    thresholdLimit?: string | null;
    turnaroundTime?: number | null;

    technicianGroupId?: string | null;

    createdAt: string;
    createdBy?: IdentityExpanded | null;
    modifiedAt?: string | null;
    modifiedBy?: IdentityExpanded | null;
};

export type MatrixFull = Matrix & {
    protocol?: Protocol;
};

export type ProtocolParameter = {
    parameterId: string;
    parameterName: string;
};

export type ProtocolSampleType = {
    sampleTypeId: string;
    sampleTypeName: string;
};

export type ProtocolChemical = {
    chemicalSkuId: string;
    chemicalName: string;
    consumedQty?: string;
    chemicalBaseUnit?: string;
    /** @deprecated Use chemicalBaseUnit */
    unit?: string;
};

export type MatrixChemical = {
    chemicalSkuId: string;
    chemicalName: string;
    consumedQty?: string;
    chemicalBaseUnit?: string;
    /** @deprecated Use chemicalBaseUnit */
    unit?: string;
};

export type Protocol = {
    protocolId: string;
    protocolCode: string;
    protocolSource: string;
    protocolAccreditation?: ProtocolAccreditation;
    protocolTitle?: string | null;
    protocolDescription?: string | null;
    protocolDocumentIds?: string[] | null;
    documents?:
        | {
              documentId: string;
              documentTitle?: string | null;
              documentStatus?: string | null;
              commonKeys?: string[] | null;
              jsonContent?: {
                  documentTitle?: string | null;
                  documentStatus?: string | null;
                  commonKeys?: string[] | null;
              } | null;
              file?: {
                  fileName?: string | null;
              } | null;
          }[]
        | null;
    parameters?: ProtocolParameter[] | null;
    sampleTypes?: ProtocolSampleType[] | null;
    chemicals?: ProtocolChemical[] | null;
    createdAt: string;
    createdById?: string | null;
    modifiedAt?: string | null;
    modifiedById?: string | null;
    deletedAt?: string | null;
};

export type ProtocolFull = Protocol & {
    matrices?: Record<string, unknown>[];
};

export type ParameterDisplayStyle = {
    eng?: string;
    default?: string;
    [k: string]: unknown;
};

export type Parameter = {
    parameterId: string;
    parameterName: string;
    displayStyle?: ParameterDisplayStyle;
    technicianAlias?: string | null;
    technicianGroupId?: string | null;
    parameterSearchKeys?: string[] | null;
    parameterStatus?: string | null;
    parameterNote?: string | null;
    createdAt: string;
};

export type ParameterFull = Parameter & {
    matrices?: Record<string, unknown>[];
};

export type SampleTypeDisplayTypeStyle = {
    eng?: string;
    default?: string;
    [k: string]: unknown;
};

export type SampleType = {
    sampleTypeId: string;
    sampleTypeName: string;
    displayTypeStyle?: SampleTypeDisplayTypeStyle;
    createdAt: string;
};

export type SampleTypeFull = SampleType & {
    matrices?: Record<string, unknown>[];
};

export type ParameterGroup = {
    groupId: string;
    groupName: string;
    sampleTypeId: string;
    sampleTypeName?: string | null;
    matrixIds: string[];
    groupNote?: string | null;

    feeBeforeTaxAndDiscount: number;
    discountRate: number;
    feeBeforeTax: number;
    taxRate: number;
    feeAfterTax: number;

    createdAt: string;
    createdBy?: IdentityExpanded | null;
};

export type MatrixCreateBody = {
    parameterId: string;
    protocolId: string;
    sampleTypeId: string;

    feeBeforeTax: number;
    feeAfterTax: number;
    taxRate?: number | null;

    turnaroundTime?: number | null;
    LOD?: string | null;
    LOQ?: string | null;
    thresholdLimit?: string | null;

    technicianGroupId?: string | null;
    protocolAccreditation?: ProtocolAccreditation;

    parameterName?: string | null;
    protocolCode?: string | null;
    protocolSource?: string | null;
    sampleTypeName?: string | null;
    chemicals?: MatrixChemical[] | null;
};

export type MatrixPatch = Partial<MatrixCreateBody>;

export type MatricesFilterFrom = "matrixId" | "parameterId" | "parameterName" | "protocolId" | "protocolCode" | "sampleTypeId" | "sampleTypeName" | "feeBeforeTax" | "feeAfterTax";

export type MatricesFilterOtherFilter = {
    filterFrom: MatricesFilterFrom;
    filterValues: Array<string | number>;
};

export type MatricesFilterBody = {
    filterFrom: MatricesFilterFrom;
    textFilter: string | null;
    otherFilters: MatricesFilterOtherFilter[];
    limit: number;
};

export type MatricesFilterItem = {
    filterValue: string;
    count: number;
};

export type ProtocolCreateBody = {
    protocolCode: string;
    protocolSource: string;
    protocolAccreditation?: ProtocolAccreditation;
    protocolTitle?: string | null;
    protocolDescription?: string | null;
    protocolDocumentIds?: string[] | null;
    parameters?: ProtocolParameter[] | null;
    sampleTypes?: ProtocolSampleType[] | null;
    chemicals?: ProtocolChemical[] | null;
};

export type ProtocolUpdateBody = {
    protocolId: string;
    protocolCode?: string;
    protocolSource?: string;
    protocolAccreditation?: ProtocolAccreditation;
    protocolTitle?: string | null;
    protocolDescription?: string | null;
    protocolDocumentIds?: string[] | null;
    parameters?: ProtocolParameter[] | null;
    sampleTypes?: ProtocolSampleType[] | null;
    chemicals?: ProtocolChemical[] | null;
};

export type ParameterCreateBody = {
    parameterName: string;
    displayStyle?: ParameterDisplayStyle;
    technicianAlias?: string | null;
    technicianGroupId?: string | null;
    parameterSearchKeys?: string[] | null;
    parameterStatus?: string | null;
    parameterNote?: string | null;
};

export type ParameterUpdateBody = {
    parameterId: string;
    parameterName?: string;
    displayStyle?: ParameterDisplayStyle;
    technicianAlias?: string | null;
    technicianGroupId?: string | null;
    parameterSearchKeys?: string[] | null;
    parameterStatus?: string | null;
    parameterNote?: string | null;
};

export type SampleTypeCreateBody = {
    sampleTypeName: string;
    displayTypeStyle?: Record<string, string>;
};

export type SampleTypeUpdateBody = {
    sampleTypeId: string;
    sampleTypeName?: string;
    displayTypeStyle?: Record<string, string>;
};

export type ParameterGroupCreateFullBody = {
    groupName: string;
    sampleTypeId: string;
    sampleTypeName?: string;
    matrixIds: string[];
    groupNote?: string | null;
    feeBeforeTaxAndDiscount: number;
    discountRate: number;
    feeBeforeTax: number;
    taxRate: number;
    feeAfterTax: number;
};

export type ParametersFilterFrom = "parameterId" | "parameterName" | "technicianAlias" | "unit";

export type ParametersFilterOtherFilter = {
    filterFrom: ParametersFilterFrom;
    filterValues: Array<string | number>;
};

export type ParametersFilterBody = {
    filterFrom: ParametersFilterFrom;
    textFilter: string | null;
    otherFilters: ParametersFilterOtherFilter[];
    limit: number;
};

export type ParametersFilterItem = {
    filterValue: string;
    count: number;
};

export type ProtocolsFilterFrom = "protocolId" | "protocolCode" | "protocolSource";

export type ProtocolsFilterOtherFilter = {
    filterFrom: ProtocolsFilterFrom;
    filterValues: Array<string | number>;
};

export type ProtocolsFilterBody = {
    filterFrom: ProtocolsFilterFrom;
    textFilter: string | null;
    otherFilters: ProtocolsFilterOtherFilter[];
    limit: number;
};

export type ProtocolsFilterItem = {
    filterValue: string;
    count: number;
};

export type SampleTypesFilterFrom = "sampleTypeId" | "sampleTypeName" | "displayTypeStyle";

export type SampleTypesFilterOtherFilter = {
    filterFrom: SampleTypesFilterFrom;
    filterValues: Array<string | number>;
};

export type SampleTypesFilterBody = {
    filterFrom: SampleTypesFilterFrom;
    textFilter: string | null;
    otherFilters: SampleTypesFilterOtherFilter[];
    limit: number;
};

export type SampleTypesFilterItem = {
    filterValue: string;
    count: number;
};

export type ParameterGroupsFilterFrom = "groupId" | "groupName" | "sampleTypeId" | "sampleTypeName" | "matrixId" | "feeBeforeTaxAndDiscount" | "feeBeforeTax" | "feeAfterTax";

export type ParameterGroupsFilterOtherFilter = {
    filterFrom: ParameterGroupsFilterFrom;
    filterValues: Array<string | number>;
};

export type ParameterGroupsFilterBody = {
    filterFrom: ParameterGroupsFilterFrom;
    textFilter: string | null;
    otherFilters: ParameterGroupsFilterOtherFilter[];
    limit: number;
};

export type ParameterGroupsFilterItem = {
    filterValue: string | number;
    count: number;
};

export const libraryApi = {
    matrices: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<Matrix[]>("/v2/matrices/get/list", {
                query: buildListQuery(input),
            }),

        detail: (input: { params: { matrixId: string } }) => api.get<Matrix>("/v2/matrices/get/detail", { query: input.params }),

        full: (matrixId: string) => api.get<MatrixFull>("/v2/matrices/get/full", { query: { matrixId } }),

        create: (input: { body: MatrixCreateBody }) => api.post<Matrix>("/v2/matrices/create", { body: input.body }),

        update: (input: { params: { matrixId: string }; patch: MatrixPatch }) =>
            api.post<Matrix>("/v2/matrices/update", {
                body: { matrixId: input.params.matrixId, ...input.patch },
            }),

        delete: (input: { params: { matrixId: string } }) =>
            api.post<{ matrixId: string }>("/v2/matrices/delete", {
                body: input.params,
            }),

        filter: (input: { body: MatricesFilterBody }) =>
            api.post<MatricesFilterItem[]>("/v2/matrices/filter", {
                body: input.body,
            }),
    },

    protocols: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<Protocol[]>("/v2/protocols/get/list", {
                query: buildListQuery(input),
            }),

        detail: (input: { params: { protocolId: string } }) => api.get<Protocol>("/v2/protocols/get/detail", { query: { id: input.params.protocolId } }),

        full: (id: string) => api.getRaw<ProtocolFull>("/v2/protocols/get/full", { query: { id } }),

        create: (input: { body: ProtocolCreateBody }) => api.post<Protocol>("/v2/protocols/create", { body: input.body }),

        update: (input: { body: ProtocolUpdateBody }) => api.post<Protocol>("/v2/protocols/update", { body: input.body }),

        delete: (input: { params: { protocolId: string } }) =>
            api.post<{ id: string; status: string }>("/v2/protocols/delete", {
                body: { protocolId: input.params.protocolId },
            }),

        filter: (input: { body: ProtocolsFilterBody }) =>
            api.post<ProtocolsFilterItem[]>("/v2/protocols/filter", {
                body: input.body,
            }),
    },

    parameters: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<Parameter[]>("/v2/parameters/get/list", {
                query: buildListQuery(input),
            }),

        full: (id: string) => api.getRaw<ParameterFull>("/v2/parameters/get/full", { query: { id } }),

        create: (input: { body: ParameterCreateBody }) => api.post<Parameter>("/v2/parameters/create", { body: input.body }),

        update: (input: { body: ParameterUpdateBody }) => api.post<Parameter>("/v2/parameters/update", { body: input.body }),

        filter: (input: { body: ParametersFilterBody }) =>
            api.post<ParametersFilterItem[]>("/v2/parameters/filter", {
                body: input.body,
            }),
    },

    sampleTypes: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<SampleType[]>("/v2/sampletypes/get/list", {
                query: buildListQuery(input),
            }),

        full: (id: string) => api.getRaw<SampleTypeFull>("/v2/sampletypes/get/full", { query: { id } }),

        create: (input: { body: SampleTypeCreateBody }) => api.post<SampleType>("/v2/sampletypes/create", { body: input.body }),

        update: (input: { body: any }) => api.post<SampleType>("/v2/sampletypes/update", { body: input.body }),

        filter: (input: { body: SampleTypesFilterBody }) =>
            api.post<SampleTypesFilterItem[]>("/v2/sampletypes/filter", {
                body: input.body,
            }),
    },

    parameterGroups: {
        list: (input?: { query?: ListQuery; sort?: ListSort }) =>
            api.get<ParameterGroup[]>("/v2/parametergroups/get/list", {
                query: buildListQuery(input),
            }),

        createFull: (input: { body: ParameterGroupCreateFullBody }) =>
            api.post<ParameterGroup>("/v2/parametergroups/create/full", {
                body: input.body,
            }),

        filter: (input: { body: ParameterGroupsFilterBody }) =>
            api.post<ParameterGroupsFilterItem[]>("/v2/parametergroups/filter", {
                body: input.body,
            }),
    },
};

export const libraryKeys = {
    all: ["library"] as const,

    matrices: () => [...libraryKeys.all, "matrices"] as const,
    matricesList: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.matrices(), "list", stableKey(input ?? {})] as const,
    matrixDetail: (matrixId: string) => [...libraryKeys.matrices(), "detail", matrixId] as const,
    matrixFull: (matrixId: string) => [...libraryKeys.matrices(), "full", matrixId] as const,
    matricesFilter: (input: { body: MatricesFilterBody }) => [...libraryKeys.matrices(), "filter", stableKey(input)] as const,
    protocols: () => [...libraryKeys.all, "protocols"] as const,
    protocolsList: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.protocols(), "list", stableKey(input ?? {})] as const,
    protocolDetail: (protocolId: string) => [...libraryKeys.protocols(), "detail", protocolId] as const,
    protocolsFilter: (input: { body: ProtocolsFilterBody }) => [...libraryKeys.protocols(), "filter", stableKey(input)] as const,
    protocolsAll: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.protocols(), "all", stableKey(input ?? {})] as const,
    parameters: () => [...libraryKeys.all, "parameters"] as const,
    parametersList: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.parameters(), "list", stableKey(input ?? {})] as const,
    parametersFilter: (input: { body: ParametersFilterBody }) => [...libraryKeys.parameters(), "filter", stableKey(input)] as const,
    parametersAll: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.parameters(), "all", stableKey(input ?? {})] as const,
    sampleTypes: () => [...libraryKeys.all, "sampleTypes"] as const,
    sampleTypesList: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.sampleTypes(), "list", stableKey(input ?? {})] as const,
    sampleTypesFilter: (input: { body: SampleTypesFilterBody }) => [...libraryKeys.sampleTypes(), "filter", stableKey(input)] as const,
    sampleTypesAll: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.sampleTypes(), "all", stableKey(input ?? {})] as const,
    parameterGroups: () => [...libraryKeys.all, "parameterGroups"] as const,
    parameterGroupsList: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.parameterGroups(), "list", stableKey(input ?? {})] as const,
    parameterGroupsFilter: (input: { body: ParameterGroupsFilterBody }) => [...libraryKeys.parameterGroups(), "filter", stableKey(input)] as const,

    parameterGroupsAll: (input?: { query?: ListQuery; sort?: ListSort }) => [...libraryKeys.parameterGroups(), "all", stableKey(input ?? {})] as const,
};

export function useMatricesList(input?: { query?: ListQuery; sort?: ListSort }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.matricesList(input),
        queryFn: async () => assertSuccessWithMeta(await libraryApi.matrices.list(input)),
        placeholderData: keepPreviousData,
        enabled: opts?.enabled ?? true,
    });
}

export function useMatrixDetail(input: { params: { matrixId: string } }) {
    return useQuery({
        queryKey: libraryKeys.matrixDetail(input.params.matrixId),
        enabled: Boolean(input.params.matrixId),
        retry: false,
        queryFn: async () => assertSuccess(await libraryApi.matrices.detail(input)),
    });
}

export function useMatrixFull(id: string | null) {
    return useQuery({
        queryKey: libraryKeys.matrixFull(id ?? ""),
        enabled: Boolean(id),
        queryFn: async () => assertSuccess(await libraryApi.matrices.full(id!)),
    });
}

export function useProtocolFull(id: string | null) {
    return useQuery({
        queryKey: ["library", "protocols", "full", id],
        enabled: Boolean(id),
        queryFn: async () => await libraryApi.protocols.full(id!),
    });
}

export function useCreateMatrix() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: MatrixCreateBody }) => assertSuccess(await libraryApi.matrices.create(input)),

        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: libraryKeys.matrices() });
            toast.success(t("library.matrices.createSuccess"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useUpdateMatrix() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { params: { matrixId: string }; patch: MatrixPatch }) => assertSuccess(await libraryApi.matrices.update(input)),

        onSuccess: async (updated, vars) => {
            qc.setQueryData(libraryKeys.matrixDetail(vars.params.matrixId), updated);

            qc.setQueriesData({ queryKey: libraryKeys.matrices(), exact: false }, (old) => {
                if (!old || typeof old !== "object") return old;

                const maybe = old as { data?: unknown; meta?: unknown };
                if (!Array.isArray(maybe.data)) return old;

                return {
                    ...maybe,
                    data: (maybe.data as Matrix[]).map((m) => (m.matrixId === updated.matrixId ? updated : m)),
                };
            });

            await qc.invalidateQueries({
                queryKey: libraryKeys.matrices(),
                exact: false,
            });
            await qc.invalidateQueries({
                queryKey: libraryKeys.matrixDetail(vars.params.matrixId),
                exact: true,
            });

            toast.success(t("library.matrices.updateSuccess"));
        },

        onError: () => toast.error(t("library.matrices.updateError")),
    });
}

export function useDeleteMatrix() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { params: { matrixId: string } }) => assertSuccess(await libraryApi.matrices.delete(input)),
        onSuccess: async (_res, vars) => {
            qc.removeQueries({
                queryKey: libraryKeys.matrixDetail(vars.params.matrixId),
                exact: true,
            });
            await qc.invalidateQueries({ queryKey: libraryKeys.matrices() });
            toast.success(t("common.toast.deleted"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useMatricesFilter(input: { body: MatricesFilterBody }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.matricesFilter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => assertSuccess(await libraryApi.matrices.filter(input)),
    });
}

export function useMatricesAll(input?: { query?: ListQuery; sort?: ListSort }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: [...libraryKeys.matrices(), "all", stableKey(input ?? {})] as const,
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => {
            const first = await libraryApi.matrices.list(input);
            const firstRes = assertSuccessWithMeta(first);

            const totalPages = firstRes.meta?.totalPages ?? 1;
            const all: Matrix[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const res = await libraryApi.matrices.list({
                    query: { ...(input?.query ?? {}), page: p },
                    sort: input?.sort,
                });
                const pageRes = assertSuccessWithMeta(res);
                if (Array.isArray(pageRes.data)) all.push(...pageRes.data);
            }

            return {
                data: all,
                meta: firstRes.meta ?? null,
            };
        },
    });
}

export function useProtocolsList(input?: { query?: ListQuery; sort?: ListSort }) {
    return useQuery({
        queryKey: libraryKeys.protocolsList(input),
        queryFn: async () => assertSuccessWithMeta(await libraryApi.protocols.list(input)),
        placeholderData: keepPreviousData,
    });
}

export function useProtocolDetail(input: { params: { protocolId: string } }) {
    return useQuery({
        queryKey: libraryKeys.protocolDetail(input.params.protocolId),
        enabled: Boolean(input.params.protocolId),
        retry: false,
        queryFn: async () => {
            const res = await libraryApi.protocols.full(input.params.protocolId);
            return res as unknown as Protocol;
        },
    });
}

export function useCreateProtocol() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: ProtocolCreateBody }) => assertSuccess(await libraryApi.protocols.create(input)),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: libraryKeys.protocols() });
            toast.success(t("library.protocols.createSuccess"));
        },
        onError: () => toast.error(t("library.protocols.createError")),
    });
}

export function useUpdateProtocol() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: ProtocolUpdateBody }) => assertSuccess(await libraryApi.protocols.update(input)),

        onSuccess: async (updated, vars) => {
            qc.setQueryData(libraryKeys.protocolDetail(vars.body.protocolId), updated);
            await qc.invalidateQueries({ queryKey: libraryKeys.protocols(), exact: false });
            toast.success(t("library.protocols.updateSuccess"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useDeleteProtocol() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { params: { protocolId: string } }) => assertSuccess(await libraryApi.protocols.delete(input)),
        onSuccess: async (_res, vars) => {
            qc.removeQueries({
                queryKey: libraryKeys.protocolDetail(vars.params.protocolId),
                exact: true,
            });
            await qc.invalidateQueries({ queryKey: libraryKeys.protocols() });
            toast.success(t("common.toast.deleted"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useProtocolsFilter(input: { body: ProtocolsFilterBody }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.protocolsFilter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => assertSuccess(await libraryApi.protocols.filter(input)),
    });
}

export function useProtocolsAll(input?: { query?: ListQuery; sort?: ListSort }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.protocolsAll(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => {
            const first = await libraryApi.protocols.list(input);
            const firstRes = assertSuccessWithMeta(first);

            const totalPages = firstRes.meta?.totalPages ?? 1;
            const all: Protocol[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const res = await libraryApi.protocols.list({
                    query: { ...(input?.query ?? {}), page: p },
                    sort: input?.sort,
                });
                const pageRes = assertSuccessWithMeta(res);
                if (Array.isArray(pageRes.data)) all.push(...pageRes.data);
            }

            return { data: all, meta: firstRes.meta ?? null };
        },
    });
}

export function useParametersList(input?: { query?: ListQuery; sort?: ListSort }) {
    return useQuery({
        queryKey: libraryKeys.parametersList(input),
        queryFn: async () => assertSuccessWithMeta(await libraryApi.parameters.list(input)),
        placeholderData: keepPreviousData,
    });
}

export function useCreateParameter() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: ParameterCreateBody }) => assertSuccess(await libraryApi.parameters.create(input)),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: libraryKeys.parameters() });
            toast.success(t("library.parameters.createSuccess"));
        },
        onError: () => toast.error(t("library.parameters.createError")),
    });
}

export function useUpdateParameter() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: ParameterUpdateBody }) => assertSuccess(await libraryApi.parameters.update(input)),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: libraryKeys.parameters() });
            toast.success(t("common.toast.updated"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useParametersFilter(input: { body: ParametersFilterBody }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.parametersFilter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => assertSuccess(await libraryApi.parameters.filter(input)),
    });
}

export function useParameterFull(id: string | null) {
    return useQuery({
        queryKey: ["library", "parameters", "full", id],
        enabled: Boolean(id),
        queryFn: async () => await libraryApi.parameters.full(id!),
    });
}

export function useParametersAll(input?: { query?: ListQuery; sort?: ListSort }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.parametersAll(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => {
            const first = await libraryApi.parameters.list(input);
            const firstRes = assertSuccessWithMeta(first);

            const totalPages = firstRes.meta?.totalPages ?? 1;
            const all: Parameter[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const res = await libraryApi.parameters.list({
                    query: { ...(input?.query ?? {}), page: p },
                    sort: input?.sort,
                });
                const pageRes = assertSuccessWithMeta(res);
                if (Array.isArray(pageRes.data)) all.push(...pageRes.data);
            }

            return { data: all, meta: firstRes.meta ?? null };
        },
    });
}

export function useSampleTypesList(input?: { query?: ListQuery; sort?: ListSort }) {
    return useQuery({
        queryKey: libraryKeys.sampleTypesList(input),
        queryFn: async () => assertSuccessWithMeta(await libraryApi.sampleTypes.list(input)),
        placeholderData: keepPreviousData,
    });
}
export function useCreateSampleType() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: SampleTypeCreateBody }) => assertSuccess(await libraryApi.sampleTypes.create(input)),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: libraryKeys.sampleTypes() });
            toast.success(t("library.sampleTypes.createSuccess"));
        },
        onError: () => toast.error(t("library.sampleTypes.createError")),
    });
}

export function useUpdateSampleType() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: SampleTypeUpdateBody }) => assertSuccess(await libraryApi.sampleTypes.update(input)),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: libraryKeys.sampleTypes() });
            toast.success(t("common.toast.updated"));
        },
        onError: () => toast.error(t("common.toast.failed")),
    });
}

export function useSampleTypeFull(id: string | null) {
    return useQuery({
        queryKey: ["library", "sampleTypes", "full", id],
        enabled: Boolean(id),
        queryFn: async () => await libraryApi.sampleTypes.full(id!),
    });
}

export function useSampleTypesFilter(input: { body: SampleTypesFilterBody }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.sampleTypesFilter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => assertSuccess(await libraryApi.sampleTypes.filter(input)),
    });
}

export function useSampleTypesAll(input?: { query?: ListQuery; sort?: ListSort }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.sampleTypesAll(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => {
            const first = await libraryApi.sampleTypes.list(input);
            const firstRes = assertSuccessWithMeta(first);

            const totalPages = firstRes.meta?.totalPages ?? 1;
            const all: SampleType[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const res = await libraryApi.sampleTypes.list({
                    query: { ...(input?.query ?? {}), page: p },
                    sort: input?.sort,
                });
                const pageRes = assertSuccessWithMeta(res);
                if (Array.isArray(pageRes.data)) all.push(...pageRes.data);
            }

            return { data: all, meta: firstRes.meta ?? null };
        },
    });
}

export function useParameterGroupsList(input?: { query?: ListQuery; sort?: ListSort }) {
    return useQuery({
        queryKey: libraryKeys.parameterGroupsList(input),
        queryFn: async () => assertSuccessWithMeta(await libraryApi.parameterGroups.list(input)),
        placeholderData: keepPreviousData,
    });
}

export function useCreateParameterGroupFull() {
    const qc = useQueryClient();
    const { t } = useTranslation();

    return useMutation({
        mutationFn: async (input: { body: ParameterGroupCreateFullBody }) => assertSuccess(await libraryApi.parameterGroups.createFull(input)),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: libraryKeys.parameterGroups() });
            toast.success(t("library.parameterGroups.createSuccess"));
        },
        onError: () => toast.error(t("library.parameterGroups.createError")),
    });
}

export function useParameterGroupsFilter(input: { body: ParameterGroupsFilterBody }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.parameterGroupsFilter(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => assertSuccess(await libraryApi.parameterGroups.filter(input)),
    });
}

export function useParameterGroupsAll(input?: { query?: ListQuery; sort?: ListSort }, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: libraryKeys.parameterGroupsAll(input),
        enabled: opts?.enabled ?? true,
        retry: false,
        queryFn: async () => {
            const first = await libraryApi.parameterGroups.list(input);
            const firstRes = assertSuccessWithMeta(first);

            const totalPages = firstRes.meta?.totalPages ?? 1;
            const all: ParameterGroup[] = Array.isArray(firstRes.data) ? [...firstRes.data] : [];

            for (let p = 2; p <= totalPages; p += 1) {
                const res = await libraryApi.parameterGroups.list({
                    query: { ...(input?.query ?? {}), page: p },
                    sort: input?.sort,
                });
                const pageRes = assertSuccessWithMeta(res);
                if (Array.isArray(pageRes.data)) all.push(...pageRes.data);
            }

            return { data: all, meta: firstRes.meta ?? null };
        },
    });
}
