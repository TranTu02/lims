import { useState, useEffect, useMemo } from "react";
import { X, Mail, Paperclip, FileText, Loader2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { receiptsSendEmail } from "@/api/receipts";
import { fileApi, type FileInfo } from "@/api/files";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { ReceiptSample } from "@/types/receipt";

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
    images?: Array<{ fileId: string; url: string; }>;
    documents?: Array<{ documentId?: string; documentTitle?: string; documentType?: string; fileId?: string; }>;
    samples?: ReceiptSample[];
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
    images = [],
    documents = [],
    samples = [],
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
            if (type === "RECEPTION") {
                images.forEach(img => {
                    if (!initial.some(f => f.fileId === img.fileId)) initial.push({ fileId: img.fileId, fileName: "Image" } as FileInfo);
                });
                documents.forEach(doc => {
                    if (doc.fileId && !initial.some(f => f.fileId === doc.fileId)) initial.push({ fileId: doc.fileId, fileName: doc.documentTitle || "Document" } as FileInfo);
                });
            } else if (type === "FINAL_RESULT") {
                samples.forEach(s => {
                    const docs = (s as any).documents || [];
                    const certs = docs.filter((d: any) => d.documentType === 'RESULT_CERT' && d.documentStatus === 'Issued');
                    const latest = [...certs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                    if (latest?.fileId && !initial.some(f => f.fileId === latest.fileId)) {
                        initial.push({ fileId: latest.fileId, fileName: latest.documentTitle || `RESULT_CERT_${s.sampleId}` } as FileInfo);
                    }
                });
            }
            setSelectedFiles(initial);
            setInitDone(true);
        }
    }, [open, initDone, defaultTo, defaultCc, defaultBcc, defaultSubject, defaultContent, attachments, type, images, documents, samples]);



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
            refId: refId ? [refId] : undefined,
        });
    };

    const toggleFile = (file: FileInfo) => {
        setSelectedFiles(prev =>
            prev.some(f => f.fileId === file.fileId)
                ? prev.filter(f => f.fileId !== file.fileId)
                : [...prev, file]
        );
    };

    const allReceptionFileIds = [
        ...images.map(i => i.fileId),
        ...documents.map(d => d.fileId).filter(Boolean) as string[]
    ];
    const allReceptionSelected = allReceptionFileIds.length > 0 && allReceptionFileIds.every(id => selectedFiles.some(f => f.fileId === id));

    const toggleAllReceptionFiles = () => {
        if (allReceptionSelected) {
            setSelectedFiles(prev => prev.filter(f => !allReceptionFileIds.includes(f.fileId)));
        } else {
            const newFiles = [...selectedFiles];
            images.forEach(img => {
                if (!newFiles.some(f => f.fileId === img.fileId)) newFiles.push({ fileId: img.fileId, fileName: "Image" } as FileInfo);
            });
            documents.forEach(doc => {
                if (doc.fileId && !newFiles.some(f => f.fileId === doc.fileId)) newFiles.push({ fileId: doc.fileId, fileName: doc.documentTitle || "Document" } as FileInfo);
            });
            setSelectedFiles(newFiles);
        }
    };

    const resultCertsGrouped = useMemo(() => {
        if (type !== "FINAL_RESULT") return [];
        return samples.map(s => {
            const docs = (s as any).documents || [];
            const certs = docs.filter((d: any) => d.documentType === 'RESULT_CERT' && d.documentStatus === 'Issued');
            const latest = [...certs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
            return { sample: s, cert: latest };
        });
    }, [samples, type]);

    const allResultCertIds = resultCertsGrouped.map(item => item.cert?.fileId).filter(Boolean);
    const allResultCertsSelected = allResultCertIds.length > 0 && allResultCertIds.every(id => selectedFiles.some(f => f.fileId === id));

    const toggleAllResultCerts = () => {
        if (allResultCertsSelected) {
            setSelectedFiles(prev => prev.filter(f => !allResultCertIds.includes(f.fileId)));
        } else {
            const newFiles = [...selectedFiles];
            resultCertsGrouped.forEach(item => {
                if (item.cert?.fileId && !newFiles.some(f => f.fileId === item.cert.fileId)) {
                    newFiles.push({ fileId: item.cert.fileId, fileName: item.cert.documentTitle || "Result Cert" } as FileInfo);
                }
            });
            setSelectedFiles(newFiles);
        }
    };

    const handlePreviewFile = async (id: string) => {
        try {
            const r = await fileApi.url(id, 3600);
            const url = (r as any)?.data?.url ?? (r as any)?.url;
            if (url) window.open(url, "_blank");
        } catch (e) {
            console.error("Preview failed", e);
            toast.error("Không thể xem trước tệp");
        }
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
                            {type === "RECEPTION" ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                        <span className="text-xs text-muted-foreground font-medium">Danh sách đính kèm</span>
                                        <div className="flex items-center gap-2 cursor-pointer" onClick={toggleAllReceptionFiles}>
                                            <Checkbox checked={allReceptionSelected} onCheckedChange={toggleAllReceptionFiles} />
                                            <span className="text-xs text-muted-foreground select-none">Select toàn bộ</span>
                                        </div>
                                    </div>
                                    {images && images.length > 0 && (
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase">Ảnh mẫu</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {images.map(img => {
                                                    const isSelected = selectedFiles.some(f => f.fileId === img.fileId);
                                                    return (
                                                        <div key={img.fileId} 
                                                             onClick={() => toggleFile({ fileId: img.fileId, fileName: "Image" } as FileInfo)}
                                                             className={`w-16 h-16 rounded-md border-2 cursor-pointer overflow-hidden transition-all ${isSelected ? "border-primary shadow-sm" : "border-border opacity-70 hover:opacity-100"}`}>
                                                             <img src={img.url} className="w-full h-full object-cover" alt="" />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {documents && documents.length > 0 && (
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] text-muted-foreground uppercase">Tài liệu</Label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {documents.map(doc => {
                                                    if (!doc.fileId) return null;
                                                    const isSelected = selectedFiles.some(f => f.fileId === doc.fileId);
                                                    return (
                                                        <div key={doc.fileId} 
                                                             onClick={() => toggleFile({ fileId: doc.fileId, fileName: doc.documentTitle || "Document" } as FileInfo)}
                                                             className={`flex items-start justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-border/80"}`}>
                                                             <div className="font-medium text-xs truncate pr-2 mt-0.5">{doc.documentTitle || "Không có tiêu đề"}</div>
                                                             <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                                 <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 uppercase">{doc.documentType || "DOC"}</Badge>
                                                                 <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={(e) => { e.stopPropagation(); handlePreviewFile(doc.fileId!); }}>Preview</Button>
                                                             </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    {images.length === 0 && documents.length === 0 && (
                                        <div className="text-xs text-muted-foreground italic text-center py-2">
                                            Không có ảnh hoặc tài liệu nào được đính kèm trong phiếu.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                                        <span className="text-xs text-muted-foreground font-medium">Danh sách Phiếu Kết Quả (Bản cuối)</span>
                                        <div className="flex items-center gap-2 cursor-pointer" onClick={toggleAllResultCerts}>
                                            <Checkbox checked={allResultCertsSelected} onCheckedChange={toggleAllResultCerts} />
                                            <span className="text-xs text-muted-foreground select-none">Select toàn bộ</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {resultCertsGrouped.map(({ sample, cert }, idx) => {
                                            const isSelected = cert ? selectedFiles.some(f => f.fileId === cert.fileId) : false;
                                            return (
                                                <div key={sample.sampleId || idx} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px] bg-muted/50 font-mono">{sample.sampleId}</Badge>
                                                        <span className="text-xs font-bold text-foreground truncate">{sample.sampleName}</span>
                                                    </div>
                                                    {cert ? (
                                                        <div 
                                                            onClick={() => toggleFile({ fileId: cert.fileId, fileName: cert.documentTitle || "Result Cert" } as FileInfo)}
                                                            className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background hover:border-border/80"}`}
                                                        >
                                                            <div className="min-w-0 pr-2">
                                                                <p className="text-[11px] font-bold text-foreground line-clamp-1 uppercase tracking-tight">{cert.documentTitle || "Phiếu kết quả"}</p>
                                                                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono italic">Ref: {cert.refId || "—"}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                                <div className="flex gap-1">
                                                                    <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-200">{cert.documentStatus}</Badge>
                                                                    <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 uppercase">{cert.documentType}</Badge>
                                                                </div>
                                                                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 gap-1 text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); handlePreviewFile(cert.fileId!); }}>
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    Preview
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-muted-foreground italic p-3 border border-dashed border-border rounded-xl bg-muted/5">
                                                            Chưa có tài liệu RESULT_CERT (Trạng thái: Issued)
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {selectedFiles.map((file, idx) => (
                                    <Badge key={idx} variant="secondary" className="gap-1.5 px-2 py-0.5 h-6 text-[10px] bg-primary/10 text-primary border-primary/20">
                                        <FileText className="h-3 w-3" />
                                        <span className="font-medium max-w-[150px] truncate cursor-pointer hover:underline" onClick={() => handlePreviewFile(file.fileId)}>{file.fileName}</span>
                                        <div className="flex items-center gap-1 ml-1 border-l border-primary/20 pl-1">
                                            <button onClick={(e) => { e.stopPropagation(); handlePreviewFile(file.fileId); }} title="Preview" className="hover:text-primary transition-colors">
                                                <ExternalLink className="h-2.5 w-2.5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); toggleFile(file); }} title="Gỡ bỏ" className="hover:text-destructive transition-colors">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
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
