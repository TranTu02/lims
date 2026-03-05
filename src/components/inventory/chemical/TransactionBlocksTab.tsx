import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { chemicalApi, useChemicalCreateTransactionBlock, useChemicalTransactionBlocksList } from "@/api/chemical";
import { chemicalKeys } from "@/api/chemicalKeys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Package } from "lucide-react";
import type { ChemicalTransactionBlock, ChemicalInventory } from "@/types/chemical";
import { TransactionBlockDetailPanel } from "./TransactionBlockDetailPanel";
import { Pagination } from "@/components/ui/pagination";

// --- Helper ---
const BLOCK_TYPE_MAP: Record<string, { label: string; cls: string }> = {
    IMPORT: { label: "Nhập kho", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
    EXPORT: { label: "Xuất kho", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    ADJUSTMENT: { label: "Điều chỉnh", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
};

function BlockBadge({ type }: { type?: string | null }) {
    const s = type ? BLOCK_TYPE_MAP[type] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{type ?? "-"}</Badge>;
}

// --- Import modal ---
type InventoryPickerProps = {
    selectedIds: string[];
    onToggle: (inv: ChemicalInventory) => void;
    onClose: () => void;
};

function InventoryPickerModal({ selectedIds, onToggle, onClose }: InventoryPickerProps) {
    const [invSearch, setInvSearch] = useState("");
    const { data: invResult, isLoading: invLoading } = useQuery({
        queryKey: chemicalKeys.inventories.list(invSearch || undefined),
        queryFn: async () => {
            const res = await chemicalApi.inventories.list(invSearch ? { query: { search: invSearch } } : undefined);
            if (!res.success && (res as any).statusCode !== 404) throw new Error(res.error?.message || "Error");
            // res.data is { data: [...], meta: ... } — extract the inner array
            const inner = res.data as any;
            if (Array.isArray(inner)) return inner as ChemicalInventory[];
            if (inner?.data && Array.isArray(inner.data)) return inner.data as ChemicalInventory[];
            return [] as ChemicalInventory[];
        },
    });

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border w-[680px] max-h-[75vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold">Chọn hóa chất xuất kho</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Chọn một hoặc nhiều lọ/chai để thêm vào phiếu</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-3 border-b border-border">
                    <div className="relative">
                        <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Tìm barcode, mã SKU, số lô..." value={invSearch} onChange={(e) => setInvSearch(e.target.value)} className="pl-8" id="inv-picker-search" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 border-b border-border">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-8"></th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Barcode / ID</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Mã SKU</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Số Lô</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Tồn hiện tại</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">Trạng thái</th>
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
                                                  <Badge variant="outline">{inv.inventoryStatus ?? "-"}</Badge>
                                              </td>
                                          </tr>
                                      );
                                  })}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Đã chọn: <strong>{selectedIds.length}</strong>
                    </span>
                    <Button type="button" onClick={onClose} size="sm">
                        Xác nhận
                    </Button>
                </div>
            </div>
        </div>
    );
}

// --- Create Block Modal ---
type CreateBlockModalProps = { onClose: () => void };

