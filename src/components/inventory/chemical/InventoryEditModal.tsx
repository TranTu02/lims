import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { chemicalApi } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import type { ChemicalInventory } from "@/types/chemical";
import { SkuSelect } from "./SkuSelect";

type Props = {
    inventory?: ChemicalInventory | null; // null/undefined → create mode
    onClose: () => void;
};

const STATUS_OPTIONS = ["New", "InUse", "Quarantined", "Empty", "Expired", "Disposed"];

export function InventoryEditModal({ inventory, onClose }: Props) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const isCreate = !inventory;

    const [form, setForm] = useState({
        chemicalInventoryId: inventory?.chemicalInventoryId ?? "",
        chemicalSkuId: (inventory as any)?.chemicalSkuId ?? "",
        lotNumber: (inventory as any)?.lotNumber ?? "",
        storageBinLocation: (inventory as any)?.storageBinLocation ?? "",
        chemicalInventoryStatus: (inventory as any)?.chemicalInventoryStatus ?? "New",
        manufacturerName: (inventory as any)?.manufacturerName ?? "",
        manufacturerCountry: (inventory as any)?.manufacturerCountry ?? "",
        mfgDate: (inventory as any)?.mfgDate ? String((inventory as any).mfgDate).slice(0, 10) : "",
        expDate: (inventory as any)?.expDate ? String((inventory as any).expDate).slice(0, 10) : "",
        openedDate: (inventory as any)?.openedDate ? String((inventory as any).openedDate).slice(0, 10) : "",
        openedExpDate: (inventory as any)?.openedExpDate ? String((inventory as any).openedExpDate).slice(0, 10) : "",
        currentAvailableQty: String((inventory as any)?.currentAvailableQty ?? ""),
    });

    const mutation = useMutation({
        mutationFn: () => (isCreate ? chemicalApi.inventories.create({ body: form }) : chemicalApi.inventories.update({ body: form })),
        onSuccess: (res) => {
            if (!res.success) {
                toast.error(
                    res.error?.message ||
                        (isCreate
                            ? t("inventory.chemical.inventories.createFailed", { defaultValue: "Tạo thất bại" })
                            : t("inventory.chemical.inventories.updateFailed", { defaultValue: "Cập nhật thất bại" })),
                );
                return;
            }
            toast.success(
                isCreate
                    ? t("inventory.chemical.inventories.createSuccess", { defaultValue: "Đã tạo lọ/chai mới thành công" })
                    : t("inventory.chemical.inventories.updateSuccess", { defaultValue: "Đã cập nhật thông tin lọ/chai thành công" }),
            );
            qc.invalidateQueries({ queryKey: chemicalKeys.inventories.all() });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.message || t("common.unknownError", { defaultValue: "Lỗi không xác định" }));
        },
    });

    const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border w-[560px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-semibold">
                            {isCreate
                                ? t("inventory.chemical.inventories.newBottle", { defaultValue: "Nhập Lọ Mới" })
                                : t("inventory.chemical.inventories.editBottle", { defaultValue: "Chỉnh sửa Lọ/Chai" })}
                        </h3>
                        {!isCreate && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{inventory!.chemicalInventoryId}</p>}
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                    {isCreate && (
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.chemicalSkuId", { defaultValue: "Mã SKU" })} <span className="text-destructive">*</span>
                            </label>
                            <SkuSelect
                                value={form.chemicalSkuId}
                                onChange={(skuId) => set("chemicalSkuId", skuId)}
                                placeholder={t("inventory.chemical.skus.selectPlaceholder", { defaultValue: "Chọn mã SKU..." })}
                            />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}</label>
                            <Input value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} id="edit-inv-lot" placeholder="VD: LOT-2025-001" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.chemicalInventoryStatus", { defaultValue: "Trạng thái" })}
                            </label>
                            <select
                                id="edit-inv-status"
                                value={form.chemicalInventoryStatus}
                                onChange={(e) => set("chemicalInventoryStatus", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.storageBinLocation", { defaultValue: "Vị trí lưu kho" })}
                            </label>
                            <Input value={form.storageBinLocation} onChange={(e) => set("storageBinLocation", e.target.value)} id="edit-inv-location" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.manufacturer", { defaultValue: "Hãng Sản xuất" })}</label>
                            <Input value={form.manufacturerName} onChange={(e) => set("manufacturerName", e.target.value)} id="edit-inv-mfg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.origin", { defaultValue: "Nước SX" })}</label>
                            <Input value={form.manufacturerCountry} onChange={(e) => set("manufacturerCountry", e.target.value)} id="edit-inv-country" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Tồn kho hiện tại" })}
                            </label>
                            <Input type="number" value={form.currentAvailableQty} onChange={(e) => set("currentAvailableQty", e.target.value)} id="edit-inv-qty" />
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                            {t("inventory.chemical.inventories.expiryInfo", { defaultValue: "Thông tin thời hạn" })}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t("inventory.chemical.inventories.mfgDate", { defaultValue: "Ngày SX" })}</label>
                                <Input type="date" value={form.mfgDate} onChange={(e) => set("mfgDate", e.target.value)} id="edit-inv-mfgdate" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t("inventory.chemical.inventories.expDate", { defaultValue: "Hạn SD (Chưa mở)" })}</label>
                                <Input type="date" value={form.expDate} onChange={(e) => set("expDate", e.target.value)} id="edit-inv-expdate" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t("inventory.chemical.inventories.openedDate", { defaultValue: "Ngày khui hộp" })}</label>
                                <Input type="date" value={form.openedDate} onChange={(e) => set("openedDate", e.target.value)} id="edit-inv-openeddate" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">{t("inventory.chemical.inventories.openedExpDate", { defaultValue: "Hạn SD (Sau khui)" })}</label>
                                <Input type="date" value={form.openedExpDate} onChange={(e) => set("openedExpDate", e.target.value)} id="edit-inv-openedexpdate" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        {t("common.cancel", { defaultValue: "Hủy" })}
                    </Button>
                    <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || (isCreate && !form.chemicalSkuId.trim())}>
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {t("common.saving", { defaultValue: "Đang lưu..." })}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {isCreate ? t("common.createNew", { defaultValue: "Tạo mới" }) : t("common.saveChanges", { defaultValue: "Lưu thay đổi" })}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
