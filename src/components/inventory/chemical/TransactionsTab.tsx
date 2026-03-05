import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useChemicalTransactionsList } from "@/api/chemical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { ChemicalTransaction } from "@/types/chemical";
import { TransactionDetailPanel } from "./TransactionDetailPanel";
import { Pagination } from "@/components/ui/pagination";

const ACTION_TYPE_MAP: Record<string, { label: string; cls: string }> = {
    INITIAL_ISSUE: { label: "Xuất ban đầu", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    SUPPLEMENTAL: { label: "Bổ sung thêm", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
    RETURN: { label: "Hoàn trả", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    WASTE: { label: "Thải bỏ", cls: "bg-gray-200 text-gray-600" },
    IMPORT: { label: "Nhập kho", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    EXPORT: { label: "Xuất kho", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    ADJUSTMENT: { label: "Điều chỉnh", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
};

function ActionBadge({ type }: { type?: string | null }) {
    const s = type ? ACTION_TYPE_MAP[type] : undefined;
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

    const {
        data: result,
        isLoading,
        error,
    } = useChemicalTransactionsList({
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
                                id="txn-search"
                                placeholder={String(t("chemical.txnSearchPlaceholder", { defaultValue: "Tìm mã giao dịch, tên hóa chất, CAS, phép thử..." }))}
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
                </div>

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Mã Giao Dịch</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Mã Phiếu</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Hành động</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Tên hóa chất</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Số CAS</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Mã lọ/chai</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">Số lượng</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Đơn vị</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Phép thử</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Ghi chú</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Ngày tạo</th>
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
                                            {String(t("common.noData", { defaultValue: "Không có dữ liệu" }))}
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
                                                <ActionBadge type={txn.actionType} />
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap font-medium">{txn.chemicalName ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{txn.casNumber ?? "-"}</td>
                                            <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{txn.chemicalInventoryId ?? "-"}</td>
                                            <td
                                                className={`px-3 py-2 whitespace-nowrap text-right font-bold ${txn.changeQty > 0 ? "text-green-600 dark:text-green-400" : txn.changeQty < 0 ? "text-red-600 dark:text-red-400" : ""}`}
                                            >
                                                {txn.changeQty > 0 ? "+" : ""}
                                                {txn.changeQty}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{txn.unit ?? "-"}</td>
                                            <td className="px-3 py-2 max-w-[160px]">
                                                <span className="truncate block" title={txn.testName ?? undefined}>
                                                    {txn.testName ?? "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 max-w-[160px]">
                                                <span className="truncate block text-muted-foreground italic" title={txn.note ?? undefined}>
                                                    {txn.note ?? "-"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{txn.createdAt ? new Date(txn.createdAt).toLocaleString("vi-VN") : "-"}</td>
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

            {activeTxn && <TransactionDetailPanel transaction={activeTxn} onClose={() => setActiveTxn(null)} />}
        </div>
    );
}
