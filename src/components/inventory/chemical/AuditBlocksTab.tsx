import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChemicalAuditBlocksList, useChemicalAuditBlockFull } from "@/api/chemical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, X, Loader2, ListOrdered, Calendar, User, Target, CheckCircle2, Plus, Pencil } from "lucide-react";
import type { ChemicalAuditBlock, ChemicalInventory } from "@/types/chemical";
import { Pagination } from "@/components/ui/pagination";
import { AuditBlockEditModal } from "./AuditBlockEditModal";
import { CreateBlockModal } from "./TransactionBlocksTab";
import { RefreshCw } from "lucide-react";
import { TableFilterPopover } from "./TableFilterPopover";

// Status badge
function AuditStatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const AUDIT_STATUS_MAP: Record<string, { label: string; cls: string }> = {
        DRAFT: { label: t("inventory.chemical.audit.statusLabels.DRAFT", { defaultValue: "Nháp" }), cls: "bg-muted text-muted-foreground" },
        IN_PROGRESS: { label: t("inventory.chemical.audit.statusLabels.IN_PROGRESS", { defaultValue: "Đang kiểm" }), cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
        PENDING_APPROVAL: {
            label: t("inventory.chemical.audit.statusLabels.PENDING_APPROVAL", { defaultValue: "Chờ duyệt" }),
            cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        },
        COMPLETED: { label: t("inventory.chemical.audit.statusLabels.COMPLETED", { defaultValue: "Hoàn thành" }), cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        CANCELLED: { label: t("inventory.chemical.audit.statusLabels.CANCELLED", { defaultValue: "Đã hủy" }), cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    };
    const s = status ? AUDIT_STATUS_MAP[status] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

// Detail Panel
function AuditBlockDetailPanel({
    block,
    onClose,
    onEdit,
    onApprove,
}: {
    block: ChemicalAuditBlock;
    onClose: () => void;
    onEdit: (b: ChemicalAuditBlock) => void;
    onApprove: (b: ChemicalAuditBlock) => void;
}) {
    const { t } = useTranslation();
    const fullQuery = useChemicalAuditBlockFull(block.chemicalAuditBlockId, { enabled: !!block.chemicalAuditBlockId });
    const display = fullQuery.data || block;

    return (
        <div className="w-96 lg:w-[500px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{t("inventory.chemical.audit.detail", { defaultValue: "Chi tiết Kiểm kê" })}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{display.chemicalAuditBlockId}</p>
                </div>
                <div className="flex items-center gap-1">
                    {display.chemicalAuditBlockStatus !== "COMPLETED" && display.chemicalAuditBlockStatus !== "CANCELLED" && (
                        <Button
                            variant="default"
                            size="sm"
                            type="button"
                            onClick={() => onApprove(display)}
                            title={t("inventory.chemical.audit.approveTooltip", { defaultValue: "Duyệt kiểm kê (Điều chỉnh kho)" })}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-1" /> {t("common.approve", { defaultValue: "Duyệt" })}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" type="button" onClick={() => onEdit(display)} title={t("common.edit", { defaultValue: "Sửa" })}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {fullQuery.isLoading ? (
                <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="p-4 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <Target className="h-3 w-3" />
                                {t("inventory.chemical.audit.auditName", { defaultValue: "Tên đợt kiểm kê" })}
                            </div>
                            <div className="text-sm font-medium">{display.auditName || "-"}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {t("inventory.chemical.audit.status", { defaultValue: "Trạng thái" })}
                            </div>
                            <div>
                                <AuditStatusBadge status={display.chemicalAuditBlockStatus} />
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <Target className="h-3 w-3" />
                                {t("inventory.chemical.audit.scope", { defaultValue: "Phạm vi" })}
                            </div>
                            <div className="text-sm font-medium">
                                {display.auditScope || "-"} {display.auditScopeValue ? `(${display.auditScopeValue})` : ""}
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <User className="h-3 w-3" />
                                {t("inventory.chemical.audit.assignedTo", { defaultValue: "Người thực hiện" })}
                            </div>
                            <div className="text-sm font-medium">{display.assignedTo || "-"}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3 w-3" />
                                {t("inventory.chemical.audit.createdAt", { defaultValue: "Ngày tạo" })}
                            </div>
                            <div className="text-sm font-medium">{display.createdAt ? new Date(display.createdAt).toLocaleString("vi-VN") : "-"}</div>
                        </div>
                        {display.approvedBy && (
                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                    <User className="h-3 w-3" />
                                    {t("inventory.chemical.audit.approvedBy", { defaultValue: "Người duyệt" })}
                                </div>
                                <div className="text-sm font-medium">
                                    {display.approvedBy}
                                    {display.approvedAt && <span className="text-xs text-muted-foreground ml-1">({new Date(display.approvedAt).toLocaleString("vi-VN")})</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chi tiết kiểm kê */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                <ListOrdered className="h-4 w-4 text-primary" />
                                {t("inventory.chemical.audit.detailItems", { defaultValue: "Danh sách kiểm đếm" })}
                            </h3>
                            <Badge variant="secondary" className="rounded-full">
                                {display.details?.length || 0}
                            </Badge>
                        </div>

                        {display.details && display.details.length > 0 ? (
                            <div className="space-y-2">
                                {display.details.map((d) => {
                                    const variance = d.varianceQty ?? (d.actualAvailableQty != null && d.systemAvailableQty != null ? d.actualAvailableQty - d.systemAvailableQty : null);
                                    return (
                                        <div key={d.chemicalAuditDetailId} className="p-3 bg-muted/30 border border-border rounded-md text-sm space-y-1.5">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="font-medium text-primary font-mono text-xs">{d.chemicalInventoryId || "-"}</div>
                                                    <div className="text-xs text-muted-foreground">SKU: {d.chemicalSkuId || "-"}</div>
                                                </div>
                                                {d.isScanned && (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
                                                        ✓ {t("inventory.chemical.audit.scanned", { defaultValue: "Đã quét" })}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs pt-1.5 border-t border-border/50">
                                                <div>
                                                    <span className="text-muted-foreground block">{t("inventory.chemical.audit.systemQty", { defaultValue: "Hệ thống" })}</span>
                                                    <span className="font-medium">{d.systemAvailableQty ?? "-"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">{t("inventory.chemical.audit.actualQty", { defaultValue: "Thực tế" })}</span>
                                                    <span className="font-medium">{d.actualAvailableQty ?? "-"}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block">{t("inventory.chemical.audit.variance", { defaultValue: "Chênh lệch" })}</span>
                                                    <span className={`font-bold ${variance != null && variance > 0 ? "text-success" : variance != null && variance < 0 ? "text-destructive" : ""}`}>
                                                        {variance != null ? (variance > 0 ? `+${variance}` : variance) : "-"}
                                                    </span>
                                                </div>
                                            </div>
                                            {d.chemicalAuditDetailNote && (
                                                <div className="text-xs italic text-muted-foreground">
                                                    {t("inventory.chemical.audit.note", { defaultValue: "Ghi chú" })}: {d.chemicalAuditDetailNote}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-md bg-muted/20">
                                {t("inventory.chemical.audit.noDetails", { defaultValue: "Chưa có dữ liệu kiểm đếm" })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Main Tab
export function AuditBlocksTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeBlock, setActiveBlock] = useState<ChemicalAuditBlock | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ChemicalAuditBlock | null>(null);
    const [approveTarget, setApproveTarget] = useState<ChemicalAuditBlock | null>(null);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [filters, setFilters] = useState<{
        chemicalAuditBlockStatus: string[];
    }>({ chemicalAuditBlockStatus: [] });

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalAuditBlocksList({
        query: { search: submittedSearch, page, itemsPerPage, sortColumn: "createdAt", sortDirection: "DESC", ...filters },
    });

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || "Failed to load"}</div>;
    }

    return (
        <div className="h-full flex gap-4 overflow-hidden">
            <div className="flex flex-col flex-1 space-y-3 min-w-0 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="audit-blocks-search"
                                placeholder={t("inventory.chemical.audit.searchPlaceholder", { defaultValue: "Tìm mã phiếu, tên đợt kiểm kê..." })}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" size="sm" type="button" onClick={handleSearch}>
                            {t("common.search", { defaultValue: "Tìm kiếm" })}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => refetch()} title="Tải lại">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <Button variant="default" type="button" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("inventory.chemical.audit.add", { defaultValue: "Tạo Đợt Kiểm Kê" })}
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.audit.auditId", { defaultValue: "Mã kiểm kê" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.audit.auditName", { defaultValue: "Tên đợt" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.audit.scope", { defaultValue: "Phạm vi" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.audit.status", { defaultValue: "Trạng thái" })}
                                            type="enum"
                                            value={filters.chemicalAuditBlockStatus}
                                            options={[
                                                { label: "Nháp (DRAFT)", value: "DRAFT" },
                                                { label: "Đang kiểm (IN_PROGRESS)", value: "IN_PROGRESS" },
                                                { label: "Chờ duyệt (PENDING_APPROVAL)", value: "PENDING_APPROVAL" },
                                                { label: "Hoàn thành (COMPLETED)", value: "COMPLETED" },
                                                { label: "Đã hủy (CANCELLED)", value: "CANCELLED" },
                                            ]}
                                            onChange={(v) => {
                                                setFilters(f => ({ ...f, chemicalAuditBlockStatus: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.audit.assignedTo", { defaultValue: "Người thực hiện" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.audit.createdAt", { defaultValue: "Ngày tạo" })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 6 }).map((__, j) => (
                                                <td key={j} className="p-3">
                                                    <Skeleton className="h-4 w-24" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : result?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-6 text-center text-muted-foreground">
                                            {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                        </td>
                                    </tr>
                                ) : (
                                    result?.data?.map((audit: any) => (
                                        <tr
                                            key={audit.chemicalAuditBlockId}
                                            className={`hover:bg-muted/30 cursor-pointer transition-colors ${activeBlock?.chemicalAuditBlockId === audit.chemicalAuditBlockId ? "bg-muted" : ""}`}
                                            onClick={() => setActiveBlock(audit)}
                                        >
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{audit.chemicalAuditBlockId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-medium text-foreground">{audit.auditName ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                                                {audit.auditScope ?? "-"}
                                                {audit.auditScopeValue ? <span className="text-xs ml-1">({audit.auditScopeValue})</span> : ""}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <AuditStatusBadge status={audit.chemicalAuditBlockStatus} />
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{audit.assignedTo ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{audit.createdAt ? new Date(audit.createdAt).toLocaleString("vi-VN") : "-"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {result?.pagination && (
                        <Pagination
                            currentPage={page}
                            totalPages={result.pagination.totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={result.pagination.total}
                            onPageChange={(p) => setPage(p)}
                            onItemsPerPageChange={(iper) => {
                                setItemsPerPage(iper);
                                setPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {activeBlock && <AuditBlockDetailPanel block={activeBlock} onClose={() => setActiveBlock(null)} onEdit={(b) => setEditTarget(b)} onApprove={(b) => setApproveTarget(b)} />}

            {/* Create modal */}
            {createOpen && <AuditBlockEditModal auditBlock={null} onClose={() => setCreateOpen(false)} />}

            {/* Edit modal */}
            {editTarget && <AuditBlockEditModal auditBlock={editTarget} onClose={() => setEditTarget(null)} />}

            {/* Approve modal (Create Adjustment Transaction) */}
            {approveTarget &&
                (() => {
                    const discrepantItems =
                        approveTarget.details?.filter((d) => {
                            const variance = d.varianceQty ?? (d.actualAvailableQty != null && d.systemAvailableQty != null ? d.actualAvailableQty - d.systemAvailableQty : null);
                            return variance != null && variance !== 0;
                        }) || [];

                    const initialItems = discrepantItems.map(
                        (d: any) =>
                            ({
                                chemicalInventoryId: d.chemicalInventoryId,
                                chemicalSkuId: d.chemicalSkuId,
                                currentAvailableQty: d.systemAvailableQty,
                            }) as ChemicalInventory,
                    );

                    const initialTxnData = discrepantItems.reduce((acc, d) => {
                        const variance = d.varianceQty ?? (d.actualAvailableQty != null && d.systemAvailableQty != null ? d.actualAvailableQty - d.systemAvailableQty : null);
                        acc[d.chemicalInventoryId!] = { changeQty: variance!, note: `Điều chỉnh sau kiểm kê ${approveTarget.chemicalAuditBlockId}` };
                        return acc;
                    }, {} as any);

                    return (
                        <CreateBlockModal
                            initialType="ADJUSTMENT"
                            initialRef={approveTarget.chemicalAuditBlockId ?? undefined}
                            initialItems={initialItems}
                            initialTxnData={initialTxnData}
                            onClose={() => setApproveTarget(null)}
                        />
                    );
                })()}
        </div>
    );
}
