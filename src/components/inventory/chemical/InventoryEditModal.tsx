import { useState, useEffect, useRef } from "react";
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
const formatDateTimeDMYHM = (dateStr: string | null | undefined): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const parseDateTimeDMYHM = (dmyhm: string): string => {
    if (!dmyhm) return "";
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/;
    const match = dmyhm.trim().match(regex);
    if (match) {
        const [_, day, month, year, hours, minutes] = match;
        const d = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
        if (!isNaN(d.getTime())) {
            return d.toISOString();
        }
    }
    return dmyhm;
};

const STATUS_OPTIONS = ["New", "InUse", "Quarantined", "Pending", "Empty", "Expired", "Disposed"];

type Props = {
    inventory?: ChemicalInventory | null;
    onClose: () => void;
};

export function InventoryEditModal({ inventory, onClose }: Props) {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const isCreate = !inventory;
    const { data: binLocations, isLoading: binsLoading } = useEnumList("storageBinLocation");
    const { data: chemicalTypes } = useEnumList("chemicalType");
    const { data: technicians } = useChemicalTechnicians();
    const { data: storageConditionsList } = useEnumList("storageConditions");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const pickerRef = useRef<HTMLInputElement>(null);

    const handlePreparedDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const prevVal = form.preparedDate;
        if (val.length < prevVal.length) {
            set("preparedDate", val);
            return;
        }
        let cleaned = val.replace(/\D/g, "");
        let formatted = "";
        if (cleaned.length > 0) {
            formatted += cleaned.slice(0, 2);
        }
        if (cleaned.length > 2) {
            formatted += "/" + cleaned.slice(2, 4);
        }
        if (cleaned.length > 4) {
            formatted += "/" + cleaned.slice(4, 8);
        }
        if (cleaned.length > 8) {
            formatted += " " + cleaned.slice(8, 10);
        }
        if (cleaned.length > 10) {
            formatted += ":" + cleaned.slice(10, 12);
        }
        set("preparedDate", formatted);
    };

    const [form, setForm] = useState({
        chemicalInventoryId: inventory?.chemicalInventoryId ?? "",
        chemicalSkuId: (inventory as any)?.chemicalSkuId ?? "",
        chemicalName: (inventory as any)?.chemicalName ?? "",
        chemicalType: (inventory as any)?.chemicalType || (inventory as any)?.chemicalSku?.chemicalType || "",
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
        preparedBy: (typeof (inventory as any)?.preparedBy === "string" 
            ? (inventory as any)?.preparedBy 
            : ((inventory as any)?.preparedBy?.identityName ?? "")).normalize("NFC"),
        preparationLocation: (inventory as any)?.preparationLocation ?? "",
        preparationDocuments: (inventory as any)?.preparationDocuments ?? "",
        correctionFactorK: (inventory as any)?.correctionFactorK !== undefined && (inventory as any)?.correctionFactorK !== null ? String((inventory as any)?.correctionFactorK) : "",
        selectedPreparer: (inventory as any)?.preparedById
            ? [
                  {
                      id: (inventory as any).preparedById,
                      label: (typeof (inventory as any)?.preparedBy === "string" 
                          ? (inventory as any)?.preparedBy 
                          : ((inventory as any)?.preparedBy?.identityName || (inventory as any).preparedById)).normalize("NFC"),
                      sublabel: "",
                  },
              ]
            : [],
        preparedDate: (inventory as any)?.preparedDate ? formatDateTimeDMYHM(String((inventory as any).preparedDate)) : "",
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

            const isPreparedType = ["Hóa chất pha", "Dung dịch chuẩn độ", "Thuốc thử"].includes(payload.chemicalType);
            if (isPreparedType) {
                const parsedPreparedDate = parseDateTimeDMYHM(form.preparedDate);
                let isoPreparedDate = null;
                if (parsedPreparedDate) {
                    const d = new Date(parsedPreparedDate);
                    if (!isNaN(d.getTime())) {
                        isoPreparedDate = d.toISOString();
                    }
                }
                (payload as any).preparedDate = isoPreparedDate;
                (payload as any).mfgDate = isoPreparedDate ? isoPreparedDate.slice(0, 10) : null;
                (payload as any).correctionFactorK = (payload.chemicalType !== "Thuốc thử" && form.correctionFactorK) ? Number(form.correctionFactorK) : null;
                
                // Normalize empty strings to null to prevent FK constraint/validation errors
                (payload as any).preparedById = form.preparedById?.trim() || null;
                (payload as any).preparedBy = form.preparedBy?.trim() || null;
                (payload as any).preparationLocation = form.preparationLocation?.trim() || null;
                (payload as any).preparationDocuments = form.preparationDocuments?.trim() || null;
            } else {
                (payload as any).parentInventoryIds = [];
                (payload as any).preparedById = null;
                (payload as any).preparedBy = null;
                (payload as any).preparationLocation = null;
                (payload as any).preparationDocuments = null;
                (payload as any).correctionFactorK = null;
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
                            </div>
                        )}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.name", { defaultValue: "Tên hóa chất" })}</label>
                            <Input id="edit-inv-name" value={form.chemicalName} onChange={(e) => set("chemicalName", e.target.value)} placeholder="Tên snapshot từ SKU" />
                            <div className="p-2 bg-muted/40 rounded-lg border border-border/50 text-[10px] space-y-1.5 mt-1">
                                <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground mr-1 select-none font-medium">Chỉ số trên:</span>
                                    {SPECIAL_CHARS.superscript.map((char) => (
                                        <button
                                            key={char}
                                            type="button"
                                            onClick={() => insertChar(char, "edit-inv-name")}
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
                                            onClick={() => insertChar(char, "edit-inv-name")}
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
                                            onClick={() => insertChar(char, "edit-inv-name")}
                                            className="w-5 h-5 flex items-center justify-center bg-background border border-border rounded hover:bg-primary hover:text-primary-foreground font-bold transition-all text-[11px]"
                                        >
                                            {char}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.cas", { defaultValue: "Số CAS" })}</label>
                            <Input value={form.chemicalCasNumber} onChange={(e) => set("chemicalCasNumber", e.target.value)} placeholder="CAS snapshot" />
                        </div>
                    </div>
                    <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}</label>
                            <Input value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} id="edit-inv-lot" placeholder="LOT-..." />
                        </div>
                        <div className="col-span-2 space-y-1">
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
                        <div className="col-span-3 space-y-1">
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
                        <div className="col-span-3 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.manufacturer", { defaultValue: "Hãng Sản xuất" })}</label>
                            <Input value={form.manufacturerName} onChange={(e) => set("manufacturerName", e.target.value)} id="edit-inv-mfg" />
                        </div>

                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("inventory.chemical.skus.origin", { defaultValue: "Nước SX" })}</label>
                            <Input value={form.manufacturerCountry} onChange={(e) => set("manufacturerCountry", e.target.value)} id="edit-inv-country" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Tồn kho" })}
                            </label>
                            <Input type="number" step="any" value={form.currentAvailableQty} onChange={(e) => set("currentAvailableQty", e.target.value)} id="edit-inv-qty" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.totalGrossWeight", { defaultValue: "KL cả bì" })}
                            </label>
                            <Input type="number" step="any" value={form.totalGrossWeight} onChange={(e) => set("totalGrossWeight", e.target.value)} id="edit-inv-gross" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.chemicalSkuOldId", { defaultValue: "Mã cũ" })}
                            </label>
                            <Input value={form.chemicalSkuOldId} onChange={(e) => set("chemicalSkuOldId", e.target.value)} id="edit-inv-oldid" />
                        </div>

                        <div className="col-span-6 space-y-1 relative">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("inventory.chemical.inventories.storageConditions", { defaultValue: "Điều kiện lưu kho" })}
                            </label>
                            <Input
                                value={form.storageConditions}
                                onChange={(e) => set("storageConditions", e.target.value)}
                                id="edit-inv-conditions"
                                placeholder="Nơi thoáng mát, tối, nhiệt độ phòng 20-25°C..."
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                autoComplete="off"
                            />
                            {showSuggestions && storageConditionsList && storageConditionsList.length > 0 && (
                                <div className="absolute z-[80] left-0 right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[180px] overflow-y-auto p-1 divide-y divide-border/30">
                                    {storageConditionsList.map((cond) => (
                                        <button
                                            key={cond}
                                            type="button"
                                            onClick={() => set("storageConditions", cond)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                                        >
                                            {cond}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {["Hóa chất pha", "Dung dịch chuẩn độ", "Thuốc thử"].includes(form.chemicalType) && (
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
                                                type="text"
                                                placeholder="DD/MM/YYYY HH:MM"
                                                value={form.preparedDate}
                                                onChange={handlePreparedDateTextChange}
                                                className="pl-9"
                                            />
                                            <button
                                                type="button"
                                                className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
                                                onClick={() => {
                                                    try {
                                                        pickerRef.current?.showPicker();
                                                    } catch {
                                                        pickerRef.current?.click();
                                                    }
                                                }}
                                            >
                                                <Calendar className="h-4 w-4" />
                                            </button>
                                            <input
                                                ref={pickerRef}
                                                type="datetime-local"
                                                className="sr-only absolute"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val) {
                                                        set("preparedDate", formatDateTimeDMYHM(val));
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {t("inventory.chemical.inventories.preparationDocuments", { defaultValue: "TL pha (Tài liệu)" })}
                                        </label>
                                        <Input
                                            value={form.preparationDocuments}
                                            onChange={(e) => set("preparationDocuments", e.target.value)}
                                            placeholder="HD pha chế số..."
                                        />
                                    </div>
                                    {form.chemicalType !== "Thuốc thử" && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {t("inventory.chemical.inventories.correctionFactorK", { defaultValue: "Hệ số K" })}
                                            </label>
                                            <Input
                                                type="number"
                                                step="any"
                                                value={form.correctionFactorK}
                                                onChange={(e) => set("correctionFactorK", e.target.value)}
                                                placeholder="1.000..."
                                            />
                                        </div>
                                    )}
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
