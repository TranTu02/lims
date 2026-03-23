import { useState } from "react";

import { CheckCircle2, XCircle, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Analysis } from "../hooks/useLabApprovals";

interface AnalysisReviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    analysis: Analysis | null;
    mode: "DataEntered" | "TechReview";
    onApprove: (analysisId: string) => void;
    onReject: (analysisId: string, reason: string) => void;
    loading?: boolean;
}

export function AnalysisReviewModal({ 
    open, 
    onOpenChange, 
    analysis, 
    mode, 
    onApprove, 
    onReject,
    loading = false 
}: AnalysisReviewModalProps) {
    // const { t } = useTranslation();
    const [reason, setReason] = useState("");

    if (!analysis) return null;

    const isDataEntered = mode === "DataEntered";

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setReason("");
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isDataEntered ? "Soát xét kỹ thuật" : "Duyệt chốt (QA / Manager)"}
                    </DialogTitle>
                    <DialogDescription>
                        {analysis.parameterName} - {analysis.protocolCode}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* General Information */}
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4 border border-border">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Mã mẫu</p>
                            <p className="text-sm font-medium">{analysis.sampleId}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Mã phiếu</p>
                            <p className="text-sm font-medium">{analysis.receiptId}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Người thực hiện</p>
                            <p className="text-sm font-medium">{analysis.technicianName} ({analysis.technicianAlias || "?"})</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Thời gian nhập KQ</p>
                            <p className="text-sm font-medium">{new Date(analysis.submitLastResultAt).toLocaleString("vi-VN")}</p>
                        </div>
                    </div>

                    {/* Result Information */}
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Kết quả phân tích
                        </h4>
                        <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-background">
                            <div className="flex-1">
                                <p className="text-3xl font-bold font-mono tracking-tight text-primary">
                                    {analysis.resultValue} <span className="text-lg text-muted-foreground font-sans">{analysis.resultUnit}</span>
                                </p>
                            </div>
                            <div className="border-l border-border pl-4">
                                <p className="text-sm text-muted-foreground mb-1">Cảnh báo</p>
                                {analysis.analysisResultStatus === "pass" ? (
                                    <Badge variant="default" className="bg-emerald-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Đạt</Badge>
                                ) : analysis.analysisResultStatus === "fail" ? (
                                    <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Không đạt</Badge>
                                ) : (
                                    <Badge variant="secondary">Chưa đánh giá</Badge>
                                )}
                            </div>
                        </div>
                        
                        {analysis.analysisNotes && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-md border border-border/50 text-sm">
                                <span className="font-semibold text-muted-foreground block mb-1">Ghi chú của KTV:</span>
                                {analysis.analysisNotes}
                            </div>
                        )}
                        
                        {!isDataEntered && analysis.labTestFileId && (
                            <div className="mt-3 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-medium text-emerald-600">Đã cập nhật biên bản ({analysis.labTestFileId})</span>
                            </div>
                        )}
                    </div>

                    {/* Review Form */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {isDataEntered ? "Lý do trả lại (nếu có)" : "Ghi chú duyệt / trả lại"}
                        </label>
                        <Textarea 
                            placeholder={isDataEntered ? "Bắt buộc nhập nếu từ chối (trả về trạng thái Testing)..." : "Nhập nhận xét QA/Manager..."}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-background resize-none h-24"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                        variant="destructive" 
                        onClick={() => {
                            if (!reason.trim()) {
                                // toast warning if needed, or simply let the handler do it
                            }
                            onReject(analysis.analysisId, reason);
                        }}
                        disabled={loading || !reason.trim()}
                        className="flex-1 sm:flex-none"
                    >
                        <XCircle className="h-4 w-4 mr-2" />
                        {isDataEntered ? "Từ chối (Yêu cầu làm lại)" : "Trả lại soát xét (Về KTV)"}
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={() => onApprove(analysis.analysisId)}
                        disabled={loading}
                        className="flex-1 sm:flex-none"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {isDataEntered ? "Duyệt soát xét (Lên QA)" : "Duyệt chốt KQ (Approved)"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
