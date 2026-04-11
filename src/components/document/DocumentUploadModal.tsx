import React, { useRef, useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, X, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { documentApi } from "@/api/documents";
import type { DocumentStatus, DocumentCreateRefBody, DocumentUpdateBody, DocumentInfo } from "@/api/documents";
import { fileApi, buildFileUploadFormData } from "@/api/files";
import type { FileInfo } from "@/api/files";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";
import { useEnumList } from "@/api/chemical";

import { SearchableSelect, type Option } from "@/components/common/SearchableSelect";

interface DocumentUploadModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: (doc: any) => void;
    fixedDocumentType?: string; // Optional: preset and lock the document type
    initialTitle?: string;
    initialCommonKeys?: string[];
    initialRefType?: string;
    initialRefId?: string;
    editDocument?: DocumentInfo | null;
}

const DOCUMENT_STATUS_OPTIONS: { label: string; value: DocumentStatus }[] = [
    { label: "Draft (Bản nháp)", value: "Draft" },
    { label: "Issued (Đã ban hành)", value: "Issued" },
    { label: "Revised (Đã sửa đổi)", value: "Revised" },
    { label: "Cancelled (Đã huỷ)", value: "Cancelled" },
];

export function DocumentUploadModal({ open, onClose, onSuccess, fixedDocumentType, initialTitle, initialCommonKeys, initialRefType, initialRefId, editDocument }: DocumentUploadModalProps) {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const { data: documentTypes, isLoading: typesLoading } = useEnumList("documentType", { enabled: open });

    const [documentTitle, setDocumentTitle] = useState("");
    const [documentStatus, setDocumentStatus] = useState<DocumentStatus>("Issued");
    const [documentType, setDocumentType] = useState<string>(fixedDocumentType || "");
    const [refType, setRefType] = useState<string>("");
    const [refId, setRefId] = useState<string>("");
    const [commonKeys, setCommonKeys] = useState<string>("");

    const [fileId, setFileId] = useState<string>("");
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fileQueue, setFileQueue] = useState<File[]>([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

    const [fileSearch, setFileSearch] = useState("");
    const debouncedFileSearch = useDebouncedValue(fileSearch, 300);

    const filesQuery = useQuery({
        queryKey: ["documentCenter", "files-search", String(debouncedFileSearch || "").trim()],
        queryFn: async () => {
            const res: any = await fileApi.list({ search: String(debouncedFileSearch || "").trim(), itemsPerPage: 50, page: 1 });
            return (res?.data ?? []) as FileInfo[];
        },
        enabled: open,
    });

    const fileOptions: Option[] = useMemo(() => {
        const data = filesQuery.data ?? [];
        return data.map((f) => ({
            value: f.fileId,
            label: `${f.fileName || f.fileId}`,
            keywords: `${f.fileName} ${f.fileTags?.join(" ")}`,
        }));
    }, [filesQuery.data]);

    const resetForm = () => {
        setDocumentTitle("");
        setDocumentStatus("Issued");
        setDocumentType(fixedDocumentType || "");
        setRefType("");
        setRefId("");
        setCommonKeys("");
        setFileId("");
        setUploadedFileName(null);
        setFileSearch("");
        setFileQueue([]);
        setCurrentQueueIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Update documentType if fixedDocumentType changes or editDocument is provided
    useEffect(() => {
        if (open) {
            if (editDocument) {
                setDocumentTitle(editDocument.documentTitle || editDocument.jsonContent?.documentTitle || "");
                setDocumentStatus(editDocument.documentStatus || editDocument.jsonContent?.documentStatus || "Issued");
                setDocumentType(editDocument.documentType || "");
                setRefType(editDocument.refType || "");
                setRefId(editDocument.refId || "");
                setCommonKeys((editDocument.commonKeys || editDocument.jsonContent?.commonKeys || []).join(", "));
                setFileId(editDocument.fileId);
            } else {
                setDocumentType(fixedDocumentType || "");
                if (initialTitle) setDocumentTitle(initialTitle);
                if (initialCommonKeys?.length) setCommonKeys(initialCommonKeys.join(", "));
                if (initialRefType) setRefType(initialRefType);
                if (initialRefId) setRefId(initialRefId);
            }
        }
    }, [open, fixedDocumentType, initialTitle, initialCommonKeys, initialRefType, initialRefId, editDocument]);

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const createDocumentMut = useMutation({
        mutationFn: async (body: any) => {
            if (editDocument) {
                const res: any = await documentApi.update(body);
                if (res?.success === false) throw new Error(res.error?.message ?? "Update error");
                return res;
            } else {
                const res: any = await documentApi.create(body);
                if (res?.success === false) throw new Error(res.error?.message ?? "Upload error");
                return res;
            }
        },
        onSuccess: async (res) => {
            toast.success(String(t(editDocument ? "documentCenter.updateSuccess" : "documentCenter.createSuccess", { defaultValue: editDocument ? "Đã cập nhật tài liệu thành công" : "Đã tạo tài liệu thành công" })));
            await qc.invalidateQueries({ queryKey: ["documentCenter", "documents"] });
            if (onSuccess) {
                onSuccess(res.data || res);
            }
            
            setIsUploading(false); // Make sure to stop loading if it was
            
            // Queue logic
            if (fileQueue.length > 0 && currentQueueIndex < fileQueue.length - 1) {
                setCurrentQueueIndex(prev => prev + 1);
                // The useEffect will trigger and populate the form for the next file
            } else {
                handleClose();
            }
        },
        onError: (err: any) => {
            setIsUploading(false);
            toast.error(err.message || String(t("common.toast.error")));
        },
    });

    // Watch queue index to init form
    useEffect(() => {
        if (fileQueue.length > 0 && currentQueueIndex < fileQueue.length) {
            const f = fileQueue[currentQueueIndex];
            setDocumentTitle(f.name.replace(/\.[^/.]+$/, ""));
            setUploadedFileName(f.name);
            setFileId(""); // ensure we upload on save
        }
    }, [currentQueueIndex, fileQueue]);

    const handleUploadSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setFileQueue(files);
        setCurrentQueueIndex(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isUploading || createDocumentMut.isPending) return;
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            setFileQueue(files);
            setCurrentQueueIndex(0);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleSkip = () => {
        if (fileQueue.length > 0 && currentQueueIndex < fileQueue.length - 1) {
            setCurrentQueueIndex(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleSave = async () => {
        const fileToUpload = fileQueue[0] ? fileQueue[currentQueueIndex] : null;

        if (!fileId && !fileToUpload) {
            toast.error(String(t("documentCenter.validation.missingFile", { defaultValue: "Vui lòng chọn hoặc tải lên một file đính kèm" })));
            return;
        }

        const title = String(documentTitle || "").trim();
        const type = String(documentType || "").trim();

        if (!title) {
            toast.error(String(t("documentCenter.validation.missingTitle", { defaultValue: "Vui lòng nhập tên tài liệu" })));
            return;
        }

        if (!type) {
            toast.error(String(t("documentCenter.validation.missingType", { defaultValue: "Vui lòng chọn phân loại tài liệu" })));
            return;
        }

        const commonKeysArray = String(commonKeys || "").trim()
            ? String(commonKeys || "")
                  .split(",")
                  .map((k) => k.trim())
                  .filter(Boolean)
            : [];

        if (editDocument) {
            const updateBody: DocumentUpdateBody = {
                documentId: editDocument.documentId,
                documentType: type,
                documentTitle: title,
                commonKeys: commonKeysArray,
                jsonContent: {
                    ...editDocument.jsonContent,
                    documentTitle: title,
                    documentStatus,
                    commonKeys: commonKeysArray,
                },
            };
            createDocumentMut.mutate(updateBody);
        } else {
            let actualFileId = fileId;
            
            // Upload the file if it's new and hasn't been uploaded
            if (!actualFileId && fileToUpload) {
                try {
                    setIsUploading(true);
                    const formData = buildFileUploadFormData(fileToUpload, {
                        fileTags: ["DocumentCenter", refType || "General"].filter(Boolean),
                    });
                    const uploadRes: any = await fileApi.upload(formData);
                    actualFileId = uploadRes?.data?.fileId ?? uploadRes?.fileId;
                } catch (err: any) {
                    toast.error(err.message || "Failed to upload file");
                    setIsUploading(false);
                    return;
                }
            }

            if (!actualFileId) {
                toast.error(String(t("documentCenter.validation.missingFile", { defaultValue: "Vui lòng chọn hoặc tải lên một file đính kèm" })));
                setIsUploading(false);
                return;
            }

            const createBody: DocumentCreateRefBody = {
                fileId: actualFileId,
                documentType: type,
                documentTitle: title,
                refType: String(refType || "").trim() ? String(refType || "").trim() : undefined,
                refId: String(refId || "").trim() ? String(refId || "").trim() : undefined,
                commonKeys: commonKeysArray,
                jsonContent: {
                    documentTitle: title,
                    documentStatus,
                },
            };
            createDocumentMut.mutate(createBody);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl border border-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {editDocument 
                                ? String(t("documentCenter.uploadModal.editTitle", { defaultValue: "Chỉnh sửa tài liệu" })) 
                                : String(t("documentCenter.uploadModal.title", { defaultValue: "Tạo tài liệu mới" }))}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {editDocument 
                                ? String(t("documentCenter.uploadModal.editDesc", { defaultValue: "Cập nhật thông tin cho tài liệu này." })) 
                                : String(t("documentCenter.uploadModal.desc", { defaultValue: "Nhập thông tin cơ bản và đính kèm file cho tài liệu." }))}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {!editDocument && (
                        <div className="space-y-4">
                            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                                File đính kèm
                            </div>

                            <Tabs defaultValue="upload" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="upload">{String(t("documentCenter.uploadModal.file"))}</TabsTrigger>
                                    <TabsTrigger value="existing">{String(t("documentCenter.uploadModal.existingFile", { defaultValue: "Chọn file đã có" }))}</TabsTrigger>
                                </TabsList>

                                <TabsContent value="upload" className="pt-4">
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                            isUploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                                        }`}
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                    >
                                        <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleUploadSelect} disabled={isUploading || createDocumentMut.isPending} />
                                        <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                                            <Upload className={`h-6 w-6 ${isUploading ? "animate-bounce" : ""}`} />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            {isUploading 
                                                ? String(t("documentCenter.uploadModal.uploading")) 
                                                : fileQueue.length > 0 && fileQueue[currentQueueIndex]
                                                    ? `Đã chọn: ${fileQueue[currentQueueIndex].name}`
                                                    : uploadedFileName || String(t("documentCenter.uploadModal.dropzone"))}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {String(t("documentCenter.uploadModal.supportedFormats", { defaultValue: "Hỗ trợ các định dạng: PDF, DOCX, XLSX, Ảnh..." }))}
                                        </p>
                                        
                                        {uploadedFileName && fileId && !isUploading && (
                                            <div className="flex items-center justify-center gap-2 mt-4 text-success text-sm font-medium">
                                                <Check className="h-4 w-4" /> {String(t("documentCenter.fileUploaded"))} ({fileId})
                                            </div>
                                        )}
                                        
                                        {fileQueue.length > 1 && !isUploading && (
                                            <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground text-xs font-medium">
                                                Hàng đợi: {currentQueueIndex + 1} / {fileQueue.length} file (Xác nhận hoặc Bỏ qua để chuyển file)
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="existing" className="pt-4">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-foreground">
                                            {String(t("documentCenter.uploadModal.searchExisting", { defaultValue: "Tìm kiếm file đã tồn tại trên hệ thống" }))}
                                        </Label>
                                        <SearchableSelect
                                            value={fileId || null}
                                            options={fileOptions}
                                            placeholder={String(t("documentCenter.uploadModal.searchFilePlaceholder", { defaultValue: "Tìm file theo tên hoặc ID..." }))}
                                            searchPlaceholder={String(t("documentCenter.uploadModal.searchFileInputPlaceholder", { defaultValue: "Nhập tên file..." }))}
                                            loading={filesQuery.isLoading}
                                            error={filesQuery.isError}
                                            onChange={(val) => {
                                                setFileId(val || "");
                                                if (val) {
                                                    const f = filesQuery.data?.find((x) => x.fileId === val);
                                                    if (f && !String(documentTitle || "").trim()) {
                                                        setDocumentTitle(f.fileName.replace(/\.[^/.]+$/, ""));
                                                    }
                                                }
                                            }}
                                            resetKey={open ? "open" : "closed"}
                                            filterMode="server"
                                            searchValue={fileSearch}
                                            onSearchChange={setFileSearch}
                                            allowCustomValue={false}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {/* Phần 2: Thông tin cơ bản */}
                    <div className="space-y-4">
                        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                                {editDocument ? "1" : "2"}
                            </span>
                            {String(t("documentCenter.uploadModal.basicInfo", { defaultValue: "Thông tin cơ bản" }))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-sm font-medium text-foreground">
                                    {String(t("documentCenter.uploadModal.documentTitle"))} <span className="text-destructive">*</span>
                                </Label>
                                <Input placeholder={String(t("documentCenter.uploadModal.documentTitlePlaceholder"))} value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">{String(t("documentCenter.uploadModal.documentStatus"))}</Label>
                                <Select value={documentStatus} onValueChange={(v: DocumentStatus) => setDocumentStatus(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={String(t("documentCenter.uploadModal.documentStatusPlaceholder"))} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DOCUMENT_STATUS_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">
                                    {String(t("documentCenter.uploadModal.documentType", { defaultValue: "Phân loại tài liệu" }))} <span className="text-destructive">*</span>
                                </Label>
                                <Select value={documentType} onValueChange={setDocumentType} disabled={Boolean(fixedDocumentType) || typesLoading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {documentType && !documentTypes?.includes(documentType) && (
                                            <SelectItem value={documentType}>{documentType}</SelectItem>
                                        )}
                                        {documentTypes?.map((t: string) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-sm font-medium text-foreground">{String(t("documentCenter.uploadModal.commonKeys"))}</Label>
                                <Input placeholder={String(t("documentCenter.uploadModal.commonKeysPlaceholder"))} value={commonKeys} onChange={(e) => setCommonKeys(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                    <div className="text-sm font-medium text-muted-foreground">
                        {fileQueue.length > 1 ? `Đang xử lý ${currentQueueIndex + 1} / ${fileQueue.length} file` : ""}
                    </div>
                    <div className="flex items-center gap-3">
                        {fileQueue.length > 1 && currentQueueIndex < fileQueue.length - 1 && (
                            <Button variant="secondary" onClick={handleSkip} disabled={createDocumentMut.isPending || isUploading} type="button">
                                Bỏ qua
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleClose} type="button">
                            {String(t("common.cancel", { defaultValue: "Hủy" }))}
                        </Button>
                        <Button onClick={handleSave} disabled={createDocumentMut.isPending || isUploading || (!fileId && !fileQueue[currentQueueIndex])} type="button">
                            {createDocumentMut.isPending || isUploading ? <Upload className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {fileQueue.length > 1 && currentQueueIndex < fileQueue.length - 1 ? "Lưu và Tiếp tục" : String(t("common.save"))}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
