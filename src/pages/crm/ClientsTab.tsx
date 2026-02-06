import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type {
  ClientDetail,
  ClientListItem,
  ClientsCreateBody,
  ClientsUpdateBody,
} from "@/types/crm/client";
import { crmKeys } from "@/api/crm/crmKeys";
import {
  clientsCreate,
  clientsDelete,
  clientsGetDetail,
  clientsGetList,
  clientsUpdate,
} from "@/api/crm/clients";

import { ClientDetailModal } from "@/components/crm/ClientDetailModal";
import { ClientUpsertModal } from "@/components/crm/ClientUpsertModal";
import { ClientDeleteModal } from "@/components/crm/ClientDeleteModal";
import { RowActionIcons } from "@/components/common/RowActionIcons";

import {
  toClientCreateBody,
  toClientUpdateBody,
  type ClientUpsertFormState,
} from "@/components/crm/clientUpsertMapper";

type Props = {
  externalSearch: string;
};

export type ClientsTabHandle = {
  openCreate: () => void;
};

type ClientsListResponse = {
  data: ClientListItem[];
  pagination: { total: number; totalPages: number };
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

function pickInvoiceName(c: Pick<ClientListItem, "invoiceInfo">) {
  return c.invoiceInfo?.taxName ?? "-";
}

function SaleScopeBadge(props: { scope: ClientListItem["clientSaleScope"] }) {
  const { t } = useTranslation();
  const scope = props.scope ?? null;

  if (scope === "public") {
    return (
      <Badge variant="secondary" className="text-xs">
        {t("crm.clients.saleScope.public")}
      </Badge>
    );
  }

  if (scope === "private") {
    return (
      <Badge variant="warning" className="text-xs">
        {t("crm.clients.saleScope.private")}
      </Badge>
    );
  }

  return null;
}

function useClientDetailOnHover(clientId: string) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const cached = qc.getQueryData<ClientDetail>(
    crmKeys.clients.detail(clientId)
  );

  const q = useQuery({
    queryKey: crmKeys.clients.detail(clientId),
    enabled: open && !cached,
    queryFn: async () => clientsGetDetail({ params: { clientId } }),
  });

  return {
    open,
    setOpen,
    detail: cached ?? q.data ?? null,
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

function ClientInvoiceTooltip(props: {
  clientId: string;
  preview: ClientListItem;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { open, setOpen, detail, isLoading, isError } = useClientDetailOnHover(
    props.clientId
  );

  const invoice = detail?.invoiceInfo ?? props.preview.invoiceInfo;

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
        <TooltipTrigger asChild>{props.children}</TooltipTrigger>

        <TooltipContent className="max-w-lg border border-border bg-popover text-popover-foreground shadow-md">
          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground">
              {t("crm.clients.tooltip.invoiceTitle")}
            </div>

            <div className="text-xs text-muted-foreground">
              {t("crm.clients.tooltip.taxName")}:{" "}
              <span className="text-foreground">{invoice?.taxName ?? "-"}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              {t("crm.clients.tooltip.taxCode")}:{" "}
              <span className="text-foreground">{invoice?.taxCode ?? "-"}</span>
            </div>

            <div className="text-xs text-muted-foreground">
              {t("crm.clients.tooltip.taxEmail")}:{" "}
              <span className="text-foreground">
                {invoice?.taxEmail ?? "-"}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              {t("crm.clients.tooltip.taxAddress")}:{" "}
              <span className="text-foreground">
                {invoice?.taxAddress ?? "-"}
              </span>
            </div>

            {isLoading ? (
              <div className="text-xs text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : null}

            {isError ? (
              <div className="text-xs text-destructive">
                {t("common.error")}
              </div>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ClientContactsTooltip(props: {
  clientId: string;
  preview: ClientListItem;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { open, setOpen, detail, isLoading, isError } = useClientDetailOnHover(
    props.clientId
  );

  const contacts = detail?.clientContacts ?? props.preview.clientContacts ?? [];

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
        <TooltipTrigger asChild>{props.children}</TooltipTrigger>

        <TooltipContent className="max-w-lg border border-border bg-popover text-popover-foreground shadow-md">
          <div className="space-y-2">
            <div className="text-xs font-medium text-foreground">
              {t("crm.clients.tooltip.contactsTitle")}
            </div>

            {contacts.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                {t("common.empty")}
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((c, idx) => (
                  <div
                    key={`${c.contactId ?? "none"}-${idx}`}
                    className="rounded-md border border-border p-2">
                    <div className="text-xs font-medium text-foreground">
                      {c.contactName ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.contactPosition ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.contactPhone ?? "-"} • {c.contactEmail ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.contactAddress ?? "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="text-xs text-muted-foreground">
                {t("common.loading")}
              </div>
            ) : null}

            {isError ? (
              <div className="text-xs text-destructive">
                {t("common.error")}
              </div>
            ) : null}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ContactsCompactLabel(props: {
  contacts: ClientListItem["clientContacts"];
}) {
  const contacts = props.contacts ?? [];
  const first = contacts[0]?.contactName ?? "-";
  const more = Math.max(0, contacts.length - 1);

  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground">
        {first}
      </span>

      {more > 0 ? (
        <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          +{more}
        </span>
      ) : null}
    </div>
  );
}

export const ClientsTab = forwardRef<ClientsTabHandle, Props>(
  function ClientsTab(props, ref) {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [selected, setSelected] = useState<ClientListItem | null>(null);

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
      queryKey: crmKeys.clients.list(query),
      queryFn: async () => {
        const res = (await clientsGetList({ query })) as ClientsListResponse;
        return res;
      },
    });

    const selectedClientId = selected?.clientId ?? null;

    const detailQ = useQuery({
      queryKey: selectedClientId
        ? crmKeys.clients.detail(selectedClientId)
        : ["crm", "clients", "detail", "none"],
      enabled: !!selectedClientId && (detailOpen || editOpen),
      queryFn: async () =>
        clientsGetDetail({ params: { clientId: selectedClientId! } }),
    });

    const createMut = useMutation({
      mutationFn: (body: ClientsCreateBody) => clientsCreate({ body }),
    });

    const updateMut = useMutation({
      mutationFn: (body: ClientsUpdateBody) => clientsUpdate({ body }),
    });

    const deleteMut = useMutation({
      mutationFn: (clientId: string) => clientsDelete({ params: { clientId } }),
    });

    const items: ClientListItem[] = q.data?.data ?? [];
    const totalCount = q.data?.pagination?.total ?? items.length;
    const totalPages = q.data?.pagination?.totalPages ?? 1;

    if (q.isLoading) return <CardSkeleton />;

    if (q.isError) {
      const msg = q.error instanceof Error ? q.error.message : String(q.error);
      return (
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {msg}
        </div>
      );
    }

    const detailData: ClientDetail | ClientListItem | null =
      detailQ.data ?? selected;

    return (
      <div className="space-y-3">
        <ClientDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          data={detailData}
        />

        <ClientUpsertModal
          open={createOpen}
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSubmit={async (values: ClientUpsertFormState) => {
            const body = toClientCreateBody(values);

            await createMut.mutateAsync(body);

            await qc.invalidateQueries({ queryKey: crmKeys.clients.all });
            await q.refetch();
          }}
        />

        {editOpen && selected ? (
          <ClientUpsertModal
            open={editOpen}
            mode="update"
            initial={detailData}
            onClose={() => setEditOpen(false)}
            onSubmit={async (values: ClientUpsertFormState) => {
              const body = toClientUpdateBody(values);

              await updateMut.mutateAsync(body);

              await qc.invalidateQueries({ queryKey: crmKeys.clients.all });
              await qc.invalidateQueries({
                queryKey: crmKeys.clients.detail(body.clientId),
              });

              await q.refetch();
            }}
          />
        ) : null}

        <ClientDeleteModal
          open={deleteOpen}
          clientId={selected?.clientId ?? null}
          onClose={() => setDeleteOpen(false)}
          onConfirm={async (clientId) => {
            await deleteMut.mutateAsync(clientId);

            toast.success(t("common.toast.deleted"));
            await qc.invalidateQueries({ queryKey: crmKeys.clients.all });
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
            <table className="w-full min-w-5xl">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.clientId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.clientName")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.legalId")}
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.invoiceName")}
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("crm.clients.columns.primaryContact")}
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
                  items.map((c) => (
                    <tr
                      key={c.clientId}
                      className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground">
                          {c.clientId}
                        </div>
                        <div className="mt-1">
                          <SaleScopeBadge scope={c.clientSaleScope} />
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-foreground">
                          {c.clientName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.clientPhone ?? "-"} • {c.clientEmail ?? "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-foreground">
                        {c.legalId ?? "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-foreground">
                        <ClientInvoiceTooltip clientId={c.clientId} preview={c}>
                          <div className="cursor-default">
                            <div className="font-medium text-foreground">
                              {pickInvoiceName(c)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {c.invoiceInfo?.taxCode ?? "-"}
                            </div>
                          </div>
                        </ClientInvoiceTooltip>
                      </td>

                      <td className="px-4 py-4 text-sm text-foreground">
                        <ClientContactsTooltip
                          clientId={c.clientId}
                          preview={c}>
                          <div className="cursor-default">
                            <ContactsCompactLabel contacts={c.clientContacts} />
                          </div>
                        </ClientContactsTooltip>
                      </td>

                      <td className="px-4 py-4">
                        <RowActionIcons
                          onView={() => {
                            setSelected(c);
                            setDetailOpen(true);
                          }}
                          onEdit={() => {
                            setSelected(c);
                            setEditOpen(true);
                          }}
                          onDelete={() => {
                            setSelected(c);
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
  }
);
