import React, { useEffect, useMemo, useRef, useState, useCallback, memo } from "react";
import {
    X, Edit, Save, Upload, FileText, Printer, FileCheck, Mail, ChevronLeft, ChevronRight,
    ImageOff, Camera, Search, Building2, Plus, Loader2, User, ExternalLink,
    ClipboardList, ShieldCheck, Package, RefreshCw, Layers, Check, ChevronsUpDown, CheckSquare, Square,
} from "lucide-react";
import { useIdentityGroupsList } from "@/api/identityGroups";
import { useAnalysesUpdateBulk } from "@/api/analyses";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { receiptsUpdate, receiptsGetFull, receiptsGetReceptionEmailForm, receiptsGetFinalResultEmailForm, useExportHandover } from "@/api/receipts";
import { receiptsKeys } from "@/api/receiptsKeys";
import { samplesGetFull, samplesUpdate } from "@/api/samples";
import { fileApi, buildFileUploadFormData } from "@/api/files";
import { documentApi } from "@/api/documents";

import type { ReceiptDetail, ReceiptSample, ReceiptAnalysis, ReceiptsUpdateBody, ReceiptStatus } from "@/types/receipt";
import { cn } from "../../lib/utils";
import { ResultCertificateModal } from "./ResultCertificateModal";
import { SampleDetailModal } from "./SampleDetailModal";
import { SamplePrintLabelModal } from "./SamplePrintLabelModal";
import { AddSampleModal } from "./AddSampleModal";
import { EmailModal } from "@/components/common/EmailModal";
import ShipmentManagerModal from "./shipment/ShipmentManagerModal";

// ─── Props ──────────────────────────────────────────────────────────────────
interface ReceiptDetailModalProps {
    receipt: ReceiptDetail;
    onClose: () => void;
    onSampleClick: (sample: ReceiptSample) => void;
    onUpdated?: (next: ReceiptDetail) => void;
}

// ─── Pure helpers (hoisted outside component for perf) ───────────────────────
function getErrorMessage(e: unknown, fallback: string): string {
    if (e instanceof Error && e.message.trim().length > 0) return e.message;
    return fallback;
}

function receiptStatusKey(status: ReceiptStatus): string | null {
    if (status === "Draft") return "reception.receipts.status.draft";
    if (status === "Received") return "reception.receipts.status.receive";
    if (status === "Processing") return "reception.receipts.status.processing";
    if (status === "Completed") return "reception.receipts.status.completed";
    if (status === "Reported") return "reception.receipts.status.reported";
    if (status === "Cancelled") return "reception.receipts.status.cancelled";
    return null;
}

function receiptStatusLabel(t: ReturnType<typeof useTranslation>["t"], status: ReceiptStatus) {
    const key = receiptStatusKey(status);
    return String(key ? t(key, { defaultValue: status }) : status);
}

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

function getReceiptStatusBadge(t: ReturnType<typeof useTranslation>["t"], status: ReceiptStatus | null | undefined) {
    if (!status) return null;
    const label = receiptStatusLabel(t, status);
    switch (status) {
        case "Draft": return <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted-foreground/20">{label}</Badge>;
        case "Received": return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{label}</Badge>;
        case "Processing": return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">{label}</Badge>;
        case "Completed": return <Badge variant="outline" className="bg-success/10 text-success border-success/30">{label}</Badge>;
        case "Reported": return <Badge variant="outline" className="bg-secondary text-secondary-foreground">{label}</Badge>;
        case "Cancelled": return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">{label}</Badge>;
        default: return <Badge variant="outline">{label}</Badge>;
    }
}

const STATUS_OPTIONS: ReceiptStatus[] = ["Draft", "Received", "Processing", "Completed", "Reported", "Cancelled"];


// ─── Sub-components (defined outside to avoid re-creation on each render) ────
const InfoRow = memo(function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
            <span className={`text-sm text-foreground leading-snug ${mono ? "font-mono" : "font-medium"}`}>{value ?? "—"}</span>
        </div>
    );
});

const SectionHeader = memo(function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <div className="flex items-center gap-2 text-[10px] font-semibold text-primary uppercase tracking-wider mb-3">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{title}</span>
        </div>
    );
});

