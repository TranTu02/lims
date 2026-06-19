import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, AlertCircle, Search, Loader2, Plus, FileText, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import type { ApiResponse } from "@/api/client";
import { samplesGetFull, useUpdateSample } from "@/api/samples";
import { samplesKeys } from "@/api/samplesKeys";
import { AccreditationBadges } from "@/components/library/shared/AccreditationTagInput";
import { useCreateAnalysis } from "@/api/analyses";
import { libraryApi, type Matrix } from "@/api/library";
import { fileApi } from "@/api/files";
import { toast } from "sonner";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";
import { SAMPLE_STATUS_VALUES, type SampleAnalysis, type SampleDetail, type SampleStatus } from "@/types/sample";
import { SearchableSelect } from "@/components/common/SearchableSelect";

type Props = {
    open: boolean;
    sampleId: string | null;
    onClose: () => void;
};

function SampleStatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();

    if (!status) {
        return (
            <Badge variant="outline" className="text-xs">
                {t("common.noData")}
            </Badge>
        );
    }

    if (status === "Stored") {
        return (
            <Badge variant="success" className="text-xs">
                {t("lab.samples.status.stored")}
            </Badge>
        );
    }

    if (status === "Analyzing") {
        return (
            <Badge variant="warning" className="text-xs">
                {t("lab.samples.status.analyzing")}
            </Badge>
        );
    }

    if (status === "Received") {
        return (
            <Badge variant="secondary" className="text-xs">
                {t("lab.samples.status.received")}
            </Badge>
        );
    }

    if (status === "Disposed") {
        return (
            <Badge variant="destructive" className="text-xs">
                {t("lab.samples.status.disposed")}
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="text-xs">
            {status}
        </Badge>
    );
}

function AnalysisStatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();

    if (!status) {
        return (
            <Badge variant="outline" className="text-xs">
                {t("common.noData")}
            </Badge>
        );
    }

    if (status === "Completed") {
        return (
            <Badge variant="success" className="text-xs">
                {t("lab.analyses.status.Approved")}
            </Badge>
        );
    }

    if (status === "Testing") {
        return (
            <Badge variant="warning" className="text-xs">
                {t("lab.analyses.status.Testing")}
            </Badge>
        );
    }

    if (status === "Assigned") {
        return (
            <Badge variant="secondary" className="text-xs">
                {t("lab.analyses.status.Pending")}
            </Badge>
        );
    }

    return (
        <Badge variant="destructive" className="text-xs">
            {status}
        </Badge>
    );
}

