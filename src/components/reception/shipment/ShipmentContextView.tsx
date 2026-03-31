import type { ReceiptDetail, ReceiptSample } from "@/types/receipt";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, File, ListTree } from "lucide-react";

interface Props {
    receipt: ReceiptDetail;
}

export default function ShipmentContextView({ receipt }: Props) {
    const { t } = useTranslation();

    return (
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
                <CardContent className="pt-6">
                    {/* Placeholder for actual documents list from backend - usually from a relations endpoint */}
                    <div className="text-sm text-muted-foreground bg-accent/30 p-8 rounded-md border border-dashed border-muted text-center flex flex-col items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-muted-foreground/50 mb-2" />
                        <p className="font-medium text-foreground/80">Chưa có kết quả PDF nào được đính kèm</p>
                        <p className="text-xs">Sẽ hiển thị danh sách file báo cáo để KTV bốc hàng in và gửi đi.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
