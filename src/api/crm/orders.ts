import { useQuery, keepPreviousData, type UseQueryOptions } from "@tanstack/react-query";
import api from "@/api/client";
import type { ApiResponse } from "@/api/client";
import { assertList, assertSuccess, type ListQuery, type ListResponse } from "./shared";
import { crmKeys } from "@/api/crm/crmKeys";

import type { OrderListItem, OrderDetail, OrderFull, OrdersCreateBody, OrdersCreateFullBody, OrdersUpdateBody } from "@/types/crm/order";

export type OrdersSortDirectionDb = "ASC" | "DESC";
export type OrdersSortParams = {
    sortColumn?: string;
    sortDirection?: OrdersSortDirectionDb;
};

export type OrdersGetListInput = { query?: ListQuery; sort?: OrdersSortParams };

export async function ordersGetList(input: OrdersGetListInput = {}): Promise<ListResponse<OrderListItem>> {
    const finalQuery = { ...(input.query ?? {}), ...(input.sort ?? {}) };

    const res = await api.getRaw<ListResponse<OrderListItem>>("/v2/orders/get/list", {
        query: finalQuery,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    return assertList(res);
}

export type OrdersGetDetailInput = { params: { orderId: string } };
export async function ordersGetDetail(input: OrdersGetDetailInput): Promise<OrderDetail> {
    const res = await api.getRaw<ApiResponse<OrderDetail>>("/v2/orders/get/detail", {
        query: input.params,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return assertSuccess(res);
}

export type OrdersGetFullInput = { params: { orderId: string } };
export async function ordersGetFull(input: OrdersGetFullInput): Promise<OrderFull> {
    const res = await api.getRaw<ApiResponse<OrderFull>>("/v2/orders/get/full", {
        query: input.params,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return assertSuccess(res);
}

export type OrdersCreateInput = { body: OrdersCreateBody };
export async function ordersCreate(input: OrdersCreateInput): Promise<OrderDetail> {
    const res = await api.postRaw<ApiResponse<OrderDetail>, OrdersCreateBody>("/v2/orders/create", { body: input.body });
    return assertSuccess(res);
}

export type OrdersCreateFullInput = { body: OrdersCreateFullBody };
export async function ordersCreateFull(input: OrdersCreateFullInput): Promise<OrderDetail> {
    const res = await api.postRaw<ApiResponse<OrderDetail>, OrdersCreateFullBody>("/v2/orders/create/full", { body: input.body });
    return assertSuccess(res);
}

export type OrdersUpdateInput = { body: OrdersUpdateBody };
export async function ordersUpdate(input: OrdersUpdateInput): Promise<OrderDetail> {
    const res = await api.postRaw<ApiResponse<OrderDetail>, OrdersUpdateBody>("/v2/orders/update", { body: input.body });
    return assertSuccess(res);
}

export type OrdersDeleteInput = { params: { orderId: string } };
export async function ordersDelete(input: OrdersDeleteInput): Promise<{ deleted: true }> {
    return api.postRaw<{ deleted: true }, { orderId: string }>("/v2/orders/delete", { body: input.params });
}

export type OrdersFilterFrom = "orderId" | "quoteId" | "clientId" | "orderStatus" | "paymentStatus" | (string & {});

export type OrdersFilterOtherFilter = {
    filterFrom: OrdersFilterFrom;
    filterValues: string[];
};

export type OrdersFilterBody = {
    filterFrom: OrdersFilterFrom;
    textFilter: string | null;
    otherFilters: OrdersFilterOtherFilter[];
    page?: number;
    itemsPerPage?: number;
};

export type OrdersFilterInput = {
    body: OrdersFilterBody;
};

export async function ordersFilter(input: OrdersFilterInput): Promise<ListResponse<OrderListItem>> {
    const res = await api.postRaw<ListResponse<OrderListItem>, OrdersFilterBody>("/v2/orders/filter", {
        body: input.body,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });

    return assertList(res);
}

export function useOrdersFilter(input: OrdersFilterInput, options?: Pick<UseQueryOptions<ListResponse<OrderListItem>, Error>, "enabled">) {
    return useQuery({
        queryKey: crmKeys.orders.filter(input),
        enabled: options?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: () => ordersFilter(input),
    });
}

export function useOrdersFull(input: OrdersGetFullInput, options?: Pick<UseQueryOptions<OrderFull, Error>, "enabled">) {
    return useQuery({
        queryKey: [...crmKeys.orders.detail(input.params.orderId), "full"],
        enabled: options?.enabled ?? true,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: () => ordersGetFull(input),
    });
}
