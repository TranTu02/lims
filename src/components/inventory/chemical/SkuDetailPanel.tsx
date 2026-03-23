import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Beaker, Pencil, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChemicalSku } from "@/types/chemical";
import { useChemicalSkuFull } from "@/api/chemical";
import { SkuEditModal } from "./SkuEditModal";

type Props = {
    sku: ChemicalSku | null;
    onClose: () => void;
    onEdit?: (sku: ChemicalSku) => void;
};

export function SkuDetailPanel({ sku, onClose }: Props) {
    const { t } = useTranslation();
    const [editOpen, setEditOpen] = useState(false);

    const fullSkuQuery = useChemicalSkuFull(sku?.chemicalSkuId || "", {
        enabled: !!sku?.chemicalSkuId,
    });

    const displaySku = fullSkuQuery.data || sku;

    if (!displaySku) return null;

    const items = (displaySku as any).items as any[] | undefined;
    const suppliers = (displaySku as any).suppliers as any[] | undefined;

    return (
        <>
            <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
                <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{t("inventory.chemical.skus.detailTitle", { defaultValue: "Chi tiết Hóa chất" })}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{displaySku.chemicalSkuId}</p>
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

                {fullSkuQuery.isLoading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* General Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.skus.chemicalName", { defaultValue: "Tên hóa chất" })}
                                </div>
                                <div className="text-base text-foreground font-semibold mt-1">{displaySku.chemicalName || "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.skus.chemicalCasNumber", { defaultValue: "Số CAS" })}
                                </div>
                                <div className="text-sm font-medium mt-1">{(displaySku as any).chemicalCasNumber || "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.skus.chemicalHazardClass", { defaultValue: "Phân loại nguy hiểm" })}
                                </div>
                                <div className="text-sm font-medium mt-1">{displaySku.chemicalHazardClass ? <Badge variant="destructive">{displaySku.chemicalHazardClass}</Badge> : "-"}</div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.skus.totalQuantity", { defaultValue: "Tổng tồn vật lý" })}
                                </div>
                                <div className="text-sm font-medium mt-1 text-primary">
                                    {displaySku.chemicalTotalAvailableQty ?? 0} {displaySku.chemicalBaseUnit ?? ""}
                                </div>
                            </div>

                            <div>
                                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                    {t("inventory.chemical.skus.reorderLevel", { defaultValue: "Mức tối thiểu (Reorder)" })}
                                </div>
                                <div className="text-sm font-medium mt-1">
                                    {displaySku.chemicalReorderLevel ?? "-"} {displaySku.chemicalBaseUnit ?? ""}
                                </div>
                            </div>
                        </div>

                        {/* Inventories Snapshots */}
                        {items && items.length > 0 && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border pb-1.5">
                                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                        <Beaker className="h-4 w-4 text-primary" />
                                        {t("inventory.chemical.skus.itemsInStock", { defaultValue: "Các Lọ/Chai trong kho" })}
                                    </h3>
                                    <Badge variant="secondary" className="rounded-full">
                                        {items.length}
                                    </Badge>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted/50 sticky top-0">
                                            <tr>
                                                <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">
                                                    {t("inventory.chemical.inventories.chemicalInventoryId", { defaultValue: "Mã chai" })}
                                                </th>
                                                <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">
                                                    {t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}
                                                </th>
                                                <th className="text-right px-2 py-1.5 font-semibold text-muted-foreground">
                                                    {t("inventory.chemical.inventories.availableQty", { defaultValue: "Tồn" })}
                                                </th>
                                                <th className="text-center px-2 py-1.5 font-semibold text-muted-foreground">
                                                    {t("inventory.chemical.inventories.statusBadge", { defaultValue: "Trạng thái" })}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {items.map((m: any) => (
                                                <tr key={m.chemicalInventoryId} className="hover:bg-muted/30">
                                                    <td className="px-2 py-1.5 text-foreground font-mono">{m.chemicalInventoryId}</td>
                                                    <td className="px-2 py-1.5 text-foreground">{m.lotNumber ?? "-"}</td>
                                                    <td className="px-2 py-1.5 text-right text-foreground font-medium">{m.currentAvailableQty ?? 0}</td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        <Badge variant="outline" className="text-[10px] h-4 py-0">
                                                            {m.chemicalInventoryStatus ?? "-"}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Suppliers Snapshots */}
                        {suppliers && suppliers.length > 0 && (
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between border-b border-border pb-1.5">
                                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                                        <Package className="h-4 w-4 text-primary" />
                                        {t("inventory.chemical.skus.suppliersCatalog", { defaultValue: "Nguồn NCC / Catalog" })}
                                    </h3>
                                    <Badge variant="secondary" className="rounded-full">
                                        {suppliers.length}
                                    </Badge>
                                </div>
                                <div className="grid gap-2">
                                    {suppliers.map((sup: any) => (
                                        <div key={sup.chemicalSku_chemicalSupplierId} className="p-3 border border-border rounded-md bg-muted/20 text-sm">
                                            <div className="font-semibold text-primary mb-1">{sup.chemicalSupplier?.supplierName || sup.chemicalSupplierId}</div>
                                            <div className="flex justify-between text-muted-foreground text-xs mt-1">
                                                <span>
                                                    {t("inventory.chemical.skus.catalogNumber", { defaultValue: "Mã Catalog" })}: <strong className="text-foreground">{sup.catalogNumber}</strong>
                                                </span>
                                                <span>
                                                    {t("inventory.chemical.skus.brand", { defaultValue: "Hãng" })}: <strong className="text-foreground">{sup.brandManufacturer}</strong>
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-muted-foreground text-xs mt-1">
                                                <span>
                                                    {t("inventory.chemical.skus.packagingSize", { defaultValue: "Q/C đóng gói" })}: <strong className="text-foreground">{sup.packagingSize}</strong>
                                                </span>
                                                <span>
                                                    {t("inventory.chemical.skus.leadTime", { defaultValue: "Lead (ngày)" })}: <strong className="text-foreground">{sup.leadTimeDays}</strong>
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {editOpen && <SkuEditModal sku={displaySku as any} onClose={() => setEditOpen(false)} />}
        </>
    );
}
