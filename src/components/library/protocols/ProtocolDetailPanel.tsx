import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, FileText, FlaskConical, Beaker, Eye, Loader2, Pencil, Grid3X3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Protocol } from "@/api/library";
import { useProtocolDetail } from "@/api/library";
import { documentApi } from "@/api/documents";
import { DocumentPreviewModal, type PreviewType } from "@/components/document/DocumentPreviewModal";
import { AccreditationBadges } from "../shared/AccreditationTagInput";

type Props = {
    protocol: Protocol | null;
    onClose: () => void;
    onEdit?: (protocol: Protocol) => void;
};

type SnapshotDoc = NonNullable<Protocol["documents"]>[0];

function DocumentItem({ doc }: { doc: SnapshotDoc }) {
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
            // fallback: try direct download
            window.open(`/api/v2/documents/get/url?id=${doc.documentId}`, "_blank");
        } finally {
            setUrlLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col p-3 rounded-md border border-border bg-muted/30 gap-2">
                {/* Dòng 1: Title */}
                <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold text-foreground truncate" title={title}>
                        {title}
                    </span>
                </div>

                {/* Dòng 2: Common Keys */}
                {keys && keys.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate pl-6" title={keys.join(", ")}>
                        {String(t("documentCenter.uploadModal.commonKeysLabel", { defaultValue: "Mã:" }))} {keys.join(", ")}
                    </div>
                )}

                {/* Dòng 3: Id - Badge - Action */}
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

export function ProtocolDetailPanel(props: Props) {
    const { t } = useTranslation();
    const { protocol, onClose, onEdit } = props;

    const fullProtocolQuery = useProtocolDetail({ params: { protocolId: protocol?.protocolId || "" } });
    const displayProtocol = fullProtocolQuery.data || protocol;

    if (!displayProtocol) return null;

    // Support fallback directly from UI if backend hasn't populated generic 'documents' but populated old 'protocolDocumentIds' list.
    const docsArray = displayProtocol.documents?.length ? displayProtocol.documents : displayProtocol.protocolDocumentIds?.map((id) => ({ documentId: id })) || [];

    const matrices = (displayProtocol as any).matrices as any[] | undefined;

    return (
        <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{String(t("library.protocols.detail.generalInfo"))}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{displayProtocol.protocolCode}</p>
                </div>
                <div className="flex items-center gap-1">
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(displayProtocol)} type="button" title={String(t("common.edit"))}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {fullProtocolQuery.isLoading ? (
                <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="p-4 space-y-6">
                    {/* General Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolTitle"))}</div>
                            <div className="text-sm text-foreground font-medium mt-1">{displayProtocol.protocolTitle || "-"}</div>
                        </div>

                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolCode"))}</div>
                            <div className="text-sm text-foreground font-medium mt-1 break-words">{displayProtocol.protocolCode}</div>
                        </div>

                        <div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolSource"))}</div>
                            <div className="text-sm text-foreground font-medium mt-1">{displayProtocol.protocolSource}</div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolAccreditation.title"))}</div>
                            <div className="mt-1">
                                <AccreditationBadges value={displayProtocol.protocolAccreditation} />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {displayProtocol.protocolDescription && (
                        <div className="space-y-1.5">
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.detail.description"))}</div>
                            <div className="text-sm text-foreground bg-muted/30 p-2.5 rounded-md border border-border whitespace-pre-wrap">{displayProtocol.protocolDescription}</div>
                        </div>
                    )}

                    {/* Parameters & Sample Types */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                <FlaskConical className="h-3 w-3" />
                                {String(t("library.protocols.detail.parameters"))}
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-sm">
                                {displayProtocol.parameters?.length
                                    ? displayProtocol.parameters.map((p) => (
                                          <Badge key={p.parameterId} variant="outline" className="font-normal bg-background">
                                              {p.parameterName}
                                          </Badge>
                                      ))
                                    : "-"}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                <Beaker className="h-3 w-3" />
                                {String(t("library.protocols.detail.sampleTypes"))}
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-sm">
                                {displayProtocol.sampleTypes?.length
                                    ? displayProtocol.sampleTypes.map((st) => (
                                          <Badge key={st.sampleTypeId} variant="outline" className="font-normal bg-background">
                                              {st.sampleTypeName}
                                          </Badge>
                                      ))
                                    : "-"}
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-1.5">
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.detail.documents"))}</div>
                        {docsArray.length ? (
                            <div className="grid grid-cols-1 gap-3">
                                {docsArray.map((doc, idx) => (
                                    <DocumentItem key={doc.documentId || idx} doc={doc} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">{String(t("common.noData"))}</div>
                        )}
                    </div>

                    {/* Matrices Snapshots */}
                    {matrices && matrices.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                                <Grid3X3 className="h-3 w-3" />
                                {String(t("library.matrices.title"))} ({matrices.length})
                            </div>
                            <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                                <table className="w-full text-xs">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">{String(t("library.matrices.parameterName"))}</th>
                                            <th className="text-left px-2 py-1.5 font-semibold text-muted-foreground">{String(t("library.matrices.sampleTypeId"))}</th>
                                            <th className="text-right px-2 py-1.5 font-semibold text-muted-foreground">{String(t("library.matrices.feeAfterTax"))}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {matrices.map((m: any) => (
                                            <tr key={m.matrixId} className="hover:bg-muted/30">
                                                <td className="px-2 py-1.5 text-foreground">{m.parameterName || m.parameterId}</td>
                                                <td className="px-2 py-1.5 text-foreground">{m.sampleTypeName || m.sampleTypeId}</td>
                                                <td className="px-2 py-1.5 text-right text-foreground font-medium">{m.feeAfterTax ? Number(m.feeAfterTax).toLocaleString("vi-VN") : "-"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
