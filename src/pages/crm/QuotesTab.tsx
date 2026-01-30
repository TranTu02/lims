import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

import type { QuoteListItem } from "@/types/crm/quote";
import { crmKeys } from "@/api/crm/crmKeys";
import { quotesGetList } from "@/api/crm/quotes";
import { QuoteDetailModal } from "@/components/crm/QuoteDetailModal";
import { QuoteUpsertModal } from "@/components/crm/QuoteUpsertModal";
import { QuoteDeleteModal } from "@/components/crm/QuoteDeleteModal";
import { RowActionIcons } from "@/components/crm/RowActionIcons";

type Props = {
  externalSearch: string;
};

export type QuotesTabHandle = {
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

function quoteStatusBadge(status: string | null, t: (k: string) => string) {
  if (status === "Converted")
    return <Badge variant="default">{t("crm.quotes.status.converted")}</Badge>;
  return <Badge variant="outline">{status ?? t("common.unknown")}</Badge>;
}

export const QuotesTab = forwardRef<QuotesTabHandle, Props>(function QuotesTab(
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

  const [selected, setSelected] = useState<QuoteListItem | null>(null);

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
    queryKey: crmKeys.quotes.list(query),
    queryFn: async () => {
      const res = await quotesGetList({ query });
      return res as unknown as {
        data: QuoteListItem[];
        pagination: { total: number; totalPages: number };
      };
    },
  });

  const items: QuoteListItem[] = q.data?.data ?? [];
  const totalCount = q.data?.pagination?.total ?? items.length;
  const totalPages = q.data?.pagination?.totalPages ?? 1;

  if (q.isLoading) return <CardSkeleton />;

  return (
    <div className="space-y-3">
      {/* Modals */}
      <QuoteDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        data={selected}
      />

      <QuoteUpsertModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        onSubmit={async () => {
          toast.success(t("common.toast.saved"));
          await q.refetch();
        }}
      />

      {editOpen && selected ? (
        <QuoteUpsertModal
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

      <QuoteDeleteModal
        open={deleteOpen}
        quoteId={selected?.quoteId ?? null}
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
                  {t("crm.quotes.columns.quoteId")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.quotes.columns.clientId")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.quotes.columns.totalAmount")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.quotes.columns.quoteStatus")}
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
                    colSpan={6}>
                    {t("common.empty")}
                  </td>
                </tr>
              ) : (
                items.map((qit) => (
                  <tr
                    key={qit.quoteId}
                    className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">
                        {qit.quoteId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {qit.quoteCode ?? "-"}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-foreground">
                      {qit.clientId}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-foreground">
                      {qit.totalAmount ?? "-"}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {quoteStatusBadge(qit.quoteStatus ?? null, t)}
                    </td>

                    <td className="px-4 py-4 text-center text-sm text-foreground">
                      {qit.createdAt}
                    </td>

                    <td className="px-4 py-4">
                      <RowActionIcons
                        onView={() => {
                          setSelected(qit);
                          setDetailOpen(true);
                        }}
                        onEdit={() => {
                          setSelected(qit);
                          setEditOpen(true);
                        }}
                        onDelete={() => {
                          setSelected(qit);
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
