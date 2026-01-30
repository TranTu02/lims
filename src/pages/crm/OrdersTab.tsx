import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { OrderListItem } from "@/types/crm/order";
import { crmKeys } from "@/api/crm/crmKeys";
import { ordersDelete, ordersGetList, ordersUpdate } from "@/api/crm/orders";

import { OrderDetailModal } from "@/components/crm/OrderDetailModal";
import { OrderUpsertModal } from "@/components/crm/OrderUpsertModal";
import {
  toOrdersUpdateBody,
  type OrderUpsertFormState,
} from "@/components/crm/orderUpsertMapper";

import { OrderDeleteModal } from "@/components/crm/OrderDeleteModal";
import { RowActionIcons } from "@/components/crm/RowActionIcons";

type Props = {
  externalSearch: string;
};

export type OrdersTabHandle = {
  openCreate: () => void;
};

function CardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

function toStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function orderStatusText(
  status: string | null,
  t: (k: string, opt?: { defaultValue?: string }) => string
) {
  const s = toStr(status).trim();
  if (!s) return t("common.unknown");
  return t(`crm.orders.orderStatus.${s}`, { defaultValue: s });
}

function statusBadge(
  status: string | null,
  t: (k: string, opt?: { defaultValue?: string }) => string
) {
  const s = toStr(status).trim();
  if (!s) return <Badge variant="outline">{t("common.unknown")}</Badge>;

  const label = orderStatusText(s, t);

  switch (s) {
    case "Completed":
      return <Badge variant="success">{label}</Badge>;
    case "Processing":
      return <Badge variant="warning">{label}</Badge>;
    case "Pending":
      return <Badge variant="secondary">{label}</Badge>;
    case "Cancelled":
      return <Badge variant="destructive">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}


export const OrdersTab = forwardRef<OrdersTabHandle, Props>(function OrdersTab(
  props,
  ref
) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState<OrderListItem | null>(null);

  useImperativeHandle(ref, () => ({
    openCreate: () => {
      toast.info(t("common.info.useGlobalCreate"));
    },
  }));

  const query = useMemo(
    () => ({
      page,
      itemsPerPage,
      search: props.externalSearch.trim()
        ? props.externalSearch.trim()
        : undefined,
    }),
    [page, itemsPerPage, props.externalSearch]
  );

  const q = useQuery({
    queryKey: crmKeys.orders.list(query),
    queryFn: async () => ordersGetList({ query }),
  });

  const updateMut = useMutation({
    mutationFn: async (values: OrderUpsertFormState) => {
      const body = toOrdersUpdateBody(values);
      return ordersUpdate({ body });
    },
    onSuccess: async () => {
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.orders.all });
      setEditOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const deleteMut = useMutation({
    mutationFn: async (orderId: string) => {
      return ordersDelete({ params: { orderId } }); // RAW {deleted:true}
    },
    onSuccess: async () => {
      toast.success(t("common.toast.deleted"));
      await qc.invalidateQueries({ queryKey: crmKeys.orders.all });
      setDeleteOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const items: OrderListItem[] = q.data?.data ?? [];
  const totalCount = q.data?.pagination.total ?? items.length;
  const totalPages = q.data?.pagination.totalPages ?? 1;

  if (q.isLoading) return <CardSkeleton />;

  if (q.isError) {
    const msg =
      q.error instanceof Error ? q.error.message : t("common.toast.loadFailed");
    return (
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="text-sm text-destructive">{msg}</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => q.refetch()}>
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Modals */}
      <OrderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        orderId={selected?.orderId ?? null}
      />

      {editOpen && selected ? (
        <OrderUpsertModal
          open={editOpen}
          mode="update"
          initial={selected}
          onClose={() => setEditOpen(false)}
          onSubmit={(values) => updateMut.mutateAsync(values)}
          submitting={updateMut.isPending}
        />
      ) : null}

      <OrderDeleteModal
        open={deleteOpen}
        orderId={selected?.orderId ?? null}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(orderId) => deleteMut.mutateAsync(orderId).then(() => {})}
        submitting={deleteMut.isPending}
      />

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-sm">
          {t("common.count")}: {totalCount}
        </Badge>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.orders.columns.orderId")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.orders.columns.quoteId")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.orders.columns.clientId")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.orders.columns.totalAmount")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.orders.columns.orderStatus")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-sm text-muted-foreground"
                    colSpan={7}>
                    {t("common.empty")}
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr
                    key={o.orderId}
                    className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">
                        {o.orderId}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-foreground">
                      {o.quoteId ?? "-"}
                    </td>

                    <td className="px-4 py-4 text-sm text-foreground">
                      {o.clientId}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-foreground">
                      {o.totalAmount ?? "-"}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {statusBadge(o.orderStatus ?? null, t)}
                    </td>

                    <td className="px-4 py-4">
                      <RowActionIcons
                        onView={() => {
                          setSelected(o);
                          setDetailOpen(true);
                        }}
                        onEdit={() => {
                          setSelected(o);
                          setEditOpen(true);
                        }}
                        onDelete={() => {
                          setSelected(o);
                          setDeleteOpen(true);
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalPages={totalPages}
          currentPage={page}
          itemsPerPage={itemsPerPage}
          totalItems={totalCount}
          onPageChange={setPage}
          onItemsPerPageChange={(n) => {
            setPage(1);
            setItemsPerPage(n);
          }}
        />
      </div>
    </div>
  );
});
