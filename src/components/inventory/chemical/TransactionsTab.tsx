import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChemicalTransactionsList } from "@/api/chemical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw } from "lucide-react";
import { TableFilterPopover } from "./TableFilterPopover";
import type { ChemicalTransaction } from "@/types/chemical";
import { TransactionDetailPanel } from "./TransactionDetailPanel";
import { Pagination } from "@/components/ui/pagination";

function TransactionTypeBadge({ type }: { type?: string | null }) {
    const { t } = useTranslation();
    const TRANSACTION_TYPE_MAP: Record<string, { label: string; cls: string }> = {
        IMPORT: { label: t("inventory.chemical.transactions.actionTypeLabels.IMPORT", { defaultValue: "Nhập kho" }), cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        EXPORT: { label: t("inventory.chemical.transactions.actionTypeLabels.EXPORT", { defaultValue: "Xuất kho" }), cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
        ADJUSTMENT: {
            label: t("inventory.chemical.transactions.actionTypeLabels.ADJUSTMENT", { defaultValue: "Điều chỉnh" }),
            cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        },
    };
    const s = type ? TRANSACTION_TYPE_MAP[type] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{type ?? "-"}</Badge>;
}

export function TransactionsTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeTxn, setActiveTxn] = useState<ChemicalTransaction | null>(null);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [filters, setFilters] = useState<{
        transactionType: string[];
    }>({ transactionType: [] });

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalTransactionsList({
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
                                id="txn-search"
                                placeholder={t("inventory.chemical.transactions.searchPlaceholder", { defaultValue: "Tìm mã giao dịch, tên hóa chất, CAS, phép thử..." })}
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
                </div>

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.chemicalTransactionId", { defaultValue: "Mã Giao Dịch" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.chemicalTransactionBlockId", { defaultValue: "Mã Phiếu" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.transactions.transactionType", { defaultValue: "Hành động" })}
                                            type="enum"
                                            value={filters.transactionType}
                                            options={[
                                                { label: "Nhập kho (IMPORT)", value: "IMPORT" },
                                                { label: "Xuất kho (EXPORT)", value: "EXPORT" },
                                                { label: "Điều chỉnh (ADJUSTMENT)", value: "ADJUSTMENT" },
                                            ]}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, transactionType: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.chemicalSkuId", { defaultValue: "Mã SKU" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.chemicalName", { defaultValue: "Tên hóa chất" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.chemicalCasNumber", { defaultValue: "Số CAS" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.chemicalInventoryId", { defaultValue: "Mã lọ/chai" })}
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.changeQty", { defaultValue: "Số lượng" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.unit", { defaultValue: "Đơn vị" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.analysisId", { defaultValue: "Mã chỉ tiêu" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.transactions.note", { defaultValue: "Ghi chú" })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 8 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 11 }).map((__, j) => (
                                                <td key={j} className="p-3">
                                                    <Skeleton className="h-4 w-16" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (result?.data as any[])?.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="p-8 text-center text-muted-foreground">
                                            {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                        </td>
                                    </tr>
                                ) : (
                                    (result?.data as any[])?.map((txn: any) => (
                                        <tr
                                            key={txn.chemicalTransactionId}
                                            className={`hover:bg-muted/30 cursor-pointer transition-colors ${activeTxn?.chemicalTransactionId === txn.chemicalTransactionId ? "bg-muted" : ""}`}
                                            onClick={() => setActiveTxn(txn)}
                                        >
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{txn.chemicalTransactionId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-muted-foreground">{txn.chemicalTransactionBlockId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                <TransactionTypeBadge type={txn.transactionType} />
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground font-mono text-[10px]">{txn.chemicalSkuId ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-medium">{txn.chemicalName ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{txn.chemicalCasNumber ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{txn.chemicalInventoryId ?? "-"}</td>
                                            <td
                                                className={`px-3 py-2 whitespace-nowrap text-right font-bold ${txn.changeQty > 0 ? "text-green-600 dark:text-green-400" : txn.changeQty < 0 ? "text-red-600 dark:text-red-400" : ""}`}
                                            >
                                                {txn.changeQty > 0 ? "+" : ""}{txn.changeQty}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{txn.chemicalTransactionUnit || (txn as any).unit || "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-[10px] text-muted-foreground">{txn.analysisId ?? "-"}</td>
                                            <td className="px-3 py-2 max-w-[160px]">
                                                <span className="truncate block text-muted-foreground italic" title={txn.chemicalTransactionNote || (txn as any).note || undefined}>
                                                    {txn.chemicalTransactionNote || (txn as any).note || "-"}
                                                </span>
                                            </td>
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

            {activeTxn && <TransactionDetailPanel transaction={activeTxn} onClose={() => setActiveTxn(null)} />}
        </div>
    );
}
