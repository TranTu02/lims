import { useTranslation } from "react-i18next";
import { X, Loader2, ListOrdered, Calendar, User, FileText, ArrowUpDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalTransactionBlock, ChemicalTransactionBlockDetail, ChemicalTransaction } from "@/types/chemical";
import { useChemicalTransactionBlockFull, useApproveTransactionBlock } from "@/api/chemical";

type Props = {
    block: ChemicalTransactionBlock | null;
    onClose: () => void;
};

// Status badge cho block
function StatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const BLOCK_STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
        DRAFT: { label: t("inventory.chemical.transactionBlocks.statusLabels.DRAFT", { defaultValue: "Nháp" }), cls: "bg-muted text-muted-foreground", icon: <Clock className="h-3 w-3" /> },
        PENDING_APPROVAL: {
            label: t("inventory.chemical.transactionBlocks.statusLabels.PENDING_APPROVAL", { defaultValue: "Chờ duyệt" }),
            cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
            icon: <AlertCircle className="h-3 w-3" />,
        },
        APPROVED: {
            label: t("inventory.chemical.transactionBlocks.statusLabels.APPROVED", { defaultValue: "Đã duyệt" }),
            cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
            icon: <CheckCircle2 className="h-3 w-3" />,
        },
        REJECTED: {
            label: t("inventory.chemical.transactionBlocks.statusLabels.REJECTED", { defaultValue: "Từ chối" }),
            cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
            icon: <X className="h-3 w-3" />,
        },
    };
    const s = status ? BLOCK_STATUS_MAP[status] : undefined;
    if (s) {
        return (
            <Badge className={`${s.cls} gap-1`}>
                {s.icon}
                {s.label}
            </Badge>
        );
    }
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

