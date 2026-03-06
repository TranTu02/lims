// src/components/reception/FastConvertModal.tsx
// Modal xác nhận trước khi chuyển đổi IncomingRequest → Receipt (full: receipt + samples + analyses)

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Zap, Package, FlaskConical, X, Calendar, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useIncomingRequestConvert } from "@/api/incomingRequests";
import type { IncomingRequestListItem } from "@/types/incomingRequest";
import type { ReceiptsCreateFullBody } from "@/types/receipt";

// ── Props ────────────────────────────────────────────────────────────────────
interface FastConvertModalProps {
    request: IncomingRequestListItem;
    onClose: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export function FastConvertModal({ request, onClose }: FastConvertModalProps) {
    const { t } = useTranslation();
    const convertMutation = useIncomingRequestConvert();

    // Form state
    const [receiptDate, setReceiptDate] = useState(() => {
        return new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
    });
    const [receiptDeadline, setReceiptDeadline] = useState("");
    const [receiptNote, setReceiptNote] = useState("");

    // Computed stats
    const sampleCount = useMemo(() => {
        return Array.isArray(request.samples) ? request.samples.length : 0;
    }, [request.samples]);

    const analysisCount = useMemo(() => {
        if (!Array.isArray(request.samples)) return 0;
        return request.samples.reduce((sum, s) => sum + (Array.isArray(s.analyses) ? s.analyses.length : 0), 0);
    }, [request.samples]);

    // ── Build body for receipts/create/full ───────────────────────────────────
    function buildReceiptBody(): ReceiptsCreateFullBody {
        const body: ReceiptsCreateFullBody = {
            receiptStatus: "Received",
            receiptDate: receiptDate ? new Date(receiptDate).toISOString() : new Date().toISOString(),

            client: request.client
                ? {
                      clientId: request.client.clientId ?? null,
                      clientName: request.client.clientName ?? null,
                  }
                : null,

            samples: Array.isArray(request.samples)
                ? request.samples.map((s) => ({
                      sampleName: s.sampleName ?? null,
                      sampleTypeId: s.sampleTypeId ?? null,
                      sampleTypeName: s.sampleTypeName ?? undefined,
                      analyses: Array.isArray(s.analyses)
                          ? s.analyses.map((a) => ({
                                matrixId: a.matrixId ?? null,
                                parameterName: a.parameterName ?? undefined,
                                parameterId: a.parameterId ?? undefined,
                            }))
                          : null,
                  }))
                : null,
        };

        // Optional fields
        if (receiptDeadline) {
            (body as Record<string, unknown>).receiptDeadline = new Date(receiptDeadline).toISOString();
        }
        if (receiptNote.trim()) {
            (body as Record<string, unknown>).receiptNote = receiptNote.trim();
        }
        if (request.orderId) {
            (body as Record<string, unknown>).orderId = request.orderId;
        }
        if (request.clientId) {
            (body as Record<string, unknown>).clientId = request.clientId;
        }
        if (request.contactPerson) {
            (body as Record<string, unknown>).contactPerson = request.contactPerson;
        }
        if (request.reportRecipient) {
            (body as Record<string, unknown>).reportRecipient = request.reportRecipient;
        }

        return body;
    }

    const handleConvert = () => {
        convertMutation.mutate(
            {
                receiptBody: buildReceiptBody() as unknown as Record<string, unknown>,
                requestId: request.requestId,
            },
            {
                onSuccess: () => onClose(),
            },
        );
    };

    const isSubmitting = convertMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
                {/* ── Header ───────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15">
                            <Zap className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-foreground">{String(t("reception.incomingRequests.convertModal.title", { defaultValue: "Tạo Phiếu Tiếp Nhận Nhanh" }))}</h2>
                            <p className="text-xs text-muted-foreground">{request.requestId}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* ── Content ──────────────────────────────────────────── */}
                <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-background border border-border rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">{String(t("reception.incomingRequests.convertModal.client", { defaultValue: "Khách hàng" }))}</div>
                            <div className="text-sm font-medium text-foreground line-clamp-1">{request.client?.clientName ?? request.senderInfo?.senderName ?? "-"}</div>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                <Package className="h-3 w-3" />
                                {String(t("reception.incomingRequests.convertModal.sampleCount", { defaultValue: "Số mẫu" }))}
                            </div>
                            <div className="text-xl font-bold text-foreground">{sampleCount}</div>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                                <FlaskConical className="h-3 w-3" />
                                {String(t("reception.incomingRequests.convertModal.analysisCount", { defaultValue: "Số chỉ tiêu" }))}
                            </div>
                            <div className="text-xl font-bold text-foreground">{analysisCount}</div>
                        </div>
                    </div>

                    {/* Sample Preview List */}
                    {Array.isArray(request.samples) && request.samples.length > 0 ? (
                        <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">{String(t("reception.incomingRequests.convertModal.willCreate", { defaultValue: "Sẽ tạo:" }))}</div>
                            {request.samples.map((s, i) => (
                                <div key={i} className="flex items-center justify-between bg-background border border-border rounded-md px-3 py-1.5">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-xs font-medium text-foreground">{s.sampleName ?? `Sample ${i + 1}`}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] gap-0.5">
                                        <FlaskConical className="h-2.5 w-2.5" />
                                        {Array.isArray(s.analyses) ? s.analyses.length : 0} {String(t("reception.incomingRequests.convertModal.tests", { defaultValue: "phép thử" }))}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-3">
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                            <p className="text-xs text-warning">
                                {String(t("reception.incomingRequests.convertModal.noSamples", { defaultValue: "Yêu cầu này chưa có thông tin mẫu. Không thể tạo phiếu nhanh." }))}
                            </p>
                        </div>
                    )}

                    {/* Receipt Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <Calendar className="h-3 w-3" />
                                {String(t("lab.receipts.receiptDate", { defaultValue: "Ngày nhận mẫu" }))}
                            </Label>
                            <Input type="datetime-local" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} className="h-8 text-xs bg-background" />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <Calendar className="h-3 w-3" />
                                {String(t("lab.receipts.receiptDeadline", { defaultValue: "Hạn trả kết quả" }))}
                            </Label>
                            <Input type="datetime-local" value={receiptDeadline} onChange={(e) => setReceiptDeadline(e.target.value)} className="h-8 text-xs bg-background" />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">{String(t("lab.receipts.receiptNote", { defaultValue: "Ghi chú nhận mẫu" }))}</Label>
                        <Input
                            value={receiptNote}
                            onChange={(e) => setReceiptNote(e.target.value)}
                            placeholder={String(t("common.placeholder.enterValue", { defaultValue: "Nhập giá trị..." }))}
                            className="h-8 text-xs bg-background"
                        />
                    </div>
                </div>

                {/* ── Footer ───────────────────────────────────────────── */}
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/20">
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
                        {String(t("common.cancel", { defaultValue: "Hủy" }))}
                    </Button>
                    <Button variant="default" size="sm" className="gap-1.5" disabled={isSubmitting || sampleCount === 0} onClick={handleConvert}>
                        <Zap className="h-3.5 w-3.5" />
                        {isSubmitting ? String(t("common.saving", { defaultValue: "Đang lưu" })) : String(t("reception.incomingRequests.convertModal.submit", { defaultValue: "Tạo phiếu tiếp nhận" }))}
                    </Button>
                </div>
            </div>
        </div>
    );
}
