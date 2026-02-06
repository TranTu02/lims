import React, { useEffect, useMemo, useState } from "react";
import { Search, AlertCircle, Truck, Package, Plus, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

import { ReceiptDetailModal } from "@/components/reception/ReceiptDetailModal";
import { CreateReceiptModal } from "@/components/reception/CreateReceiptModal";
import { ReceiptDeleteModal } from "@/components/reception/ReceiptDeleteModal";

import { RowActionIcons } from "@/components/common/RowActionIcons";

import { receiptsGetFull, receiptsGetList } from "@/api/receipts";
import type {
  ReceiptDetail,
  ReceiptListItem,
  ReceiptStatus,
} from "@/types/receipt";

type TabKey = "processing" | "return-results";

function parseIsoDateOnly(iso?: string | null, fallback = "--"): string {
  if (!iso) return fallback;
  const t = iso.split("T")[0];
  return t.length > 0 ? t : fallback;
}

function safeDaysLeft(deadlineIso?: string | null): number | null {
  if (!deadlineIso) return null;
  const tt = new Date(deadlineIso).getTime();
  if (!Number.isFinite(tt)) return null;
  const days = Math.ceil((tt - Date.now()) / (1000 * 3600 * 24));
  return Number.isFinite(days) ? days : null;
}

function isOverdue(deadlineIso?: string | null): boolean {
  if (!deadlineIso) return false;
  const tt = new Date(deadlineIso).getTime();
  if (!Number.isFinite(tt)) return false;
  return tt < Date.now();
}

function toReceiptStatusLabelKey(status: ReceiptStatus): string {
  if (status === "Draft") return "reception.receipts.status.draft";
  if (status === "Received") return "reception.receipts.status.receive";
  if (status === "Processing") return "reception.receipts.status.processing";
  if (status === "Completed") return "reception.receipts.status.completed";
  if (status === "Reported") return "reception.receipts.status.reported";
  if (status === "Cancelled") return "reception.receipts.status.cancelled";
  return "";
}

function getReceiptStatusBadge(
  status: ReceiptStatus,
  t: (k: string, opt?: Record<string, unknown>) => unknown,
) {
  const key = toReceiptStatusLabelKey(status);
  const label = key ? String(t(key, { defaultValue: status })) : String(status);

  switch (status) {
    case "Draft":
      return (
        <Badge variant="outline" className="text-muted-foreground border-border">
          {label}
        </Badge>
      );

    case "Received":
      return (
        <Badge variant="outline" className="text-muted-foreground border-border">
          {label}
        </Badge>
      );

    case "Processing":
      return (
        <Badge variant="default" className="bg-warning text-warning-foreground hover:bg-warning/90">
          {label}
        </Badge>
      );

    case "Completed":
      return (
        <Badge variant="default" className="bg-success text-success-foreground hover:bg-success/90">
          {label}
        </Badge>
      );

    case "Reported":
      return (
        <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
          {label}
        </Badge>
      );

    case "Cancelled":
      return <Badge variant="destructive">{label}</Badge>;

    default:
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          {label}
        </Badge>
      );
  }
}

