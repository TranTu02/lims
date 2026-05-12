import { useState } from "react";
import type { ReceiptDetail, ReceiptSample } from "@/types/receipt";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, File, ListTree, Eye } from "lucide-react";
import { FilePreviewModal } from "@/components/common/FilePreviewModal";

interface Props {
    receipt: ReceiptDetail;
}

export default function ShipmentContextView({ receipt }: Props) {
    const { t } = useTranslation();
    const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string } | null>(null);

    const handlePreview = (doc: any) => {
        setPreviewDoc({ id: String(doc.documentId), title: doc.documentTitle || doc.documentId });
    };

    return (
        <>
            <FilePreviewModal
                documentId={previewDoc?.id ?? null}
                documentTitle={previewDoc?.title}
                onClose={() => setPreviewDoc(null)}
            />

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-primary">
                            {t("common.receipt")}: {receipt.receiptCode}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Khách hàng: <span className="font-medium text-foreground">{receipt.client?.clientName}</span>
                        </p>
                    </div>
                    <Badge
                        variant={["Completed", "Received", "Processing"].includes(receipt.receiptStatus || "") ? "success" : "secondary"}
                        className="text-sm px-3 py-1 uppercase font-bold shadow-sm"
                    >
                        {receipt.receiptStatus}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <Card className="shadow-sm border-muted">
                        <CardHeader className="py-4 border-b bg-muted/40">
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Thông tin tiếp nhận
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-4 text-sm">
                            <div className="flex justify-between items-start border-b pb-2">
                                <span className="text-muted-foreground pt-0.5">Ngày nhận:</span>
                                <span className="font-medium text-right">
                                    {receipt.receiptDate ? format(new Date(receipt.receiptDate), "dd/MM/yyyy HH:mm") : "N/A"}
                                </span>
                            </div>
                            <div className="flex justify-between items-start border-b pb-2">
                                <span className="text-muted-foreground pt-0.5">Ưu tiên:</span>
                                <span className="font-medium text-right">{receipt.receiptPriority || "Bình thường"}</span>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground pt-0.5">Người nhận KQ (gửi hàng):</span>
                                <div className="text-right max-w-[200px]">
                                    <p className="font-semibold text-primary">{receipt.reportRecipient?.receiverName || "Chưa chọn người nhận"}</p>
                                    {receipt.reportRecipient?.receiverPhone && <p className="text-xs">{String(receipt.reportRecipient.receiverPhone)}</p>}
                                    {receipt.reportRecipient?.receiverAddress && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{String(receipt.reportRecipient.receiverAddress)}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-muted flex flex-col">
                        <CardHeader className="py-4 border-b bg-muted/40">
                            <CardTitle className="text-base flex items-center gap-2">
                                <ListTree className="w-4 h-4 text-primary" />
                                Danh sách mẫu kiểm nghiệm
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 flex-1 h-[200px] overflow-y-auto">
                            {receipt.samples && receipt.samples.length > 0 ? (
                                <ul className="space-y-3 text-sm">
                                    {receipt.samples.map((s: ReceiptSample) => (
                                        <li key={s.sampleId} className="flex justify-between items-center group relative hover:bg-muted/50 p-2 rounded-md -mx-2 transition-colors">
                                            <span className="font-medium truncate mr-3" title={s.sampleName || ""}>
                                                {s.sampleName}
                                                {Boolean(s.userSampleId) && <span className="ml-2 text-xs text-muted-foreground font-normal">({String(s.userSampleId)})</span>}
                                            </span>
                                            <Badge variant="outline" className="shrink-0">{s.analyses?.length || 0} HT</Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                                    Không có mẫu nào
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="shadow-sm border-muted">
                    <CardHeader className="py-4 border-b bg-muted/40">
                        <CardTitle className="text-base flex items-center gap-2">
                            <File className="w-4 h-4 text-primary" />
                            Tài liệu / Báo cáo kết quả
                        </CardTitle>
                        <CardDescription>
                            Danh sách các file báo cáo PDF hoặc biểu mẫu đã được phát hành liên quan đến lô mẫu này.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        {/* Receipt Documents Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tài liệu tiếp nhận</span>
                                <div className="h-px flex-1 bg-border/50"></div>
                            </div>
                            {receipt.documents && receipt.documents.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {receipt.documents.map((doc: any) => (
                                        <div
                                            key={doc.documentId}
                                            className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group cursor-pointer"
                                            onClick={() => handlePreview(doc)}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span className="text-xs font-medium truncate" title={doc.documentTitle || doc.documentId}>
                                                    {doc.documentTitle || doc.documentId}
                                                </span>
                                            </div>
                                            <Eye className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-muted-foreground italic px-2">Không có tài liệu tiếp nhận</p>
                            )}
                        </div>

                        {/* Sample Documents Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tài liệu thử nghiệm (Mẫu)</span>
                                <div className="h-px flex-1 bg-border/50"></div>
                            </div>
                            {(() => {
                                const sampleDocs = (receipt.samples || []).flatMap(s =>
                                    (s.documents || []).map(d => ({ ...d, sampleName: s.sampleName }))
                                );
                                if (sampleDocs.length > 0) {
                                    return (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {sampleDocs.map((doc: any, idx) => (
                                                <div
                                                    key={`${doc.documentId}-${idx}`}
                                                    className="flex items-center justify-between p-2 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors group cursor-pointer"
                                                    onClick={() => handlePreview(doc)}
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <File className="w-3.5 h-3.5 text-success shrink-0" />
                                                            <span className="text-xs font-medium truncate" title={doc.documentTitle || doc.documentId}>
                                                                {doc.documentTitle || doc.documentId}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground truncate pl-5 italic">
                                                            Mẫu: {doc.sampleName}
                                                        </span>
                                                    </div>
                                                    <Eye className="w-3 h-3 text-muted-foreground group-hover:text-success transition-colors shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                }
                                return <p className="text-[11px] text-muted-foreground italic px-2">Không có tài liệu thử nghiệm</p>;
                            })()}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
