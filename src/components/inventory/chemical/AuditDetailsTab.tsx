import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChemicalAuditDetailsList } from "@/api/chemical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

export function AuditDetailsTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const {
        data: result,
        isLoading,
        error,
    } = useChemicalAuditDetailsList({
        query: { search: submittedSearch, page, itemsPerPage, sortColumn: "createdAt", sortDirection: "DESC" },
    });

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || "Failed to load"}</div>;
    }

    return (
        <div className="h-full flex flex-col space-y-3 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="audit-details-search"
                        placeholder={String(t("inventory.chemical.auditDetails.searchPlaceholder", { defaultValue: "Tìm mã chai, mã SKU, mã kiểm kê..." }))}
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

            {/* Table */}
            <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                <div className="overflow-x-auto relative h-full flex-1">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.detailId", { defaultValue: "Mã chi tiết" }))}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.auditBlockId", { defaultValue: "Mã phiếu kiểm kê" }))}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.skuId", { defaultValue: "Mã SKU" }))}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.inventoryId", { defaultValue: "Mã chai" }))}
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.systemQty", { defaultValue: "SL Hệ thống" }))}
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.actualQty", { defaultValue: "SL Thực tế" }))}
                                </th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.variance", { defaultValue: "Chênh lệch" }))}
                                </th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {String(t("inventory.chemical.auditDetails.scanned", { defaultValue: "Đã quét" }))}
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
                            ) : result?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-6 text-center text-muted-foreground">
                                        {String(t("common.noData", { defaultValue: "Không có dữ liệu" }))}
                                    </td>
                                </tr>
                            ) : (
                                result?.data?.map((d: any) => {
                                    const variance = d.varianceQty ?? (d.actualAvailableQty != null && d.systemAvailableQty != null ? d.actualAvailableQty - d.systemAvailableQty : null);
                                    return (
                                        <tr key={d.chemicalAuditDetailId} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{d.chemicalAuditDetailId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-muted-foreground">{d.chemicalAuditBlockId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-foreground">{d.chemicalSkuId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{d.chemicalInventoryId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right font-mono">{d.systemAvailableQty ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-medium">{d.actualAvailableQty ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-right">
                                                {variance != null ? (
                                                    <span className={`font-bold ${variance > 0 ? "text-success" : variance < 0 ? "text-destructive" : ""}`}>
                                                        {variance > 0 ? `+${variance}` : variance}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                {d.isScanned ? (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">✓</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

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
    );
}
