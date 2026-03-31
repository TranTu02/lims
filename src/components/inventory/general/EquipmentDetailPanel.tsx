import { useTranslation } from "react-i18next";
import { Loader2, X, Archive, MapPin, Tag, Wrench, Calendar, Info, FileText, Eye, History, Activity, AlertTriangle, CheckCircle2, PenLine } from "lucide-react";

import { useLabInventory } from "@/api/generalInventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { documentApi } from "@/api/documents";
import { useState } from "react";
import { DocumentPreviewModal, type PreviewType } from "@/components/document/DocumentPreviewModal";
import { Separator } from "@/components/ui/separator";

function DocumentItem({ doc }: { doc: any }) {
    const { t } = useTranslation();
    const [urlLoading, setUrlLoading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<PreviewType>(null);

    const title = doc.jsonContent?.documentTitle || doc.documentTitle || doc.file?.fileName || doc.documentId;
    const status = doc.jsonContent?.documentStatus || doc.documentStatus;
    const keys = doc.jsonContent?.commonKeys || doc.commonKeys;

    const handlePreview = async () => {
        setUrlLoading(true);
        try {
            const res = await documentApi.url(doc.documentId);
            const urlData = (res as any).data ?? res;
            const url = urlData?.url;
            if (!url) throw new Error("No URL returned");

            const lower = url.toLowerCase().split("?")[0];
            if (lower.endsWith(".docx") || lower.endsWith(".xlsx") || lower.endsWith(".pptx") || lower.endsWith(".doc") || lower.endsWith(".xls") || lower.endsWith(".ppt")) {
                setPreviewType("office");
                setPreviewUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`);
            } else if (lower.endsWith(".pdf")) {
                setPreviewType("pdf");
                setPreviewUrl(url);
            } else {
                setPreviewType("image");
                setPreviewUrl(url);
            }
            setPreviewOpen(true);
        } catch {
            window.open(`/api/v2/documents/get/url?id=${doc.documentId}`, "_blank");
        } finally {
            setUrlLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-all gap-2 group">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate flex-1" title={title}>
                        {title}
                    </span>
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" disabled={urlLoading} onClick={handlePreview}>
                        {urlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                </div>
                {(keys && keys.length > 0) || status ? (
                    <div className="flex items-center justify-between pl-10">
                        <div className="flex items-center gap-2 flex-wrap">
                            {keys && keys.slice(0, 2).map((k: string) => (
                                <span key={k} className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded uppercase">{k}</span>
                            ))}
                            {status && (
                                <Badge variant="outline" className="text-[9px] h-4 min-h-0 bg-background py-0 uppercase">
                                    {status}
                                </Badge>
                            )}
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono">{doc.documentId}</span>
                    </div>
                ) : null}
            </div>
            <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} previewUrl={previewUrl} previewType={previewType} previewFileName={title} />
        </>
    );
}

function LogItem({ log }: { log: any }) {
    const getIcon = () => {
        switch (log.logType) {
            case "Usage": return <Activity className="h-3 w-3 text-blue-500" />;
            case "Calibration": return <Wrench className="h-3 w-3 text-amber-500" />;
            case "Maintenance": return <CheckCircle2 className="h-3 w-3 text-green-500" />;
            case "Repair": return <AlertTriangle className="h-3 w-3 text-destructive" />;
            default: return <History className="h-3 w-3 text-muted-foreground" />;
        }
    };

    const getBg = () => {
        switch (log.logType) {
            case "Usage": return "bg-blue-500/10 border-blue-500/20";
            case "Calibration": return "bg-amber-500/10 border-amber-500/20";
            case "Maintenance": return "bg-green-500/10 border-green-500/20";
            case "Repair": return "bg-destructive/10 border-destructive/20";
            default: return "bg-muted/30 border-border";
        }
    };

    return (
        <div className="relative pl-6 pb-6 last:pb-0">
            {/* Timeline Line */}
            <div className="absolute left-[9px] top-0 bottom-0 w-[2px] bg-border last:bg-transparent" />
            
            {/* Timeline Dot */}
            <div className={`absolute left-0 top-1 h-[20px] w-[20px] rounded-full border-2 flex items-center justify-center bg-background z-10 transition-colors ${getBg()}`}>
                {getIcon()}
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{log.logType}</span>
                    <span className="text-[10px] text-muted-foreground">{log.actionTime ? log.actionTime.split("T")[0] : ""}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    {log.logDescription}
                </p>
                {log.logLocation && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="h-2.5 w-2.5" />
                        {log.logLocation}
                    </div>
                )}
            </div>
        </div>
    );
}

type Props = {
    labInventoryId: string | null;
    onClose: () => void;
    onEdit?: (item: any) => void;
};

export function EquipmentDetailPanel({ labInventoryId, onClose, onEdit }: Props) {
    const { t } = useTranslation();
    const { data: item, isLoading, isError } = useLabInventory(labInventoryId);

    if (!labInventoryId) return null;

    return (
        <div className="w-[450px] shrink-0 bg-background border border-border rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-500 h-[calc(100vh-140px)] m-2 mr-0">
            {/* Header with Background Pattern */}
            <div className="relative overflow-hidden bg-primary/5 px-6 py-6 border-b border-border">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Archive size={120} />
                </div>
                
                <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <Badge variant={item?.labInventoryStatus === "Ready" ? "default" : "secondary"} className="rounded-full px-3">
                                {item?.labInventoryStatus || "Ready"}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                                {labInventoryId}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground truncate">
                            {item?.labSkuName || "---"}
                        </h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-background/80">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm font-medium">Tải dữ liệu...</span>
                    </div>
                )}
                {isError && (
                    <div className="flex flex-col items-center justify-center h-64 gap-3 text-destructive p-6 text-center">
                        <AlertTriangle className="h-8 w-8" />
                        <span className="text-sm font-medium">{String(t("common.error"))}</span>
                    </div>
                )}
                
                {!isLoading && !isError && item && (
                    <div className="p-6 space-y-8">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-2 group hover:border-primary/20 transition-all">
                                <MapPin className="h-4 w-4 text-primary" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vị trí đặt</p>
                                    <p className="text-sm font-semibold truncate leading-tight">{item.labInventoryLocation || "Chưa xác định"}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-2 group hover:border-primary/20 transition-all">
                                <Tag className="h-4 w-4 text-primary" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mã tài sản</p>
                                    <p className="text-sm font-mono font-semibold truncate leading-tight">{item.labInventoryCode || "---"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tech Specs */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold uppercase tracking-wide">Thông tin kỹ thuật</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-4 bg-muted/10 p-4 rounded-2xl border border-border/50">
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Hãng sản xuất</p>
                                        <p className="text-xs font-medium">{item.labSkuManufacturer || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Model</p>
                                        <p className="text-xs font-mono font-medium">{item.labSkuModel || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Số Serial</p>
                                        <p className="text-xs font-mono font-medium">{item.labInventorySerial || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Ngày nhập kho</p>
                                        <p className="text-xs font-medium">{item.labInventoryImportDate ? item.labInventoryImportDate.split("T")[0] : "-"}</p>
                                    </div>
                                </div>

                                {item.labSkuSpecifications && Object.keys(item.labSkuSpecifications).length > 0 && (
                                    <>
                                        <Separator className="bg-border/50" />
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(item.labSkuSpecifications).map(([k, v]) => (
                                                <div key={k} className="space-y-0.5">
                                                    <p className="text-[10px] text-muted-foreground font-bold capitalize">{k}</p>
                                                    <p className="text-xs font-medium">{String(v)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Calibration & Maintenance */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold uppercase tracking-wide">Bảo trì & Hiệu chuẩn</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl border border-border/50 bg-muted/10">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Hạn bảo hành</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-amber-500" />
                                        <span className="text-xs font-semibold">{item.labInventoryWarrantyExpiryDate ? item.labInventoryWarrantyExpiryDate.split("T")[0] : "N/A"}</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl border border-border/50 bg-muted/10">
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Hiệu chuẩn tới</p>
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-3 w-3 text-blue-500" />
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{item.labInventoryNextCalibrationDate ? item.labInventoryNextCalibrationDate.split("T")[0] : "---"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <h4 className="text-sm font-bold uppercase tracking-wide">Tài liệu đính kèm</h4>
                            </div>
                            {(() => {
                                const attachments = item.documents || item.labInventoryDocuments;
                                if (attachments && attachments.length > 0) {
                                    return (
                                        <div className="grid grid-cols-1 gap-2">
                                            {attachments.map((doc: any, idx: number) => (
                                                <DocumentItem key={doc.documentId || idx} doc={doc} />
                                            ))}
                                        </div>
                                    );
                                }
                                return (
                                    <div className="p-6 rounded-2xl border border-dashed border-border bg-muted/5 text-center space-y-2">
                                        <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                                        <p className="text-xs text-muted-foreground italic">Không có tài liệu đính kèm</p>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Recent Activity Logs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <History className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-wide">Nhật ký hoạt động</h4>
                                </div>
                                {item.activityLogs && item.activityLogs.length > 5 && (
                                    <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer">Xem tất cả</span>
                                )}
                            </div>
                            <div className="bg-muted/10 p-5 rounded-2xl border border-border/50">
                                {item.activityLogs && item.activityLogs.length > 0 ? (
                                    <div className="space-y-2">
                                        {item.activityLogs.slice(0, 5).map((log: any, idx: number) => (
                                            <LogItem key={log.logId || idx} log={log} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 space-y-2">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto">
                                            <History className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">Chưa có nhật ký hoạt động nào</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Notes */}
                        {item.labInventoryNotes && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <PenLine className="h-4 w-4 text-primary" />
                                    <h4 className="text-sm font-bold uppercase tracking-wide">Ghi chú bổ sung</h4>
                                </div>
                                <div className="p-4 rounded-2xl bg-primary/5 text-xs text-muted-foreground leading-relaxed border border-primary/10">
                                    {item.labInventoryNotes}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Sticky Actions */}
            {onEdit && item && (
                <div className="p-4 border-t border-border bg-background shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.05)]">
                    <Button 
                        variant="default" 
                        className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" 
                        onClick={() => onEdit(item)}
                    >
                        Chỉnh sửa thông tin
                    </Button>
                </div>
            )}
        </div>
    );
}
