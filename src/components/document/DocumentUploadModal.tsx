import React, { useRef, useState, useMemo } from "react";
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
import type { DocumentStatus, DocumentCreateRefBody } from "@/api/documents";
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
}

const DOCUMENT_STATUS_OPTIONS: { label: string; value: DocumentStatus }[] = [
    { label: "Draft (Bản nháp)", value: "Draft" },
    { label: "Issued (Đã ban hành)", value: "Issued" },
    { label: "Revised (Đã sửa đổi)", value: "Revised" },
    { label: "Cancelled (Đã huỷ)", value: "Cancelled" },
];

export function DocumentUploadModal({ open, onClose, onSuccess, fixedDocumentType }: DocumentUploadModalProps) {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const { data: documentTypes, isLoading: typesLoading } = useEnumList("documentType", { enabled: open });

    const [documentTitle, setDocumentTitle] = useState("");
    const [documentStatus, setDocumentStatus] = useState<DocumentStatus>("Issued");
    const [documentType, setDocumentType] = useState<string>(fixedDocumentType || "");
    const [refType, setRefType] = useState<string>("");
    const [commonKeys, setCommonKeys] = useState<string>("");

    const [fileId, setFileId] = useState<string>("");
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fileSearch, setFileSearch] = useState("");
    const debouncedFileSearch = useDebouncedValue(fileSearch, 300);

    const filesQuery = useQuery({
        queryKey: ["documentCenter", "files-search", debouncedFileSearch],
        queryFn: async () => {
            const res: any = await fileApi.list({ search: debouncedFileSearch, itemsPerPage: 50, page: 1 });
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
        setCommonKeys("");
        setFileId("");
        setUploadedFileName(null);
        setFileSearch("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Update documentType if fixedDocumentType changes
    React.useEffect(() => {
        if (open) {
            setDocumentType(fixedDocumentType || "");
        }
    }, [open, fixedDocumentType]);

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const createDocumentMut = useMutation({
        mutationFn: async (body: DocumentCreateRefBody) => {
            const res: any = await documentApi.create(body);
            if (res?.success === false) throw new Error(res.error?.message ?? "Upload error");
            return res;
        },
        onSuccess: async (res) => {
            toast.success(String(t("documentCenter.createSuccess", { defaultValue: "Đã tạo tài liệu thành công" })));
            await qc.invalidateQueries({ queryKey: ["documentCenter", "documents"] });
            if (onSuccess) {
                onSuccess(res.data || res);
            }
            handleClose();
        },
        onError: (err: any) => {
            toast.error(err.message || String(t("common.toast.error")));
        },
    });

    const handleUploadSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const file = files[0];

        try {
            setIsUploading(true);
            const formData = buildFileUploadFormData(file, {
                fileTags: ["DocumentCenter", refType || "General"].filter(Boolean),
            });

            const uploadRes: any = await fileApi.upload(formData);
            const newFileId = uploadRes?.data?.fileId ?? uploadRes?.fileId;

            if (newFileId) {
                setFileId(newFileId);
                setUploadedFileName(file.name);
                if (!documentTitle.trim()) {
                    setDocumentTitle(file.name.replace(/\.[^/.]+$/, "")); // remove extension
                }
                toast.success(String(t("documentCenter.fileUploaded", { defaultValue: "Đã tải file lên thành công" })));
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to upload file");
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleSave = () => {
        if (!fileId) {
            toast.error(String(t("documentCenter.validation.missingFile", { defaultValue: "Vui lòng chọn hoặc tải lên một file đính kèm" })));
            return;
        }

        if (!documentTitle.trim()) {
            toast.error(String(t("documentCenter.validation.missingTitle", { defaultValue: "Vui lòng nhập tên tài liệu" })));
            return;
        }

        if (!documentType) {
            toast.error(String(t("documentCenter.validation.missingType", { defaultValue: "Vui lòng chọn phân loại tài liệu" })));
            return;
        }

        const body: DocumentCreateRefBody = {
            fileId,
            documentType,
            refType: refType.trim() ? refType.trim() : undefined,
            commonKeys: commonKeys.trim()
                ? commonKeys
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean)
                : [],
            jsonContent: {
                documentTitle: documentTitle.trim(),
                documentStatus,
            },
        };

        createDocumentMut.mutate(body);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl border border-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">{String(t("documentCenter.uploadModal.title", { defaultValue: "Tạo tài liệu mới" }))}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{String(t("documentCenter.uploadModal.desc", { defaultValue: "Nhập thông tin cơ bản và đính kèm file cho tài liệu." }))}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Phần 1: Đính kèm File */}
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
                                >
                                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleUploadSelect} disabled={isUploading} />
                                    <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                                        <Upload className={`h-6 w-6 ${isUploading ? "animate-bounce" : ""}`} />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        {isUploading ? String(t("documentCenter.uploadModal.uploading")) : uploadedFileName || String(t("documentCenter.uploadModal.dropzone"))}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {String(t("documentCenter.uploadModal.supportedFormats", { defaultValue: "Hỗ trợ các định dạng: PDF, DOCX, XLSX, Ảnh..." }))}
                                    </p>
                                    {uploadedFileName && fileId && !isUploading && (
                                        <div className="flex items-center justify-center gap-2 mt-4 text-success text-sm font-medium">
                                            <Check className="h-4 w-4" /> {String(t("documentCenter.fileUploaded"))} ({fileId})
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
                                                if (f && !documentTitle.trim()) {
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

                    {/* Phần 2: Thông tin cơ bản */}
                    <div className="space-y-4">
                        <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
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
                                        {documentTypes?.map((t: string) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">{String(t("documentCenter.uploadModal.refType", { defaultValue: "Phân loại (REF TEST)" }))}</Label>
                                <Input
                                    placeholder={String(t("documentCenter.uploadModal.refTypePlaceholder", { defaultValue: "VD: Protocol, SOP, TCVN..." }))}
                                    value={refType}
                                    onChange={(e) => setRefType(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="text-sm font-medium text-foreground">{String(t("documentCenter.uploadModal.commonKeys"))}</Label>
                                <Input placeholder={String(t("documentCenter.uploadModal.commonKeysPlaceholder"))} value={commonKeys} onChange={(e) => setCommonKeys(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-muted/20 gap-3">
                    <Button variant="outline" onClick={handleClose} type="button">
                        {String(t("common.cancel", { defaultValue: "Hủy" }))}
                    </Button>
                    <Button onClick={handleSave} disabled={createDocumentMut.isPending || isUploading || !fileId} type="button">
                        {createDocumentMut.isPending ? String(t("documentCenter.uploadModal.saving")) : String(t("common.save"))}
                    </Button>
                </div>
            </div>
        </div>
    );
}
