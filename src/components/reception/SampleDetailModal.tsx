import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { X, Edit, Save, Plus, Trash2, Upload, FileText, Download, Search, Loader2, ExternalLink, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { DraggableInfoTable } from "@/components/common/DraggableInfoTable";

import { libraryApi, type Matrix } from "@/api/library";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";
import { fileApi } from "@/api/files";
import { samplesUpdate } from "@/api/samples";
import api from "@/api/client";
import { toast } from "sonner";

import { useIdentityGroupsList } from "@/api/identityGroups";
import { useAnalysesUpdateBulk, useDeleteAnalysis } from "@/api/analyses";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Check, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

import type { ReceiptDetail, ReceiptSample, ReceiptAnalysis } from "@/types/receipt";

type InfoRow = { label: string; value: string };

interface SampleDetailModalProps {
    sample: ReceiptSample;
    receipt: ReceiptDetail;
    onClose: () => void;
    onSave: (updatedSample: ReceiptSample) => void | Promise<unknown>;

    focusAnalysisId?: string | null;
}

function toInfoRows(v: unknown): InfoRow[] {
    if (!Array.isArray(v)) return [];
    return v
        .map((x) => {
            const item = x as { label?: unknown; value?: unknown; fname?: unknown; fvalue?: unknown };
            const labelRaw = item.label ?? item.fname;
            const valueRaw = item.value ?? item.fvalue;
            const label = typeof labelRaw === "string" ? labelRaw : "";
            const value = valueRaw == null ? "" : String(valueRaw);
            return { label, value };
        })
        .filter((r) => r.label.trim().length > 0);
}

export function SampleDetailModal({ sample, receipt, onClose, onSave, focusAnalysisId = null }: SampleDetailModalProps) {
    const { t } = useTranslation();
    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [isEditingAnalyses, setIsEditingAnalyses] = useState(false);
    const [editedSample, setEditedSample] = useState<ReceiptSample>(sample);

    const { data: groupsData } = useIdentityGroupsList(
        { query: { identityGroupMainRole: ["ROLE_TECHNICIAN"], option: "full", itemsPerPage: 100 } },
        { enabled: true }
    );
    const groups = (groupsData?.data ?? []) as any[];

    useEffect(() => {
        setEditedSample(sample);
        setIsEditingInfo(false);
        setIsEditingAnalyses(false);
    }, [sample]);

    const initialAnalyses = useMemo<ReceiptAnalysis[]>(() => {
        return (sample.analyses ?? []).filter((a) => a?.analysisId);
    }, [sample.analyses]);

    const [sampleAnalyses, setSampleAnalyses] = useState<ReceiptAnalysis[]>(initialAnalyses);
    const [dirtyAnalysisIds, setDirtyAnalysisIds] = useState<Set<string>>(new Set());
    const [deletedAnalysisIds, setDeletedAnalysisIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        setSampleAnalyses(initialAnalyses);
        setDirtyAnalysisIds(new Set());
        setDeletedAnalysisIds(new Set());
    }, [initialAnalyses]);

    const [attachedFiles] = useState<
        Array<{
            fileId: string;
            fileName: string;
            mimeType?: string | null;
            fileSize?: string | number | null;
            createdById?: string | null;
            createdAt?: string | null;
        }>
    >([]);

    const [productDetails, setProductDetails] = useState<InfoRow[]>(toInfoRows(editedSample.sampleInfo));
    const [testingInfo, setTestingInfo] = useState<InfoRow[]>(toInfoRows(editedSample.sampleReceiptInfo));

    useEffect(() => {
        setProductDetails(toInfoRows(sample.sampleInfo));
        setTestingInfo(toInfoRows(sample.sampleReceiptInfo));
    }, [sample.sampleInfo, sample.sampleReceiptInfo]);

    useEffect(() => {
        if (!focusAnalysisId) return;
        const el = document.getElementById(`analysis-row-${focusAnalysisId}`);
        el?.scrollIntoView({ block: "center" });
    }, [focusAnalysisId]);

    const [isSavingInfo, setIsSavingInfo] = useState(false);
    const handleSaveInfo = useCallback(async () => {
        setIsSavingInfo(true);
        try {
            await samplesUpdate({
                sampleId: editedSample.sampleId,
                sampleName: editedSample.sampleName,
                sampleStatus: editedSample.sampleStatus,
                sampleClientInfo: editedSample.sampleClientInfo,
                sampleVolume: editedSample.sampleVolume,
                sampleWeight: editedSample.sampleWeight,
                sampleStorageLoc: editedSample.sampleStorageLoc,
                samplePreservation: editedSample.samplePreservation,
                sampleNote: editedSample.sampleNote,
                sampleTypeName: editedSample.sampleTypeName,
                sampleInfo: productDetails.map((r) => ({ label: r.label, value: r.value })),
                sampleReceiptInfo: testingInfo.map((r) => ({ label: r.label, value: r.value })),
            } as any);
            toast.success("Lưu thông tin mẫu thành công");
            setIsEditingInfo(false);
            // Update local editedSample with saved sampleInfo
            setEditedSample(prev => ({
                ...prev,
                sampleInfo: productDetails.map((r) => ({ label: r.label, value: r.value })),
                sampleReceiptInfo: testingInfo.map((r) => ({ label: r.label, value: r.value })),
            }));
        } catch (e: any) {
            toast.error(e?.message || "Không thể lưu thông tin mẫu");
        } finally {
            setIsSavingInfo(false);
        }
    }, [editedSample, productDetails, testingInfo]);

    const handleAnalysisChange = (index: number, field: keyof ReceiptAnalysis, value: unknown) => {
        setSampleAnalyses((prev) => {
            const updated = prev.map((a, i) => (i === index ? { ...a, [field]: value } : a));
            // Mark as dirty
            const analysisId = prev[index]?.analysisId;
            if (analysisId) setDirtyAnalysisIds(d => new Set([...d, analysisId]));
            return updated;
        });
    };

    // Matrix search states
    const [matrixSearch, setMatrixSearch] = useState("");
    const debouncedSearch = useDebouncedValue(matrixSearch, 500);
    const [matrixResults, setMatrixResults] = useState<Matrix[]>([]);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [showMatrixDropdown, setShowMatrixDropdown] = useState(false);

    // Bulk states
    const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
    const [showBulkPanel, setShowBulkPanel] = useState(false);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null); // track open KTV popover per row
    const [bulkProtocolCode, setBulkProtocolCode] = useState("");
    const [bulkUnit, setBulkUnit] = useState("");
    const [bulkDeadline, setBulkDeadline] = useState("");
    const [bulkLocation, setBulkLocation] = useState("");
    const [bulkGroupId, setBulkGroupId] = useState("");
    const [bulkGroupName, setBulkGroupName] = useState("");
    const [bulkTechnicianId, setBulkTechnicianId] = useState("");
    const [bulkTechnician, setBulkTechnician] = useState<any>(null);
    const [bulkTechnicianIds, setBulkTechnicianIds] = useState<string[]>([]);

    const handleBulkConfirm = () => {
        if (selectedAnalyses.length === 0) return;
        const idsToUpdate = [...selectedAnalyses];
        setSampleAnalyses((prev) =>
            prev.map((a) => {
                if (!idsToUpdate.includes(a.analysisId!)) return a;
                return {
                    ...a,
                    protocolCode: bulkProtocolCode || a.protocolCode,
                    analysisUnit: bulkUnit || a.analysisUnit,
                    analysisDeadline: bulkDeadline || a.analysisDeadline,
                    analysisLocation: bulkLocation || a.analysisLocation,
                    technicianGroupId: bulkGroupId || (a as any).technicianGroupId,
                    technicianGroupName: bulkGroupName || (a as any).technicianGroupName,
                    technicianId: bulkTechnicianId || a.technicianId,
                    technician: bulkTechnician || a.technician,
                    technicianIds: bulkTechnicianIds.length > 0 ? bulkTechnicianIds : a.technicianIds,
                };
            }),
        );
        // Mark all selected as dirty
        setDirtyAnalysisIds(prev => new Set([...prev, ...idsToUpdate]));
        setSelectedAnalyses([]);
        setBulkProtocolCode("");
        setBulkUnit("");
        setBulkDeadline("");
        setBulkGroupId("");
        setBulkGroupName("");
        setBulkTechnicianId("");
        setBulkTechnician(null);
        setBulkTechnicianIds([]);
        setBulkLocation("");
        toast.success(`Đã áp dụng tạm thời cho ${idsToUpdate.length} chỉ tiêu. Nhấn "Cập nhật chỉ tiêu" để lưu.`);
    };

    const { mutateAsync: mutateBulk, isPending: isBulkSaving } = useAnalysesUpdateBulk();
    const { mutateAsync: mutateDelete } = useDeleteAnalysis();
    const pendingChangeCount = dirtyAnalysisIds.size + deletedAnalysisIds.size;

    const handleSaveAnalysesBulk = useCallback(async () => {
        if (pendingChangeCount === 0) return;
        const dirtyList = sampleAnalyses.filter(a => a.analysisId && dirtyAnalysisIds.has(a.analysisId));
        const updateBody = dirtyList.map(a => ({
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
            await Promise.all([
                updateBody.length > 0
                    ? mutateBulk({ body: updateBody as any })
                    : Promise.resolve(),
                ...[...deletedAnalysisIds]
                    .filter(id => !id.startsWith('new-')) // skip locally-added (never persisted)
                    .map(id => mutateDelete({ body: { analysisId: id } })),
            ]);
            const parts: string[] = [];
            if (updateBody.length > 0) parts.push(`cập nhật ${updateBody.length} chỉ tiêu`);
            if (deletedAnalysisIds.size > 0) parts.push(`xóa ${deletedAnalysisIds.size} chỉ tiêu`);
            toast.success(`Đã ${parts.join(' và ')}`);
            setDirtyAnalysisIds(new Set());
            setDeletedAnalysisIds(new Set());
            setIsEditingAnalyses(false);
            setSelectedAnalyses([]);
        } catch {
            // error handled by hooks
        }
    }, [pendingChangeCount, dirtyAnalysisIds, deletedAnalysisIds, sampleAnalyses, mutateBulk, mutateDelete]);

    useEffect(() => {
        if (!debouncedSearch) {
            setMatrixResults([]);
            setMatrixLoading(false);
            return;
        }

        let cancelled = false;
        async function fetchMatrices() {
            try {
                setMatrixLoading(true);
                const res = await libraryApi.matrices.list({
                    query: { search: debouncedSearch },
                });
                if (!cancelled) {
                    setMatrixResults((res.data as any) ?? res);
                }
            } catch (err) {
                // ignore
            } finally {
                if (!cancelled) setMatrixLoading(false);
            }
        }
        void fetchMatrices();

        return () => {
            cancelled = true;
        };
    }, [debouncedSearch]);

    const addMatrixToAnalyses = useCallback(
        (matrix: Matrix) => {
            setSampleAnalyses((prev) => {
                const exists = prev.some((a) => a.matrixId === matrix.matrixId);
                if (exists) return prev;

                const newAnalysis: ReceiptAnalysis = {
                    analysisId: `new-${Date.now()}`,
                    sampleId: editedSample.sampleId,
                    analysisStatus: "Pending",
                    matrixId: matrix.matrixId,
                    parameterId: matrix.parameterId,
                    parameterName: matrix.parameterName ?? "",
                    protocolCode: matrix.protocolCode ?? "",
                    analysisUnit: "",
                    analysisResult: null,
                    createdAt: new Date().toISOString(),
                    methodLOD: matrix.methodLOD ?? "",
                    methodLOQ: matrix.methodLOQ ?? "",
                };

                return [...prev, newAnalysis];
            });
            setMatrixSearch("");
            setShowMatrixDropdown(false);
        },
        [editedSample.sampleId],
    );

    const handlePreviewDocument = async (documentId: string) => {
        try {
            const res = await api.get<any>(`/v2/documents/get/url`, { query: { id: documentId } });
            if (res.success && res.data?.url) {
                window.open(res.data.url, "_blank");
            } else {
                toast.error("Không tìm thấy URL tài liệu");
            }
        } catch (err) {
            console.error("Preview document failed", err);
            toast.error("Không thể xem tài liệu");
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

    const handleDeleteAnalysis = (index: number) => {
        setSampleAnalyses((prev) => {
            const analysis = prev[index];
            if (analysis?.analysisId) {
                // Track for deletion on save (skip temp-only IDs that were never persisted)
                setDeletedAnalysisIds(d => new Set([...d, analysis.analysisId!]));
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1100] transition-all duration-300" onClick={onClose} />

            <div className="fixed inset-4 bg-background rounded-lg shadow-2xl z-[1101] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{String(t("reception.sampleDetail.title", { code: sample.sampleId }))}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{String(t("reception.sampleDetail.description"))}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Info edit buttons */}
                        {!isEditingInfo ? (
                            <Button size="sm" variant="outline" onClick={() => { setIsEditingInfo(true); setIsEditingAnalyses(false); }} className="flex items-center gap-1.5 text-xs">
                                <Edit className="h-3.5 w-3.5" />
                                Sửa thông tin
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" onClick={() => void handleSaveInfo()} disabled={isSavingInfo} className="flex items-center gap-1.5 text-xs">
                                    {isSavingInfo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    Lưu thông tin
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditedSample(sample); setProductDetails(toInfoRows(sample.sampleInfo)); setTestingInfo(toInfoRows(sample.sampleReceiptInfo)); setIsEditingInfo(false); }} className="text-xs text-muted-foreground">
                                    Huỷ
                                </Button>
                            </>
                        )}

                        {/* Analysis edit buttons */}
                        {!isEditingAnalyses ? (
                            <Button size="sm" variant="outline" onClick={() => { setIsEditingAnalyses(true); setIsEditingInfo(false); }} className="flex items-center gap-1.5 text-xs">
                                <Edit className="h-3.5 w-3.5" />
                                Sửa chỉ tiêu
                            </Button>
                        ) : (
                            <>
                                {pendingChangeCount > 0 && (
                                    <Button size="sm" onClick={() => void handleSaveAnalysesBulk()} disabled={isBulkSaving} className="flex items-center gap-1.5 text-xs">
                                        {isBulkSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                        Cập nhật chỉ tiêu ({pendingChangeCount})
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => { setSampleAnalyses(initialAnalyses); setDirtyAnalysisIds(new Set()); setDeletedAnalysisIds(new Set()); setIsEditingAnalyses(false); setSelectedAnalyses([]); }} className="text-xs text-muted-foreground">
                                    Huỷ
                                </Button>
                            </>
                        )}

                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3">{String(t("reception.sampleDetail.relatedReceipt"))}</h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">{String(t("lab.receipts.receiptCode"))}:</span>
                                    <div className="font-medium text-foreground">{receipt.receiptCode ?? "-"}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{String(t("crm.clients.clientName"))}:</span>
                                    <div className="text-foreground">{receipt.client?.clientName ?? "-"}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">{String(t("lab.receipts.receiptDate"))}:</span>
                                    <div className="text-foreground">{receipt.receiptDate?.split("T")[0] ?? "-"}</div>
                                </div>
                                {receipt.receiptNote && (
                                    <div>
                                        <span className="text-muted-foreground">Ghi chú phiếu:</span>
                                        <div className="text-xs text-foreground mt-0.5 p-2 bg-background rounded border border-border/50 italic whitespace-pre-wrap">{receipt.receiptNote}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3">{String(t("lab.samples.sampleHeader", { defaultValue: "Thông tin chung" }))}</h3>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-6">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleTypeName"))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={editedSample.sampleTypeName ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleTypeName: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.sampleTypeName ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleStatus"))}</Label>
                                    <div className="mt-1">
                                        <Badge variant="secondary" className="text-[10px] uppercase">{editedSample.sampleStatus ?? "-"}</Badge>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleVolume"))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={editedSample.sampleVolume ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleVolume: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.sampleVolume ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleWeight", { defaultValue: "Khối lượng" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={editedSample.sampleWeight ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleWeight: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.sampleWeight ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleStorageLoc", { defaultValue: "Vị trí lưu kho" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={editedSample.sampleStorageLoc ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleStorageLoc: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.sampleStorageLoc ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.samplePreservation", { defaultValue: "Bảo quản" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={editedSample.samplePreservation ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, samplePreservation: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.samplePreservation ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.physicalState", { defaultValue: "Trạng thái vật lý" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={editedSample.physicalState ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, physicalState: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.physicalState ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.samplePriority", { defaultValue: "Độ ưu tiên" }))}</Label>
                                    {isEditingInfo ? (
                                        <select
                                            className="mt-1 h-8 text-sm bg-background border border-input rounded w-full px-2"
                                            value={editedSample.samplePriority ?? 2}
                                            onChange={(e) => setEditedSample({ ...editedSample, samplePriority: Number(e.target.value) })}
                                        >
                                            <option value={1}>Thấp</option>
                                            <option value={2}>Trung bình</option>
                                            <option value={3}>Cao</option>
                                        </select>
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">
                                            {editedSample.samplePriority === 1 ? "Thấp" : editedSample.samplePriority === 3 ? "Cao" : "Trung bình"}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleRetentionDate", { defaultValue: "Hạn lưu mẫu" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            type="date"
                                            value={editedSample.sampleRetentionDate ? editedSample.sampleRetentionDate.split("T")[0] : ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleRetentionDate: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.sampleRetentionDate?.split("T")[0] ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleDisposalDate", { defaultValue: "Ngày hủy mẫu" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            type="date"
                                            value={editedSample.sampleDisposalDate ? editedSample.sampleDisposalDate.split("T")[0] : ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleDisposalDate: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{editedSample.sampleDisposalDate?.split("T")[0] ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleIsReference", { defaultValue: "Mẫu chuẩn/lưu" }))}</Label>
                                    <div className="mt-1 flex items-center gap-2 h-8">
                                        {isEditingInfo ? (
                                            <input
                                                type="checkbox"
                                                checked={!!editedSample.sampleIsReference}
                                                onChange={(e) => setEditedSample({ ...editedSample, sampleIsReference: e.target.checked })}
                                                className="h-4 w-4 rounded border-border"
                                            />
                                        ) : (
                                            <Badge variant={editedSample.sampleIsReference ? "success" : "outline"} className="text-[10px]">
                                                {editedSample.sampleIsReference ? "Mẫu chuẩn" : "Mẫu thường"}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="lg:col-span-2">
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleMarks", { defaultValue: "Dấu hiệu mẫu" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={(editedSample.sampleMarks ?? []).join(", ")}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleMarks: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                                            placeholder="Phân cách bởi dấu phẩy"
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(!editedSample.sampleMarks || editedSample.sampleMarks.length === 0) ? "-" : editedSample.sampleMarks.map((m, i) => (
                                                <Badge key={i} variant="secondary" className="text-[9px] bg-blue-50 text-blue-700 border-blue-100">{m}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-4">
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleNote", { defaultValue: "Ghi chú" }))}</Label>
                                    {isEditingInfo ? (
                                        <Input
                                            value={editedSample.sampleNote ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleNote: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm text-foreground mt-1 italic p-2 bg-background/50 rounded border border-border/40 whitespace-pre-wrap">
                                            {editedSample.sampleNote || "-"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DraggableInfoTable title={String(t("reception.sampleDetail.productDetails"))} data={productDetails} isEditing={isEditingInfo} onChange={setProductDetails} />
                        <DraggableInfoTable title={String(t("reception.sampleDetail.testingInfo"))} data={testingInfo} isEditing={isEditingInfo} onChange={setTestingInfo} />
                    </div>

                    <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
                        {/* Analyses section header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-[10px] font-semibold text-primary uppercase tracking-wider">
                                <span>{String(t("reception.sampleDetail.analysisList"))}</span>
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{sampleAnalyses.length}</Badge>
                                {isEditingAnalyses && selectedAnalyses.length > 0 && (
                                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-primary/40">{selectedAnalyses.length} đã chọn</Badge>
                                )}
                            </div>
                            {isEditingAnalyses && (
                                <div className="flex items-center gap-1.5">
                                    {selectedAnalyses.length > 0 && !showBulkPanel && (
                                        <Button variant="outline" size="sm" onClick={() => setShowBulkPanel(true)} className="h-7 text-xs gap-1.5 border-primary/40 text-primary">
                                            <Layers className="h-3 w-3" />Sửa hàng loạt ({selectedAnalyses.length})
                                        </Button>
                                    )}
                                    {pendingChangeCount > 0 && (
                                        <Button size="sm" onClick={() => void handleSaveAnalysesBulk()} disabled={isBulkSaving} className="h-7 text-xs gap-1.5">
                                            {isBulkSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                            Cập nhật chỉ tiêu ({pendingChangeCount})
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bulk edit panel */}
                        {isEditingAnalyses && showBulkPanel && (
                            <div className="border-b border-border bg-primary/5 p-4 space-y-3 animate-in slide-in-from-top-1 duration-150">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                        <Layers className="h-4 w-4" />Sửa hàng loạt
                                        <Badge variant="secondary" className="text-[10px]">{selectedAnalyses.length} chỉ tiêu</Badge>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowBulkPanel(false)}><X className="h-3.5 w-3.5" /></Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Phương pháp</label><Input className="h-8 text-xs" placeholder="Để trống = giữ nguyên" value={bulkProtocolCode} onChange={e => setBulkProtocolCode(e.target.value)} /></div>
                                    <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Đơn vị</label><Input className="h-8 text-xs" placeholder="Để trống = giữ nguyên" value={bulkUnit} onChange={e => setBulkUnit(e.target.value)} /></div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-muted-foreground uppercase font-semibold">Nhóm KTV</label>
                                        <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 text-xs w-full justify-between font-normal"><span className="truncate">{bulkGroupName || "Để trống = giữ nguyên"}</span><ChevronsUpDown className="h-3 w-3 opacity-50 shrink-0 ml-1" /></Button></PopoverTrigger>
                                            <PopoverContent className="w-[260px] p-0 z-[1300]" align="start">
                                                <Command><CommandInput placeholder="Tìm nhóm..." className="h-8" /><CommandList><CommandEmpty>Không tìm thấy</CommandEmpty><CommandGroup>
                                                    {groups.map((g: any) => (
                                                        <CommandItem key={g.identityGroupId} value={g.identityGroupName} onSelect={() => { setBulkGroupId(g.identityGroupId); setBulkGroupName(g.identityGroupName); setBulkTechnicianId(g.identityGroupInChargeId); setBulkTechnician(g.identityGroupInCharge); setBulkTechnicianIds(g.identityIds); }}>
                                                            <Check className={cn("mr-2 h-3 w-3", bulkGroupId === g.identityGroupId ? "opacity-100" : "opacity-0")} />{g.identityGroupName}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup></CommandList></Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Hạn trả</label><Input type="date" className="h-8 text-xs" value={bulkDeadline} onChange={e => setBulkDeadline(e.target.value)} /></div>
                                    <div className="space-y-1"><label className="text-[10px] text-muted-foreground uppercase font-semibold">Nơi thực hiện</label><Input className="h-8 text-xs" placeholder="Để trống = giữ nguyên" value={bulkLocation} onChange={e => setBulkLocation(e.target.value)} /></div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setShowBulkPanel(false)}>Huỷ</Button>
                                    <Button size="sm" onClick={() => { handleBulkConfirm(); setShowBulkPanel(false); }} disabled={selectedAnalyses.length === 0}>Áp dụng tạm thời</Button>
                                </div>
                            </div>
                        )}

                        <div className="bg-background border border-border rounded-lg overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        {isEditingAnalyses && (
                                            <th className="px-3 py-2 text-center w-10">
                                                <button
                                                    onClick={() => {
                                                        if (selectedAnalyses.length === sampleAnalyses.length) {
                                                            setSelectedAnalyses([]);
                                                        } else {
                                                            setSelectedAnalyses(sampleAnalyses.map((a) => a.analysisId!));
                                                        }
                                                    }}
                                                    className="flex items-center justify-center text-muted-foreground hover:text-foreground mx-auto"
                                                >
                                                    {selectedAnalyses.length === sampleAnalyses.length && sampleAnalyses.length > 0 ? (
                                                        <CheckSquare className="h-4 w-4 text-primary" />
                                                    ) : (
                                                        <Square className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </th>
                                        )}
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisId", { defaultValue: "Mã phép thử" }))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.parameterName"))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Nền mẫu</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.protocolCode"))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Nơi thực hiện</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisStatus", { defaultValue: "Trạng thái" }))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Người phụ trách</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Nhóm KTV</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisDeadline", { defaultValue: "Hạn trả KQ" }))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisResult"))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisUnit"))}</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground">TLTN</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground w-10">
                                            {isEditingAnalyses ? "Xóa" : ""}
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border">
                                    {sampleAnalyses.map((analysis, index) => {
                                        const isFocused = Boolean(focusAnalysisId && analysis.analysisId === focusAnalysisId);

                                        return (
                                            <tr
                                                key={analysis.analysisId}
                                                id={`analysis-row-${analysis.analysisId}`}
                                                className={cn(
                                                    "hover:bg-muted/30 transition-colors",
                                                    isFocused && "bg-muted/50",
                                                    selectedAnalyses.includes(analysis.analysisId!) && "bg-primary/10"
                                                )}
                                            >
                                                {isEditingAnalyses && (
                                                    <td className="px-3 py-2 text-center">
                                                        <Checkbox
                                                            checked={selectedAnalyses.includes(analysis.analysisId!)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedAnalyses([...selectedAnalyses, analysis.analysisId!]);
                                                                } else {
                                                                    setSelectedAnalyses(selectedAnalyses.filter((id) => id !== analysis.analysisId));
                                                                }
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Input
                                                            value={analysis.analysisId ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "analysisId", e.target.value)}
                                                            className="h-7 text-xs bg-background font-mono"
                                                        />
                                                    ) : (
                                                        <span className="text-primary font-medium font-mono">{analysis.analysisId ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Input
                                                            value={analysis.parameterName ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "parameterName", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-foreground">{analysis.parameterName ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-xs text-foreground">
                                                    {(analysis.sampleTypeName as any) ?? "-"}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Input
                                                            value={analysis.protocolCode ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "protocolCode", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-foreground">{analysis.protocolCode ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Input
                                                            value={analysis.analysisLocation ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "analysisLocation", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-foreground">{analysis.analysisLocation ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <select
                                                            className="h-7 text-xs bg-background border border-input rounded px-2 w-full"
                                                            value={analysis.analysisStatus ?? "Pending"}
                                                            onChange={(e) => handleAnalysisChange(index, "analysisStatus", e.target.value)}
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Testing">Testing</option>
                                                            <option value="DataEntered">DataEntered</option>
                                                            <option value="Approved">Approved</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                                                            {analysis.analysisStatus ?? "-"}
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Input
                                                            value={analysis.technician?.identityName ?? analysis.technicianId ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "technicianId", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-foreground">{analysis.technician?.identityName ?? analysis.technicianId ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Popover open={openPopoverId === analysis.analysisId} onOpenChange={(open) => setOpenPopoverId(open ? analysis.analysisId! : null)}>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 max-w-[150px] justify-between font-normal" onClick={e => { e.stopPropagation(); setOpenPopoverId(openPopoverId === analysis.analysisId ? null : analysis.analysisId!); }}>
                                                                    <span className="truncate">{(analysis as any).technicianGroupName ?? "Chọn nhóm..."}</span>
                                                                    <ChevronsUpDown className="h-3 w-3 shrink-0 ml-1 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[240px] p-0 z-[1200]" align="start">
                                                                <Command><CommandInput placeholder="Tìm nhóm..." className="h-8" /><CommandList><CommandEmpty>Không tìm thấy</CommandEmpty><CommandGroup>
                                                                    {groups.map((g: any) => (
                                                                        <CommandItem key={g.identityGroupId} value={g.identityGroupName} onSelect={() => {
                                                                            // Route through handleAnalysisChange so dirty tracking works
                                                                            handleAnalysisChange(index, "technicianGroupId" as any, g.identityGroupId);
                                                                            setSampleAnalyses(prev => prev.map((a, i) => i !== index ? a : {
                                                                                ...a,
                                                                                technicianGroupId: g.identityGroupId,
                                                                                technicianGroupName: g.identityGroupName,
                                                                                technicianId: g.identityGroupInChargeId,
                                                                                technician: g.identityGroupInCharge,
                                                                                technicianIds: g.identityIds,
                                                                            }));
                                                                            setDirtyAnalysisIds(d => new Set([...d, analysis.analysisId!]));
                                                                            setOpenPopoverId(null); // close after select
                                                                        }}>
                                                                            <Check className={cn("mr-2 h-3 w-3", (analysis as any).technicianGroupId === g.identityGroupId ? "opacity-100" : "opacity-0")} />{g.identityGroupName}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup></CommandList></Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">{(analysis as any).technicianGroupName ?? "—"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Input
                                                            type="date"
                                                            value={analysis.analysisDeadline ? new Date(analysis.analysisDeadline).toISOString().split("T")[0] : ""}
                                                            onChange={(e) => handleAnalysisChange(index, "analysisDeadline", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-foreground">{analysis.analysisDeadline ? new Date(analysis.analysisDeadline).toLocaleDateString() : "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-foreground" dangerouslySetInnerHTML={{ __html: analysis.analysisResult == null ? "-" : String(analysis.analysisResult) }} />

                                                <td className="px-3 py-2">
                                                    {isEditingAnalyses ? (
                                                        <Input
                                                            value={analysis.analysisUnit ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "analysisUnit", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-foreground">{analysis.analysisUnit ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-center">
                                                    {analysis.analysisDocumentId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-primary"
                                                            onClick={() => handlePreviewDocument(analysis.analysisDocumentId!)}
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-center">
                                                    {isEditingAnalyses && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => handleDeleteAnalysis(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>


                            {isEditingInfo && (
                                <div className="p-4 border-t border-border bg-muted/30">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input
                                            value={matrixSearch}
                                            onChange={(e) => {
                                                setMatrixSearch(e.target.value);
                                                setShowMatrixDropdown(true);
                                            }}
                                            onFocus={() => setShowMatrixDropdown(true)}
                                            placeholder={String(t("reception.addSample.searchMatrix", { defaultValue: "Tìm thêm chỉ tiêu (tên, phương pháp, mã matrix)..." }))}
                                            className="pl-9 text-sm h-8"
                                        />

                                        {showMatrixDropdown && (matrixLoading || matrixResults.length > 0) && (
                                            <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl z-20 max-h-56 overflow-y-auto">
                                                {matrixLoading ? (
                                                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        {String(t("common.loading", { defaultValue: "Đang tải..." }))}
                                                    </div>
                                                ) : (
                                                    matrixResults.map((m) => {
                                                        const alreadyAdded = sampleAnalyses.some((a) => a.matrixId === m.matrixId);
                                                        return (
                                                            <button
                                                                key={m.matrixId}
                                                                type="button"
                                                                className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${alreadyAdded ? "bg-primary/5 text-muted-foreground cursor-not-allowed" : "hover:bg-accent/50 text-foreground"}`}
                                                                onClick={() => !alreadyAdded && addMatrixToAnalyses(m)}
                                                                disabled={alreadyAdded}
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-medium truncate">{m.parameterName ?? m.parameterId}</div>
                                                                    <div className="text-xs opacity-80">
                                                                        {m.protocolCode ?? ""} · {m.sampleTypeName ?? ""} · <span className="font-mono opacity-70">{m.matrixId}</span>
                                                                    </div>
                                                                </div>
                                                                {alreadyAdded ? (
                                                                    <Badge variant="secondary" className="text-[10px] ml-2">
                                                                        Đã thêm
                                                                    </Badge>
                                                                ) : (
                                                                    <Plus className="h-3.5 w-3.5 text-primary ml-2 shrink-0" />
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{String(t("reception.sampleDetail.attachedFiles"))}</h3>
                            {isEditingInfo && (
                                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    {String(t("common.upload"))}
                                </Button>
                            )}
                        </div>

                        <div className="bg-background border border-border rounded-lg overflow-hidden overflow-x-auto">
                            {attachedFiles.length > 0 ? (
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.fileName"))}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.type"))}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.size"))}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.uploadedBy"))}</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.uploadedAt"))}</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{String(t("common.actions"))}</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-border">
                                        {attachedFiles.map((file) => (
                                            <tr key={file.fileId} className="hover:bg-muted/30">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-foreground">{file.fileName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className="text-xs">
                                                        {file.mimeType ?? "-"}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-foreground">{file.fileSize ?? "-"}</td>
                                                <td className="px-4 py-3 text-sm text-foreground">{file.createdById ?? "-"}</td>
                                                <td className="px-4 py-3 text-sm text-foreground">{file.createdAt ?? "-"}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        {isEditingInfo && (
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                                    <p>{String(t("reception.receiptDetail.noFile"))}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm text-foreground">Danh mục tài liệu Snapshot</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {(!editedSample.documents || editedSample.documents.length === 0) ? (
                                <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg bg-muted/5">
                                    <FileText className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-xs italic">Không có tài liệu snapshot cho mẫu này</p>
                                </div>
                            ) : (
                                editedSample.documents.map((doc: any, idx: number) => (
                                    <div key={doc.documentId || idx} className="group flex flex-col p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all">
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
        </>,
        document.body,
    );
}
