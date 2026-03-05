import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, FileText, FlaskConical, Beaker, Eye, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Protocol } from "@/api/library";
import { useProtocolDetail } from "@/api/library";
import { documentApi } from "@/api/documents";
import { DocumentPreviewModal, type PreviewType } from "@/components/document/DocumentPreviewModal";

type Props = {
    protocol: Protocol;
    onClose: () => void;
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
                    <span className="text-sm font-semibold text-foreground truncate block" title={title}>
                        {title}
                    </span>
                </div>

                {keys && keys.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate pl-6" title={keys.join(", ")}>
                        {String(t("documentCenter.uploadModal.commonKeysLabel", { defaultValue: "Mã:" }))} {keys.join(", ")}
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
                    <Button variant="secondary" size="sm" className="h-6 text-[10px] px-2 shrink-0" disabled={urlLoading} onClick={handlePreview}>
                        {urlLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
                        {String(t("common.view"))}
                    </Button>
                </div>
            </div>

            <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} previewUrl={previewUrl} previewType={previewType} previewFileName={title} />
        </>
    );
}

export function ProtocolDetailModal(props: Props) {
    const { t } = useTranslation();
    const { protocol, onClose } = props;

    const fullProtocolQuery = useProtocolDetail({ params: { protocolId: protocol?.protocolId || "" } });
    const displayProtocol = fullProtocolQuery.data || protocol;

    const docsArray = displayProtocol.documents?.length ? displayProtocol.documents : displayProtocol.protocolDocumentIds?.map((id) => ({ documentId: id })) || [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-border flex flex-col">
                <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{String(t("library.protocols.detail.generalInfo"))}</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">{displayProtocol.protocolCode}</p>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors" type="button">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {fullProtocolQuery.isLoading ? (
                    <div className="p-12 flex justify-center flex-1">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="p-6 space-y-6 flex-1">
                        {/* General Information */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolTitle"))}</div>
                                <div className="text-base text-foreground font-medium mt-1">{displayProtocol.protocolTitle || "-"}</div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolCode"))}</div>
                                <div className="text-sm text-foreground font-medium mt-1">{displayProtocol.protocolCode}</div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolSource"))}</div>
                                <div className="text-sm text-foreground font-medium mt-1">{displayProtocol.protocolSource}</div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.protocolAccreditation.title"))}</div>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {displayProtocol.protocolAccreditation?.VILAS ? <Badge variant="secondary">{String(t("library.protocols.protocolAccreditation.vilas"))}</Badge> : null}

                                    {displayProtocol.protocolAccreditation?.TDC ? <Badge variant="secondary">{String(t("library.protocols.protocolAccreditation.tdc"))}</Badge> : null}

                                    {!displayProtocol.protocolAccreditation?.VILAS && !displayProtocol.protocolAccreditation?.TDC ? <Badge variant="outline">{String(t("common.noData"))}</Badge> : null}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {displayProtocol.protocolDescription && (
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.detail.description"))}</div>
                                <div className="text-sm text-foreground bg-muted/30 p-3 rounded-md border border-border whitespace-pre-wrap">{displayProtocol.protocolDescription}</div>
                            </div>
                        )}

                        {/* Parameters & Sample Types */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    <FlaskConical className="h-3.5 w-3.5" />
                                    {String(t("library.protocols.detail.parameters"))}
                                </div>
                                <div className="flex flex-wrap gap-1.5 text-sm">
                                    {displayProtocol.parameters?.length
                                        ? displayProtocol.parameters.map((p) => (
                                              <Badge key={p.parameterId} variant="outline" className="font-normal">
                                                  {p.parameterName}
                                              </Badge>
                                          ))
                                        : "-"}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                    <Beaker className="h-3.5 w-3.5" />
                                    {String(t("library.protocols.detail.sampleTypes"))}
                                </div>
                                <div className="flex flex-wrap gap-1.5 text-sm">
                                    {displayProtocol.sampleTypes?.length
                                        ? displayProtocol.sampleTypes.map((st) => (
                                              <Badge key={st.sampleTypeId} variant="outline" className="font-normal">
                                                  {st.sampleTypeName}
                                              </Badge>
                                          ))
                                        : "-"}
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="space-y-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{String(t("library.protocols.detail.documents"))}</div>
                            {docsArray.length ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {docsArray.map((doc, idx) => (
                                        <DocumentItem key={doc.documentId || idx} doc={doc} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">{String(t("common.noData"))}</div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border flex justify-end">
                            <Button variant="outline" onClick={onClose} type="button">
                                {String(t("common.close"))}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
