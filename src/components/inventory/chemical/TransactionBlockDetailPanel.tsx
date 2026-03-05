import { X, Loader2, ListOrdered, Calendar, User, FileText, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalTransactionBlock } from "@/types/chemical";
import { useChemicalTransactionBlockFull } from "@/api/chemical";

type Props = {
    block: ChemicalTransactionBlock | null;
    onClose: () => void;
};

export function TransactionBlockDetailPanel({ block, onClose }: Props) {
    const fullBlockQuery = useChemicalTransactionBlockFull(block?.chemicalTransactionBlockId || "", {
        enabled: !!block?.chemicalTransactionBlockId,
    });

    const displayBlock = fullBlockQuery.data || block;

    if (!displayBlock) return null;

    const getTransactionBadge = (type?: string | null) => {
        switch (type) {
            case "IMPORT":
                return <Badge className="bg-success text-success-foreground">Nhập</Badge>;
            case "EXPORT":
                return <Badge className="bg-destructive text-destructive-foreground">Xuất</Badge>;
            case "ADJUSTMENT":
                return <Badge className="bg-primary text-primary-foreground">Bù/Trả lại</Badge>;
            default:
                return <Badge variant="outline">{type ?? "-"}</Badge>;
        }
    };

    const getActionTypeBadge = (type?: string | null) => {
        if (!type) return <span className="text-muted-foreground">-</span>;
        return (
            <Badge variant="secondary" className="font-normal">
                {type}
            </Badge>
        );
    };

    return (
        <div className="w-96 lg:w-[500px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Chi tiết Giao dịch</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{displayBlock.chemicalTransactionBlockId}</p>
                </div>
                <div className="flex items-center gap-1">
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
                                Phân loại
                            </div>
                            <div>{getTransactionBadge(displayBlock.transactionType)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3 w-3" />
                                Ngày tạo
                            </div>
                            <div className="text-sm font-medium">{displayBlock.createdAt ? new Date(displayBlock.createdAt).toLocaleString("vi-VN") : "-"}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <FileText className="h-3 w-3" />
                                Tham chiếu
                            </div>
                            <div className="text-sm font-medium">{displayBlock.referenceDocument || "-"}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                                <User className="h-3 w-3" />
                                Người thực hiện
                            </div>
                            <div className="text-sm font-medium">{displayBlock.createdBy || "-"}</div>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                <ListOrdered className="h-4 w-4 text-primary" />
                                Lịch sử biến động
                            </h3>
                            <Badge variant="secondary" className="rounded-full">
                                {displayBlock.transactions?.length || 0}
                            </Badge>
                        </div>

                        {displayBlock.transactions && displayBlock.transactions.length > 0 ? (
                            <div className="space-y-3">
                                {displayBlock.transactions.map((txn) => (
                                    <div key={txn.chemicalTransactionId} className="p-3 bg-muted/30 border border-border rounded-md text-sm space-y-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-semibold text-primary">{txn.chemicalName || "Hóa chất (Không tên)"}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 gap-2 flex items-center">
                                                    <span>CAS: {txn.casNumber || "-"}</span>
                                                    <span>•</span>
                                                    <span>Mã chai: {txn.chemicalInventoryId || "-"}</span>
                                                </div>
                                            </div>
                                            <div className={`font-bold ml-2 whitespace-nowrap ${txn.changeQty > 0 ? "text-success" : txn.changeQty < 0 ? "text-destructive" : ""}`}>
                                                {txn.changeQty > 0 ? "+" : ""}
                                                {txn.changeQty} {txn.unit || ""}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50 text-xs">
                                            <div>
                                                <span className="text-muted-foreground block mb-0.5">Mục đích:</span>
                                                {getActionTypeBadge(txn.actionType)}
                                            </div>
                                            {txn.testName && (
                                                <div>
                                                    <span className="text-muted-foreground block mb-0.5">Phép thử:</span>
                                                    <span className="font-medium">{txn.testName}</span>
                                                    {txn.analysisId && <span className="text-[10px] text-muted-foreground ml-1">({txn.analysisId})</span>}
                                                </div>
                                            )}
                                            {txn.note && (
                                                <div className="col-span-2">
                                                    <span className="text-muted-foreground block mb-0.5">Ghi chú:</span>
                                                    <span className="italic">{txn.note}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-md bg-muted/20">Không có chi tiết giao dịch</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
