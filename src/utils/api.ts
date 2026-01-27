import type { ApiResponse, ApiMeta } from "@/api/client";

export function unwrapOrThrow<T>(res: ApiResponse<T>): T {
  if (!res.success) {
    throw new Error(res.error?.message ?? "Request failed");
  }
  if (typeof res.data === "undefined") {
    throw new Error("Response success but data is missing");
  }
  return res.data;
}

export function unwrapWithMetaOrThrow<T>(res: ApiResponse<T>): { data: T; meta: ApiMeta | null } {
  if (!res.success) {
    throw new Error(res.error?.message ?? "Request failed");
  }
  if (typeof res.data === "undefined") {
    throw new Error("Response success but data is missing");
  }
  return { data: res.data, meta: res.meta ?? null };
}
