import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Save, Plus, Trash2, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { chemicalApi } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import { useQrScanner } from "@/hooks/useQrScanner";
import type { ChemicalAuditBlock } from "@/types/chemical";

type Props = {
    auditBlock?: ChemicalAuditBlock | null; // null/undefined → create mode
    onClose: () => void;
};

const SCOPE_OPTIONS = ["ALL", "SKU", "LOCATION", "CATEGORY"];
const STATUS_OPTIONS = ["DRAFT", "IN_PROGRESS", "PENDING_APPROVAL", "COMPLETED", "CANCELLED"];

type DetailRow = {
    chemicalAuditDetailId?: string;
    chemicalInventoryId: string;
    chemicalSkuId: string;
    systemAvailableQty: string;
    actualAvailableQty: string;
    chemicalAuditDetailNote: string;
};

function newRow(): DetailRow {
    return { chemicalInventoryId: "", chemicalSkuId: "", systemAvailableQty: "", actualAvailableQty: "", chemicalAuditDetailNote: "" };
}

export function AuditBlockEditModal({ auditBlock, onClose }: Props) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const isCreate = !auditBlock;
    const [isScanning, setIsScanning] = useState(false);

    const [form, setForm] = useState({
        chemicalAuditBlockId: auditBlock?.chemicalAuditBlockId ?? "",
        auditName: auditBlock?.auditName ?? "",
        auditScope: auditBlock?.auditScope ?? "ALL",
        auditScopeValue: auditBlock?.auditScopeValue ?? "",
        chemicalAuditBlockStatus: auditBlock?.chemicalAuditBlockStatus ?? "DRAFT",
        assignedTo: auditBlock?.assignedTo ?? "",
        note: auditBlock?.note ?? "",
    });

    const [details, setDetails] = useState<DetailRow[]>(
        (auditBlock?.details ?? []).map((d: any) => ({
            chemicalAuditDetailId: d.chemicalAuditDetailId,
            chemicalInventoryId: d.chemicalInventoryId ?? "",
            chemicalSkuId: d.chemicalSkuId ?? "",
            systemAvailableQty: String(d.systemAvailableQty ?? ""),
            actualAvailableQty: String(d.actualAvailableQty ?? ""),
            chemicalAuditDetailNote: d.chemicalAuditDetailNote ?? "",
        })),
    );

    const mutation = useMutation({
        mutationFn: async () => {
            const body = {
                ...form,
                details: details.map((d) => ({
                    ...(d.chemicalAuditDetailId ? { chemicalAuditDetailId: d.chemicalAuditDetailId } : {}),
                    chemicalInventoryId: d.chemicalInventoryId,
                    chemicalSkuId: d.chemicalSkuId,
                    systemAvailableQty: d.systemAvailableQty !== "" ? Number(d.systemAvailableQty) : null,
                    actualAvailableQty: d.actualAvailableQty !== "" ? Number(d.actualAvailableQty) : null,
                    chemicalAuditDetailNote: d.chemicalAuditDetailNote,
                })),
            };
            return isCreate ? chemicalApi.auditBlocks.create({ body }) : chemicalApi.auditBlocks.update({ body });
        },
        onSuccess: (res) => {
            if (!res.success) {
                toast.error(
                    res.error?.message ||
                        (isCreate ? t("inventory.chemical.audit.createFailed", { defaultValue: "Tạo thất bại" }) : t("inventory.chemical.audit.updateFailed", { defaultValue: "Cập nhật thất bại" })),
                );
                return;
            }
            toast.success(
                isCreate
                    ? t("inventory.chemical.audit.createSuccess", { defaultValue: "Đã tạo đợt kiểm kê thành công" })
                    : t("inventory.chemical.audit.updateSuccess", { defaultValue: "Đã cập nhật đợt kiểm kê thành công" }),
            );
            qc.invalidateQueries({ queryKey: chemicalKeys.auditBlocks.all() });
            qc.invalidateQueries({ queryKey: chemicalKeys.auditDetails.all() });
            onClose();
        },
        onError: (err: any) => toast.error(err?.message || t("common.unknownError", { defaultValue: "Lỗi không xác định" })),
    });

    const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
    const addRow = () => {
        setDetails((d) => [...d, newRow()]);
    };
    const removeRow = (i: number) => setDetails((d) => d.filter((_, idx) => idx !== i));
    const handleGlobalScan = useCallback(
        async (scannedId: string) => {
            // Duplicate check
            const isDuplicate = details.some((d) => d.chemicalInventoryId === scannedId);
            if (isDuplicate) {
                toast.error(t("inventory.chemical.audit.duplicateInventory", { defaultValue: "Mã chai này đã có trong danh sách kiểm kê: {{id}}", id: scannedId }));
                return;
            }

            setIsScanning(true);
            // Determine which row index to fill
            setDetails((prev) => {
                const lastIdx = prev.length - 1;
                if (prev.length > 0 && prev[lastIdx].chemicalInventoryId === "") {
                    // Update in-place
                    return prev.map((r, i) => (i === lastIdx ? { ...r, chemicalInventoryId: scannedId } : r));
                } else {
                    return [...prev, { ...newRow(), chemicalInventoryId: scannedId }];
                }
            });

            // Fetch details to auto-fill SKU + system qty
            try {
                const res = await chemicalApi.inventories.full({ id: scannedId });
                if (res.success && res.data) {
                    const inv = res.data as any;
                    setDetails((prev) =>
                        prev.map((r) =>
                            r.chemicalInventoryId === scannedId && r.chemicalSkuId === ""
                                ? {
                                      ...r,
                                      chemicalSkuId: inv.chemicalSkuId || "",
                                      systemAvailableQty: String(inv.currentAvailableQty || 0),
                                  }
                                : r,
                        ),
                    );
                    toast.success(t("inventory.chemical.audit.scanSuccess", { defaultValue: "Đã khớp: {{id}}", id: scannedId }));
                } else {
                    toast.error(t("inventory.chemical.inventories.notFound", { defaultValue: "Không tìm thấy mã: {{id}}", id: scannedId }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsScanning(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [t, details],
    );

    const updateRow = (i: number, key: keyof DetailRow, val: string) => {
        if (key === "chemicalInventoryId" && val !== "") {
            const isDuplicate = details.some((d, idx) => idx !== i && d.chemicalInventoryId === val);
            if (isDuplicate) {
                toast.error(t("inventory.chemical.audit.duplicateInventory", { defaultValue: "Mã chai này đã có trong danh sách kiểm kê: {{id}}", id: val }));
                return;
            }
        }
        setDetails((d) => d.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
    };

    useQrScanner(handleGlobalScan);

    const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-start justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">
                            {isCreate
                                ? t("inventory.chemical.audit.createTitle", { defaultValue: "Tạo Đợt Kiểm Kê" })
                                : t("inventory.chemical.audit.editTitle", { defaultValue: "Chỉnh sửa Đợt Kiểm Kê" })}
                        </h3>
                        {!isCreate && <p className="text-xs text-muted-foreground mt-0.5 font-mono">{auditBlock!.chemicalAuditBlockId}</p>}
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {/* Block Info */}
                    <div className="p-5 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.audit.auditName", { defaultValue: "Tên đợt kiểm kê" })} <span className="text-destructive">*</span>
                            </label>
                            <Input
                                id="audit-name"
                                value={form.auditName}
                                onChange={(e) => setField("auditName", e.target.value)}
                                placeholder={t("inventory.chemical.audit.namePlaceholder", { defaultValue: "VD: Kiểm kê định kỳ Q1-2025" })}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.audit.scope", { defaultValue: "Phạm vi" })}</label>
                                <select id="audit-scope" value={form.auditScope} onChange={(e) => setField("auditScope", e.target.value)} className={selectCls}>
                                    {SCOPE_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {t("inventory.chemical.audit.scopeValue", { defaultValue: "Giá trị phạm vi" })}
                                </label>
                                <Input
                                    id="audit-scope-value"
                                    value={form.auditScopeValue}
                                    onChange={(e) => setField("auditScopeValue", e.target.value)}
                                    placeholder={t("inventory.chemical.audit.scopeValuePlaceholder", { defaultValue: "VD: CHEM-001, Kho A..." })}
                                    disabled={form.auditScope === "ALL"}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.audit.status", { defaultValue: "Trạng thái" })}</label>
                                <select id="audit-status" value={form.chemicalAuditBlockStatus} onChange={(e) => setField("chemicalAuditBlockStatus", e.target.value)} className={selectCls}>
                                    {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {t("inventory.chemical.audit.assignedTo", { defaultValue: "Người thực hiện" })}
                                </label>
                                <Input
                                    id="audit-assigned"
                                    value={form.assignedTo}
                                    onChange={(e) => setField("assignedTo", e.target.value)}
                                    placeholder={t("inventory.chemical.audit.assignedToPlaceholder", { defaultValue: "Tên nhân viên kiểm kê" })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.audit.note", { defaultValue: "Ghi chú" })}</label>
                                <Input
                                    id="audit-note"
                                    value={form.note}
                                    onChange={(e) => setField("note", e.target.value)}
                                    placeholder={t("inventory.chemical.audit.notePlaceholder", { defaultValue: "Ghi chú thêm..." })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Detail Rows */}
                    <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">
                                {t("inventory.chemical.audit.detailItems", { defaultValue: "Chi tiết kiểm đếm" })}
                                <span className="ml-2 text-xs text-muted-foreground font-normal">({t("common.itemCount", { count: details.length, defaultValue: "{{count}} mục" })})</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                        isScanning ? "border-primary/50 bg-primary/5 text-primary" : "border-border text-muted-foreground bg-muted/30"
                                    }`}
                                >
                                    <Scan className={`h-3.5 w-3.5 ${isScanning ? "animate-pulse" : ""}`} />
                                    <span>
                                        {isScanning
                                            ? t("inventory.chemical.inventories.scanning", { defaultValue: "Đang xử lý..." })
                                            : t("inventory.chemical.inventories.scanReady", { defaultValue: "Sẵn sàng quét QR" })}
                                    </span>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addRow}>
                                    <Plus className="h-4 w-4 mr-1" /> {t("common.addRow", { defaultValue: "Thêm dòng" })}
                                </Button>
                            </div>
                        </div>

                        {details.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-md bg-muted/20">
                                {t("inventory.chemical.audit.noDetailsHint", { defaultValue: 'Chưa có chi tiết kiểm đếm. Nhấn "Thêm dòng" để bắt đầu.' })}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Header */}
                                <div className="grid grid-cols-[1fr_1fr_80px_80px_1fr_32px] gap-2 px-2">
                                    {[
                                        t("inventory.chemical.audit.auditId", { defaultValue: "Mã Chai" }),
                                        t("inventory.chemical.audit.skuId", { defaultValue: "Mã SKU" }),
                                        t("inventory.chemical.audit.systemQtyShort", { defaultValue: "SL Hệ thống" }),
                                        t("inventory.chemical.audit.actualQtyShort", { defaultValue: "SL Thực tế" }),
                                        t("inventory.chemical.audit.note", { defaultValue: "Ghi chú" }),
                                        "",
                                    ].map((h) => (
                                        <div key={h} className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                            {h}
                                        </div>
                                    ))}
                                </div>
                                {details.map((row, i) => {
                                    const variance = row.actualAvailableQty !== "" && row.systemAvailableQty !== "" ? Number(row.actualAvailableQty) - Number(row.systemAvailableQty) : null;
                                    return (
                                        <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_1fr_32px] gap-2 items-center p-2 bg-muted/20 rounded-md border border-border">
                                            <Input
                                                value={row.chemicalInventoryId}
                                                onChange={(e) => updateRow(i, "chemicalInventoryId", e.target.value)}
                                                placeholder={t("inventory.chemical.audit.auditId", { defaultValue: "Mã chai" })}
                                                className="h-8 text-xs"
                                                id={`audit-detail-inv-${i}`}
                                            />
                                            <Input
                                                value={row.chemicalSkuId}
                                                onChange={(e) => updateRow(i, "chemicalSkuId", e.target.value)}
                                                placeholder={t("inventory.chemical.audit.skuId", { defaultValue: "Mã SKU" })}
                                                className="h-8 text-xs"
                                                id={`audit-detail-sku-${i}`}
                                            />
                                            <Input
                                                type="number"
                                                value={row.systemAvailableQty}
                                                onChange={(e) => updateRow(i, "systemAvailableQty", e.target.value)}
                                                placeholder="0"
                                                className="h-8 text-xs text-right"
                                                id={`audit-detail-sys-${i}`}
                                            />
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={row.actualAvailableQty}
                                                    onChange={(e) => updateRow(i, "actualAvailableQty", e.target.value)}
                                                    placeholder="0"
                                                    className="h-8 text-xs text-right"
                                                    id={`audit-detail-actual-${i}`}
                                                />
                                                {variance !== null && (
                                                    <div
                                                        className={`absolute -bottom-4 right-0 text-[10px] font-bold ${variance > 0 ? "text-green-600" : variance < 0 ? "text-destructive" : "text-muted-foreground"}`}
                                                    >
                                                        {variance > 0 ? `+${variance}` : variance}
                                                    </div>
                                                )}
                                            </div>
                                            <Input
                                                value={row.chemicalAuditDetailNote}
                                                onChange={(e) => updateRow(i, "chemicalAuditDetailNote", e.target.value)}
                                                placeholder={t("inventory.chemical.audit.note", { defaultValue: "Ghi chú" })}
                                                className="h-8 text-xs"
                                                id={`audit-detail-note-${i}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeRow(i)}
                                                className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-2 shrink-0">
                    <div className="text-xs text-muted-foreground">{details.length > 0 && t("common.itemCount", { count: details.length, defaultValue: `${details.length} mục chi tiết` })}</div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                            {t("common.cancel", { defaultValue: "Hủy" })}
                        </Button>
                        <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.auditName.trim()}>
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("common.saving", { defaultValue: "Đang lưu..." })}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {isCreate ? t("inventory.chemical.audit.createButton", { defaultValue: "Tạo đợt kiểm kê" }) : t("common.saveChanges", { defaultValue: "Lưu thay đổi" })}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
