import { X, RefreshCw } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { useIncomingRequestDetail } from "@/api/incomingRequests";
import type { IncomingRequestDetail } from "@/types/incomingRequest";

interface Props {
    requestId: string;
    onClose: () => void;
}

export function IncomingRequestDetailModal({ requestId, onClose }: Props) {
    const { data: detailData, isLoading, isError, refetch, isFetching } = useIncomingRequestDetail(requestId);

    const request = (detailData?.data ?? detailData) as IncomingRequestDetail | undefined;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[80] transition-opacity" onClick={onClose} />
            <div
                className="fixed inset-4 bg-background rounded-xl shadow-2xl z-[80] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 border-b border-border bg-muted/10">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            Chi tiết yêu cầu: <span className="text-primary">{requestId}</span>
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">Xem thông tin chi tiết yêu cầu tiếp nhận từ khách hàng</p>
                    </div>
                    <div className="flex items-center gap-2 mt-4 sm:mt-0">
                        {request?.incomingStatus && (
                            <Badge variant={request.incomingStatus === "New" ? "default" : request.incomingStatus === "Converted" ? "outline" : "secondary"} className="h-7 px-3 text-sm">
                                {String(request.incomingStatus)}
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="h-8 w-8 rounded-full"
                            title="Làm mới"
                        >
                            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading && (
                        <div className="animate-pulse space-y-6">
                            <div className="h-24 bg-muted/60 rounded-xl"></div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="h-40 bg-muted/60 rounded-xl"></div>
                                <div className="h-40 bg-muted/60 rounded-xl"></div>
                            </div>
                            <div className="h-64 bg-muted/60 rounded-xl"></div>
                        </div>
                    )}
                    {isError && (
                        <div className="flex items-center justify-center h-40 bg-destructive/10 border border-destructive/20 rounded-xl">
                            <div className="text-destructive font-medium">Lỗi khi tải chi tiết yêu cầu. Vui lòng thử lại.</div>
                        </div>
                    )}

                    {!isLoading && !isError && request && (
                        <div className="space-y-6">
                            {/* Tổng quan - Top section */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/20 border border-border">
                                <div>
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Khách hàng</Label>
                                    <div className="mt-1.5 font-medium text-foreground">{String(request.client?.clientName || request.clientId || "-")}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Phụ trách (NVKD)</Label>
                                    <div className="mt-1.5 font-medium text-foreground">{String((request as any).salePerson?.identityName || request.salePersonId || request.salePerson || "-")}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Mã đơn hàng liên kết</Label>
                                    <div className="mt-1.5 font-medium text-foreground">{String(request.orderId || request.linkedOrderId || "-")}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Ngày tạo</Label>
                                    <div className="mt-1.5 font-medium text-foreground">{request.createdAt ? new Date(String(request.createdAt)).toLocaleString("vi-VN") : "-"}</div>
                                </div>
                            </div>

                            {/* Thông tin liên hệ & Nội dung */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Cột trái: Nguồn, Người gửi, Người liên hệ */}
                                <div className="lg:col-span-1 space-y-6">
                                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                                        <div className="px-4 py-3 bg-muted/30 border-b border-border font-medium text-foreground">Thông tin người gửi & Liên hệ</div>
                                        <div className="p-4 space-y-4 text-sm">
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Nguồn gửi</div>
                                                <div className="font-medium">{String(request.senderInfo?.source || "-")}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Tên người gửi (Sender)</div>
                                                <div className="font-medium">{String(request.senderInfo?.name || "-")}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Email / Phone (Sender)</div>
                                                <div className="font-medium truncate">
                                                    {String(request.senderInfo?.email || "-")} / {String(request.senderInfo?.phone || "-")}
                                                </div>
                                            </div>

                                            <div className="pt-3 mt-3 border-t border-border border-dashed">
                                                <div className="text-xs text-muted-foreground mb-1">Người liên hệ (Contact Person)</div>
                                                <div className="font-medium">{String(request.contactPerson?.contactName || "-")}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Email / Phone (Contact)</div>
                                                <div className="font-medium truncate">
                                                    {String(request.contactPerson?.contactEmail || "-")} / {String(request.contactPerson?.contactPhone || "-")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                                        <div className="px-4 py-3 bg-muted/30 border-b border-border font-medium text-foreground">Thông tin nhận Báo cáo / Hóa đơn</div>
                                        <div className="p-4 space-y-4 text-sm">
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Tên người nhận báo cáo</div>
                                                <div className="font-medium">{String(request.reportRecipient?.receiverName || "-")}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Địa chỉ nhận</div>
                                                <div className="font-medium line-clamp-2">{String(request.reportRecipient?.receiverAddress || "-")}</div>
                                            </div>
                                            <div className="pt-3 mt-3 border-t border-border border-dashed">
                                                <div className="text-xs text-muted-foreground mb-1">Hóa đơn: Mã số thuế</div>
                                                <div className="font-medium">{String(request.client?.invoiceInfo?.taxCode || "-")}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground mb-1">Hóa đơn: Tên / Địa chỉ</div>
                                                <div className="font-medium line-clamp-2">
                                                    {request.client?.invoiceInfo?.taxName ? `${request.client.invoiceInfo.taxName} - ` : ""}
                                                    {String(request.client?.invoiceInfo?.taxAddress || "-")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Cột phải: Nội dung, Finances, Mẫu */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Nội dung yêu cầu */}
                                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                                        <div className="px-4 py-3 bg-muted/30 border-b border-border font-medium text-foreground">Nội dung yêu cầu</div>
                                        <div className="p-4">
                                            <p className="text-sm whitespace-pre-wrap text-foreground/90 leading-relaxed bg-muted/10 p-4 rounded-lg border border-border/50">
                                                {request.requestContent || <span className="italic text-muted-foreground">Không có nội dung chi tiết.</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Financial Summary */}
                                    {(request.totalAmount || request.totalFeeBeforeTax) && (
                                        <div className="border border-border rounded-xl bg-card overflow-hidden">
                                            <div className="px-4 py-3 bg-muted/30 border-b border-border font-medium text-foreground">Thông tin phí dự kiến</div>
                                            <div className="p-4">
                                                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Phân tích trước thuế (VND)</div>
                                                        <div className="font-semibold text-foreground text-base">{Number(request.totalFeeBeforeTax || 0).toLocaleString("vi-VN")}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Chiết khấu ({request.discountRate || 0}%)</div>
                                                        <div className="font-semibold text-warning text-base">- {Number(request.totalDiscountValue || 0).toLocaleString("vi-VN")}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Thuế VAT ({request.taxRate || 0}%)</div>
                                                        <div className="font-semibold text-muted-foreground text-base">+ {Number(request.totalTaxValue || 0).toLocaleString("vi-VN")}</div>
                                                    </div>
                                                    <div className="pt-2 sm:pt-0 sm:border-l sm:border-border sm:pl-8">
                                                        <div className="text-xs text-muted-foreground mb-1">Tổng cộng (VND)</div>
                                                        <div className="font-bold text-primary text-xl">{Number(request.totalAmount || 0).toLocaleString("vi-VN")}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Samples and Analyses */}
                                    <div className="border border-border rounded-xl bg-card overflow-hidden">
                                        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                                            <span className="font-medium text-foreground">Danh sách mẫu và chỉ tiêu ({request.samples?.length || 0} mẫu)</span>
                                        </div>

                                        <div className="p-4">
                                            {(request.samples?.length ?? 0) === 0 ? (
                                                <div className="text-center py-6 text-sm text-muted-foreground italic bg-muted/20 border border-dashed rounded-lg">Không có mẫu nào trong yêu cầu.</div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {request.samples?.map((s: any, idx: number) => (
                                                        <div key={s.sampleId || idx} className="border border-border rounded-lg bg-background overflow-hidden shadow-sm">
                                                            <div className="px-4 py-2.5 bg-blue-50/50 dark:bg-blue-950/20 border-b border-border flex flex-wrap items-center justify-between gap-2">
                                                                <div className="font-semibold text-sm text-primary flex items-center gap-2">
                                                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/20 text-xs">M{idx + 1}</span>
                                                                    {s.sampleName || "-"}
                                                                </div>
                                                                <Badge variant="outline" className="text-xs bg-background">
                                                                    Loại: {s.sampleTypeName || s.sampleTypeId || "-"}
                                                                </Badge>
                                                            </div>

                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead className="text-xs text-muted-foreground text-left bg-muted/20">
                                                                        <tr>
                                                                            <th className="font-medium py-2 px-4 border-b border-border/50">Tên Chỉ tiêu / Parameter</th>
                                                                            <th className="font-medium py-2 px-4 border-b border-border/50">Mã phương pháp</th>
                                                                            <th className="font-medium py-2 px-4 border-b border-border/50 text-right">Phí (Tr.Thuế)</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-border/50">
                                                                        {(s.analyses?.length ?? 0) === 0 ? (
                                                                            <tr>
                                                                                <td colSpan={3} className="py-3 px-4 text-center text-muted-foreground italic text-xs">
                                                                                    Chưa xác định chỉ tiêu
                                                                                </td>
                                                                            </tr>
                                                                        ) : (
                                                                            s.analyses?.map((a: any, i: number) => (
                                                                                <tr key={i} className="hover:bg-muted/10 transition-colors">
                                                                                    <td className="py-2.5 px-4 font-medium">{a.parameterName || a.matrixId || "-"}</td>
                                                                                    <td className="py-2.5 px-4 text-muted-foreground">{a.protocolCode || "-"}</td>
                                                                                    <td className="py-2.5 px-4 text-right text-muted-foreground">
                                                                                        {Number(a.feeBeforeTax || 0).toLocaleString("vi-VN")}
                                                                                    </td>
                                                                                </tr>
                                                                            ))
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-border px-6 py-4 flex justify-end bg-muted/10">
                    <Button onClick={onClose} className="px-6">
                        Đóng
                    </Button>
                </div>
            </div>
        </>,
        document.body,
    );
}
