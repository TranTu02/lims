import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, Beaker, Check, MapPin, ArrowRight, Save } from "lucide-react";

import { useEstimateChemicals, useAllocateStock, useChemicalCreateTransactionBlock } from "@/api/chemical";
import type { AnalysisListItem } from "@/types/analysis";
import type { EstimateResponse, AllocateStockResponse } from "@/types/chemical";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ChemicalAllocationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAnalyses: AnalysisListItem[];
    onSuccess?: () => void;
}

export function TechnicianChemicalAllocationModal({
    open,
    onOpenChange,
    selectedAnalyses,
    onSuccess,
}: ChemicalAllocationModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<"estimate" | "allocate" | "finished">("estimate");
    const [estimateData, setEstimateData] = useState<EstimateResponse | null>(null);
    const [allocationData, setAllocationData] = useState<AllocateStockResponse | null>(null);

    const { mutate: estimate, isPending: isEstimating } = useEstimateChemicals();
    const { mutate: allocate, isPending: isAllocating } = useAllocateStock();
    const { mutate: createBlock, isPending: isCreatingBlock } = useChemicalCreateTransactionBlock();

    useEffect(() => {
        if (open && selectedAnalyses.length > 0) {
            setStep("estimate");
            setEstimateData(null);
            setAllocationData(null);
            
            const payload = {
                analyses: selectedAnalyses.map((a) => ({ analysisId: a.analysisId })),
            };
            
            estimate(
                { body: payload },
                {
                    onSuccess: (data) => setEstimateData(data),
                }
            );
        }
    }, [open, selectedAnalyses, estimate]);

    const handleAllocate = () => {
        if (!estimateData) return;
        
        const payload = {
            requiredChemicals: estimateData.details.map(d => ({
                chemicalSkuId: d.chemicalSkuId,
                chemicalName: d.chemicalName,
                chemicalCasNumber: d.chemicalCasNumber,
                totalChangeQty: d.changeQty,
                unit: d.unit,
                analysisIds: [d.analysisId],
                parameterName: d.parameterName,
            })),
        };
        
        allocate(
            { body: payload },
            {
                onSuccess: (data) => {
                    setAllocationData(data);
                    setStep("allocate");
                },
            }
        );
    };

    const handleConfirmExport = () => {
        if (!allocationData) return;
        
        const payload = {
            chemicalTransactionBlock: {
                transactionType: "EXPORT",
                referenceDocument: `Export for ${selectedAnalyses.length} analyses`,
            },
            chemicalTransactionBlockDetails: allocationData.transactionDetails.map((d) => ({
                transactionType: d.transactionType || "EXPORT",
                chemicalSkuId: d.chemicalSkuId,
                chemicalInventoryId: d.chemicalInventoryId,
                changeQty: d.changeQty,
                analysisId: d.analysisId,
                parameterName: d.parameterName,
                chemicalTransactionBlockDetailUnit: d.chemicalTransactionBlockDetailUnit,
            })),
        };
        
        createBlock(
            { body: payload },
            {
                onSuccess: () => {
                    toast.success(t("technician.workspace.allocationSuccess", { defaultValue: "Đã tạo phiếu xuất kho và cập nhật vào chỉ tiêu" }));
                    setStep("finished");
                    onSuccess?.();
                    setTimeout(() => onOpenChange(false), 2000);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden [&>button:last-child]:hidden">
                <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                    <DialogTitle className="flex items-center gap-2">
                        <Beaker className="w-5 h-5 text-primary" />
                        {t("technician.workspace.modalTitle", { defaultValue: "Gợi ý & Cấp phát hóa chất theo mẫu" })}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                    {/* Stepper Simple */}
                    <div className="flex-shrink-0 flex items-center justify-center p-4 bg-background border-b gap-4">
                        <div className={`flex items-center gap-2 ${step === "estimate" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step === "estimate" ? "bg-primary text-primary-foreground" : ""}`}>1</div>
                            {t("technician.workspace.stepEstimate", { defaultValue: "Nhu cầu định mức" })}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step === "allocate" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step === "allocate" ? "bg-primary text-primary-foreground" : ""}`}>2</div>
                            {t("technician.workspace.stepAllocate", { defaultValue: "Phân bổ FEFO" })}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className={`flex items-center gap-2 ${step === "finished" ? "text-primary font-bold" : "text-muted-foreground"}`}>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step === "finished" ? "bg-success text-success-foreground" : ""}`}>
                                {step === "finished" ? <Check className="w-4 h-4" /> : "3"}
                            </div>
                            {t("technician.workspace.stepFinished", { defaultValue: "Hoàn tất" })}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="p-6">
                        {isEstimating && (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-muted-foreground">{t("technician.workspace.calculatingBom", { defaultValue: "Đang tính toán nhu cầu định mức (BOM)..." })}</p>
                            </div>
                        )}

                        {step === "estimate" && estimateData && (
                            <div className="space-y-8">
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                    <h3 className="font-semibold text-primary">{t("technician.workspace.summaryDemand", { defaultValue: "Tóm tắt nhu cầu" })}</h3>
                                    <p className="text-sm text-muted-foreground">{t("technician.workspace.basedOnAnalyses", { count: selectedAnalyses.length, defaultValue: `Tính toán dựa trên ${selectedAnalyses.length} chỉ tiêu đã chọn.` })}</p>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                    {/* Left: Summary */}
                                    <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                                        <div className="bg-muted px-4 py-2 border-b font-semibold">{t("technician.workspace.summaryByChem", { defaultValue: "1. Tổng hợp nhu cầu theo hóa chất" })}</div>
                                        <Table>
                                            <TableHeader>
                                                 <TableRow>
                                                    <TableHead>{t("technician.workspace.chemSku", { defaultValue: "Tên hóa chất (SKU)" })}</TableHead>
                                                    <TableHead>{t("inventory.chemical.transactions.casNumber", { defaultValue: "Số CAS" })}</TableHead>
                                                    <TableHead className="">{t("technician.workspace.sampleCount", { defaultValue: "Số lượng mẫu" })}</TableHead>
                                                    <TableHead className="">{t("technician.workspace.totalNorm", { defaultValue: "Tổng định mức" })}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {estimateData.summary.map((item) => (
                                                     <TableRow key={item.chemicalSkuId} className="hover:bg-muted/30">
                                                         <TableCell>
                                                             <div className="font-bold text-sm text-primary leading-tight">{item.chemicalName}</div>
                                                             <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{item.chemicalSkuId}</div>
                                                             <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
                                                                 {item.analysisIds?.map((aid: string) => {
                                                                     const detailsForAid = estimateData.details.filter(d => d.analysisId === aid && d.chemicalSkuId === item.chemicalSkuId);
                                                                     const params = detailsForAid.map(d => d.parameterName).filter(Boolean).join(", ");
                                                                     return (
                                                                         <span key={aid} className="text-[9px] text-primary/70 bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded font-medium">
                                                                             {aid}{params ? `: ${params}` : ""}
                                                                         </span>
                                                                     );
                                                                 })}
                                                             </div>
                                                         </TableCell>
                                                        <TableCell className="text-xs font-mono text-muted-foreground">{item.chemicalCasNumber || "-"}</TableCell>
                                                        <TableCell className="">
                                                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px]">
                                                                {item.analysisIds.length} mẫu
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-sm text-primary">
                                                            {Math.abs(item.totalChangeQty)} <span className="text-[10px] font-medium text-muted-foreground">{item.unit}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Right: Details */}
                                    <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                                        <div className="bg-muted px-4 py-2 border-b font-semibold">{t("technician.workspace.detailsByAnalysis", { defaultValue: "2. Chi tiết theo từng chỉ tiêu" })}</div>
                                        <div>
                                            <Table>
                                                <TableHeader className="bg-background z-10 border-b shadow-sm">
                                                     <TableRow>
                                                        <TableHead>{t("technician.workspace.parameter", { defaultValue: "Chỉ tiêu" })}</TableHead>
                                                        <TableHead>{t("inventory.chemical.transactions.chemical", { defaultValue: "Hóa chất" })}</TableHead>
                                                        <TableHead>{t("inventory.chemical.transactions.casNumber", { defaultValue: "Số CAS" })}</TableHead>
                                                        <TableHead className="">{t("technician.workspace.norm", { defaultValue: "Định mức" })}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {estimateData.details.map((detail, idx) => (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <div className="font-medium">{detail.parameterName}</div>
                                                                <div className="text-xs text-muted-foreground">{detail.analysisId}</div>
                                                            </TableCell>
                                                             <TableCell>
                                                                <div className="text-sm">{detail.chemicalName}</div>
                                                                <div className="text-xs text-muted-foreground">{detail.chemicalSkuId}</div>
                                                            </TableCell>
                                                            <TableCell className="text-xs">{detail.chemicalCasNumber || "-"}</TableCell>
                                                            <TableCell className=" whitespace-nowrap">
                                                                {Math.abs(detail.changeQty)} {detail.unit}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAllocating && (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-muted-foreground">{t("technician.workspace.fefoRunning", { defaultValue: "Đang tự động bốc chai theo thuật toán FEFO..." })}</p>
                            </div>
                        )}

                        {step === "allocate" && allocationData && (
                            <div className="space-y-8">
                                <div className="bg-success/5 p-4 rounded-lg border border-success/20">
                                    <h3 className="font-semibold text-success">{t("technician.workspace.fefoResult", { defaultValue: "Kết quả phân bổ (FEFO)" })}</h3>
                                    <p className="text-sm text-muted-foreground">{t("technician.workspace.fefoResultDesc", { defaultValue: "Hệ thống đã tự động tìm các chai phù hợp nhất trong kho." })}</p>
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                    {/* Left: General Transaction View */}
                                    <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                                        <div className="bg-muted px-4 py-2 border-b font-semibold">{t("technician.workspace.expectedExportVoucher", { defaultValue: "1. Phiếu xuất kho dự kiến" })}</div>
                                        <Table>
                                            <TableHeader>
                                                 <TableRow>
                                                    <TableHead>{t("inventory.chemical.transactions.bottleId", { defaultValue: "Chai/Lọ (Inventory ID)" })}</TableHead>
                                                    <TableHead>{t("inventory.chemical.transactions.chemical", { defaultValue: "Hóa chất" })}</TableHead>
                                                    <TableHead>{t("inventory.chemical.transactions.casNumber", { defaultValue: "Số CAS" })}</TableHead>
                                                    <TableHead className="">{t("inventory.chemical.transactions.exportQty", { defaultValue: "Lượng xuất" })}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allocationData.transactionDetails.map((tx, idx) => (
                                                    <TableRow key={idx}>
                                                        <TableCell className="font-mono text-xs">{tx.chemicalInventoryId}</TableCell>
                                                         <TableCell>
                                                            <div className="font-medium">{tx.chemicalName}</div>
                                                            <div className="text-xs text-muted-foreground">{tx.chemicalSkuId}</div>
                                                        </TableCell>
                                                        <TableCell className="text-xs">{tx.chemicalCasNumber || "-"}</TableCell>
                                                        <TableCell className=" font-bold text-destructive">
                                                            {tx.changeQty}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Right: Picking List */}
                                    <div className="border rounded-lg shadow-sm bg-card overflow-hidden border-warning/50">
                                        <div className="bg-warning/10 px-4 py-2.5 border-b border-warning/50 font-semibold text-warning-foreground flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-warning" /> 
                                            <span className="text-sm font-semibold">{t("technician.workspace.pickingList", { defaultValue: "2. Danh sách đi lấy hàng (Picking List)" })}</span>
                                        </div>
                                        <Table>
                                            <TableHeader className="bg-muted/50 text-[11px] uppercase text-muted-foreground font-bold">
                                                <TableRow>
                                                    <TableHead className="px-4 py-3 text-left w-[200px] font-bold">{t("technician.workspace.bottleToPick", { defaultValue: "Mã chai cần lấy" })}</TableHead>
                                                    <TableHead className="px-4 py-3 text-left font-bold">{t("technician.workspace.chemSku", { defaultValue: "Hóa chất (SKU)" })}</TableHead>
                                                    <TableHead className="px-4 py-3 text-right w-[150px] font-bold">{t("technician.workspace.qtyToPick", { defaultValue: "Số lượng lấy" })}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="divide-y divide-border">
                                                {allocationData.pickingList.map((pick: any, idx) => {
                                                    const chemName = pick.chemicalName || (allocationData.transactionDetails.find(tx => tx.chemicalSkuId === pick.chemicalSkuId)?.chemicalName || "Unknown");
                                                    const relatedDetail = allocationData.transactionDetails.find(tx => tx.chemicalSkuId === pick.chemicalSkuId);
                                                    const unit = relatedDetail?.chemicalTransactionBlockDetailUnit || "";

                                                    return (
                                                        <TableRow key={idx} className="hover:bg-muted/5">
                                                            <TableCell className="px-4 py-4 align-middle">
                                                                <div className="inline-flex items-center px-2 py-1 rounded-full bg-muted border border-border/50 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-tighter">
                                                                    {pick.chemicalInventoryId}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="px-4 py-4">
                                                                <div className="font-bold text-sm text-foreground leading-tight">{chemName}</div>
                                                                <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">{pick.chemicalSkuId}</div>
                                                                {pick.analysisIds && pick.analysisIds.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                                        {pick.analysisIds.map((aid: string) => (
                                                                            <span key={aid} className="bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5 text-[9px] font-mono font-medium">
                                                                                #{aid}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="px-4 py-4 text-right align-middle">
                                                                <div className="flex items-center justify-end font-bold text-sm text-success gap-1.5">
                                                                    <span className="text-muted-foreground/30 text-[10px] font-normal">→</span>
                                                                    {Math.abs(pick.totalChangeQty)}
                                                                    {unit && <span className="font-medium text-muted-foreground text-[10px] ml-0.5">{unit}</span>}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === "finished" && (
                            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center text-success">
                                    <Check className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">{t("technician.workspace.jobDone", { defaultValue: "Hoàn tất công việc!" })}</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    {t("technician.workspace.jobDoneDesc", { defaultValue: "Phiếu xuất kho đã được tạo. Thông tin hóa chất tiêu hao đã được gán vào từng chỉ tiêu tương ứng." })}
                                </p>
                            </div>
                        )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/30">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isAllocating || isCreatingBlock}>
                        {t("common.close", { defaultValue: "Đóng" })}
                    </Button>
                    
                    {step === "estimate" && estimateData && (
                        <Button onClick={handleAllocate} disabled={isAllocating} className="gap-2">
                            {isAllocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Beaker className="w-4 h-4" />}
                            {t("technician.workspace.proceedAllocation", { defaultValue: "Tiến hành phân bổ FEFO" })}
                        </Button>
                    )}

                    {step === "allocate" && allocationData && (
                        <Button onClick={handleConfirmExport} disabled={isCreatingBlock} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
                            {isCreatingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {t("technician.workspace.confirmAndAssign", { defaultValue: "Xác nhận xuất kho & Gán chỉ tiêu" })}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
