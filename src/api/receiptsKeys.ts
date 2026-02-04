import type { StandardListQuery } from "@/api/receipts";

export type ReceiptsSort = Record<string, unknown> | undefined;

export const receiptsKeys = {
  all: ["operations", "receipts"] as const,

  list: (query: StandardListQuery | undefined, sort?: ReceiptsSort) =>
    ["operations", "receipts", "list", query ?? {}, sort ?? {}] as const,

  detail: (receiptId: string) => ["operations", "receipts", "detail", receiptId] as const,

  full: (receiptId: string, query?: Record<string, unknown> | undefined) =>
    ["operations", "receipts", "full", receiptId, query ?? {}] as const,
} as const;
