import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { documentApi } from "@/api/documents";
import { DocumentPreviewModal, type PreviewType } from "@/components/document/DocumentPreviewModal";

type Props = {
    documentId: string;
    variant?: "ghost" | "secondary" | "outline" | "default";
    size?: "sm" | "icon" | "default";
    className?: string;
    showLabel?: boolean;
};

export function DocumentPreviewButton({ documentId, variant = "ghost", size = "icon", className, showLabel = false }: Props) {
    const { t } = useTranslation();
    const [urlLoading, setUrlLoading] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<PreviewType>(null);
    const [docTitle, setDocTitle] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<any>(null);

    const handlePreview = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setUrlLoading(true);
        try {
            let fileName = "";
            let mimeType = "";
            // let pDoc = null;

            try {
                const fullRes = await documentApi.full(documentId);
                const fullData = (fullRes as any).data ?? fullRes;
                // pDoc = fullData;
                setPreviewDoc(fullData);
                fileName = fullData?.file?.fileName || fullData?.documentTitle || "";
                mimeType = fullData?.file?.mimeType || "";
            } catch (err) {
                console.warn("Could not fetch full document info", err);
            }

            const res = await documentApi.url(documentId);
            const urlData = (res as any).data ?? res;
            const url = urlData?.url;
            if (!url) throw new Error("No URL returned");

            const lowerUrl = url.toLowerCase().split("?")[0];
            const lowerName = fileName.toLowerCase();
            const lowerMime = mimeType.toLowerCase();

            const isOffice = 
                lowerName.endsWith(".docx") || lowerName.endsWith(".xlsx") || lowerName.endsWith(".pptx") || 
                lowerName.endsWith(".doc") || lowerName.endsWith(".xls") || lowerName.endsWith(".ppt") ||
                lowerUrl.endsWith(".docx") || lowerUrl.endsWith(".xlsx") || lowerUrl.endsWith(".pptx") || 
                lowerUrl.endsWith(".doc") || lowerUrl.endsWith(".xls") || lowerUrl.endsWith(".ppt") ||
                lowerMime.includes("wordprocessingml") || lowerMime.includes("spreadsheetml") || lowerMime.includes("presentationml") || 
                lowerMime.includes("msword") || lowerMime.includes("ms-excel") || lowerMime.includes("ms-powerpoint");
            
            const isPdf = lowerName.endsWith(".pdf") || lowerUrl.endsWith(".pdf") || lowerMime.includes("pdf");
            
            const isImg = 
                lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".gif") || lowerName.endsWith(".webp") ||
                lowerUrl.endsWith(".png") || lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".gif") || lowerUrl.endsWith(".webp") ||
                lowerMime.includes("image/");

            if (isOffice) {
                setPreviewType("office");
            } else if (isPdf) {
                setPreviewType("pdf");
            } else if (isImg) {
                setPreviewType("image");
            } else {
                // Fallback if we really can't tell, PDF is usually a safer bet for documents than image
                setPreviewType("pdf");
            }
            
            setPreviewUrl(url);
            setDocTitle(fileName || `Document ${documentId}`);
            setPreviewOpen(true);
        } catch {
            const res = await documentApi.url(documentId);
            const url = (res as any).data?.url || (res as any).url;
            if (url) window.open(url, "_blank");
        } finally {
            setUrlLoading(false);
        }
    };

    return (
        <>
            <Button
                variant={variant}
                size={size}
                className={className}
                disabled={urlLoading}
                onClick={handlePreview}
                title={String(t("documentCenter.preview.title", { defaultValue: "Xem tài liệu đính kèm" }))}
            >
                {urlLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {showLabel && !urlLoading && <span className="ml-2">{String(t("common.view", { defaultValue: "Xem" }))}</span>}
                {showLabel && urlLoading && <span className="ml-2">{String(t("common.loading", { defaultValue: "Đang tải" }))}</span>}
            </Button>
            
            {previewOpen && (
                <DocumentPreviewModal 
                    open={previewOpen} 
                    onClose={() => setPreviewOpen(false)} 
                    previewUrl={previewUrl} 
                    previewType={previewType} 
                    previewFileName={docTitle}
                    previewDoc={previewDoc}
                />
            )}
        </>
    );
}
