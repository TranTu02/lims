import api from "@/api/client";
import {
  assertList,
  type IdParams,
  type ListQuery,
  type ListResponse,
  type SortParams,
} from "./shared";

import type {
  OrderDetail,
  OrderFull,
  OrderListItem,
  OrdersCreateBody,
  OrdersCreateFullBody,
  OrdersUpdateBody,
} from "@/types/crm/order";

export type OrdersGetListInput = { query?: ListQuery; sort?: SortParams };

export async function ordersGetList(
  input: OrdersGetListInput = {}
): Promise<ListResponse<OrderListItem>> {
  const finalQuery = {
    ...(input.query ?? {}),
    ...(input.sort ?? {}),
  };

  const res = await api.getRaw<ListResponse<OrderListItem>>("/v2/orders/get/list", {
    query: finalQuery,
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

  return assertList(res);
}

export type OrdersGetDetailInput = IdParams<"orderId">;
export async function ordersGetDetail(input: OrdersGetDetailInput): Promise<OrderDetail> {
  return api.getRaw<OrderDetail>("/v2/orders/get/detail", {
    query: input.params,
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
}

export type OrdersGetFullInput = IdParams<"orderId">;
export async function ordersGetFull(input: OrdersGetFullInput): Promise<OrderFull> {
  return api.getRaw<OrderFull>("/v2/orders/get/full", {
    query: input.params,
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
}

export type OrdersCreateInput = { body: OrdersCreateBody };
export async function ordersCreate(input: OrdersCreateInput): Promise<OrderDetail> {
  return api.postRaw<OrderDetail, OrdersCreateBody>("/v2/orders/create", { body: input.body });
}

export type OrdersCreateFullInput = { body: OrdersCreateFullBody };
export async function ordersCreateFull(input: OrdersCreateFullInput): Promise<OrderDetail> {
  return api.postRaw<OrderDetail, OrdersCreateFullBody>("/v2/orders/create/full", { body: input.body });
}

export type OrdersUpdateInput = { body: OrdersUpdateBody };
export async function ordersUpdate(input: OrdersUpdateInput): Promise<OrderDetail> {
  return api.postRaw<OrderDetail, OrdersUpdateBody>("/v2/orders/update", { body: input.body });
}

export type OrdersDeleteInput = IdParams<"orderId">;
export async function ordersDelete(input: OrdersDeleteInput): Promise<{ deleted: true }> {
  return api.postRaw<{ deleted: true }, { orderId: string }>("/v2/orders/delete", { body: input.params });
}
