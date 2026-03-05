import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useChemicalInventoriesList } from "@/api/chemical";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChemicalInventory } from "@/types/chemical";
import { Pagination } from "@/components/ui/pagination";
import { InventoryDetailPanel } from "./InventoryDetailPanel";
import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    Quarantined: { label: "Kiểm dịch", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
    New: { label: "Mới", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    InUse: { label: "Đang dùng", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    Empty: { label: "Hết", cls: "bg-muted text-muted-foreground" },
    Expired: { label: "Hết hạn", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    Disposed: { label: "Đã huỷ", cls: "bg-gray-200 text-gray-600" },
};

function StatusBadge({ status }: { status?: string | null }) {
    const s = status ? STATUS_MAP[status] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

export function InventoriesTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeInv, setActiveInv] = useState<ChemicalInventory | null>(null);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const {
        data: result,
        isLoading,
        error,
    } = useChemicalInventoriesList({
        query: {
            search: submittedSearch,
            page,
            itemsPerPage,
            sortColumn: "createdAt",
            sortDirection: "DESC",
        },
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
                                id="inv-search"
                                placeholder="Tìm barcode, mã SKU, số lô..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" size="sm" type="button" onClick={handleSearch}>
                            {String(t("common.search", { defaultValue: "Tìm kiếm" }))}
                        </Button>
                    </div>
                    <Button variant="default" type="button">
                        <Plus className="h-4 w-4 mr-2" />
                        {String(t("chemical.addInventory", { defaultValue: "Nhập Lọ Mới" }))}
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("chemical.barcode", { defaultValue: "Barcode / Item ID" }))}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{String(t("chemical.skuId", { defaultValue: "Mã SKU" }))}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{String(t("chemical.lotNo", { defaultValue: "Số Lô" }))}</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{String(t("chemical.location", { defaultValue: "Vị trí" }))}</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("chemical.availableQty", { defaultValue: "Tồn Hiện Tại" }))}
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("chemical.status", { defaultValue: "Trạng thái" }))}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("chemical.expDate", { defaultValue: "Hạn sử dụng" }))}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{String(t("chemical.openedDate", { defaultValue: "Ngày mở" }))}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 8 }).map((__, j) => (
                                                <td key={j} className="p-3">
                                                    <Skeleton className="h-4 w-20" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (result?.data as any[])?.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                            {String(t("common.noData", { defaultValue: "Không có dữ liệu" }))}
                                        </td>
                                    </tr>
                                ) : (
                                    (result?.data as any[])?.map((inv) => (
                                        <tr
                                            key={inv.chemicalInventoryId}
                                            className={`hover:bg-muted/30 cursor-pointer transition-colors ${activeInv?.chemicalInventoryId === inv.chemicalInventoryId ? "bg-muted" : ""}`}
                                            onClick={() => setActiveInv(inv)}
                                        >
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{inv.chemicalInventoryId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{inv.chemicalSkuId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{inv.lotNumber ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.storageBinLocation ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right font-medium">{inv.currentAvailableQty ?? 0}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                <StatusBadge status={inv.inventoryStatus} />
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.expDate ? new Date(inv.expDate).toLocaleDateString("vi-VN") : "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.openedDate ? new Date(inv.openedDate).toLocaleDateString("vi-VN") : "-"}</td>
                                        </tr>
                                    ))
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
                            totalItems={result.pagination.totalItems}
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
        </div>
    );
}
