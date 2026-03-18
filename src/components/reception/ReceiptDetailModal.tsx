import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { X, Edit, Save, Upload, FileText, Printer, FileCheck, Mail, ChevronLeft, ChevronRight, ImageOff, Camera, Search, Building2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { receiptsUpdate, receiptsGetFull } from "@/api/receipts";
import { receiptsKeys } from "@/api/receiptsKeys";
import { samplesGetFull } from "@/api/samples";
import { fileApi, buildFileUploadFormData } from "@/api/files";

import type { ReceiptDetail, ReceiptSample, ReceiptAnalysis, ReceiptsUpdateBody, ReceiptStatus } from "@/types/receipt";
import { ResultCertificateModal } from "./ResultCertificateModal";

import { SampleDetailModal } from "./SampleDetailModal";
import { SamplePrintLabelModal, type SampleLabelItem } from "./SamplePrintLabelModal";
import { AddSampleModal } from "./AddSampleModal";

interface ReceiptDetailModalProps {
    receipt: ReceiptDetail;
    onClose: () => void;

    onSampleClick: (sample: ReceiptSample) => void;

    onUpdated?: (next: ReceiptDetail) => void;
}

const RECEIPT_STATUS_OPTIONS: ReceiptStatus[] = ["Draft", "Received", "Processing", "Completed", "Reported", "Cancelled"];

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

function receiptStatusLabel(t: (key: string, options?: Record<string, unknown>) => unknown, status: ReceiptStatus) {
    const key = receiptStatusKey(status);
    return String(key ? t(key, { defaultValue: status }) : status);
}

function getReceiptStatusBadge(t: (key: string, options?: Record<string, unknown>) => unknown, status: ReceiptStatus | null | undefined) {
    const st = status ?? "";
    const key = status ? receiptStatusKey(status) : null;
    const label = String(key ? t(key, { defaultValue: st }) : st || "-");

    switch (status) {
        case "Draft":
            return (
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                    {label}
                </Badge>
            );

        case "Received":
            return (
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                    {label}
                </Badge>
            );

        case "Processing":
            return (
                <Badge variant="default" className="text-xs bg-warning text-warning-foreground hover:bg-warning/90">
                    {label}
                </Badge>
            );

        case "Completed":
            return (
                <Badge variant="default" className="text-xs bg-success text-success-foreground hover:bg-success/90">
                    {label}
                </Badge>
            );

        case "Reported":
            return (
                <Badge variant="default" className="text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                    {label}
                </Badge>
            );

        case "Cancelled":
            return (
                <Badge variant="destructive" className="text-xs">
                    {label}
                </Badge>
            );

        default:
            return (
                <Badge variant="secondary" className="text-xs text-muted-foreground">
                    {label}
                </Badge>
            );
    }
}

function getAnalysisStatusBadge(t: (key: string, options?: Record<string, unknown>) => unknown, status: ReceiptAnalysis["analysisStatus"]) {
    switch (status) {
        case "Pending":
            return (
                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                    {String(t("lab.analyses.status.Pending"))}
                </Badge>
            );
        case "Testing":
            return (
                <Badge variant="default" className="text-xs">
                    {String(t("lab.analyses.status.Testing"))}
                </Badge>
            );
        case "Approved":
            return (
                <Badge variant="default" className="text-xs">
                    {String(t("lab.analyses.status.Approved"))}
                </Badge>
            );
        case "Review":
            return (
                <Badge variant="default" className="text-xs">
                    {String(t("lab.analyses.status.Review"))}
                </Badge>
            );
        default:
            return (
                <Badge variant="secondary" className="text-xs">
                    {String(status ?? "")}
                </Badge>
            );
    }
}

export function ReceiptDetailModal({ receipt, onClose, onSampleClick, onUpdated }: ReceiptDetailModalProps) {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [editedReceipt, setEditedReceipt] = useState<ReceiptDetail>(receipt);

    useEffect(() => {
        setEditedReceipt(receipt);
        setIsEditing(false);
    }, [receipt]);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showPrintLabelModal, setShowPrintLabelModal] = useState(false);
    const [showResultCertificateModal, setShowResultCertificateModal] = useState(false);

    // ── Image viewer state ──────────────────────────────────────────────────
    type LoadedImage = { fileId: string; url: string };
    const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
    const [imageLoading, setImageLoading] = useState(false);
    const [focusedImageIdx, setFocusedImageIdx] = useState(0);
    const thumbnailsRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Manage Manage Images state
    const [manageModalOpen, setManageModalOpen] = useState(false);
    const [manageImages, setManageImages] = useState<LoadedImage[]>([]);
    const [manageSelectedIds, setManageSelectedIds] = useState<string[]>([]);

    // Safely parse fileIds whether it comes as array, stringified array, or pg array string
    const rawFileIds = editedReceipt.receiptReceivedImageFileIds as unknown as string[] | string | null | undefined;
    const fileIds: string[] = useMemo(() => {
        if (!rawFileIds) return [];
        if (Array.isArray(rawFileIds)) {
            return rawFileIds.map((f) => (typeof f === "string" ? f : ((f as any)?.fileId ?? (f as any)?.id ?? String(f)))).filter(Boolean);
        }
        if (typeof rawFileIds === "string") {
            try {
                // Try to parse JSON array '["file_1"]'
                const parsed = JSON.parse(rawFileIds);
                if (Array.isArray(parsed)) return parsed.map(String);
            } catch {
                // Handle postgres `{val1,val2}` format
                if ((rawFileIds as any).startsWith("{") && (rawFileIds as any).endsWith("}")) {
                    return (rawFileIds as any)
                        .slice(1, -1)
                        .split(",")
                        .map((v: string) => v.trim().replace(/^"|"$/g, ""))
                        .filter(Boolean);
                }
                return [rawFileIds]; // single string
            }
        }
        return [];
    }, [rawFileIds]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        try {
            setIsUploading(true);
            const newLoaded: LoadedImage[] = [];
            const newFileIds: string[] = [];

            for (const file of files) {
                const formData = buildFileUploadFormData(file, {
                    commonKeys: [editedReceipt.receiptCode ?? ""],
                    fileTags: ["Received Image"],
                });

                const uploadRes: any = await fileApi.upload(formData);
                const newFileId = uploadRes?.data?.fileId ?? uploadRes?.fileId;

                if (newFileId) {
                    newFileIds.push(newFileId);
                    try {
                        const urlRes: any = await fileApi.url(newFileId, 3600);
                        const url = urlRes?.data?.url ?? urlRes?.url;
                        if (url) newLoaded.push({ fileId: newFileId, url });
                    } catch {
                        // ignore
                    }
                }
            }

            if (newLoaded.length > 0) {
                const combined = [...loadedImages];
                newLoaded.forEach((nl) => {
                    if (!combined.some((c) => c.fileId === nl.fileId)) combined.push(nl);
                });
                setManageImages(combined);
                setManageSelectedIds([...fileIds, ...newFileIds]);
                setManageModalOpen(true);
            }
        } catch (err) {
            toast.error(getErrorMessage(err, "Upload failed"));
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleFindRelated = async () => {
        if (!editedReceipt.receiptCode) return;
        try {
            setIsUploading(true);
            const res: any = await fileApi.list({
                fileTags: ["Received Image"],
                commonKeys: [editedReceipt.receiptCode],
            });
            const fetchedItems = res?.data ?? [];
            if (fetchedItems.length === 0) {
                toast.info(String(t("reception.receiptDetail.noRelatedImages", { defaultValue: "Không tìm thấy ảnh liên quan." })));
                return;
            }

            const newLoaded: LoadedImage[] = [];
            for (const item of fetchedItems) {
                const fid = item.fileId ?? item.id;
                if (!fid) continue;
                let url = loadedImages.find((l: LoadedImage) => l.fileId === fid)?.url;
                if (!url) {
                    try {
                        const urlRes: any = await fileApi.url(fid, 3600);
                        url = urlRes?.data?.url ?? urlRes?.url;
                    } catch {
                        // ignore fail
                    }
                }
                if (url) newLoaded.push({ fileId: fid, url });
            }

            const combined = [...loadedImages];
            newLoaded.forEach((nl) => {
                if (!combined.some((c) => c.fileId === nl.fileId)) combined.push(nl);
            });
            setManageImages(combined);
            setManageSelectedIds([...fileIds]);
            setManageModalOpen(true);
        } catch (err) {
            toast.error(getErrorMessage(err, "Search failed"));
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirmManage = async () => {
        try {
            setIsUploading(true);
            const body: ReceiptsUpdateBody = {
                receiptId: editedReceipt.receiptId,
                receiptReceivedImageFileIds: manageSelectedIds,
            };
            await receiptsUpdate({ body });
            toast.success(String(t("common.toast.saved")));

            // refetch
            const fullRes: any = await receiptsGetFull({ receiptId: receipt.receiptId });
            const fullData: ReceiptDetail = fullRes?.data !== undefined ? fullRes.data : fullRes;
            setEditedReceipt(fullData);
            onUpdated?.(fullData);

            setManageModalOpen(false);
        } catch (err) {
            toast.error(getErrorMessage(err, String(t("common.toast.error"))));
        } finally {
            setIsUploading(false);
        }
    };

    // Fetch signed URLs whenever fileIds changes
    useEffect(() => {
        if (fileIds.length === 0) {
            setLoadedImages([]);
            setFocusedImageIdx(0);
            return;
        }
        let cancelled = false;
        setImageLoading(true);
        Promise.all(
            fileIds.map(async (fid: string) => {
                try {
                    const res: any = await fileApi.url(fid, 3600);
                    const url = res?.data?.url ?? res?.url ?? null;
                    return url ? { fileId: fid, url } : null;
                } catch {
                    return null;
                }
            }),
        ).then((results) => {
            if (!cancelled) {
                setLoadedImages(results.filter((u: LoadedImage | null): u is LoadedImage => u !== null));
                setFocusedImageIdx(0);
                setImageLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [fileIds]);

    const handlePrevImg = useCallback(() => setFocusedImageIdx((i: number) => (i === 0 ? loadedImages.length - 1 : i - 1)), [loadedImages.length]);
    const handleNextImg = useCallback(() => setFocusedImageIdx((i: number) => (i === loadedImages.length - 1 ? 0 : i + 1)), [loadedImages.length]);

    // scroll selected thumbnail into view
    useEffect(() => {
        if (!thumbnailsRef.current) return;
        const el = thumbnailsRef.current.children[focusedImageIdx] as HTMLElement | undefined;
        el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }, [focusedImageIdx]);

    const samples = editedReceipt.samples ?? [];

    const getAnalysesForSample = useCallback((sample: ReceiptSample): ReceiptAnalysis[] => {
        return (sample.analyses ?? []).filter((a) => Boolean(a?.analysisId));
    }, []);

    const emailDefaults = useMemo(() => {
        const toEmail = editedReceipt.client?.clientEmail ?? editedReceipt.reportRecipient?.receiverEmail ?? "";

        return {
            from: String(t("reception.receiptDetail.emailTemplate.from", { defaultValue: "" })),
            to: toEmail,
            subject: String(
                t("reception.receiptDetail.emailTemplate.subject", {
                    code: editedReceipt.receiptCode,
                }),
            ),
            content: String(
                t("reception.receiptDetail.emailTemplate.content", {
                    clientName: editedReceipt.client?.clientName ?? "",
                    receiptCode: editedReceipt.receiptCode ?? "",
                    receiptDate: editedReceipt.receiptDate?.split("T")[0] ?? "",
                    deadline: editedReceipt.receiptDeadline?.split("T")[0] ?? "",
                }),
            ),
            attachments: [] as string[],
        };
    }, [editedReceipt, t]);

    const [emailForm, setEmailForm] = useState(emailDefaults);

    useEffect(() => {
        setEmailForm(emailDefaults);
    }, [emailDefaults]);

    const updateMut = useMutation({
        mutationFn: (body: ReceiptsUpdateBody) => receiptsUpdate({ body }),
        onSuccess: async () => {
            // Re-fetch full receipt to get all nested data (samples, analyses, images...)
            try {
                const fullRes: any = await receiptsGetFull({ receiptId: receipt.receiptId });
                const fullData: ReceiptDetail = fullRes?.data !== undefined ? fullRes.data : fullRes;
                setEditedReceipt(fullData);
                onUpdated?.(fullData);
            } catch {
                // fallback: just invalidate
            }

            await Promise.all([
                qc.invalidateQueries({ queryKey: receiptsKeys.list(undefined) }),
                qc.invalidateQueries({
                    queryKey: receiptsKeys.detail(receipt.receiptId),
                }),
                qc.invalidateQueries({
                    queryKey: receiptsKeys.full(receipt.receiptId),
                }),
            ]);

            toast.success(String(t("common.toast.saved")));
            setIsEditing(false);
        },
        onError: (e) => {
            toast.error(getErrorMessage(e, String(t("common.toast.error"))));
        },
    });

    const handleSave = async () => {
        const body: ReceiptsUpdateBody = {
            receiptId: editedReceipt.receiptId,
            receiptStatus: editedReceipt.receiptStatus ?? null,
            receiptDeadline: editedReceipt.receiptDeadline ?? null,
            receiptNote: editedReceipt.receiptNote ?? null,
            client: editedReceipt.client
                ? {
                      clientId: editedReceipt.client.clientId ?? null,
                      clientName: editedReceipt.client.clientName ?? null,
                  }
                : null,
        };

        await updateMut.mutateAsync(body);
    };

    const handleEmailChange = useCallback((field: "from" | "to" | "subject" | "content", value: string) => {
        setEmailForm((p) => ({ ...p, [field]: value }));
    }, []);

    const handleSendEmail = useCallback(() => {
        // eslint-disable-next-line no-console
        console.log("Sending email:", emailForm);
        setShowEmailModal(false);
    }, [emailForm]);

    const [openSampleModal, setOpenSampleModal] = useState(false);
    const [selectedSample, setSelectedSample] = useState<ReceiptSample | null>(null);
    const [focusAnalysisId, setFocusAnalysisId] = useState<string | null>(null);
    const [sampleFetching, setSampleFetching] = useState(false);
    const [showAddSampleModal, setShowAddSampleModal] = useState(false);

    useEffect(() => {
        setOpenSampleModal(false);
        setSelectedSample(null);
        setFocusAnalysisId(null);
    }, [receipt.receiptId]);

    const openSampleByLabId = useCallback(
        async (sample: ReceiptSample, analysisId: string | null) => {
            setFocusAnalysisId(analysisId);
            setOpenSampleModal(true);
            setSelectedSample(sample); // Quick show

            setSampleFetching(true);
            try {
                const res = await samplesGetFull({ sampleId: sample.sampleId });
                const fullData = res.data ?? res;
                if (fullData) {
                    const s = fullData as any as ReceiptSample;
                    setSelectedSample(s);
                    // Also notify parent if needed
                    onSampleClick?.(s);
                }
            } catch (e) {
                console.error("Failed to fetch full sample info:", e);
            } finally {
                setSampleFetching(false);
            }
        },
        [onSampleClick],
    );

    const closeSampleModal = useCallback(() => {
        setOpenSampleModal(false);
        setSelectedSample(null);
        setFocusAnalysisId(null);
    }, []);

    const handleSaveSample = async (updatedSample: ReceiptSample) => {
        setEditedReceipt((prev: ReceiptDetail) => {
            const nextSamples = (prev.samples ?? []).map((s: ReceiptSample) => (s.sampleId === updatedSample.sampleId ? updatedSample : s));
            const next: ReceiptDetail = { ...prev, samples: nextSamples };
            onUpdated?.(next);
            return next;
        });

        toast.success(String(t("common.toast.saved")));
        closeSampleModal();
    };

    const samplesTableJSX = useMemo(
        () => (
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">{String(t("reception.createReceipt.samplesList"))}</h3>
                    <Button variant="outline" size="sm" onClick={() => setShowAddSampleModal(true)} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" />
                        {String(t("reception.addSample.addButton", { defaultValue: "Thêm mẫu" }))}
                    </Button>
                </div>

                <div className="bg-background border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.samples.sampleId"))}</th>

                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.samples.sampleName"))}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.samples.sampleTypeName"))}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.analyses.analysisId", { defaultValue: "Mã phép thử" }))}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.analyses.parameterName"))}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.analyses.protocolCode"))}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.analyses.technicianIds"))}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.analyses.analysisStatus"))}</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.analyses.analysisResult"))}</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-border">
                                {samples.map((sample: ReceiptSample) => {
                                    const analyses = getAnalysesForSample(sample);

                                    return (
                                        <React.Fragment key={sample.sampleId}>
                                            {analyses.length > 0 ? (
                                                analyses.map((analysis, index) => (
                                                    <tr key={analysis.analysisId} className="hover:bg-muted/30">
                                                        {index === 0 && (
                                                            <>
                                                                <td className="px-4 py-3 align-top border-r bg-primary/5" rowSpan={analyses.length}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            onSampleClick(sample);
                                                                            openSampleByLabId(sample, null);
                                                                        }}
                                                                        className="font-medium text-primary hover:text-primary/80 hover:underline text-sm"
                                                                    >
                                                                        {sample.sampleId}
                                                                    </button>
                                                                </td>
                                                                <td className="px-4 py-3 align-top border-r bg-primary/5" rowSpan={analyses.length}>
                                                                    <div className="text-sm text-foreground">{sample.sampleName || sample.sampleClientInfo || sample.sampleTypeName || "-"}</div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top border-r bg-primary/5" rowSpan={analyses.length}>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {sample.sampleTypeName ?? "-"}
                                                                    </Badge>
                                                                </td>
                                                            </>
                                                        )}

                                                        <td className="px-4 py-3 text-sm">
                                                            <button
                                                                type="button"
                                                                onClick={() => openSampleByLabId(sample, analysis.analysisId)}
                                                                className="font-medium text-primary hover:text-primary/80 hover:underline whitespace-nowrap"
                                                            >
                                                                {analysis.analysisId}
                                                            </button>
                                                        </td>

                                                        <td className="px-4 py-3 text-sm text-foreground">{analysis.parameterName ?? "-"}</td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">{analysis.protocolCode ?? "-"}</td>
                                                        <td className="px-4 py-3 text-sm text-foreground">{analysis.technician?.identityName ?? analysis.technicianId ?? "-"}</td>
                                                        <td className="px-4 py-3">{getAnalysisStatusBadge(t, analysis.analysisStatus)}</td>
                                                        <td className="px-4 py-3">
                                                            {analysis.analysisResult != null ? (
                                                                <div className="text-sm font-medium text-foreground">
                                                                    {String(analysis.analysisResult)} {analysis.analysisUnit ?? ""}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr className="hover:bg-muted/30">
                                                    <td className="px-4 py-3 align-top border-r bg-primary/5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onSampleClick(sample);
                                                                openSampleByLabId(sample, null);
                                                            }}
                                                            className="font-medium text-primary hover:text-primary/80 hover:underline text-sm"
                                                        >
                                                            {sample.sampleId}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3 align-top border-r bg-primary/5">
                                                        <div className="text-sm text-foreground">{sample.sampleClientInfo ?? "-"}</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top border-r bg-primary/5">
                                                        <Badge variant="outline" className="text-xs">
                                                            {sample.sampleTypeName ?? "-"}
                                                        </Badge>
                                                    </td>

                                                    <td className="px-4 py-3 text-sm text-muted-foreground">-</td>

                                                    <td colSpan={5} className="px-4 py-3 text-center text-muted-foreground text-sm">
                                                        {String(t("reception.createReceipt.noAnalysis"))}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        ),
        [samples, t, openSampleByLabId, onSampleClick, getAnalysesForSample],
    );

    return createPortal(
        <>
            {/* Premium Backdrop with improved blur */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[70] transition-all duration-300" onClick={onClose} aria-hidden="true" />

            <div className="fixed inset-4 bg-background rounded-lg shadow-2xl z-[70] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {String(
                                t("reception.receiptDetail.title", {
                                    code: receipt.receiptCode,
                                }),
                            )}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{String(t("reception.receiptDetail.description"))}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => setShowPrintLabelModal(true)} variant="outline" className="flex items-center gap-1.5 text-xs">
                            <Printer className="h-3.5 w-3.5" />
                            {String(t("reception.receiptDetail.printLabel"))}
                        </Button>

                        <Button size="sm" onClick={() => console.log("Export handover")} variant="outline" className="flex items-center gap-1.5 text-xs">
                            <FileCheck className="h-3.5 w-3.5" />
                            {String(t("reception.receiptDetail.exportHandover"))}
                        </Button>

                        <Button size="sm" onClick={() => setShowResultCertificateModal(true)} variant="outline" className="flex items-center gap-1.5 text-xs">
                            <FileText className="h-3.5 w-3.5" />
                            {String(t("reception.receiptDetail.resultCertificate", { defaultValue: "Phiếu kết quả" }))}
                        </Button>

                        {!isEditing ? (
                            <Button size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs">
                                <Edit className="h-3.5 w-3.5" />
                                {String(t("common.edit"))}
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" onClick={handleSave} disabled={updateMut.isPending} className="flex items-center gap-1.5 text-xs">
                                    <Save className="h-3.5 w-3.5" />
                                    {String(t("common.save"))}
                                </Button>

                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={updateMut.isPending}
                                    onClick={() => {
                                        setEditedReceipt(receipt);
                                        setIsEditing(false);
                                    }}
                                    className="text-xs"
                                >
                                    {String(t("common.cancel"))}
                                </Button>
                            </>
                        )}

                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-background">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary-foreground bg-primary px-2.5 py-1 rounded shadow-sm">
                            {String(t("reception.receiptDetail.infoAndSamples", { defaultValue: "Xem thông tin phiếu và danh sách mẫu/chỉ tiêu." }))}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        <div className="xl:col-span-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-6 text-sm">
                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("lab.receipts.receiptCode"))}</Label>
                                    <div className="mt-1 font-medium text-foreground">{editedReceipt.receiptCode ?? "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("crm.clients.clientId"))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedReceipt.client?.clientId ?? ""}
                                            onChange={(e) =>
                                                setEditedReceipt((p: ReceiptDetail) => ({
                                                    ...p,
                                                    client: {
                                                        ...(p.client ?? { clientName: "" }),
                                                        clientId: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="mt-1 bg-background h-8"
                                        />
                                    ) : (
                                        <div className="mt-1 font-medium text-foreground">{editedReceipt.client?.clientId ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("crm.clients.legalId", { defaultValue: "Mã định danh (Số ĐKKD)" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedReceipt.client?.legalId ?? ""}
                                            onChange={(e) =>
                                                setEditedReceipt((p: ReceiptDetail) => ({
                                                    ...p,
                                                    client: {
                                                        ...(p.client ?? { clientId: "", clientName: "" }),
                                                        legalId: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="mt-1 bg-background h-8"
                                        />
                                    ) : (
                                        <div className="mt-1 font-medium text-foreground">{editedReceipt.client?.legalId ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("crm.clients.clientName"))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedReceipt.client?.clientName ?? ""}
                                            onChange={(e) =>
                                                setEditedReceipt((p: ReceiptDetail) => ({
                                                    ...p,
                                                    client: {
                                                        ...(p.client ?? { clientId: "", clientName: "" }),
                                                        clientName: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="mt-1 bg-background h-8"
                                        />
                                    ) : (
                                        <div className="mt-1 font-medium text-foreground">{editedReceipt.client?.clientName ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.orderCode", { defaultValue: "Mã đơn hàng L/K" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.order?.orderCode ?? "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("crm.clients.clientAddress"))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedReceipt.client?.clientAddress ?? ""}
                                            onChange={(e) =>
                                                setEditedReceipt((p: ReceiptDetail) => ({
                                                    ...p,
                                                    client: {
                                                        ...(p.client ?? { clientId: "", clientName: "" }),
                                                        clientAddress: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="mt-1 bg-background h-8"
                                        />
                                    ) : (
                                        <div className="mt-1 text-foreground">{editedReceipt.client?.clientAddress ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.createReceipt.contactInfo", { defaultValue: "Thông tin liên hệ" }))}</Label>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                            <Input
                                                placeholder="Email"
                                                value={editedReceipt.client?.clientEmail ?? ""}
                                                onChange={(e) =>
                                                    setEditedReceipt((p: ReceiptDetail) => ({
                                                        ...p,
                                                        client: {
                                                            ...(p.client ?? { clientId: "", clientName: "" }),
                                                            clientEmail: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="bg-background h-8"
                                            />
                                            <Input
                                                placeholder="Phone"
                                                value={editedReceipt.client?.clientPhone ?? ""}
                                                onChange={(e) =>
                                                    setEditedReceipt((p: ReceiptDetail) => ({
                                                        ...p,
                                                        client: {
                                                            ...(p.client ?? { clientId: "", clientName: "" }),
                                                            clientPhone: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="bg-background h-8"
                                            />
                                        </div>
                                    ) : (
                                        <div className="mt-1 text-foreground">
                                            {editedReceipt.client?.clientPhone ? `${editedReceipt.client.clientPhone} - ` : ""}
                                            {editedReceipt.client?.clientEmail ?? "-"}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.contactPerson", { defaultValue: "Người liên hệ" }))}</Label>
                                    <div className="mt-1 text-foreground">
                                        {editedReceipt.contactPerson?.contactName ? `${editedReceipt.contactPerson.contactName} - ${editedReceipt.contactPerson.contactPhone ?? ""}` : "-"}
                                    </div>
                                </div>

                                <div className="md:col-span-3 border-t border-border pt-4 mt-2">
                                    <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        {String(t("reception.createReceipt.invoiceInfo", { defaultValue: "Thông tin xuất hóa đơn" }))}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div>
                                            <Label className="text-sm text-muted-foreground">{String(t("crm.clients.invoice.taxCode"))}</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editedReceipt.client?.invoiceInfo?.taxCode ?? ""}
                                                    onChange={(e) =>
                                                        setEditedReceipt((p: ReceiptDetail) => ({
                                                            ...p,
                                                            client: {
                                                                ...(p.client ?? { clientId: "", clientName: "" }),
                                                                invoiceInfo: { ...(p.client?.invoiceInfo ?? {}), taxCode: e.target.value },
                                                            },
                                                        }))
                                                    }
                                                    className="mt-1 bg-background h-8"
                                                />
                                            ) : (
                                                <div className="mt-1 text-foreground font-medium">{editedReceipt.client?.invoiceInfo?.taxCode ?? "-"}</div>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">{String(t("crm.clients.invoice.taxName"))}</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editedReceipt.client?.invoiceInfo?.taxName ?? ""}
                                                    onChange={(e) =>
                                                        setEditedReceipt((p: ReceiptDetail) => ({
                                                            ...p,
                                                            client: {
                                                                ...(p.client ?? { clientId: "", clientName: "" }),
                                                                invoiceInfo: { ...(p.client?.invoiceInfo ?? {}), taxName: e.target.value },
                                                            },
                                                        }))
                                                    }
                                                    className="mt-1 bg-background h-8"
                                                />
                                            ) : (
                                                <div className="mt-1 text-foreground">{editedReceipt.client?.invoiceInfo?.taxName ?? "-"}</div>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">{String(t("crm.clients.invoice.taxEmail"))}</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editedReceipt.client?.invoiceInfo?.taxEmail ?? ""}
                                                    onChange={(e) =>
                                                        setEditedReceipt((p: ReceiptDetail) => ({
                                                            ...p,
                                                            client: {
                                                                ...(p.client ?? { clientId: "", clientName: "" }),
                                                                invoiceInfo: { ...(p.client?.invoiceInfo ?? {}), taxEmail: e.target.value },
                                                            },
                                                        }))
                                                    }
                                                    className="mt-1 bg-background h-8"
                                                />
                                            ) : (
                                                <div className="mt-1 text-foreground">{editedReceipt.client?.invoiceInfo?.taxEmail ?? "-"}</div>
                                            )}
                                        </div>
                                        <div>
                                            <Label className="text-sm text-muted-foreground">{String(t("crm.clients.invoice.taxAddress"))}</Label>
                                            {isEditing ? (
                                                <Input
                                                    value={editedReceipt.client?.invoiceInfo?.taxAddress ?? ""}
                                                    onChange={(e) =>
                                                        setEditedReceipt((p: ReceiptDetail) => ({
                                                            ...p,
                                                            client: {
                                                                ...(p.client ?? { clientId: "", clientName: "" }),
                                                                invoiceInfo: { ...(p.client?.invoiceInfo ?? {}), taxAddress: e.target.value },
                                                            },
                                                        }))
                                                    }
                                                    className="mt-1 bg-background h-8"
                                                />
                                            ) : (
                                                <div className="mt-1 text-foreground">{editedReceipt.client?.invoiceInfo?.taxAddress ?? "-"}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receiptDetail.sendMail"))}</Label>
                                    <div className="mt-1">
                                        <Button size="sm" variant="outline" className="flex items-center gap-2 h-7" onClick={() => setShowEmailModal(true)}>
                                            <Mail className="h-3 w-3" />
                                            {String(t("reception.receiptDetail.sendMailTitle"))}
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("lab.receipts.receiptStatus"))}</Label>
                                    {isEditing ? (
                                        <Select
                                            value={editedReceipt.receiptStatus ?? ""}
                                            onValueChange={(val: ReceiptStatus) => setEditedReceipt((p: ReceiptDetail) => ({ ...p, receiptStatus: val }))}
                                        >
                                            <SelectTrigger className="w-full mt-1 h-8">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {RECEIPT_STATUS_OPTIONS.map((st) => (
                                                    <SelectItem key={st} value={st}>
                                                        {receiptStatusLabel(t, st)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="mt-1">{getReceiptStatusBadge(t, editedReceipt.receiptStatus)}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.priority", { defaultValue: "Cấp yêu cầu" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.receiptPriority ?? "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.receiptDate", { defaultValue: "Ngày nhận mẫu" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.receiptDate ? new Date(editedReceipt.receiptDate).toLocaleDateString() : "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.receiptDeadline", { defaultValue: "Hẹn trả lịch" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.receiptDeadline ? new Date(editedReceipt.receiptDeadline).toLocaleDateString() : "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.deliveryMethod", { defaultValue: "Hình thức giao mẫu" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.receiptDeliveryMethod ?? "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.trackingNumber", { defaultValue: "Mã vận đơn" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.trackingNumber ?? editedReceipt.receiptTrackingNo ?? "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.reportRecipient", { defaultValue: "Nơi nhận phiếu KQ" }))}</Label>
                                    <div className="mt-1 text-foreground">
                                        {editedReceipt.reportRecipient?.receiverName ? `${editedReceipt.reportRecipient.receiverName} - ${editedReceipt.reportRecipient.receiverAddress ?? ""}` : "-"}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.senderInfo", { defaultValue: "Thông tin người gửi" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.senderInfo?.name ? `${editedReceipt.senderInfo.name} - ${editedReceipt.senderInfo.phone ?? ""}` : "-"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.conditionCheck", { defaultValue: "Tình trạng mẫu khi nhận" }))}</Label>
                                    <div className="mt-1 text-foreground">
                                        {editedReceipt.conditionCheck ? `Niêm phong: ${editedReceipt.conditionCheck.seal || "-"} / Nhiệt độ: ${editedReceipt.conditionCheck.temp || "-"}` : "-"}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.reportConfig", { defaultValue: "Cấu hình trả KQ" }))}</Label>
                                    <div className="mt-1 text-foreground">
                                        {editedReceipt.reportConfig
                                            ? `Ngôn ngữ: ${editedReceipt.reportConfig.language || "VN"}, Bản cứng: ${editedReceipt.reportConfig.copies || 0}, Bản mềm: ${editedReceipt.reportConfig.sendSoftCopy ? "Có" : "Không"}`
                                            : "-"}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.isBlindCoded", { defaultValue: "Mã hóa mù" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.isBlindCoded ? "Có" : "Không"}</div>
                                </div>

                                <div>
                                    <Label className="text-sm text-muted-foreground">{String(t("reception.receipts.receptionistId", { defaultValue: "Nhân viên tiếp nhận" }))}</Label>
                                    <div className="mt-1 text-foreground">{editedReceipt.receptionistId || editedReceipt.createdBy?.identityName || "-"}</div>
                                </div>

                                <div className="mt-1 col-span-1 md:col-span-3">
                                    <Label className="text-sm text-muted-foreground">{String(t("lab.receipts.receiptNote"))}</Label>
                                    {isEditing ? (
                                        <Textarea
                                            value={editedReceipt.receiptNote ?? ""}
                                            onChange={(e) =>
                                                setEditedReceipt((p: ReceiptDetail) => ({
                                                    ...p,
                                                    receiptNote: e.target.value,
                                                }))
                                            }
                                            className="mt-1 bg-background"
                                            rows={2}
                                        />
                                    ) : (
                                        <div className="mt-1 text-foreground">{editedReceipt.receiptNote ?? "-"}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="xl:col-span-1 border-t xl:border-t-0 xl:border-l border-border pt-4 xl:pt-0 xl:pl-4 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm text-muted-foreground">{String(t("reception.receiptDetail.images", { defaultValue: "Ảnh đính kèm" }))}</h3>

                                <div className="flex items-center gap-1.5">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7"
                                        onClick={handleFindRelated}
                                        disabled={isUploading}
                                        title={String(t("common.search", { defaultValue: "Tìm ảnh LK" }))}
                                    >
                                        <Search className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7"
                                        title={String(t("common.manage", { defaultValue: "Quản lý" }))}
                                        onClick={() => {
                                            setManageImages([...loadedImages]);
                                            setManageSelectedIds([...fileIds]);
                                            setManageModalOpen(true);
                                        }}
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                    </Button>

                                    <Button
                                        size="icon"
                                        variant="default"
                                        className="h-7 w-7"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        title={String(t("reception.receiptDetail.uploadFile", { defaultValue: "Tải lên" }))}
                                    >
                                        <Upload className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="default"
                                        className="h-7 w-7"
                                        onClick={() => cameraInputRef.current?.click()}
                                        disabled={isUploading}
                                        title={String(t("reception.receiptDetail.takePhoto", { defaultValue: "Chụp ảnh" }))}
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                    </Button>
                                    <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
                                    <input type="file" multiple accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleUpload} />
                                </div>
                            </div>

                            {imageLoading || isUploading ? (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/10 min-h-[300px]">
                                    <div className="animate-pulse flex flex-col items-center">
                                        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                                        <div className="text-sm text-muted-foreground">{String(t("common.loading"))}</div>
                                    </div>
                                </div>
                            ) : loadedImages.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/10 min-h-[300px] text-muted-foreground">
                                    <ImageOff className="h-12 w-12 mb-3 opacity-20" />
                                    <p className="text-sm">{String(t("reception.receiptDetail.noImage"))}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Main Viewer */}
                                    <div className="relative flex-1 rounded-lg overflow-hidden flex items-center justify-center min-h-[300px] mb-3 group">
                                        {loadedImages.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handlePrevImg}
                                                className="absolute left-2 z-10 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronLeft className="h-6 w-6" />
                                            </Button>
                                        )}
                                        <img src={loadedImages[focusedImageIdx]?.url} alt={`img-${focusedImageIdx}`} className="max-w-full max-h-full object-contain" />
                                        {loadedImages.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={handleNextImg}
                                                className="absolute right-2 z-10 bg-black/40 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <ChevronRight className="h-6 w-6" />
                                            </Button>
                                        )}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full px-3">
                                            {focusedImageIdx + 1} / {loadedImages.length}
                                        </div>
                                    </div>

                                    {/* Thumbnail strip */}
                                    {loadedImages.length > 1 && (
                                        <div ref={thumbnailsRef} className="flex gap-1.5 overflow-x-auto pb-1 scroll-smooth" style={{ scrollbarWidth: "thin" }}>
                                            {loadedImages.map((img: LoadedImage, idx: number) => (
                                                <button
                                                    key={img.fileId}
                                                    type="button"
                                                    onClick={() => setFocusedImageIdx(idx)}
                                                    className={[
                                                        "shrink-0 w-14 h-14 rounded border-2 overflow-hidden transition-all",
                                                        idx === focusedImageIdx ? "border-primary shadow-md" : "border-border opacity-60 hover:opacity-100",
                                                    ].join(" ")}
                                                >
                                                    <img src={img.url} alt={`thumb-${idx + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {samplesTableJSX}

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-foreground">{String(t("reception.receiptDetail.digitalRecords"))}</h3>
                            <Button size="sm" variant="outline" className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                {String(t("reception.receiptDetail.uploadFile"))}
                            </Button>
                        </div>

                        <div className="bg-background border border-border rounded-lg overflow-hidden">
                            <div className="p-8 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                                <p>{String(t("reception.receiptDetail.noFile"))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {openSampleModal && selectedSample && (
                <div className="relative">
                    <SampleDetailModal sample={selectedSample} receipt={editedReceipt} focusAnalysisId={focusAnalysisId} onClose={closeSampleModal} onSave={handleSaveSample} />
                    {sampleFetching && (
                        <div className="fixed top-4 right-12 z-[100] flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full border border-primary/20 shadow-lg text-xs font-medium animate-in fade-in slide-in-from-top-2">
                            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>{String(t("common.loading", { defaultValue: "Đang tải chi tiết..." }))}</span>
                        </div>
                    )}
                </div>
            )}

            {showAddSampleModal && (
                <AddSampleModal
                    receipt={editedReceipt}
                    onClose={() => setShowAddSampleModal(false)}
                    onCreated={(updatedReceipt) => {
                        setEditedReceipt(updatedReceipt);
                        onUpdated?.(updatedReceipt);
                        setShowAddSampleModal(false);
                    }}
                />
            )}

            {showEmailModal && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]" onClick={() => setShowEmailModal(false)} />
                    <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-background rounded-xl shadow-2xl z-[80] flex flex-col max-h-[90vh] border border-border animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-5 border-b border-border">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{String(t("reception.receiptDetail.sendMailTitle", { defaultValue: "Gửi thông tin biên nhận" }))}</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">{String(t("reception.receiptDetail.sendMailDesc", { defaultValue: "Gửi email thông báo cho khách hàng về biên nhận này." }))}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowEmailModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.from", { defaultValue: "Người gửi" }))}</Label>
                                        <Input value={emailForm.from} onChange={(e) => handleEmailChange("from", e.target.value)} className="h-9 text-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.to", { defaultValue: "Người nhận" }))}</Label>
                                        <Input value={emailForm.to} onChange={(e) => handleEmailChange("to", e.target.value)} className="h-9 text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.subject", { defaultValue: "Tiêu đề" }))}</Label>
                                    <Input value={emailForm.subject} onChange={(e) => handleEmailChange("subject", e.target.value)} className="h-9 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground uppercase">{String(t("reception.receiptDetail.email.content", { defaultValue: "Nội dung" }))}</Label>
                                    <Textarea value={emailForm.content} onChange={(e) => handleEmailChange("content", e.target.value)} className="min-h-[250px] text-sm resize-none" />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/20">
                            <Button variant="ghost" onClick={() => setShowEmailModal(false)}>{String(t("common.cancel"))}</Button>
                            <Button className="gap-2" onClick={handleSendEmail}>
                                <Mail className="h-4 w-4" />
                                {String(t("common.send", { defaultValue: "Gửi Email" }))}
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {manageModalOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-[90]" onClick={() => setManageModalOpen(false)} />
                    <div className="fixed inset-y-10 inset-x-4 md:inset-x-auto md:right-10 md:w-[600px] bg-background rounded-xl shadow-2xl z-[90] flex flex-col border border-border animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Edit className="h-5 w-5 text-primary" />
                                {String(t("reception.receiptDetail.manageImages", { defaultValue: "Quản lý hình ảnh" }))}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setManageModalOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                            <div className="grid grid-cols-3 gap-3">
                                {manageImages.map((img) => (
                                    <div
                                        key={img.fileId}
                                        className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-background group cursor-pointer transition-all ${
                                            manageSelectedIds.includes(img.fileId) ? "border-primary shadow-md" : "border-border opacity-70 hover:opacity-100"
                                        }`}
                                        onClick={() => {
                                            setManageSelectedIds(prev => prev.includes(img.fileId) ? prev.filter(id => id !== img.fileId) : [...prev, img.fileId])
                                        }}
                                    >
                                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                                        <div className={`absolute top-2 right-2 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${manageSelectedIds.includes(img.fileId) ? "bg-primary border-primary shadow-sm" : "bg-black/20 border-white/50"}`}>
                                            {manageSelectedIds.includes(img.fileId) && <FileCheck className="h-3 w-3 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {manageImages.length === 0 && (
                                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <ImageOff className="h-10 w-10 mb-2" />
                                    <p className="text-sm">Không có ảnh nào</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-background flex justify-between items-center">
                            <div className="text-sm text-muted-foreground font-medium">
                                {String(t("common.selected", { defaultValue: "Đã chọn" }))}: <span className="text-primary">{manageSelectedIds.length}</span> / {manageImages.length}
                            </div>
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
                        sampleClientInfo: s.sampleClientInfo ?? null
                    })) || []}
                    receiptCode={receipt.receiptCode}
                    onClose={() => setShowPrintLabelModal(false)}
                />
            )}

            {showResultCertificateModal && (
                <ResultCertificateModal
                    open={showResultCertificateModal}
                    onOpenChange={setShowResultCertificateModal}
                    receipt={editedReceipt}
                />
            )}
        </>,
        document.body,
    );
}
