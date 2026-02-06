import api, { type ApiResponse } from "@/api/client";
import type {
  ReceiptDetail,
  ReceiptListItem,
  ReceiptDeleteResult,
  ReceiptsCreateBody,
  ReceiptsCreateFullBody,
  ReceiptsUpdateBody,
  ReceiptsDeleteBody,
} from "@/types/receipt";

export type StandardListQuery = {
  page?: number;
  itemsPerPage?: number;

  search?: string;

  filters?: Record<string, unknown>;

  [key: string]: unknown;
};

export type ReceiptsGetListInput = {
  query?: StandardListQuery;
  sort?: Record<string, unknown>;
};

export async function receiptsGetList(
  input: ReceiptsGetListInput = {},
): Promise<ApiResponse<ReceiptListItem[]>> {
  const { query, sort } = input;
  return api.get<ReceiptListItem[], StandardListQuery>("/v2/receipts/get/list", {
    query: { ...(query ?? {}), ...(sort ? { sort } : {}) },
    headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
  });
}

export type ReceiptsGetFullInput = {
  receiptId: string;
  query?: Record<string, unknown>;
};

export async function receiptsGetFull(
  input: ReceiptsGetFullInput,
): Promise<ApiResponse<ReceiptDetail>> {
  const { receiptId, query } = input;
  return api.get<ReceiptDetail>("/v2/receipts/get/full", {
    query: { receiptId, ...(query ?? {}) },
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export type ReceiptsCreateInput = {
  body: ReceiptsCreateBody;
  query?: Record<string, unknown>;
};

export async function receiptsCreate(
  input: ReceiptsCreateInput,
): Promise<ApiResponse<ReceiptDetail>> {
  const { body, query } = input;
  return api.post<ReceiptDetail, ReceiptsCreateBody>("/v2/receipts/create", {
    body,
    query,
  });
}

export type ReceiptsCreateFullInput = {
  body: ReceiptsCreateFullBody;
  query?: Record<string, unknown>;
};

export async function receiptsCreateFull(
  input: ReceiptsCreateFullInput,
): Promise<ApiResponse<ReceiptDetail>> {
  const { body, query } = input;
  return api.post<ReceiptDetail, ReceiptsCreateFullBody>("/v2/receipts/create/full", {
    body,
    query,
  });
}

export type ReceiptsUpdateInput = {
  body: ReceiptsUpdateBody;
  query?: Record<string, unknown>;
};

export async function receiptsUpdate(
  input: ReceiptsUpdateInput,
): Promise<ApiResponse<ReceiptDetail>> {
  const { body, query } = input;
  return api.post<ReceiptDetail, ReceiptsUpdateBody>("/v2/receipts/update", {
    body,
    query,
  });
}

export type ReceiptsDeleteInput = {
  body: ReceiptsDeleteBody;
  query?: Record<string, unknown>;
};

export async function receiptsDelete(
  input: ReceiptsDeleteInput,
): Promise<ApiResponse<ReceiptDeleteResult>> {
  const { body, query } = input;
  return api.post<ReceiptDeleteResult, ReceiptsDeleteBody>("/v2/receipts/delete", {
    body,
    query,
  });
}
