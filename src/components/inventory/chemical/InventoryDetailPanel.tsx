import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Beaker, MapPin, Tag, Calendar, Pencil, FileText, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalInventory, ChemicalTransaction, ChemicalTransactionBlockDetail } from "@/types/chemical";
import { useChemicalInventoryFull } from "@/api/chemical";
import { InventoryEditModal } from "./InventoryEditModal";
import { InventorySeparateModal } from "./InventorySeparateModal";
import { CreateBlockModal } from "./TransactionBlocksTab";
import { History, GitFork } from "lucide-react";
import { DocumentItem } from "@/components/common/DocumentItem";

type Props = {
    inventory: ChemicalInventory | null;
    onClose: () => void;
    onEdit?: (inv: ChemicalInventory) => void;
};

function StatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const STATUS_MAP: Record<string, { label: string; cls: string }> = {
        Quarantined: { label: t("inventory.chemical.inventories.status.Quarantined", { defaultValue: "Kiểm dịch" }), cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
        New: { label: t("inventory.chemical.inventories.status.New", { defaultValue: "Mới" }), cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        InUse: { label: t("inventory.chemical.inventories.status.InUse", { defaultValue: "Đang dùng" }), cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
        Empty: { label: t("inventory.chemical.inventories.status.Empty", { defaultValue: "Hết" }), cls: "bg-muted text-muted-foreground" },
        Expired: { label: t("inventory.chemical.inventories.status.Expired", { defaultValue: "Hết hạn" }), cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
        Disposed: { label: t("inventory.chemical.inventories.status.Disposed", { defaultValue: "Đã huỷ" }), cls: "bg-gray-200 text-gray-600" },
        Pending: { label: t("inventory.chemical.inventories.status.Pending", { defaultValue: "Chờ kiểm kê" }), cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
    };
    const s = status ? STATUS_MAP[status] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

function TransactionRow({ item, type }: { item: ChemicalTransaction | ChemicalTransactionBlockDetail; type: "TXN" | "DETAIL" }) {
    const { t } = useTranslation();
    const a = item as any;
    const isTxn = type === "TXN";
    const changeQty = a.changeQty ?? 0;
    const unit = a.chemicalTransactionUnit ?? a.chemicalTransactionBlockDetailUnit ?? "";
    const date = a.createdAt;

    return (
        <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50 text-xs">
            <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${isTxn ? "bg-primary" : "bg-yellow-400"}`} title={isTxn ? "Đã thực thi" : "Dự kiến (Bảng tạm)"} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{a.transactionType || a.actionType}</span>
                    <span className={`font-bold ${changeQty > 0 ? "text-green-600" : changeQty < 0 ? "text-red-600" : ""}`}>
                        {changeQty > 0 ? "+" : ""}
                        {changeQty} {unit}
                        {a.totalWeight !== undefined && a.totalWeight !== null && <span className="text-[10px] text-muted-foreground ml-1">({a.totalWeight} KL)</span>}
                    </span>
                </div>
                {a.parameterName && (
                    <div className="text-muted-foreground mt-0.5 truncate">
                        {t("inventory.chemical.transactions.testName", { defaultValue: "Phép thử" })}: <span className="text-foreground">{a.parameterName}</span>
                    </div>
                )}
                <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                    <span className="font-mono text-primary/80">{a.chemicalInventoryId || "-"}</span>
                    <span>{date ? new Date(date).toLocaleString("vi-VN") : "-"}</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                        {a.usageBy || a.usedById ? `KTV: ${a.usageBy || a.usedById}` : ""}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function InventoryDetailPanel({ inventory, onClose }: Props) {
    const { t } = useTranslation();
    const [editOpen, setEditOpen] = useState(false);
    const [separateOpen, setSeparateOpen] = useState(false);
    const [prepareBlockOpen, setPrepareBlockOpen] = useState(false);

    const fullInvQuery = useChemicalInventoryFull(inventory?.chemicalInventoryId || "", {
        enabled: !!inventory?.chemicalInventoryId,
    });

    const displayInv = fullInvQuery.data || inventory;

    if (!displayInv) return null;

    const sku = (displayInv as any).chemicalSku;
    const sup = (displayInv as any).chemicalSupplier;

    return (
        <>
            <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
                <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                    <div>
                        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Beaker className="h-4 w-4 text-primary" />
                            {t("inventory.chemical.inventories.detailTitle", { defaultValue: "Chi tiết Lọ/Chai" })}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{displayInv.chemicalInventoryId}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        {(displayInv as any).chemicalType === "Hóa chất pha" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPrepareBlockOpen(true)}
                                type="button"
                                title="Tạo phiếu điều chỉnh pha hóa chất"
                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            >
                                <FlaskConical className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSeparateOpen(true)}
                            type="button"
                            title={t("inventory.chemical.inventories.separate", { defaultValue: "Tách lọ" })}
                            disabled={displayInv.currentAvailableQty <= 0 || displayInv.chemicalInventoryStatus === "Empty"}
                        >
                            <GitFork className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} type="button" title={t("common.edit", { defaultValue: "Chỉnh sửa" })}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose} type="button">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {fullInvQuery.isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* General / Status */}
                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border">
                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Tồn hiện tại" })}
                                </div>
                                <div className="text-lg font-bold mt-1 text-primary pb-1 border-b border-border/50">
                                    {displayInv.currentAvailableQty ?? 0} {sku?.chemicalBaseUnit || ""}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-2">
                                    {t("inventory.chemical.inventories.totalGrossWeight", { defaultValue: "KL cả bì" })}
                                </div>
                                <div className="text-sm font-semibold mt-0.5 text-foreground">{displayInv.totalGrossWeight ?? "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.chemicalInventoryStatus", { defaultValue: "Trạng thái" })}
                                </div>
                                <StatusBadge status={(displayInv as any).chemicalInventoryStatus} />
                            </div>
                        </div>

                        {/* Prepared Chemical Info */}
                        {(displayInv as any).chemicalType === "Hóa chất pha" && (
                            <div className="space-y-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                <h3 className="text-xs font-semibold flex items-center gap-1.5 text-blue-500">
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    {t("inventory.chemical.inventories.preparedInfo", { defaultValue: "Thông tin Pha chế" })}
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-muted-foreground mb-0.5">{t("inventory.chemical.inventories.preparedById", { defaultValue: "Người pha" })}</div>
                                        <div className="font-medium">
                                            {typeof (displayInv as any).preparedBy === "string" 
                                                ? (displayInv as any).preparedBy 
                                                : (displayInv as any).preparedBy?.identityName || (displayInv as any).preparedById || "-"}
                                            {typeof (displayInv as any).preparedBy !== "string" && (displayInv as any).preparedBy?.identityRoles?.includes("ROLE_TECHNICIAN") && (
                                                <span className="ml-1 text-[9px] bg-blue-100 text-blue-700 px-1 rounded">KTV</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground mb-0.5">{t("inventory.chemical.inventories.preparedDate", { defaultValue: "Ngày pha" })}</div>
                                        <div className="font-medium">
                                            {(displayInv as any).preparedDate
                                                ? new Date((displayInv as any).preparedDate).toLocaleString("vi-VN")
                                                : "-"}
                                        </div>
                                    </div>
                                    <div className="col-span-2 mt-1">
                                        <div className="text-muted-foreground mb-0.5">{t("inventory.chemical.inventories.preparationLocation", { defaultValue: "Nơi pha hóa chất" })}</div>
                                        <div className="font-medium">
                                            {(displayInv as any).preparationLocation || "-"}
                                        </div>
                                    </div>
                                </div>
                                {(displayInv as any).parentInventoryIds?.length > 0 && (
                                    <div>
                                        <div className="text-muted-foreground text-[10px] mb-1">
                                            {t("inventory.chemical.inventories.parentInventoryIds", { defaultValue: "Hóa chất gốc" })}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {((displayInv as any).parentInventories?.length > 0
                                                ? (displayInv as any).parentInventories
                                                : (displayInv as any).parentInventoryIds.map((id: string) => ({ chemicalInventoryId: id }))
                                            ).map((parent: any) => (
                                                <div key={parent.chemicalInventoryId} className="flex items-center justify-between bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                                    <span className="font-mono text-[10px] text-blue-600 font-medium">
                                                        {parent.chemicalInventoryId}
                                                    </span>
                                                    {parent.chemicalName && (
                                                        <span className="text-[10px] text-blue-800 truncate ml-2 max-w-[120px]" title={parent.chemicalName}>
                                                            {parent.chemicalName}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setPrepareBlockOpen(true)}
                                    className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5 rounded-md py-1.5 transition-colors"
                                >
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    {t("inventory.chemical.inventories.createPrepareBlock", { defaultValue: "Tạo phiếu xuất hóa chất gốc" })}
                                </button>
                            </div>
                        )}

                        {/* Sku Details */}
                        {sku && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                                    <Tag className="h-3.5 w-3.5" />
                                    {t("inventory.chemical.inventories.skuInfo", { defaultValue: "Hóa chất gốc (SKU)" })}
                                </h3>
                                <div className="border border-border rounded-md p-3 text-sm">
                                    <div className="font-semibold">{sku.chemicalName || sku.chemicalSkuId}</div>
                                    <div className="flex gap-4 mt-2 text-muted-foreground text-xs">
                                        <span>
                                            Loại: <strong className="text-foreground">{displayInv.chemicalType || sku.chemicalType || "-"}</strong>
                                        </span>
                                        <span>
                                            CAS: <strong className="text-foreground">{(sku as any).chemicalCasNumber || sku.chemicalCASNumber || "-"}</strong>
                                        </span>
                                        <span>
                                            Mã cũ: <strong className="text-foreground">{displayInv.chemicalSkuOldId || sku.chemicalSkuOldId || "-"}</strong>
                                        </span>
                                        <span>
                                            Level: <strong className="text-foreground">{sku.chemicalHazardClass || "-"}</strong>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Details Info */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-3">
                            <div className="col-span-2">
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                                    <MapPin className="h-3 w-3" /> {t("inventory.chemical.inventories.storageBinLocation", { defaultValue: "Vị trí lưu kho" })}
                                </div>
                                <div className="text-sm font-medium">{(displayInv as any).storageBinLocation || "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô (Lot/Batch)" })}
                                </div>
                                <div className="text-sm font-medium mt-1">{(displayInv as any).lotNumber || "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.supplier", { defaultValue: "Nhà cung cấp" })}
                                </div>
                                <div className="text-sm font-medium mt-1">{sup?.supplierName || (displayInv as any).chemicalSupplierId || "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.manufacturerName", { defaultValue: "Hãng SX" })}
                                </div>
                                <div className="text-sm font-medium mt-1">{(displayInv as any).manufacturerName || "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.manufacturerCountry", { defaultValue: "Nước SX" })}
                                </div>
                                <div className="text-sm font-medium mt-1">{(displayInv as any).manufacturerCountry || "-"}</div>
                            </div>

                            <div className="col-span-2">
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.storageConditions", { defaultValue: "Điều kiện bảo quản" })}
                                </div>
                                <div className="text-sm font-medium mt-1">{(displayInv as any).storageConditions || "-"}</div>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-2 border-t border-border pt-4 mt-2">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {t("inventory.chemical.inventories.timeline", { defaultValue: "Thông tin thời hạn" })}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/10 p-3 rounded-md border border-border">
                                <div>
                                    <div className="text-muted-foreground text-xs">{t("inventory.chemical.inventories.mfgDate", { defaultValue: "Ngày SX" })}</div>
                                    <div className="font-medium mt-0.5">{(displayInv as any).mfgDate ? new Date((displayInv as any).mfgDate).toLocaleDateString("vi-VN") : "-"}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs">{t("inventory.chemical.inventories.expiryDate", { defaultValue: "Hạn SD (Chưa mở)" })}</div>
                                    <div className="font-medium mt-0.5">{(displayInv as any).expDate ? new Date((displayInv as any).expDate).toLocaleDateString("vi-VN") : "-"}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs">{t("inventory.chemical.inventories.openedAt", { defaultValue: "Ngày khui hộp" })}</div>
                                    <div className="font-medium mt-0.5">{(displayInv as any).openedDate ? new Date((displayInv as any).openedDate).toLocaleDateString("vi-VN") : "-"}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground text-xs">{t("inventory.chemical.inventories.openedExpiryDate", { defaultValue: "Hạn SD (Sau khui)" })}</div>
                                    <div className="font-medium mt-0.5">{(displayInv as any).openedExpDate ? new Date((displayInv as any).openedExpDate).toLocaleDateString("vi-VN") : "-"}</div>
                                </div>
                                <div className="col-span-2 border-t border-border/50 pt-2 flex justify-between items-center">
                                    <div className="text-muted-foreground text-xs">{t("inventory.chemical.inventories.openedExpDays", { defaultValue: "Số ngày được dùng sau khui" })}</div>
                                    <div className="font-bold text-primary">
                                        {(displayInv as any).openedExpDays ?? "-"} {t("common.days", { defaultValue: "ngày" })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        {((displayInv as any).inventoryCoaDocumentIds?.length > 0 || (displayInv as any).inventoryInvoiceDocumentIds?.length > 0) && (
                            <div className="space-y-4 border-t border-border pt-4 mt-2">
                                <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                                    <FileText className="h-3.5 w-3.5" />
                                    {t("inventory.chemical.inventories.documents", { defaultValue: "Tài liệu đính kèm" })}
                                </h3>

                                {((displayInv as any).inventoryCoaDocuments?.length > 0 || (displayInv as any).inventoryCoaDocumentIds?.length > 0) && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">COA Documents</span>
                                        <div className="grid grid-cols-1 gap-1">
                                            {((displayInv as any).inventoryCoaDocuments?.length > 0
                                                ? (displayInv as any).inventoryCoaDocuments
                                                : (displayInv as any).inventoryCoaDocumentIds.map((id: string) => ({ documentId: id }))
                                            ).map((doc: any, i: number) => (
                                                <DocumentItem key={doc?.documentId || i} doc={doc} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {((displayInv as any).inventoryInvoiceDocuments?.length > 0 || (displayInv as any).inventoryInvoiceDocumentIds?.length > 0) && (
                                    <div className="space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">Invoice / Order Documents</span>
                                        <div className="grid grid-cols-1 gap-1">
                                            {((displayInv as any).inventoryInvoiceDocuments?.length > 0
                                                ? (displayInv as any).inventoryInvoiceDocuments
                                                : (displayInv as any).inventoryInvoiceDocumentIds.map((id: string) => ({ documentId: id }))
                                            ).map((doc: any, i: number) => (
                                                <DocumentItem key={doc?.documentId || i} doc={doc} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Transactions / History */}
                        <div className="space-y-3 border-t border-border pt-4 mt-2 mb-8">
                            <h3 className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground">
                                <History className="h-3.5 w-3.5" />
                                {t("inventory.chemical.inventories.transactions", { defaultValue: "Lịch sử giao dịch (Snapshots)" })}
                            </h3>

                            <div className="space-y-2">
                                {(displayInv as any).chemicalTransactions?.length > 0 ? (
                                    (displayInv as any).chemicalTransactions.map((txn: any) => <TransactionRow key={txn.chemicalTransactionId} item={txn} type="TXN" />)
                                ) : (displayInv as any).chemicalTransactionBlockDetails?.length > 0 ? (
                                    (displayInv as any).chemicalTransactionBlockDetails.map((det: any) => <TransactionRow key={det.chemicalTransactionBlockDetailId} item={det} type="DETAIL" />)
                                ) : (
                                    <div className="text-center py-8 bg-muted/10 rounded-lg border border-dashed border-border text-muted-foreground text-xs">
                                        {t("common.noData", { defaultValue: "Chưa có lịch sử giao dịch" })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {editOpen && <InventoryEditModal inventory={displayInv} onClose={() => setEditOpen(false)} />}
            {separateOpen && <InventorySeparateModal inventory={displayInv} onClose={() => setSeparateOpen(false)} />}
            {prepareBlockOpen && (
                <CreateBlockModal
                    onClose={() => setPrepareBlockOpen(false)}
                    initialType="PREPARATION"
                    initialPreparedBy={
                        typeof (displayInv as any).preparedBy === "string"
                            ? { identityId: (displayInv as any).preparedById, identityName: (displayInv as any).preparedBy }
                            : (displayInv as any).preparedBy
                            ? { identityId: (displayInv as any).preparedBy.identityId, identityName: (displayInv as any).preparedBy.identityName }
                            : (displayInv as any).preparedById
                            ? { identityId: (displayInv as any).preparedById, identityName: (displayInv as any).preparedById }
                            : undefined
                    }
                    initialItems={[
                        ...((displayInv as any).parentInventories?.length > 0
                            ? (displayInv as any).parentInventories
                            : (displayInv as any).parentInventoryIds?.map((id: string) => ({
                                  chemicalInventoryId: id,
                                  chemicalSkuId: "",
                                  chemicalName: id,
                                  lotNumber: "",
                                  currentAvailableQty: 0,
                              } as ChemicalInventory)) || []),
                        displayInv,
                    ]}
                />
            )}
        </>
    );
}
