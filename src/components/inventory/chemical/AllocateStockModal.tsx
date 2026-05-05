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
            {
                body: {
                    requiredChemicals: estimateData.details.map((d) => ({
                        chemicalSkuId: d.chemicalSkuId,
                        chemicalName: d.chemicalName,
                        chemicalCasNumber: d.chemicalCasNumber,
                        totalChangeQty: d.changeQty,
                        unit: d.unit,
                        analysisIds: [d.analysisId],
                        parameterName: d.parameterName,
                    })),
                },
            },
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
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
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
                                                <th className="px-3 py-2 text-left">{t("inventory.chemical.allocateStock.table.skuId", { defaultValue: "Mã SKU" })}</th>
                                                <th className="px-3 py-2 text-left">{t("inventory.chemical.allocateStock.table.name", { defaultValue: "Tên hóa chất" })}</th>
                                                <th className="px-3 py-2 text-right">{t("inventory.chemical.allocateStock.table.totalQty", { defaultValue: "Tổng định mức" })}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {estimateData.summary.map((sum: EstimateSummary, idx: number) => (
                                                <tr key={idx} className="bg-background hover:bg-muted/30">
                                                    <td className="px-3 py-2 font-mono text-xs">{sum.chemicalSkuId}</td>
                                                    <td className="px-3 py-2 font-medium">
                                                        {sum.chemicalName}
                                                        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-0.5">
                                                            {sum.chemicalCasNumber && <span className="text-[10px] text-muted-foreground font-normal">CAS: {sum.chemicalCasNumber}</span>}
                                                            {sum.analysisIds?.map((aid: string) => {
                                                                const detailsForAid = estimateData.details.filter((d) => d.analysisId === aid && d.chemicalSkuId === sum.chemicalSkuId);
                                                                const params = detailsForAid
                                                                    .map((d) => d.parameterName)
                                                                    .filter(Boolean)
                                                                    .join(", ");
                                                                return (
                                                                    <span key={aid} className="text-[10px] text-muted-foreground font-normal bg-muted/30 px-1 rounded">
                                                                        {aid}
                                                                        {params ? ` (${params})` : ""}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
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

                            <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
                                <div className="bg-orange-50/50 border-b border-border px-4 py-2.5 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-semibold text-orange-900">
                                        {t("inventory.chemical.allocateStock.pickingListTitle", { defaultValue: "2. Danh sách đi lấy hàng (Picking List)" })}
                                    </span>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 text-[11px] uppercase text-muted-foreground font-bold">
                                        <tr>
                                            <th className="px-4 py-3 text-left w-[200px]">{t("inventory.chemical.allocateStock.pickingTable.inventoryId", { defaultValue: "Mã chai cần lấy" })}</th>
                                            <th className="px-4 py-3 text-left">{t("inventory.chemical.allocateStock.pickingTable.skuInfo", { defaultValue: "Hóa chất (SKU)" })}</th>
                                            <th className="px-4 py-3 text-right w-[150px]">{t("inventory.chemical.allocateStock.pickingTable.pickQty", { defaultValue: "Số lượng lấy" })}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {allocateData.pickingList.map((pick: any, idx: number) => {
                                            const chemName = pick.chemicalName || pick.chemicalSkuId;
                                            const relatedDetail = allocateData.transactionDetails.find((tx) => tx.chemicalSkuId === pick.chemicalSkuId);
                                            const unit = relatedDetail?.chemicalTransactionBlockDetailUnit || "";

                                            return (
                                                <tr key={idx} className="hover:bg-muted/5">
                                                    <td className="px-4 py-4 align-middle">
                                                        <div className="inline-flex items-center px-2 py-1 rounded-full bg-muted border border-border/50 text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-tighter">
                                                            {pick.chemicalInventoryId}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="font-bold text-sm text-foreground leading-tight">{chemName}</div>
                                                        <div className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">{pick.chemicalSkuId}</div>
                                                        {pick.analysisIds && pick.analysisIds.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                                {pick.analysisIds.map((aid: string) => (
                                                                    <span
                                                                        key={aid}
                                                                        className="bg-primary/5 text-primary border border-primary/10 rounded px-1.5 py-0.5 text-[9px] font-mono font-medium"
                                                                    >
                                                                        #{aid}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right align-middle">
                                                        <div className="flex items-center justify-end font-bold text-sm text-emerald-600 dark:text-emerald-400 gap-1.5">
                                                            <span className="text-muted-foreground/30 text-[10px] font-normal">→</span>
                                                            {Math.abs(pick.totalChangeQty)}
                                                            {unit && <span className="font-medium text-muted-foreground text-[10px] ml-0.5">{unit}</span>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
                                <Button variant="ghost" onClick={onClose} type="button">
                                    {t("common.close", { defaultValue: "Đóng" })}
                                </Button>
                                <Button variant="success" onClick={onClose} className="font-semibold">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {t("inventory.chemical.allocateStock.confirmAndAssign", { defaultValue: "Xác nhận xuất kho & Gán chỉ tiêu" })}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
