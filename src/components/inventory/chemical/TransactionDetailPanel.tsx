import { X, Loader2, RefreshCw, FileText, CheckCircle, Tag, Beaker } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalTransaction } from "@/types/chemical";
import { useChemicalTransactionFull } from "@/api/chemical";

type Props = {
    transaction: ChemicalTransaction | null;
    onClose: () => void;
};

const ACTION_TYPE_MAP: Record<string, { cls: string }> = {
    INITIAL_ISSUE: { cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    SUPPLEMENTAL: { cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
    RETURN: { cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    WASTE: { cls: "bg-gray-200 text-gray-600" },
    IMPORT: { cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    EXPORT: { cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    ADJUSTMENT: { cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
};

function ActionBadge({ type }: { type?: string | null; className?: string }) {
    const { t } = useTranslation();
    const s = type ? ACTION_TYPE_MAP[type] : undefined;
    if (s) return <Badge className={`${s.cls} ${type}`}>{t(`inventory.chemical.transactions.actionTypeLabels.${type}`, { defaultValue: type })}</Badge>;
    return (
        <Badge variant="outline" className={type ?? ""}>
            {type ?? "-"}
        </Badge>
    );
}

export function TransactionDetailPanel({ transaction, onClose }: Props) {
    const { t, i18n } = useTranslation();
    const fullTxnQuery = useChemicalTransactionFull(transaction?.chemicalTransactionId || "", {
        enabled: !!transaction?.chemicalTransactionId,
    });

    const displayTxn = fullTxnQuery.data || transaction;

    if (!displayTxn) return null;

    const sku = (displayTxn as any).chemicalSku;
    const block = (displayTxn as any).chemicalTransactionBlock;
    const inv = (displayTxn as any).chemicalInventory;

    const qtyColor =
        displayTxn.changeQty && displayTxn.changeQty > 0
            ? "text-green-600 dark:text-green-400"
            : displayTxn.changeQty && displayTxn.changeQty < 0
              ? "text-red-600 dark:text-red-400"
              : "text-foreground";

    return (
        <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                <div>
                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-primary" />
                        {t("inventory.chemical.transactions.details.title", { defaultValue: "Log Giao dịch Trực tiếp" })}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{displayTxn.chemicalTransactionId}</p>
                </div>
                <div>
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {fullTxnQuery.isLoading ? (
                <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="p-4 space-y-6">
                    {/* General */}
                    <div className="flex justify-between items-center bg-muted/20 p-4 border border-border rounded-lg">
                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                {t("inventory.chemical.transactions.details.impact", { defaultValue: "Tác động" })} ({displayTxn.actionType})
                            </div>
                            <div className="mt-1.5">
                                <ActionBadge type={displayTxn.actionType} />
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                {t("inventory.chemical.transactions.details.change", { defaultValue: "Sự thay đổi" })}
                            </div>
                            <div className={`text-2xl font-bold mt-1 ${qtyColor}`}>
                                {displayTxn.changeQty && displayTxn.changeQty > 0 ? "+" : ""}
                                {displayTxn.changeQty ?? 0}
                                <span className="text-sm text-foreground ml-1">{displayTxn.chemicalTransactionUnit || sku?.chemicalBaseUnit || ""}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm">
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                            {t("inventory.chemical.transactions.details.note", { defaultValue: "Ghi chú thực hiện" })}
                        </div>
                        <div className="mt-1 font-medium bg-muted/40 p-2 border border-border rounded-md italic">
                            {displayTxn.chemicalTransactionNote || t("common.none", { defaultValue: "Không có" })}
                        </div>
                    </div>

                    {/* Sku Details */}
                    {sku && (
                        <div className="space-y-2 border-t border-border pt-4">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                                <Tag className="h-3.5 w-3.5" />
                                {t("inventory.chemical.skus.details.title", { defaultValue: "Hóa chất gốc (SKU)" })}
                            </h3>
                            <div className="border border-border rounded-md p-3 text-sm">
                                <div className="font-semibold">{displayTxn.chemicalName || sku.chemicalName}</div>
                                <div className="flex gap-4 mt-2 text-muted-foreground text-xs">
                                    <span>
                                        CAS: <strong className="text-foreground">{displayTxn.casNumber || sku.chemicalCASNumber || "-"}</strong>
                                    </span>
                                    <span>
                                        {t("inventory.chemical.skus.chemicalSkuId", { defaultValue: "Mã SKU" })}: <strong className="text-foreground">{sku.chemicalSkuId || "-"}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Inventory Link */}
                    {inv && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                                <Beaker className="h-3.5 w-3.5" />
                                {t("inventory.chemical.inventories.details.title", { defaultValue: "Chai / Lọ tương tác" })}
                            </h3>
                            <div className="border border-border rounded-md p-3 text-sm bg-muted/5">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-mono text-primary font-medium">{inv.chemicalInventoryId}</span>
                                    <Badge variant="outline" className="text-[10px] py-0 h-4">
                                        {inv.chemicalInventoryStatus ? t(`inventory.chemical.inventories.status.${inv.chemicalInventoryStatus}`, { defaultValue: inv.chemicalInventoryStatus }) : "-"}
                                    </Badge>
                                </div>
                                <div className="flex gap-4 mt-2 text-muted-foreground text-xs">
                                    <span>
                                        {t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}: <strong className="text-foreground">{inv.lotNumber || "-"}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Block Link */}
                    {block && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                                <FileText className="h-3.5 w-3.5" />
                                {t("inventory.chemical.transactionBlocks.details.title", { defaultValue: "Phiếu điều động" })}
                            </h3>
                            <div className="border border-border rounded-md p-3 text-sm flex justify-between items-center hover:bg-muted/10">
                                <div>
                                    <div className="font-mono text-primary">{block.chemicalTransactionBlockId}</div>
                                    <div className="text-muted-foreground text-xs mt-0.5">
                                        {t("inventory.chemical.transactionBlocks.referenceCode", { defaultValue: "Tham chiếu" })}:{" "}
                                        <span className="font-medium text-foreground">{block.referenceDocument || "-"}</span>
                                    </div>
                                </div>
                                <Badge variant="secondary">
                                    {block.transactionType ? t(`inventory.chemical.transactionBlocks.types.${block.transactionType}`, { defaultValue: block.transactionType }) : "-"}
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Additional Details */}
                    <div className="space-y-2 border-t border-border pt-4">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {t("inventory.chemical.transactions.details.extraInfo", { defaultValue: "Thông tin phụ" })}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/10 p-3 rounded-md border border-border">
                            <div className="col-span-2">
                                <div className="text-muted-foreground text-xs">{t("inventory.chemical.transactionBlocks.details.test", { defaultValue: "Phép thử (Link)" })}</div>
                                <div className="font-medium mt-0.5">
                                    {displayTxn.parameterName || "-"} {displayTxn.analysisId ? <span className="text-muted-foreground font-mono text-xs ml-1">({displayTxn.analysisId})</span> : ""}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground text-xs">{t("inventory.chemical.transactions.transactionDate", { defaultValue: "Thời gian thực hiện" })}</div>
                                <div className="font-medium mt-0.5">{displayTxn.createdAt ? new Date(displayTxn.createdAt).toLocaleString(i18n.language === "vi" ? "vi-VN" : "en-US") : "-"}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
