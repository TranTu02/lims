import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { chemicalApi, useChemicalCreateTransactionBlock, useChemicalTransactionBlocksList, useChemicalTechnicians } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Package, Printer, Scan, RefreshCw, FileText, Upload, User, FlaskConical, Beaker } from "lucide-react";
import { toast } from "sonner";
import { useQrScanner } from "@/hooks/useQrScanner";
import type { ChemicalTransactionBlock, ChemicalInventory } from "@/types/chemical";
import { TransactionBlockDetailPanel } from "./TransactionBlockDetailPanel";
import { Pagination } from "@/components/ui/pagination";
import { InventoryEditModal } from "./InventoryEditModal";
import { PrintLabelModal } from "./PrintLabelModal";
import { AllocateStockModal } from "./AllocateStockModal";
import { ApproveTransactionBlockModal } from "./ApproveTransactionBlockModal";
import { TableFilterPopover } from "./TableFilterPopover";
import { SearchSelectPicker, type PickerItem } from "@/components/shared/SearchSelectPicker";
import { searchDocuments } from "@/api/documents";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";
import { ChemicalTransactionBlockReportEditor } from "./ChemicalTransactionBlockReportEditor";

// --- Helper ---
const generateId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

function BlockStatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const BLOCK_STATUS_MAP: Record<string, { label: string; cls: string }> = {
        DRAFT: { label: t("inventory.chemical.transactionBlocks.statusLabels.DRAFT", { defaultValue: "Nháp" }), cls: "bg-muted text-muted-foreground" },
        PENDING_APPROVAL: {
            label: t("inventory.chemical.transactionBlocks.statusLabels.PENDING_APPROVAL", { defaultValue: "Chờ duyệt" }),
            cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        },
        APPROVED: { label: t("inventory.chemical.transactionBlocks.statusLabels.APPROVED", { defaultValue: "Đã duyệt" }), cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        REJECTED: { label: t("inventory.chemical.transactionBlocks.statusLabels.REJECTED", { defaultValue: "Từ chối" }), cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    };
    const s = status ? BLOCK_STATUS_MAP[status] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

function BlockBadge({ type }: { type?: string | null }) {
    const { t } = useTranslation();
    const BLOCK_TYPE_MAP: Record<string, { label: string; cls: string }> = {
        IMPORT: { label: t("inventory.chemical.transactionBlocks.types.INBOUND", { defaultValue: "Nhập kho" }), cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        EXPORT: { label: t("inventory.chemical.transactionBlocks.types.OUTBOUND", { defaultValue: "Xuất kho" }), cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
        ADJUSTMENT: { label: t("inventory.chemical.transactionBlocks.types.ADJUSTMENT", { defaultValue: "Điều chỉnh" }), cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
        LAB_CONSUMPTION: {
            label: t("inventory.chemical.transactionBlocks.types.LAB_CONSUMPTION", { defaultValue: "Nhật ký sử dụng PTN" }),
            cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        },
        PREPARATION: {
            label: t("inventory.chemical.transactionBlocks.types.PREPARATION", { defaultValue: "Sổ pha hóa chất" }),
            cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        },
    };
    const s = type ? BLOCK_TYPE_MAP[type] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{type ?? "-"}</Badge>;
}

// --- Inventory Picker Modal ---
type InventoryPickerProps = {
    selectedIds: string[];
    onToggle: (inv: ChemicalInventory) => void;
    onClose: () => void;
};

function InventoryPickerModal({ selectedIds, onToggle, onClose }: InventoryPickerProps) {
    const { t } = useTranslation();
    const [invSearch, setInvSearch] = useState("");
    const { data: invResult, isLoading: invLoading } = useQuery({
        queryKey: chemicalKeys.inventories.list(invSearch || undefined),
        queryFn: async () => {
            const res = await chemicalApi.inventories.list(invSearch ? { query: { search: invSearch } } : undefined);
            if (!res.success && (res as any).statusCode !== 404) throw new Error(res.error?.message || "Error");
            const inner = res.data as any;
            if (Array.isArray(inner)) return inner as ChemicalInventory[];
            if (inner?.data && Array.isArray(inner.data)) return inner.data as ChemicalInventory[];
            return [] as ChemicalInventory[];
        },
    });

    const [createOpen, setCreateOpen] = useState(false);
    const [isScanningPicker, setIsScanningPicker] = useState(false);

    // Global QR scanner: khi quét trong picker, tự động chọn nếu tìm thấy
    useQrScanner(
        async (scannedId) => {
            // Nếu picker đang mở và không phải đang trong một input → tìm và chọn
            const existing = (invResult as ChemicalInventory[] | undefined)?.find((inv) => inv.chemicalInventoryId === scannedId);
            if (existing) {
                onToggle(existing);
                return;
            }
            // Không có trong kết quả hiện tại → fetch trực tiếp
            setIsScanningPicker(true);
            try {
                const res = await chemicalApi.inventories.full({ id: scannedId });
                if (res.success && res.data) {
                    onToggle(res.data as ChemicalInventory);
                } else {
                    toast.error(t("inventory.chemical.inventories.notFound", { defaultValue: "Không tìm thấy mã: {{id}}", id: scannedId }));
                }
            } finally {
                setIsScanningPicker(false);
            }
        },
        { enabled: !createOpen },
    );

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl shadow-2xl border border-border flex flex-col" style={{ width: "50%", height: "70%", minWidth: "700px" }} onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold">{t("inventory.chemical.inventories.selectFromStock", { defaultValue: "Chọn hóa chất từ kho" })}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("inventory.chemical.inventories.selectFromStockDesc", { defaultValue: "Chọn một hoặc nhiều lọ/chai để thêm vào phiếu" })}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-3 border-b border-border flex items-center gap-2">
                    <div className="relative flex-1">
                        {isScanningPicker ? (
                            <div className="flex items-center h-9 px-3 text-sm text-muted-foreground bg-muted rounded-md gap-2">
                                <Scan className="h-4 w-4 animate-pulse text-primary" />
                                {t("common.scanning", { defaultValue: "Đang quét..." })}
                            </div>
                        ) : (
                            <>
                                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t("inventory.chemical.inventories.searchPlaceholder", { defaultValue: "Tìm barcode, mã SKU, số lô..." })}
                                    value={invSearch}
                                    onChange={(e) => setInvSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && invResult && (invResult as any[]).length === 1) {
                                            onToggle((invResult as any[])[0]);
                                            setInvSearch("");
                                        }
                                    }}
                                    className="pl-8"
                                    id="inv-picker-search"
                                />
                            </>
                        )}
                    </div>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(true)} className="shrink-0">
                        <Plus className="h-4 w-4 mr-1" /> {t("common.add", { defaultValue: "Thêm" })} {t("inventory.chemical.tabs.inventories", { defaultValue: "Lọ mới" })}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 border-b border-border">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-8"></th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                                    {t("inventory.chemical.inventories.chemicalInventoryId", { defaultValue: "Barcode / ID" })}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t("inventory.chemical.inventories.chemicalSkuId", { defaultValue: "Mã SKU" })}</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                                    {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Tồn hiện tại" })}
                                </th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">
                                    {t("inventory.chemical.inventories.chemicalInventoryStatus", { defaultValue: "Trạng thái" })}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {invLoading
                                ? Array.from({ length: 4 }).map((_, i) => (
                                      <tr key={i}>
                                          {Array.from({ length: 6 }).map((__, j) => (
                                              <td key={j} className="p-3">
                                                  <Skeleton className="h-4 w-20" />
                                              </td>
                                          ))}
                                      </tr>
                                  ))
                                : (invResult as any[])?.map((inv) => {
                                      const checked = selectedIds.includes(inv.chemicalInventoryId);
                                      return (
                                          <tr
                                              key={inv.chemicalInventoryId}
                                              className={`hover:bg-muted/30 cursor-pointer transition-colors ${checked ? "bg-primary/5" : ""}`}
                                              onClick={() => onToggle(inv)}
                                          >
                                              <td className="px-3 py-2 text-center">
                                                  <input type="checkbox" readOnly checked={checked} className="accent-primary" />
                                              </td>
                                              <td className="px-3 py-2 font-mono text-xs font-medium">{inv.chemicalInventoryId}</td>
                                              <td className="px-3 py-2">{inv.chemicalSkuId ?? "-"}</td>
                                              <td className="px-3 py-2 text-muted-foreground">{inv.lotNumber ?? "-"}</td>
                                              <td className="px-3 py-2 text-right font-medium">{inv.currentAvailableQty ?? 0}</td>
                                              <td className="px-3 py-2 text-center">
                                                  <Badge variant="outline">{inv.chemicalInventoryStatus ?? "-"}</Badge>
                                              </td>
                                          </tr>
                                      );
                                  })}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-border flex items-center justify-between mt-auto shrink-0">
                    <span className="text-sm text-muted-foreground">
                        {t("common.selectedCount", { defaultValue: "Đã chọn" })}: <strong>{selectedIds.length}</strong>
                    </span>
                    <Button type="button" onClick={onClose} size="sm">
                        {t("common.confirm", { defaultValue: "Xác nhận" })}
                    </Button>
                </div>
            </div>

            {/* Create inline */}
            {createOpen && <InventoryEditModal inventory={null} onClose={() => setCreateOpen(false)} />}
        </div>
    );
}

