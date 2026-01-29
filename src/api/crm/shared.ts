import type { ApiResponse } from "@/api/client";

export type ListQuery = {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  [key: string]: unknown;
};

export type SortDirection = "asc" | "desc";

export type SortParams = {
  sortBy?: string;
  sortDir?: SortDirection;
};

export type IdParams<K extends string> = { params: Record<K, string> };

export type Pagination = {
  page: number;
  itemsPerPage: number;
  total: number;
  totalPages: number;
};

export type ListResponse<TItem> = {
  data: TItem[];
  pagination: Pagination;
};

// ✅ assert cho ApiResponse (các endpoint chuẩn)
export function assertSuccess<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new Error(res.error?.message ?? "Unknown error");
  if (res.data === undefined) throw new Error("Missing data");
  return res.data;
}

// ✅ assert cho CRM list raw response
export function assertList<TItem>(res: ListResponse<TItem>): ListResponse<TItem> {
  if (!res || !Array.isArray(res.data)) throw new Error("Invalid list response shape");
  return res;
}
