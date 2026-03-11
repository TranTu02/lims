import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, Package, Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEstimateChemicals, useAllocateStock } from "@/api/chemical";
import type { EstimateResponse, AllocateStockResponse, EstimateSummary } from "@/types/chemical";

type Props = {
    onClose: () => void;
};

import { toast } from "sonner";

export function AllocateStockModal({ onClose }: Props) {
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2 | 3>(1);

    // Step 1 State: Input Analysis IDs
    const [analysisIds, setAnalysisIds] = useState<string[]>([]);
    const [analysisInput, setAnalysisInput] = useState("");

    const addAnalysis = () => {
        if (!analysisInput.trim()) return;
        if (!analysisIds.includes(analysisInput.trim())) {
            setAnalysisIds((prev) => [...prev, analysisInput.trim()]);
        }
        setAnalysisInput("");
    };

    const removeAnalysis = (id: string) => {
        setAnalysisIds((prev) => prev.filter((a) => a !== id));
    };

    // Step 2 State: Estimate Results
    const estimateMutation = useEstimateChemicals();
    const [estimateData, setEstimateData] = useState<EstimateResponse | null>(null);

    const handleEstimate = () => {
        if (analysisIds.length === 0) return;
        estimateMutation.mutate(
            { body: { analyses: analysisIds.map((id) => ({ analysisId: id })) } },
            {
                onSuccess: (res: any) => {
                    if (!res.success) {
                        toast.error(res.error?.message || t("inventory.chemical.allocateStock.estimateError", { defaultValue: "Lỗi dự toán hao hụt" }));
                        return;
                    }
                    setEstimateData(res.data);
                    setStep(2);
                },
                onError: (err: any) => {
                    toast.error(err?.message || t("inventory.chemical.allocateStock.estimateError", { defaultValue: "Lỗi dự toán hao hụt" }));
                },
            },
        );
    };

    // Step 3 State: Allocate
    const allocateMutation = useAllocateStock();
    const [allocateData, setAllocateData] = useState<AllocateStockResponse | null>(null);

    const handleAllocate = () => {
        if (!estimateData) return;
        allocateMutation.mutate(
            { body: { requiredChemicals: estimateData.summary } }, // Tạm thời để trống selectedInventories, phó thác cho backend FEFO
            {
                onSuccess: (res: any) => {
                    if (!res.success) {
                        toast.error(res.error?.message || t("inventory.chemical.allocateStock.allocateError", { defaultValue: "Lỗi cấp phát FEFO" }));
                        return;
                    }
                    setAllocateData(res.data);
                    setStep(3);
                },
                onError: (err: any) => {
                    toast.error(err?.message || t("inventory.chemical.allocateStock.allocateError", { defaultValue: "Lỗi cấp phát FEFO" }));
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border flex flex-col w-[800px] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">{t("inventory.chemical.allocateStock.title", { defaultValue: "Cấp phát hóa chất tự động (FEFO)" })}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("inventory.chemical.allocateStock.subtitle", { defaultValue: "Quy trình: Phân tích mẫu ➝ Dự toán hóa chất ➝ Cấp phát kho" })}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Stepper */}
                    <div className="flex items-center justify-center mb-6">
                        <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs text-white ${step >= 1 ? "bg-primary" : "bg-muted-foreground"}`}>1</div>
                            <span className="text-sm">{t("inventory.chemical.allocateStock.steps.analysis", { defaultValue: "Danh sách Mẫu" })}</span>
                        </div>
                        <div className={`h-px w-8 mx-4 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
                        <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs text-white ${step >= 2 ? "bg-primary" : "bg-muted-foreground"}`}>2</div>
                            <span className="text-sm">{t("inventory.chemical.allocateStock.steps.estimate", { defaultValue: "Dự toán Hao hụt" })}</span>
                        </div>
                        <div className={`h-px w-8 mx-4 ${step >= 3 ? "bg-primary" : "bg-border"}`} />
                        <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs text-white ${step >= 3 ? "bg-primary" : "bg-muted-foreground"}`}>3</div>
                            <span className="text-sm">{t("inventory.chemical.allocateStock.steps.pickList", { defaultValue: "Phiếu xuất kho" })}</span>
                        </div>
                    </div>

                    {/* Step 1: Nhập mẫu */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">{t("inventory.chemical.allocateStock.analysisIdLabel", { defaultValue: "Nhập mã Phép thử (Analysis ID)" })}</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={t("inventory.chemical.allocateStock.analysisIdPlaceholder", { defaultValue: "Nhập ID (Ví dụ: ALY-001) rồi nhấn Enter..." })}
                                        value={analysisInput}
                                        onChange={(e) => setAnalysisInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addAnalysis();
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={addAnalysis} variant="secondary">
                                        <Plus className="h-4 w-4 mr-1" /> {t("inventory.chemical.allocateStock.add", { defaultValue: "Thêm" })}
                                    </Button>
                                </div>
                            </div>

                            {analysisIds.length > 0 && (
                                <div className="border border-border rounded-lg bg-muted/10 p-4">
                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">
                                        {t("inventory.chemical.allocateStock.analysisList", { count: analysisIds.length, defaultValue: `Danh sách cần phân tích (${analysisIds.length})` })}
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisIds.map((id) => (
                                            <Badge key={id} variant="secondary" className="px-2 py-1 text-xs font-mono">
                                                {id}
                                                <button type="button" onClick={() => removeAnalysis(id)} className="ml-1 text-muted-foreground hover:text-destructive">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end border-t border-border">
                                <Button type="button" onClick={handleEstimate} disabled={analysisIds.length === 0 || estimateMutation.isPending}>
                                    {estimateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <>
                                            {t("inventory.chemical.allocateStock.continueEstimate", { defaultValue: "Tiếp tục dự toán" })} <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Dự toán (Estimate Results) */}
                    {step === 2 && estimateData && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    {t("inventory.chemical.allocateStock.bomTitle", { defaultValue: "Tổng hợp hóa chất cần dùng (BOM)" })}
                                </h4>
                                <div className="border border-border rounded-md overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold">
                                            <tr>
                                                <th className="px-3 py-2">{t("inventory.chemical.allocateStock.table.skuId", { defaultValue: "Mã SKU" })}</th>
                                                <th className="px-3 py-2">{t("inventory.chemical.allocateStock.table.name", { defaultValue: "Tên hóa chất" })}</th>
                                                <th className="px-3 py-2 text-right">{t("inventory.chemical.allocateStock.table.totalQty", { defaultValue: "Tổng định mức" })}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {estimateData.summary.map((sum: EstimateSummary, idx: number) => (
                                                <tr key={idx} className="bg-background hover:bg-muted/30">
                                                    <td className="px-3 py-2 font-mono text-xs">{sum.chemicalSkuId}</td>
                                                    <td className="px-3 py-2 font-medium">
                                                        {sum.chemicalName}
                                                        {sum.chemicalCASNumber && <div className="text-[10px] text-muted-foreground font-normal">CAS: {sum.chemicalCASNumber}</div>}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold text-primary">
                                                        {Math.abs(sum.totalChangeQty)}
                                                        <span className="font-normal text-muted-foreground ml-1 text-xs">{sum.unit}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between border-t border-border">
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                    {t("inventory.chemical.allocateStock.back", { defaultValue: "Quay lại" })}
                                </Button>
                                <Button type="button" onClick={handleAllocate} disabled={allocateMutation.isPending}>
                                    {allocateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <>
                                            {t("inventory.chemical.allocateStock.createOutbound", { defaultValue: "Tạo phiếu xuất tự động (FEFO)" })} <CheckCircle2 className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Allocated Results (Picking List) */}
                    {step === 3 && allocateData && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                            <div className="bg-success/10 text-success border border-success/20 rounded-lg p-4 flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm">{t("inventory.chemical.allocateStock.success", { defaultValue: "Cấp phát thành công!" })}</h4>
                                    <p className="text-xs mt-1 text-success/80">
                                        {t("inventory.chemical.allocateStock.successDesc", {
                                            defaultValue: "Hệ thống đã tự động lựa chọn chai/lọ theo quy tắc ưu tiên FEFO và tạo Danh sách nhặt hàng (Picking List) bên dưới.",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    {t("inventory.chemical.allocateStock.pickingListTitle", { defaultValue: "Danh sách Picking (Lấy hàng từ kho)" })}
                                </h4>
                                <div className="border border-border rounded-md overflow-hidden bg-background">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-xs uppercase text-muted-foreground font-semibold">
                                            <tr>
                                                <th className="px-3 py-2">{t("inventory.chemical.allocateStock.pickingTable.inventoryId", { defaultValue: "Mã Chai (Inventory ID)" })}</th>
                                                <th className="px-3 py-2">{t("inventory.chemical.allocateStock.pickingTable.location", { defaultValue: "Vị trí" })}</th>
                                                <th className="px-3 py-2 text-right">{t("inventory.chemical.allocateStock.pickingTable.pickQty", { defaultValue: "Mức lấy" })}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border relative">
                                            {allocateData.pickingList.map((pick: any, idx: number) => {
                                                const relatedDetail = allocateData.transactionDetails.find(tx => tx.chemicalSkuId === pick.chemicalSkuId);
                                                const chemName = relatedDetail?.chemicalName || pick.chemicalSkuId;
                                                const unit = relatedDetail?.chemicalTransactionBlockDetailUnit || "-";
                                                
                                                return (
                                                <tr key={idx} className="hover:bg-muted/30">
                                                    <td className="px-3 py-2">
                                                        <div className="font-mono text-xs font-semibold text-primary">{pick.chemicalInventoryId}</div>
                                                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[200px]">{chemName}</div>
                                                    </td>
                                                    <td className="px-3 py-2 font-medium text-xs">{"-"}</td>
                                                    <td className="px-3 py-2 text-right font-bold">
                                                        {Math.abs(pick.totalChangeQty)}
                                                        <span className="font-normal text-muted-foreground ml-1 text-xs">{unit}</span>
                                                    </td>
                                                </tr>
                                            )})}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end border-t border-border">
                                <Button type="button" onClick={onClose}>
                                    {t("inventory.chemical.allocateStock.done", { defaultValue: "Hoàn tất & Đóng" })}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
