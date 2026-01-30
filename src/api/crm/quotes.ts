import api from "@/api/client";
import type { ApiResponse } from "@/api/client";
import type { IdParams, ListQuery, ListResponse, SortParams } from "./shared";
import type {
  QuoteDetail,
  QuoteFull,
  QuoteListItem,
  QuotesCreateBody,
  QuotesCreateFullBody,
  QuotesUpdateBody,
} from "../../types/crm/quote";

export type QuotesGetListInput = { query?: ListQuery; sort?: SortParams };
export async function quotesGetList(
  input: QuotesGetListInput = {}
): Promise<ListResponse<QuoteListItem>> {
  const finalQuery: Record<string, unknown> = {
    ...(input.query ?? {}),
    ...(input.sort ?? {}),
  };
  return api.get("/v2/quotes/get/list", {
    query: finalQuery,
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  }) as unknown as Promise<ListResponse<QuoteListItem>>;
}

export type QuotesGetDetailInput = IdParams<"orderId"> | IdParams<"quoteId">;

export async function quotesGetDetail(
  input: QuotesGetDetailInput
): Promise<ApiResponse<QuoteDetail>> {
  return api.get("/v2/quotes/get/detail", { query: input.params });
}

export async function quotesGetFull(
  input: QuotesGetDetailInput
): Promise<ApiResponse<QuoteFull>> {
  return api.get("/v2/quotes/get/full", { query: input.params });
}

export type QuotesCreateInput = { body: QuotesCreateBody };
export async function quotesCreate(
  input: QuotesCreateInput
): Promise<ApiResponse<QuoteDetail>> {
  return api.post("/v2/quotes/create", { body: input.body });
}

export type QuotesCreateFullInput = { body: QuotesCreateFullBody };
export async function quotesCreateFull(
  input: QuotesCreateFullInput
): Promise<ApiResponse<QuoteDetail>> {
  return api.post("/v2/quotes/create/full", { body: input.body });
}

export type QuotesUpdateInput = { body: QuotesUpdateBody };
export async function quotesUpdate(
  input: QuotesUpdateInput
): Promise<ApiResponse<QuoteDetail>> {
  return api.post("/v2/quotes/update", { body: input.body });
}

export type QuotesDeleteInput = IdParams<"quoteId">;
export async function quotesDelete(
  input: QuotesDeleteInput
): Promise<ApiResponse<{ deleted: true }>> {
  return api.post("/v2/quotes/delete", { body: input.params });
}