// Render 1 dòng chi tiết (dùng cho cả details lẫn transactions, vì cấu trúc giống nhau)
function LineItemCard({ item, idField }: { item: ChemicalTransactionBlockDetail | ChemicalTransaction; idField: string }) {
    const { t } = useTranslation();
    const id = (item as any)[idField] ?? "-";
    const getActionTypeBadge = (type?: string | null) => {
        if (!type) return <span className="text-muted-foreground">-</span>;
        return (
            <Badge variant="secondary" className="font-normal">
                {type}
            </Badge>
        );
    };

    // Normalize fields across union types (ChemicalTransactionBlockDetail vs ChemicalTransaction)
    const a = item as any;
    const itemUnit = a.chemicalTransactionUnit ?? a.chemicalTransactionBlockDetailUnit ?? "";
    const itemParamName = a.parameterName ?? "";
    const itemNote = a.chemicalTransactionNote ?? a.chemicalTransactionBlockDetailNote ?? "";

    return (
        <div className="p-3 bg-muted/30 border border-border rounded-md text-sm space-y-2">
            <div className="flex items-start justify-between">
                <div>
                    <div className="font-semibold text-primary">{item.chemicalName || t("inventory.chemical.transactions.noName", { defaultValue: "Hóa chất (Không tên)" })}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 gap-2 flex items-center">
                        <span>CAS: {item.casNumber || "-"}</span>
                        <span>•</span>
                        <span>
                            {t("inventory.chemical.transactions.bottleId", { defaultValue: "Mã chai" })}: {item.chemicalInventoryId || "-"}
                        </span>
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">ID: {id}</div>
                </div>
                <div className={`font-bold ml-2 whitespace-nowrap ${item.changeQty > 0 ? "text-success" : item.changeQty < 0 ? "text-destructive" : ""}`}>
                    {item.changeQty > 0 ? "+" : ""}
                    {item.changeQty} {itemUnit}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50 text-xs">
                <div>
                    <span className="text-muted-foreground block mb-0.5">{t("inventory.chemical.transactions.purpose", { defaultValue: "Mục đích" })}:</span>
                    {getActionTypeBadge(item.actionType)}
                </div>
                {itemParamName && (
                    <div>
                        <span className="text-muted-foreground block mb-0.5">{t("inventory.chemical.transactions.testName", { defaultValue: "Phép thử" })}:</span>
                        <span className="font-medium">{itemParamName}</span>
                        {item.analysisId && <span className="text-[10px] text-muted-foreground ml-1">({item.analysisId})</span>}
                    </div>
                )}
                {itemNote && (
                    <div className="col-span-2">
                        <span className="text-muted-foreground block mb-0.5">{t("inventory.chemical.transactions.note", { defaultValue: "Ghi chú" })}:</span>
                        <span className="italic">{itemNote}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TransactionBlockDetailPanel({ block, onClose }: Props) {
    const { t } = useTranslation();
    const fullBlockQuery = useChemicalTransactionBlockFull(block?.chemicalTransactionBlockId || "", {
        enabled: !!block?.chemicalTransactionBlockId,
    });
    const approveMutation = useApproveTransactionBlock();

    const displayBlock = fullBlockQuery.data || block;

    if (!displayBlock) return null;

    const isApproved = displayBlock.chemicalTransactionBlockStatus === "APPROVED";
    const hasDetails = displayBlock.details && displayBlock.details.length > 0;
    const hasTransactions = displayBlock.transactions && displayBlock.transactions.length > 0;

    // Logic: nếu APPROVED → hiển thị transactions (lịch sử đã thực thi).
    // Nếu chưa APPROVED (DRAFT, PENDING_APPROVAL, REJECTED) → hiển thị details (bảng tạm).
    const showTransactions = isApproved && hasTransactions;
    const showDetails = !isApproved && hasDetails;

    const getTransactionBadge = (type?: string | null) => {
        switch (type) {
            case "IMPORT":
                return <Badge className="bg-success text-success-foreground">{t("inventory.chemical.transactionBlocks.import", { defaultValue: "Nhập" })}</Badge>;
            case "EXPORT":
                return <Badge className="bg-destructive text-destructive-foreground">{t("inventory.chemical.transactionBlocks.export", { defaultValue: "Xuất" })}</Badge>;
            case "ADJUSTMENT":
                return <Badge className="bg-primary text-primary-foreground">{t("inventory.chemical.transactionBlocks.adjustment", { defaultValue: "Bù/Trả lại" })}</Badge>;
            default:
                return <Badge variant="outline">{type ?? "-"}</Badge>;
        }
    };

    return (
        <div className="w-96 lg:w-[500px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{t("inventory.chemical.transactionBlocks.detail", { defaultValue: "Chi tiết Phiếu" })}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{displayBlock.chemicalTransactionBlockId}</p>
                </div>
                <div className="flex items-center gap-1">
                    {!isApproved && displayBlock.chemicalTransactionBlockStatus !== "REJECTED" && (
                        <Button
                            variant="default"
                            size="sm"
                            type="button"
                            onClick={() => approveMutation.mutate({ body: { chemicalTransactionBlockId: displayBlock.chemicalTransactionBlockId } })}
                            disabled={approveMutation.isPending}
                        >
                            {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                            {t("inventory.chemical.transactionBlocks.approveButton", { defaultValue: "Duyệt Phiếu" })}
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {fullBlockQuery.isLoading ? (
                <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="p-4 space-y-6">
                    {/* General Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <ArrowUpDown className="h-3 w-3" />
                                {t("inventory.chemical.transactionBlocks.type", { defaultValue: "Phân loại" })}
                            </div>
                            <div>{getTransactionBadge(displayBlock.transactionType)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {t("inventory.chemical.transactionBlocks.status", { defaultValue: "Trạng thái" })}
                            </div>
                            <div>
                                <StatusBadge status={displayBlock.chemicalTransactionBlockStatus} />
                            </div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3 w-3" />
                                {t("inventory.chemical.transactionBlocks.createdAt", { defaultValue: "Ngày tạo" })}
                            </div>
                            <div className="text-sm font-medium">{displayBlock.createdAt ? new Date(displayBlock.createdAt).toLocaleString("vi-VN") : "-"}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <FileText className="h-3 w-3" />
                                {t("inventory.chemical.transactionBlocks.reference", { defaultValue: "Tham chiếu" })}
                            </div>
                            <div className="text-sm font-medium">{displayBlock.referenceDocument || "-"}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <User className="h-3 w-3" />
                                {t("inventory.chemical.transactionBlocks.createdBy", { defaultValue: "Người tạo" })}
                            </div>
                            <div className="text-sm font-medium">{displayBlock.createdBy || "-"}</div>
                        </div>
                        {displayBlock.approvedBy && (
                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                    <User className="h-3 w-3" />
                                    {t("inventory.chemical.transactionBlocks.approvedBy", { defaultValue: "Người duyệt" })}
                                </div>
                                <div className="text-sm font-medium">
                                    {displayBlock.approvedBy}
                                    {displayBlock.approvedAt && <span className="text-xs text-muted-foreground ml-1">({new Date(displayBlock.approvedAt).toLocaleString("vi-VN")})</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Details hoặc Transactions */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                <ListOrdered className="h-4 w-4 text-primary" />
                                {isApproved
                                    ? t("inventory.chemical.transactionBlocks.executedHistory", { defaultValue: "Lịch sử đã thực thi" })
                                    : t("inventory.chemical.transactionBlocks.pendingDetails", { defaultValue: "Chi tiết dự kiến (Bảng tạm)" })}
                            </h3>
                            <Badge variant="secondary" className="rounded-full">
                                {isApproved ? displayBlock.transactions?.length || 0 : displayBlock.details?.length || 0}
                            </Badge>
                        </div>

                        {/* Nếu APPROVED → show transactions (đã thực thi) */}
                        {showTransactions && (
                            <div className="space-y-3">
                                {displayBlock.transactions!.map((txn) => (
                                    <LineItemCard key={txn.chemicalTransactionId} item={txn} idField="chemicalTransactionId" />
                                ))}
                            </div>
                        )}

                        {/* Nếu chưa APPROVED → show details (bảng tạm) */}
                        {showDetails && (
                            <div className="space-y-3">
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-md border border-yellow-200 dark:border-yellow-800 text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {t("inventory.chemical.transactionBlocks.pendingNote", { defaultValue: "Phiếu chưa được duyệt. Tồn kho chưa bị tác động." })}
                                </div>
                                {displayBlock.details!.map((detail) => (
                                    <LineItemCard key={detail.chemicalTransactionBlockDetailId} item={detail} idField="chemicalTransactionBlockDetailId" />
                                ))}
                            </div>
                        )}

                        {/* Fallback: nếu có transactions nhưng chưa approved (edge case) */}
                        {!showTransactions && !showDetails && hasTransactions && (
                            <div className="space-y-3">
                                {displayBlock.transactions!.map((txn) => (
                                    <LineItemCard key={txn.chemicalTransactionId} item={txn} idField="chemicalTransactionId" />
                                ))}
                            </div>
                        )}

                        {/* Không có gì */}
                        {!showTransactions && !showDetails && !hasTransactions && (
                            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-md bg-muted/20">
                                {t("inventory.chemical.transactionBlocks.noLineItems", { defaultValue: "Không có chi tiết giao dịch" })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
