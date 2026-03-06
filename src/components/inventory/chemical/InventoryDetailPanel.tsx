import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Beaker, MapPin, Tag, Calendar, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalInventory } from "@/types/chemical";
import { useChemicalInventoryFull } from "@/api/chemical";
import { InventoryEditModal } from "./InventoryEditModal";

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
    };
    const s = status ? STATUS_MAP[status] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

export function InventoryDetailPanel({ inventory, onClose }: Props) {
    const { t } = useTranslation();
    const [editOpen, setEditOpen] = useState(false);

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
                                <div className="text-xl font-bold mt-1 text-primary">
                                    {displayInv.currentAvailableQty ?? 0} {sku?.chemicalBaseUnit || ""}
                                </div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.inventories.chemicalInventoryStatus", { defaultValue: "Trạng thái" })}
                                </div>
                                <StatusBadge status={(displayInv as any).chemicalInventoryStatus} />
                            </div>
                        </div>

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
                                            CAS: <strong className="text-foreground">{sku.chemicalCASNumber || "-"}</strong>
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
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {editOpen && <InventoryEditModal inventory={displayInv} onClose={() => setEditOpen(false)} />}
        </>
    );
}
