import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useChemicalTransactionBlocksList } from "@/api/chemical";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ChemicalTransactionBlock } from "@/types/chemical";
import { TransactionBlockDetailPanel } from "@/components/inventory/chemical/TransactionBlockDetailPanel";
import { Pagination } from "@/components/ui/pagination";

type Props = {
    search: string;
};

function BlockStatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const BLOCK_STATUS_MAP: Record<string, { label: string; cls: string }> = {
        DRAFT: { label: t("inventory.chemical.transactionBlocks.statusLabels.DRAFT", { defaultValue: "Nháp" }), cls: "bg-muted text-muted-foreground" },
        PENDING_APPROVAL: {
            label: t("inventory.chemical.transactionBlocks.statusLabels.PENDING_APPROVAL", { defaultValue: "Chờ duyệt" }),
            cls: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
        },
        APPROVED: {
            label: t("inventory.chemical.transactionBlocks.statusLabels.APPROVED", { defaultValue: "Đã duyệt" }),
            cls: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
        },
        REJECTED: { label: t("inventory.chemical.transactionBlocks.statusLabels.REJECTED", { defaultValue: "Từ chối" }), cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300" },
    };
    const s = status ? BLOCK_STATUS_MAP[status] : undefined;
    if (s) return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

export function TechnicianChemicalRequestsTab({ search }: Props) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeBlock, setActiveBlock] = useState<ChemicalTransactionBlock | null>(null);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const {
        data: result,
        isLoading,
        error,
    } = useChemicalTransactionBlocksList({
        query: {
            search: search,
            page,
            itemsPerPage,
            sortColumn: "createdAt",
            sortDirection: "DESC",
            createdById: user?.identityId ? [user.identityId] : undefined,
            transactionType: ["EXPORT"],
        },
    }, { enabled: !!user?.identityId });

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || "Failed to load"}</div>;
    }

    return (
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden relative">
            <div className="bg-card border-border/50 z-10 flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm relative">
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="w-16 ">{t("common.stt", { defaultValue: "STT" })}</TableHead>
                                <TableHead className="min-w-[150px]">{t("inventory.chemical.transactionBlocks.table.id", { defaultValue: "Mã Phiếu" })}</TableHead>
                                <TableHead className="min-w-[150px]">{t("technician.workspace.statusCol", { defaultValue: "Trạng thái" })}</TableHead>
                                <TableHead className="min-w-[150px]">{t("common.createdAt", { defaultValue: "Ngày tạo" })}</TableHead>
                                <TableHead className="min-w-[150px]">{t("common.createdBy", { defaultValue: "Người tạo" })}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell className=""><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    </TableRow>
                                ))
                            ) : result?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                                        {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                result?.data?.map((block: any, index: number) => (
                                    <TableRow
                                        key={block.chemicalTransactionBlockId}
                                        className={`cursor-pointer transition-colors ${activeBlock?.chemicalTransactionBlockId === block.chemicalTransactionBlockId ? "bg-muted shadow-inner" : ""}`}
                                        onClick={() => setActiveBlock(block)}
                                    >
                                        <TableCell className="">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                        <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-primary">
                                            {block.chemicalTransactionBlockId ?? "-"}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <BlockStatusBadge status={block.chemicalTransactionBlockStatus} />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {block.createdAt ? new Date(block.createdAt).toLocaleString("vi-VN") : "-"}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {block.createdBy ?? block.createdById ?? "-"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {result?.pagination && (
                    <Pagination
                        currentPage={page}
                        totalPages={result.pagination.totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={result.pagination.total}
                        onPageChange={setPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                )}
            </div>

            {/* Side Panel for displaying selected block's details */}
            {activeBlock && (
                <TransactionBlockDetailPanel
                    block={activeBlock}
                    onClose={() => setActiveBlock(null)}
                    hideApprove={true}
                />
            )}
        </div>
    );
}
