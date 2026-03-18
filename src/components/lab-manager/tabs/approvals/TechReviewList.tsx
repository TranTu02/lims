import { useEffect, useState } from "react";
import { Eye, CheckCircle2, XCircle, AlertCircle, FileCheck, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLabApprovals } from "../../hooks/useLabApprovals";
import { AnalysisReviewModal } from "../../modals/AnalysisReviewModal";
import type { Analysis } from "../../hooks/useLabApprovals";
import { toast } from "sonner";
import { getTopAnalysisMarks } from "@/lib/utils";
import { DocumentPreviewButton } from "@/components/document/DocumentPreviewButton";

export function TechReviewList() {
    const { loading, techReview, fetchTechReview, changeStatus } = useLabApprovals();
    
    const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchTechReview();
    }, [fetchTechReview]);

    const handleView = (analysis: Analysis) => {
        setSelectedAnalysis(analysis);
        setModalOpen(true);
    };

    const handleQuickApprove = async (analysisId: string) => {
        setProcessing(true);
        const success = await changeStatus(analysisId, "Approved");
        if (success) {
            await fetchTechReview();
        }
        setProcessing(false);
    };

    const handleModalApprove = async (analysisId: string) => {
        setProcessing(true);
        const success = await changeStatus(analysisId, "Approved");
        if (success) {
            setModalOpen(false);
            await fetchTechReview();
        }
        setProcessing(false);
    };

    const handleModalReject = async (analysisId: string, reason: string) => {
        if (!reason.trim()) {
            toast.warning("Vui lòng nhập lý do trả lại soát xét");
            return;
        }
        setProcessing(true);
        const success = await changeStatus(analysisId, "DataEntered", { reviewerNotes: reason });
        if (success) {
            setModalOpen(false);
            await fetchTechReview();
        }
        setProcessing(false);
    };

    return (
        <div className="bg-background rounded-lg border border-border flex flex-col min-h-0 h-full">
            <div className="p-4 border-b border-border bg-emerald-50/50 shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-emerald-600" />
                        Chỉ tiêu chờ duyệt (TechReview)
                    </h2>
                    <p className="text-sm text-emerald-700/80">Cần QA / Quản lý Lab duyệt chốt kết quả cuối cùng</p>
                </div>
                <Badge variant="default" className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-700">
                    {techReview.length} chỉ tiêu
                </Badge>
            </div>

            <div className="flex-1 overflow-auto bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-medium border-b border-border">Mã phiếu / Mã mẫu</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Chỉ tiêu / Phương pháp</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Kết quả</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Biên bản</th>
                            <th className="px-4 py-3 font-medium border-b border-border">KTV & Thời gian</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Marks</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {techReview.map((item) => (
                            <tr key={item.analysisId} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 align-top">
                                    <div className="font-semibold text-foreground">{item.receiptId}</div>
                                    <div className="text-muted-foreground mt-0.5">{item.sampleId}</div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="font-medium text-foreground">{item.parameterName}</div>
                                    <div className="text-muted-foreground text-xs mt-0.5 px-2 py-0.5 bg-muted rounded-md w-fit">{item.protocolCode}</div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="font-mono text-base font-bold text-primary">
                                        {item.resultValue} <span className="text-xs font-sans text-muted-foreground">{item.resultUnit}</span>
                                    </div>
                                    <div className="mt-1">
                                        {item.analysisResultStatus === "pass" ? (
                                            <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Đạt</Badge>
                                        ) : item.analysisResultStatus === "fail" ? (
                                            <Badge variant="destructive" className="text-[10px] h-5"><XCircle className="h-3 w-3 mr-1" /> K.Đạt</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-[10px] h-5"><AlertCircle className="h-3 w-3 mr-1" /> K.ĐG</Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    {item.labTestFileId ? (
                                        <div className="flex flex-col gap-1 group" title="Đã có biên bản lưu trữ">
                                            <FileCheck className="h-5 w-5 text-emerald-500" />
                                            <span className="text-[10px] text-emerald-600 font-medium">Đã cập nhật</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1" title="Chưa có biên bản">
                                            <FileX className="h-5 w-5 text-muted-foreground opacity-50" />
                                            <span className="text-[10px] text-muted-foreground">Chưa có</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                    <div className="font-medium text-foreground">{item.technicianName} ({item.technicianAlias || "?"})</div>
                                    <div className="mt-1">
                                        {new Date(item.submitLastResultAt).toLocaleDateString("vi-VN")} {new Date(item.submitLastResultAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="flex flex-wrap gap-1">
                                        {getTopAnalysisMarks(item.analysisMarks).map((m) => (
                                            <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-4 py-3 align-top">
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => handleView(item)}
                                            title="Xem / Đánh giá chi tiết"
                                            className="h-8 w-8 p-0"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {item.analysisDocumentId && (
                                            <DocumentPreviewButton documentId={item.analysisDocumentId} variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-600/10 p-0" />
                                        )}
                                        <Button 
                                            size="sm" 
                                            variant="default" 
                                            onClick={() => handleQuickApprove(item.analysisId)}
                                            disabled={processing}
                                            title="Duyệt kết quả (Approved)"
                                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Duyệt
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {techReview.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground bg-muted/10">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
                                        <p>Không có chỉ tiêu nào đang chờ duyệt.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        
                        {loading && techReview.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {selectedAnalysis && (
                <AnalysisReviewModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    analysis={selectedAnalysis}
                    mode="TechReview"
                    onApprove={handleModalApprove}
                    onReject={handleModalReject}
                    loading={processing}
                />
            )}
        </div>
    );
}
