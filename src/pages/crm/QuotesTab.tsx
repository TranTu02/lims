import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

import type {
  QuoteDetail,
  QuoteListItem,
  QuotesCreateBody,
  QuotesUpdateBody,
} from "@/types/crm/quote";
import { crmKeys } from "@/api/crm/crmKeys";
import {
  quotesCreate,
  quotesDelete,
  quotesGetDetail,
  quotesGetList,
  quotesUpdate,
} from "@/api/crm/quotes";
import { QuoteDetailModal } from "@/components/crm/QuoteDetailModal";
import { QuoteUpsertModal } from "@/components/crm/QuoteUpsertModal";
import { QuoteDeleteModal } from "@/components/crm/QuoteDeleteModal";
import { RowActionIcons } from "@/components/crm/RowActionIcons";
import { formatCurrency } from "@/utils/format";

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
  const s = status ?? "";

  switch (s) {
    case "Approved":
      return <Badge variant="success">{t("crm.quotes.status.approved")}</Badge>;
    case "Sent":
      return <Badge variant="warning">{t("crm.quotes.status.sent")}</Badge>;
    case "Draft":
      return <Badge variant="secondary">{t("crm.quotes.status.draft")}</Badge>;
    case "Expired":
      return (
        <Badge variant="destructive">{t("crm.quotes.status.expired")}</Badge>
      );
    default:
      return <Badge variant="outline">{s ? s : t("common.noData")}</Badge>;
  }
}

export const QuotesTab = forwardRef<QuotesTabHandle, Props>(function QuotesTab(
  props,
  ref
) {
  const { t } = useTranslation();
  const qc = useQueryClient();

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

  const listQ = useQuery({
    queryKey: crmKeys.quotes.list(query),
    queryFn: async () => quotesGetList({ query }),
  });

  const editQuoteId = selected?.quoteId ?? null;
  const detailQ = useQuery({
    queryKey: editQuoteId
      ? crmKeys.quotes.detail(editQuoteId)
      : ["crm", "quotes", "detail", "null"],
    enabled: editOpen && !!editQuoteId,
    queryFn: async () => {
      if (!editQuoteId) throw new Error("Missing quoteId");
      const res = await quotesGetDetail({ params: { quoteId: editQuoteId } });
      if (!res.success)
        throw new Error(res.error?.message ?? "Load detail failed");
      return res.data as QuoteDetail;
    },
  });

  const createMut = useMutation({
    mutationFn: (body: QuotesCreateBody) => quotesCreate({ body }),
    onSuccess: async (res) => {
      if (!res.success) throw new Error(res.error?.message ?? "Create failed");
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
      setCreateOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: (body: QuotesUpdateBody) => quotesUpdate({ body }),
    onSuccess: async (res) => {
      if (!res.success) throw new Error(res.error?.message ?? "Update failed");
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
      setEditOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (quoteId: string) => quotesDelete({ params: { quoteId } }),
    onSuccess: async (res) => {
      if (!res.success) throw new Error(res.error?.message ?? "Delete failed");
      toast.success(t("common.toast.deleted"));
      await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
      setDeleteOpen(false);
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    },
  });

  const items: QuoteListItem[] = listQ.data?.data ?? [];
  const totalCount = listQ.data?.pagination?.total ?? items.length;
  const totalPages = listQ.data?.pagination?.totalPages ?? 1;

  if (listQ.isLoading) return <CardSkeleton />;

  if (listQ.isError) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 text-sm text-muted-foreground">
        {t("common.error")}
      </div>
    );
  }

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
        submitting={createMut.isPending}
        onSubmit={(body) =>
          createMut.mutateAsync(body as QuotesCreateBody).then(() => undefined)
        }
      />

      {editOpen ? (
        <QuoteUpsertModal
          key={editQuoteId ?? "edit-null"}
          open={editOpen}
          mode="update"
          initial={
            (detailQ.data ?? selected) as QuoteDetail | QuoteListItem | null
          }
          onClose={() => setEditOpen(false)}
          submitting={detailQ.isLoading || updateMut.isPending}
          onSubmit={(body) =>
            updateMut
              .mutateAsync(body as QuotesUpdateBody)
              .then(() => undefined)
          }
          onSaved={async () => {
            toast.success(t("common.toast.saved"));
            await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
          }}
        />
      ) : null}

      <QuoteDeleteModal
        open={deleteOpen}
        quoteId={selected?.quoteId ?? null}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(quoteId) =>
          deleteMut.mutateAsync(quoteId).then(() => undefined)
        }
        submitting={deleteMut.isPending}
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
                      {qit.clientId ?? "-"}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-foreground">
                      {formatCurrency(qit.totalAmount)}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {quoteStatusBadge(qit.quoteStatus ?? null, t)}
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