// ─── Main component ───────────────────────────────────────────────────────────
export function ReceiptDetailModal({ receipt, onClose, onSampleClick, onUpdated }: ReceiptDetailModalProps) {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [isSampleEditing, setIsSampleEditing] = useState(false);
    const [isAnalysisEditing, setIsAnalysisEditing] = useState(false);
    const [analysisSelectedIds, setAnalysisSelectedIds] = useState<Set<string>>(new Set());
    const [dirtyAnalysisIds, setDirtyAnalysisIds] = useState<Set<string>>(new Set()); // Track which analyses changed
    const [dirtySampleIds, setDirtySampleIds] = useState<Set<string>>(new Set()); // Track which samples changed
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null); // Track open KTV popover per row
    const [showBulkPanel, setShowBulkPanel] = useState(false);
    const [bulkProtocolCode, setBulkProtocolCode] = useState("");
    const [bulkUnit, setBulkUnit] = useState("");
    const [bulkGroupId, setBulkGroupId] = useState("");
    const [bulkGroupName, setBulkGroupName] = useState("");
    const [bulkTechnicianId, setBulkTechnicianId] = useState("");
    const [bulkTechnician, setBulkTechnician] = useState<any>(null);
    const [bulkTechnicianIds, setBulkTechnicianIds] = useState<string[]>([]);
    const [bulkDeadline, setBulkDeadline] = useState("");
    const [bulkLocation, setBulkLocation] = useState("");
    const [editedReceipt, setEditedReceipt] = useState<ReceiptDetail>(receipt);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [shippingOpen, setShippingOpen] = useState(false);

    useEffect(() => {
        setEditedReceipt(receipt);
        setIsEditing(false);
        setIsSampleEditing(false);
        setIsAnalysisEditing(false);
        setAnalysisSelectedIds(new Set());
        setDirtyAnalysisIds(new Set());
        setDirtySampleIds(new Set());
        setShowBulkPanel(false);
        setBulkTechnicianId("");
        setBulkTechnician(null);
        setBulkTechnicianIds([]);
        setBulkLocation("");
    }, [receipt]);

    // ── Email states ──────────────────────────────────────────────
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState<{ subject: string; content: string; to: string; cc: string }>({
        subject: "", content: "", to: "", cc: ""
    });
    const [isReceptionEmailLoading, setIsReceptionEmailLoading] = useState(false);
    const [isResultEmailLoading, setIsResultEmailLoading] = useState(false);
    const [emailType, setEmailType] = useState<"RECEPTION" | "FINAL_RESULT">("RECEPTION");

    const DEFAULT_CC = "botfather@irdop.org";

    const handleSendReceptionEmail = useCallback(async () => {
        setIsReceptionEmailLoading(true);
        try {
            const res = await receiptsGetReceptionEmailForm({ receiptId: receipt.receiptId });
            const data = (res as any).data ?? res;
            if (data) {
                const recipientEmail = editedReceipt.reportRecipient?.receiverEmail ?? data.to ?? "";
                setEmailData({ subject: data.subject ?? "", content: data.body ?? "", to: recipientEmail, cc: DEFAULT_CC });
                setEmailType("RECEPTION");
                setShowEmailModal(true);
            }
        } catch (e) {
            toast.error(getErrorMessage(e, "Không thể tải mẫu email tiếp nhận"));
        } finally {
            setIsReceptionEmailLoading(false);
        }
    }, [receipt.receiptId, editedReceipt.reportRecipient, DEFAULT_CC]);

    const handleSendResultEmail = useCallback(async () => {
        setIsResultEmailLoading(true);
        try {
            const res = await receiptsGetFinalResultEmailForm({ receiptId: receipt.receiptId });
            const list = (res as any).data ?? res;
            const first = Array.isArray(list) ? list[0] : list;
            if (first) {
                const recipientEmail = editedReceipt.reportRecipient?.receiverEmail ?? first.to ?? "";
                setEmailData({ subject: first.subject ?? "", content: first.body ?? "", to: recipientEmail, cc: DEFAULT_CC });
                setEmailType("FINAL_RESULT");
                setShowEmailModal(true);
            } else {
                toast.warning("Chưa có báo cáo kết quả để gửi email");
            }
        } catch (e) {
            toast.error(getErrorMessage(e, "Không thể tải mẫu email kết quả"));
        } finally {
            setIsResultEmailLoading(false);
        }
    }, [receipt.receiptId, editedReceipt.reportRecipient, DEFAULT_CC]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                qc.invalidateQueries({ queryKey: receiptsKeys.list(undefined) }),
                qc.invalidateQueries({ queryKey: receiptsKeys.detail(receipt.receiptId) }),
                qc.invalidateQueries({ queryKey: receiptsKeys.full(receipt.receiptId) }),
            ]);
            const fullRes = await receiptsGetFull({ receiptId: receipt.receiptId }) as any;
            const fullData: ReceiptDetail = fullRes?.data !== undefined ? fullRes.data : (fullRes as ReceiptDetail);
            setEditedReceipt(fullData);
            onUpdated?.(fullData);
            toast.success(String(t("common.toast.refreshed", { defaultValue: "Đã làm mới dữ liệu" })));
        } catch (e) {
            toast.error(getErrorMessage(e, "Không thể làm mới dữ liệu"));
        } finally {
            setIsRefreshing(false);
        }
    }, [receipt.receiptId, onUpdated, t, qc]);

    const exportHandoverMut = useExportHandover();
    const handleExportHandover = useCallback(async () => {
        try {
            const res = await exportHandoverMut.mutateAsync({ receiptId: receipt.receiptId });
            const data = (res as any).data ?? res;
            
            if (data.documentId || data.fileId) {
                try {
                    const targetId = (data.documentId || data.fileId) as string;
                    const docRes = await documentApi.url(targetId);
                    const url = docRes.data?.url || (docRes as any).url;
                    
                    if (url) {
                        window.open(url, "_blank");
                        toast.success(data.message || "Xuất biên bản bàn giao thành công");
                        handleRefresh();
                    } else {
                        toast.error("Không thể lấy liên kết tài liệu");
                    }
                } catch (urlErr) {
                    console.error("Failed to get document URL", urlErr);
                    toast.error("Không thể lấy đường dẫn tệp biên bản.");
                }
            } else {
                toast.success(data.message || "Xuất biên bản bàn giao thành công");
            }
        } catch (e) {
            toast.error(getErrorMessage(e, "Không thể xuất biên bản bàn giao"));
        }
    }, [exportHandoverMut, receipt.receiptId]);

    // ── Modal states ──────────────────────────────────────────────
    const [showPrintLabelModal, setShowPrintLabelModal] = useState(false);
    const [showResultCertificateModal, setShowResultCertificateModal] = useState(false);
    const [showAddSampleModal, setShowAddSampleModal] = useState(false);
    const [openSampleModal, setOpenSampleModal] = useState(false);
    const [selectedSample, setSelectedSample] = useState<ReceiptSample | null>(null);
    const [focusAnalysisId, setFocusAnalysisId] = useState<string | null>(null);

    useEffect(() => {
        setOpenSampleModal(false);
        setSelectedSample(null);
        setFocusAnalysisId(null);
    }, [receipt.receiptId]);

    // ── Image viewer ──────────────────────────────────────────────
    type LoadedImage = { fileId: string; url: string };
    const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
    const [imageLoading, setImageLoading] = useState(false);
    const [focusedImageIdx, setFocusedImageIdx] = useState(0);
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [manageModalOpen, setManageModalOpen] = useState(false);
    const [manageImages, setManageImages] = useState<LoadedImage[]>([]);
    const [manageSelectedIds, setManageSelectedIds] = useState<string[]>([]);

    const rawFileIds = editedReceipt.receiptReceivedImageFileIds as unknown as string[] | string | null | undefined;
    const fileIds: string[] = useMemo(() => {
        if (!rawFileIds) return [];
        if (Array.isArray(rawFileIds)) return rawFileIds.map((f) => (typeof f === "string" ? f : ((f as any)?.fileId ?? String(f)))).filter(Boolean);
        if (typeof rawFileIds === "string") {
            try { const p = JSON.parse(rawFileIds); if (Array.isArray(p)) return p.map(String); } catch { return [rawFileIds]; }
        }
        return [];
    }, [rawFileIds]);

    useEffect(() => {
        let cancelled = false;
        if (fileIds.length === 0) { setLoadedImages([]); return; }
        setImageLoading(true);
        (async () => {
            const results: LoadedImage[] = [];
            for (const id of fileIds) {
                try { const r = await fileApi.url(id, 3600); const url = (r as any)?.data?.url ?? (r as any)?.url; if (url) results.push({ fileId: id, url }); } catch { /* ignore */ }
            }
            if (!cancelled) { setLoadedImages(results); setImageLoading(false); }
        })();
        return () => { cancelled = true; };
    }, [fileIds]);

    useEffect(() => {
        if (!thumbnailsRef.current) return;
        const el = thumbnailsRef.current.children[focusedImageIdx] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, [focusedImageIdx]);

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        try {
            setIsUploading(true);
            const newLoaded: LoadedImage[] = [];
            const newFileIds: string[] = [];
            for (const file of files) {
                const fd = buildFileUploadFormData(file, { commonKeys: [editedReceipt.receiptCode ?? ""], fileTags: ["Received Image"] });
                const up = await fileApi.upload(fd);
                const fid = (up as any)?.data?.fileId ?? (up as any)?.fileId;
                if (fid) {
                    newFileIds.push(fid);
                    try { const ur = await fileApi.url(fid, 3600); const url = (ur as any)?.data?.url ?? (ur as any)?.url; if (url) newLoaded.push({ fileId: fid, url }); } catch { /* ignore */ }
                }
            }
            if (newLoaded.length > 0) {
                const combined = [...loadedImages];
                newLoaded.forEach((nl) => { if (!combined.some((c) => c.fileId === nl.fileId)) combined.push(nl); });
                setManageImages(combined);
                setManageSelectedIds([...fileIds, ...newFileIds]);
                setManageModalOpen(true);
            }
        } catch (err) { toast.error(getErrorMessage(err, "Upload failed")); }
        finally { setIsUploading(false); if (e.target) e.target.value = ""; }
    }, [editedReceipt.receiptCode, fileIds, loadedImages]);

    const handleFindRelated = useCallback(async () => {
        if (!editedReceipt.receiptCode) return;
        try {
            setImageLoading(true);
            const res = await fileApi.list({ search: editedReceipt.receiptCode, itemsPerPage: 50 });
            const list = (res as any)?.data || [];
            const valid = list.filter((f: any) => f.mimeType?.startsWith("image/"));
            const loaded: LoadedImage[] = [];
            for (const f of valid) {
                try { const ur = await fileApi.url(f.fileId, 3600); const url = (ur as any)?.data?.url ?? (ur as any)?.url; if (url) loaded.push({ fileId: f.fileId, url }); } catch { /* ignore */ }
            }
            setManageImages(loaded); setManageSelectedIds(fileIds); setManageModalOpen(true);
        } catch { toast.error("Failed to find related images"); }
        finally { setImageLoading(false); }
    }, [editedReceipt.receiptCode, fileIds]);

    const handleConfirmManage = useCallback(async () => {
        try {
            const body: ReceiptsUpdateBody = { receiptId: editedReceipt.receiptId, receiptReceivedImageFileIds: manageSelectedIds };
            await receiptsUpdate({ body });
            toast.success(String(t("common.toast.saved")));
            setEditedReceipt(prev => ({ ...prev, receiptReceivedImageFileIds: manageSelectedIds }));
            setManageModalOpen(false);
        } catch (err) { toast.error(getErrorMessage(err, "Update images failed")); }
    }, [editedReceipt.receiptId, manageSelectedIds, t]);

    // ── Samples ───────────────────────────────────────────────────
    const samples = editedReceipt.samples ?? [];

    const getAnalysesForSample = useCallback((sample: ReceiptSample): ReceiptAnalysis[] => {
        return (sample.analyses ?? []).filter((a) => Boolean(a?.analysisId));
    }, []);

    const openSampleByLabId = useCallback(async (sample: ReceiptSample, analysisId: string | null) => {
        setFocusAnalysisId(analysisId);
        setOpenSampleModal(true);
        setSelectedSample(sample);
        try {
            const res = await samplesGetFull({ sampleId: sample.sampleId });
            const fullData = (res as any).data ?? res;
            if (fullData) { const s = fullData as unknown as ReceiptSample; setSelectedSample(s); onSampleClick?.(s); }
        } catch { /* ignore */ }
    }, [onSampleClick]);

    const closeSampleModal = useCallback(() => {
        setOpenSampleModal(false); setSelectedSample(null); setFocusAnalysisId(null);
    }, []);

    const handleSaveSample = useCallback(async (updatedSample: ReceiptSample) => {
        setEditedReceipt((prev) => {
            const nextSamples = (prev.samples ?? []).map((s) => (s.sampleId === updatedSample.sampleId ? updatedSample : s));
            const next: ReceiptDetail = { ...prev, samples: nextSamples };
            onUpdated?.(next);
            return next;
        });
        toast.success(String(t("common.toast.saved")));
        closeSampleModal();
    }, [onUpdated, t, closeSampleModal]);

    const handleUpdateSample = (sampleIndex: number, field: keyof ReceiptSample, value: any) => {
        const next = [...(editedReceipt.samples || [])];
        const sampleId = next[sampleIndex]?.sampleId;
        next[sampleIndex] = { ...next[sampleIndex], [field]: value };
        setEditedReceipt(p => ({ ...p, samples: next }));
        // Mark this sample as dirty
        if (sampleId) setDirtySampleIds(prev => new Set([...prev, sampleId]));
    };

    const [isSampleSaving, setIsSampleSaving] = useState(false);
    const handleSaveSamples = useCallback(async () => {
        if (dirtySampleIds.size === 0) return;
        const dirtySamples = (editedReceipt.samples ?? []).filter(s => dirtySampleIds.has(s.sampleId));
        setIsSampleSaving(true);
        try {
            await Promise.all(dirtySamples.map(s => samplesUpdate({
                sampleId: s.sampleId,
                sampleName: s.sampleName,
                sampleStatus: s.sampleStatus,
                sampleClientInfo: s.sampleClientInfo,
                sampleInfo: s.sampleInfo,
                sampleReceiptInfo: s.sampleReceiptInfo,
                sampleStorageLoc: s.sampleStorageLoc,
            } as any)));
            toast.success(`Đã lưu ${dirtySamples.length} mẫu`);
            setDirtySampleIds(new Set());
            setIsSampleEditing(false);
            handleRefresh();
        } catch (e) {
            toast.error(getErrorMessage(e, "Không thể lưu mẫu"));
        } finally {
            setIsSampleSaving(false);
        }
    }, [dirtySampleIds, editedReceipt.samples, handleRefresh]);

    const handleUpdateAnalysisById = useCallback((analysisId: string, patch: Partial<ReceiptAnalysis>) => {
        setEditedReceipt(prev => ({ ...prev, samples: (prev.samples ?? []).map(s => ({ ...s, analyses: (s.analyses ?? []).map(a => a.analysisId === analysisId ? { ...a, ...patch } : a) })) }));
        // Mark this analysis as dirty (has unsaved changes)
        setDirtyAnalysisIds(prev => new Set([...prev, analysisId]));
    }, []);

    const handlePreviewFile = useCallback(async (id: string) => {
        try {
            const r = await fileApi.url(id, 3600);
            const url = (r as any)?.data?.url ?? (r as any)?.url;
            if (url) window.open(url, "_blank");
        } catch (e) {
            console.error("Preview failed", e);
            toast.error("Không thể xem trước tệp");
        }
    }, []);

    const allAnalyses = useMemo(() => (editedReceipt.samples ?? []).flatMap(s => (s.analyses ?? []).map(a => ({ ...a, _sampleId: s.sampleId }))), [editedReceipt.samples]);
    const allAnalysisIds = useMemo(() => allAnalyses.map(a => a.analysisId), [allAnalyses]);
    const allSelected = analysisSelectedIds.size === allAnalysisIds.length && allAnalysisIds.length > 0;
    const toggleAllAnalyses = useCallback(() => setAnalysisSelectedIds(allSelected ? new Set() : new Set(allAnalysisIds)), [allSelected, allAnalysisIds]);
    const toggleAnalysis = useCallback((id: string) => setAnalysisSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }), []);



    // Identity groups for KTV select
    const { data: groupsRes } = useIdentityGroupsList({ query: { identityGroupMainRole: ["ROLE_TECHNICIAN"], option: "full", itemsPerPage: 100 } });
    const groups = useMemo(() => (groupsRes?.data ?? []) as Array<{ identityGroupId: string; identityGroupName: string }>, [groupsRes?.data]);

    // Bulk panel: only updates local state (temporary), tracks dirty
    const handleBulkApplyLocal = useCallback(() => {
        if (analysisSelectedIds.size === 0) return;
        const idsToUpdate = [...analysisSelectedIds];
        setEditedReceipt(prev => ({
            ...prev,
            samples: (prev.samples ?? []).map(s => ({
                ...s,
                analyses: (s.analyses ?? []).map(a => {
                    if (!idsToUpdate.includes(a.analysisId)) return a;
                    const patch: Partial<ReceiptAnalysis> = {};
                    if (bulkProtocolCode) patch.protocolCode = bulkProtocolCode;
                    if (bulkUnit) patch.analysisUnit = bulkUnit;
                    if (bulkGroupId) {
                        (patch as any).technicianGroupId = bulkGroupId;
                        (patch as any).technicianGroupName = bulkGroupName;
                        (patch as any).technicianId = bulkTechnicianId;
                        (patch as any).technician = bulkTechnician;
                        (patch as any).technicianIds = bulkTechnicianIds;
                    }
                    if (bulkDeadline) patch.analysisDeadline = bulkDeadline;
                    if (bulkLocation) patch.analysisLocation = bulkLocation;
                    return { ...a, ...patch };
                }),
            }))
        }));
        // Mark all selected as dirty
        setDirtyAnalysisIds(prev => new Set([...prev, ...idsToUpdate]));
        // Close panel and reset bulk fields
        setShowBulkPanel(false);
        setBulkProtocolCode(""); setBulkUnit(""); setBulkGroupId(""); setBulkGroupName(""); setBulkDeadline(""); setBulkLocation("");
        setBulkTechnicianId(""); setBulkTechnician(null); setBulkTechnicianIds([]);
        toast.success(`Đã áp dụng tạm thời cho ${idsToUpdate.length} chỉ tiêu. Nhấn "Cập nhật chỉ tiêu" để lưu vào hệ thống.`);
    }, [analysisSelectedIds, bulkProtocolCode, bulkUnit, bulkGroupId, bulkGroupName, bulkDeadline, bulkLocation, bulkTechnicianId, bulkTechnician, bulkTechnicianIds]);

    // Save analyses: send bulk API with only dirty (changed) analyses
    const { mutateAsync: mutateBulk, isPending: isBulkSaving } = useAnalysesUpdateBulk();
    const handleSaveAnalyses = useCallback(async () => {
        if (dirtyAnalysisIds.size === 0) return;
        const allAnalysesFlat = (editedReceipt.samples ?? []).flatMap(s => s.analyses ?? []);
        const dirtyAnalyses = allAnalysesFlat.filter(a => dirtyAnalysisIds.has(a.analysisId));
        const body = dirtyAnalyses.map(a => ({
            analysisId: a.analysisId,
            protocolCode: a.protocolCode,
            analysisUnit: a.analysisUnit,
            analysisDeadline: a.analysisDeadline,
            analysisLocation: a.analysisLocation,
            technicianGroupId: (a as any).technicianGroupId,
            technicianGroupName: (a as any).technicianGroupName,
            technicianId: (a as any).technicianId ?? a.technicianId,
            technicianIds: (a as any).technicianIds ?? a.technicianIds,
        }));
        try {
            await mutateBulk({ body: body as any });
            toast.success(`Đã cập nhật ${body.length} chỉ tiêu`);
            setDirtyAnalysisIds(new Set());
            setIsAnalysisEditing(false);
            setShowBulkPanel(false);
            setAnalysisSelectedIds(new Set());
            handleRefresh();
        } catch {
            // error handled by hook
        }
    }, [dirtyAnalysisIds, editedReceipt.samples, mutateBulk, handleRefresh]);

    // ── Save mutation ─────────────────────────────────────────────
    const updateMut = useMutation({
        mutationFn: (body: ReceiptsUpdateBody) => receiptsUpdate({ body }),
        onSuccess: async () => {
            try {
                const fullRes = await receiptsGetFull({ receiptId: receipt.receiptId });
                const fullData: ReceiptDetail = (fullRes as any)?.data !== undefined ? (fullRes as any).data : fullRes;
                setEditedReceipt(fullData); onUpdated?.(fullData);
            } catch { /* ignore */ }
            await Promise.all([
                qc.invalidateQueries({ queryKey: receiptsKeys.list(undefined) }),
                qc.invalidateQueries({ queryKey: receiptsKeys.detail(receipt.receiptId) }),
                qc.invalidateQueries({ queryKey: receiptsKeys.full(receipt.receiptId) }),
            ]);
            toast.success(String(t("common.toast.saved"))); setIsEditing(false);
        },
        onError: (e) => toast.error(getErrorMessage(e, String(t("common.toast.error")))),
    });
    const handleSave = useCallback(() => {
        updateMut.mutate({
            receiptId: editedReceipt.receiptId,
            receiptStatus: editedReceipt.receiptStatus ?? null,
            receiptDeadline: editedReceipt.receiptDeadline ?? null,
            receiptNote: editedReceipt.receiptNote ?? null,
            receiptPriority: editedReceipt.receiptPriority ?? null,
            receiptDeliveryMethod: editedReceipt.receiptDeliveryMethod ?? null,
            client: editedReceipt.client ?? null,
            contactPerson: editedReceipt.contactPerson ?? null,
            reportRecipient: editedReceipt.reportRecipient ?? null,
            senderInfo: editedReceipt.senderInfo ?? null,
            conditionCheck: editedReceipt.conditionCheck ?? null,
            reportConfig: editedReceipt.reportConfig ?? null,
            isBlindCoded: editedReceipt.isBlindCoded ?? null,
            samples: editedReceipt.samples ?? null,
        });
    }, [updateMut, editedReceipt]);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false); setEditedReceipt(receipt);
    }, [receipt]);

    // ── Samples table JSX ─────────────────────────────────────────
    const samplesTableJSX = useMemo(() => (
        <section className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-primary uppercase tracking-wider">
                    <Package className="h-3.5 w-3.5" />
                    <span>{String(t("reception.createReceipt.samplesList"))}</span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{samples.length}</Badge>
                    {isAnalysisEditing && analysisSelectedIds.size > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-primary/40">{analysisSelectedIds.size} đã chọn</Badge>
                    )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Nút sửa mẫu */}
                    {isSampleEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => { setIsSampleEditing(false); setDirtySampleIds(new Set()); setEditedReceipt(receipt); }} className="h-7 text-xs gap-1 text-muted-foreground"><X className="h-3 w-3" />Huỷ mẫu</Button>
                            <Button size="sm" onClick={handleSaveSamples} disabled={isSampleSaving || dirtySampleIds.size === 0} className="h-7 text-xs gap-1">
                                {isSampleSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                Lưu mẫu{dirtySampleIds.size > 0 ? ` (${dirtySampleIds.size})` : ""}
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => { setIsSampleEditing(true); setIsAnalysisEditing(false); }} className="h-7 text-xs gap-1.5"><Edit className="h-3 w-3" />Sửa mẫu</Button>
                    )}
                    {/* Nút sửa chỉ tiêu */}
                    {isAnalysisEditing ? (
                        <>
                            {analysisSelectedIds.size > 0 && !showBulkPanel && (
                                <Button variant="outline" size="sm" onClick={() => setShowBulkPanel(true)} className="h-7 text-xs gap-1.5 border-primary/40 text-primary"><Layers className="h-3 w-3" />Sửa hàng loạt ({analysisSelectedIds.size})</Button>
                            )}
                            {dirtyAnalysisIds.size > 0 && (
                                <Button size="sm" onClick={handleSaveAnalyses} disabled={isBulkSaving} className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground">
                                    {isBulkSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    Cập nhật chỉ tiêu ({dirtyAnalysisIds.size})
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => { setIsAnalysisEditing(false); setShowBulkPanel(false); setAnalysisSelectedIds(new Set()); setDirtyAnalysisIds(new Set()); setEditedReceipt(receipt); }} className="h-7 text-xs gap-1 text-muted-foreground"><X className="h-3 w-3" />Thoát</Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => { setIsAnalysisEditing(true); setIsSampleEditing(false); }} className="h-7 text-xs gap-1.5"><Edit className="h-3 w-3" />Sửa chỉ tiêu</Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setShowAddSampleModal(true)} className="gap-1.5 h-7 text-xs"><Plus className="h-3 w-3" />{String(t("reception.addSample.addButton", { defaultValue: "Thêm mẫu" }))}</Button>
                </div>
            </div>

            {/* Bulk edit panel */}
            {isAnalysisEditing && showBulkPanel && (
                <div className="border-b border-border bg-primary/5 p-4 space-y-3 animate-in slide-in-from-top-1 duration-150">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Layers className="h-4 w-4" />Sửa hàng loạt<Badge variant="secondary" className="text-[10px]">{analysisSelectedIds.size} chỉ tiêu</Badge></div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowBulkPanel(false)}><X className="h-3.5 w-3.5" /></Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Phương pháp</label><Input className="h-8 text-xs" placeholder="Để trống = giữ nguyên" value={bulkProtocolCode} onChange={e => setBulkProtocolCode(e.target.value)} /></div>
                        <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Đơn vị</label><Input className="h-8 text-xs" placeholder="Để trống = giữ nguyên" value={bulkUnit} onChange={e => setBulkUnit(e.target.value)} /></div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Nhóm KTV</label>
                            <Popover>
                                <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs w-full justify-between font-normal"><span className="truncate">{bulkGroupName || "Để trống = giữ nguyên"}</span><ChevronsUpDown className="h-3 w-3 opacity-50 shrink-0 ml-1" /></Button></PopoverTrigger>
                                <PopoverContent className="w-[260px] p-0 z-[1200]" align="start">
                                    <Command><CommandInput placeholder="Tìm nhóm..." className="h-8" /><CommandList><CommandEmpty>Không tìm thấy</CommandEmpty><CommandGroup>{groups.map((g: any) => (
                                        <CommandItem key={g.identityGroupId} value={g.identityGroupName} onSelect={() => { 
                                            setBulkGroupId(g.identityGroupId); 
                                            setBulkGroupName(g.identityGroupName);
                                            setBulkTechnicianId(g.identityGroupInChargeId);
                                            setBulkTechnician(g.identityGroupInCharge);
                                            setBulkTechnicianIds(g.identityIds);
                                        }}><Check className={cn("mr-2 h-3 w-3", bulkGroupId === g.identityGroupId ? "opacity-100" : "opacity-0")} />{g.identityGroupName}</CommandItem>))}</CommandGroup></CommandList></Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Hạn trả</label><Input type="date" className="h-8 text-xs" value={bulkDeadline} onChange={e => setBulkDeadline(e.target.value)} /></div>
                        <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Nơi thực hiện</label><Input className="h-8 text-xs" placeholder="Để trống = giữ nguyên" value={bulkLocation} onChange={e => setBulkLocation(e.target.value)} /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowBulkPanel(false)}>Huỷ</Button>
                        <Button size="sm" onClick={handleBulkApplyLocal} disabled={analysisSelectedIds.size === 0}>Áp dụng tạm thời</Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border">
                        <tr>
                            {["Thông tin mẫu", "Mã PT", "Chỉ tiêu", "Phương pháp", "Nơi thực hiện", "Kết quả", "Đơn vị", "STT", "Nhóm KTV", "Người phụ trách", "Hạn trả"].map(h => (
                                <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">{h}</th>
                            ))}
                            {isAnalysisEditing && <th className="w-8 px-2 py-2.5 text-center"><button onClick={toggleAllAnalyses} className="flex items-center justify-center text-muted-foreground hover:text-foreground mx-auto">{allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}</button></th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {samples.length === 0 ? (
                            <tr><td colSpan={isAnalysisEditing ? 10 : 9} className="px-4 py-8 text-center text-xs text-muted-foreground italic">{String(t("reception.createReceipt.noAnalysis"))}</td></tr>
                        ) : samples.map((s, sampleIndex) => {
                            const analyses = getAnalysesForSample(s);
                            const sampleCell = (
                                <td rowSpan={analyses.length || 1} className="px-3 py-3 align-top border-r border-border/40 min-w-[200px] max-w-[280px]">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-primary/30 text-primary font-bold">{s.sampleId}</Badge>
                                            {isSampleEditing ? (
                                                <Select value={s.sampleStatus ?? "Received"} onValueChange={v => handleUpdateSample(sampleIndex, "sampleStatus", v)}>
                                                    <SelectTrigger className="h-5 text-[10px] bg-background px-1.5 w-auto border-dashed"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="z-[1100]">{["Received","InPrep","Distributed","Retained","Disposed","Returned"].map(st => <SelectItem key={st} value={st} className="text-[10px]">{st}</SelectItem>)}</SelectContent>
                                                </Select>
                                            ) : s.sampleStatus && <Badge variant="secondary" className="text-[9px] h-4 px-1 capitalize">{s.sampleStatus}</Badge>}
                                        </div>
                                        {isSampleEditing ? (
                                            <div className="space-y-1 mt-1">
                                                <Input className="h-7 text-xs bg-background" value={s.sampleName ?? ""} placeholder="Tên mẫu" onChange={e => handleUpdateSample(sampleIndex, "sampleName", e.target.value)} />
                                                <Input className="h-7 text-xs bg-background" value={s.sampleClientInfo ?? ""} placeholder="Mô tả mẫu" onChange={e => handleUpdateSample(sampleIndex, "sampleClientInfo", e.target.value)} />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-xs font-semibold text-foreground">{s.sampleName ?? "—"}</div>
                                                {s.sampleClientInfo && <div className="text-[10px] text-muted-foreground">{s.sampleClientInfo}</div>}
                                                <div className="text-[10px] text-muted-foreground italic">{s.sampleTypeName ?? "—"}</div>
                                            </>
                                        )}
                                        {s.sampleInfo && s.sampleInfo.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-border/40 space-y-1">
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Thông tin mẫu</div>
                                                {s.sampleInfo.map((info, i) => (
                                                    <div key={i} className="text-[10px] leading-tight flex flex-wrap gap-x-1">
                                                        <span className="text-muted-foreground font-medium">{info.label}:</span>
                                                        {isSampleEditing ? <Input className="h-5 text-[10px] bg-background px-1 flex-1 min-w-[60px]" value={info.value ?? ""} onChange={e => { const next = [...(s.sampleInfo ?? [])].map((it,ii) => ii===i?{...it,value:e.target.value}:it); handleUpdateSample(sampleIndex,"sampleInfo",next); }} /> : <span className="text-foreground">{info.value || "—"}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {s.sampleReceiptInfo && s.sampleReceiptInfo.length > 0 && (
                                            <div className="mt-1 pt-2 border-t border-border/40 space-y-1">
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Thông tin thử nghiệm</div>
                                                {s.sampleReceiptInfo.map((info, i) => (
                                                    <div key={i} className="text-[10px] leading-tight flex flex-wrap gap-x-1">
                                                        <span className="text-muted-foreground font-medium">{info.label}:</span>
                                                        {isSampleEditing ? <Input className="h-5 text-[10px] bg-background px-1 flex-1 min-w-[60px]" value={info.value ?? ""} onChange={e => { const next = [...(s.sampleReceiptInfo ?? [])].map((it,ii) => ii===i?{...it,value:e.target.value}:it); handleUpdateSample(sampleIndex,"sampleReceiptInfo",next); }} /> : <span className="text-foreground">{info.value || "—"}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            );
                            if (analyses.length === 0) return (
                                <tr key={s.sampleId} className="hover:bg-muted/20 transition-colors">
                                    {sampleCell}
                                    <td colSpan={8} className="px-3 py-2 text-xs text-muted-foreground italic">{String(t("reception.createReceipt.noAnalysis"))}</td>
                                    {isAnalysisEditing && <td className="px-2 py-2" />}
                                </tr>
                            );
                            return analyses.map((a, idx) => (
                                <tr key={a.analysisId} className={cn("hover:bg-muted/20 transition-colors", analysisSelectedIds.has(a.analysisId) && "bg-primary/5")}
                                    onClick={() => (!isSampleEditing && !isAnalysisEditing) && openSampleByLabId(s, a.analysisId)}>
                                    {idx === 0 && sampleCell}
                                    <td className="px-3 py-2 text-[10px] text-muted-foreground font-mono">{a.analysisId}</td>
                                    <td className="px-3 py-2 text-xs font-medium max-w-[140px] truncate">{a.parameterName ?? "—"}</td>
                                    <td className="px-2 py-1.5">
                                        {isAnalysisEditing
                                            ? <Input className="h-7 text-[11px] bg-background px-2 w-[110px]" value={a.protocolCode ?? ""} onChange={e => handleUpdateAnalysisById(a.analysisId, { protocolCode: e.target.value })} />
                                            : <span className="text-[10px] text-foreground font-medium">{a.protocolCode ?? "—"}</span>}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        {isAnalysisEditing
                                            ? <Input className="h-7 text-[11px] bg-background px-2 w-[100px]" value={a.analysisLocation ?? ""} onChange={e => handleUpdateAnalysisById(a.analysisId, { analysisLocation: e.target.value })} />
                                            : <span className="text-[10px] text-foreground">{a.analysisLocation ?? "—"}</span>}
                                    </td>
                                    <td className="px-3 py-2 text-xs font-bold text-primary" dangerouslySetInnerHTML={{ __html: a.analysisResult ?? "—" }} />
                                    <td className="px-2 py-1.5">
                                        {isAnalysisEditing
                                            ? <Input className="h-7 text-[11px] bg-background px-2 w-[70px]" value={a.analysisUnit ?? ""} onChange={e => handleUpdateAnalysisById(a.analysisId, { analysisUnit: e.target.value })} />
                                            : <span className="text-xs text-muted-foreground">{a.analysisUnit ?? "—"}</span>}
                                    </td>
                                    <td className="px-3 py-2">{a.analysisStatus && <Badge variant="outline" className="text-[9px] h-4 px-1">{a.analysisStatus}</Badge>}</td>
                                    <td className="px-2 py-1.5">
                                        {isAnalysisEditing ? (
                                            <Popover open={openPopoverId === a.analysisId} onOpenChange={(open) => setOpenPopoverId(open ? a.analysisId : null)}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 max-w-[150px] justify-between font-normal" onClick={e => { e.stopPropagation(); setOpenPopoverId(openPopoverId === a.analysisId ? null : a.analysisId); }}>
                                                        <span className="truncate">{(a as any).technicianGroupName ?? "Chọn nhóm..."}</span>
                                                        <ChevronsUpDown className="h-3 w-3 shrink-0 ml-1 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[240px] p-0 z-[1200]" align="start">
                                                    <Command><CommandInput placeholder="Tìm nhóm..." className="h-8" /><CommandList><CommandEmpty>Không tìm thấy</CommandEmpty><CommandGroup>
                                                        {groups.map((g: any) => (
                                                            <CommandItem key={g.identityGroupId} value={g.identityGroupName} onSelect={() => {
                                                                handleUpdateAnalysisById(a.analysisId, {
                                                                    technicianGroupId: g.identityGroupId,
                                                                    technicianGroupName: g.identityGroupName,
                                                                    technicianId: g.identityGroupInChargeId,
                                                                    technician: g.identityGroupInCharge,
                                                                    technicianIds: g.identityIds
                                                                } as any);
                                                                setOpenPopoverId(null); // close after select
                                                            }}>
                                                                <Check className={cn("mr-2 h-3 w-3", (a as any).technicianGroupId === g.identityGroupId ? "opacity-100" : "opacity-0")} />{g.identityGroupName}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup></CommandList></Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : <span className="text-xs text-muted-foreground">{(a as any).technicianGroupName ?? "—"}</span>}
                                    </td>
                                    <td className="px-3 py-2 text-xs text-foreground">
                                        {a.technician?.identityName ?? a.technicianId ?? "—"}
                                    </td>
                                    <td className="px-2 py-1.5">
                                        {isAnalysisEditing
                                            ? <Input type="date" className="h-7 text-[11px] bg-background px-1 w-[130px]" value={a.analysisDeadline?.split("T")[0] ?? ""} onChange={e => handleUpdateAnalysisById(a.analysisId, { analysisDeadline: e.target.value })} />
                                            : <span className="text-[10px] font-medium text-destructive">{fmtDate(a.analysisDeadline)}</span>}
                                    </td>
                                    {isAnalysisEditing && (
                                        <td className="px-2 py-2" onClick={e => e.stopPropagation()}>
                                            <Checkbox checked={analysisSelectedIds.has(a.analysisId)} onCheckedChange={() => toggleAnalysis(a.analysisId)} className="h-4 w-4" />
                                        </td>
                                    )}
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    ), [samples, t, isSampleEditing, isAnalysisEditing, analysisSelectedIds, dirtyAnalysisIds, dirtySampleIds, isSampleSaving, allSelected, showBulkPanel, openPopoverId,
        bulkProtocolCode, bulkUnit, bulkGroupId, bulkGroupName, bulkDeadline, groups, isBulkSaving,
        onSampleClick, getAnalysesForSample, openSampleByLabId, handleUpdateSample, handleUpdateAnalysisById,
        handleBulkApplyLocal, handleSaveAnalyses, handleSaveSamples, toggleAllAnalyses, toggleAnalysis, updateMut, editedReceipt, receipt]);

    // ─── Render ───────────────────────────────────────────────────
    return (
        <>
            {/* Shipment Manager Modal */}
            <ShipmentManagerModal
                open={shippingOpen}
                onOpenChange={setShippingOpen}
                receiptId={receipt.receiptId}
            />

            {/* Full-screen overlay — increased z-index to ensure it covers app footers/sidebars */}
            <div
                className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200 w-full h-full"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                {/* Modal panel */}
                <div
                    className="bg-background rounded-2xl shadow-2xl flex flex-col border border-border animate-in zoom-in-95 duration-200 overflow-hidden"
                    style={{ width: "95vw", height: "95vh" }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ── Header ─────────────────────────────────── */}
                    <div className="flex shrink-0 items-center justify-between px-5 py-3 border-b border-border bg-card">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <FileText className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-foreground leading-tight truncate">
                                    {String(t("reception.receiptDetail.title", { code: editedReceipt.receiptCode }))}
                                </h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {getReceiptStatusBadge(t, editedReceipt.receiptStatus)}
                                    <span className="text-[10px] text-muted-foreground font-mono">{editedReceipt.receiptId}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-8 text-xs"
                                onClick={handleSendReceptionEmail}
                                disabled={isReceptionEmailLoading}
                            >
                                {isReceptionEmailLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                                {String(t("reception.receiptDetail.sendMailReception"))}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-8 text-xs"
                                onClick={handleExportHandover}
                                disabled={exportHandoverMut.isPending}
                            >
                                {exportHandoverMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                                Biên bản bàn giao
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-8 text-xs"
                                onClick={handleSendResultEmail}
                                disabled={isResultEmailLoading}
                            >
                                {isResultEmailLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileCheck className="h-3 w-3" />}
                                {String(t("reception.receiptDetail.sendMailResult"))}
                            </Button>
                            <div className="w-px h-5 bg-border mx-0.5" />
                            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowPrintLabelModal(true)}>
                                <Printer className="h-3 w-3" />
                                {String(t("reception.receiptDetail.printLabel"))}
                            </Button>
                            <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setShowResultCertificateModal(true)}>
                                <FileCheck className="h-3 w-3" />
                                {String(t("reception.receiptDetail.exportHandover"))}
                            </Button>
                            <div className="w-px h-5 bg-border mx-0.5" />
                            {isEditing ? (
                                <>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleCancelEdit}>
                                        {String(t("common.cancel"))}
                                    </Button>
                                    <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={updateMut.isPending}>
                                        {updateMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                        {String(t("common.save"))}
                                    </Button>
                                </>
                            ) : (
                                <Button variant="secondary" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-3 w-3" />
                                    {String(t("common.edit"))}
                                </Button>
                            ) /* Correct closing for edit button conditional */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full ml-0.5"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                title={String(t("common.refresh", { defaultValue: "Làm mới" }))}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full ml-0.5" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* ── Body ───────────────────────────────────── */}
                    <div className="flex-1 overflow-hidden flex min-h-0">
                        {/* Left: info + samples */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30 min-w-0">

                            {/* 4-column info row */}
                            <div className="grid grid-cols-4 gap-4">

                                {/* Khách hàng */}
                                <section className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3 overflow-y-auto max-h-full">
                                    <SectionHeader icon={Building2} title={String(t("reception.createReceipt.clientInfo"))} />
                                    {isEditing ? (
                                        <div className="space-y-1.5">
                                            <Input className="h-7 text-xs bg-background" placeholder="Tên KH/Tên công ty" value={editedReceipt.client?.clientName ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: e.target.value } }))} />
                                            <Input className="h-7 text-xs bg-background" placeholder="Mã số thuế" value={editedReceipt.client?.legalId ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", legalId: e.target.value } }))} />
                                            <Input className="h-7 text-xs bg-background" placeholder="Địa chỉ" value={editedReceipt.client?.clientAddress ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", clientAddress: e.target.value } }))} />
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <Input className="h-7 text-xs bg-background" placeholder="SĐT" value={editedReceipt.client?.clientPhone ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", clientPhone: e.target.value } }))} />
                                                <Input className="h-7 text-xs bg-background" placeholder="Email" value={editedReceipt.client?.clientEmail ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", clientEmail: e.target.value } }))} />
                                            </div>
                                            <div className="pt-2 border-t border-border/60 space-y-1.5">
                                                <div className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Thông tin hoá đơn</div>
                                                <Input className="h-7 text-xs bg-background" placeholder="Tên công ty (HĐ)" value={(editedReceipt.client?.invoiceInfo?.taxName as string) ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", invoiceInfo: { ...p.client?.invoiceInfo, taxName: e.target.value } } }))} />
                                                <Input className="h-7 text-xs bg-background" placeholder="MST (HĐ)" value={(editedReceipt.client?.invoiceInfo?.taxCode as string) ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", invoiceInfo: { ...p.client?.invoiceInfo, taxCode: e.target.value } } }))} />
                                                <Input className="h-7 text-xs bg-background" placeholder="Địa chỉ (HĐ)" value={(editedReceipt.client?.invoiceInfo?.taxAddress as string) ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", invoiceInfo: { ...p.client?.invoiceInfo, taxAddress: e.target.value } } }))} />
                                                <Input className="h-7 text-xs bg-background" placeholder="Email (HĐ)" value={(editedReceipt.client?.invoiceInfo?.taxEmail as string) ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, client: { ...p.client, clientId: p.client?.clientId ?? "", clientName: p.client?.clientName ?? "", invoiceInfo: { ...p.client?.invoiceInfo, taxEmail: e.target.value } } }))} />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <InfoRow label={String(t("crm.clients.clientName", { defaultValue: "Tên KH" }))} value={editedReceipt.client?.clientName} />
                                            <InfoRow label="MST" value={editedReceipt.client?.legalId} mono />
                                            <InfoRow label={String(t("common.address", { defaultValue: "Địa chỉ" }))} value={editedReceipt.client?.clientAddress} />
                                            <div className="grid grid-cols-2 gap-2">
                                                <InfoRow label={String(t("common.phone", { defaultValue: "SĐT" }))} value={editedReceipt.client?.clientPhone} />
                                                <InfoRow label={String(t("common.email", { defaultValue: "Email" }))} value={editedReceipt.client?.clientEmail} />
                                            </div>
                                            {editedReceipt.client?.invoiceInfo && (
                                                <div className="pt-2 border-t border-border/60 space-y-2">
                                                    <div className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Thông tin hoá đơn</div>
                                                    <InfoRow label="Tên" value={editedReceipt.client.invoiceInfo.taxName as string} />
                                                    <InfoRow label="MST" value={editedReceipt.client.invoiceInfo.taxCode as string} mono />
                                                    <InfoRow label="Địa chỉ" value={editedReceipt.client.invoiceInfo.taxAddress as string} />
                                                    <InfoRow label="Email" value={editedReceipt.client.invoiceInfo.taxEmail as string} />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </section>

                                {/* Người liên hệ & Nhận BC */}
                                <section className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                                    <SectionHeader icon={User} title={String(t("reception.createReceipt.contactInfo"))} />
                                    <div className="pb-3 border-b border-border/60 space-y-2">
                                        <div className="text-[10px] text-muted-foreground uppercase font-medium">Người liên hệ</div>
                                        {isEditing ? (
                                            <div className="space-y-1.5">
                                                {(["contactName", "contactPhone", "contactEmail", "contactPosition"] as const).map((f) => (
                                                    <Input key={f} className="h-7 text-xs bg-background" value={(editedReceipt.contactPerson?.[f] as string) ?? ""} placeholder={f} onChange={(e) => setEditedReceipt(p => ({ ...p, contactPerson: { ...p.contactPerson, [f]: e.target.value } }))} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <InfoRow label="Họ tên" value={editedReceipt.contactPerson?.contactName} />
                                                <InfoRow label="Chức vụ" value={editedReceipt.contactPerson?.contactPosition} />
                                                <InfoRow label="SĐT" value={editedReceipt.contactPerson?.contactPhone} />
                                                <InfoRow label="Email" value={editedReceipt.contactPerson?.contactEmail} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[10px] text-muted-foreground uppercase font-medium">Người nhận báo cáo</div>
                                        {isEditing ? (
                                            <div className="space-y-1.5">
                                                {(["receiverName", "receiverPhone", "receiverEmail", "receiverAddress"] as const).map((f) => (
                                                    <Input key={f} className="h-7 text-xs bg-background" value={(editedReceipt.reportRecipient?.[f] as string) ?? ""} placeholder={f} onChange={(e) => setEditedReceipt(p => ({ ...p, reportRecipient: { ...p.reportRecipient, [f]: e.target.value } }))} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5">
                                                <InfoRow label="Họ tên" value={editedReceipt.reportRecipient?.receiverName} />
                                                <InfoRow label="SĐT" value={editedReceipt.reportRecipient?.receiverPhone} />
                                                <InfoRow label="Email" value={editedReceipt.reportRecipient?.receiverEmail} />
                                                <InfoRow label="Địa chỉ" value={editedReceipt.reportRecipient?.receiverAddress} />
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Thông tin phiếu */}
                                <section className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                                    <SectionHeader icon={FileText} title={String(t("reception.createReceipt.receiptInfo"))} />
                                    <InfoRow label={String(t("lab.receipts.receiptCode", { defaultValue: "Mã phiếu" }))} value={editedReceipt.receiptCode} mono />
                                    <InfoRow label={String(t("lab.receipts.receiptDate"))} value={fmtDate(editedReceipt.receiptDate)} />
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{String(t("lab.receipts.receiptDeadline"))}</Label>
                                        {isEditing ? (
                                            <Input type="date" className="mt-1 h-7 text-xs bg-background" value={editedReceipt.receiptDeadline?.split("T")[0] ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, receiptDeadline: e.target.value }))} />
                                        ) : (
                                            <div className="text-sm font-bold text-destructive mt-0.5">{fmtDate(editedReceipt.receiptDeadline)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{String(t("lab.receipts.receiptStatus", { defaultValue: "Trạng thái" }))}</Label>
                                        {isEditing ? (
                                            <Select value={editedReceipt.receiptStatus ?? ""} onValueChange={(v) => setEditedReceipt(p => ({ ...p, receiptStatus: v as ReceiptStatus }))}>
                                                <SelectTrigger className="mt-1 h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                                                <SelectContent className="z-[1100]">
                                                    {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="mt-0.5">{getReceiptStatusBadge(t, editedReceipt.receiptStatus)}</div>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{String(t("lab.receipts.receiptPriority"))}</Label>
                                        {isEditing ? (
                                            <Select value={editedReceipt.receiptPriority ?? "Normal"} onValueChange={(v) => setEditedReceipt(p => ({ ...p, receiptPriority: v }))}>
                                                <SelectTrigger className="mt-1 h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                                                <SelectContent className="z-[1100]">
                                                    <SelectItem value="Normal" className="text-xs">Normal</SelectItem>
                                                    <SelectItem value="Urgent" className="text-xs">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-sm font-medium text-foreground mt-0.5">{editedReceipt.receiptPriority ?? "Normal"}</div>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{String(t("lab.receipts.receiptDeliveryMethod", { defaultValue: "Phương thức giao" }))}</Label>
                                        {isEditing ? (
                                            <Select value={editedReceipt.receiptDeliveryMethod ?? ""} onValueChange={(v) => setEditedReceipt(p => ({ ...p, receiptDeliveryMethod: v }))}>
                                                <SelectTrigger className="mt-1 h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                                                <SelectContent className="z-[1100]">
                                                    <SelectItem value="HandOver" className="text-xs">HandOver</SelectItem>
                                                    <SelectItem value="Post" className="text-xs">Post</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="text-sm font-medium text-foreground mt-0.5">{editedReceipt.receiptDeliveryMethod ?? "—"}</div>
                                        )}
                                    </div>
                                    {/* Mã vận đơn — click để mở ShipmentManagerModal */}
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{String(t("lab.receipts.receiptTrackingNo", { defaultValue: "Mã vận đơn" }))}</Label>
                                        <div className="mt-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                                                onClick={() => setShippingOpen(true)}
                                            >
                                                <Package className="h-3.5 w-3.5" />
                                                {editedReceipt.shipmentTrackingNumber
                                                    ? editedReceipt.shipmentTrackingNumber
                                                    : "Tạo / Xem vận đơn"}
                                            </Button>
                                        </div>
                                    </div>
                                    <InfoRow label={String(t("lab.receipts.orderId", { defaultValue: "Đơn hàng" }))} value={editedReceipt.order?.orderCode || editedReceipt.orderId} mono />
                                </section>

                                {/* Cấu hình & Bàn giao */}
                                <section className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                                    <SectionHeader icon={ShieldCheck} title="Cấu hình & Bàn giao" />
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase font-medium">Ngôn ngữ BC</Label>
                                        {isEditing ? (
                                            <Select value={editedReceipt.reportConfig?.language ?? "vi"} onValueChange={(v) => setEditedReceipt(p => ({ ...p, reportConfig: { ...p.reportConfig, language: v } }))}>
                                                <SelectTrigger className="mt-1 h-7 text-xs bg-background"><SelectValue /></SelectTrigger>
                                                <SelectContent className="z-[1100]">
                                                    <SelectItem value="vi" className="text-xs">Tiếng Việt</SelectItem>
                                                    <SelectItem value="en" className="text-xs">English</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : <div className="text-sm font-medium text-foreground mt-0.5">{editedReceipt.reportConfig?.language ?? "—"}</div>}
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground uppercase font-medium">Số bản in</Label>
                                        {isEditing ? (
                                            <Input type="number" min={1} className="mt-1 h-7 text-xs bg-background" value={editedReceipt.reportConfig?.copies?.toString() ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, reportConfig: { ...p.reportConfig, copies: parseInt(e.target.value) || 1 } }))} />
                                        ) : <div className="text-sm font-medium text-foreground mt-0.5">{editedReceipt.reportConfig?.copies ?? "—"}</div>}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-muted-foreground uppercase font-medium">Mã hoá phiếu</span>
                                        {isEditing ? (
                                            <button type="button" onClick={() => setEditedReceipt(p => ({ ...p, isBlindCoded: !p.isBlindCoded }))} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${editedReceipt.isBlindCoded ? "bg-primary" : "bg-muted-foreground/30"}`}>
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${editedReceipt.isBlindCoded ? "translate-x-4.5" : "translate-x-0.5"}`} />
                                            </button>
                                        ) : editedReceipt.isBlindCoded
                                            ? <Badge variant="outline" className="text-[9px] bg-warning/10 text-warning border-warning/30">Có</Badge>
                                            : <Badge variant="outline" className="text-[9px]">Không</Badge>}
                                    </div>
                                    <div className="pt-2 border-t border-border/60 space-y-1.5">
                                        <div className="text-[10px] text-muted-foreground uppercase font-medium">Kiểm tra điều kiện</div>
                                        {isEditing ? (
                                            <>
                                                <Input className="h-7 text-xs bg-background" placeholder="Niêm phong" value={editedReceipt.conditionCheck?.seal ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, conditionCheck: { ...p.conditionCheck, seal: e.target.value } }))} />
                                                <Input className="h-7 text-xs bg-background" placeholder="Nhiệt độ" value={editedReceipt.conditionCheck?.temp ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, conditionCheck: { ...p.conditionCheck, temp: e.target.value } }))} />
                                            </>
                                        ) : (
                                            <>
                                                <InfoRow label="Niêm phong" value={editedReceipt.conditionCheck?.seal} />
                                                <InfoRow label="Nhiệt độ" value={editedReceipt.conditionCheck?.temp} />
                                            </>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-border/60 space-y-1.5">
                                        <div className="text-[10px] text-muted-foreground uppercase font-medium">Người gửi mẫu</div>
                                        {isEditing ? (
                                            <>
                                                <Input className="h-7 text-xs bg-background" placeholder="Họ tên" value={editedReceipt.senderInfo?.name ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, senderInfo: { ...p.senderInfo, name: e.target.value } }))} />
                                                <Input className="h-7 text-xs bg-background" placeholder="SĐT" value={editedReceipt.senderInfo?.phone ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, senderInfo: { ...p.senderInfo, phone: e.target.value } }))} />
                                            </>
                                        ) : (
                                            <>
                                                <InfoRow label="Họ tên" value={editedReceipt.senderInfo?.name} />
                                                <InfoRow label="SĐT" value={editedReceipt.senderInfo?.phone} />
                                            </>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-border/60">
                                        <Label className="text-[10px] text-muted-foreground uppercase font-medium">{String(t("lab.receipts.receiptNote"))}</Label>
                                        {isEditing ? (
                                            <Textarea value={editedReceipt.receiptNote ?? ""} onChange={(e) => setEditedReceipt(p => ({ ...p, receiptNote: e.target.value }))} className="mt-1 min-h-[56px] text-xs bg-background" placeholder="..." />
                                        ) : (
                                            <div className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-2 rounded-lg mt-1 italic">{editedReceipt.receiptNote ?? "—"}</div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Samples table */}
                            {samplesTableJSX}


                        </div>

                        {/* Right panel: Images & Documents */}
                        <div className="w-64 shrink-0 border-l border-border bg-card flex flex-col">
                            {/* ── Section 1: Images ── */}
                            <div className="flex-none flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <Camera className="h-3.5 w-3.5" />
                                    {String(t("reception.receiptDetail.sampleImage"))}
                                </h3>
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={handleFindRelated} disabled={isUploading} title={String(t("common.search"))}><Search className="h-3 w-3" /></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => { setManageImages([...loadedImages]); setManageSelectedIds([...fileIds]); setManageModalOpen(true); }} title={String(t("reception.receiptDetail.manageImages"))}><Edit className="h-3 w-3" /></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}><Upload className="h-3 w-3" /></Button>
                                    <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => cameraInputRef.current?.click()} disabled={isUploading}><Camera className="h-3 w-3" /></Button>
                                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
                                    <input type="file" multiple accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleUpload} />
                                </div>
                            </div>

                            <div className="flex-none p-3 h-48">
                                {imageLoading || isUploading ? (
                                    <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : loadedImages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/10 text-muted-foreground">
                                        <ImageOff className="h-7 w-7 mb-1.5 opacity-20" />
                                        <p className="text-[10px] uppercase font-medium">{String(t("reception.receiptDetail.noImage"))}</p>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col gap-2">
                                        <div className="relative flex-1 rounded-xl overflow-hidden flex items-center justify-center bg-black/5 group border border-border">
                                            {loadedImages.length > 1 && (
                                                <Button variant="ghost" size="icon" onClick={() => setFocusedImageIdx((i) => (i === 0 ? loadedImages.length - 1 : i - 1))} className="absolute left-1 z-10 h-6 w-6 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100">
                                                    <ChevronLeft className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <img src={loadedImages[focusedImageIdx]?.url} alt="" className="max-w-full max-h-full object-contain" />
                                            {loadedImages.length > 1 && (
                                                <Button variant="ghost" size="icon" onClick={() => setFocusedImageIdx((i) => (i === loadedImages.length - 1 ? 0 : i + 1))} className="absolute right-1 z-10 h-6 w-6 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100">
                                                    <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            )}
                                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">{focusedImageIdx + 1}/{loadedImages.length}</div>
                                        </div>
                                        {loadedImages.length > 1 && (
                                            <div ref={thumbnailsRef} className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                                {loadedImages.map((img, idx) => (
                                                    <button key={img.fileId} type="button" onClick={() => setFocusedImageIdx(idx)} className={`shrink-0 w-8 h-8 rounded-lg border-2 overflow-hidden transition-all ${idx === focusedImageIdx ? "border-primary" : "border-border opacity-50"}`}>
                                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── Section 2: Documents ── */}
                            <div className="flex-none flex items-center px-3 py-2 border-y border-border bg-muted/30 mt-2">
                                <h3 className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText className="h-3.5 w-3.5" />
                                    Tài liệu liên quan
                                </h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/5">
                                {(!editedReceipt.documents || editedReceipt.documents.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                                        <FileText className="h-8 w-8 mb-2" />
                                        <p className="text-[10px] uppercase font-medium italic">Không có tài liệu</p>
                                    </div>
                                ) : (
                                    editedReceipt.documents.map((doc: any, idx: number) => (
                                        <div key={doc.documentId || idx} className="group flex flex-col p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0">
                                                    <p className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight uppercase tracking-tight">{doc.documentTitle || "Chưa có tiêu đề"}</p>
                                                    <p className="text-[9px] text-muted-foreground mt-0.5 font-mono">{doc.documentId}</p>
                                                </div>
                                                <Badge variant="outline" className="shrink-0 text-[8px] h-3.5 px-1 bg-primary/5 text-primary border-primary/20">{doc.documentType || "DOC"}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-border/50 pt-2">
                                                <span className="text-[9px] text-muted-foreground italic">{doc.documentStatus || "Draft"}</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-6 px-2 text-[10px] gap-1 text-primary hover:bg-primary/10" 
                                                    onClick={() => doc.fileId && handlePreviewFile(doc.fileId)}
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Xem tệp
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Child Modals ──────────────────────────────────── */}
            {showEmailModal && (
                <EmailModal
                    open={showEmailModal}
                    onClose={() => setShowEmailModal(false)}
                    defaultTo={emailData.to}
                    defaultCc={emailData.cc}
                    defaultSubject={emailData.subject}
                    defaultContent={emailData.content}
                    refId={editedReceipt.receiptId}
                    type={emailType}
                    images={loadedImages}
                    documents={editedReceipt.documents ?? []}
                    samples={editedReceipt.samples ?? []}
                />
            )}

            {manageModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-[1050]" onClick={() => setManageModalOpen(false)} />
                    <div className="fixed inset-y-8 right-8 w-[520px] bg-background rounded-xl shadow-2xl z-[1051] flex flex-col border border-border animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                                <Edit className="h-4 w-4 text-primary" />
                                {String(t("reception.receiptDetail.manageImages"))}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setManageModalOpen(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                            <div className="grid grid-cols-3 gap-3">
                                {manageImages.map((img) => (
                                    <div
                                        key={img.fileId}
                                        className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${manageSelectedIds.includes(img.fileId) ? "border-primary shadow-md" : "border-border opacity-70 hover:opacity-100"}`}
                                        onClick={() => setManageSelectedIds(prev => prev.includes(img.fileId) ? prev.filter(id => id !== img.fileId) : [...prev, img.fileId])}
                                    >
                                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                                        <div className={`absolute top-1.5 right-1.5 h-4 w-4 rounded-full border-2 flex items-center justify-center ${manageSelectedIds.includes(img.fileId) ? "bg-primary border-primary" : "bg-black/20 border-white/50"}`}>
                                            {manageSelectedIds.includes(img.fileId) && <FileCheck className="h-2.5 w-2.5 text-primary-foreground" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {manageImages.length === 0 && (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <ImageOff className="h-8 w-8 mb-2" />
                                    <p className="text-sm">{String(t("reception.receiptDetail.noImage"))}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-border bg-card flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                Đã chọn: <span className="text-primary font-medium">{manageSelectedIds.length}</span>/{manageImages.length}
                            </span>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setManageModalOpen(false)}>{String(t("common.cancel"))}</Button>
                                <Button size="sm" onClick={handleConfirmManage} className="px-6">{String(t("common.save"))}</Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {showPrintLabelModal && (
                <SamplePrintLabelModal
                    items={editedReceipt.samples?.map(s => ({
                        sampleId: s.sampleId,
                        sampleName: s.sampleName,
                        sampleTypeName: s.sampleTypeName ?? null,
                        productType: s.productType ?? null,
                        sampleClientInfo: s.sampleClientInfo ?? null,
                    })) ?? []}
                    receiptCode={receipt.receiptCode}
                    onClose={() => setShowPrintLabelModal(false)}
                />
            )}

            {showResultCertificateModal && (
                <ResultCertificateModal open={showResultCertificateModal} onOpenChange={setShowResultCertificateModal} receipt={editedReceipt} />
            )}

            {openSampleModal && selectedSample && (
                <SampleDetailModal sample={selectedSample} receipt={editedReceipt} focusAnalysisId={focusAnalysisId} onClose={closeSampleModal} onSave={handleSaveSample} />
            )}

            {showAddSampleModal && (
                <AddSampleModal
                    receipt={editedReceipt}
                    onClose={() => setShowAddSampleModal(false)}
                    onCreated={(refreshed) => {
                        setEditedReceipt(refreshed);
                        onUpdated?.(refreshed);
                        setShowAddSampleModal(false);
                    }}
                />
            )}
        </>
    );
}
