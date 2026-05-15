import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Loader2, Save, Plus, Trash2, Scan, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { chemicalApi, useChemicalAuditBlockApprove } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import { useQrScanner } from "@/hooks/useQrScanner";
import { useAuth } from "@/contexts/AuthContext";
import { InventoryEditModal } from "./InventoryEditModal";
import type { ChemicalAuditBlock, ChemicalInventory } from "@/types/chemical";

type Props = {
    auditBlock?: ChemicalAuditBlock | null;
    onClose: () => void;
};

const SCOPE_OPTIONS = ["ALL", "SKU", "LOCATION", "CATEGORY"];
const STATUS_OPTIONS = ["DRAFT", "IN_PROGRESS", "PENDING_APPROVAL", "COMPLETED", "CANCELLED"];

type DetailRow = {
    chemicalAuditDetailId?: string;
    chemicalInventoryId: string;
    chemicalName: string;
    chemicalSkuId: string;
    chemicalSkuOldId: string;
    lotNumber: string;
    systemAvailableQty: string;
    actualAvailableQty: string;
    chemicalAuditDetailNote: string;
};

function newRowFromInv(inv: ChemicalInventory): DetailRow {
    return {
        chemicalInventoryId: inv.chemicalInventoryId,
        chemicalName: (inv as any).chemicalName ?? "",
        chemicalSkuId: inv.chemicalSkuId ?? "",
        chemicalSkuOldId: (inv as any).chemicalSkuOldId ?? "",
        lotNumber: (inv as any).lotNumber ?? "",
        systemAvailableQty: String(inv.currentAvailableQty ?? ""),
        actualAvailableQty: "",
        chemicalAuditDetailNote: "",
    };
}

// --- Inventory Picker Modal (same pattern as TransactionBlocksTab) ---
type PickerProps = { selectedIds: string[]; onToggle: (inv: ChemicalInventory) => void; onClose: () => void; };

