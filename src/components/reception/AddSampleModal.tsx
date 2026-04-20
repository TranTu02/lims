// src/components/reception/AddSampleModal.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Search, Copy, FlaskConical, Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { libraryApi, type Matrix } from "@/api/library";
import { samplesCreateFull, samplesGetFull } from "@/api/samples";
import { receiptsGetFull } from "@/api/receipts";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import type { ReceiptDetail, ReceiptSample } from "@/types/receipt";

/* ── Types ──────────────────────────────────────────────────────────────── */

type SampleInfoRow = { label: string; value: string };

type AnalysisEntry = {
    matrixId: string;
    parameterId: string;
    parameterName: string;
    protocolCode: string;
    sampleTypeName: string;
    analysisUnit?: string;
    methodLOD?: string;
    methodLOQ?: string;
    [key: string]: any;
};

type FormState = {
    sampleName: string;
    productType: string;
    sampleTypeName: string;
    sampleVolume: string;
    sampleWeight: string;
    samplePreservation: string;
    sampleStorageLoc: string;
    physicalState: string;
    sampleNote: string;
    sampleInfo: SampleInfoRow[];
    sampleReceiptInfo: SampleInfoRow[];
    analyses: AnalysisEntry[];
};

function emptyForm(): FormState {
    return {
        sampleName: "",
        productType: "",
        sampleTypeName: "",
        sampleVolume: "",
        sampleWeight: "",
        samplePreservation: "",
        sampleStorageLoc: "",
        physicalState: "",
        sampleNote: "",
        sampleInfo: [
            { label: "Tên mẫu thử", value: "" },
            { label: "Loại nền mẫu", value: "" },
            { label: "Số lô", value: "" },
            { label: "Nơi sản xuất", value: "" },
            { label: "Ngày sản xuất", value: "" },
            { label: "Hạn sử dụng", value: "" },
            { label: "Trạng thái ngoại quan", value: "" },
        ],
        sampleReceiptInfo: [
            { label: "Ngày tiếp nhận", value: "" },
            { label: "Mẫu lưu", value: "" },
            { label: "Thời gian thực hiện", value: "" },
            { label: "Mô tả", value: "" },
            { label: "Điều kiện mẫu", value: "" },
        ],
        analyses: [],
    };
}

type Props = {
    receipt: ReceiptDetail;
    onClose: () => void;
    onCreated: (updatedReceipt: ReceiptDetail) => void;
};

/* ── Component ──────────────────────────────────────────────────────────── */

