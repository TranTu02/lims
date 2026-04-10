import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DATE_FORMAT } from "@/config/constants";
import { useTranslation } from "react-i18next";

export type PreviewType = "pdf" | "image" | "office" | null;

export type DocumentPreviewModalProps = {
    open: boolean;
    onClose: () => void;
    previewUrl: string | null;
    previewType: PreviewType;
    previewFileName: string | null;
    previewDoc?: any | null; // Pass DocumentInfo or similar object to show left pane
};

export function DocumentPreviewModal({ open, onClose, previewUrl, previewType, previewFileName, previewDoc }: DocumentPreviewModalProps) {
    const { t } = useTranslation();

    if (!open || !previewUrl) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={onClose}>
            <div className="bg-background w-[95vw] max-w-none h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            {previewType === "pdf" && <span className="text-xs font-bold text-red-600">PDF</span>}
                            {previewType === "image" && <span className="text-xs font-bold text-blue-600">IMG</span>}
                            {previewType === "office" && <span className="text-xs font-bold text-blue-800">DOC</span>}
                        </div>
                        <h3 className="font-semibold text-foreground truncate" title={previewFileName || ""}>
                            {previewFileName || String(t("documentCenter.preview.title", { defaultValue: "Xem trước tài liệu" }))}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => window.open(previewType === "office" ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl || "")}` : previewUrl || "", "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {String(t("documentCenter.preview.openNew", { defaultValue: "Mở tab mới" }))}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
                {/* Modal Body */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {previewDoc && (
                        <div className="w-full md:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/10 p-5 overflow-y-auto">
                            <h4 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wider">{String(t("documentCenter.preview.infoTitle", { defaultValue: "Thông tin bản ghi" }))}</h4>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.id", { defaultValue: "Mã tài liệu" }))}</div>
                                    <div className="font-mono bg-background px-2 py-1 rounded border shadow-sm text-xs break-all text-muted-foreground">{previewDoc.documentId}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.title", { defaultValue: "Tiêu đề" }))}</div>
                                    <div className="font-medium text-foreground">{previewDoc.documentTitle || previewDoc.jsonContent?.documentTitle || "-"}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.type", { defaultValue: "Loại tài liệu" }))}</div>
                                        <div>{previewDoc.documentType ? <Badge variant="secondary" className="uppercase text-[10px]">{previewDoc.documentType}</Badge> : "-"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.status", { defaultValue: "Trạng thái" }))}</div>
                                        <div>{(previewDoc.documentStatus || previewDoc.jsonContent?.documentStatus) ? <Badge variant="outline" className="text-[10px]">{previewDoc.documentStatus || previewDoc.jsonContent?.documentStatus}</Badge> : "-"}</div>
                                    </div>
                                </div>
                                {(previewDoc.refType || previewDoc.refId) && (
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.ref", { defaultValue: "Tham chiếu" }))}</div>
                                        <Badge variant="outline">{previewDoc.refType ? `${previewDoc.refType}: ` : ""}{previewDoc.refId}</Badge>
                                    </div>
                                )}
                                {(previewDoc.commonKeys || previewDoc.jsonContent?.commonKeys) && (previewDoc.commonKeys || previewDoc.jsonContent?.commonKeys).length > 0 && (
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.tags", { defaultValue: "Từ khóa" }))}</div>
                                        <div className="flex flex-wrap gap-1">
                                            {(previewDoc.commonKeys || previewDoc.jsonContent?.commonKeys).map((k: string) => <Badge key={k} variant="outline" className="text-[10px] font-normal">{k}</Badge>)}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.date", { defaultValue: "Ngày tạo" }))}</div>
                                    <div className="text-foreground">{previewDoc.createdAt ? format(new Date(previewDoc.createdAt), DATE_FORMAT.short) : "-"}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 relative bg-muted/20">
                        {previewType === "pdf" && <iframe src={previewUrl} className="absolute inset-0 w-full h-full border-0" title="PDF Preview" />}
                        {previewType === "image" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/20 overflow-auto p-4">
                                <img src={previewUrl} alt={previewFileName || "Image Preview"} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                            </div>
                        )}
                        {previewType === "office" && <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl)}&embedded=true`} className="absolute inset-0 w-full h-full border-0" title="Office Preview" />}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
