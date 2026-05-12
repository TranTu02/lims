import { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { FileText, Upload, Download, Eye, Image as ImageIcon, File, Search, FolderOpen, Shield, Archive, Loader2, FileBarChart, X, ExternalLink, Files, FileStack, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

import { documentApi } from "@/api/documents";
import type { DocumentInfo } from "@/api/documents";
import { fileApi } from "@/api/files";
import type { FileInfo } from "@/api/files";
import { useEnumList } from "@/api/chemical";
import { DEFAULT_PAGINATION_SIZE, DATE_FORMAT } from "@/config/constants";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { TableHeaderFilter } from "@/components/reception/TableHeaderFilter";

const DOCUMENT_STATUS_OPTIONS = ["Draft", "Issued", "Revised", "Cancelled"];
const DOCUMENT_STATUS_MAP: Record<string, string> = {
    Draft: "Draft (Bản nháp)",
    Issued: "Issued (Đã ban hành)",
    Revised: "Revised (Đã sửa đổi)",
    Cancelled: "Cancelled (Đã huỷ)",
};

// ─── Types ───────────────────────────────────────────────────────────────────

type TabKey = "all" | "protocol" | "other";
type ViewMode = "documents" | "files";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assertSuccess<T>(res: { success?: boolean; data?: T; error?: { message?: string } | null }): T {
    // Backend list endpoints return { data, pagination } without `success`
    // Mutation endpoints return { success, statusCode, data, meta, error }
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }
    return (res.data !== undefined ? res.data : res) as T;
}

function assertSuccessWithMeta<T>(res: {
    success?: boolean;
    data?: T;
    meta?: {
        page: number;
        itemsPerPage: number;
        totalItems?: number;
        total?: number;
        totalPages: number;
    } | null;
    error?: { message?: string } | null;
}) {
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }

    // Handle both `meta` (wrapped) and `pagination` (raw backend) formats
    const rawAny = res as unknown as Record<string, unknown>;
    const meta = (res.meta ?? rawAny.pagination ?? null) as {
        page: number | string;
        itemsPerPage: number;
        totalItems?: number;
        total?: number;
        totalPages: number;
    } | null;

    const normalizedMeta =
        meta && typeof meta === "object"
            ? {
                  ...meta,
                  page: typeof meta.page === "string" ? parseInt(meta.page, 10) : meta.page,
                  total: typeof meta.total === "number" ? meta.total : typeof meta.totalItems === "number" ? meta.totalItems : 0,
              }
            : null;

    return { data: res.data as T, meta: normalizedMeta };
}

/** Check if a mime type / file extension is previewable inline in the browser */
function isPreviewable(mimeType?: string | null, fileName?: string | null): "pdf" | "image" | "office" | null {
    const mime = (mimeType ?? "").toLowerCase();
    const name = String(fileName ?? "").split("?")[0].toLowerCase();

    if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
    if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|bmp)$/.test(name)) return "image";
    if (mime.includes("officedocument") || mime.includes("ms-word") || mime.includes("ms-excel") || /\.(docx?|xlsx?)$/.test(name)) return "office";
    return null;
}

function getFileIcon(mimeType?: string | null, fileName?: string | null) {
    const kind = isPreviewable(mimeType, fileName);
    switch (kind) {
        case "pdf":
            return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
        case "image":
            return <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />;
        case "office":
            return <FileBarChart className="h-5 w-5 text-green-500 shrink-0" />;
        default:
            return <File className="h-5 w-5 text-muted-foreground shrink-0" />;
    }
}

