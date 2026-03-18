import { useEffect, useState } from "react";
import { Eye, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLabApprovals } from "../../hooks/useLabApprovals";
import { AnalysisReviewModal } from "../../modals/AnalysisReviewModal";
import type { Analysis } from "../../hooks/useLabApprovals";
import { toast } from "sonner";
import { getTopAnalysisMarks } from "@/lib/utils";
import { DocumentPreviewButton } from "@/components/document/DocumentPreviewButton";

export function DataEnteredList() {
    const { loading, dataEntered, fetchDataEntered, changeStatus } = useLabApprovals();
    
    const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDataEntered();
    }, [fetchDataEntered]);

    const handleView = (analysis: Analysis) => {
        setSelectedAnalysis(analysis);
        setModalOpen(true);
    };

    const handleQuickApprove = async (analysisId: string) => {
        setProcessing(true);
        const success = await changeStatus(analysisId, "TechReview");
        if (success) {
            await fetchDataEntered();
        }
        setProcessing(false);
    };

    const handleModalApprove = async (analysisId: string) => {
        setProcessing(true);
        const success = await changeStatus(analysisId, "TechReview");
        if (success) {
            setModalOpen(false);
            await fetchDataEntered();
        }
        setProcessing(false);
    };

    const handleModalReject = async (analysisId: string, reason: string) => {
        if (!reason.trim()) {
            toast.warning("Vui lòng nhập lý do từ chối (trả lại trạng thái Testing)");
            return;
        }
        setProcessing(true);
        const success = await changeStatus(analysisId, "Testing", { retestReason: reason });
        if (success) {
            setModalOpen(false);
            await fetchDataEntered();
        }
        setProcessing(false);
    };

    return (
        <div className="bg-background rounded-lg border border-border shadow-sm flex flex-col min-h-0 h-full">
            <div className="p-4 border-b border-border bg-muted/20 shrink-0 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Chỉ tiêu đã nhập kết quả sơ bộ
                    </h2>
                    <p className="text-sm text-muted-foreground">Cần Leader / Giám sát xem lại kỹ thuật trước khi trình QA</p>
                </div>
                <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
                    {dataEntered.length} chỉ tiêu
                </Badge>
            </div>

            <div className="flex-1 overflow-auto bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-medium border-b border-border">Mã phiếu / Mã mẫu</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Chỉ tiêu / Phương pháp</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Kết quả</th>
                            <th className="px-4 py-3 font-medium border-b border-border">KTV thực hiện</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Thời gian</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Marks</th>
                            <th className="px-4 py-3 font-medium border-b border-border">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {dataEntered.map((item) => (
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
                                    <div className="font-medium">{item.technicianName}</div>
                                    <div className="text-xs text-muted-foreground">({item.technicianAlias || "?"})</div>
                                </td>
                                <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                                    {new Date(item.submitLastResultAt).toLocaleDateString("vi-VN")}
                                    <br />
                                    {new Date(item.submitLastResultAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
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
                                            variant="outline" 
                                            onClick={() => handleQuickApprove(item.analysisId)}
                                            disabled={processing}
                                            title="Duyệt nhanh lên QA"
                                            className="h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                        >
                                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Duyệt
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {dataEntered.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground bg-muted/10">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
                                        <p>Không có chỉ tiêu nào đang chờ soát xét.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        
                        {loading && dataEntered.length === 0 && (
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
                    mode="DataEntered"
                    onApprove={handleModalApprove}
                    onReject={handleModalReject}
                    loading={processing}
                />
            )}
        </div>
    );
}
