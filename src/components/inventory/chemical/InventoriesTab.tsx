import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Printer, CheckSquare } from "lucide-react";
import { useChemicalInventoriesList } from "@/api/chemical";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChemicalInventory } from "@/types/chemical";
import { Pagination } from "@/components/ui/pagination";
import { InventoryDetailPanel } from "./InventoryDetailPanel";
import { InventoryEditModal } from "./InventoryEditModal";
import { PrintLabelModal } from "./PrintLabelModal";
import { Badge } from "@/components/ui/badge";
import { TableFilterPopover } from "./TableFilterPopover";
import { RefreshCw } from "lucide-react";

function StatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const STATUS_MAP: Record<string, { label: string; cls: string }> = {
        Quarantined: { label: t("inventory.chemical.inventories.status.Quarantined", { defaultValue: "Kiểm dịch" }), cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
        New: { label: t("inventory.chemical.inventories.status.New", { defaultValue: "Mới" }), cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        InUse: { label: t("inventory.chemical.inventories.status.InUse", { defaultValue: "Đang dùng" }), cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
        Empty: { label: t("inventory.chemical.inventories.status.Empty", { defaultValue: "Hết" }), cls: "bg-muted text-muted-foreground" },
        Expired: { label: t("inventory.chemical.inventories.status.Expired", { defaultValue: "Hết hạn" }), cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
        Disposed: { label: t("inventory.chemical.inventories.status.Disposed", { defaultValue: "Đã huỷ" }), cls: "bg-gray-200 text-gray-600" },
        Pending: { label: t("inventory.chemical.inventories.status.Pending", { defaultValue: "Chờ kiểm kê" }), cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
    };
    const s = status ? STATUS_MAP[status] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

export function InventoriesTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeInv, setActiveInv] = useState<ChemicalInventory | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [filters, setFilters] = useState<{
        chemicalInventoryStatus: string[];
        expDate: string[];
        openedDate: string[];
    }>({ chemicalInventoryStatus: [], expDate: [], openedDate: [] });

    // Label print state
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [printOpen, setPrintOpen] = useState(false);

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalInventoriesList({
        query: { search: submittedSearch, page, itemsPerPage, sortColumn: "createdAt", sortDirection: "DESC", ...filters },
    });

    const allItems = (result?.data as any[] | undefined) ?? [];

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleLabelClick = () => {
        if (!selectMode) {
            // First click: enter select mode
            setSelectMode(true);
            setSelectedIds(new Set());
        } else {
            // Second click: show print modal with selected items
            if (selectedIds.size === 0) {
                setSelectMode(false);
                return;
            }
            setPrintOpen(true);
        }
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const selectedItems = allItems.filter((inv: any) => selectedIds.has(inv.chemicalInventoryId));

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || t("common.loadError", { defaultValue: "Không thể tải dữ liệu" })}</div>;
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
                                id="inv-search"
                                placeholder={t("inventory.chemical.inventories.searchPlaceholder", { defaultValue: "Tìm barcode, mã SKU, số lô..." })}
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
                    <div className="flex items-center gap-2">
                        {selectMode && (
                            <Button variant="ghost" size="sm" type="button" onClick={exitSelectMode}>
                                {t("common.cancelSelect", { defaultValue: "Hủy chọn" })}
                            </Button>
                        )}
                        <Button variant={selectMode ? "default" : "outline"} type="button" onClick={handleLabelClick}>
                            <Printer className="h-4 w-4 mr-2" />
                            {selectMode
                                ? selectedIds.size > 0
                                    ? `${t("inventory.chemical.transactionBlocks.printLabel", { defaultValue: "In Tem" })} (${selectedIds.size})`
                                    : t("inventory.chemical.transactionBlocks.printLabel", { defaultValue: "In Tem" })
                                : t("inventory.chemical.transactionBlocks.printLabel", { defaultValue: "In Tem" })}
                        </Button>
                        <Button variant="default" type="button" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t("inventory.chemical.inventories.add", { defaultValue: "Nhập Lọ Mới" })}
                        </Button>
                    </div>
                </div>

                {/* Select mode hint */}
                {selectMode && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                        <CheckSquare className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">{t("inventory.chemical.inventories.selectMode", { defaultValue: "Chế độ chọn tem:" })}</span>
                        <span className="text-muted-foreground">{t("inventory.chemical.inventories.selectModeDesc", { defaultValue: 'Click vào các hàng để chọn, sau đó nhấn "In" để in tem.' })}</span>
                        {selectedIds.size > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                                {selectedIds.size} {t("common.selected", { defaultValue: "đã chọn" })}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    {selectMode && (
                                        <th className="px-3 py-2 w-8">
                                            <input
                                                type="checkbox"
                                                className="accent-primary"
                                                checked={allItems.length > 0 && allItems.every((inv: any) => selectedIds.has(inv.chemicalInventoryId))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(new Set(allItems.map((inv: any) => inv.chemicalInventoryId)));
                                                    } else {
                                                        setSelectedIds(new Set());
                                                    }
                                                }}
                                            />
                                        </th>
                                    )}
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.chemicalInventoryId", { defaultValue: "Barcode / Item ID" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalName", { defaultValue: "Tên hóa chất" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalCasNumber", { defaultValue: "Số CAS" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.chemicalSkuId", { defaultValue: "Mã SKU" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.chemicalSkuOldId", { defaultValue: "Mã cũ" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.storageBinLocation", { defaultValue: "Vị trí" })}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Lượng còn lại" })}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.totalGrossWeight", { defaultValue: "Lượng còn lại cả bì" })}
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.chemicalInventoryStatus", { defaultValue: "Trạng thái" })}
                                            type="enum"
                                            value={filters.chemicalInventoryStatus}
                                            options={[
                                                { label: "Kiểm dịch (Quarantined)", value: "Quarantined" },
                                                { label: "Mới (New)", value: "New" },
                                                { label: "Đang dùng (InUse)", value: "InUse" },
                                                { label: "Chờ kiểm kê (Pending)", value: "Pending" },
                                                { label: "Hết (Empty)", value: "Empty" },
                                                { label: "Hết hạn (Expired)", value: "Expired" },
                                                { label: "Đã hủy (Disposed)", value: "Disposed" },
                                            ]}
                                            onChange={(v) => {
                                                setFilters(f => ({ ...f, chemicalInventoryStatus: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.expiryDate", { defaultValue: "Hạn sử dụng" })}
                                            type="date"
                                            value={filters.expDate}
                                            onChange={(v) => {
                                                setFilters(f => ({ ...f, expDate: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.openedAt", { defaultValue: "Ngày mở nắp" })}
                                            type="date"
                                            value={filters.openedDate}
                                            onChange={(v) => {
                                                setFilters(f => ({ ...f, openedDate: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.openedExpDays", { defaultValue: "Hạn sau mở (ngày)" })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: selectMode ? 14 : 13 }).map((__, j) => (
                                                <td key={j} className="p-3">
                                                    <Skeleton className="h-4 w-20" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : allItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={selectMode ? 14 : 13} className="p-6 text-center text-muted-foreground">
                                            {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                        </td>
                                    </tr>
                                ) : (
                                    allItems.map((inv: any) => {
                                        const isSelected = selectedIds.has(inv.chemicalInventoryId);
                                        return (
                                            <tr
                                                key={inv.chemicalInventoryId}
                                                className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                                                    selectMode && isSelected ? "bg-primary/5" : activeInv?.chemicalInventoryId === inv.chemicalInventoryId ? "bg-muted" : ""
                                                }`}
                                                onClick={() => {
                                                    if (selectMode) {
                                                        toggleSelect(inv.chemicalInventoryId);
                                                    } else {
                                                        setActiveInv(inv);
                                                    }
                                                }}
                                            >
                                                {selectMode && (
                                                    <td className="px-3 py-2 text-center">
                                                        <input type="checkbox" readOnly checked={isSelected} className="accent-primary" />
                                                    </td>
                                                )}
                                                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{inv.chemicalInventoryId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap font-medium">{inv.chemicalName || (inv as any).chemicalSku?.chemicalName || "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{inv.chemicalCasNumber || (inv as any).chemicalSku?.chemicalCASNumber || "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{inv.chemicalSkuId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{inv.chemicalSkuOldId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">{inv.lotNumber ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.storageBinLocation ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-foreground">
                                                    {inv.currentAvailableQty ?? 0}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right text-muted-foreground">
                                                    {inv.totalGrossWeight ?? "-"}
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                                    <StatusBadge status={inv.chemicalInventoryStatus} />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.expDate ? new Date(inv.expDate).toLocaleDateString("vi-VN") : "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.openedDate ? new Date(inv.openedDate).toLocaleDateString("vi-VN") : "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center font-medium">{inv.openedExpDays ?? "-"}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {result?.pagination && (
                        <Pagination
                            currentPage={page}
                            totalPages={result.pagination.totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={result.pagination.totalItems ?? result.pagination.total}
                            onPageChange={(p) => setPage(p)}
                            onItemsPerPageChange={(iper) => {
                                setItemsPerPage(iper);
                                setPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {activeInv && (
                <InventoryDetailPanel
                    inventory={activeInv}
                    onClose={() => setActiveInv(null)}
                    onEdit={(inv: ChemicalInventory) => {
                        console.log("Edit Inventory", inv);
                    }}
                />
            )}

            {createOpen && <InventoryEditModal inventory={null} onClose={() => setCreateOpen(false)} />}

            {/* Print label modal */}
            {printOpen && (
                <PrintLabelModal
                    items={selectedItems}
                    onClose={() => {
                        setPrintOpen(false);
                        exitSelectMode();
                    }}
                />
            )}
        </div>
    );
}