function formatFileSize(bytes?: number | null): string {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

const documentCenterKeys = {
    documents: (page: number, search: string, filters: any = {}) => ["documentCenter", "documents", page, search, filters] as const,
    files: (page: number, search: string, filters: any = {}) => ["documentCenter", "files", page, search, filters] as const,
    fileUrl: (fileId: string) => ["documentCenter", "fileUrl", fileId] as const,
    docUrl: (docId: string) => ["documentCenter", "docUrl", docId] as const,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function DocumentCenter() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabKey>("all");
    const [viewMode, setViewMode] = useState<ViewMode>("documents");
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

    const { data: documentTypes } = useEnumList("documentType");

    // Documents: selected for preview
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    // Preview modal state
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<"pdf" | "image" | "office" | null>(null);
    const [previewFileName, setPreviewFileName] = useState<string>("");
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<DocumentInfo | null>(null);

    // Upload / Edit modal state
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [editDocument, setEditDocument] = useState<DocumentInfo | null>(null);

    // ─── Fetch document list ─────────────────────────────────────
    const documentsQuery = useQuery({
        queryKey: documentCenterKeys.documents(page, searchTerm, filterValues),
        queryFn: async () =>
            assertSuccessWithMeta(
                (await documentApi.list({
                    page,
                    itemsPerPage: DEFAULT_PAGINATION_SIZE,
                    search: searchTerm || undefined,
                    sortColumn: "createdAt",
                    sortDirection: "DESC",
                    ...filterValues,
                })) as any,
            ),
        enabled: viewMode === "documents",
    });

    // ─── Fetch file list ─────────────────────────────────────────
    const filesQuery = useQuery({
        queryKey: documentCenterKeys.files(page, searchTerm, filterValues),
        queryFn: async () =>
            assertSuccessWithMeta(
                (await fileApi.list({
                    page,
                    itemsPerPage: DEFAULT_PAGINATION_SIZE,
                    search: searchTerm || undefined,
                    sortColumn: "createdAt",
                    sortDirection: "DESC",
                    ...filterValues,
                })) as any,
            ),
        enabled: viewMode === "files",
    });

    // ─── Filter documents by tab ─────────────────────────────────
    const filteredDocuments = useMemo(() => {
        const docs = documentsQuery.data?.data ?? [];
        if (!Array.isArray(docs)) return [];
        switch (activeTab) {
            case "protocol":
                return docs.filter(
                    (d) =>
                        d.refType === "Protocol" ||
                        (d.commonKeys ?? []).some((k: string) => k.startsWith("PRO")) ||
                        (d.documentTitle ?? "").toLowerCase().includes("protocol") ||
                        (d.documentTitle ?? "").toLowerCase().includes("phương pháp") ||
                        (d.documentTitle ?? "").toLowerCase().includes("sop") ||
                        (d.documentTitle ?? "").toLowerCase().includes("tcvn") ||
                        (d.documentTitle ?? "").toLowerCase().includes("iso"),
                );
            case "other":
                return docs.filter(
                    (d) =>
                        d.refType !== "Protocol" &&
                        !(d.commonKeys ?? []).some((k: string) => k.startsWith("PRO")) &&
                        !(d.documentTitle ?? "").toLowerCase().includes("protocol") &&
                        !(d.documentTitle ?? "").toLowerCase().includes("phương pháp") &&
                        !(d.documentTitle ?? "").toLowerCase().includes("sop") &&
                        !(d.documentTitle ?? "").toLowerCase().includes("tcvn") &&
                        !(d.documentTitle ?? "").toLowerCase().includes("iso"),
                );
            default:
                return docs;
        }
    }, [documentsQuery.data, activeTab]);

    const filteredFiles = useMemo(() => {
        return (filesQuery.data?.data ?? []) as FileInfo[];
    }, [filesQuery.data]);

    // ─── Preview / Download handlers ─────────────────────────────

    const handlePreviewDocument = useCallback(
        async (doc: DocumentInfo) => {
            setSelectedDocId(doc.documentId);
            setPreviewDoc(doc);
            setPreviewLoading(true);
            try {
                const res = await documentApi.url(doc.documentId);
                const urlData = assertSuccess(res);
                const kind = isPreviewable(null, urlData.url);
                if (kind === "pdf" || kind === "image") {
                    setPreviewUrl(urlData.url);
                    setPreviewType(kind);
                    setPreviewFileName(doc.documentTitle ?? doc.documentId);
                } else if (kind === "office") {
                    setPreviewUrl(urlData.url);
                    setPreviewType("office");
                    setPreviewFileName(doc.documentTitle ?? doc.documentId);
                } else {
                    // Not previewable → download directly
                    window.open(urlData.url, "_blank");
                }
            } catch {
                toast.error(String(t("common.toast.failed")));
            } finally {
                setPreviewLoading(false);
            }
        },
        [t],
    );

    const handleDownloadDocument = useCallback(
        async (doc: DocumentInfo) => {
            try {
                const res = await documentApi.url(doc.documentId);
                const urlData = assertSuccess(res);
                window.open(urlData.url, "_blank");
            } catch {
                toast.error(String(t("common.toast.failed")));
            }
        },
        [t],
    );

    const handlePreviewFile = useCallback(
        async (file: FileInfo) => {
            setSelectedFileId(file.fileId);
            setPreviewDoc(null);
            setPreviewLoading(true);
            try {
                const res = await fileApi.url(file.fileId);
                const urlData = assertSuccess(res);
                const kind = isPreviewable(file.mimeType, file.fileName);
                if (kind === "pdf" || kind === "image") {
                    setPreviewUrl(urlData.url);
                    setPreviewType(kind);
                    setPreviewFileName(file.fileName);
                } else if (kind === "office") {
                    setPreviewUrl(urlData.url);
                    setPreviewType("office");
                    setPreviewFileName(file.fileName);
                } else {
                    window.open(urlData.url, "_blank");
                }
            } catch {
                toast.error(String(t("common.toast.failed")));
            } finally {
                setPreviewLoading(false);
            }
        },
        [t],
    );

    const handleDownloadFile = useCallback(
        async (file: FileInfo) => {
            try {
                const res = await fileApi.url(file.fileId);
                const urlData = assertSuccess(res);
                window.open(urlData.url, "_blank");
            } catch {
                toast.error(String(t("common.toast.failed")));
            }
        },
        [t],
    );

    const closePreview = useCallback(() => {
        setPreviewUrl(null);
        setPreviewType(null);
        setPreviewFileName("");
        setPreviewDoc(null);
    }, []);

    // ─── Tab data ────────────────────────────────────────────────

    const tabs: {
        key: TabKey;
        icon: React.ReactNode;
        label: string;
        desc: string;
    }[] = [
        {
            key: "all",
            icon: <FolderOpen className="h-5 w-5" />,
            label: String(t("documentCenter.tabs.all", { defaultValue: "Toàn bộ" })),
            desc: String(
                t("documentCenter.headers.allDesc", {
                    defaultValue: "Tất cả tài liệu trong hệ thống",
                }),
            ),
        },
        {
            key: "protocol",
            icon: <Shield className="h-5 w-5" />,
            label: String(t("documentCenter.tabs.protocol", { defaultValue: "Phương pháp" })),
            desc: String(
                t("documentCenter.headers.protocolDesc", {
                    defaultValue: "SOP, TCVN, ISO, quy trình",
                }),
            ),
        },
        {
            key: "other",
            icon: <Archive className="h-5 w-5" />,
            label: String(t("documentCenter.tabs.other", { defaultValue: "Khác" })),
            desc: String(
                t("documentCenter.headers.otherDesc", {
                    defaultValue: "Admin, tài chính, khác",
                }),
            ),
        },
    ];

    // ─── Pagination ──────────────────────────────────────────────

    const currentMeta = viewMode === "documents" ? documentsQuery.data?.meta : filesQuery.data?.meta;
    const totalPages = currentMeta?.totalPages ?? 1;
    const totalItems = currentMeta?.totalItems ?? currentMeta?.total ?? 0;

    // ─── Render ──────────────────────────────────────────────────

    return (
        <div className="p-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-2xl font-semibold text-foreground">{String(t("documentCenter.title", { defaultValue: "Trung tâm tài liệu" }))}</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={String(t("common.search", { defaultValue: "Tìm kiếm..." }))}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10 w-64 bg-background"
                        />
                    </div>
                    <Button className="flex items-center gap-2" onClick={() => {
                        setEditDocument(null);
                        setUploadModalOpen(true);
                    }}>
                        <Upload className="h-4 w-4" />
                        {String(t("documentCenter.upload", { defaultValue: "Tải lên tài liệu" }))}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
                {/* ── Sidebar ── */}
                <div className="col-span-3 flex flex-col gap-4">
                    {/* View Mode Toggle */}
                    <div className="bg-card rounded-lg border border-border p-2 flex gap-1">
                        <button
                            onClick={() => {
                                setViewMode("documents");
                                setPage(1);
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                viewMode === "documents" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <FileStack className="h-4 w-4" />
                            {String(
                                t("documentCenter.viewMode.documents", {
                                    defaultValue: "Tài liệu",
                                }),
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setViewMode("files");
                                setPage(1);
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                viewMode === "files" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"
                            }`}
                        >
                            <Files className="h-4 w-4" />
                            {String(t("documentCenter.viewMode.files", { defaultValue: "Files" }))}
                        </button>
                    </div>

                    {/* Category Tabs (only shown in documents view) */}
                    {viewMode === "documents" && (
                        <div className="bg-card rounded-lg border border-border p-3 flex-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">{String(t("documentCenter.categories", { defaultValue: "Phân loại" }))}</div>
                            <nav className="space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => {
                                            setActiveTab(tab.key);
                                            setPage(1);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                            activeTab === tab.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                                        }`}
                                    >
                                        {tab.icon}
                                        <div className="text-left">
                                            <div>{tab.label}</div>
                                            <div className="text-xs opacity-70 font-normal">{tab.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="text-xs text-muted-foreground">{String(t("documentCenter.totalItems", { defaultValue: "Tổng số" }))}</div>
                        <div className="text-xl font-semibold text-foreground mt-1">{totalItems.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                            {String(t("common.page", { defaultValue: "Trang" }))} {page}/{totalPages}
                        </div>
                    </div>
                </div>

                {/* ── Main Content ── */}
                <div className="col-span-9 flex flex-col gap-4 min-h-0">
                    {/* Content based on viewMode */}
                    {viewMode === "documents" ? (
                        <DocumentsListView
                            documents={filteredDocuments}
                            isLoading={documentsQuery.isLoading}
                            selectedId={selectedDocId}
                            onSelect={setSelectedDocId}
                            onPreview={handlePreviewDocument}
                            onDownload={handleDownloadDocument}
                            onEdit={(doc) => {
                                setEditDocument(doc);
                                setUploadModalOpen(true);
                            }}
                            previewLoading={previewLoading}
                            t={t}
                            filterValues={filterValues}
                            onFilterChange={(col, vals) => {
                                setFilterValues(prev => ({ ...prev, [col]: vals }));
                                setPage(1);
                            }}
                            documentTypes={documentTypes || []}
                        />
                    ) : (
                        <FilesListView
                            files={filteredFiles}
                            isLoading={filesQuery.isLoading}
                            selectedId={selectedFileId}
                            onSelect={setSelectedFileId}
                            onPreview={handlePreviewFile}
                            onDownload={handleDownloadFile}
                            previewLoading={previewLoading}
                            t={t}
                        />
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 py-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                {String(t("common.prev", { defaultValue: "Trước" }))}
                            </Button>
                            <span className="text-sm text-muted-foreground px-3">
                                {page} / {totalPages}
                            </span>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                {String(t("common.next", { defaultValue: "Sau" }))}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Preview Modal Overlay ── */}
            {previewUrl &&
                createPortal(
                    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-6" onClick={closePreview}>
                        <div className="bg-background rounded-xl border border-border shadow-2xl w-[95vw] h-[95vh] max-w-none flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
                                <div className="flex items-center gap-3 min-w-0">
                                    {previewType === "pdf" && <FileText className="h-5 w-5 text-red-500 shrink-0" />}
                                    {previewType === "image" && <ImageIcon className="h-5 w-5 text-blue-500 shrink-0" />}
                                    {previewType === "office" && <FileBarChart className="h-5 w-5 text-green-500 shrink-0" />}
                                    <span className="font-medium text-foreground truncate">{previewFileName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => window.open(previewType === "office" ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl || "")}` : previewUrl || "", "_blank")}>
                                        <ExternalLink className="h-4 w-4 mr-1" />
                                        {String(
                                            t("documentCenter.preview.openNew", {
                                                defaultValue: "Mở tab mới",
                                            }),
                                        )}
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={closePreview}>
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            {/* Modal Body */}
                            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                                {previewDoc && (
                                    <PreviewSidePanel 
                                        doc={previewDoc} 
                                        t={t} 
                                        documentTypes={documentTypes || []} 
                                        onUpdated={(updatedDoc: DocumentInfo) => {
                                            setPreviewDoc(updatedDoc);
                                            // The list query will be invalidated in the mutation, so the table will update.
                                        }} 
                                    />
                                )}
                                <div className="flex-1 relative bg-muted/20">
                                    {previewType === "pdf" && <iframe src={previewUrl} className="absolute inset-0 w-full h-full border-0" title="PDF Preview" />}
                                    {previewType === "image" && (
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <img src={previewUrl} alt={previewFileName} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                        </div>
                                    )}
                                    {previewType === "office" && <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(previewUrl || "")}&embedded=true`} className="absolute inset-0 w-full h-full border-0" title="Office Preview" />}
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}

            <DocumentUploadModal 
                open={uploadModalOpen} 
                onClose={() => {
                    setUploadModalOpen(false);
                    setTimeout(() => setEditDocument(null), 300);
                }} 
                editDocument={editDocument}
            />
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DocumentsListView({
    documents,
    isLoading,
    selectedId,
    onSelect,
    onPreview,
    onDownload,
    onEdit,
    previewLoading,
    t,
    filterValues,
    onFilterChange,
    documentTypes,
}: {
    documents: DocumentInfo[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onPreview: (doc: DocumentInfo) => void;
    onDownload: (doc: DocumentInfo) => void;
    onEdit: (doc: DocumentInfo) => void;
    previewLoading: boolean;
    t: (key: string, opts?: Record<string, unknown>) => unknown;
    filterValues: Record<string, string[]>;
    onFilterChange: (col: string, vals: string[]) => void;
    documentTypes: string[];
}) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-lg border border-border flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!documents.length) {
        return (
            <div className="bg-card rounded-lg border border-border flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground py-12">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p>
                        {String(
                            t("documentCenter.noData", {
                                defaultValue: "Không có tài liệu nào",
                            }),
                        )}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg border border-border flex-1 overflow-hidden flex flex-col">
            {/* Table Header */}
            <div className="bg-muted/50 border-b border-border">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-3">{String(t("documentCenter.col.title", { defaultValue: "Tiêu đề" }))}</div>
                    <div className="col-span-2">
                        <TableHeaderFilter
                            title={String(t("documentCenter.col.type", { defaultValue: "Phân loại" }))}
                            type="enum"
                            options={documentTypes}
                            value={filterValues["documentType"]}
                            onChange={(vals) => onFilterChange("documentType", vals)}
                        />
                    </div>
                    <div className="col-span-1">
                        <TableHeaderFilter
                            title={String(t("documentCenter.col.status", { defaultValue: "Trạng thái" }))}
                            type="enum"
                            options={DOCUMENT_STATUS_OPTIONS}
                            labelMap={DOCUMENT_STATUS_MAP}
                            value={filterValues["documentStatus"]}
                            onChange={(vals) => onFilterChange("documentStatus", vals)}
                        />
                    </div>
                    <div className="col-span-2">{String(t("documentCenter.col.ref", { defaultValue: "Tham chiếu" }))}</div>
                    <div className="col-span-2">
                        <TableHeaderFilter
                            title={String(t("documentCenter.col.date", { defaultValue: "Ngày tạo" }))}
                            type="daterange"
                            value={filterValues["createdAt"]}
                            onChange={(vals) => onFilterChange("createdAt", vals)}
                        />
                    </div>
                    <div className="col-span-2 text-right">{String(t("documentCenter.col.actions", { defaultValue: "Thao tác" }))}</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
                {documents.map((doc) => (
                    <div
                        key={doc.documentId}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 cursor-pointer transition-colors ${
                            selectedId === doc.documentId ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                        onClick={() => onSelect(doc.documentId)}
                    >
                        {/* Title + ID */}
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                            <div className="shrink-0">{getFileIcon(null, doc.documentTitle)}</div>
                            <div className="min-w-0 flex flex-col gap-1 items-start py-0.5">
                                <div className="text-sm font-semibold text-foreground truncate w-full" title={doc.documentTitle || doc.documentId}>
                                    {doc.documentTitle ?? doc.documentId}
                                </div>
                                <span className="text-[10px] bg-background border text-muted-foreground px-1.5 py-0.5 rounded shadow-sm leading-none">{doc.documentId}</span>
                            </div>
                        </div>

                        {/* Type */}
                        <div className="col-span-2">
                            {doc.documentType ? <Badge variant="secondary" className="text-[10px] font-bold uppercase">{doc.documentType}</Badge> : <span className="text-xs text-muted-foreground">-</span>}
                        </div>

                        {/* Status */}
                        <div className="col-span-1">{doc.documentStatus ? <DocumentStatusBadge status={doc.documentStatus} /> : <span className="text-xs text-muted-foreground">-</span>}</div>

                        {/* Ref */}
                        <div className="col-span-2">
                            {doc.commonKeys && doc.commonKeys.length > 0 ? (
                                <div className="flex flex-wrap gap-1" title={doc.commonKeys.join(", ")}>
                                    {doc.commonKeys.slice(0, 3).map((key, idx) => (
                                        <Badge key={idx} variant="outline" className="text-[10px] uppercase font-normal">
                                            {key}
                                        </Badge>
                                    ))}
                                    {doc.commonKeys.length > 3 && (
                                        <Badge variant="outline" className="text-[10px] text-muted-foreground bg-muted/30 font-normal">
                                            +{doc.commonKeys.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                            )}
                        </div>

                        {/* Date */}
                        <div className="col-span-2 text-sm text-muted-foreground">{doc.createdAt ? format(new Date(doc.createdAt), DATE_FORMAT.short) : "-"}</div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                disabled={previewLoading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(doc);
                                }}
                                title={String(
                                    t("documentCenter.preview.preview", {
                                        defaultValue: "Xem trước",
                                    }),
                                )}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(doc);
                                }}
                                title={String(t("common.edit", { defaultValue: "Chỉnh sửa" }))}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload(doc);
                                }}
                                title={String(
                                    t("documentCenter.preview.download", {
                                        defaultValue: "Tải xuống",
                                    }),
                                )}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FilesListView({
    files,
    isLoading,
    selectedId,
    onSelect,
    onPreview,
    onDownload,
    previewLoading,
    t,
}: {
    files: FileInfo[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onPreview: (file: FileInfo) => void;
    onDownload: (file: FileInfo) => void;
    previewLoading: boolean;
    t: (key: string, opts?: Record<string, unknown>) => unknown;
}) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-lg border border-border flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!files.length) {
        return (
            <div className="bg-card rounded-lg border border-border flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground py-12">
                    <Files className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p>
                        {String(
                            t("documentCenter.noFiles", {
                                defaultValue: "Không có file nào",
                            }),
                        )}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-lg border border-border flex-1 overflow-hidden flex flex-col">
            {/* Table Header */}
            <div className="bg-muted/50 border-b border-border">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="col-span-4">{String(t("documentCenter.col.fileName", { defaultValue: "Tên file" }))}</div>
                    <div className="col-span-2">{String(t("documentCenter.col.type", { defaultValue: "Loại" }))}</div>
                    <div className="col-span-2">{String(t("documentCenter.col.size", { defaultValue: "Kích thước" }))}</div>
                    <div className="col-span-2">{String(t("documentCenter.col.date", { defaultValue: "Ngày tạo" }))}</div>
                    <div className="col-span-2 text-right">{String(t("documentCenter.col.actions", { defaultValue: "Thao tác" }))}</div>
                </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-border">
                {files.map((file) => (
                    <div
                        key={file.fileId}
                        className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 cursor-pointer transition-colors ${
                            selectedId === file.fileId ? "bg-primary/5 border-l-2 border-l-primary" : ""
                        }`}
                        onClick={() => onSelect(file.fileId)}
                    >
                        {/* File name */}
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                            <div className="shrink-0">{getFileIcon(file.mimeType, file.fileName)}</div>
                            <div className="min-w-0 flex flex-col gap-1 items-start py-0.5">
                                <div className="text-sm font-semibold text-foreground truncate w-full" title={file.fileName || file.fileId}>
                                    {file.fileName || file.fileId}
                                </div>
                                <span className="text-[10px] bg-background border text-muted-foreground px-1.5 py-0.5 rounded shadow-sm leading-none">{file.fileId}</span>
                            </div>
                        </div>

                        {/* Type */}
                        <div className="col-span-2">
                            <Badge variant="secondary" className="text-xs max-w-full truncate">
                                {(() => {
                                    // Prefer extension from fileName
                                    const ext = file.fileName?.split(".").pop();
                                    if (ext && ext.length <= 8) return ext.toUpperCase();
                                    // Fallback: extract short suffix from mimeType
                                    const sub = file.mimeType?.split("/").pop() || "-";
                                    return sub.length > 8 ? sub.slice(0, 8).toUpperCase() + "…" : sub.toUpperCase();
                                })()}
                            </Badge>
                        </div>

                        {/* Size */}
                        <div className="col-span-2 text-sm text-muted-foreground">{formatFileSize(file.fileSize)}</div>

                        {/* Date */}
                        <div className="col-span-2 text-sm text-muted-foreground">{file.createdAt ? format(new Date(file.createdAt), DATE_FORMAT.short) : "-"}</div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                disabled={previewLoading}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(file);
                                }}
                                title={String(
                                    t("documentCenter.preview.preview", {
                                        defaultValue: "Xem trước",
                                    }),
                                )}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload(file);
                                }}
                                title={String(
                                    t("documentCenter.preview.download", {
                                        defaultValue: "Tải xuống",
                                    }),
                                )}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DocumentStatusBadge({ status }: { status: string }) {
    switch (status) {
        case "Draft":
            return (
                <Badge variant="secondary" className="text-xs">
                    {status}
                </Badge>
            );
        case "Issued":
            return <Badge className="text-xs bg-success text-success-foreground">{status}</Badge>;
        case "Revised":
            return <Badge className="text-xs bg-warning text-warning-foreground">{status}</Badge>;
        case "Cancelled":
            return (
                <Badge variant="destructive" className="text-xs">
                    {status}
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="text-xs">
                    {status}
                </Badge>
            );
    }
}

function PreviewSidePanel({ doc, t, documentTypes, onUpdated }: { doc: DocumentInfo; t: any; documentTypes: string[]; onUpdated: (doc: DocumentInfo) => void; }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const qc = useQueryClient();

    const [title, setTitle] = useState(doc.documentTitle || "");
    const [type, setType] = useState(doc.documentType || "");
    const [status, setStatus] = useState<string>(doc.documentStatus || "Issued");
    const [keys, setKeys] = useState((doc.commonKeys || []).join(", "));

    const updateMut = useMutation({
        mutationFn: async () => {
            const commonKeysArray = keys.split(",").map(k => k.trim()).filter(Boolean);
            const body = {
                documentId: doc.documentId,
                documentType: type,
                documentTitle: title,
                documentStatus: status as any,
                commonKeys: commonKeysArray,
                jsonContent: {
                    ...doc.jsonContent,
                    documentTitle: title,
                    documentStatus: status,
                    commonKeys: commonKeysArray,
                }
            };
            const res = await documentApi.update(body);
            if ((res as any)?.success === false) throw new Error((res as any).error?.message || "Error");
            return { ...doc, documentTitle: title, documentType: type, documentStatus: status as any, commonKeys: commonKeysArray, jsonContent: body.jsonContent };
        },
        onSuccess: (newDoc) => {
            toast.success("Cập nhật thành công");
            qc.invalidateQueries({ queryKey: ["documentCenter"] });
            setIsEditMode(false);
            onUpdated(newDoc);
        },
        onError: (err: any) => toast.error(err.message || "Có lỗi xảy ra")
    });

    if (isEditMode) {
        return (
            <div className="w-full md:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/10 p-5 overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Sửa thông tin</h4>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditMode(false)} disabled={updateMut.isPending}>Hủy</Button>
                </div>
                <div className="space-y-4 text-sm flex-1">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Tiêu đề <span className="text-destructive">*</span></label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tiêu đề..." disabled={updateMut.isPending} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Loại <span className="text-destructive">*</span></label>
                            <Select value={type} onValueChange={setType} disabled={updateMut.isPending}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                                <SelectContent>
                                    {documentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Trạng thái</label>
                            <Select value={status} onValueChange={setStatus} disabled={updateMut.isPending}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Chọn" /></SelectTrigger>
                                <SelectContent>
                                    {DOCUMENT_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Từ khóa</label>
                        <Input value={keys} onChange={e => setKeys(e.target.value)} placeholder="Tag 1, Tag 2..." disabled={updateMut.isPending} />
                    </div>
                </div>
                <Button className="w-full mt-4" disabled={!title || !type || updateMut.isPending} onClick={() => updateMut.mutate()}>
                    {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu thay đổi
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full md:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/10 p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">{String(t("documentCenter.preview.infoTitle", { defaultValue: "Thông tin bản ghi" }))}</h4>
                <Button size="sm" variant="ghost" className="h-8 px-2 -mr-2" onClick={() => {
                    setTitle(doc.documentTitle || "");
                    setType(doc.documentType || "");
                    setStatus(doc.documentStatus || "Issued");
                    setKeys((doc.commonKeys || []).join(", "));
                    setIsEditMode(true);
                }}>
                    <Edit className="h-4 w-4 mr-1" /> Sửa
                </Button>
            </div>
            <div className="space-y-4 text-sm">
                <div>
                    <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.id", { defaultValue: "Mã tài liệu" }))}</div>
                    <div className="font-mono bg-background px-2 py-1 rounded border shadow-sm text-xs break-all text-muted-foreground">{doc.documentId}</div>
                </div>
                <div>
                    <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.title", { defaultValue: "Tiêu đề" }))}</div>
                    <div className="font-medium text-foreground">{doc.documentTitle || "-"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.type", { defaultValue: "Loại tài liệu" }))}</div>
                        <div>{doc.documentType ? <Badge variant="secondary" className="uppercase text-[10px]">{doc.documentType}</Badge> : "-"}</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.status", { defaultValue: "Trạng thái" }))}</div>
                        <div>{doc.documentStatus ? <DocumentStatusBadge status={doc.documentStatus} /> : "-"}</div>
                    </div>
                </div>
                {(doc.refType || doc.refId) && (
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.ref", { defaultValue: "Tham chiếu" }))}</div>
                        <Badge variant="outline">{doc.refType ? `${doc.refType}: ` : ""}{doc.refId}</Badge>
                    </div>
                )}
                {doc.commonKeys && doc.commonKeys.length > 0 && (
                    <div>
                        <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.tags", { defaultValue: "Từ khóa" }))}</div>
                        <div className="flex flex-wrap gap-1">
                            {doc.commonKeys.map(k => <Badge key={k} variant="outline" className="text-[10px] font-normal">{k}</Badge>)}
                        </div>
                    </div>
                )}
                <div>
                    <div className="text-xs text-muted-foreground mb-1">{String(t("documentCenter.col.date", { defaultValue: "Ngày tạo" }))}</div>
                    <div className="text-foreground">{doc.createdAt ? format(new Date(doc.createdAt), DATE_FORMAT.short) : "-"}</div>
                </div>
            </div>
        </div>
    );
}
