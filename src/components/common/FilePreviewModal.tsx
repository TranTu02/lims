import { X, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { documentApi } from "@/api/documents";
import { toast } from "sonner";

interface Props {
    documentId: string | null;
    documentTitle?: string;
    onClose: () => void;
}

export function FilePreviewModal({ documentId, documentTitle, onClose }: Props) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!documentId) { setUrl(null); return; }
        setLoading(true);
        setUrl(null);
        documentApi.url(documentId)
            .then((res) => {
                const u = res.data?.url || (res as any).url;
                if (u) setUrl(u);
                else toast.error("Không lấy được liên kết tài liệu");
            })
            .catch(() => toast.error("Lỗi khi lấy liên kết tài liệu"))
            .finally(() => setLoading(false));
    }, [documentId]);

    return (
        <DialogPrimitive.Root open={!!documentId} onOpenChange={(open) => !open && onClose()}>
            <DialogPrimitive.Portal>
                {/* Overlay */}
                <DialogPrimitive.Overlay className="fixed inset-0 z-[1200] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Content — raw primitive so no extra close button is injected */}
                <DialogPrimitive.Content
                    className="fixed left-1/2 top-1/2 z-[1210] -translate-x-1/2 -translate-y-1/2 flex flex-col bg-background border rounded-xl shadow-2xl overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200"
                    style={{ width: "90vw", height: "95vh" }}
                >
                    {/* Compact header bar */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/40 shrink-0 min-h-0">
                        <span className="font-semibold text-sm truncate max-w-[70%]" title={documentTitle}>
                            {documentTitle || documentId}
                        </span>
                        <div className="flex items-center gap-1">
                            {url && (
                                <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 px-2" onClick={() => window.open(url, "_blank")}>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Mở tab mới
                                </Button>
                            )}
                            <DialogPrimitive.Close asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </DialogPrimitive.Close>
                        </div>
                    </div>

                    {/* Body — iframe fills the rest */}
                    <div className="flex-1 overflow-hidden bg-muted/10 relative min-h-0">
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            </div>
                        )}
                        {!loading && url && (
                            <iframe
                                src={url}
                                className="w-full h-full border-none"
                                title={documentTitle || "Preview"}
                            />
                        )}
                        {!loading && !url && documentId && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <p className="text-sm">Không thể tải tài liệu</p>
                            </div>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
