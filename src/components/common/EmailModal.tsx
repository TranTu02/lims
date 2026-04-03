import { useState, useEffect, useMemo } from "react";
import { X, Mail, Paperclip, FileText, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { receiptsSendEmail } from "@/api/receipts";
import { fileApi, type FileInfo } from "@/api/files";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";

interface EmailModalProps {
    open: boolean;
    onClose: () => void;
    defaultTo?: string;
    defaultCc?: string;
    defaultBcc?: string;
    defaultSubject?: string;
    defaultContent?: string;
    attachments?: Array<{
        fileId: string;
        fileName: string;
    }>;
    refId?: string;
    type: "RECEPTION" | "FINAL_RESULT";
}

export function EmailModal({
    open,
    onClose,
    defaultTo = "",
    defaultCc = "",
    defaultBcc = "",
    defaultSubject = "",
    defaultContent = "",
    attachments = [],
    refId,
    type,
}: EmailModalProps) {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        to: defaultTo,
        cc: defaultCc,
        bcc: defaultBcc,
        subject: defaultSubject,
        content: defaultContent,
    });

    const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
    const [initDone, setInitDone] = useState(false);

    // Fetch related files
    const { data: filesRes, isLoading: isLoadingFiles } = useQuery({
        queryKey: ["files", "list", refId, type],
        queryFn: () => {
            const query: any = {
                "commonKeys[]": refId ? [refId] : [],
                page: 1,
                itemsPerPage: 50,
            };
            if (type === "FINAL_RESULT") {
                query["fileTags[]"] = ["Report"];
            }
            return fileApi.list(query);
        },
        enabled: open && !!refId,
    });

    const discoveredFiles = useMemo(() => (filesRes as any)?.data || [], [filesRes]);

    useEffect(() => {
        if (!open) {
            setInitDone(false);
            return;
        }
        if (open && !initDone) {
            setForm({
                to: defaultTo,
                cc: defaultCc,
                bcc: defaultBcc,
                subject: defaultSubject,
                content: defaultContent,
            });
            const initial = attachments.map(a => ({ fileId: a.fileId, fileName: a.fileName } as FileInfo));
            setSelectedFiles(initial);
            setInitDone(true);
        }
    }, [open, initDone, defaultTo, defaultCc, defaultBcc, defaultSubject, defaultContent, attachments]);

    // Handle auto-select reports if final result
    useEffect(() => {
        if (open && initDone && type === "FINAL_RESULT" && discoveredFiles.length > 0) {
            setSelectedFiles(prev => {
                const combined = [...prev];
                let changed = false;
                discoveredFiles.forEach((df: FileInfo) => {
                    if (!combined.find(c => c.fileId === df.fileId)) {
                        combined.push(df);
                        changed = true;
                    }
                });
                return changed ? combined : prev;
            });
        }
    }, [open, initDone, type, discoveredFiles]);

    const sendEmailMut = useMutation({
        mutationFn: receiptsSendEmail,
        onSuccess: () => {
            toast.success(String(t("reception.receiptDetail.email.sendSuccess", { defaultValue: "Đã gửi email thành công!" })));
            onClose();
        },
        onError: (err: any) => {
            console.error("Failed to send email", err);
            toast.error(err?.message || String(t("reception.receiptDetail.email.sendError", { defaultValue: "Gửi email thất bại" })));
        }
    });

    const handleSend = async () => {
        if (!form.to) {
            toast.error(String(t("reception.receiptDetail.email.toError", { defaultValue: "Vui lòng nhập người nhận" })));
            return;
        }

        sendEmailMut.mutate({
            to: form.to,
            cc: form.cc || undefined,
            subject: form.subject,
            body: form.content,
            attachments: selectedFiles.map((a) => a.fileId),
            type,
        });
    };

    const toggleFile = (file: FileInfo) => {
        setSelectedFiles(prev =>
            prev.some(f => f.fileId === file.fileId)
                ? prev.filter(f => f.fileId !== file.fileId)
                : [...prev, file]
        );
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100]" onClick={onClose} />
            <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-4xl mx-auto bg-background rounded-xl shadow-2xl z-[1101] flex flex-col max-h-[90vh] border border-border animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            {String(t("reception.receiptDetail.sendMailTitle"))}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{String(t("reception.receiptDetail.sendMailDesc"))}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.to"))}</Label>
                            <Input
                                value={form.to}
                                onChange={(e) => setForm({ ...form, to: e.target.value })}
                                placeholder={String(t("reception.receiptDetail.email.toPlaceholder"))}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.cc"))}</Label>
                            <Input
                                value={form.cc}
                                onChange={(e) => setForm({ ...form, cc: e.target.value })}
                                placeholder="Email cách nhau bởi dấu ';'"
                                className="h-9 text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.subject"))}</Label>
                        <Input
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            className="h-9 text-sm font-medium"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.content"))}</Label>
                        <div className="border border-border rounded-md overflow-hidden min-h-[300px]">
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                value={form.content}
                                onEditorChange={(content) => setForm({ ...form, content })}
                                init={{
                                    height: 350,
                                    menubar: false,
                                    plugins: ["advlist", "autolink", "lists", "link", "image", "charmap", "preview", "anchor", "searchreplace", "visualblocks", "code", "fullscreen", "insertdatetime", "media", "table", "help", "wordcount"],
                                    toolbar: "undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                                    content_style: "body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:14px }",
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1.5 pt-2">
                            <Paperclip className="h-3 w-3" />
                            {String(t("reception.receiptDetail.email.attachments"))}
                            <span className="text-[10px] font-normal lowercase italic text-muted-foreground/60 ml-2">
                                (Tự động lọc theo {type === "FINAL_RESULT" ? "kết quả/báo cáo" : "phiếu tiếp nhận"})
                            </span>
                        </Label>

                        <div className="border border-border rounded-lg bg-muted/20 p-3">
                            {isLoadingFiles ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-2">
                                    <Loader2 className="h-3 w-3 animate-spin" /> {String(t("common.loading"))}...
                                </div>
                            ) : discoveredFiles.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {discoveredFiles.map((file: FileInfo) => {
                                        const isSelected = selectedFiles.some(f => f.fileId === file.fileId);
                                        return (
                                            <div
                                                key={file.fileId}
                                                onClick={() => toggleFile(file)}
                                                className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer transition-all ${isSelected ? "bg-primary/5 border-primary/40 shadow-sm" : "bg-background border-transparent hover:border-border"}`}
                                            >
                                                <div className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/40"}`}>
                                                    {isSelected && <Mail className="h-2.5 w-2.5" />}
                                                </div>
                                                <div className="min-w-0 pr-2">
                                                    <p className="text-xs font-medium truncate leading-none uppercase">{file.fileName}</p>
                                                    <p className="text-[9px] text-muted-foreground mt-1 font-mono">{file.fileId}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground italic p-2 text-center">
                                    Không tìm thấy file liên quan phù hợp với yêu cầu.
                                </div>
                            )}
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {selectedFiles.map((file, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1.5 px-2 py-0.5 h-6 text-[10px] bg-primary/10 text-primary border-primary/20">
                                        <FileText className="h-3 w-3" />
                                        <span className="font-medium max-w-[150px] truncate">{file.fileName}</span>
                                        <button onClick={(e) => { e.stopPropagation(); toggleFile(file); }} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={sendEmailMut.isPending}>
                        {String(t("common.cancel"))}
                    </Button>
                    <Button
                        className="gap-2 px-6"
                        onClick={handleSend}
                        disabled={sendEmailMut.isPending}
                    >
                        {sendEmailMut.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {String(t("reception.receiptDetail.email.sending"))}
                            </>
                        ) : (
                            <>
                                <Mail className="h-4 w-4" />
                                {String(t("reception.receiptDetail.email.send"))}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </>
    );
}
