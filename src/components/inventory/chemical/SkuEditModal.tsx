import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { chemicalApi, useEnumList } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import type { ChemicalSku } from "@/types/chemical";

type Props = {
    sku?: ChemicalSku | null; // null/undefined → create mode
    onClose: () => void;
    onSuccess?: (sku: ChemicalSku) => void;
};

export function SkuEditModal({ sku, onClose, onSuccess }: Props) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const isCreate = !sku;
    const { data: chemicalTypes } = useEnumList("chemicalType");
    const { data: hazardClasses } = useEnumList("chemicalHazardClass");

    const [form, setForm] = useState({
        chemicalSkuId: sku?.chemicalSkuId ?? "",
        chemicalName: sku?.chemicalName ?? "",
        chemicalCasNumber: sku?.chemicalCasNumber ?? "",
        chemicalBaseUnit: sku?.chemicalBaseUnit ?? "",
        chemicalReorderLevel: String(sku?.chemicalReorderLevel ?? ""),
        chemicalHazardClass: sku?.chemicalHazardClass ?? "",
        chemicalType: sku?.chemicalType ?? "",
        openedExpDays: String(sku?.openedExpDays ?? ""),
        chemicalSkuOldId: sku?.chemicalSkuOldId ?? "",
    });

    const mutation = useMutation({
        mutationFn: () => (isCreate ? chemicalApi.skus.create({ body: form }) : chemicalApi.skus.update({ body: form })),
        onSuccess: (res) => {
            if (!res.success) {
                toast.error(
                    res.error?.message ||
                        (isCreate ? t("inventory.chemical.skus.createFailed", { defaultValue: "Tạo thất bại" }) : t("inventory.chemical.skus.updateFailed", { defaultValue: "Cập nhật thất bại" })),
                );
                return;
            }
            toast.success(
                isCreate
                    ? t("inventory.chemical.skus.createSuccess", { defaultValue: "Đã tạo SKU mới thành công" })
                    : t("inventory.chemical.skus.updateSuccess", { defaultValue: "Đã cập nhật thông tin SKU thành công" }),
            );
            qc.invalidateQueries({ queryKey: chemicalKeys.skus.all() });

            if (isCreate && onSuccess && res.data) {
                onSuccess(res.data as ChemicalSku);
            }

            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.message || t("common.unknownError", { defaultValue: "Lỗi không xác định" }));
        },
    });

    const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

    const insertChar = (char: string, inputId: string) => {
        const input = document.getElementById(inputId) as HTMLInputElement | null;
        if (input) {
            const start = input.selectionStart ?? 0;
            const end = input.selectionEnd ?? 0;
            const text = input.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            const newVal = before + char + after;
            set("chemicalName", newVal);
            setTimeout(() => {
                input.focus();
                input.setSelectionRange(start + char.length, start + char.length);
            }, 0);
        } else {
            set("chemicalName", form.chemicalName + char);
        }
    };

    const SPECIAL_CHARS = {
        superscript: ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹", "⁺", "⁻"],
        subscript: ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "₊", "₋"],
        greek: ["α", "β", "γ", "δ", "λ", "μ", "π", "Ω", "°", "℃", "→", "⇌", "±", "•", "·"]
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-background rounded-xl shadow-2xl border border-border w-[520px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-semibold">
                            {isCreate
                                ? t("inventory.chemical.skus.addCategory", { defaultValue: "Thêm Danh mục Hóa chất" })
                                : t("inventory.chemical.skus.editCategory", { defaultValue: "Chỉnh sửa Danh mục Hóa chất" })}
                        </h3>
                        {!isCreate && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{sku!.chemicalSkuId}</p>}
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {t("inventory.chemical.skus.chemicalName", { defaultValue: "Tên hóa chất" })} <span className="text-destructive">*</span>
                        </label>
                        <Input
                            value={form.chemicalName}
                            onChange={(e) => set("chemicalName", e.target.value)}
                            id="edit-sku-name"
                            placeholder={t("inventory.chemical.skus.namePlaceholder", { defaultValue: "VD: Methanol HPLC Grade" })}
                        />
                        <div className="p-2 bg-muted/40 rounded-lg border border-border/50 text-[10px] space-y-1.5 mt-1">
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[10px] text-muted-foreground mr-1 select-none font-medium">Chỉ số trên:</span>
                                {SPECIAL_CHARS.superscript.map((char) => (
                                    <button
                                        key={char}
                                        type="button"
                                        onClick={() => insertChar(char, "edit-sku-name")}
                                        className="w-5 h-5 flex items-center justify-center bg-background border border-border rounded hover:bg-primary hover:text-primary-foreground font-bold transition-all text-[11px]"
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[10px] text-muted-foreground mr-1 select-none font-medium">Chỉ số dưới:</span>
                                {SPECIAL_CHARS.subscript.map((char) => (
                                    <button
                                        key={char}
                                        type="button"
                                        onClick={() => insertChar(char, "edit-sku-name")}
                                        className="w-5 h-5 flex items-center justify-center bg-background border border-border rounded hover:bg-primary hover:text-primary-foreground font-bold transition-all text-[11px]"
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[10px] text-muted-foreground mr-1 select-none font-medium">Ký hiệu:</span>
                                {SPECIAL_CHARS.greek.map((char) => (
                                    <button
                                        key={char}
                                        type="button"
                                        onClick={() => insertChar(char, "edit-sku-name")}
                                        className="w-5 h-5 flex items-center justify-center bg-background border border-border rounded hover:bg-primary hover:text-primary-foreground font-bold transition-all text-[11px]"
                                    >
                                        {char}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.chemicalCasNumber", { defaultValue: "Số CAS" })}</label>
                            <Input value={form.chemicalCasNumber} onChange={(e) => set("chemicalCasNumber", e.target.value)} id="edit-sku-cas" placeholder="VD: 67-56-1" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.skus.chemicalBaseUnit", { defaultValue: "Đơn vị cơ bản" })} <span className="text-destructive">*</span>
                            </label>
                            <Input value={form.chemicalBaseUnit} onChange={(e) => set("chemicalBaseUnit", e.target.value)} id="edit-sku-unit" placeholder="g, ml, bottle..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.skus.chemicalReorderLevel", { defaultValue: "Mức tái đặt hàng" })}
                            </label>
                            <Input type="number" value={form.chemicalReorderLevel} onChange={(e) => set("chemicalReorderLevel", e.target.value)} id="edit-sku-reorder" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.skus.chemicalHazardClass", { defaultValue: "Phân loại nguy hiểm" })}
                            </label>
                            <select
                                id="edit-sku-hazard"
                                value={form.chemicalHazardClass}
                                onChange={(e) => set("chemicalHazardClass", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">-- {t("common.select", { defaultValue: "Chọn" })} --</option>
                                {(hazardClasses || []).map((h) => (
                                    <option key={h} value={h}>
                                        {h}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.chemicalType", { defaultValue: "Loại hóa chất" })}</label>
                            <select
                                id="edit-sku-type"
                                value={form.chemicalType}
                                onChange={(e) => set("chemicalType", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">-- {t("common.select", { defaultValue: "Chọn" })} --</option>
                                {(chemicalTypes || []).map((h) => (
                                    <option key={h} value={h}>
                                        {h}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.skus.openedExpDays", { defaultValue: "Ngày dùng sau mở (Mặc định)" })}
                            </label>
                            <Input type="number" value={form.openedExpDays} onChange={(e) => set("openedExpDays", e.target.value)} id="edit-sku-exp-open" placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.skus.chemicalSkuOldId", { defaultValue: "Mã SKU cũ (nếu có)" })}
                            </label>
                            <Input value={form.chemicalSkuOldId} onChange={(e) => set("chemicalSkuOldId", e.target.value)} id="edit-sku-old-id" placeholder="SKU_OLD_..." />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        {t("common.cancel", { defaultValue: "Hủy" })}
                    </Button>
                    <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.chemicalName.trim()}>
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
