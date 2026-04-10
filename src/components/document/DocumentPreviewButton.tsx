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

    const handlePreview = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setUrlLoading(true);
        try {
            const res = await documentApi.url(documentId);
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
            setDocTitle(`Document ${documentId}`);
            setPreviewOpen(true);
        } catch {
            window.open(`/api/v2/documents/get/url?id=${documentId}`, "_blank");
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
                />
            )}
        </>
    );
}
