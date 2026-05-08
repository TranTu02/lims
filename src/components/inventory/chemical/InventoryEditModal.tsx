import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, Save, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { chemicalApi, useEnumList, useChemicalTechnicians } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import type { ChemicalInventory } from "@/types/chemical";
import { SkuSelect } from "./SkuSelect";
import { searchDocuments } from "@/api/documents";
import { SearchSelectPicker, type PickerItem } from "@/components/library/protocols/SearchSelectPicker";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";
import { Upload } from "lucide-react";

type Props = {
    inventory?: ChemicalInventory | null; // null/undefined → create mode
    onClose: () => void;
};

const STATUS_OPTIONS = ["New", "InUse", "Quarantined", "Pending", "Empty", "Expired", "Disposed"];

export function InventoryEditModal({ inventory, onClose }: Props) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const isCreate = !inventory;
    const { data: binLocations, isLoading: binsLoading } = useEnumList("storageBinLocation");
    const { data: chemicalTypes } = useEnumList("chemicalType");
    const { data: technicians } = useChemicalTechnicians();

    const [form, setForm] = useState({
        chemicalInventoryId: inventory?.chemicalInventoryId ?? "",
        chemicalSkuId: (inventory as any)?.chemicalSkuId ?? "",
        chemicalName: (inventory as any)?.chemicalName ?? "",
        chemicalType: (inventory as any)?.chemicalType ?? "",
        chemicalCasNumber: (inventory as any)?.chemicalCasNumber ?? "",
        lotNumber: (inventory as any)?.lotNumber ?? "",
        chemicalSkuOldId: (inventory as any)?.chemicalSkuOldId ?? "",
        storageBinLocation: (inventory as any)?.storageBinLocation ?? "",
        chemicalInventoryStatus: (inventory as any)?.chemicalInventoryStatus ?? "Pending",
        manufacturerName: (inventory as any)?.manufacturerName ?? "",
        manufacturerCountry: (inventory as any)?.manufacturerCountry ?? "",
        mfgDate: (inventory as any)?.mfgDate ? String((inventory as any).mfgDate).slice(0, 10) : "",
        expDate: (inventory as any)?.expDate ? String((inventory as any).expDate).slice(0, 10) : "",
        openedDate: (inventory as any)?.openedDate ? String((inventory as any).openedDate).slice(0, 10) : "",
        openedExpDays: (inventory as any)?.openedExpDays ?? 0,
        openedExpDate: (inventory as any)?.openedExpDate ? String((inventory as any).openedExpDate).slice(0, 10) : "",
        currentAvailableQty: isCreate ? "0" : String((inventory as any)?.currentAvailableQty ?? ""),
        totalGrossWeight: (inventory as any)?.totalGrossWeight !== undefined && (inventory as any)?.totalGrossWeight !== null ? String((inventory as any)?.totalGrossWeight) : "",
        storageConditions: (inventory as any)?.storageConditions ?? "",
        inventoryCoaDocumentIds: (inventory as any)?.inventoryCoaDocumentIds ?? [],
        selectedDocuments: ((inventory as any)?.inventoryCoaDocumentIds ?? []).map((id: string) => ({
            id,
            label: id,
            sublabel: "",
        })),
        inventoryInvoiceDocumentIds: (inventory as any)?.inventoryInvoiceDocumentIds ?? [],
        selectedInvoiceDocuments: ((inventory as any)?.inventoryInvoiceDocumentIds ?? []).map((id: string) => ({
            id,
            label: id,
            sublabel: "",
        })),
        parentInventoryIds: (inventory as any)?.parentInventoryIds ?? [],
        selectedParentInventories: (inventory as any)?.parentInventories?.length > 0 
            ? (inventory as any).parentInventories.map((p: any) => ({
                  id: p.chemicalInventoryId,
                  label: p.chemicalInventoryId,
                  sublabel: p.chemicalName || p.chemicalSkuId || "",
              }))
            : ((inventory as any)?.parentInventoryIds ?? []).map((id: string) => ({
                  id,
                  label: id,
                  sublabel: "",
              })),
        preparedById: (inventory as any)?.preparedById ?? "",
        preparedBy: typeof (inventory as any)?.preparedBy === "string" 
            ? (inventory as any)?.preparedBy 
            : ((inventory as any)?.preparedBy?.identityName ?? ""),
        preparationLocation: (inventory as any)?.preparationLocation ?? "",
        selectedPreparer: (inventory as any)?.preparedById
            ? [
                  {
                      id: (inventory as any).preparedById,
                      label: typeof (inventory as any)?.preparedBy === "string" 
                          ? (inventory as any)?.preparedBy 
                          : ((inventory as any)?.preparedBy?.identityName || (inventory as any).preparedById),
                      sublabel: "",
                  },
              ]
            : [],
        preparedDate: (inventory as any)?.preparedDate ? String((inventory as any).preparedDate).slice(0, 16) : "",
    });

    const [cloneCount, setCloneCount] = useState(1);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [uploadInvoiceModalOpen, setUploadInvoiceModalOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: async () => {
            const isInUse = ["InUse", "Inuse"].includes(form.chemicalInventoryStatus);
            const payload = {
                ...form,
                mfgDate: form.mfgDate || null,
                expDate: form.expDate || null,
                openedDate: isInUse ? form.openedDate || null : null,
                openedExpDate: isInUse ? form.openedExpDate || null : null,
                totalGrossWeight: form.totalGrossWeight ? Number(form.totalGrossWeight) : null,
            };
            // Remove helper fields not needed by API
            delete (payload as any).selectedDocuments;
            delete (payload as any).selectedInvoiceDocuments;
            delete (payload as any).selectedParentInventories;
            delete (payload as any).selectedPreparer;

            if (payload.chemicalType === "Hóa chất pha") {
                (payload as any).preparedDate = form.preparedDate ? new Date(form.preparedDate).toISOString() : null;
                // preparedById and preparedBy and preparationLocation are already in payload from form
            } else {
                (payload as any).parentInventoryIds = [];
                (payload as any).preparedById = null;
                (payload as any).preparedBy = null;
                (payload as any).preparationLocation = null;
                (payload as any).preparedDate = null;
            }

            if (isCreate) {
                // Batch creation logic
                const createPromises = [];
                for (let i = 0; i < cloneCount; i++) {
                    createPromises.push(chemicalApi.inventories.create({ body: payload as any }));
                }
                const results = await Promise.all(createPromises);
                return results[0]; // Return the first result for the onSuccess handler
            } else {
                return chemicalApi.inventories.update({ body: payload as any });
            }
        },
        onSuccess: (res) => {
            if (!res.success) {
                toast.error(
                    res.error?.message ||
                        (isCreate
                            ? String(t("inventory.chemical.inventories.createFailed", { defaultValue: "Tạo thất bại" }))
                            : String(t("inventory.chemical.inventories.updateFailed", { defaultValue: "Cập nhật thất bại" }))),
                );
                return;
            }
            toast.success(
                isCreate
                    ? String(t("inventory.chemical.inventories.createSuccess", { defaultValue: "Đã tạo lọ/chai mới thành công" }))
                    : String(t("inventory.chemical.inventories.updateSuccess", { defaultValue: "Đã cập nhật thông tin lọ/chai thành công" })),
            );
            qc.invalidateQueries({ queryKey: chemicalKeys.inventories.all() });
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.message || String(t("common.unknownError", { defaultValue: "Lỗi không xác định" })));
        },
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !uploadModalOpen && !uploadInvoiceModalOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, uploadModalOpen]);

    const calculateOpenedExpDate = (openedDateStr: string, days: number) => {
        if (!openedDateStr || !days) return "";
        const d = new Date(openedDateStr);
        d.setDate(d.getDate() + Number(days));
        return d.toISOString().slice(0, 10);
    };

    const set = (key: string, val: any) => {
        setForm((f) => {
            const next = { ...f, [key]: val };

            // Auto calculate openedExpDate if openedDate or openedExpDays changes
            if (key === "openedDate" || key === "openedExpDays") {
                next.openedExpDate = calculateOpenedExpDate(next.openedDate, next.openedExpDays);
            }

            // Auto set openedDate when status changes to InUse
            if (key === "chemicalInventoryStatus" && (val === "InUse" || val === "Inuse")) {
                if (!next.openedDate) {
                    next.openedDate = new Date().toISOString().slice(0, 10);
                    next.openedExpDate = calculateOpenedExpDate(next.openedDate, next.openedExpDays);
                }
            }

            return next;
        });
    };

    const searchDocumentsFn = async (q: string): Promise<PickerItem[]> => {
        try {
            const docs = await searchDocuments(q);
            return docs.map((d) => ({
                id: d.documentId,
                label: d.documentTitle || d.documentId,
                sublabel: d.documentId,
            }));
        } catch {
            return [];
        }
    };

    const searchInventoriesFn = async (q: string): Promise<PickerItem[]> => {
        try {
            const res = await chemicalApi.inventories.list({ query: { search: q, itemsPerPage: 20 } });
            if (!res.success || !res.data) return [];
            return res.data.map((inv) => ({
                id: inv.chemicalInventoryId,
                label: `${inv.chemicalInventoryId} - ${inv.chemicalName}`,
                sublabel: `${inv.lotNumber || "No Lot"} | ${inv.chemicalType}`,
            }));
        } catch {
            return [];
        }
    };

    const searchIdentitiesFn = async (q: string): Promise<PickerItem[]> => {
        if (!technicians) return [];
        const filtered = technicians.filter(t => 
            t.identityName.toLowerCase().includes(q.toLowerCase()) || 
            t.identityId.toLowerCase().includes(q.toLowerCase())
        );
        return filtered.map((idnt) => ({
            id: idnt.identityId,
            label: idnt.identityName,
            sublabel: `${idnt.identityId}${idnt.identityRoles?.length ? ` - ${idnt.identityRoles.join(", ")}` : ""}`,
        }));
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl shadow-2xl border border-border w-[900px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {t("inventory.chemical.inventories.chemicalSkuId", { defaultValue: "Mã SKU" })} <span className="text-destructive">*</span>
                                </label>
                                <SkuSelect
                                    value={form.chemicalSkuId}
                                    onChange={(skuId, sku) => {
                                        setForm((f) => ({
                                            ...f,
                                            chemicalSkuId: skuId,
                                            chemicalName: sku?.chemicalName || f.chemicalName,
                                            chemicalType: sku?.chemicalType || f.chemicalType,
                                            chemicalCasNumber: sku?.chemicalCasNumber || f.chemicalCasNumber,
                                            chemicalSkuOldId: (sku as any)?.chemicalSkuOldId || f.chemicalSkuOldId,
                                            openedExpDays: sku?.openedExpDays ?? f.openedExpDays,
                                            openedExpDate: calculateOpenedExpDate(f.openedDate, sku?.openedExpDays ?? f.openedExpDays),
                                        }));
                                    }}
                                    placeholder={t("inventory.chemical.skus.selectPlaceholder", { defaultValue: "Chọn mã SKU..." })}
                                />
                            </div>
                            {isCreate && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {t("inventory.chemical.inventories.cloneCount", { defaultValue: "Số lượng lọ/chai" })}
                                    </label>
                                    <Input type="number" min={1} max={50} value={cloneCount} onChange={(e) => setCloneCount(Math.max(1, parseInt(e.target.value) || 1))} placeholder="Số lượng lọ..." />
                                    <p className="text-[10px] text-muted-foreground italic">Nhập số lượng để nhân bản thông tin sang nhiều lọ/chai khác nhau.</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.name", { defaultValue: "Tên hóa chất" })}</label>
                                    <Input value={form.chemicalName} onChange={(e) => set("chemicalName", e.target.value)} placeholder="Tên snapshot từ SKU" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.cas", { defaultValue: "Số CAS" })}</label>
                                    <Input value={form.chemicalCasNumber} onChange={(e) => set("chemicalCasNumber", e.target.value)} placeholder="CAS snapshot" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}</label>
                            <Input value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} id="edit-inv-lot" placeholder="LOT-..." />
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
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.chemicalType", { defaultValue: "Loại hóa chất" })}</label>
                            <select
                                id="edit-inv-type"
                                value={form.chemicalType}
                                onChange={(e) => set("chemicalType", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="">-- {t("common.select", { defaultValue: "Theo SKU gốc" })} --</option>
                                {(chemicalTypes || []).map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.storageBinLocation", { defaultValue: "Vị trí lưu kho" })} <span className="text-destructive">*</span>
                            </label>
                            <select
                                id="edit-inv-location"
                                value={form.storageBinLocation}
                                onChange={(e) => set("storageBinLocation", e.target.value)}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                disabled={binsLoading}
                            >
                                <option value="">-- {t("common.select", { defaultValue: "Chọn..." })} --</option>
                                {binLocations?.map((loc) => (
                                    <option key={loc} value={loc}>
                                        {loc}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.manufacturer", { defaultValue: "Hãng Sản xuất" })}</label>
                            <Input value={form.manufacturerName} onChange={(e) => set("manufacturerName", e.target.value)} id="edit-inv-mfg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.origin", { defaultValue: "Nước SX" })}</label>
                            <Input value={form.manufacturerCountry} onChange={(e) => set("manufacturerCountry", e.target.value)} id="edit-inv-country" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Tồn kho" })}
                            </label>
                            <Input type="number" step="any" value={form.currentAvailableQty} onChange={(e) => set("currentAvailableQty", e.target.value)} id="edit-inv-qty" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.totalGrossWeight", { defaultValue: "KL cả bì" })}
                            </label>
                            <Input type="number" step="any" value={form.totalGrossWeight} onChange={(e) => set("totalGrossWeight", e.target.value)} id="edit-inv-gross" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.chemicalSkuOldId", { defaultValue: "Mã cũ" })}
                            </label>
                            <Input value={form.chemicalSkuOldId} onChange={(e) => set("chemicalSkuOldId", e.target.value)} id="edit-inv-oldid" />
                        </div>

                        <div className="col-span-4 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.storageConditions", { defaultValue: "Điều kiện lưu kho" })}
                            </label>
                            <Input
                                value={form.storageConditions}
                                onChange={(e) => set("storageConditions", e.target.value)}
                                id="edit-inv-conditions"
                                placeholder="Nơi thoáng mát, tối, nhiệt độ phòng 20-25°C..."
                            />
                        </div>
                    </div>

                    {form.chemicalType === "Hóa chất pha" && (
                        <div className="border-t border-border pt-4 space-y-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-blue-500/10 rounded-md">
                                    <Search className="h-4 w-4 text-blue-500" />
                                </div>
                                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
                                    {t("inventory.chemical.inventories.preparedInfo", { defaultValue: "Thông tin Hóa chất pha" })}
                                </p>
                            </div>

                            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {t("inventory.chemical.inventories.parentInventoryIds", { defaultValue: "Hóa chất gốc (Quét/Chọn)" })}
                                    </label>
                                    <SearchSelectPicker
                                        label={String(t("inventory.chemical.inventories.selectParent", { defaultValue: "Chọn hóa chất gốc..." }))}
                                        selected={form.selectedParentInventories}
                                        onChange={(items) => setForm((f) => ({ ...f, parentInventoryIds: items.map((i) => i.id), selectedParentInventories: items }))}
                                        onSearch={searchInventoriesFn}
                                        placeholder={String(t("inventory.chemical.inventories.scanOrSearchParent", { defaultValue: "Quét barcode hoặc tìm tên hóa chất gốc..." }))}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Dùng để truy vết ISO 17025 - Biết dung dịch này được pha từ những lọ nào.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {t("inventory.chemical.inventories.preparedById", { defaultValue: "Người pha chế" })}
                                        </label>
                                        <SearchSelectPicker
                                            label={String(t("inventory.chemical.inventories.selectPreparer", { defaultValue: "Chọn người pha..." }))}
                                            selected={form.selectedPreparer}
                                            onChange={(items) => {
                                                const lastItem = items[items.length - 1];
                                                setForm((f) => ({ 
                                                    ...f, 
                                                    preparedById: lastItem?.id || "", 
                                                    preparedBy: lastItem?.label || "",
                                                    selectedPreparer: lastItem ? [{ ...lastItem, sublabel: "" }] : []
                                                }));
                                            }}
                                            onSearch={searchIdentitiesFn}
                                            placeholder={String(t("inventory.chemical.inventories.searchPreparer", { defaultValue: "Tìm tên hoặc mã nhân viên..." }))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {t("inventory.chemical.inventories.preparationLocation", { defaultValue: "Nơi pha hóa chất" })}
                                        </label>
                                        <Input
                                            value={form.preparationLocation}
                                            onChange={(e) => set("preparationLocation", e.target.value)}
                                            placeholder="VD: Phòng Lab 1, Tủ hút..."
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {t("inventory.chemical.inventories.preparedDate", { defaultValue: "Ngày & Giờ pha" })}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type="datetime-local"
                                                value={form.preparedDate}
                                                onChange={(e) => set("preparedDate", e.target.value)}
                                                className="pl-9"
                                            />
                                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

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
                                <label className="text-xs text-muted-foreground">{t("inventory.chemical.inventories.openedExpDays", { defaultValue: "Số ngày dùng sau mở" })}</label>
                                <Input type="number" value={form.openedExpDays} onChange={(e) => set("openedExpDays", e.target.value)} id="edit-inv-openedexpdays" placeholder="VD: 30" />
                            </div>
                            {["InUse", "Inuse"].includes(form.chemicalInventoryStatus) && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs text-muted-foreground">{t("inventory.chemical.inventories.openedDate", { defaultValue: "Ngày khui hộp" })}</label>
                                        <Input type="date" value={form.openedDate} onChange={(e) => set("openedDate", e.target.value)} id="edit-inv-openeddate" />
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-xs text-muted-foreground">
                                            {t("inventory.chemical.inventories.openedExpDate", { defaultValue: "Hạn SD thực tế sau khui (Dự kiến)" })}
                                        </label>
                                        <Input type="date" value={form.openedExpDate} readOnly className="bg-muted font-bold text-primary" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("inventory.chemical.inventories.coaDocuments", { defaultValue: "Tài liệu COA / Đính kèm" })}
                        </p>
                        <SearchSelectPicker
                            label={String(t("inventory.chemical.inventories.selectDocument", { defaultValue: "Chọn tài liệu đã có" }))}
                            selected={form.selectedDocuments}
                            onChange={(items) => setForm((f) => ({ ...f, inventoryCoaDocumentIds: items.map((i) => i.id), selectedDocuments: items }))}
                            onSearch={searchDocumentsFn}
                            placeholder={String(t("documentCenter.headers.allDesc", { defaultValue: "Tìm tài liệu..." }))}
                        />
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                                <Upload className="h-4 w-4 mr-2" />
                                {t("inventory.chemical.inventories.uploadCoa", { defaultValue: "Tải lên COA" })}
                            </Button>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {t("inventory.chemical.inventories.invoiceDocuments", { defaultValue: "Tài liệu Hóa đơn / Chứng từ" })}
                        </p>
                        <SearchSelectPicker
                            label={String(t("inventory.chemical.inventories.selectInvoice", { defaultValue: "Chọn hóa đơn đã có" }))}
                            selected={form.selectedInvoiceDocuments}
                            onChange={(items) => setForm((f) => ({ ...f, inventoryInvoiceDocumentIds: items.map((i) => i.id), selectedInvoiceDocuments: items }))}
                            onSearch={searchDocumentsFn}
                            placeholder={String(t("documentCenter.headers.allDesc", { defaultValue: "Tìm hóa đơn..." }))}
                        />
                        <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setUploadInvoiceModalOpen(true)}>
                                <Upload className="h-4 w-4 mr-2" />
                                {t("inventory.chemical.inventories.uploadInvoice", { defaultValue: "Tải lên Hóa đơn" })}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
                        {t("common.cancel", { defaultValue: "Hủy" })}
                    </Button>
                    <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending || (isCreate && !form.chemicalSkuId.trim()) || !form.storageBinLocation.trim()}>
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

            <DocumentUploadModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                fixedDocumentType="CHEMICAL_COA"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        setForm((s) => ({
                            ...s,
                            inventoryCoaDocumentIds: [...s.inventoryCoaDocumentIds, doc.documentId],
                            selectedDocuments: [...s.selectedDocuments, { id: doc.documentId, label: doc.documentTitle || doc.documentId, sublabel: doc.documentId }],
                        }));
                    }
                }}
            />

            <DocumentUploadModal
                open={uploadInvoiceModalOpen}
                onClose={() => setUploadInvoiceModalOpen(false)}
                fixedDocumentType="INVOICE"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        setForm((s) => ({
                            ...s,
                            inventoryInvoiceDocumentIds: [...s.inventoryInvoiceDocumentIds, doc.documentId],
                            selectedInvoiceDocuments: [...s.selectedInvoiceDocuments, { id: doc.documentId, label: doc.documentTitle || doc.documentId, sublabel: doc.documentId }],
                        }));
                    }
                }}
            />
        </div>
    );
}
