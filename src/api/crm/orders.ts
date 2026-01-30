import api from "@/api/client";
import type { ApiResponse } from "@/api/client";
import type { IdParams, ListQuery, ListResponse, SortParams } from "./shared";
import type {
  OrderDetail,
  OrderFull,
  OrderListItem,
  OrdersCreateBody,
  OrdersCreateFullBody,
  OrdersUpdateBody,
} from "../../types/crm/order";

export type OrdersGetListInput = { query?: ListQuery; sort?: SortParams };
export async function ordersGetList(
  input: OrdersGetListInput = {}
): Promise<ListResponse<OrderListItem>> {
  const finalQuery: Record<string, unknown> = {
    ...(input.query ?? {}),
    ...(input.sort ?? {}),
  };
  return api.get("/v2/orders/get/list", {
    query: finalQuery,
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  }) as unknown as Promise<ListResponse<OrderListItem>>;
}

export type OrdersGetDetailInput = IdParams<"orderId">;
export async function ordersGetDetail(
  input: OrdersGetDetailInput
): Promise<ApiResponse<OrderDetail>> {
  return api.get("/v2/orders/get/detail", { query: input.params });
}

export type OrdersGetFullInput = IdParams<"orderId">;
export async function ordersGetFull(
  input: OrdersGetFullInput
): Promise<ApiResponse<OrderFull>> {
  return api.get("/v2/orders/get/full", { query: input.params });
}

export type OrdersCreateInput = { body: OrdersCreateBody };
export async function ordersCreate(
  input: OrdersCreateInput
): Promise<ApiResponse<OrderDetail>> {
  return api.post("/v2/orders/create", { body: input.body });
}

export type OrdersCreateFullInput = { body: OrdersCreateFullBody };
export async function ordersCreateFull(
  input: OrdersCreateFullInput
): Promise<ApiResponse<OrderDetail>> {
  return api.post("/v2/orders/create/full", { body: input.body });
}

export type OrdersUpdateInput = { body: OrdersUpdateBody };
export async function ordersUpdate(
  input: OrdersUpdateInput
): Promise<ApiResponse<OrderDetail>> {
  return api.post("/v2/orders/update", { body: input.body });
}

export type OrdersDeleteInput = IdParams<"orderId">;
export async function ordersDelete(
  input: OrdersDeleteInput
): Promise<ApiResponse<{ deleted: true }>> {
  return api.post("/v2/orders/delete", { body: input.params });
}
