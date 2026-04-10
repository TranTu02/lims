import { useState } from "react";
import { Loader2, Eye, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { documentApi } from "@/api/documents";
import { DocumentPreviewModal, type PreviewType } from "@/components/document/DocumentPreviewModal";

export function DocumentItem({ doc }: { doc: any }) {
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
                setPreviewUrl(url);
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
            <div className="flex flex-col p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-all gap-2 group mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                    </div>
                    <span className="text-sm font-semibold text-foreground truncate flex-1" title={String(title || "")}>
                        {title}
                    </span>
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" disabled={urlLoading} onClick={handlePreview} type="button">
                        {urlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                </div>
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
            </div>
            <DocumentPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} previewUrl={previewUrl} previewType={previewType} previewFileName={title} previewDoc={doc} />
        </>
    );
}