// --- Item Card (for 2-column layout) ---
export type EditLineItem = {
    id: string; // unique string e.g. Math.random().toString()
    inventory: ChemicalInventory;
    changeQty: number;
    totalWeight?: number;
    analysisId: string;
    chemicalTransactionBlockDetailNote: string;
    transactionCoaDocumentIds?: string[];
    usageDate?: string;
    preparationRole?: "PRODUCT" | "MATERIAL";
    /** Per-item performer name (from usageBy on each transaction) */
    usageBy?: string;
    /** Per-item unit (from chemicalTransactionUnit / chemicalTransactionBlockDetailUnit) */
    transactionUnit?: string;
};

type ItemCardProps = {
    item: EditLineItem;
    transactionType: string;
    onUpdate: (field: "changeQty" | "chemicalTransactionBlockDetailNote" | "analysisId" | "totalWeight" | "transactionCoaDocumentIds" | "usageDate", value: any) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onUploadCoa: () => void;
};

function ItemCard({ item, transactionType, onUpdate, onRemove, onDuplicate, onUploadCoa }: ItemCardProps) {
    const { t } = useTranslation();
    const inv = item.inventory;
    const coaCount = item.transactionCoaDocumentIds?.length || 0;

    return (
        <div className="border border-border rounded-lg p-3 bg-background space-y-2 relative group flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{inv.chemicalSkuId ?? "Unknown SKU"}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                        ID: {inv.chemicalInventoryId} | {t("inventory.chemical.inventories.lotNumber", { defaultValue: "Lô" })}: {inv.lotNumber ?? "-"}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                        {t("inventory.dashboard.table.stock", { defaultValue: "Tồn" })}: <strong className="text-foreground">{inv.currentAvailableQty}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={onDuplicate}
                        className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                        title={t("common.duplicate", { defaultValue: "Thêm chỉ tiêu khác" })}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Fields Grid */}
            <div className={`grid gap-2 items-end ${transactionType === "LAB_CONSUMPTION" ? "grid-cols-5" : transactionType === "EXPORT" ? "grid-cols-4" : "grid-cols-3"}`}>
                <div className="space-y-0.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">{t("common.quantity", { defaultValue: "Số lượng" })}</label>
                    <Input
                        type="number"
                        className="h-8 text-xs"
                        placeholder="0"
                        value={item.changeQty ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => onUpdate("changeQty", e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.totalWeight", { defaultValue: "KL GD" })}</label>
                    <Input
                        type="number"
                        step="any"
                        className="h-8 text-xs"
                        placeholder="0"
                        value={item.totalWeight ?? ""}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => onUpdate("totalWeight", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                    />
                </div>
                {(transactionType === "EXPORT" || transactionType === "LAB_CONSUMPTION") && (
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">{t("lab.analyses.parameterId", { defaultValue: "Mã Phép thử" })}</label>
                        <Input
                            className="h-8 text-xs"
                            placeholder={t("inventory.chemical.allocateStock.analysisIdPlaceholder", { defaultValue: "Mã PT..." })}
                            value={item.analysisId || ""}
                            onChange={(e) => onUpdate("analysisId", e.target.value)}
                        />
                    </div>
                )}
                {transactionType === "LAB_CONSUMPTION" && (
                    <div className="space-y-0.5">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">{t("inventory.chemical.transactions.usageDate", { defaultValue: "Ngày sử dụng" })}</label>
                        <Input type="date" className="h-8 text-xs" value={item.usageDate || ""} onChange={(e) => onUpdate("usageDate", e.target.value)} />
                    </div>
                )}
                <div className="space-y-0.5">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase">{t("common.note", { defaultValue: "Ghi chú" })}</label>
                    <Input
                        className="h-8 text-xs"
                        placeholder={t("common.note", { defaultValue: "Ghi chú..." })}
                        value={item.chemicalTransactionBlockDetailNote || ""}
                        onChange={(e) => onUpdate("chemicalTransactionBlockDetailNote", e.target.value)}
                    />
                </div>
            </div>

            {/* COA Upload for Import Case */}
            {transactionType === "IMPORT" && (
                <div className="pt-2 border-t border-dashed border-border flex items-center justify-between">
                    <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{t("inventory.chemical.transactionBlocks.coaDocs", { defaultValue: "Tài liệu COA" })}</span>
                        {coaCount > 0 && (
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] rounded-sm bg-primary/10 text-primary border-none">
                                {coaCount} {t("common.file", { defaultValue: "file" })}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {coaCount > 0 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onUpdate("transactionCoaDocumentIds", [])}
                                className="h-6 px-2 text-[9px] text-destructive hover:bg-destructive/10"
                            >
                                {t("common.clear", { defaultValue: "Xóa" })}
                            </Button>
                        )}
                        <Button type="button" variant="secondary" size="sm" onClick={onUploadCoa} className="h-6 px-2 text-[9px] flex items-center gap-1">
                            <Upload className="h-2.5 w-2.5" />
                            {coaCount > 0 ? t("common.add", { defaultValue: "Thêm" }) : t("common.upload", { defaultValue: "Tải COA" })}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Create Block Modal (80% w, 90% h, 2-col ≥1536px) ---
type CreateBlockModalProps = {
    onClose: () => void;
    initialType?: "IMPORT" | "EXPORT" | "ADJUSTMENT" | "LAB_CONSUMPTION" | "PREPARATION";
    initialItems?: ChemicalInventory[];
    initialTxnData?: Record<string, { changeQty: number; chemicalTransactionBlockDetailNote: string; analysisId?: string; totalWeight?: number; usageDate?: string }>;
    initialRef?: string;
    initialPreparedBy?: { identityId: string; identityName: string };
};

function CreateBlockModal({ onClose, initialType, initialItems, initialTxnData, initialRef, initialPreparedBy }: CreateBlockModalProps) {
    const { t } = useTranslation();
    const [transactionType, setTransactionType] = useState<"IMPORT" | "EXPORT" | "ADJUSTMENT" | "LAB_CONSUMPTION" | "PREPARATION">(initialType ?? "EXPORT");
    const [referenceDocument, setReferenceDocument] = useState(initialRef ?? "");
    const [viewMode, setViewMode] = useState<"DETAILS" | "SUMMARY">("DETAILS");

    // Performer (usedById) for ADJUSTMENT / LAB_CONSUMPTION
    const { data: technicians } = useChemicalTechnicians();
    const [usedById, setUsedById] = useState<string>(initialPreparedBy?.identityId ?? "");
    const [selectedPerformer, setSelectedPerformer] = useState<{ id: string; label: string }[]>(() => {
        if (initialPreparedBy?.identityId) {
            return [{ id: initialPreparedBy.identityId, label: initialPreparedBy.identityName || initialPreparedBy.identityId }];
        }
        return [];
    });

    const [coaDocumentIds, setCoaDocumentIds] = useState<string[]>([]);
    const [selectedCoaDocs, setSelectedCoaDocs] = useState<PickerItem[]>([]);
    const [uploadCoaOpen, setUploadCoaOpen] = useState(false);

    const [invoiceDocumentIds, setInvoiceDocumentIds] = useState<string[]>([]);
    const [selectedInvoiceDocs, setSelectedInvoiceDocs] = useState<PickerItem[]>([]);
    const [uploadInvoiceOpen, setUploadInvoiceOpen] = useState(false);

    const [lineItems, setLineItems] = useState<EditLineItem[]>(() => {
        if (initialItems && initialItems.length > 0) {
            return initialItems.map((inv, index) => ({
                id: generateId(),
                inventory: inv,
                changeQty: initialTxnData?.[inv.chemicalInventoryId]?.changeQty ?? 0,
                totalWeight: initialTxnData?.[inv.chemicalInventoryId]?.totalWeight ?? undefined,
                analysisId: initialTxnData?.[inv.chemicalInventoryId]?.analysisId ?? "",
                chemicalTransactionBlockDetailNote: initialTxnData?.[inv.chemicalInventoryId]?.chemicalTransactionBlockDetailNote ?? "",
                usageDate: initialTxnData?.[inv.chemicalInventoryId]?.usageDate ?? new Date().toISOString().split("T")[0],
                preparationRole: transactionType === "PREPARATION" ? (index === initialItems.length - 1 ? "PRODUCT" : "MATERIAL") : undefined,
            }));
        }
        return [];
    });

    const [pickerOpen, setPickerOpen] = useState(false);
    const [printLabelOpen, setPrintLabelOpen] = useState(false);
    const [logReportOpen, setLogReportOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Individual item COA upload
    const [uploadingCoaItemId, setUploadingCoaItemId] = useState<string | null>(null);

    const summaryItems = useMemo(() => {
        const map = new Map<string, { inventory: ChemicalInventory; totalQty: number; analyses: Set<string> }>();
        lineItems.forEach((item) => {
            const key = item.inventory.chemicalInventoryId;
            if (!map.has(key)) {
                map.set(key, { inventory: item.inventory, totalQty: 0, analyses: new Set() });
            }
            const data = map.get(key)!;
            data.totalQty += item.changeQty || 0;
            if (item.analysisId) data.analyses.add(item.analysisId);
        });
        return Array.from(map.values());
    }, [lineItems]);

    const handleQrScan = useCallback(
        async (scannedId: string) => {
            setIsScanning(true);
            try {
                const res = await chemicalApi.inventories.full({ id: scannedId });
                if (res.success && res.data) {
                    const inv = res.data as ChemicalInventory;
                    setLineItems((prev) => [
                        ...prev,
                        {
                            id: generateId(),
                            inventory: inv,
                            changeQty: 0,
                            totalWeight: undefined,
                            analysisId: "",
                            chemicalTransactionBlockDetailNote: "",
                            usageDate: new Date().toISOString().split("T")[0],
                            preparationRole: transactionType === "PREPARATION" ? "MATERIAL" : undefined,
                        },
                    ]);
                    toast.success(t("inventory.chemical.inventories.addedByScan", { defaultValue: "Đã thêm: {{id}}", id: scannedId }));
                } else {
                    toast.error(t("inventory.chemical.inventories.notFound", { defaultValue: "Không tìm thấy mã: {{id}}", id: scannedId }));
                }
            } catch {
                toast.error(t("common.error", { defaultValue: "Có lỗi xảy ra" }));
            } finally {
                setIsScanning(false);
            }
        },
        [t],
    );

    // Global QR scanner – kích hoạt khi modal đang mở và picker chưa mở
    useQrScanner(handleQrScan, { enabled: !pickerOpen && !printLabelOpen });

    const createMutation = useChemicalCreateTransactionBlock();

    const BLOCK_TYPE_MAP: Record<string, { label: string; cls: string }> = {
        IMPORT: {
            label: t("inventory.chemical.transactionBlocks.types.INBOUND", { defaultValue: "Nhập kho" }),
            cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        },
        EXPORT: {
            label: t("inventory.chemical.transactionBlocks.types.OUTBOUND", { defaultValue: "Xuất kho" }),
            cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        },
        ADJUSTMENT: {
            label: t("inventory.chemical.transactionBlocks.types.ADJUSTMENT", { defaultValue: "Điều chỉnh" }),
            cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        },
        PREPARATION: {
            label: t("inventory.chemical.transactionBlocks.types.PREPARATION", { defaultValue: "Nhật ký pha hóa chất" }),
            cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        },
        LAB_CONSUMPTION: {
            label: t("inventory.chemical.transactionBlocks.types.LAB_CONSUMPTION", { defaultValue: "Nhật ký sử dụng PTN" }),
            cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        },
    };

    const toggleInventory = (inv: ChemicalInventory) => {
        setLineItems((prev) => {
            const exists = prev.some((p) => p.inventory.chemicalInventoryId === inv.chemicalInventoryId);
            if (exists) {
                return prev.filter((p) => p.inventory.chemicalInventoryId !== inv.chemicalInventoryId);
            }
            return [
                ...prev,
                {
                    id: generateId(),
                    inventory: inv,
                    changeQty: 0,
                    totalWeight: undefined,
                    analysisId: "",
                    chemicalTransactionBlockDetailNote: "",
                    usageDate: new Date().toISOString().split("T")[0],
                    preparationRole: transactionType === "PREPARATION" ? "MATERIAL" : undefined,
                },
            ];
        });
    };

    const duplicateItem = (sourceId: string) => {
        setLineItems((prev) => {
            const idx = prev.findIndex((p) => p.id === sourceId);
            if (idx === -1) return prev;
            const item = prev[idx];
            const newArr = [...prev];
            newArr.splice(idx + 1, 0, {
                ...item,
                id: generateId(),
                analysisId: "", // Reset analysis for the clone
            });
            return newArr;
        });
    };

    const removeLineItem = (id: string) => setLineItems((prev) => prev.filter((p) => p.id !== id));

    const updateLineItem = (id: string, field: keyof Omit<EditLineItem, "id" | "inventory">, value: any) => {
        setLineItems((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    };

    const handleSubmit = async () => {
        const payload = {
            chemicalTransactionBlock: {
                transactionType,
                referenceDocument,
                chemicalBlockCoaDocumentIds: coaDocumentIds.length > 0 ? coaDocumentIds : undefined,
                chemicalBlockInvoiceDocumentIds: invoiceDocumentIds.length > 0 ? invoiceDocumentIds : undefined,
                usedById: (transactionType === "ADJUSTMENT" || transactionType === "LAB_CONSUMPTION" || transactionType === "PREPARATION") && usedById ? usedById : undefined,
                usageBy: (transactionType === "ADJUSTMENT" || transactionType === "LAB_CONSUMPTION" || transactionType === "PREPARATION") && usedById && selectedPerformer[0]?.label ? selectedPerformer[0].label : undefined,
            },
            chemicalTransactions: lineItems.map((item) => {
                const inv = item.inventory;
                // Ưu tiên snapshot trên inventory, fallback sang nested chemicalSku
                const chemicalName = inv.chemicalName || (inv as any).chemicalSku?.chemicalName || "";
                const casNumber = inv.chemicalCasNumber || (inv as any).chemicalSku?.chemicalCasNumber || (inv as any).chemicalSku?.chemicalCASNumber || "";
                const unit = (inv as any).chemicalBaseUnit || (inv as any).unit || (inv as any).chemicalSku?.chemicalBaseUnit || (inv as any).chemicalSku?.unit || "";
                return {
                    chemicalInventoryId: inv.chemicalInventoryId,
                    chemicalSkuId: inv.chemicalSkuId,
                    chemicalName,
                    casNumber,
                    lotNumber: inv.lotNumber || "",
                    changeQty:
                        transactionType === "EXPORT" || transactionType === "LAB_CONSUMPTION"
                            ? -Math.abs(item.changeQty || 0)
                            : transactionType === "IMPORT"
                              ? Math.abs(item.changeQty || 0)
                              : item.changeQty || 0,
                    totalWeight: item.totalWeight ? Number(item.totalWeight) : undefined,
                    chemicalTransactionNote: item.chemicalTransactionBlockDetailNote || "",
                    chemicalTransactionBlockDetailNote: item.chemicalTransactionBlockDetailNote || "",
                    analysisId: item.analysisId || "",
                    usageDate: transactionType === "LAB_CONSUMPTION" ? item.usageDate : undefined,
                    chemicalTransactionUnit: unit,
                    chemicalTransactionBlockDetailUnit: unit,
                    transactionType: transactionType,
                    transactionCoaDocumentIds: item.transactionCoaDocumentIds,
                    usedById: (transactionType === "ADJUSTMENT" || transactionType === "LAB_CONSUMPTION" || transactionType === "PREPARATION") && usedById ? usedById : undefined,
                    usageBy: (transactionType === "ADJUSTMENT" || transactionType === "LAB_CONSUMPTION" || transactionType === "PREPARATION") && usedById && selectedPerformer[0]?.label ? selectedPerformer[0].label : undefined,
                };
            }),
        };

        createMutation.mutate(
            { body: payload as any },
            {
                onSuccess: () => {
                    if (transactionType === "IMPORT" && lineItems.length > 0) {
                        // Auto-open print label after import
                        setPrintLabelOpen(true);
                    } else {
                        onClose();
                    }
                },
            },
        );
    };

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
                <div
                    className="bg-background rounded-xl shadow-2xl border border-border flex flex-col"
                    style={{ width: "80%", height: "90%", maxWidth: "1600px" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                        <div>
                            <h3 className="text-base font-semibold">{t("inventory.chemical.transactionBlocks.create", { defaultValue: "Tạo phiếu Xuất/Nhập Kho" })}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {t("inventory.chemical.transactionBlocks.createDesc", { defaultValue: "Chọn loại phiếu và điền số lượng tương ứng" })}
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        {/* Type + Reference */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{t("inventory.chemical.transactionBlocks.type", { defaultValue: "Loại phiếu" })}</label>
                                <div className="flex gap-2">
                                    {(["IMPORT", "EXPORT", "ADJUSTMENT", "LAB_CONSUMPTION", "PREPARATION"] as const).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setTransactionType(type)}
                                            className={`px-4 py-1.5 text-sm rounded-full border transition-colors ${
                                                transactionType === type ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                                            }`}
                                        >
                                            {BLOCK_TYPE_MAP[type]?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium" htmlFor="ref-doc">
                                    {t("inventory.chemical.transactionBlocks.referenceCode", { defaultValue: "Số chứng từ tham chiếu" })}
                                </label>
                                <div className="relative">
                                    <Input
                                        id="ref-doc"
                                        placeholder={t("inventory.chemical.transactionBlocks.referenceCodePlaceholder", { defaultValue: "VD: PO-2024-001, REQUEST-002..." })}
                                        value={referenceDocument}
                                        onChange={(e) => setReferenceDocument(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Performer field for ADJUSTMENT / LAB_CONSUMPTION / PREPARATION */}
                        {(transactionType === "ADJUSTMENT" || transactionType === "LAB_CONSUMPTION" || transactionType === "PREPARATION") && (
                            <div className="border border-border/60 bg-muted/20 rounded-lg p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                                        <User className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        {transactionType === "PREPARATION" ? "Người pha chế (không bắt buộc)" : t("inventory.chemical.transactionBlocks.performer", { defaultValue: "Người thực hiện (không bắt buộc)" })}
                                    </label>
                                </div>
                                <SearchSelectPicker
                                    label={t("inventory.chemical.transactionBlocks.performer", { defaultValue: "Người thực hiện" })}
                                    selected={selectedPerformer as any}
                                    onChange={(items) => {
                                        const first = items[0];
                                        setSelectedPerformer(items as any);
                                        setUsedById(first?.id || "");
                                    }}
                                    onSearch={async (q) => {
                                        if (!technicians) return [];
                                        return technicians
                                            .filter(t => t.identityName.toLowerCase().includes(q.toLowerCase()) || t.identityId.toLowerCase().includes(q.toLowerCase()))
                                            .map(t => ({ id: t.identityId, label: t.identityName, sublabel: t.identityId }));
                                    }}
                                    placeholder={t("inventory.chemical.transactionBlocks.searchPerformer", { defaultValue: "Tìm tên hoặc mã nhân viên..." })}
                                    maxItems={1}
                                />
                            </div>
                        )}

                        {/* Documents Section */}
                        <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {t("inventory.chemical.transactionBlocks.coaDocs", { defaultValue: "Tài liệu COA" })}
                                    </label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setUploadCoaOpen(true)} className="h-7 text-[10px]">
                                        <Upload className="h-3 w-3 mr-1" /> {t("common.upload", { defaultValue: "Tải lên" })}
                                    </Button>
                                </div>
                                <SearchSelectPicker
                                    label={t("inventory.chemical.transactionBlocks.coaDocs", { defaultValue: "Tài liệu COA" })}
                                    selected={selectedCoaDocs}
                                    onChange={(items) => {
                                        setSelectedCoaDocs(items);
                                        setCoaDocumentIds(items.map((i) => i.id));
                                    }}
                                    onSearch={async (q) => {
                                        const res = await searchDocuments(q, "CHEMICAL_COA");
                                        return res.map((d) => ({ id: d.documentId, label: d.documentTitle || d.documentId, sublabel: d.documentId }));
                                    }}
                                    placeholder={t("inventory.chemical.transactionBlocks.searchDoc", { defaultValue: "Tìm tài liệu trong hệ thống..." })}
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center gap-1.5 text-foreground">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        {t("inventory.chemical.transactionBlocks.invoiceDocs", { defaultValue: "Hóa đơn / Chứng từ" })}
                                    </label>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setUploadInvoiceOpen(true)} className="h-7 text-[10px]">
                                        <Upload className="h-3 w-3 mr-1" /> {t("common.upload", { defaultValue: "Tải lên" })}
                                    </Button>
                                </div>
                                <SearchSelectPicker
                                    label={t("inventory.chemical.transactionBlocks.invoiceDocs", { defaultValue: "Hóa đơn / Chứng từ" })}
                                    selected={selectedInvoiceDocs}
                                    onChange={(items) => {
                                        setSelectedInvoiceDocs(items);
                                        setInvoiceDocumentIds(items.map((i) => i.id));
                                    }}
                                    onSearch={async (q) => {
                                        const res = await searchDocuments(q, "CHEMICAL_INVOICE");
                                        return res.map((d) => ({ id: d.documentId, label: d.documentTitle || d.documentId, sublabel: d.documentId }));
                                    }}
                                    placeholder={t("inventory.chemical.transactionBlocks.searchDoc", { defaultValue: "Tìm tài liệu trong hệ thống..." })}
                                />
                            </div>
                        </div>

                        {/* Item list */}
                        <div className="space-y-3 pt-3 border-t border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium flex items-center gap-1.5">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        {t("common.list", { defaultValue: "Danh sách" })}{" "}
                                        {transactionType === "EXPORT"
                                            ? t("inventory.chemical.transactionBlocks.types.OUTBOUND", { defaultValue: "xuất" })
                                            : transactionType === "LAB_CONSUMPTION"
                                              ? t("inventory.chemical.transactionBlocks.types.LAB_CONSUMPTION", { defaultValue: "nhật ký" })
                                              : transactionType === "IMPORT"
                                                ? t("inventory.chemical.transactionBlocks.types.INBOUND", { defaultValue: "nhập" })
                                                : t("inventory.chemical.transactionBlocks.types.ADJUSTMENT", { defaultValue: "điều chỉnh" })}
                                        <Badge variant="secondary" className="ml-1 rounded-full">
                                            {lineItems.length}
                                        </Badge>
                                    </label>

                                    <div className="flex items-center bg-muted p-0.5 rounded-md">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("DETAILS")}
                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === "DETAILS" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            {t("common.details", { defaultValue: "Chi tiết" })}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode("SUMMARY")}
                                            className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === "SUMMARY" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            {t("common.summary", { defaultValue: "Tổng hợp" })}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* QR scan indicator - no input needed, scanner works globally */}
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
                                    <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                                        <Plus className="h-4 w-4 mr-1" /> {t("inventory.chemical.inventories.selectFromStock", { defaultValue: "Chọn từ kho" })}
                                    </Button>
                                </div>
                            </div>

                            {lineItems.length > 0 ? (
                                viewMode === "DETAILS" ? (
                                    transactionType === "PREPARATION" ? (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-orange-600 flex items-center gap-2">
                                                    <FlaskConical className="h-4 w-4" />
                                                    Hóa chất được pha (Thành phẩm)
                                                </h4>
                                                <div className={`grid gap-4 ${lineItems.filter(item => item.preparationRole === "PRODUCT").length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                                                    {lineItems.filter(item => item.preparationRole === "PRODUCT").map((item) => (
                                                        <ItemCard
                                                            key={item.id}
                                                            item={item}
                                                            transactionType={transactionType}
                                                            onUpdate={(field, value) => updateLineItem(item.id, field, value)}
                                                            onRemove={() => removeLineItem(item.id)}
                                                            onDuplicate={() => duplicateItem(item.id)}
                                                            onUploadCoa={() => setUploadingCoaItemId(item.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                                                    <Beaker className="h-4 w-4" />
                                                    Hóa chất dùng để pha (Nguyên liệu)
                                                </h4>
                                                <div className={`grid gap-4 ${lineItems.filter(item => item.preparationRole !== "PRODUCT").length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                                                    {lineItems.filter(item => item.preparationRole !== "PRODUCT").map((item) => (
                                                        <ItemCard
                                                            key={item.id}
                                                            item={item}
                                                            transactionType={transactionType}
                                                            onUpdate={(field, value) => updateLineItem(item.id, field, value)}
                                                            onRemove={() => removeLineItem(item.id)}
                                                            onDuplicate={() => duplicateItem(item.id)}
                                                            onUploadCoa={() => setUploadingCoaItemId(item.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`grid gap-4 ${lineItems.length > 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                                            {lineItems.map((item) => (
                                                <ItemCard
                                                    key={item.id}
                                                    item={item}
                                                    transactionType={transactionType}
                                                    onUpdate={(field, value) => updateLineItem(item.id, field, value)}
                                                    onRemove={() => removeLineItem(item.id)}
                                                    onDuplicate={() => duplicateItem(item.id)}
                                                    onUploadCoa={() => setUploadingCoaItemId(item.id)}
                                                />
                                            ))}
                                        </div>
                                    )
                                ) : (
                                    <div className="border border-border rounded-lg overflow-hidden max-h-[calc(100vh-380px)] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted text-xs text-muted-foreground uppercase sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-2 font-medium text-left">Chai/Lọ (ID)</th>
                                                    <th className="px-4 py-2 font-medium text-left">SKU</th>
                                                    <th className="px-4 py-2 font-medium text-left">Lô</th>
                                                    <th className="px-4 py-2 font-medium text-left">Các Chỉ Tiêu (Analyses)</th>
                                                    <th className="px-4 py-2 font-medium text-right">Tổng Giao Dịch</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-background">
                                                {summaryItems.map((sum) => (
                                                    <tr key={sum.inventory.chemicalInventoryId} className="hover:bg-muted/50">
                                                        <td className="px-4 py-2 font-mono text-xs">{sum.inventory.chemicalInventoryId}</td>
                                                        <td className="px-4 py-2">{sum.inventory.chemicalSkuId || "-"}</td>
                                                        <td className="px-4 py-2">{sum.inventory.lotNumber || "-"}</td>
                                                        <td className="px-4 py-2 max-w-[200px] truncate" title={Array.from(sum.analyses).join(", ")}>
                                                            {sum.analyses.size > 0 ? Array.from(sum.analyses).join(", ") : "-"}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-medium text-primary">{transactionType === "EXPORT" ? -Math.abs(sum.totalQty) : sum.totalQty}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            ) : (
                                <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm bg-muted/20">
                                    {t("inventory.chemical.transactionBlocks.emptyItems", { defaultValue: 'Chưa có hóa chất nào được chọn. Nhấn "Chọn hóa chất từ kho" để bắt đầu.' })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 border-t border-border flex items-center justify-between shrink-0">
                        <div className="text-xs text-muted-foreground">
                            {lineItems.length > 0 && t("common.itemsSelectedCount", { count: lineItems.length, defaultValue: `${lineItems.length} mục đã chọn` })}
                        </div>
                        <div className="flex gap-2">
                            {transactionType === "IMPORT" && lineItems.length > 0 && (
                                <Button type="button" variant="outline" onClick={() => setPrintLabelOpen(true)}>
                                    <Printer className="h-4 w-4 mr-2" /> {t("inventory.chemical.transactionBlocks.printLabel", { defaultValue: "In Tem" })}
                                </Button>
                            )}
                            {lineItems.length > 0 && (
                                <Button type="button" variant="outline" onClick={() => setLogReportOpen(true)}>
                                    <FileText className="h-4 w-4 mr-2" /> In Sổ Nhật Ký
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={onClose}>
                                {t("common.cancel", { defaultValue: "Hủy" })}
                            </Button>
                            <Button type="button" onClick={handleSubmit} disabled={lineItems.length === 0 || createMutation.isPending}>
                                {createMutation.isPending
                                    ? t("common.processing", { defaultValue: "Đang xử lý..." })
                                    : t("inventory.chemical.transactionBlocks.createAndSubmit", { defaultValue: "Tạo phiếu & Giao dịch" })}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {pickerOpen && (
                <InventoryPickerModal selectedIds={Array.from(new Set(lineItems.map((i) => i.inventory.chemicalInventoryId)))} onToggle={toggleInventory} onClose={() => setPickerOpen(false)} />
            )}

            {printLabelOpen && (
                <PrintLabelModal
                    items={summaryItems.map((sum) => ({
                        chemicalInventoryId: sum.inventory.chemicalInventoryId,
                        chemicalSkuId: sum.inventory.chemicalSkuId,
                        chemicalName: (sum.inventory as any).chemicalSku?.chemicalName,
                        chemicalCASNumber: (sum.inventory as any).chemicalSku?.chemicalCASNumber,
                        lotNumber: sum.inventory.lotNumber,
                        manufacturerName: sum.inventory.manufacturerName,
                        expDate: sum.inventory.expDate,
                        qty: 1, // mặc định 1 tem mỗi mã
                    }))}
                    onClose={() => {
                        setPrintLabelOpen(false);
                        onClose();
                    }}
                />
            )}

            {logReportOpen && (
                <ChemicalTransactionBlockReportEditor
                    open={logReportOpen}
                    onOpenChange={setLogReportOpen}
                    lineItems={lineItems}
                    transactionType={transactionType}
                    usedBy={selectedPerformer[0]?.label || ""}
                    referenceDocument={referenceDocument}
                />
            )}

            <DocumentUploadModal
                open={uploadCoaOpen}
                onClose={() => setUploadCoaOpen(false)}
                fixedDocumentType="CHEMICAL_COA"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        const newId = doc.documentId;
                        const newItem = { id: newId, label: doc.documentTitle || newId, sublabel: newId };
                        setCoaDocumentIds((prev) => [...prev, newId]);
                        setSelectedCoaDocs((prev) => [...prev, newItem]);
                    }
                }}
            />

            <DocumentUploadModal
                open={Boolean(uploadingCoaItemId)}
                onClose={() => setUploadingCoaItemId(null)}
                fixedDocumentType="CHEMICAL_COA"
                onSuccess={(doc) => {
                    if (doc?.documentId && uploadingCoaItemId) {
                        const currentItem = lineItems.find((i) => i.id === uploadingCoaItemId);
                        const existingIds = currentItem?.transactionCoaDocumentIds || [];
                        updateLineItem(uploadingCoaItemId, "transactionCoaDocumentIds", [...existingIds, doc.documentId]);
                        setUploadingCoaItemId(null);
                    }
                }}
            />

            <DocumentUploadModal
                open={uploadInvoiceOpen}
                onClose={() => setUploadInvoiceOpen(false)}
                fixedDocumentType="CHEMICAL_INVOICE"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        const newId = doc.documentId;
                        const newItem = { id: newId, label: doc.documentTitle || newId, sublabel: newId };
                        setInvoiceDocumentIds((prev) => [...prev, newId]);
                        setSelectedInvoiceDocs((prev) => [...prev, newItem]);
                    }
                }}
            />
        </>
    );
}

// Export for reuse (e.g., from AuditBlocksTab)
export { CreateBlockModal };

// --- Main Tab ---
export function TransactionBlocksTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeBlock, setActiveBlock] = useState<ChemicalTransactionBlock | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [allocateOpen, setAllocateOpen] = useState(false);
    const [approveOpenId, setApproveOpenId] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [filters, setFilters] = useState<{
        transactionType: string[];
        chemicalTransactionBlockStatus: string[];
    }>({ transactionType: [], chemicalTransactionBlockStatus: [] });

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalTransactionBlocksList({
        query: {
            search: submittedSearch,
            page,
            itemsPerPage,
            sortColumn: "createdAt",
            sortDirection: "DESC",
            ...filters,
        },
    });

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

    const handleApproveClick = (id: string) => {
        setApproveOpenId(id);
    };

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || "Failed to load"}</div>;
    }

    return (
        <>
            <div className="h-full flex flex-col space-y-3 min-w-0 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="block-search"
                                placeholder={t("inventory.chemical.transactionBlocks.searchPlaceholder", { defaultValue: "Tìm mã phiếu, chứng từ..." })}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSearch}>
                            {t("common.search", { defaultValue: "Tìm kiếm" })}
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t("inventory.chemical.transactionBlocks.create", { defaultValue: "Tạo phiếu mới" })}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setAllocateOpen(true)}>
                            <Package className="h-4 w-4 mr-2" />
                            {t("inventory.chemical.transactionBlocks.allocate", { defaultValue: "Cấp phát tự động (FEFO)" })}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => refetch()} title="Tải lại">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>

                {/* Main Content Area: Detail Panel + Table */}
                <div className="flex-1 min-h-0 flex flex-row gap-4 relative">
                    {/* Table */}
                    <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                        <div className="overflow-x-auto relative h-full flex-1">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                            {String(t("inventory.chemical.transactionBlocks.blockId", { defaultValue: "Mã Phiếu" }))}
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                            <TableFilterPopover
                                                title={String(t("inventory.chemical.transactionBlocks.type", { defaultValue: "Loại phiếu" }))}
                                                type="enum"
                                                value={filters.transactionType}
                                                options={[
                                                    { label: t("inventory.chemical.transactionBlocks.types.INBOUND", { defaultValue: "Nhập kho" }), value: "IMPORT" },
                                                    { label: t("inventory.chemical.transactionBlocks.types.OUTBOUND", { defaultValue: "Xuất kho" }), value: "EXPORT" },
                                                    { label: t("inventory.chemical.transactionBlocks.types.ADJUSTMENT", { defaultValue: "Điều chỉnh" }), value: "ADJUSTMENT" },
                                                    { label: t("inventory.chemical.transactionBlocks.types.LAB_CONSUMPTION", { defaultValue: "Nhật ký sử dụng PTN" }), value: "LAB_CONSUMPTION" },
                                                    { label: t("inventory.chemical.transactionBlocks.types.PREPARATION", { defaultValue: "Sổ pha hóa chất" }), value: "PREPARATION" },
                                                ]}
                                                onChange={(v) => {
                                                    setFilters((f) => ({ ...f, transactionType: v }));
                                                    setPage(1);
                                                }}
                                            />
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap text-center">
                                            <TableFilterPopover
                                                title={String(t("inventory.chemical.transactionBlocks.status", { defaultValue: "Trạng thái" }))}
                                                type="enum"
                                                value={filters.chemicalTransactionBlockStatus}
                                                options={[
                                                    { label: "Nháp", value: "DRAFT" },
                                                    { label: "Chờ duyệt", value: "PENDING_APPROVAL" },
                                                    { label: "Đã duyệt", value: "APPROVED" },
                                                    { label: "Từ chối", value: "REJECTED" },
                                                ]}
                                                onChange={(v) => {
                                                    setFilters((f) => ({ ...f, chemicalTransactionBlockStatus: v }));
                                                    setPage(1);
                                                }}
                                            />
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                            {String(t("common.createdAt", { defaultValue: "Ngày tạo" }))}
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                            {String(t("common.createdBy", { defaultValue: "Người tạo" }))}
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                            {String(t("inventory.chemical.transactionBlocks.referenceCode", { defaultValue: "Chứng từ" }))}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 6 }).map((__, j) => (
                                                    <td key={j} className="p-3">
                                                        <Skeleton className="h-4 w-20" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : (result?.data as any[])?.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                                {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                            </td>
                                        </tr>
                                    ) : (
                                        (result?.data as any[])?.map((block: any) => (
                                            <tr
                                                key={block.chemicalTransactionBlockId}
                                                className={`hover:bg-muted/30 cursor-pointer transition-colors ${activeBlock?.chemicalTransactionBlockId === block.chemicalTransactionBlockId ? "bg-muted" : ""}`}
                                                onClick={() => setActiveBlock(block)}
                                            >
                                                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{block.chemicalTransactionBlockId}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <BlockBadge type={block.transactionType} />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                                    <BlockStatusBadge status={block.chemicalTransactionBlockStatus} />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{block.createdAt ? new Date(block.createdAt).toLocaleString("vi-VN") : "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{block.createdBy ?? block.createdById ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{block.referenceDocument ?? "-"}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {result?.pagination && (
                            <Pagination
                                currentPage={page}
                                totalPages={result.pagination.totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={result.pagination.totalItems ?? result.pagination.total}
                                onPageChange={(p) => setPage(p)}
                                onItemsPerPageChange={(iper) => {
                                    setItemsPerPage(iper);
                                    setPage(1);
                                }}
                            />
                        )}
                    </div>

                    {/* Right Detail Panel */}
                    {activeBlock && <TransactionBlockDetailPanel block={activeBlock} onClose={() => setActiveBlock(null)} onApproveClick={handleApproveClick} />}
                </div>
            </div>

            {createOpen && <CreateBlockModal onClose={() => setCreateOpen(false)} />}
            {allocateOpen && <AllocateStockModal onClose={() => setAllocateOpen(false)} />}
            {approveOpenId && (
                <ApproveTransactionBlockModal
                    blockId={approveOpenId}
                    onClose={() => {
                        setApproveOpenId(null);
                        refetch();
                    }}
                />
            )}

            {/* <HelpBubble guidePath="guide-transaction-blocks.html" label="Hướng dẫn: Phiếu Xuất/Nhập Kho" /> */}
        </>
    );
}
