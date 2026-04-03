import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, ListOrdered, Calendar, User, FileText, ArrowUpDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalTransactionBlock, ChemicalTransactionBlockDetail, ChemicalTransaction } from "@/types/chemical";
import { useChemicalTransactionBlockFull, useApproveTransactionBlock } from "@/api/chemical";
import { ChemicalProposalEditor } from "@/components/technician/ChemicalProposalEditor";
import { DocumentItem } from "@/components/common/DocumentItem";

type Props = {
    block: ChemicalTransactionBlock | null;
    onClose: () => void;
    hideApprove?: boolean;
    onApproveClick?: (blockId: string) => void;
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
    
    // Normalize fields across union types
    const a = item as any;
    const itemUnit = a.chemicalTransactionUnit ?? a.chemicalTransactionBlockDetailUnit ?? "";
    const itemParamName = a.parameterName ?? "";
    const itemNote = a.chemicalTransactionNote ?? a.chemicalTransactionBlockDetailNote ?? "";
    const analysisIds = item.analysisId ? item.analysisId.split(",").map(s => s.trim()).filter(Boolean) : [];

    return (
        <div className="p-4 bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-sm text-foreground leading-tight truncate">{item.chemicalName || t("inventory.chemical.transactions.noName", { defaultValue: "Hóa chất (Không tên)" })}</div>
                        {item.chemicalInventoryId && (
                            <div className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-muted border border-border/50 text-[9px] font-mono font-medium text-muted-foreground uppercase tracking-tighter shrink-0">
                                {item.chemicalInventoryId}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium mb-2 flex-wrap">
                        <span className="bg-muted/50 px-1 rounded">SKU: {item.chemicalSkuId || "-"}</span>
                        <span className="bg-muted/50 px-1 rounded">Mã cũ: {a.chemicalSkuOldId || "-"}</span>
                        <span>CAS: {item.chemicalCasNumber || "-"}</span>
                    </div>

                    {analysisIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {analysisIds.map((aid) => (
                                <span key={aid} className="bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5 text-[9px] font-mono font-medium">
                                    #{aid}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="text-right shrink-0">
                    <div className={`font-bold text-sm flex items-center justify-end gap-1 ${item.changeQty > 0 ? "text-success" : item.changeQty < 0 ? "text-destructive" : ""}`}>
                        {item.changeQty > 0 ? "+" : ""}
                        {item.changeQty} 
                        <span className="text-[10px] font-medium text-muted-foreground lowercase ml-0.5">{itemUnit}</span>
                    </div>
                    {a.totalWeight !== undefined && a.totalWeight !== null && (
                        <div className="text-[10px] font-medium text-muted-foreground flex justify-end">
                            KL: {a.totalWeight}
                        </div>
                    )}
                    <div className="text-[9px] text-muted-foreground/50 font-mono mt-1 uppercase">ID: {id}</div>
                </div>
            </div>

            {(itemParamName || itemNote) && (
                <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-1 gap-2">
                    {itemParamName && (
                        <div className="flex items-start gap-1.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight shrink-0 mt-0.5">{t("inventory.chemical.transactions.testName", { defaultValue: "Phép thử" })}:</span>
                            <span className="text-[11px] font-medium text-foreground">{itemParamName}</span>
                        </div>
                    )}
                    {itemNote && (
                        <div className="flex items-start gap-1.5">
                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight shrink-0 mt-0.5">{t("inventory.chemical.transactions.note", { defaultValue: "Ghi chú" })}:</span>
                            <span className="text-[11px] italic text-muted-foreground">{itemNote}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function TransactionBlockDetailPanel({ block, onClose, hideApprove, onApproveClick }: Props) {
    const { t } = useTranslation();
    const fullBlockQuery = useChemicalTransactionBlockFull(block?.chemicalTransactionBlockId || "", {
        enabled: !!block?.chemicalTransactionBlockId,
    });
    const approveMutation = useApproveTransactionBlock();
    const [showProposalEditor, setShowProposalEditor] = useState(false);

    const displayBlock = fullBlockQuery.data || block;

    if (!displayBlock) return null;

    const isApproved = displayBlock.chemicalTransactionBlockStatus === "APPROVED";
    const hasDetails = displayBlock.chemicalTransactionBlockDetails && displayBlock.chemicalTransactionBlockDetails.length > 0;
    const hasTransactions = displayBlock.chemicalTransactions && displayBlock.chemicalTransactions.length > 0;

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
        <div className="w-96 lg:w-[500px] shrink-0 bg-background rounded-lg border border-border flex flex-col h-full overflow-hidden">
            <div className="bg-background/80 backdrop-blur-sm border-b border-border px-5 py-4 flex items-center justify-between z-10 shrink-0">
                <div className="flex flex-col">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ListOrdered className="h-4 w-4 text-primary" />
                        {t("inventory.chemical.transactionBlocks.detail", { defaultValue: "Chi tiết Phiếu" })}
                    </h2>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5 tracking-tight">{displayBlock.chemicalTransactionBlockId}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!hideApprove && !isApproved && displayBlock.chemicalTransactionBlockStatus !== "REJECTED" && (
                        <Button
                            variant="success"
                            size="sm"
                            type="button"
                            onClick={() => {
                                if (onApproveClick) {
                                    onApproveClick(displayBlock.chemicalTransactionBlockId);
                                } else {
                                    approveMutation.mutate({ body: { chemicalTransactionBlockId: displayBlock.chemicalTransactionBlockId } });
                                }
                            }}
                            disabled={approveMutation.isPending}
                            className="h-8 text-xs px-3 shadow-sm transition-all active:scale-95"
                        >
                            {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                            {t("inventory.chemical.transactionBlocks.approveButton", { defaultValue: "Duyệt Phiếu" })}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => setShowProposalEditor(true)}
                        className="h-8 text-[11px] px-3"
                    >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        {String(t("inventory.chemical.transactionBlocks.exportProposal", { defaultValue: "Trích xuất" }))}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} type="button" className="h-8 w-8 rounded-full hover:bg-muted font-bold text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {showProposalEditor && displayBlock && (
                <ChemicalProposalEditor
                    open={showProposalEditor}
                    onOpenChange={setShowProposalEditor}
                    block={displayBlock as any}
                />
            )}

            <div className="flex-1 overflow-y-auto relative">
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

                    {((displayBlock as any).chemicalBlockCoaDocumentIds?.length > 0 || (displayBlock as any).chemicalBlockInvoiceDocumentIds?.length > 0) && (
                        <div className="space-y-4 pt-2">
                            <h3 className="text-[13px] font-bold flex items-center gap-2 text-foreground/80 border-b border-border/50 pb-2">
                                <FileText className="h-4 w-4 text-primary/70" />
                                {t("inventory.chemical.transactionBlocks.documents", { defaultValue: "Tài liệu đính kèm" })}
                            </h3>
                            
                            {(displayBlock as any).chemicalBlockCoaDocuments?.length > 0 ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">COA Documents</span>
                                    <div className="grid grid-cols-1 gap-1">
                                        {(displayBlock as any).chemicalBlockCoaDocuments.map((doc: any, i: number) => (
                                            <DocumentItem key={doc.documentId || i} doc={doc} />
                                        ))}
                                    </div>
                                </div>
                            ) : (displayBlock as any).chemicalBlockCoaDocumentIds?.length > 0 ? (
                                <div className="bg-muted/30 p-2 rounded border border-border/50 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">COA Documents</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(displayBlock as any).chemicalBlockCoaDocumentIds.map((id: string) => (
                                            <Badge key={id} variant="secondary" className="font-mono text-[9px]">{id}</Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {(displayBlock as any).chemicalBlockInvoiceDocuments?.length > 0 ? (
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">Invoice / Order Documents</span>
                                    <div className="grid grid-cols-1 gap-1">
                                        {(displayBlock as any).chemicalBlockInvoiceDocuments.map((doc: any, i: number) => (
                                            <DocumentItem key={doc.documentId || i} doc={doc} />
                                        ))}
                                    </div>
                                </div>
                            ) : (displayBlock as any).chemicalBlockInvoiceDocumentIds?.length > 0 ? (
                                <div className="bg-muted/30 p-2 rounded border border-border/50 flex flex-col gap-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Invoice / Order Documents</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(displayBlock as any).chemicalBlockInvoiceDocumentIds.map((id: string) => (
                                            <Badge key={id} variant="secondary" className="font-mono text-[9px]">{id}</Badge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Details hoặc Transactions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border/50 pb-2">
                            <h3 className="text-[13px] font-bold flex items-center gap-2 text-foreground/80">
                                <ListOrdered className="h-4 w-4 text-primary/70" />
                                {isApproved
                                    ? t("inventory.chemical.transactionBlocks.executedHistory", { defaultValue: "Lịch sử đã thực thi" })
                                    : t("inventory.chemical.transactionBlocks.pendingDetails", { defaultValue: "Chi tiết dự kiến" })}
                            </h3>
                            <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
                                {isApproved ? displayBlock.chemicalTransactions?.length || 0 : displayBlock.chemicalTransactionBlockDetails?.length || 0} mục
                            </div>
                        </div>

                        {/* Nếu APPROVED → show transactions (đã thực thi) */}
                        {showTransactions && (
                            <div className="space-y-3">
                                {displayBlock.chemicalTransactions!.map((txn) => (
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
                                {displayBlock.chemicalTransactionBlockDetails!.map((detail) => (
                                    <LineItemCard key={detail.chemicalTransactionBlockDetailId} item={detail} idField="chemicalTransactionBlockDetailId" />
                                ))}
                            </div>
                        )}

                        {/* Fallback: nếu có transactions nhưng chưa approved (edge case) */}
                        {!showTransactions && !showDetails && hasTransactions && (
                            <div className="space-y-3">
                                {displayBlock.chemicalTransactions!.map((txn) => (
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
        </div>
    );
}
