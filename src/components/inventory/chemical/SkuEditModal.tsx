import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { chemicalApi } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import type { ChemicalSku } from "@/types/chemical";

type Props = {
    sku: ChemicalSku;
    onClose: () => void;
};

const HAZARD_CLASSES = ["Flammable", "Toxic", "Corrosive", "Oxidizing", "Explosive", "Radioactive", "Biohazard", "Irritant", "Environmental Hazard", "None"];

export function SkuEditModal({ sku, onClose }: Props) {
    const qc = useQueryClient();

    const [form, setForm] = useState({
        chemicalSkuId: sku.chemicalSkuId,
        chemicalName: sku.chemicalName ?? "",
        chemicalCASNumber: sku.chemicalCASNumber ?? "",
        chemicalBaseUnit: sku.chemicalBaseUnit ?? "",
        chemicalReorderLevel: String((sku as any).chemicalReorderLevel ?? ""),
        chemicalHazardClass: (sku as any).chemicalHazardClass ?? "",
    });

    const mutation = useMutation({
        mutationFn: () => chemicalApi.skus.update({ body: form }),
        onSuccess: (res) => {
            if (!res.success) {
                toast.error(res.error?.message || "Cập nhật thất bại");
                return;
            }
            toast.success("Đã cập nhật danh mục hóa chất thành công");
            qc.invalidateQueries({ queryKey: chemicalKeys.skus.all() });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.message || "Lỗi không xác định");
        },
    });

    const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border w-[520px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-semibold">Chỉnh sửa Danh mục Hóa chất</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{sku.chemicalSkuId}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tên hóa chất</label>
                        <Input value={form.chemicalName} onChange={(e) => set("chemicalName", e.target.value)} id="edit-sku-name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Số CAS</label>
                            <Input value={form.chemicalCASNumber} onChange={(e) => set("chemicalCASNumber", e.target.value)} id="edit-sku-cas" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Đơn vị cơ bản</label>
                            <Input value={form.chemicalBaseUnit} onChange={(e) => set("chemicalBaseUnit", e.target.value)} id="edit-sku-unit" placeholder="g, ml, bottle..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mức tái đặt hàng</label>
                            <Input type="number" value={form.chemicalReorderLevel} onChange={(e) => set("chemicalReorderLevel", e.target.value)} id="edit-sku-reorder" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phân loại nguy hiểm</label>
                            <select
                                id="edit-sku-hazard"
                                value={form.chemicalHazardClass}
                                onChange={(e) => set("chemicalHazardClass", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">-- Chọn --</option>
                                {HAZARD_CLASSES.map((h) => (
                                    <option key={h} value={h}>
                                        {h}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        Hủy
                    </Button>
                    <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Lưu thay đổi
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