function InventoryPickerModal({ selectedIds, onToggle, onClose }: PickerProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [scanning, setScanning] = useState(false);

    const { data: invList, isLoading } = useQuery({
        queryKey: chemicalKeys.inventories.list(search || undefined),
        queryFn: async () => {
            const res = await chemicalApi.inventories.list(search ? { query: { search } } : undefined);
            const inner = (res as any).data;
            if (Array.isArray(inner)) return inner as ChemicalInventory[];
            if (inner?.data && Array.isArray(inner.data)) return inner.data as ChemicalInventory[];
            return [] as ChemicalInventory[];
        },
    });

    useQrScanner(async (id) => {
        const found = invList?.find(i => i.chemicalInventoryId === id);
        if (found) { onToggle(found); return; }
        setScanning(true);
        try {
            const res = await chemicalApi.inventories.full({ id });
            if (res.success && res.data) onToggle(res.data as ChemicalInventory);
            else toast.error(t("inventory.chemical.inventories.notFound", { defaultValue: "Không tìm thấy: {{id}}", id }));
        } finally { setScanning(false); }
    }, { enabled: !createOpen });

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl shadow-2xl border border-border flex flex-col" style={{ width: "55%", height: "70%", minWidth: 680 }} onClick={e => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold">Chọn hóa chất từ kho</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Chọn một hoặc nhiều chai để thêm vào phiếu kiểm kê</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md"><X className="h-4 w-4" /></button>
                </div>
                <div className="p-3 border-b border-border flex items-center gap-2">
                    <div className="relative flex-1">
                        {scanning ? (
                            <div className="flex items-center h-9 px-3 text-sm text-muted-foreground bg-muted rounded-md gap-2">
                                <Scan className="h-4 w-4 animate-pulse text-primary" /> Đang quét...
                            </div>
                        ) : (
                            <>
                                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Tìm barcode, tên HC, mã SKU, số lô..." value={search} onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && invList?.length === 1) { onToggle(invList[0]); setSearch(""); } }}
                                    className="pl-8" id="audit-inv-picker-search" />
                            </>
                        )}
                    </div>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(true)} className="shrink-0">
                        <Plus className="h-4 w-4 mr-1" /> Lọ mới
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 border-b border-border">
                            <tr>
                                <th className="px-3 py-2 w-8"></th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Barcode / ID</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tên HC</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Mã SKU</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Số Lô</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Tồn</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>{Array.from({ length: 7 }).map((__, j) => <td key={j} className="p-3"><Skeleton className="h-4 w-16" /></td>)}</tr>
                            )) : (invList ?? []).map(inv => {
                                const checked = selectedIds.includes(inv.chemicalInventoryId);
                                return (
                                    <tr key={inv.chemicalInventoryId} className={`hover:bg-muted/30 cursor-pointer transition-colors ${checked ? "bg-primary/5" : ""}`} onClick={() => onToggle(inv)}>
                                        <td className="px-3 py-2 text-center"><input type="checkbox" readOnly checked={checked} className="accent-primary" /></td>
                                        <td className="px-3 py-2 font-mono text-xs">{inv.chemicalInventoryId}</td>
                                        <td className="px-3 py-2 text-xs">{(inv as any).chemicalName ?? "-"}</td>
                                        <td className="px-3 py-2 text-xs">{inv.chemicalSkuId ?? "-"}</td>
                                        <td className="px-3 py-2 text-xs text-muted-foreground">{(inv as any).lotNumber ?? "-"}</td>
                                        <td className="px-3 py-2 text-right font-medium text-xs">{inv.currentAvailableQty ?? 0}</td>
                                        <td className="px-3 py-2 text-center"><Badge variant="outline" className="text-[10px]">{(inv as any).chemicalInventoryStatus ?? "-"}</Badge></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-border flex items-center justify-between shrink-0">
                    <span className="text-sm text-muted-foreground">Đã chọn: <strong>{selectedIds.length}</strong></span>
                    <Button type="button" onClick={onClose} size="sm">Xác nhận</Button>
                </div>
            </div>
            {createOpen && <InventoryEditModal inventory={null} onClose={() => setCreateOpen(false)} />}
        </div>
    );
}

export function AuditBlockEditModal({ auditBlock, onClose }: Props) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const { user } = useAuth();
    const isCreate = !auditBlock;
    const isApproved = auditBlock?.chemicalAuditBlockStatus === "COMPLETED" || auditBlock?.chemicalAuditBlockStatus === "APPROVED";
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
            chemicalName: d.chemicalName ?? "",
            chemicalSkuId: d.chemicalSkuId ?? "",
            chemicalSkuOldId: d.chemicalSkuOldId ?? "",
            lotNumber: d.lotNumber ?? "",
            systemAvailableQty: String(d.systemAvailableQty ?? ""),
            actualAvailableQty: String(d.actualAvailableQty ?? ""),
            chemicalAuditDetailNote: d.chemicalAuditDetailNote ?? "",
        })),
    );

    const [pickerOpen, setPickerOpen] = useState(false);

    // IDs currently in detail list (for picker checkbox state)
    const selectedPickerIds = details.map(d => d.chemicalInventoryId).filter(Boolean);

    // Toggle from picker: add if not present, remove if present
    const toggleInventory = (inv: ChemicalInventory) => {
        const exists = details.some(d => d.chemicalInventoryId === inv.chemicalInventoryId);
        if (exists) {
            setDetails(prev => prev.filter(d => d.chemicalInventoryId !== inv.chemicalInventoryId));
        } else {
            setDetails(prev => [...prev, newRowFromInv(inv)]);
        }
    };


    const mutation = useMutation({
        mutationFn: async () => {
            const body = {
                ...form,
                details: details.map((d) => ({
                    ...(d.chemicalAuditDetailId ? { chemicalAuditDetailId: d.chemicalAuditDetailId } : {}),
                    chemicalInventoryId: d.chemicalInventoryId,
                    chemicalName: d.chemicalName,
                    chemicalSkuId: d.chemicalSkuId,
                    chemicalSkuOldId: d.chemicalSkuOldId,
                    lotNumber: d.lotNumber,
                    systemAvailableQty: d.systemAvailableQty !== "" ? Number(d.systemAvailableQty) : null,
                    actualAvailableQty: d.actualAvailableQty !== "" ? Number(d.actualAvailableQty) : null,
                    chemicalAuditDetailNote: d.chemicalAuditDetailNote,
                })),
            };
            return isCreate ? chemicalApi.auditBlocks.create({ body }) : chemicalApi.auditBlocks.update({ body });
        },
        onSuccess: (res) => {
            if (!res.success) { toast.error(res.error?.message || "Lỗi"); return; }
            toast.success(isCreate ? "Đã tạo đợt kiểm kê thành công" : "Đã cập nhật đợt kiểm kê thành công");
            qc.invalidateQueries({ queryKey: chemicalKeys.auditBlocks.all() });
            qc.invalidateQueries({ queryKey: chemicalKeys.auditDetails.all() });
            onClose();
        },
        onError: (err: any) => toast.error(err?.message || "Lỗi không xác định"),
    });

    const approveMutation = useChemicalAuditBlockApprove();

    const handleApprove = () => {
        console.log("handleApprove triggered", auditBlock);
        if (!auditBlock?.chemicalAuditBlockId) {
            toast.error("Không tìm thấy ID đợt kiểm kê");
            return;
        }
        if (!window.confirm("Bạn có chắc chắn muốn duyệt đợt kiểm kê này? Tồn kho sẽ được cập nhật tự động.")) return;

        console.log("Executing approveMutation with payload:", { chemicalAuditBlockId: auditBlock.chemicalAuditBlockId, approvedBy: user?.identityId || "system" });
        approveMutation.mutate(
            {
                body: {
                    chemicalAuditBlockId: auditBlock.chemicalAuditBlockId,
                    approvedBy: user?.identityId || "system",
                },
            },
            {
                onSuccess: () => {
                    console.log("approveMutation success");
                    onClose();
                },
                onError: (err) => {
                    console.error("approveMutation error:", err);
                }
            }
        );
    };

    const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
    const removeRow = (i: number) => setDetails((d) => d.filter((_, idx) => idx !== i));

    const handleGlobalScan = useCallback(
        async (scannedId: string) => {
            if (details.some((d) => d.chemicalInventoryId === scannedId)) {
                toast.error(`Mã chai này đã có trong danh sách: ${scannedId}`); return;
            }
            setIsScanning(true);
            try {
                const res = await chemicalApi.inventories.full({ id: scannedId });
                if (res.success && res.data) {
                    setDetails(prev => [...prev, newRowFromInv(res.data as ChemicalInventory)]);
                    toast.success(`Đã thêm: ${scannedId}`);
                } else {
                    toast.error(`Không tìm thấy mã: ${scannedId}`);
                }
            } catch (err) { console.error(err); }
            finally { setIsScanning(false); }
        },
        [details],
    );

    const updateRow = (i: number, key: keyof DetailRow, val: string) => {
        setDetails((d) => d.map((r, idx) => idx === i ? { ...r, [key]: val } : r));
    };

    useQrScanner(handleGlobalScan, { enabled: !pickerOpen });

    const selectCls = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

    const COLS = "grid-cols-[1.2fr_1.5fr_1fr_0.8fr_0.8fr_70px_70px_50px_1fr_32px]";

    return (
        <>
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div
                className="bg-background rounded-xl shadow-2xl border border-border flex flex-col"
                style={{ width: "80vw", height: "80vh" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-start justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">
                            {isCreate ? t("inventory.chemical.audit.createTitle", { defaultValue: "Tạo Đợt Kiểm Kê" }) : t("inventory.chemical.audit.editTitle", { defaultValue: "Chỉnh sửa Đợt Kiểm Kê" })}
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
                            <Input id="audit-name" value={form.auditName} onChange={(e) => setField("auditName", e.target.value)} placeholder="VD: Kiểm kê định kỳ Q1-2025" disabled={isApproved} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phạm vi</label>
                                <select id="audit-scope" value={form.auditScope} onChange={(e) => setField("auditScope", e.target.value)} className={selectCls} disabled={isApproved}>
                                    {SCOPE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Giá trị phạm vi</label>
                                <Input id="audit-scope-value" value={form.auditScopeValue} onChange={(e) => setField("auditScopeValue", e.target.value)} placeholder="VD: CHEM-001, Kho A..." disabled={form.auditScope === "ALL" || isApproved} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trạng thái</label>
                                <select id="audit-status" value={form.chemicalAuditBlockStatus} onChange={(e) => setField("chemicalAuditBlockStatus", e.target.value)} className={selectCls} disabled={isApproved}>
                                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Người thực hiện</label>
                                <Input id="audit-assigned" value={form.assignedTo} onChange={(e) => setField("assignedTo", e.target.value)} placeholder="Tên nhân viên kiểm kê" disabled={isApproved} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ghi chú</label>
                                <Input id="audit-note" value={form.note} onChange={(e) => setField("note", e.target.value)} placeholder="Ghi chú thêm..." disabled={isApproved} />
                            </div>
                        </div>
                    </div>

                    {/* Detail Rows */}
                    <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">
                                Chi tiết kiểm đếm
                                <span className="ml-2 text-xs text-muted-foreground font-normal">({details.length} mục)</span>
                            </p>
                            <div className={`flex items-center gap-2 ${isApproved ? "hidden" : ""}`}>
                                <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${isScanning ? "border-primary/50 bg-primary/5 text-primary" : "border-border text-muted-foreground bg-muted/30"}`}>
                                    <Scan className={`h-3.5 w-3.5 ${isScanning ? "animate-pulse" : ""}`} />
                                    <span>{isScanning ? "Đang xử lý..." : "Sẵn sàng quét QR"}</span>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" /> Chọn từ kho
                                </Button>
                            </div>
                        </div>

                        {details.length === 0 ? (
                            <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-md bg-muted/20">
                                Chưa có chi tiết kiểm đếm. Nhấn <strong>"Chọn từ kho"</strong> hoặc quét QR để bắt đầu.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Column headers */}
                                <div className={`grid ${COLS} gap-2 px-2`}>
                                    {["Mã Chai", "Tên Hóa Chất", "Mã SKU", "Mã Cũ", "Số Lô", "SL HT", "SL TT", "Lệch", "Ghi chú", ""].map((h, hi) => (
                                        <div key={hi} className={`text-[10px] font-semibold text-muted-foreground uppercase tracking-wide ${hi === 7 ? "text-center" : ""}`}>{h}</div>
                                    ))}
                                </div>

                                {details.map((row, i) => {
                                    const variance = row.actualAvailableQty !== "" && row.systemAvailableQty !== ""
                                        ? Number(row.actualAvailableQty) - Number(row.systemAvailableQty) : null;
                                    const varCls = variance === null ? "" : variance > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : variance < 0 ? "bg-red-100 text-destructive dark:bg-red-900/30" : "bg-muted text-muted-foreground";
                                    return (
                                        <div key={i} className={`grid ${COLS} gap-2 items-center p-2 rounded-md border ${variance !== null && variance !== 0 ? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10" : "border-border bg-muted/20"}`}>
                                            <Input value={row.chemicalInventoryId} onChange={(e) => updateRow(i, "chemicalInventoryId", e.target.value)} placeholder="Mã chai" className="h-8 text-xs font-mono" id={`audit-detail-inv-${i}`} disabled={isApproved} />
                                            <Input value={row.chemicalName} onChange={(e) => updateRow(i, "chemicalName", e.target.value)} placeholder="Tên hóa chất" className="h-8 text-xs" id={`audit-detail-name-${i}`} disabled={isApproved} />
                                            <Input value={row.chemicalSkuId} onChange={(e) => updateRow(i, "chemicalSkuId", e.target.value)} placeholder="Mã SKU" className="h-8 text-xs" id={`audit-detail-sku-${i}`} disabled={isApproved} />
                                            <Input value={row.chemicalSkuOldId} onChange={(e) => updateRow(i, "chemicalSkuOldId", e.target.value)} placeholder="Mã Cũ" className="h-8 text-xs font-mono text-[10px]" id={`audit-detail-skuold-${i}`} disabled={isApproved} />
                                            <Input value={row.lotNumber} onChange={(e) => updateRow(i, "lotNumber", e.target.value)} placeholder="Số lô" className="h-8 text-xs" id={`audit-detail-lot-${i}`} disabled={isApproved} />
                                            <Input type="number" value={row.systemAvailableQty} onChange={(e) => updateRow(i, "systemAvailableQty", e.target.value)} placeholder="0" className="h-8 text-xs text-right" id={`audit-detail-sys-${i}`} disabled={isApproved} />
                                            <Input type="number" value={row.actualAvailableQty} onChange={(e) => updateRow(i, "actualAvailableQty", e.target.value)} placeholder="0" className="h-8 text-xs text-right" id={`audit-detail-actual-${i}`} disabled={isApproved} />
                                            <div className="flex items-center justify-center">
                                                {variance !== null ? (
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${varCls}`}>
                                                        {variance > 0 ? `+${variance}` : variance}
                                                    </span>
                                                ) : <span className="text-[10px] text-muted-foreground">—</span>}
                                            </div>
                                            <Input value={row.chemicalAuditDetailNote} onChange={(e) => updateRow(i, "chemicalAuditDetailNote", e.target.value)} placeholder="Ghi chú" className="h-8 text-xs" id={`audit-detail-note-${i}`} disabled={isApproved} />
                                            {!isApproved && (
                                                <button type="button" onClick={() => removeRow(i)} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-destructive rounded transition-colors">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-between gap-2 shrink-0">
                    <div className="text-xs text-muted-foreground">{details.length > 0 && `${details.length} mục chi tiết`}</div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending || approveMutation.isPending}>Hủy</Button>
                        
                        {!isCreate && !isApproved && (
                            <Button 
                                type="button" 
                                variant="destructive" 
                                onClick={handleApprove} 
                                disabled={mutation.isPending || approveMutation.isPending}
                            >
                                {approveMutation.isPending ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang duyệt...</>
                                ) : (
                                    <>Duyệt kiểm kê</>
                                )}
                            </Button>
                        )}

                        <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || approveMutation.isPending || !form.auditName.trim() || isApproved}>
                            {mutation.isPending ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>
                            ) : (
                                <><Save className="h-4 w-4 mr-2" />{isCreate ? "Tạo đợt kiểm kê" : "Lưu thay đổi"}</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        {pickerOpen && (
            <InventoryPickerModal
                selectedIds={selectedPickerIds}
                onToggle={toggleInventory}
                onClose={() => setPickerOpen(false)}
            />
        )}
        </>
    );
}
