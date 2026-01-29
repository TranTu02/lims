import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

import type { OrderListItem } from "@/types/crm/order";
import { crmKeys } from "@/api/crm/crmKeys";
import { ordersGetList } from "@/api/crm/orders";
import { OrderDetailModal } from "@/components/crm/OrderDetailModal";
import { OrderUpsertModal } from "@/components/crm/OrderUpsertModal";
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

function statusBadge(status: string | null, t: (k: string) => string) {
  if (status === "Completed")
    return <Badge variant="default">{t("crm.orders.status.completed")}</Badge>;
  if (status === "Pending")
    return <Badge variant="secondary">{t("crm.orders.status.pending")}</Badge>;
  return <Badge variant="outline">{status ?? t("common.unknown")}</Badge>;
}

export const OrdersTab = forwardRef<OrdersTabHandle, Props>(function OrdersTab(
  props,
  ref
) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState<OrderListItem | null>(null);

  useImperativeHandle(ref, () => ({
    openCreate: () => setCreateOpen(true),
  }));

  const query = useMemo(
    () => ({
      page,
      itemsPerPage,
      search:
        props.externalSearch.trim().length > 0
          ? props.externalSearch.trim()
          : undefined,
    }),
    [page, itemsPerPage, props.externalSearch]
  );

  const q = useQuery({
    queryKey: crmKeys.orders.list(query),
    queryFn: async () => {
      const res = await ordersGetList({ query });
      return res as unknown as {
        data: OrderListItem[];
        pagination: { total: number; totalPages: number };
      };
    },
  });

  const items: OrderListItem[] = q.data?.data ?? [];
  const totalCount = q.data?.pagination?.total ?? items.length;
  const totalPages = q.data?.pagination?.totalPages ?? 1;

  if (q.isLoading) return <CardSkeleton />;

  return (
    <div className="space-y-3">
      {/* Modals */}
      <OrderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        data={selected}
      />

      <OrderUpsertModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={async () => {
          toast.success(t("common.toast.saved"));
          await q.refetch();
        }}
      />

      {editOpen && selected ? (
        <OrderUpsertModal
          open={editOpen}
          mode="update"
          initial={selected}
          onClose={() => setEditOpen(false)}
          onSubmit={async () => {
            toast.success(t("common.toast.saved"));
            await q.refetch();
          }}
        />
      ) : null}

      <OrderDeleteModal
        open={deleteOpen}
        orderId={selected?.orderId ?? null}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          toast.success(t("common.toast.deleted"));
          await q.refetch();
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-sm">
          {t("common.count")}: {totalCount || items.length}
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
                  {t("common.createdAt")}
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

                    <td className="px-4 py-4 text-center text-sm text-foreground">
                      {o.createdAt}
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
