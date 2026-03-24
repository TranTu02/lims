import { useTranslation } from "react-i18next";
import { Loader2, X, Archive, MapPin, Tag, Wrench, Calendar, Info, FileText, Eye } from "lucide-react";

import { useLabInventory } from "@/api/generalInventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { documentApi } from "@/api/documents";
import { useState } from "react";
import { DocumentPreviewModal, type PreviewType } from "@/components/document/DocumentPreviewModal";

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
            <div className="flex flex-col p-3 rounded-md border border-border bg-muted/30 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate" title={title}>
                        {title}
                    </span>
                </div>
                {keys && keys.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate pl-6" title={keys.join(", ")}>
                        Mã: {keys.join(", ")}
                    </div>
                )}
                <div className="flex items-center justify-between pl-6 mt-1 border-t border-border pt-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-background border text-muted-foreground px-1.5 py-0.5 rounded shadow-sm">{doc.documentId}</span>
                        {status && (
                            <Badge variant="outline" className="text-[10px] h-5 min-h-0 bg-background">
                                {status}
                            </Badge>
                        )}
                    </div>
                    <Button variant="secondary" size="sm" className="h-6 text-[10px] px-2" disabled={urlLoading} onClick={handlePreview}>
                        {urlLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
                        {String(t("common.view"))}
                    </Button>
                </div>
            </div>
            <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} previewUrl={previewUrl} previewType={previewType} previewFileName={title} />
        </>
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
        <div className="w-[450px] shrink-0 bg-background border border-border rounded-lg flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
            {/* HDR */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Archive className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground leading-none">{String(t("inventory.general.equipment.detailTitle", { defaultValue: "Chi tiết thiết bị" }))}</h3>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">{labInventoryId}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Bdy */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading && (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}
                {isError && (
                    <div className="flex items-center justify-center h-32 text-destructive">
                        {String(t("common.error", { defaultValue: "Đã có lỗi xảy ra" }))}
                    </div>
                )}
                {!isLoading && !isError && item && (
                    <div className="space-y-6">
                        {/* Status, Name */}
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">{item.labInventoryName}</h2>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={item.labInventoryStatus === "Ready" ? "default" : "secondary"}>
                                    {item.labInventoryStatus || "Ready"}
                                </Badge>
                                {item.labInventoryCode && (
                                    <Badge variant="outline" className="font-mono text-muted-foreground border-dashed">
                                        <Tag className="h-3 w-3 mr-1" />
                                        {item.labInventoryCode}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        {item.labInventoryLocation && (
                            <div className="p-3 bg-muted/20 border border-border rounded-md flex items-center gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">{String(t("inventory.general.equipment.location", { defaultValue: "Vị trí" }))}:</span>
                                <span className="text-muted-foreground">{item.labInventoryLocation}</span>
                            </div>
                        )}

                        {/* Info list */}
                        <div className="grid grid-cols-2 gap-4">
                            {item.labInventoryManufacturer && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">{String(t("inventory.general.equipment.manufacturer", { defaultValue: "Hãng sản xuất" }))}</span>
                                    <div className="text-sm text-foreground">{item.labInventoryManufacturer}</div>
                                </div>
                            )}
                            {item.labInventoryModel && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">{String(t("inventory.general.equipment.model", { defaultValue: "Model" }))}</span>
                                    <div className="text-sm text-foreground font-mono">{item.labInventoryModel}</div>
                                </div>
                            )}
                            {item.labInventorySerial && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">{String(t("inventory.general.equipment.serial", { defaultValue: "Số Serial" }))}</span>
                                    <div className="text-sm text-foreground font-mono">{item.labInventorySerial}</div>
                                </div>
                            )}
                            {item.labInventoryImportDate && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {String(t("inventory.general.equipment.importDate", { defaultValue: "Ngày nhập" }))}
                                    </span>
                                    <div className="text-sm text-foreground">{item.labInventoryImportDate.split("T")[0]}</div>
                                </div>
                            )}
                            {item.labInventoryWarrantyExpiryDate && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                        <Calendar className="h-3 w-3 text-amber-500" />
                                        {String(t("inventory.general.equipment.warrantyExpiry", { defaultValue: "Hạn bảo hành" }))}
                                    </span>
                                    <div className="text-sm text-foreground">{item.labInventoryWarrantyExpiryDate.split("T")[0]}</div>
                                </div>
                            )}
                            {item.labInventoryLastCalibrationDate && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                        <Wrench className="h-3 w-3" />
                                        {String(t("inventory.general.equipment.lastCal", { defaultValue: "Hiệu chuẩn lần cuối" }))}
                                    </span>
                                    <div className="text-sm text-foreground">{item.labInventoryLastCalibrationDate.split("T")[0]}</div>
                                </div>
                            )}
                            {item.labInventoryNextCalibrationDate && (
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                        <Wrench className="h-3 w-3 text-blue-500" />
                                        {String(t("inventory.general.equipment.nextCal", { defaultValue: "Hạn hiệu chuẩn" }))}
                                    </span>
                                    <div className="text-sm text-foreground">{item.labInventoryNextCalibrationDate.split("T")[0]}</div>
                                </div>
                            )}
                        </div>

                        {/* Specs */}
                        {item.labInventorySpecifications && Object.keys(item.labInventorySpecifications).length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
                                    <Info className="h-4 w-4 text-muted-foreground" />
                                    {String(t("inventory.general.equipment.specifications", { defaultValue: "Thông số kỹ thuật" }))}
                                </h4>
                                <div className="bg-muted/10 p-3 rounded text-sm grid grid-cols-2 gap-y-2 border">
                                    {Object.entries(item.labInventorySpecifications).map(([k, v]) => (
                                        <div key={k} className="flex flex-col">
                                            <span className="text-xs text-muted-foreground capitalize">{k}</span>
                                            <span className="font-medium text-foreground">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                       {/* Notes */}
                       {item.labInventoryNotes && (
                            <div className="space-y-2 pt-2 border-t">
                                <h4 className="text-sm font-semibold text-foreground">{String(t("common.notes", { defaultValue: "Ghi chú" }))}</h4>
                                <div className="text-sm text-muted-foreground bg-muted/10 p-3 rounded italic border">
                                    {item.labInventoryNotes}
                                </div>
                            </div>
                       )}

                        {/* Docs */}
                        {item.labInventoryDocuments && item.labInventoryDocuments.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                                <h4 className="text-sm font-semibold text-foreground">{String(t("inventory.general.equipment.documents", { defaultValue: "Tài liệu đính kèm" }))} ({item.labInventoryDocuments.length})</h4>
                                <div className="space-y-2 pt-1">
                                    {item.labInventoryDocuments.map((doc, idx) => (
                                        <DocumentItem key={idx} doc={doc} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            {onEdit && item && (
                <div className="p-4 border-t border-border bg-muted/10 shrink-0 flex justify-end">
                    <Button variant="outline" className="w-full" onClick={() => onEdit(item)}>
                        {String(t("common.edit", { defaultValue: "Sửa thông tin" }))}
                    </Button>
                </div>
            )}
        </div>
    );
}
