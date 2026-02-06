import api from "@/api/client";
import type { ApiResponse, ApiError } from "@/api/client";
import type { IdParams, ListQuery, ListResponse, SortParams } from "./shared";
import type {
  QuoteDetail,
  QuoteListItem,
  QuotesCreateBody,
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pickString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function pickNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normalizeApiError(v: unknown): ApiError {
  if (isRecord(v)) {
    const code = pickString(v.code) ?? "UNKNOWN_ERROR";
    const message = pickString(v.message) ?? "An unknown error occurred";
    const traceId = pickString(v.traceId) ?? undefined;
    return { code, message, traceId, ...v };
  }
  if (typeof v === "string") return { code: "UNKNOWN_ERROR", message: v };
  return { code: "UNKNOWN_ERROR", message: "An unknown error occurred" };
}

function normalizeQuoteResponse(payload: unknown): ApiResponse<QuoteDetail> {
  if (isRecord(payload) && typeof payload.success === "boolean") {
    const success = payload.success;

    const statusCode =
      pickNumber(payload.statusCode) ?? (success ? 200 : 500);

    const data = (payload as { data?: unknown }).data;
    const meta = (payload as { meta?: unknown }).meta;
    const error = (payload as { error?: unknown }).error;

    return {
      success,
      statusCode,
      data: (data as QuoteDetail | undefined) ?? undefined,
      meta: (meta as ApiResponse<QuoteDetail>["meta"]) ?? null,
      error: error == null ? null : normalizeApiError(error),
    };
  }

  if (isRecord(payload) && typeof payload.quoteId === "string") {
    return {
      success: true,
      statusCode: 200,
      data: payload as QuoteDetail,
      meta: null,
      error: null,
    };
  }

  return {
    success: false,
    statusCode: 500,
    data: undefined,
    meta: null,
    error: { code: "UNEXPECTED_RESPONSE", message: "Unexpected response" },
  };
}

export async function quotesGetDetail(
  input: QuotesGetDetailInput
): Promise<ApiResponse<QuoteDetail>> {
  const raw = await api.getRaw<unknown>("/v2/quotes/get/detail", {
    query: input.params,
  });
  return normalizeQuoteResponse(raw);
}

export type QuotesCreateInput = { body: QuotesCreateBody };
export async function quotesCreate(
  input: QuotesCreateInput
): Promise<ApiResponse<QuoteDetail>> {
  const raw = await api.postRaw<unknown, QuotesCreateBody>("/v2/quotes/create", {
    body: input.body,
  });
  return normalizeQuoteResponse(raw);
}

export type QuotesUpdateInput = { body: QuotesUpdateBody };
export async function quotesUpdate(
  input: QuotesUpdateInput
): Promise<ApiResponse<QuoteDetail>> {
  const raw = await api.postRaw<unknown, QuotesUpdateBody>("/v2/quotes/update", {
    body: input.body,
  });
  return normalizeQuoteResponse(raw);
}

export type QuotesDeleteInput = IdParams<"quoteId">;
export async function quotesDelete(
  input: QuotesDeleteInput
): Promise<ApiResponse<{ deleted: true }>> {
  return api.post("/v2/quotes/delete", { body: input.params });
}
