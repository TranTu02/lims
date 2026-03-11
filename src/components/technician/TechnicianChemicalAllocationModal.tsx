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
            requiredChemicals: estimateData.summary,
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
                actionType: d.actionType || "EXPORT",
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
            <DialogContent className="max-w-[95vw] w-[95vw] sm:max-w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
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
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${step === "finished" ? "bg-green-500 text-white" : ""}`}>
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
                                                    <TableHead className="text-center">{t("technician.workspace.sampleCount", { defaultValue: "Số lượng mẫu" })}</TableHead>
                                                    <TableHead className="text-right">{t("technician.workspace.totalNorm", { defaultValue: "Tổng định mức" })}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {estimateData.summary.map((item) => (
                                                    <TableRow key={item.chemicalSkuId}>
                                                        <TableCell>
                                                            <div className="font-medium text-primary">{item.chemicalName}</div>
                                                            <div className="text-xs text-muted-foreground">{item.chemicalSkuId}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="outline">{item.analysisIds.length}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold">
                                                            {Math.abs(item.totalChangeQty)} {item.unit}
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
                                                        <TableHead className="text-right">{t("technician.workspace.norm", { defaultValue: "Định mức" })}</TableHead>
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
                                                            <TableCell className="text-right whitespace-nowrap">
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
                                <div className="bg-green-500/5 p-4 rounded-lg border border-green-500/20">
                                    <h3 className="font-semibold text-green-700">{t("technician.workspace.fefoResult", { defaultValue: "Kết quả phân bổ (FEFO)" })}</h3>
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
                                                    <TableHead className="text-right">{t("inventory.chemical.transactions.exportQty", { defaultValue: "Lượng xuất" })}</TableHead>
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
                                                        <TableCell className="text-right font-bold text-red-600">
                                                            {tx.changeQty}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Right: Picking List */}
                                    <div className="border rounded-lg shadow-sm bg-card overflow-hidden border-orange-200">
                                        <div className="bg-orange-50 px-4 py-2 border-b border-orange-200 font-semibold text-orange-800 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" /> {t("technician.workspace.pickingList", { defaultValue: "2. Danh sách đi lấy hàng (Picking List)" })}
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>{t("technician.workspace.bottleToPick", { defaultValue: "Mã chai cần lấy" })}</TableHead>
                                                    <TableHead>{t("technician.workspace.chemSku", { defaultValue: "Hóa chất (SKU)" })}</TableHead>
                                                    <TableHead className="text-right">{t("technician.workspace.qtyToPick", { defaultValue: "Số lượng lấy" })}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allocationData.pickingList.map((pick, idx) => {
                                                    const chemName = allocationData.transactionDetails.find(tx => tx.chemicalSkuId === pick.chemicalSkuId)?.chemicalName || "Unknown";
                                                    return (
                                                        <TableRow key={idx} className="bg-orange-50/10">
                                                            <TableCell>
                                                                <Badge variant="outline" className="bg-background text-[11px] font-mono whitespace-nowrap">
                                                                    {pick.chemicalInventoryId}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-medium">{chemName}</div>
                                                                <div className="text-xs text-muted-foreground">{pick.chemicalSkuId}</div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="font-bold flex items-center justify-end gap-1 text-primary">
                                                                    <ArrowRight className="w-3 h-3" />
                                                                    {Math.abs(pick.totalChangeQty)}
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
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
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
                        <Button onClick={handleConfirmExport} disabled={isCreatingBlock} className="gap-2 bg-green-600 hover:bg-green-700">
                            {isCreatingBlock ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {t("technician.workspace.confirmAndAssign", { defaultValue: "Xác nhận xuất kho & Gán chỉ tiêu" })}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