export function SampleDetailModal({ open, sampleId, onClose }: Props) {
    const { t } = useTranslation();

    function toDash(v: unknown, dash = t("common.noData")): string {
        if (typeof v === "string") {
            const s = v.trim();
            return s.length > 0 ? s : dash;
        }
        if (v == null) return dash;
        return String(v);
    }

    const q = useQuery({
        queryKey: sampleId ? samplesKeys.detail(sampleId) : samplesKeys.detail(""),
        enabled: open && Boolean(sampleId),
        queryFn: async (): Promise<ApiResponse<SampleDetail>> => {
            if (!sampleId) throw new Error("Missing sampleId");
            const res = await samplesGetFull({ sampleId });
            if (!res.success) throw new Error(res.error?.message ?? "Request failed");
            return res as ApiResponse<SampleDetail>;
        },
    });

    const data = q.data?.data ?? null;
    const analyses: SampleAnalysis[] = data?.analyses ?? [];

    const qc = useQueryClient();
    const createAnalysisMut = useCreateAnalysis();

    const updateSampleMut = useUpdateSample();

    const [newAnalysis, setNewAnalysis] = useState({
        parameterId: "",
        parameterName: "",
        sampleTypeId: "",
        sampleTypeName: "",
        protocolId: "",
        protocolCode: "",
        vilas997: false,
        tdc: false,
    });

    const [paramSearch, setParamSearch] = useState("");
    const [sampleTypeSearch, setSampleTypeSearch] = useState("");
    const [protocolSearch, setProtocolSearch] = useState("");

    const debouncedParamSearch = useDebouncedValue(paramSearch, 300);
    const debouncedSampleTypeSearch = useDebouncedValue(sampleTypeSearch, 300);
    const debouncedProtocolSearch = useDebouncedValue(protocolSearch, 300);

    const paramsQ = useQuery({
        queryKey: ["library", "parameters", "list", debouncedParamSearch],
        enabled: open,
        queryFn: async () => {
            return libraryApi.parameters.list({
                query: {
                    page: 1,
                    itemsPerPage: 20,
                    search: debouncedParamSearch.trim().length ? debouncedParamSearch.trim() : undefined,
                },
            });
        },
    });

    const sampleTypesQ = useQuery({
        queryKey: ["library", "sampleTypes", "list", debouncedSampleTypeSearch],
        enabled: open,
        queryFn: async () => {
            return libraryApi.sampleTypes.list({
                query: {
                    page: 1,
                    itemsPerPage: 20,
                    search: debouncedSampleTypeSearch.trim().length ? debouncedSampleTypeSearch.trim() : undefined,
                },
            });
        },
    });

    const protocolsQ = useQuery({
        queryKey: ["library", "protocols", "list", debouncedProtocolSearch],
        enabled: open,
        queryFn: async () => {
            return libraryApi.protocols.list({
                query: {
                    page: 1,
                    itemsPerPage: 20,
                    search: debouncedProtocolSearch.trim().length ? debouncedProtocolSearch.trim() : undefined,
                },
            });
        },
    });

    const parameterOptions = useMemo(() => {
        return (paramsQ.data?.data ?? []).map((p) => ({
            value: p.parameterId,
            label: p.parameterName,
        }));
    }, [paramsQ.data]);

    const sampleTypeOptions = useMemo(() => {
        return (sampleTypesQ.data?.data ?? []).map((st) => ({
            value: st.sampleTypeId,
            label: st.sampleTypeName,
        }));
    }, [sampleTypesQ.data]);

    const protocolOptions = useMemo(() => {
        return (protocolsQ.data?.data ?? []).map((pr) => ({
            value: pr.protocolId,
            label: pr.protocolCode,
        }));
    }, [protocolsQ.data]);

    useEffect(() => {
        if (data) {
            setNewAnalysis((prev) => ({
                ...prev,
                sampleTypeId: data.sampleTypeId ?? "",
                sampleTypeName: data.sampleTypeName ?? "",
            }));
        }
    }, [data]);

    const handleSelectParameter = (val: string | null) => {
        if (!val) {
            setNewAnalysis((prev) => ({ ...prev, parameterId: "", parameterName: "" }));
            return;
        }
        const found = (paramsQ.data?.data ?? []).find((p) => p.parameterId === val);
        setNewAnalysis((prev) => ({
            ...prev,
            parameterId: val,
            parameterName: found ? found.parameterName : "",
        }));
    };

    const handleSelectSampleType = (val: string | null) => {
        if (!val) {
            setNewAnalysis((prev) => ({ ...prev, sampleTypeId: "", sampleTypeName: "" }));
            return;
        }
        const found = (sampleTypesQ.data?.data ?? []).find((st) => st.sampleTypeId === val);
        if (found) {
            setNewAnalysis((prev) => ({
                ...prev,
                sampleTypeId: val,
                sampleTypeName: found.sampleTypeName,
            }));
        } else {
            setNewAnalysis((prev) => ({
                ...prev,
                sampleTypeId: "",
                sampleTypeName: val,
            }));
        }
    };

    const handleSelectProtocol = (val: string | null) => {
        if (!val) {
            setNewAnalysis((prev) => ({ ...prev, protocolId: "", protocolCode: "" }));
            return;
        }
        const found = (protocolsQ.data?.data ?? []).find((pr) => pr.protocolId === val);
        if (found) {
            setNewAnalysis((prev) => ({
                ...prev,
                protocolId: val,
                protocolCode: found.protocolCode,
            }));
        } else {
            setNewAnalysis((prev) => ({
                ...prev,
                protocolId: "",
                protocolCode: val,
            }));
        }
    };

    const handleAddAnalysis = async () => {
        if (!sampleId) return;
        if (!newAnalysis.parameterId) {
            toast.error("Vui lòng chọn chỉ tiêu phân tích");
            return;
        }

        const vilas997 = newAnalysis.vilas997;
        const tdc = newAnalysis.tdc;
        let protocolAccreditation: Record<string, boolean> | null = null;
        if (vilas997 || tdc) {
            protocolAccreditation = {};
            if (vilas997) protocolAccreditation["VILAS997"] = true;
            if (tdc) protocolAccreditation["TDC"] = true;
        }

        try {
            await createAnalysisMut.mutateAsync({
                body: {
                    sampleId,
                    parameterId: newAnalysis.parameterId,
                    parameterName: newAnalysis.parameterName,
                    sampleTypeId: newAnalysis.sampleTypeId || null,
                    sampleTypeName: newAnalysis.sampleTypeName || null,
                    protocolId: newAnalysis.protocolId || null,
                    protocolCode: newAnalysis.protocolCode || null,
                    protocolAccreditation: protocolAccreditation as any,
                    analysisStatus: "Pending",
                },
            });

            setNewAnalysis({
                parameterId: "",
                parameterName: "",
                sampleTypeId: data?.sampleTypeId ?? "",
                sampleTypeName: data?.sampleTypeName ?? "",
                protocolId: "",
                protocolCode: "",
                vilas997: false,
                tdc: false,
            });

            setParamSearch("");
            setSampleTypeSearch("");
            setProtocolSearch("");

            await qc.invalidateQueries({ queryKey: samplesKeys.detail(sampleId) });
        } catch (err) {
            // error handled by createAnalysisMut hook
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

    return (
        <DialogPrimitive.Root open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />

                <DialogPrimitive.Content
                    className="
            fixed inset-4 z-50 flex flex-col
            bg-card border border-border rounded-xl shadow-lg
            outline-none
          "
                >
                    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border">
                        <div className="min-w-0">
                            <DialogPrimitive.Title className="text-lg font-semibold text-foreground truncate">{t("reception.sampleDetail.title", { code: sampleId ?? "" })}</DialogPrimitive.Title>
                        </div>

                        <DialogPrimitive.Close asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose} aria-label={t("common.close")}>
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogPrimitive.Close>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {q.isLoading ? (
                            <div className="bg-card border border-border rounded-lg p-4">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-56 bg-muted rounded" />
                                    <div className="h-24 w-full bg-muted rounded" />
                                    <div className="h-40 w-full bg-muted rounded" />
                                </div>
                            </div>
                        ) : q.isError ? (
                            <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                <div>
                                    <div className="font-medium text-foreground">{t("common.error")}</div>
                                    <div className="text-sm text-muted-foreground">{t("common.toast.failed")}</div>
                                </div>
                            </div>
                        ) : !data ? (
                            <div className="text-sm text-muted-foreground">{t("common.noData")}</div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{t("reception.sampleDetail.sampleList")}</div>

                                    <div className="bg-muted/20 border border-border rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-4">
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleId")}</div>
                                                <div className="text-sm font-semibold text-primary mt-1">{toDash(data.sampleId)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.receiptId")}</div>
                                                <div className="text-sm text-foreground mt-1">{toDash(data.receiptId)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleTypeName")}</div>
                                                <div className="text-sm text-foreground mt-1">{toDash(data.sampleTypeName)}</div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleStatus")}</div>
                                                <div className="mt-1">
                                                    <Select
                                                        value={data.sampleStatus ?? ""}
                                                        onValueChange={async (newStatus) => {
                                                            if (!sampleId) return;
                                                            try {
                                                                await updateSampleMut.mutateAsync({
                                                                    sampleId,
                                                                    sampleStatus: newStatus as SampleStatus,
                                                                });
                                                            } catch (e) {
                                                                // error is handled by the hook toast
                                                            }
                                                        }}
                                                        disabled={updateSampleMut.isPending}
                                                    >
                                                        <SelectTrigger className="border-0 p-0 h-auto bg-transparent focus:ring-0 focus:ring-offset-0 w-auto inline-flex cursor-pointer">
                                                            <SampleStatusBadge status={data.sampleStatus} />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[200]">
                                                            {SAMPLE_STATUS_VALUES.map((s) => (
                                                                <SelectItem key={s} value={s}>
                                                                    {t(`lab.samples.status.${s}`, { defaultValue: s })}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleVolume")}</div>
                                                <div className="text-sm text-foreground mt-1">{toDash(data.sampleVolume)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleWeight", { defaultValue: "Khối lượng mẫu" })}</div>
                                                <div className="text-sm text-foreground mt-1">{toDash(data.sampleWeight)}</div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.samplePreservation", { defaultValue: "Bảo quản" })}</div>
                                                <div className="text-sm text-foreground mt-1">{toDash(data.samplePreservation)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleRetentionDate", { defaultValue: "Hạn lưu mẫu" })}</div>
                                                <div className="text-sm text-foreground mt-1">{data.sampleRetentionDate ? new Date(data.sampleRetentionDate).toLocaleDateString("vi-VN") : toDash(null)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleDisposalDate", { defaultValue: "Ngày hủy mẫu" })}</div>
                                                <div className="text-sm text-foreground mt-1">{data.sampleDisposalDate ? new Date(data.sampleDisposalDate).toLocaleDateString("vi-VN") : toDash(null)}</div>
                                            </div>

                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.physicalState", { defaultValue: "Trạng thái vật lý" })}</div>
                                                <div className="text-sm text-foreground mt-1">{toDash(data.physicalState)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.samplePriority", { defaultValue: "Độ ưu tiên" })}</div>
                                                <div className="text-sm text-foreground mt-1">
                                                    {data.samplePriority === 1 ? "Thấp" : data.samplePriority === 2 ? "Trung bình" : data.samplePriority === 3 ? "Cao" : toDash(data.samplePriority)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleIsReference", { defaultValue: "Mẫu lưu / Mẫu chuẩn" })}</div>
                                                <div className="text-sm text-foreground mt-1">
                                                    <Badge variant={data.sampleIsReference ? "success" : "outline"} className="text-[10px] h-4">
                                                        {data.sampleIsReference ? "Có" : "Không"}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="md:col-span-3">
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleMarks", { defaultValue: "Dấu hiệu mẫu" })}</div>
                                                <div className="flex flex-wrap gap-1 mt-1.5">
                                                    {(!data.sampleMarks || data.sampleMarks.length === 0) ? toDash(null) : data.sampleMarks.map((m, i) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100">{m}</Badge>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="md:col-span-3">
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleNote", { defaultValue: "Ghi chú mẫu" })}</div>
                                                <div className="text-sm text-foreground mt-1 p-2 bg-background/50 rounded border border-border/50 min-h-[40px] italic">
                                                    {toDash(data.sampleNote)}
                                                </div>
                                            </div>

                                            <div className="md:col-span-3">
                                                <div className="text-xs text-muted-foreground">{t("lab.samples.sampleClientInfo")}</div>
                                                <div className="text-sm text-foreground mt-1">{toDash(data.sampleClientInfo)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between font-medium text-foreground">
                                        <div className="text-sm">{t("reception.sampleDetail.analysisList")}</div>
                                    </div>

                                    {data.sampleStatus !== "Disposed" && (
                                        <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
                                            <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                                Thêm chỉ tiêu phân tích mới
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Parameter Select */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">Tên chỉ tiêu <span className="text-destructive">*</span></Label>
                                                    <SearchableSelect
                                                        value={newAnalysis.parameterId || null}
                                                        options={parameterOptions}
                                                        placeholder="Chọn chỉ tiêu phân tích..."
                                                        searchPlaceholder="Tìm kiếm chỉ tiêu..."
                                                        loading={paramsQ.isLoading}
                                                        onChange={handleSelectParameter}
                                                        searchValue={paramSearch}
                                                        onSearchChange={setParamSearch}
                                                        filterMode="server"
                                                    />
                                                </div>

                                                {/* Sample Type Select */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">Nền mẫu</Label>
                                                    <SearchableSelect
                                                        value={newAnalysis.sampleTypeId || newAnalysis.sampleTypeName || null}
                                                        options={sampleTypeOptions}
                                                        placeholder="Chọn hoặc nhập nền mẫu..."
                                                        searchPlaceholder="Tìm kiếm nền mẫu..."
                                                        loading={sampleTypesQ.isLoading}
                                                        allowCustomValue
                                                        onChange={handleSelectSampleType}
                                                        searchValue={sampleTypeSearch}
                                                        onSearchChange={setSampleTypeSearch}
                                                        filterMode="server"
                                                    />
                                                </div>

                                                {/* Protocol Select */}
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs text-muted-foreground">Phương pháp</Label>
                                                    <SearchableSelect
                                                        value={newAnalysis.protocolId || newAnalysis.protocolCode || null}
                                                        options={protocolOptions}
                                                        placeholder="Chọn hoặc nhập phương pháp..."
                                                        searchPlaceholder="Tìm kiếm phương pháp..."
                                                        loading={protocolsQ.isLoading}
                                                        allowCustomValue
                                                        onChange={handleSelectProtocol}
                                                        searchValue={protocolSearch}
                                                        onSearchChange={setProtocolSearch}
                                                        filterMode="server"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/40">
                                                {/* Accreditation Checkboxes */}
                                                <div className="flex items-center gap-6">
                                                    <span className="text-xs font-medium text-muted-foreground">Chứng nhận / Công nhận:</span>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="vilas997"
                                                                checked={newAnalysis.vilas997}
                                                                onCheckedChange={(checked) =>
                                                                    setNewAnalysis((prev) => ({ ...prev, vilas997: !!checked }))
                                                                }
                                                            />
                                                            <Label htmlFor="vilas997" className="text-xs cursor-pointer select-none">VILAS997</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id="tdc"
                                                                checked={newAnalysis.tdc}
                                                                onCheckedChange={(checked) =>
                                                                    setNewAnalysis((prev) => ({ ...prev, tdc: !!checked }))
                                                                }
                                                            />
                                                            <Label htmlFor="tdc" className="text-xs cursor-pointer select-none">TDC</Label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    disabled={!newAnalysis.parameterId || createAnalysisMut.isPending}
                                                    onClick={handleAddAnalysis}
                                                    className="h-8 gap-1.5 px-4"
                                                >
                                                    {createAnalysisMut.isPending ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Plus className="h-3.5 w-3.5" />
                                                    )}
                                                    Thêm chỉ tiêu
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-card border border-border rounded-lg overflow-x-auto">
                                        <table className="w-full min-w-5xl">
                                            <thead className="bg-muted/50 border-b border-border">
                                                <tr>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.parameterName")}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.matrixId")}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.protocolCode")}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.protocolAccreditation", { defaultValue: "Công nhận" })}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.technicianIds")}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.analysisResult")}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.analysisUnit")}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.analysisStatus")}</th>
                                                    <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">{t("lab.analyses.analysisLocation", { defaultValue: "Nơi thực hiện" })}</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-border">
                                                {analyses.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={9} className="px-10 py-20 text-center text-sm text-muted-foreground">
                                                            {t("reception.createReceipt.noAnalysis")}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    analyses.map((a) => (
                                                        <tr key={a.analysisId} className="hover:bg-accent/30 transition-colors">
                                                            <td className="px-3 py-4 text-sm text-foreground break-words max-w-[160px]">{toDash(a.parameterName)}</td>
                                                            <td className="px-3 py-4 text-sm text-muted-foreground break-all">{toDash(a.matrixId)}</td>
                                                            <td className="px-3 py-4 text-sm text-muted-foreground break-all">{toDash(a.protocolCode)}</td>
                                                            <td className="px-3 py-4 text-sm text-foreground">
                                                                <AccreditationBadges value={a.protocolAccreditation as any} className="text-xs" />
                                                            </td>
                                                            <td className="px-3 py-4 text-sm text-foreground">{toDash(a.technicianIds?.join(", ") ?? a.technicianId)}</td>
                                                            <td className="px-3 py-4 text-sm text-foreground break-words" dangerouslySetInnerHTML={{ __html: a.analysisResult ? String(a.analysisResult) : toDash(null) }} />
                                                            <td className="px-3 py-4 text-sm text-muted-foreground">{toDash(a.analysisUnit)}</td>
                                                            <td className="px-3 py-4">
                                                                <AnalysisStatusBadge status={a.analysisStatus ?? null} />
                                                            </td>
                                                            <td className="px-3 py-4 text-sm text-foreground">
                                                                {toDash(a.analysisLocation)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between font-medium text-foreground">
                                        <div className="text-sm flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            {t("reception.sampleDetail.documentList", { defaultValue: "Danh mục tài liệu" })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {(!data.documents || data.documents.length === 0) ? (
                                            <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg bg-muted/5">
                                                <FileText className="h-8 w-8 mb-2 opacity-20" />
                                                <p className="text-xs italic">Không có tài liệu liên quan</p>
                                            </div>
                                        ) : (
                                            data.documents.map((doc, idx) => (
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
                            </>
                        )}
                    </div>

                    <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t("common.close")}
                        </Button>
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
