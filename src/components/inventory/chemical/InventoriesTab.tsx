import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Printer, CheckSquare, FileText } from "lucide-react";
import { useChemicalInventoriesList, useEnumList, chemicalApi } from "@/api/chemical";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChemicalInventory } from "@/types/chemical";
import { Pagination } from "@/components/ui/pagination";
import { InventoryDetailPanel } from "./InventoryDetailPanel";
import { InventoryEditModal } from "./InventoryEditModal";
import { PrintLabelModal } from "./PrintLabelModal";
import { ChemicalLogReportEditor } from "./ChemicalLogReportEditor";
import { PrintA4LabelModal } from "./PrintA4LabelModal";
import { Badge } from "@/components/ui/badge";
import { TableFilterPopover } from "./TableFilterPopover";
import { RefreshCw } from "lucide-react";



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
        chemicalType: string[];
        storageBinLocation: string[];
    }>({ chemicalInventoryStatus: [], expDate: [], openedDate: [], chemicalType: [], storageBinLocation: [] });

    const { data: chemicalTypesList } = useEnumList("chemicalType");
    const { data: binLocationsList } = useEnumList("storageBinLocation");



    // Label print state
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [printOpen, setPrintOpen] = useState(false);
    const [logReportOpen, setLogReportOpen] = useState(false);
    const [printA4Open, setPrintA4Open] = useState(false);

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalInventoriesList({
        query: { search: submittedSearch, page, itemsPerPage, sortColumn: "createdAt", sortDirection: "DESC", ...filters },
    });

    const allItems = (result?.data as any[] | undefined) ?? [];

    // QR/Barcode Scanner Global Keydown Listener
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
                return;
            }

            if (e.key === "Control" || e.key === "Alt" || e.key === "Shift" || e.key === "Meta") {
                return;
            }

            const now = Date.now();
            if (now - lastKeyTime > 100) {
                buffer = "";
            }
            lastKeyTime = now;

            if (e.key === "Enter") {
                if (buffer.trim()) {
                    const scannedId = buffer.trim();
                    const foundItem = allItems.find((inv: any) => inv.chemicalInventoryId === scannedId);
                    if (foundItem) {
                        setActiveInv(foundItem);
                    } else {
                        setSearch(scannedId);
                        setSubmittedSearch(scannedId);
                        setPage(1);
                        chemicalApi.inventories.getTechnicians().then(() => {
                            chemicalApi.inventories.full({ id: scannedId }).then((res) => {
                                if (res.success && res.data) {
                                    setActiveInv(res.data as ChemicalInventory);
                                }
                            });
                        });
                    }
                    buffer = "";
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [allItems]);

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
            setSelectMode(true);
            setSelectedIds(new Set());
        } else {
            if (selectedIds.size === 0) setSelectMode(false);
            else setPrintOpen(true);
        }
    };

    const handleLogReportClick = () => {
        if (!selectMode) {
            setSelectMode(true);
            setSelectedIds(new Set());
        } else {
            if (selectedIds.size === 0) setSelectMode(false);
            else setLogReportOpen(true);
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
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full lg:flex-1">
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
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
                        {selectMode && (
                            <Button variant="ghost" size="sm" type="button" onClick={exitSelectMode}>
                                {t("common.cancelSelect", { defaultValue: "Hủy chọn" })}
                            </Button>
                        )}
                        <Button variant={selectMode ? "secondary" : "outline"} type="button" onClick={handleLogReportClick}>
                            <FileText className="h-4 w-4 mr-2" />
                            {selectMode ? (selectedIds.size > 0 ? `In Sổ Nhật ký (${selectedIds.size})` : `In Sổ Nhật ký`) : `In Sổ Nhật ký`}
                        </Button>
                        <Button variant="outline" type="button" onClick={() => setPrintA4Open(true)}>
                            <Printer className="h-4 w-4 mr-2" />
                            In Mẫu Dán Nhãn
                        </Button>
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
                                        {t("inventory.chemical.inventories.chemicalInventoryId", { defaultValue: "Mã" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalName", { defaultValue: "Tên hóa chất" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.skus.chemicalType", { defaultValue: "Loại hóa chất" })}
                                            type="enum"
                                            value={filters.chemicalType}
                                            options={(chemicalTypesList || []).map((t) => ({ label: t, value: t }))}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, chemicalType: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.chemicalSkuId", { defaultValue: "Mã SKU" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                        {t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Lượng còn lại" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.storageBinLocation", { defaultValue: "Vị trí lưu kho" })}
                                            type="enum"
                                            value={filters.storageBinLocation}
                                            options={(binLocationsList || []).map((l) => ({ label: l, value: l }))}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, storageBinLocation: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.expiryDate", { defaultValue: "Hạn sử dụng" })}
                                            type="date"
                                            value={filters.expDate}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, expDate: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                        {t("inventory.chemical.inventories.storageConditions", { defaultValue: "Điều kiện bảo quản" })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {selectMode && <td className="p-3"><Skeleton className="h-4 w-4" /></td>}
                                            <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                                            <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                                            <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                                            <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                                        </tr>
                                    ))
                                ) : allItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={selectMode ? 10 : 9} className="p-6 text-center text-muted-foreground">
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
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{inv.chemicalType || (inv as any).chemicalSku?.chemicalType || "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{inv.chemicalSkuId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">{inv.lotNumber ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.storageBinLocation ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-foreground">{inv.currentAvailableQty ?? 0}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground hidden md:table-cell">{inv.expDate ? new Date(inv.expDate).toLocaleDateString("vi-VN") : "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground truncate max-w-[150px] hidden md:table-cell" title={inv.storageConditions}>{inv.storageConditions ?? "-"}</td>
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

            {/* Log report modal */}
            {logReportOpen && (
                <ChemicalLogReportEditor
                    open={logReportOpen}
                    onOpenChange={(open) => {
                        setLogReportOpen(open);
                        if (!open) exitSelectMode();
                    }}
                    inventories={selectedItems}
                />
            )}

            {/* Print A4 labels modal */}
            {printA4Open && (
                <PrintA4LabelModal
                    onClose={() => setPrintA4Open(false)}
                />
            )}

            {/* <HelpBubble guidePath="guide-inventories.html" label="Hướng dẫn: Quản lý Lọ/Chai" /> */}
        </div>
    );
}
