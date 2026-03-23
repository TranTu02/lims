import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, CheckCircle2, Package, RefreshCw, LayoutGrid, List, Database, AlertCircle, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useChemicalTransactionBlockFull, useApproveTransactionBlock, useAllocateStock, chemicalApi, useChemicalTransactionBlockDetailsUpdateBulk } from "@/api/chemical";
import type { ChemicalTransactionBlockDetail, AllocateStockResponse, AllocateTransactionDetail, ChemicalInventory, AllocatePickingItem } from "@/types/chemical";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { chemicalKeys } from "@/api/chemicalKeys";

// --- Sub-component: InventorySelect ---
interface InventorySelectProps {
    skuId: string;
    currentInventoryId: string;
    onSelect: (inventoryId: string) => void;
    className?: string;
}

function InventorySelect({ skuId, currentInventoryId, onSelect, className }: InventorySelectProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const { data: inventories, isLoading } = useQuery({
        queryKey: chemicalKeys.inventories.list({ skuId, search }),
        queryFn: async () => {
            const res = await chemicalApi.inventories.list({
                query: {
                    search,
                    "chemicalSkuId[]": [skuId],
                    itemsPerPage: 50,
                }
            });
            const inner = res.data;
            return (Array.isArray(inner) ? inner : []) as ChemicalInventory[];
        },
        enabled: open,
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button 
                    type="button"
                    className={`inline-flex items-center h-8 px-2.5 border border-primary/20 rounded-lg text-[10px] font-mono font-black cursor-pointer transition-all bg-background hover:bg-primary/5 hover:border-primary shadow-sm ${className ?? ""}`}
                >
                    <Database className="h-3 w-3 mr-2 text-primary" />
                    <span className="truncate max-w-[150px]">{currentInventoryId || String(t("inventory.chemical.allocateStock.selectCode"))}</span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[350px] shadow-2xl border-primary/20 z-[80]" align="start" sideOffset={5}>
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b border-border px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input 
                            placeholder={String(t("common.search"))}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none border-none focus-visible:ring-0"
                            autoFocus
                        />
                    </div>
                    <CommandList className="max-h-[350px] overflow-y-auto">
                        <CommandEmpty>
                            {isLoading ? (
                                <div className="flex items-center justify-center p-6 gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-[10px] font-black uppercase opacity-40">{String(t("inventory.chemical.allocateStock.searching"))}</span>
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-20" />
                                    <span className="text-[10px] font-black uppercase opacity-30">{String(t("inventory.chemical.allocateStock.noMatch"))}</span>
                                </div>
                            )}
                        </CommandEmpty>
                        <CommandGroup heading={<span className="text-[9px] font-black uppercase opacity-40 px-2 py-1">{String(t("inventory.chemical.allocateStock.availableList"))}</span>}>
                            {inventories?.map((inv) => (
                                <CommandItem
                                    key={inv.chemicalInventoryId}
                                    onSelect={() => {
                                        onSelect(inv.chemicalInventoryId);
                                        setOpen(false);
                                    }}
                                    className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-primary/5 border-b border-border/30 last:border-b-0"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-mono text-[11px] font-black text-primary tracking-tight">{inv.chemicalInventoryId}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 uppercase font-bold bg-muted/30">
                                                {String(t("inventory.chemical.allocateStock.lot"))}: {inv.lotNumber || "-"}
                                            </Badge>
                                            {inv.expDate && (
                                                <span className="text-[8px] text-muted-foreground font-medium uppercase opacity-60">
                                                    {String(t("inventory.chemical.allocateStock.hsd"))}: {new Date(inv.expDate).toLocaleDateString("vi-VN")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <div className="text-[11px] font-black text-foreground tabular-nums">{(inv.currentAvailableQty || 0).toLocaleString()}</div>
                                        <div className="text-[7px] font-black text-muted-foreground uppercase opacity-40 tracking-wider">{String(t("inventory.chemical.allocateStock.currentBalance"))}</div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// --- Main Component ---
interface ApproveTransactionBlockModalProps {
    blockId: string;
    onClose: () => void;
}

export function ApproveTransactionBlockModal({ blockId, onClose }: ApproveTransactionBlockModalProps) {
    const { t } = useTranslation();
    
    // API Hooks
    const { data: block, isLoading: blockLoading, refetch: refetchBlock } = useChemicalTransactionBlockFull(blockId);
    const { mutate: allocateMutate, isPending: isAllocating, data: allocateRes } = useAllocateStock();
    const updateMutation = useChemicalTransactionBlockDetailsUpdateBulk();
    const approveMutation = useApproveTransactionBlock();

    // Local State
    const [activeTab, setActiveTab] = useState<"detail" | "summary">("detail");
    const [allocateData, setAllocateData] = useState<AllocateStockResponse | null>(null);
    const [manualSelections, setManualSelections] = useState<{ chemicalInventoryId: string; chemicalSkuId: string }[]>([]);
    const [hasInitialAllocated, setHasInitialAllocated] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    // Allocation logic
    const handleAllocateCall = useCallback((
        details: ChemicalTransactionBlockDetail[], 
        manual: { chemicalInventoryId: string; chemicalSkuId: string }[] = []
    ) => {
        const required = details.map(d => ({
            chemicalSkuId: d.chemicalSkuId || "",
            chemicalName: d.chemicalName || "",
            chemicalCasNumber: d.chemicalCasNumber,
            totalChangeQty: d.changeQty,
            unit: d.chemicalTransactionBlockDetailUnit || "",
            analysisIds: d.analysisId ? [d.analysisId] : [],
            parameterName: d.parameterName || "",
        }));

        allocateMutate(
            { 
                body: { 
                    requiredChemicals: required,
                    selectedInventories: manual.length > 0 ? manual : undefined
                } 
            },
            {
                onSuccess: (res) => {
                    setAllocateData(res);
                    if (hasInitialAllocated) setIsDirty(true);
                }
            }
        );
    }, [allocateMutate, hasInitialAllocated]);

    // Initial Allocation from Block Details
    useEffect(() => {
        if (!hasInitialAllocated && block?.chemicalTransactionBlockDetails && block.chemicalTransactionBlockDetails.length > 0) {
            handleAllocateCall(block.chemicalTransactionBlockDetails, manualSelections);
            setHasInitialAllocated(true);
        }
    }, [block?.chemicalTransactionBlockId, block?.chemicalTransactionBlockDetails, handleAllocateCall, manualSelections, hasInitialAllocated]);

    const handleManualOverrideForSku = useCallback((skuId: string, invId: string) => {
        if (!block?.chemicalTransactionBlockDetails) return;
        const newManual = [...manualSelections].filter(m => m.chemicalSkuId !== skuId);
        if (invId.trim()) {
            newManual.push({ chemicalInventoryId: invId.trim(), chemicalSkuId: skuId });
        }
        setManualSelections(newManual);
        setIsDirty(true);
        handleAllocateCall(block.chemicalTransactionBlockDetails, newManual);
    }, [block?.chemicalTransactionBlockDetails, handleAllocateCall, manualSelections]);

    const handleUpdateBlock = async () => {
        if (!allocateData || !block?.chemicalTransactionBlockDetails) return;
        try {
            const updates = allocateData.transactionDetails.map((td) => {
                const original = block.chemicalTransactionBlockDetails?.find(
                    d => d.analysisId === td.analysisId && d.chemicalSkuId === td.chemicalSkuId
                );
                if (!original) return null;
                return {
                    chemicalTransactionBlockDetailId: original.chemicalTransactionBlockDetailId,
                    chemicalInventoryId: td.chemicalInventoryId,
                };
            }).filter((u): u is { chemicalTransactionBlockDetailId: string; chemicalInventoryId: string } => u !== null);

            await updateMutation.mutateAsync({
                body: updates
            });
            setIsDirty(false);
            refetchBlock();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(t("common.toast.failed"));
            toast.error(msg);
        }
    };

    const handleApprove = async () => {
        if (!block) return;
        
        if (isDirty) {
            const ok = window.confirm(t("inventory.chemical.allocateStock.unsavedChangesConfirm", { defaultValue: "Cấu hình phân bổ đã thay đổi nhưng chưa được lưu. Bạn có muốn lưu và tiếp tục phê duyệt không?" }));
            if (ok) {
                await handleUpdateBlock();
            } else {
                return;
            }
        }

        try {
            await approveMutation.mutateAsync({
                body: { chemicalTransactionBlockId: blockId }
            });
            toast.success(String(t("common.toast.success")));
            onClose();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(t("common.toast.failed"));
            toast.error(msg);
        }
    };

    // Derived
    const effectiveData = useMemo(() => allocateData || (allocateRes as AllocateStockResponse | undefined), [allocateData, allocateRes]);
    const txDetails = useMemo(() => effectiveData?.transactionDetails || [], [effectiveData]);
    const pickList = useMemo(() => effectiveData?.pickingList || [], [effectiveData]);

    if (blockLoading) {
        return (
            <div className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border flex flex-col" style={{ width: "80%", height: "90%", maxWidth: "1600px" }} onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">{String(t("inventory.chemical.transactionBlocks.approveTitle", { defaultValue: "Duyệt Phiếu Xuất/Nhập Kho" }))}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            ID: {blockId}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col min-h-0">
                    
                    {/* Toolbar */}
                    <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-4 shrink-0 bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{t("inventory.chemical.transactionBlocks.type", { defaultValue: "Loại phiếu" })}:</span>
                                <Badge className={block?.transactionType === 'EXPORT' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'}>
                                    {block?.transactionType === 'EXPORT' ? String(t("inventory.chemical.transactionBlocks.types.OUTBOUND")) : String(t("inventory.chemical.transactionBlocks.types.INBOUND"))}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium">{String(t("inventory.chemical.transactionBlocks.details.reference"))}:</span>
                                <span>{block?.referenceDocument ?? "-"}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <TabsList>
                                <TabsTrigger value="detail" className="text-xs">
                                    <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> {String(t("inventory.chemical.transactionBlocks.details.lineItems"))}
                                </TabsTrigger>
                                <TabsTrigger value="summary" className="text-xs">
                                    <List className="h-3.5 w-3.5 mr-1.5" /> {String(t("inventory.chemical.allocateStock.pickingListTitle"))}
                                </TabsTrigger>
                            </TabsList>
                            <Button 
                                variant="outline" size="sm" 
                                onClick={() => block?.chemicalTransactionBlockDetails && handleAllocateCall(block.chemicalTransactionBlockDetails, manualSelections)}
                                disabled={isAllocating}
                            >
                                <RefreshCw className={`h-4 w-4 mr-1.5 ${isAllocating ? 'animate-spin' : ''}`} /> {String(t("inventory.chemical.allocateStock.resetAllocation", { defaultValue: "Tính toán lại" }))}
                            </Button>
                        </div>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto bg-muted/5 p-5">
                        <TabsContent value="detail" className="m-0 focus-visible:ring-0">
                            {isAllocating && !effectiveData ? (
                                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-30" />
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{String(t("common.loading"))}</span>
                                </div>
                            ) : txDetails.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                    {txDetails.map((detail: AllocateTransactionDetail, index: number) => (
                                        <div key={index} className="border border-border rounded-lg p-3 bg-background space-y-2">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm truncate" title={detail.chemicalName}>{detail.chemicalName}</div>
                                                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                        SKU: {detail.chemicalSkuId} | {t("inventory.chemical.allocateStock.cas")}: {detail.chemicalCasNumber ?? "-"}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-xs font-mono text-muted-foreground">{t("inventory.chemical.allocateStock.lot")}: {detail.chemicalInventoryId}</div>
                                                    {detail.currentAvailableQty !== undefined && (
                                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                                            {t("inventory.dashboard.table.stock", { defaultValue: "Tồn" })}: <strong className="text-foreground">{detail.currentAvailableQty.toLocaleString()}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub Info */}
                                            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/50">
                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-medium text-muted-foreground uppercase">{String(t("common.quantity"))}</label>
                                                    <div className="text-xs font-semibold">
                                                        {Math.abs(detail.changeQty).toLocaleString()} {detail.chemicalTransactionBlockDetailUnit ?? "v"}
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-medium text-muted-foreground uppercase">{String(t("inventory.chemical.transactionBlocks.details.test"))}</label>
                                                    <div className="text-xs truncate" title={detail.analysisId}>
                                                        {detail.analysisId ?? "-"}
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[10px] font-medium text-muted-foreground uppercase">{String(t("common.note"))}</label>
                                                    <div className="text-xs truncate italic" title={detail.parameterName ?? ""}>
                                                        {detail.parameterName ?? "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <AlertCircle className="h-12 w-12 mb-3 opacity-10" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-30">{String(t("common.noData"))}</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="summary" className="m-0 focus-visible:ring-0">
                            {pickList.length > 0 ? (
                                <div className="border border-border rounded-lg overflow-hidden max-h-[calc(100vh-380px)] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted text-xs text-muted-foreground uppercase sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-2 font-medium text-left w-[240px]">{String(t("inventory.chemical.allocateStock.pickingAssign"))}</th>
                                                <th className="px-4 py-2 font-medium text-left">{String(t("inventory.chemical.allocateStock.chemicalInfo"))}</th>
                                                <th className="px-4 py-2 font-medium text-left w-[300px]">{String(t("inventory.chemical.allocateStock.relatedTests"))}</th>
                                                <th className="px-4 py-2 font-medium text-right w-[160px]">{String(t("common.all"))}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-background">
                                            {pickList.map((pick: AllocatePickingItem, idx: number) => (
                                                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <InventorySelect 
                                                            skuId={pick.chemicalSkuId} 
                                                            currentInventoryId={pick.chemicalInventoryId}
                                                            onSelect={(id) => handleManualOverrideForSku(pick.chemicalSkuId, id)}
                                                            className="w-[200px]"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-foreground text-sm mb-0.5">{pick.chemicalName ?? "-"}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">
                                                            {pick.chemicalSkuId} | {String(t("inventory.chemical.allocateStock.cas"))}: {pick.chemicalCasNumber ?? "-"}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {pick.analysisIds?.map((aid: string | null) => (
                                                                <Badge 
                                                                    key={aid || 'null'} 
                                                                    variant="outline" 
                                                                    className="bg-muted text-muted-foreground"
                                                                >
                                                                    #{aid ?? "-"}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="text-sm font-semibold text-primary">
                                                            {Math.abs(pick.totalChangeQty).toLocaleString()}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground uppercase">{String(t("common.quantity"))}: V</div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground opacity-20">
                                    <Package className="h-12 w-12 mb-3" />
                                    <p className="text-[11px] font-black uppercase tracking-widest">{String(t("common.noData"))}</p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-between shrink-0">
                    <div className="text-xs text-muted-foreground flex items-center gap-4">
                        <span>
                            {String(t("inventory.chemical.allocateStock.totalSku"))}: <strong className="text-foreground">{pickList.length}</strong>
                        </span>
                        <span>
                            {String(t("inventory.chemical.allocateStock.totalTests"))}: <strong className="text-foreground">{txDetails.length}</strong>
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                            <div className={`h-2 w-2 rounded-full ${isDirty ? 'bg-yellow-500' : 'bg-success animate-pulse'}`} />
                            <span>{isDirty ? t("inventory.chemical.allocateStock.hasUnsavedChanges", { defaultValue: "Có thay đổi chưa lưu" }) : String(t("inventory.chemical.allocateStock.readyToExecute"))}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t("common.cancel", { defaultValue: "Hủy" })}
                        </Button>
                        <Button 
                            type="button"
                            variant="outline"
                            onClick={handleUpdateBlock}
                            disabled={updateMutation.isPending || isAllocating || !effectiveData}
                        >
                            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {String(t("inventory.chemical.allocateStock.saveAllocation"))}
                        </Button>
                        <Button 
                            type="button"
                            variant="success"
                            onClick={handleApprove}
                            disabled={approveMutation.isPending || updateMutation.isPending}
                        >
                            {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {String(t("inventory.chemical.allocateStock.approveOutbound"))}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
