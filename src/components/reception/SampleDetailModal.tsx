import { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { X, Edit, Save, Plus, Trash2, Upload, FileText, Download, Search, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DraggableInfoTable } from "@/components/common/DraggableInfoTable";

import { libraryApi, type Matrix } from "@/api/library";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

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
            const item = x as { label?: unknown; value?: unknown };
            const label = typeof item.label === "string" ? item.label : "";
            const valueRaw = item.value;
            const value = valueRaw == null ? "" : String(valueRaw);
            return { label, value };
        })
        .filter((r) => r.label.trim().length > 0);
}

export function SampleDetailModal({ sample, receipt, onClose, onSave, focusAnalysisId = null }: SampleDetailModalProps) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editedSample, setEditedSample] = useState<ReceiptSample>(sample);

    useEffect(() => {
        setEditedSample(sample);
        setIsEditing(false);
    }, [sample]);

    const initialAnalyses = useMemo<ReceiptAnalysis[]>(() => {
        return (sample.analyses ?? []).filter((a) => a?.analysisId);
    }, [sample.analyses]);

    const [sampleAnalyses, setSampleAnalyses] = useState<ReceiptAnalysis[]>(initialAnalyses);

    useEffect(() => {
        setSampleAnalyses(initialAnalyses);
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

    const handleSave = async () => {
        const updatedSample: ReceiptSample = {
            ...editedSample,
            sampleInfo: productDetails.map((r) => ({ label: r.label, value: r.value })),
            sampleReceiptInfo: testingInfo.map((r) => ({ label: r.label, value: r.value })),
            analyses: sampleAnalyses,
        };

        await onSave(updatedSample);
        setIsEditing(false);
    };

    const handleAnalysisChange = (index: number, field: keyof ReceiptAnalysis, value: unknown) => {
        setSampleAnalyses((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
    };

    // Matrix search states
    const [matrixSearch, setMatrixSearch] = useState("");
    const debouncedSearch = useDebouncedValue(matrixSearch, 500);
    const [matrixResults, setMatrixResults] = useState<Matrix[]>([]);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [showMatrixDropdown, setShowMatrixDropdown] = useState(false);

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
                    analysisMethodLOD: matrix.LOD ?? "",
                    analysisMethodLOQ: matrix.LOQ ?? "",
                };

                return [...prev, newAnalysis];
            });
            setMatrixSearch("");
            setShowMatrixDropdown(false);
        },
        [editedSample.sampleId],
    );

    const handleDeleteAnalysis = (index: number) => {
        setSampleAnalyses((prev) => prev.filter((_, i) => i !== index));
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[80] transition-all duration-300" onClick={onClose} />

            <div className="fixed inset-4 bg-background rounded-lg shadow-2xl z-[80] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">{String(t("reception.sampleDetail.title", { code: sample.sampleId }))}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{String(t("reception.sampleDetail.description"))}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs">
                                <Edit className="h-3.5 w-3.5" />
                                {String(t("common.edit"))}
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" onClick={() => void handleSave()} className="flex items-center gap-1.5 text-xs">
                                    <Save className="h-3.5 w-3.5" />
                                    {String(t("common.save"))}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setEditedSample(sample);
                                        setProductDetails(toInfoRows(sample.sampleInfo));
                                        setTestingInfo(toInfoRows(sample.sampleReceiptInfo));
                                        setSampleAnalyses(initialAnalyses);
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

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3">{String(t("reception.sampleDetail.relatedReceipt"))}</h3>
                            <div className="space-y-2 text-sm">
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
                            </div>
                        </div>

                        <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg border border-border">
                            <h3 className="text-sm font-semibold text-foreground mb-3">{String(t("lab.samples.sampleName"))}</h3>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleName"))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.sampleClientInfo ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleClientInfo: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleClientInfo ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleTypeName"))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.sampleTypeName ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleTypeName: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleTypeName ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleStatus"))}</Label>
                                    <div className="mt-1">
                                        <Badge variant="outline">{sample.sampleStatus ?? "-"}</Badge>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.samplePreservation"))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.samplePreservation ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, samplePreservation: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm text-foreground mt-1">{sample.samplePreservation ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.physicalState", { defaultValue: "Trạng thái vật lý" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.physicalState ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, physicalState: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.physicalState ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleVolume", { defaultValue: "Lượng mẫu" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.sampleVolume ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleVolume: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleVolume ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleWeight", { defaultValue: "Khối lượng (g)" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            value={editedSample.sampleWeight ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleWeight: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleWeight ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleStorageLoc", { defaultValue: "Vị trí lưu kho" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedSample.sampleStorageLoc ?? ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleStorageLoc: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleStorageLoc ?? "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleRetentionDate", { defaultValue: "Hạn lưu mẫu" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            type="date"
                                            value={editedSample.sampleRetentionDate ? new Date(editedSample.sampleRetentionDate).toISOString().split("T")[0] : ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleRetentionDate: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleRetentionDate ? new Date(sample.sampleRetentionDate).toLocaleDateString() : "-"}</div>
                                    )}
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleDisposalDate", { defaultValue: "Ngày hủy mẫu" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            type="date"
                                            value={editedSample.sampleDisposalDate ? new Date(editedSample.sampleDisposalDate).toISOString().split("T")[0] : ""}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleDisposalDate: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{sample.sampleDisposalDate ? new Date(sample.sampleDisposalDate).toLocaleDateString() : "-"}</div>
                                    )}
                                </div>

                                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                    <Label className="text-xs text-muted-foreground">{String(t("lab.samples.sampleNote", { defaultValue: "Ghi chú mẫu" }))}</Label>
                                    {isEditing ? (
                                        <Input
                                            value={String(editedSample.sampleNote ?? "")}
                                            onChange={(e) => setEditedSample({ ...editedSample, sampleNote: e.target.value })}
                                            className="mt-1 h-8 text-sm bg-background"
                                        />
                                    ) : (
                                        <div className="text-sm font-medium text-foreground mt-1">{String(sample.sampleNote ?? "-")}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DraggableInfoTable title={String(t("reception.sampleDetail.productDetails"))} data={productDetails} isEditing={isEditing} onChange={setProductDetails} />
                        <DraggableInfoTable title={String(t("reception.sampleDetail.testingInfo"))} data={testingInfo} isEditing={isEditing} onChange={setTestingInfo} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{String(t("reception.sampleDetail.analysisList"))}</h3>
                        </div>

                        <div className="bg-background border border-border rounded-lg overflow-hidden overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisId", { defaultValue: "Mã phép thử" }))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.parameterName"))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.protocolCode"))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisStatus", { defaultValue: "Trạng thái" }))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.technicianIds", { defaultValue: "KTV phân tích" }))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisDeadline", { defaultValue: "Hạn trả KQ" }))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisUnit"))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{String(t("lab.analyses.analysisResult"))}</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground w-10"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border">
                                    {sampleAnalyses.map((analysis, index) => {
                                        const isFocused = Boolean(focusAnalysisId && analysis.analysisId === focusAnalysisId);

                                        return (
                                            <tr
                                                key={analysis.analysisId}
                                                id={`analysis-row-${analysis.analysisId}`}
                                                className={["hover:bg-muted/30", isFocused ? "bg-primary/10 ring-1 ring-primary/30" : ""].join(" ")}
                                            >
                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.analysisId ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "analysisId", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-primary font-medium">{analysis.analysisId ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.parameterName ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "parameterName", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-foreground">{analysis.parameterName ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.protocolCode ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "protocolCode", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">{analysis.protocolCode ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2">
                                                    {isEditing ? (
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
                                                    {isEditing ? (
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
                                                    {isEditing ? (
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

                                                <td className="px-3 py-2">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.analysisUnit ?? ""}
                                                            onChange={(e) => handleAnalysisChange(index, "analysisUnit", e.target.value)}
                                                            className="h-7 text-xs bg-background"
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground">{analysis.analysisUnit ?? "-"}</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2 text-foreground">{analysis.analysisResult == null ? "-" : String(analysis.analysisResult)}</td>

                                                <td className="px-3 py-2 text-center">
                                                    {isEditing && (
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

                            {isEditing && (
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
                            {isEditing && (
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
                                                        {isEditing && (
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
                </div>
            </div>
        </>,
        document.body,
    );
}