export function AddSampleModal({ receipt, onClose, onCreated }: Props) {
    const { t } = useTranslation();

    const [form, setForm] = useState<FormState>(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    // ── Matrix search ─────────────────────────────────────────────
    const [matrixSearch, setMatrixSearch] = useState("");
    const debouncedMatrixSearch = useDebouncedValue(matrixSearch, 300);
    const [matrixResults, setMatrixResults] = useState<Matrix[]>([]);
    const [matrixLoading, setMatrixLoading] = useState(false);
    const [showMatrixDropdown, setShowMatrixDropdown] = useState(false);

    useEffect(() => {
        if (!debouncedMatrixSearch.trim()) {
            setMatrixResults([]);
            return;
        }
        let cancelled = false;
        (async () => {
            setMatrixLoading(true);
            try {
                const res = await libraryApi.matrices.list({
                    query: { search: debouncedMatrixSearch.trim(), itemsPerPage: 20 },
                });
                if (cancelled) return;
                const data = (res as any).data ?? res;
                setMatrixResults(Array.isArray(data) ? data : []);
            } catch {
                if (!cancelled) setMatrixResults([]);
            } finally {
                if (!cancelled) setMatrixLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedMatrixSearch]);

    // ── Copy from existing sample ────────────────────────────────
    const [showCopyDropdown, setShowCopyDropdown] = useState(false);
    const [copyLoading, setCopyLoading] = useState<string | null>(null);

    const existingSamples = useMemo(() => receipt.samples ?? [], [receipt.samples]);

    const handleCopyFromSample = useCallback(
        async (sample: ReceiptSample) => {
            setCopyLoading(sample.sampleId);
            try {
                const res = await samplesGetFull({ sampleId: sample.sampleId });
                const full = (res as any).data ?? res;
                if (!full) throw new Error("No data");

                setForm({
                    sampleName: (full as any).sampleName ?? full.sampleTypeName ?? "",
                    productType: full.productType ?? "",
                    sampleTypeName: full.sampleTypeName ?? "",
                    sampleVolume: full.sampleVolume ?? "",
                    sampleWeight: full.sampleWeight ?? "",
                    samplePreservation: full.samplePreservation ?? "",
                    sampleStorageLoc: full.sampleStorageLoc ?? "",
                    physicalState: full.physicalState ?? "",
                    sampleNote: (full as any).sampleNote ?? "",
                    sampleInfo: Array.isArray(full.sampleInfo) ? (full.sampleInfo as SampleInfoRow[]).map((r) => ({ label: r.label ?? "", value: r.value ?? "" })) : emptyForm().sampleInfo,
                    sampleReceiptInfo: Array.isArray(full.sampleReceiptInfo)
                        ? (full.sampleReceiptInfo as SampleInfoRow[]).map((r) => ({ label: r.label ?? "", value: r.value ?? "" }))
                        : emptyForm().sampleReceiptInfo,
                    analyses: Array.isArray(full.analyses)
                        ? full.analyses.map((a: any) => {
                              const { analysisId, sampleId, createdAt, createdById, modifiedAt, modifiedById, ...rest } = a;
                              return {
                                  ...rest,
                                  matrixId: a.matrixId ?? "",
                                  parameterId: a.parameterId ?? "",
                                  parameterName: a.parameterName ?? "",
                                  protocolCode: a.protocolCode ?? "",
                                  sampleTypeName: full.sampleTypeName ?? "",
                                  analysisUnit: a.analysisUnit ?? "",
                                  methodLOD: a.methodLOD ?? "",
                                  methodLOQ: a.methodLOQ ?? "",
                              };
                          })
                        : [],
                });

                setShowCopyDropdown(false);
                toast.success(String(t("reception.addSample.copiedFromSample", { defaultValue: "Đã sao chép thông tin từ mẫu " })) + sample.sampleId);
            } catch (e) {
                console.error("Copy sample failed:", e);
                toast.error(String(t("common.toast.failed")));
            } finally {
                setCopyLoading(null);
            }
        },
        [t],
    );

    // ── Add matrix to analyses ───────────────────────────────────
    const addMatrixToAnalyses = useCallback((matrix: Matrix) => {
        setForm((prev) => {
            const exists = prev.analyses.some((a) => a.matrixId === matrix.matrixId);
            if (exists) return prev;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, createdAt, modifiedAt, ...restMatrix } = matrix as any;

            return {
                ...prev,
                analyses: [
                    ...prev.analyses,
                    {
                        ...restMatrix,
                        matrixId: matrix.matrixId,
                        parameterId: matrix.parameterId,
                        parameterName: matrix.parameterName ?? "",
                        protocolCode: matrix.protocolCode ?? "",
                        sampleTypeName: matrix.sampleTypeName ?? "",
                        analysisUnit: "",
                        methodLOD: matrix.methodLOD ?? "",
                        methodLOQ: matrix.methodLOQ ?? "",
                    },
                ],
            };
        });
        setMatrixSearch("");
        setShowMatrixDropdown(false);
    }, []);

    const removeAnalysis = useCallback((matrixId: string) => {
        setForm((prev) => ({
            ...prev,
            analyses: prev.analyses.filter((a) => a.matrixId !== matrixId),
        }));
    }, []);

    // ── Form field updater ───────────────────────────────────────
    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateInfoRow = (which: "sampleInfo" | "sampleReceiptInfo", idx: number, value: string) => {
        setForm((prev) => {
            const arr = [...prev[which]];
            arr[idx] = { ...arr[idx], value };
            return { ...prev, [which]: arr };
        });
    };

    // ── Submit ───────────────────────────────────────────────────
    const handleSubmit = useCallback(async () => {
        if (submitting) return;
        setSubmitting(true);

        try {
            const body: Record<string, unknown> = {
                receiptId: receipt.receiptId,
                sampleTypeId: form.sampleTypeName || "DEFAULT",
                sampleName: form.sampleName,
                productType: form.productType || undefined,
                sampleTypeName: form.sampleTypeName || undefined,
                sampleVolume: form.sampleVolume || undefined,
                sampleWeight: form.sampleWeight || undefined,
                samplePreservation: form.samplePreservation || undefined,
                sampleStorageLoc: form.sampleStorageLoc || undefined,
                physicalState: form.physicalState || undefined,
                sampleNote: form.sampleNote || undefined,
                sampleInfo: form.sampleInfo.filter((r) => r.value.trim()),
                sampleReceiptInfo: form.sampleReceiptInfo.filter((r) => r.value.trim()),
                analyses: form.analyses.map((a) => {
                    const { sampleTypeName, methodLOD, methodLOQ, ...rest } = a;
                    return {
                        ...rest,
                        matrixId: a.matrixId,
                        parameterId: a.parameterId,
                        parameterName: a.parameterName,
                        protocolCode: a.protocolCode,
                    };
                }),
            };

            await samplesCreateFull(body);

            // Reload receipt data
            const refreshRes = await receiptsGetFull({ receiptId: receipt.receiptId });
            const refreshedReceipt = (refreshRes as any).data ?? refreshRes;

            toast.success(String(t("reception.addSample.success", { defaultValue: "Đã thêm mẫu mới thành công" })));
            onCreated(refreshedReceipt as ReceiptDetail);
        } catch (e) {
            console.error("Create sample failed:", e);
            toast.error(String(t("common.toast.failed")));
        } finally {
            setSubmitting(false);
        }
    }, [form, receipt.receiptId, submitting, t, onCreated]);

    // ── Render ───────────────────────────────────────────────────
    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-[90vw] max-w-4xl max-h-[90vh] bg-card rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">{String(t("reception.addSample.title", { defaultValue: "Thêm mẫu mới" }))}</h2>
                            <p className="text-xs text-muted-foreground">{receipt.receiptCode}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Copy from existing sample */}
                        <div className="relative">
                            <Button variant="outline" size="sm" onClick={() => setShowCopyDropdown(!showCopyDropdown)} disabled={existingSamples.length === 0}>
                                <Copy className="h-3.5 w-3.5 mr-1.5" />
                                {String(t("reception.addSample.copyFromSample", { defaultValue: "Sao chép từ mẫu" }))}
                            </Button>
                            {showCopyDropdown && existingSamples.length > 0 && (
                                <div className="absolute right-0 top-full mt-1 w-72 bg-popover border border-border rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                                    {existingSamples.map((s) => (
                                        <button
                                            key={s.sampleId}
                                            type="button"
                                            className="w-full px-4 py-2.5 text-left hover:bg-accent/50 flex items-center justify-between text-sm transition-colors"
                                            onClick={() => handleCopyFromSample(s)}
                                            disabled={copyLoading === s.sampleId}
                                        >
                                            <div>
                                                <span className="font-medium text-foreground">{s.sampleId}</span>
                                                <span className="text-muted-foreground ml-2">{(s as any).sampleName ?? s.sampleTypeName ?? ""}</span>
                                            </div>
                                            {copyLoading === s.sampleId && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Body (scrollable) */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* ── Basic Info ──────────────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {String(t("reception.addSample.basicInfo", { defaultValue: "Thông tin cơ bản" }))}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.sampleName", { defaultValue: "Tên mẫu" }))}</Label>
                                <Input value={form.sampleName} onChange={(e) => setField("sampleName", e.target.value)} placeholder="VD: Mau 1" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.productType", { defaultValue: "Loại sản phẩm" }))}</Label>
                                <Input value={form.productType} onChange={(e) => setField("productType", e.target.value)} placeholder="VD: Thực phẩm bổ sung" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.sampleTypeName", { defaultValue: "Loại nền mẫu" }))}</Label>
                                <Input value={form.sampleTypeName} onChange={(e) => setField("sampleTypeName", e.target.value)} placeholder="VD: Thực phẩm bổ sung" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.sampleVolume", { defaultValue: "Thể tích" }))}</Label>
                                <Input value={form.sampleVolume} onChange={(e) => setField("sampleVolume", e.target.value)} placeholder="VD: 65 ml" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.sampleWeight", { defaultValue: "Khối lượng" }))}</Label>
                                <Input value={form.sampleWeight} onChange={(e) => setField("sampleWeight", e.target.value)} placeholder="VD: 1398" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.physicalState", { defaultValue: "Trạng thái vật lý" }))}</Label>
                                <Select value={form.physicalState} onValueChange={(v) => setField("physicalState", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={String(t("common.select", { defaultValue: "Chọn..." }))} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Solid">Solid</SelectItem>
                                        <SelectItem value="Liquid">Liquid</SelectItem>
                                        <SelectItem value="Semi-solid">Semi-solid</SelectItem>
                                        <SelectItem value="Gas">Gas</SelectItem>
                                        <SelectItem value="Powder">Powder</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.samplePreservation", { defaultValue: "Bảo quản" }))}</Label>
                                <Input value={form.samplePreservation} onChange={(e) => setField("samplePreservation", e.target.value)} placeholder="VD: 4°C - Axít hóa" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">{String(t("lab.samples.sampleStorageLoc", { defaultValue: "Vị trí lưu trữ" }))}</Label>
                                <Input value={form.sampleStorageLoc} onChange={(e) => setField("sampleStorageLoc", e.target.value)} placeholder="VD: Khu vực B - Kệ 8" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                                <Label className="text-xs">{String(t("lab.samples.sampleNote", { defaultValue: "Ghi chú" }))}</Label>
                                <Input value={form.sampleNote} onChange={(e) => setField("sampleNote", e.target.value)} placeholder="Ghi chú mẫu..." />
                            </div>
                        </div>
                    </section>

                    {/* ── Sample Info ─────────────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {String(t("reception.addSample.sampleInfoSection", { defaultValue: "Thông tin mẫu (sampleInfo)" }))}
                        </h3>
                        <div className="space-y-2">
                            {form.sampleInfo.map((row, idx) => (
                                <div key={`si-${idx}`} className="grid grid-cols-[160px_1fr] gap-2">
                                    <div className="text-xs font-medium text-muted-foreground flex items-center px-3 py-2 bg-muted/40 rounded-md">{row.label}</div>
                                    <Input
                                        value={row.value}
                                        onChange={(e) => updateInfoRow("sampleInfo", idx, e.target.value)}
                                        placeholder={`Nhập ${row.label.toLowerCase()}...`}
                                        className="text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Sample Receipt Info ──────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {String(t("reception.addSample.receiptInfoSection", { defaultValue: "Thông tin tiếp nhận (sampleReceiptInfo)" }))}
                        </h3>
                        <div className="space-y-2">
                            {form.sampleReceiptInfo.map((row, idx) => (
                                <div key={`sri-${idx}`} className="grid grid-cols-[160px_1fr] gap-2">
                                    <div className="text-xs font-medium text-muted-foreground flex items-center px-3 py-2 bg-muted/40 rounded-md">{row.label}</div>
                                    <Input
                                        value={row.value}
                                        onChange={(e) => updateInfoRow("sampleReceiptInfo", idx, e.target.value)}
                                        placeholder={`Nhập ${row.label.toLowerCase()}...`}
                                        className="text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Analyses ─────────────────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-primary" />
                            {String(t("reception.addSample.analysesSection", { defaultValue: "Phép thử (Analyses)" }))}
                            <Badge variant="secondary" className="ml-1">
                                {form.analyses.length}
                            </Badge>
                        </h3>

                        {/* Search from library */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                value={matrixSearch}
                                onChange={(e) => {
                                    setMatrixSearch(e.target.value);
                                    setShowMatrixDropdown(true);
                                }}
                                onFocus={() => setShowMatrixDropdown(true)}
                                placeholder={String(t("reception.addSample.searchMatrix", { defaultValue: "Tìm phép thử từ thư viện (tên chỉ tiêu, phương pháp, mã matrix)..." }))}
                                className="pl-9 text-sm"
                            />

                            {showMatrixDropdown && (matrixLoading || matrixResults.length > 0) && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-xl z-10 max-h-56 overflow-y-auto">
                                    {matrixLoading ? (
                                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            {String(t("common.loading", { defaultValue: "Đang tải..." }))}
                                        </div>
                                    ) : (
                                        matrixResults.map((m) => {
                                            const alreadyAdded = form.analyses.some((a) => a.matrixId === m.matrixId);
                                            return (
                                                <button
                                                    key={m.matrixId}
                                                    type="button"
                                                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${alreadyAdded ? "bg-primary/5 text-muted-foreground cursor-not-allowed" : "hover:bg-accent/50"}`}
                                                    onClick={() => !alreadyAdded && addMatrixToAnalyses(m)}
                                                    disabled={alreadyAdded}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-foreground truncate">{m.parameterName ?? m.parameterId}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {m.protocolCode ?? ""} · {m.sampleTypeName ?? ""} · <span className="font-mono">{m.matrixId}</span>
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

                        {/* Analyses table */}
                        {form.analyses.length > 0 ? (
                            <div className="bg-background border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase">Matrix ID</th>
                                            <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase">
                                                {String(t("lab.analyses.parameterName", { defaultValue: "Chỉ tiêu" }))}
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase">
                                                {String(t("lab.analyses.protocolCode", { defaultValue: "Phương pháp" }))}
                                            </th>
                                            <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase">methodLOD/methodLOQ</th>
                                            <th className="px-3 py-2 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {form.analyses.map((a) => (
                                            <tr key={a.matrixId} className="hover:bg-muted/20">
                                                <td className="px-3 py-2 text-xs font-mono text-muted-foreground">{a.matrixId}</td>
                                                <td className="px-3 py-2 text-sm text-foreground">{a.parameterName}</td>
                                                <td className="px-3 py-2 text-xs text-muted-foreground">{a.protocolCode}</td>
                                                <td className="px-3 py-2 text-xs text-muted-foreground">
                                                    {a.methodLOD && <span>methodLOD: {a.methodLOD}</span>}
                                                    {a.methodLOD && a.methodLOQ && <span className="mx-1">·</span>}
                                                    {a.methodLOQ && <span>methodLOQ: {a.methodLOQ}</span>}
                                                    {!a.methodLOD && !a.methodLOQ && "-"}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAnalysis(a.matrixId)}>
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border">
                                <FlaskConical className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">{String(t("reception.addSample.noAnalyses", { defaultValue: "Chưa có phép thử nào. Tìm kiếm phía trên để thêm." }))}</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/20">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        {String(t("common.cancel", { defaultValue: "Hủy" }))}
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {String(t("common.saving", { defaultValue: "Đang lưu..." }))}
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                {String(t("reception.addSample.submit", { defaultValue: "Thêm mẫu" }))}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.body,
    );
}
