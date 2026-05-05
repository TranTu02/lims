import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useChemicalSeparateInventory } from "@/api/chemical";
import type { ChemicalInventory, SeparateChemicalInventoryItem } from "@/types/chemical";
import { toast } from "sonner";

interface InventorySeparateModalProps {
    inventory: ChemicalInventory;
    onClose: () => void;
}

export function InventorySeparateModal({ inventory, onClose }: InventorySeparateModalProps) {
    const { t } = useTranslation();
    const separateMutation = useChemicalSeparateInventory();

    const [note, setNote] = useState("");
    const [originalTotalGrossWeight, setOriginalTotalGrossWeight] = useState<number | undefined>(undefined);
    const [items, setItems] = useState<Partial<SeparateChemicalInventoryItem>[]>([
        { currentAvailableQty: 0, totalGrossWeight: undefined, storageBinLocation: inventory.storageBinLocation ?? "" },
        { currentAvailableQty: 0, totalGrossWeight: undefined, storageBinLocation: inventory.storageBinLocation ?? "" },
    ]);

    const addItem = () => {
        setItems([...items, { currentAvailableQty: 0, totalGrossWeight: undefined, storageBinLocation: inventory.storageBinLocation ?? "" }]);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const updateItem = (idx: number, field: keyof SeparateChemicalInventoryItem, value: any) => {
        const newItems = [...items];
        newItems[idx] = { ...newItems[idx], [field]: value };
        setItems(newItems);
    };

    const totalSeparated = items.reduce((sum, item) => sum + (Number(item.currentAvailableQty) || 0), 0);
    const isValid = totalSeparated <= inventory.currentAvailableQty && items.length >= 2 && items.every((i) => (i.currentAvailableQty || 0) > 0);

    const handleSubmit = () => {
        if (!isValid) {
            if (items.length < 2) {
                toast.error(t("inventory.chemical.inventories.separateMinCount", { defaultValue: "Cần tách ít nhất thành 2 lọ" }));
                return;
            }
            toast.error(t("inventory.chemical.inventories.separateInvalid", { defaultValue: "Tổng lượng tách không được vượt quá lượng hiện có và mỗi lọ phải có lượng > 0" }));
            return;
        }

        separateMutation.mutate(
            {
                body: {
                    chemicalInventoryId: inventory.chemicalInventoryId,
                    note: note || undefined,
                    originalTotalGrossWeight: originalTotalGrossWeight,
                    separationChemicals: items as SeparateChemicalInventoryItem[],
                },
            },
            {
                onSuccess: () => onClose(),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div
                className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-semibold">{t("inventory.chemical.inventories.separate", { defaultValue: "Tách lọ hóa chất" })}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t("inventory.chemical.inventories.separateDesc", {
                                defaultValue: "Tách từ lọ {{id}} (Hiện có: {{qty}} {{unit}})",
                                id: inventory.chemicalInventoryId,
                                qty: inventory.currentAvailableQty,
                                unit: (inventory as any).chemicalSku?.chemicalBaseUnit ?? "",
                            })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Note & Original bottle weight */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-muted px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold tracking-wider uppercase text-muted-foreground">
                                {t("inventory.chemical.inventories.originalBottle", { defaultValue: "Lọ Gốc" })}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{t("inventory.chemical.inventories.originalTotalGrossWeight", { defaultValue: "Lượng còn lại cả bì sau tách" })}</label>
                                <Input
                                    type="number"
                                    step="any"
                                    className="h-9"
                                    placeholder="0.00"
                                    value={originalTotalGrossWeight || ""}
                                    onChange={(e) => setOriginalTotalGrossWeight(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{t("common.note", { defaultValue: "Ghi chú" })}</label>
                                <Input
                                    placeholder={t("inventory.chemical.inventories.separateNotePlaceholder", { defaultValue: "Lý do tách lọ..." })}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="h-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium font-mono text-primary flex items-center gap-2">
                                <span className="bg-primary/10 px-2 py-0.5 rounded-md">{t("inventory.chemical.inventories.newBottlesList", { defaultValue: "CÁC LỌ MỚI" })}</span>
                            </label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 border-dashed">
                                <Plus className="h-4 w-4 mr-1" /> {t("common.add", { defaultValue: "Thêm lọ" })}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className="p-4 border border-border rounded-xl bg-card hover:border-primary/50 transition-colors space-y-4 group relative">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("common.bottle", { defaultValue: "Lọ mới" })}</span>
                                        </div>
                                        {items.length > 2 && (
                                            <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors p-1 opacity-0 group-hover:opacity-100">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                                {t("common.quantity", { defaultValue: "Số lượng" })}
                                                <span className="text-destructive">*</span>
                                            </label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-sm focus-visible:ring-primary"
                                                    placeholder="0.00"
                                                    value={item.currentAvailableQty || ""}
                                                    onChange={(e) => updateItem(idx, "currentAvailableQty", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground">
                                                    {(inventory as any).chemicalSku?.chemicalBaseUnit}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                                                {t("inventory.chemical.inventories.totalGrossWeight", { defaultValue: "Lượng cả bì" })}
                                            </label>
                                            <Input
                                                type="number"
                                                step="any"
                                                className="h-9 text-sm"
                                                placeholder="0.00"
                                                value={item.totalGrossWeight || ""}
                                                onChange={(e) => updateItem(idx, "totalGrossWeight", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                                                {t("inventory.chemical.inventories.storageBinLocation", { defaultValue: "Vị trí" })}
                                            </label>
                                            <Input
                                                className="h-9 text-sm"
                                                placeholder={t("inventory.chemical.inventories.locationPlace", { defaultValue: "Tủ, kệ..." })}
                                                value={item.storageBinLocation || ""}
                                                onChange={(e) => updateItem(idx, "storageBinLocation", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Info */}
                    <div
                        className={`p-4 rounded-xl flex items-center gap-4 text-sm transition-colors border ${
                            totalSeparated > inventory.currentAvailableQty ? "bg-destructive/5 text-destructive border-destructive/20" : "bg-primary/5 text-primary border-primary/20"
                        }`}
                    >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${totalSeparated > inventory.currentAvailableQty ? "bg-destructive/10" : "bg-primary/10"}`}>
                            <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-xs uppercase tracking-tight opacity-70 mb-1">{t("inventory.chemical.inventories.summary", { defaultValue: "TÓM TẮT TRIẾT TÁCH" })}</div>
                            <div className="flex justify-between items-end">
                                <div className="text-sm font-medium">{t("inventory.chemical.inventories.totalSeparated", { defaultValue: "Tổng lượng tách ra" })}:</div>
                                <div className={`text-xl font-bold font-mono ${totalSeparated > inventory.currentAvailableQty ? "text-destructive" : ""}`}>
                                    {totalSeparated.toLocaleString()} / {inventory.currentAvailableQty.toLocaleString()}{" "}
                                    <span className="text-xs font-normal opacity-70 uppercase">{(inventory as any).chemicalSku?.chemicalBaseUnit}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0 bg-muted/20">
                    <Button variant="ghost" onClick={onClose}>
                        {t("common.cancel", { defaultValue: "Hủy" })}
                    </Button>
                    <Button onClick={handleSubmit} disabled={!isValid || separateMutation.isPending} className="px-8 shadow-lg shadow-primary/25">
                        {separateMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />{" "}
                                {t("common.processing", { defaultValue: "Đang xử lý..." })}
                            </div>
                        ) : (
                            t("common.confirm", { defaultValue: "Xác nhận tách lọ" })
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
