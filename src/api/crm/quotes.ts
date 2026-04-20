import { useQuery, keepPreviousData, type UseQueryOptions } from "@tanstack/react-query";

import api from "@/api/client";
import type { ApiResponse } from "@/api/client";
import { assertList, assertSuccess, type IdParams, type ListQuery, type ListResponse } from "./shared";
import { crmKeys } from "@/api/crm/crmKeys";

import type { QuoteDetail, QuoteListItem, QuotesCreateBody, QuotesUpdateBody } from "@/types/crm/quote";

export type QuotesSortDirectionDb = "ASC" | "DESC";
export type QuotesSortParams = {
    sortColumn?: string;
    sortDirection?: QuotesSortDirectionDb;
};

export type QuotesGetListInput = { query?: ListQuery; sort?: QuotesSortParams };

export async function quotesGetList(input: QuotesGetListInput = {}): Promise<ListResponse<QuoteListItem>> {
    const finalQuery: Record<string, unknown> = { ...(input.query ?? {}), ...(input.sort ?? {}) };

    const res = await api.getRaw<ListResponse<QuoteListItem>>("/v2/quotes/get/list", {
        query: finalQuery,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    return assertList(res);
}

export type QuotesGetDetailInput = IdParams<"quoteId">;

export async function quotesGetDetail(input: QuotesGetDetailInput): Promise<QuoteDetail> {
    const res = await api.getRaw<ApiResponse<QuoteDetail>>("/v2/quotes/get/detail", {
        query: input.params,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return assertSuccess(res);
}

export type QuotesGetFullInput = IdParams<"quoteId">;

export async function quotesGetFull(input: QuotesGetFullInput): Promise<QuoteDetail> {
    const res = await api.getRaw<ApiResponse<QuoteDetail>>("/v2/quotes/get/full", {
        query: input.params,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return assertSuccess(res);
}

export type QuotesCreateInput = { body: QuotesCreateBody };

export async function quotesCreate(input: QuotesCreateInput): Promise<QuoteDetail> {
    const res = await api.postRaw<ApiResponse<QuoteDetail>, QuotesCreateBody>("/v2/quotes/create", {
        body: input.body,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return assertSuccess(res);
}

export type QuotesCreateFullInput = { body: QuotesCreateBody };

export async function quotesCreateFull(input: QuotesCreateFullInput): Promise<QuoteDetail> {
    const res = await api.postRaw<ApiResponse<QuoteDetail>, QuotesCreateBody>("/v2/quotes/create/full", {
        body: input.body,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return assertSuccess(res);
}

export type QuotesUpdateInput = { body: QuotesUpdateBody };

export async function quotesUpdate(input: QuotesUpdateInput): Promise<QuoteDetail> {
    const res = await api.postRaw<ApiResponse<QuoteDetail>, QuotesUpdateBody>("/v2/quotes/update", {
        body: input.body,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return assertSuccess(res);
}

export type QuotesDeleteInput = IdParams<"quoteId">;

export async function quotesDelete(input: QuotesDeleteInput): Promise<{ deleted: true }> {
    const res = await api.postRaw<{ success?: boolean; quoteId?: string; message?: string }, { quoteId: string }>("/v2/quotes/delete", {
        body: input.params,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    if (res?.success !== true) {
        throw new Error(res?.message ?? "Delete quote failed");
    }

    return { deleted: true };
}

export type QuotesFilterFrom = "quoteId" | "quoteCode" | "clientId" | "quoteStatus" | "total_count" | (string & {});

export type QuotesFilterOtherFilter = {
    filterFrom: QuotesFilterFrom;
    filterValues: string[];
};

export type QuotesFilterBody = {
    filterFrom: QuotesFilterFrom;
    textFilter: string | null;
    otherFilters: QuotesFilterOtherFilter[];
    page?: number;
    itemsPerPage?: number;
};

export type QuotesFilterInput = { body: QuotesFilterBody };

export async function quotesFilter(input: QuotesFilterInput): Promise<ListResponse<QuoteListItem>> {
    const res = await api.postRaw<ListResponse<QuoteListItem>, QuotesFilterBody>("/v2/quotes/filter", {
        body: input.body,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    return assertList(res);
}

export function useQuotesFilter(input: QuotesFilterInput, options?: Pick<UseQueryOptions<ListResponse<QuoteListItem>, Error>, "enabled">) {
    return useQuery({
        queryKey: crmKeys.quotes.filter(input),
        enabled: options?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: () => quotesFilter(input),
    });
}

export function useQuotesList(input: QuotesGetListInput, options?: Pick<UseQueryOptions<ListResponse<QuoteListItem>, Error>, "enabled">) {
    return useQuery({
        queryKey: crmKeys.quotes.list(input.query, input.sort),
        enabled: options?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: () => quotesGetList(input),
    });
}

export function useQuoteDetail(quoteId: string, options?: Pick<UseQueryOptions<QuoteDetail, Error>, "enabled">) {
    return useQuery({
        queryKey: crmKeys.quotes.detail(quoteId),
        enabled: options?.enabled ?? Boolean(quoteId),
        retry: false,
        queryFn: () => quotesGetDetail({ params: { quoteId } }),
    });
}

export function useQuoteFull(quoteId: string, options?: Pick<UseQueryOptions<QuoteDetail, Error>, "enabled">) {
    return useQuery({
        queryKey: crmKeys.quotes.full(quoteId),
        enabled: options?.enabled ?? Boolean(quoteId),
        retry: false,
        queryFn: () => quotesGetFull({ params: { quoteId } }),
    });
}