export function SampleReception() {
  const { t } = useTranslation();

  const dash = t("common.noData");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("processing");

  const [selectedReceiptFull, setSelectedReceiptFull] =
    useState<ReceiptDetail | null>(null);
  const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] =
    useState(false);

  const [deleteReceiptId, setDeleteReceiptId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState<string | null>(null);

  const [list, setList] = useState<ReceiptListItem[]>([]);
  const [meta, setMeta] = useState<{
    totalPages: number;
    total: number;
  } | null>(null);

  const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingList(true);
      setErrorList(null);

      const res = await receiptsGetList({
        query: {
          page,
          itemsPerPage,
        },
      });

      if (cancelled) return;

      if (!res.success) {
        setList([]);
        setMeta(null);
        setErrorList(res.error?.message ?? t("common.toast.requestFailed"));
        setLoadingList(false);
        return;
      }

      const data = res.data ?? [];
      setList(data);

      const m = res.meta ?? null;

      const totalPages =
        typeof m?.totalPages === "number" && Number.isFinite(m.totalPages)
          ? m.totalPages
          : 1;
      
      const totalItems =
        typeof (m as { totalItems?: unknown })?.totalItems === "number" &&
        Number.isFinite((m as { totalItems: number }).totalItems)
          ? (m as { totalItems: number }).totalItems
          : data.length;
      
      setMeta({ totalPages, total: totalItems });
      
      setLoadingList(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [page, itemsPerPage, refreshTick, t]);

  const filteredProcessing = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = list;
    if (!term) return base;
  
    return base.filter((r) => {
      const code = (r.receiptCode ?? "").toLowerCase();
      const clientName = (r.client?.clientName ?? "").toLowerCase();
      return code.includes(term) || clientName.includes(term);
    });
  }, [list, searchTerm]);

  const filteredReturnResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = list;
  
    if (!term) return base;
  
    return base.filter((r) => {
      const code = (r.receiptCode ?? "").toLowerCase();
      const clientName = (r.client?.clientName ?? "").toLowerCase();
      const clientEmail = (
        (r.client as { clientEmail?: string | null } | null)?.clientEmail ?? ""
      ).toLowerCase();
  
      return code.includes(term) || clientName.includes(term) || clientEmail.includes(term);
    });
  }, [list, searchTerm]);  

  const totalReceipts = meta?.total ?? list.length;

  const overdueReceipts = useMemo(() => {
    return list.filter((r) => isOverdue(r.receiptDeadline)).length;
  }, [list]);

  const pendingSamples = 0;
  const returnResultsCount = filteredReturnResults.length;

  async function openReceipt(receiptId: string) {
    if (openingReceiptId) return;

    setOpeningReceiptId(receiptId);
    const res = await receiptsGetFull({ receiptId });

    if (!res.success) {
      setOpeningReceiptId(null);
      return;
    }

    setSelectedReceiptFull(res.data ?? null);
    setOpeningReceiptId(null);
  }

  return (
    <div className="p-6 space-y-6">
      {selectedReceiptFull && (
        <ReceiptDetailModal
          receipt={selectedReceiptFull}
          onClose={() => setSelectedReceiptFull(null)}
          onSampleClick={() => {}}
          onUpdated={(next) => {
            setSelectedReceiptFull(next);
            setList((prev) =>
              prev.map((r) =>
                r.receiptId === next.receiptId
                  ? {
                      ...r,
                      receiptStatus: next.receiptStatus,
                      receiptDeadline:
                        next.receiptDeadline ?? r.receiptDeadline,
                    }
                  : r
              )
            );
          }}
        />
      )}

      {isCreateReceiptModalOpen && (
        <CreateReceiptModal
          onClose={() => setIsCreateReceiptModalOpen(false)}
        />
      )}

      <ReceiptDeleteModal
        open={deleteReceiptId !== null}
        receiptId={deleteReceiptId}
        onClose={() => setDeleteReceiptId(null)}
        onDeleted={() => setRefreshTick((x) => x + 1)}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.totalReceipts")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {totalReceipts}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.overdueReceipts")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-destructive">
            {overdueReceipts}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.pendingSamples")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-warning">
            {pendingSamples}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("reception.sampleReception.metrics.returnResults")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-primary">
            {returnResultsCount}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={activeTab === "processing" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("processing");
                setPage(1);
              }}
              className={`flex items-center gap-2 ${
                activeTab === "processing"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}>
              <Package className="h-4 w-4" />
              {t("reception.sampleReception.tabs.processing")} (
              {filteredProcessing.length})
            </Button>

            <Button
              variant={activeTab === "return-results" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("return-results");
                setPage(1);
              }}
              className={`flex items-center gap-2 ${
                activeTab === "return-results"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground"
              }`}>
              <Truck className="h-4 w-4" />
              {t("reception.sampleReception.tabs.returnResults")} (
              {filteredReturnResults.length})
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-1 w-full md:w-auto md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("reception.sampleReception.search.placeholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-background"
              />
            </div>

            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => setIsCreateReceiptModalOpen(true)}>
              <Plus className="h-4 w-4" />
              {t("reception.sampleReception.actions.createReceipt")}
            </Button>
          </div>
        </div>
      </div>

      {loadingList && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-44 bg-muted rounded" />
            <div className="h-9 w-full bg-muted rounded" />
            <div className="h-40 w-full bg-muted rounded" />
          </div>
        </div>
      )}

      {!loadingList && errorList && (
        <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{errorList}</span>
        </div>
      )}

      {!loadingList && !errorList && activeTab === "processing" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reception.sampleReception.receiptInfo")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reception.sampleReception.table.processing.status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reception.sampleReception.table.processing.deadline")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reception.sampleReception.table.processing.notes")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reception.sampleReception.table.processing.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredProcessing.map((receipt) => {
                  const daysLeft = safeDaysLeft(receipt.receiptDeadline);

                  return (
                    <tr
                      key={receipt.receiptId}
                      className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <button
                            onClick={() => void openReceipt(receipt.receiptId)}
                            className="font-semibold text-primary hover:text-primary/80 hover:underline"
                            disabled={openingReceiptId === receipt.receiptId}>
                            {receipt.receiptCode ?? dash}
                          </button>

                          <div className="text-sm text-foreground">
                            {receipt.client?.clientName ?? dash}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {parseIsoDateOnly(receipt.receiptDate, dash)}{" "}
                            {receipt.createdBy?.identityName
                              ? `- ${receipt.createdBy.identityName}`
                              : ""}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {getReceiptStatusBadge(receipt.receiptStatus, t)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-foreground">
                              {parseIsoDateOnly(receipt.receiptDeadline, dash)}
                            </span>
                          </div>

                          {typeof daysLeft === "number" ? (
                            daysLeft < 0 ? (
                              <Badge
                                variant="destructive"
                                className="flex items-center gap-1 w-fit">
                                <AlertCircle className="h-3 w-3" />
                                {t(
                                  "reception.sampleReception.deadline.overdue"
                                )}
                              </Badge>
                            ) : daysLeft <= 2 ? (
                              <Badge
                                variant="outline"
                                className="bg-warning/10 text-warning border-warning/20 w-fit">
                                {t(
                                  "reception.sampleReception.deadline.daysLeft",
                                  { count: daysLeft }
                                )}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-muted-foreground w-fit">
                                {t(
                                  "reception.sampleReception.deadline.daysLeft",
                                  { count: daysLeft }
                                )}
                              </Badge>
                            )
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground w-fit">
                              {dash}
                            </Badge>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-muted-foreground">
                        {dash}
                      </td>

                      <td className="px-4 py-4">
                        <RowActionIcons
                          onView={() => void openReceipt(receipt.receiptId)}
                          onDelete={() => setDeleteReceiptId(receipt.receiptId)}
                          showEdit={false}
                          disabled={openingReceiptId === receipt.receiptId}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            totalPages={meta?.totalPages ?? 1}
            currentPage={page}
            itemsPerPage={itemsPerPage}
            totalItems={meta?.total ?? list.length}
            onPageChange={(p) => setPage(p)}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setPage(1);
            }}
          />
        </div>
      )}

      {!loadingList && !errorList && activeTab === "return-results" && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t(
                      "reception.sampleReception.table.returnResults.receiptInfo"
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t(
                      "reception.sampleReception.table.returnResults.tracking"
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t(
                      "reception.sampleReception.table.returnResults.deadline"
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reception.sampleReception.table.returnResults.contact")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {t("reception.sampleReception.table.returnResults.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredReturnResults.map((receipt) => {
                  const trackingNo =
                    (receipt as { receiptTrackingNo?: string | null })
                      .receiptTrackingNo ??
                    (receipt as { trackingNumber?: string | null })
                      .trackingNumber ??
                    null;

                  const clientEmail =
                    (receipt.client as { clientEmail?: string | null } | null)
                      ?.clientEmail ?? null;
                  const clientAddress =
                    (receipt.client as { clientAddress?: string | null } | null)
                      ?.clientAddress ?? null;
                  const clientPhone =
                    (receipt.client as { clientPhone?: string | null } | null)
                      ?.clientPhone ?? null;

                  return (
                    <tr
                      key={receipt.receiptId}
                      className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-foreground">
                            {receipt.receiptCode ?? dash}
                          </div>
                          <div className="text-sm text-foreground">
                            {receipt.client?.clientName ?? dash}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {parseIsoDateOnly(receipt.receiptDate, dash)}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {trackingNo ? (
                          <div className="flex items-center gap-2">
                            <Truck className="h-3 w-3 text-success" />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {t("reception.sampleReception.tracking.none")}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm text-foreground">
                          {parseIsoDateOnly(receipt.receiptDeadline, dash)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="text-foreground">
                            {clientAddress ?? dash}
                          </div>
                          <div className="text-muted-foreground">
                            {t("reception.sampleReception.contact.phoneLabel")}{" "}
                            {clientPhone ?? dash}
                          </div>
                          <div className="text-muted-foreground">
                            {t("reception.sampleReception.contact.emailLabel")}{" "}
                            {clientEmail ?? dash}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <RowActionIcons
                          onView={() => void openReceipt(receipt.receiptId)}
                          onDelete={() => setDeleteReceiptId(receipt.receiptId)}
                          showEdit={false}
                          disabled={openingReceiptId === receipt.receiptId}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            totalPages={meta?.totalPages ?? 1}
            currentPage={page}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}
    </div>
  );
}
