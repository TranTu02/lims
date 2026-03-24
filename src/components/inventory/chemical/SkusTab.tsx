import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw } from "lucide-react";
import { TableFilterPopover } from "./TableFilterPopover";
import { useChemicalSkusList } from "@/api/chemical";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChemicalSku } from "@/types/chemical";
import { SkuDetailPanel } from "./SkuDetailPanel";
import { SkuEditModal } from "./SkuEditModal";
import { Pagination } from "@/components/ui/pagination";
export function SkusTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeSku, setActiveSku] = useState<ChemicalSku | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [filters, setFilters] = useState<{
        chemicalHazardClass: string[];
    }>({ chemicalHazardClass: [] });

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalSkusList({
        query: {
            search: submittedSearch,
            page,
            itemsPerPage,
            sortColumn: "createdAt",
            sortDirection: "DESC",
            ...filters,
        },
    });

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

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
                                id="skus-search"
                                placeholder={t("inventory.chemical.skus.searchPlaceholder", { defaultValue: "Tìm mã SKU, tên, CAS..." })}
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
                        {t("inventory.chemical.skus.add", { defaultValue: "Thêm Hóa chất" })}
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalSkuId", { defaultValue: "Mã SKU" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalSkuOldId", { defaultValue: "Mã SKU Cũ" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalCasNumber", { defaultValue: "Số CAS" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalName", { defaultValue: "Tên hóa chất" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalBaseUnit", { defaultValue: "Đơn vị" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.skus.chemicalHazardClass", { defaultValue: "Phân loại nguy hiểm" })}
                                            type="enum"
                                            value={filters.chemicalHazardClass}
                                            options={[
                                                { label: "O - Oxidizing", value: "O" },
                                                { label: "F - Flammable", value: "F" },
                                                { label: "T - Toxic", value: "T" },
                                                { label: "C - Corrosive", value: "C" },
                                                { label: "X - Harmful", value: "X" },
                                                { label: "N - Environmental", value: "N" },
                                            ]}
                                            onChange={(v) => {
                                                setFilters(f => ({ ...f, chemicalHazardClass: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalTotalAvailableQty", { defaultValue: "Tổng Tồn C/D" })}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalReorderLevel", { defaultValue: "Mức tối thiểu" })}
                                    </th>
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
                                            {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                        </td>
                                    </tr>
                                ) : (
                                    (result?.data as any[])?.map((sku) => (
                                        <tr
                                            key={sku.chemicalSkuId}
                                            className={`hover:bg-muted/30 cursor-pointer transition-colors ${activeSku?.chemicalSkuId === sku.chemicalSkuId ? "bg-muted" : ""}`}
                                            onClick={() => setActiveSku(sku)}
                                        >
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-primary font-medium">{sku.chemicalSkuId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-muted-foreground">{sku.chemicalSkuOldId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{sku.chemicalCasNumber ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-medium">{sku.chemicalName ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{sku.chemicalBaseUnit ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{sku.chemicalHazardClass ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right font-medium">{sku.chemicalTotalAvailableQty ?? 0}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right text-muted-foreground">{sku.chemicalReorderLevel ?? "-"}</td>
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

            {activeSku && <SkuDetailPanel sku={activeSku} onClose={() => setActiveSku(null)} />}

            {createOpen && <SkuEditModal sku={null} onClose={() => setCreateOpen(false)} />}
        </div>
    );
}
