import { useEffect, useMemo, useState } from "react";
import { Search, AlertCircle, Truck, Package, Plus, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

import { ReceiptDetailModal } from "@/components/reception/ReceiptDetailModal";
import { CreateReceiptModal } from "@/components/reception/CreateReceiptModal";
import { ReceiptDeleteModal } from "@/components/reception/ReceiptDeleteModal";
import { IncomingRequestsTable } from "@/components/reception/IncomingRequestsTable";
import { IncomingRequestDetailModal } from "@/components/reception/IncomingRequestDetailModal";

import { receiptsGetFull, useReceiptsProcessing, useReceiptsList } from "@/api/receipts";
import { useIncomingRequestsList } from "@/api/incomingRequests";
import type { ReceiptDetail, ReceiptListItem } from "@/types/receipt";
import type { IncomingRequestListItem } from "@/types/incomingRequest";

import { useServerPagination } from "@/components/library/hooks/useServerPagination";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import { ReceiptsTable, type ReceiptExcelFiltersState, type TabKey } from "@/components/reception/ReceiptsTable";

function createEmptyFilters(): ReceiptExcelFiltersState {
    return {
        receiptStatus: [],
        receiptCode: [],
    };
}

function isOverdue(deadlineIso?: string | null): boolean {
    if (!deadlineIso) return false;
    const tt = new Date(deadlineIso).getTime();
    if (!Number.isFinite(tt)) return false;
    return tt < Date.now();
}

export function SampleReception() {
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<TabKey>("incoming-requests");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [selectedReceiptFull, setSelectedReceiptFull] = useState<ReceiptDetail | null>(null);
    const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState(false);
    const [deleteReceiptId, setDeleteReceiptId] = useState<string | null>(null);
    const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);

    // Fast-convert & Detail modal state
    const [convertingRequest, setConvertingRequest] = useState<IncomingRequestListItem | null>(null);
    const [viewingRequestId, setViewingRequestId] = useState<string | null>(null);

    const [excelFilters, setExcelFilters] = useState<ReceiptExcelFiltersState>(() => createEmptyFilters());
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 10);

    const isIncomingTab = activeTab === "incoming-requests";
    const isProcessingTab = activeTab === "processing";

    // ── Incoming Requests Query ──────────────────────────────────────────────
    const incomingInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : undefined,
            },
        }),
        [pagination.currentPage, pagination.itemsPerPage, debouncedSearch],
    );

    const incomingQ = useIncomingRequestsList(incomingInput, { enabled: isIncomingTab });

    // ── Receipts Queries ─────────────────────────────────────────────────────
    const listInput = useMemo(() => {
        const otherFilters: Array<{ filterFrom: string; filterValues: string[] }> = [];
        if (excelFilters.receiptStatus.length > 0) {
            otherFilters.push({ filterFrom: "receiptStatus", filterValues: excelFilters.receiptStatus });
        }
        if (excelFilters.receiptCode.length > 0) {
            otherFilters.push({ filterFrom: "receiptCode", filterValues: excelFilters.receiptCode });
        }

        return {
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
                ...(otherFilters.length ? { otherFilters } : {}),
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        };
    }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearch, excelFilters]);

    const receiptsProcessingQ = useReceiptsProcessing(listInput, { enabled: isProcessingTab });
    const receiptsListQ = useReceiptsList(listInput, { enabled: !isProcessingTab && !isIncomingTab });

    // ── Active data ──────────────────────────────────────────────────────────
    const activeQuery = isIncomingTab ? incomingQ : isProcessingTab ? receiptsProcessingQ : receiptsListQ;

    const pageItems = useMemo(() => (activeQuery.data?.data ?? []) as ReceiptListItem[], [activeQuery.data]);
    const incomingItems = useMemo(() => (incomingQ.data?.data ?? []) as IncomingRequestListItem[], [incomingQ.data]);

    const totalItems = isIncomingTab
        ? (((incomingQ.data?.pagination as Record<string, unknown>)?.total as number) ?? ((incomingQ.data?.pagination as Record<string, unknown>)?.totalItems as number) ?? incomingItems.length)
        : ((activeQuery.data as { meta?: { total?: number; totalPages?: number } })?.meta?.total ?? pageItems.length);

    const totalPages = isIncomingTab
        ? (((incomingQ.data?.pagination as Record<string, unknown>)?.totalPages as number) ?? 1)
        : Math.max(1, (activeQuery.data as { meta?: { total?: number; totalPages?: number } })?.meta?.totalPages ?? Math.ceil(totalItems / pagination.itemsPerPage));

    useEffect(() => {
        setServerTotalPages(totalPages);
    }, [totalPages]);

    const overdueReceipts = useMemo(() => {
        return pageItems.filter((r) => isOverdue(r.receiptDeadline)).length;
    }, [pageItems]);

    const isLoading = activeQuery.isLoading || activeQuery.isFetching;
    const isError = activeQuery.isError;

    const onSearchChange = (v: string) => {
        setSearchTerm(v);
        pagination.resetPage();
    };

    const onExcelFiltersChange = (next: ReceiptExcelFiltersState) => {
        setExcelFilters(next);
        pagination.resetPage();
    };

    async function openReceipt(receiptId: string) {
        if (openingReceiptId) return;

        setOpeningReceiptId(receiptId);
        const res = await receiptsGetFull({ receiptId });

        if ((res as any).success === false) {
            setOpeningReceiptId(null);
            return;
        }

        const data = (res as any).data !== undefined ? (res as any).data : res;
        setSelectedReceiptFull(data ?? null);
        setOpeningReceiptId(null);
    }

    return (
        <div className="p-6 space-y-6">
            {selectedReceiptFull && (
                <ReceiptDetailModal
                    receipt={selectedReceiptFull}
                    onClose={() => setSelectedReceiptFull(null)}
                    onSampleClick={() => {}}
                    onUpdated={(next: ReceiptDetail) => setSelectedReceiptFull(next)}
                />
            )}

            {isCreateReceiptModalOpen && <CreateReceiptModal onClose={() => setIsCreateReceiptModalOpen(false)} />}

            <ReceiptDeleteModal open={deleteReceiptId !== null} receiptId={deleteReceiptId} onClose={() => setDeleteReceiptId(null)} onDeleted={() => {}} />

            {/* Create Receipt from Incoming Request */}
            {convertingRequest && <CreateReceiptModal initialIncomingRequest={convertingRequest} onClose={() => setConvertingRequest(null)} onCreated={() => setConvertingRequest(null)} />}

            {/* Incoming Request Detail Modal */}
            {viewingRequestId && <IncomingRequestDetailModal requestId={viewingRequestId} onClose={() => setViewingRequestId(null)} />}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{t("reception.sampleReception.metrics.totalReceipts")}</div>
                    <div className="text-3xl font-semibold mt-1 text-foreground">{totalItems}</div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{t("reception.sampleReception.metrics.overdueReceipts")}</div>
                    <div className="text-3xl font-semibold mt-1 text-destructive">{overdueReceipts}</div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{t("reception.sampleReception.metrics.pendingSamples")}</div>
                    <div className="text-3xl font-semibold mt-1 text-muted-foreground">0</div>
                </div>

                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{t("reception.sampleReception.metrics.returnResults")}</div>
                    <div className="text-3xl font-semibold mt-1 text-foreground">{totalItems}</div>
                </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
                        {/* ── Tab: Yêu cầu tiếp nhận ──────────────────── */}
                        <Button
                            variant={activeTab === "incoming-requests" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => {
                                setActiveTab("incoming-requests");
                                pagination.resetPage();
                            }}
                            className={`flex items-center gap-2 ${activeTab === "incoming-requests" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                            <Inbox className="h-4 w-4" />
                            {t("reception.sampleReception.tabs.incomingRequests", { defaultValue: "Yêu cầu tiếp nhận" })} {activeTab === "incoming-requests" ? `(${totalItems})` : ""}
                        </Button>

                        {/* ── Tab: Đang xử lý ─────────────────────────── */}
                        <Button
                            variant={activeTab === "processing" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => {
                                setActiveTab("processing");
                                pagination.resetPage();
                            }}
                            className={`flex items-center gap-2 ${activeTab === "processing" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                            <Package className="h-4 w-4" />
                            {t("reception.sampleReception.tabs.processing")} {activeTab === "processing" ? `(${totalItems})` : ""}
                        </Button>

                        {/* ── Tab: Trả kết quả ────────────────────────── */}
                        <Button
                            variant={activeTab === "return-results" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => {
                                setActiveTab("return-results");
                                pagination.resetPage();
                            }}
                            className={`flex items-center gap-2 ${activeTab === "return-results" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                            <Truck className="h-4 w-4" />
                            {t("reception.sampleReception.tabs.returnResults")} {activeTab === "return-results" ? `(${totalItems})` : ""}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-1 w-full md:w-auto md:max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("reception.sampleReception.search.placeholder")}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 bg-background"
                            />
                        </div>

                        {!isIncomingTab && (
                            <Button variant="default" className="flex items-center gap-2" onClick={() => setIsCreateReceiptModalOpen(true)}>
                                <Plus className="h-4 w-4" />
                                {t("reception.sampleReception.actions.createReceipt")}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 w-44 bg-muted rounded" />
                        <div className="h-9 w-full bg-muted rounded" />
                        <div className="h-40 w-full bg-muted rounded" />
                    </div>
                </div>
            ) : null}

            {isError ? (
                <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{t("common.toast.requestFailed")}</span>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    {isIncomingTab ? (
                        /* ── Incoming Requests Table ── */
                        <IncomingRequestsTable
                            items={incomingItems}
                            isLoading={isLoading}
                            onConvert={(item) => setConvertingRequest(item)}
                            onViewDetail={(requestId) => setViewingRequestId(requestId)}
                        />
                    ) : (
                        /* ── Receipts Table ── */
                        <ReceiptsTable
                            items={pageItems}
                            activeTab={activeTab}
                            selectedRowKey={selectedRowKey}
                            onSelectRow={(rowKey, receiptId) => {
                                setSelectedRowKey(rowKey);
                                void openReceipt(receiptId);
                            }}
                            onView={(id) => void openReceipt(id)}
                            onDelete={(id) => setDeleteReceiptId(id)}
                            excelFilters={excelFilters}
                            onExcelFiltersChange={onExcelFiltersChange}
                            openingReceiptId={openingReceiptId}
                        />
                    )}

                    <div>
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={totalPages}
                            itemsPerPage={pagination.itemsPerPage}
                            totalItems={totalItems}
                            onPageChange={pagination.handlePageChange}
                            onItemsPerPageChange={pagination.handleItemsPerPageChange}
                        />
                    </div>
                </div>
            ) : null}

            {/* Rendering Incoming Request Detail Modal */}
            {viewingRequestId && <IncomingRequestDetailModal requestId={viewingRequestId} onClose={() => setViewingRequestId(null)} />}
        </div>
    );
}