function CreateBlockModal({ onClose }: CreateBlockModalProps) {
    const [transactionType, setTransactionType] = useState<"IMPORT" | "EXPORT" | "ADJUSTMENT">("EXPORT");
    const [referenceDocument, setReferenceDocument] = useState("");
    const [selectedInventories, setSelectedInventories] = useState<ChemicalInventory[]>([]);
    const [txnData, setTxnData] = useState<Record<string, { changeQty: number; note: string; analysisId?: string }>>({});
    const [pickerOpen, setPickerOpen] = useState(false);

    const createMutation = useChemicalCreateTransactionBlock();

    const toggleInventory = (inv: ChemicalInventory) => {
        setSelectedInventories((prev) => {
            const exists = prev.some((p) => p.chemicalInventoryId === inv.chemicalInventoryId);
            if (exists) {
                return prev.filter((p) => p.chemicalInventoryId !== inv.chemicalInventoryId);
            } else {
                return [...prev, inv];
            }
        });
    };

    const removeInventory = (id: string) => {
        setSelectedInventories((prev) => prev.filter((p) => p.chemicalInventoryId !== id));
    };

    const updateTxn = (id: string, field: "changeQty" | "note" | "analysisId", value: any) => {
        setTxnData((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || { changeQty: 0, note: "", analysisId: "" }),
                [field]: value,
            },
        }));
    };

    const handleSubmit = async () => {
        const payload = {
            chemicalTransactionBlock: {
                transactionType,
                referenceDocument,
            },
            chemicalTransactions: selectedInventories.map((inv) => ({
                chemicalInventoryId: inv.chemicalInventoryId,
                chemicalSkuId: inv.chemicalSkuId,
                chemicalName: (inv as any).chemicalSku?.chemicalName || "",
                casNumber: (inv as any).chemicalSku?.chemicalCASNumber || "",
                changeQty:
                    transactionType === "EXPORT"
                        ? -Math.abs(txnData[inv.chemicalInventoryId]?.changeQty || 0)
                        : transactionType === "IMPORT"
                          ? Math.abs(txnData[inv.chemicalInventoryId]?.changeQty || 0)
                          : txnData[inv.chemicalInventoryId]?.changeQty || 0,
                note: txnData[inv.chemicalInventoryId]?.note || "",
                analysisId: txnData[inv.chemicalInventoryId]?.analysisId || "",
                unit: (inv as any).chemicalSku?.chemicalBaseUnit || "",
                actionType: transactionType === "IMPORT" ? "INITIAL_ISSUE" : transactionType === "EXPORT" ? "SUPPLEMENTAL" : "ADJUSTMENT",
            })),
        };

        createMutation.mutate(
            { body: payload as any },
            {
                onSuccess: () => onClose(),
            },
        );
    };

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center" onClick={onClose}>
                <div className="bg-background rounded-xl shadow-2xl border border-border w-[800px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-semibold">Tạo phiếu Xuất/Nhập Kho</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Chọn loại phiếu và điền số lượng tương ứng</p>
                        </div>
                        <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                        {/* Loại phiếu */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Loại phiếu</label>
                                <div className="flex gap-2">
                                    {(["IMPORT", "EXPORT", "ADJUSTMENT"] as const).map((type) => (
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
                                    Số chứng từ tham chiếu
                                </label>
                                <Input id="ref-doc" placeholder="VD: PO-2024-001, REQUEST-002..." value={referenceDocument} onChange={(e) => setReferenceDocument(e.target.value)} />
                            </div>
                        </div>

                        {/* Danh sách chai/lọ */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium flex items-center gap-1.5">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    Danh sách {transactionType === "EXPORT" ? "xuất" : transactionType === "IMPORT" ? "nhập" : "điều chỉnh"}
                                </label>
                                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                                    <Plus className="h-4 w-4 mr-1" /> Chọn hóa chất từ kho
                                </Button>
                            </div>

                            {selectedInventories.length > 0 ? (
                                <div className="border border-border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b border-border">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Hóa chất / Barcode</th>
                                                <th className="px-3 py-2 text-right font-medium text-muted-foreground w-20">Tồn</th>
                                                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-24">Số lượng</th>
                                                {transactionType === "EXPORT" && <th className="px-3 py-2 text-left font-medium text-muted-foreground w-32">Chỉ tiêu xuất</th>}
                                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Ghi chú</th>
                                                <th className="px-3 py-2 text-center w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {selectedInventories.map((inv) => (
                                                <tr key={inv.chemicalInventoryId} className="hover:bg-muted/10 transition-colors">
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium">{inv.chemicalSkuId}</div>
                                                        <div className="text-[10px] font-mono text-muted-foreground">
                                                            ID: {inv.chemicalInventoryId} | Lô: {inv.lotNumber}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-mono">{inv.currentAvailableQty}</td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-sm"
                                                            placeholder="SL"
                                                            value={txnData[inv.chemicalInventoryId]?.changeQty ?? ""}
                                                            onChange={(e) => updateTxn(inv.chemicalInventoryId, "changeQty", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                                        />
                                                    </td>
                                                    {transactionType === "EXPORT" && (
                                                        <td className="px-3 py-2">
                                                            <Input
                                                                className="h-8 text-sm"
                                                                placeholder="Mã phân tích..."
                                                                value={txnData[inv.chemicalInventoryId]?.analysisId || ""}
                                                                onChange={(e) => updateTxn(inv.chemicalInventoryId, "analysisId", e.target.value)}
                                                            />
                                                        </td>
                                                    )}
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            className="h-8 text-sm"
                                                            placeholder="Ghi chú..."
                                                            value={txnData[inv.chemicalInventoryId]?.note || ""}
                                                            onChange={(e) => updateTxn(inv.chemicalInventoryId, "note", e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeInventory(inv.chemicalInventoryId)}
                                                            className="text-muted-foreground hover:text-destructive transition-colors"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm bg-muted/20">Chưa có hóa chất nào được chọn</div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={selectedInventories.length === 0 || createMutation.isPending}>
                            {createMutation.isPending ? "Đang xử lý..." : "Tạo phiếu & Giao dịch"}
                        </Button>
                    </div>
                </div>
            </div>

            {pickerOpen && <InventoryPickerModal selectedIds={selectedInventories.map((i) => i.chemicalInventoryId)} onToggle={toggleInventory} onClose={() => setPickerOpen(false)} />}
        </>
    );
}

// --- Main Tab ---
export function TransactionBlocksTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeBlock, setActiveBlock] = useState<ChemicalTransactionBlock | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const {
        data: result,
        isLoading,
        error,
    } = useChemicalTransactionBlocksList({
        query: {
            search: submittedSearch,
            page,
            itemsPerPage,
            sortColumn: "createdAt",
            sortDirection: "DESC",
        },
    });

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || "Failed to load"}</div>;
    }

    return (
        <>
            <div className="h-full flex gap-4 overflow-hidden">
                <div className="flex flex-col flex-1 space-y-3 min-w-0 overflow-hidden">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="blocks-search"
                                    placeholder="Tìm mã phiếu, tham chiếu..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="pl-8"
                                />
                            </div>
                            <Button variant="outline" size="sm" type="button" onClick={handleSearch}>
                                {String(t("common.search", { defaultValue: "Tìm kiếm" }))}
                            </Button>
                        </div>
                        <Button variant="default" type="button" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo phiếu Xuất/Nhập
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                        <div className="overflow-x-auto relative h-full flex-1">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Mã Phiếu</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Loại phiếu</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Ngày tạo</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Người tạo</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Số chứng từ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                {Array.from({ length: 5 }).map((__, j) => (
                                                    <td key={j} className="p-3">
                                                        <Skeleton className="h-4 w-24" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : result?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                                                {String(t("common.noData", { defaultValue: "Không có dữ liệu" }))}
                                            </td>
                                        </tr>
                                    ) : (
                                        result?.data?.map((block: any) => (
                                            <tr
                                                key={block.chemicalTransactionBlockId}
                                                className={`hover:bg-muted/30 cursor-pointer transition-colors ${activeBlock?.chemicalTransactionBlockId === block.chemicalTransactionBlockId ? "bg-muted" : ""}`}
                                                onClick={() => setActiveBlock(block)}
                                            >
                                                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{block.chemicalTransactionBlockId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <BlockBadge type={block.transactionType} />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{block.createdAt ? new Date(block.createdAt).toLocaleString("vi-VN") : "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{block.createdBy ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{block.referenceDocument ?? "-"}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {result?.pagination && (
                            <Pagination
                                currentPage={page}
                                totalPages={result.pagination.totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={result.pagination.totalItems}
                                onPageChange={(p) => setPage(p)}
                                onItemsPerPageChange={(iper) => {
                                    setItemsPerPage(iper);
                                    setPage(1);
                                }}
                            />
                        )}
                    </div>
                </div>

                {activeBlock && <TransactionBlockDetailPanel block={activeBlock} onClose={() => setActiveBlock(null)} />}
            </div>

            {createOpen && <CreateBlockModal onClose={() => setCreateOpen(false)} />}
        </>
    );
}
