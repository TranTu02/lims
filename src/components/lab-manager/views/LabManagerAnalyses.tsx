import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, Eye, TestTube2, UserCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useAnalysesProcessing, useAnalysisFull } from "@/api/analyses";
import { useIdentitiesList } from "@/api/identities";
import { useIdentityGroupsList } from "@/api/identityGroups";
import { FilterPopover } from "../FilterPopover";
import type { AnalysisListItem, AnalysisDetail } from "@/types/analysis";
import { getTopAnalysisMarks } from "@/lib/utils";
import { DocumentPreviewButton } from "@/components/document/DocumentPreviewButton";

function getStatusBadge(status: string) {
    switch (status) {
        case "Assigned": return <Badge variant="outline" className="text-muted-foreground">Mới giao</Badge>;
        case "InProgress":
        case "Testing": return <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-none">Đang TN</Badge>;
        case "DataEntered": return <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-none">Đã nhập KQ</Badge>;
        case "Completed":
        case "TechReview": return <Badge variant="default" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-none">Hoàn thành</Badge>;
        case "Approved": return <Badge className="bg-success text-success-foreground">Đã duyệt</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
}



export function LabManagerAnalyses() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [search, setSearch] = useState("");
    
    // Filters
    const [technicianId, setTechnicianId] = useState<string | null>(null);
    const [technicianGroupId, setTechnicianGroupId] = useState<string | null>(null);
    const [technicianIds, setTechnicianIds] = useState<string | null>(null); // Người liên quan

    const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
    const debouncedSearch = useDebounce(search, 300);

    // Filter APIs
    const { data: techRes, isLoading: isTechLoading } = useIdentitiesList({
        query: { identityRoles: ["ROLE_TECHNICIAN"], identityStatus: ["active"], itemsPerPage: 100 }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const techsOptions = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (techRes?.data ?? []).map((tech: any) => ({
            value: tech.identityId,
            label: tech.identityName
        }));
    }, [techRes?.data]);

    const { data: groupsRes, isLoading: isGroupsLoading } = useIdentityGroupsList({
        query: { identityGroupMainRole: ["ROLE_TECHNICIAN"], option: "full", itemsPerPage: 100 }
    });
    const groupsOptions = useMemo(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (groupsRes?.data ?? []).map((group: any) => ({
            value: group.identityGroupId,
            label: group.identityGroupName
        }));
    }, [groupsRes?.data]);

    // Data API
    const { data: processingRes, isLoading } = useAnalysesProcessing({
        query: {
            search: debouncedSearch || undefined,
            technicianId: technicianId ? [technicianId] : undefined,
            technicianGroupId: technicianGroupId ? [technicianGroupId] : undefined,
            technicianIds: technicianIds ? [technicianIds] : undefined,
            itemsPerPage,
            page,
        },
    });

    const analysesList = useMemo(() => (processingRes?.data ?? []) as AnalysisListItem[], [processingRes?.data]);
    const meta = processingRes?.meta;

    // Detail query
    const { data: analysisDetail, isLoading: detailLoading } = useAnalysisFull(
        { analysisId: selectedAnalysisId ?? "" },
        { enabled: Boolean(selectedAnalysisId) },
    );

    const handleViewDetail = useCallback((analysisId: string) => {
        setSelectedAnalysisId(analysisId);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedAnalysisId(null);
    }, []);

    useEffect(() => {
        setPage(1);
    }, [technicianId, technicianGroupId, technicianIds]);

    return (
        <div className="flex h-full flex-col gap-4 p-6 bg-background space-y-4">
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <TestTube2 className="h-6 w-6 text-purple-500" />
                        {String(t("nav.managerAnalyses", { defaultValue: "Danh sách chỉ tiêu đang thực hiện" }))}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {String(t("nav.managerAnalysesDesc", { defaultValue: "Theo dõi chi tiết phân công, lọc theo nhóm, người thực hiện." }))}
                    </p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={String(t("common.search"))} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 shadow-sm" />
                </div>
            </div>

            {/* Table */}
            <div className="border-border/50 bg-card flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="w-16">STT</TableHead>
                                <TableHead className="min-w-[120px]">{String(t("lab.samples.sampleId", { defaultValue: "Mã mẫu" }))}</TableHead>
                                <TableHead className="min-w-[160px]">{String(t("lab.analyses.parameterName", { defaultValue: "Chỉ tiêu" }))}</TableHead>
                                <TableHead className="min-w-[100px]">{String(t("lab.analyses.result", { defaultValue: "Kết quả" }))}</TableHead>
                                <TableHead className="min-w-[80px]">{String(t("lab.analyses.unit", { defaultValue: "Đơn vị" }))}</TableHead>
                                <TableHead className="min-w-[160px] p-0 align-middle">
                                    <FilterPopover 
                                        title={String(t("lab.analyses.technicianGroup", { defaultValue: "Nhóm phụ trách" }))}
                                        value={technicianGroupId}
                                        options={groupsOptions}
                                        onSelect={setTechnicianGroupId}
                                        isLoading={isGroupsLoading}
                                    />
                                </TableHead>
                                <TableHead className="min-w-[170px] p-0 align-middle">
                                    <FilterPopover 
                                        title={String(t("lab.analyses.technician", { defaultValue: "Người thực hiện" }))}
                                        value={technicianId}
                                        options={techsOptions}
                                        onSelect={setTechnicianId}
                                        isLoading={isTechLoading}
                                    />
                                </TableHead>
                                <TableHead className="min-w-[170px] p-0 align-middle">
                                    <FilterPopover 
                                        title={String(t("lab.analyses.relatedTechs", { defaultValue: "Người liên quan" }))}
                                        value={technicianIds}
                                        options={techsOptions}
                                        onSelect={setTechnicianIds}
                                        isLoading={isTechLoading}
                                    />
                                </TableHead>
                                <TableHead className="w-[120px]">{String(t("common.status"))}</TableHead>
                                <TableHead className="w-[60px]">{String(t("common.view"))}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={10} className="h-40 text-center"><Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                            ) : analysesList.length === 0 ? (
                                <TableRow><TableCell colSpan={10} className="text-muted-foreground h-40 text-center">{String(t("common.noData"))}</TableCell></TableRow>
                            ) : (
                                analysesList.map((item, index) => (
                                    <TableRow key={item.analysisId} className="transition-colors cursor-pointer hover:bg-muted/40" onClick={() => handleViewDetail(item.analysisId)}>
                                        <TableCell>{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                        <TableCell className="font-medium text-primary">{item.sampleId}</TableCell>
                                        <TableCell>
                                            <div className="font-semibold">{item.parameterName ?? "-"}</div>
                                            <div className="text-muted-foreground italic text-[11px]">{item.protocolCode ?? "-"}</div>
                                        </TableCell>
                                        <TableCell className="font-mono font-medium text-blue-600">{item.analysisResult ?? "-"}</TableCell>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        <TableCell className="text-xs text-muted-foreground">{(item as any).analysisUnit ?? "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs bg-muted/40 whitespace-nowrap">{item.technicianGroupName ?? "-"}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                                                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <span className="truncate">
                                                    {(item.technician as { identityName?: string } | null)?.identityName ?? "-"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {item.technicians && item.technicians.length > 0 ? item.technicians.map((t) => (
                                                    <Badge key={t.identityId} variant="secondary" className="font-normal text-[10px] px-1.5 py-0 h-5">
                                                        {t.alias || t.identityName}
                                                    </Badge>
                                                )) : <span className="text-[10px] text-muted-foreground">-</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(item.analysisStatus)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title={String(t("common.view"))} onClick={(e) => { e.stopPropagation(); handleViewDetail(item.analysisId); }}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {item.analysisDocumentId && (
                                                    <DocumentPreviewButton documentId={item.analysisDocumentId} className="h-8 w-8 text-blue-600 hover:bg-blue-600/10" variant="ghost" />
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {meta && <Pagination currentPage={page} totalPages={meta.totalPages} itemsPerPage={itemsPerPage} totalItems={meta.total ?? (meta as any).totalItems ?? 0} onPageChange={setPage} onItemsPerPageChange={setItemsPerPage} />}

            {/* Detail Modal */}
            <Dialog open={Boolean(selectedAnalysisId)} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
                <DialogContent className="sm:max-w-[70vw] w-full min-w-[800px] h-[80vh] max-h-[85vh] overflow-hidden flex flex-col p-0 [&>button:last-child]:hidden block-close-icon">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <DialogTitle className="text-lg font-semibold text-foreground">
                            {String(t("lab.analyses.detail", { defaultValue: "Chi tiết chỉ tiêu" }))} — {selectedAnalysisId}
                        </DialogTitle>
                        {/* We use our own close button without Shadcn's default overlapping it because of the CSS hidden rule above */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleCloseModal}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {detailLoading ? (
                            <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : analysisDetail ? (
                            <AnalysisDetailContent detail={analysisDetail as AnalysisDetail} />
                        ) : (
                            <p className="text-muted-foreground text-center">{String(t("common.noData"))}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function AnalysisDetailContent({ detail }: { detail: AnalysisDetail }) {
    const { t } = useTranslation();

    return (
        <>
            {/* Basic Info */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {String(t("lab.analyses.basicInfo", { defaultValue: "Thông tin chỉ tiêu" }))}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                    <FieldItem label={String(t("lab.analyses.analysisId", { defaultValue: "Mã chỉ tiêu" }))} value={detail.analysisId} />
                    <FieldItem label={String(t("lab.samples.sampleId", { defaultValue: "Mã mẫu" }))} value={detail.sampleId} />
                    <FieldItem label={String(t("lab.samples.sampleTypeName", { defaultValue: "Loại mẫu" }))} value={detail.sampleTypeName || detail.sampleTypeId} />
                    <FieldItem label={String(t("lab.analyses.parameterName", { defaultValue: "Tên chỉ tiêu" }))} value={detail.parameterName} />
                    <FieldItem label={String(t("lab.analyses.protocolCode", { defaultValue: "Phương pháp" }))} value={detail.protocolCode} />
                    <FieldItem label={String(t("lab.analyses.equipmentId", { defaultValue: "Thiết bị" }))} value={detail.equipmentId} />
                    <FieldItem label={String(t("lab.analyses.matrixId", { defaultValue: "Matrix ID" }))} value={detail.matrixId} />
                    <FieldItem label={String(t("lab.analyses.parameterId", { defaultValue: "Parameter ID" }))} value={detail.parameterId} />
                    <FieldItem label={String(t("common.status"))} value={detail.analysisStatus} badge />
                    <FieldItem label={String(t("lab.analyses.analysisLocation", { defaultValue: "Nơi thực hiện" }))} value={detail.analysisLocation} />
                    <FieldItem label={String(t("common.createdAt"))} value={detail.createdAt ? new Date(detail.createdAt).toLocaleString("vi-VN") : null} />
                </div>
            </div>

            {/* Result */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {String(t("lab.analyses.resultSection", { defaultValue: "Kết quả" }))}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                    <FieldItem label={String(t("lab.analyses.analysisResult", { defaultValue: "Kết quả" }))} value={detail.analysisResult} />
                    <FieldItem label={String(t("lab.analyses.analysisResultStatus", { defaultValue: "Đạt/Không đạt" }))} value={detail.analysisResultStatus} badge />
                    <FieldItem label={String(t("lab.analyses.analysisUnit", { defaultValue: "Đơn vị" }))} value={detail.analysisUnit ?? null} />
                    <FieldItem label="LOD" value={detail.methodLOD ?? null} />
                    <FieldItem label="LOQ" value={detail.methodLOQ ?? null} />
                    <FieldItem label={String(t("lab.analyses.analysisUncertainty", { defaultValue: "Độ KĐBĐ (± U)" }))} value={detail.analysisUncertainty ?? null} />
                    <FieldItem label={String(t("lab.analyses.analysisStartedAt", { defaultValue: "Bắt đầu" }))} value={detail.analysisStartedAt ? new Date(detail.analysisStartedAt).toLocaleString("vi-VN") : null} />
                    <FieldItem label={String(t("lab.analyses.analysisCompletedAt", { defaultValue: "Hoàn thành" }))} value={detail.analysisCompletedAt ? new Date(detail.analysisCompletedAt).toLocaleString("vi-VN") : null} />
                    <FieldItem label={String(t("lab.analyses.analysisDeadline", { defaultValue: "Hạn TH" }))} value={detail.analysisDeadline ? new Date(detail.analysisDeadline).toLocaleDateString("vi-VN") : null} />
                </div>
            </div>

            {/* Technician */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {String(t("lab.analyses.technicianSection", { defaultValue: "Phân công" }))}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                    <FieldItem label={String(t("lab.analyses.technician", { defaultValue: "Người thực hiện chính" }))} value={detail.technician?.identityName} />
                    <FieldItem label={String(t("lab.analyses.technicianGroup", { defaultValue: "Nhóm phụ trách" }))} value={detail.technicianGroupName} />
                    <div>
                        <Label className="text-xs text-muted-foreground">{String(t("lab.analyses.relatedTechs", { defaultValue: "Người liên quan" }))}</Label>
                        <div className="mt-1 flex gap-1 flex-wrap">
                            {(detail.technicians ?? []).length > 0
                                ? (detail.technicians ?? []).map((t) => <Badge key={t.identityId} variant="outline" className="text-xs font-normal bg-muted/30">{t.identityName} {t.alias ? `(${t.alias})` : ""}</Badge>)
                                : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 mt-4">
                    <div>
                        <Label className="text-xs text-muted-foreground">Marks</Label>
                        <div className="mt-1 flex gap-1 flex-wrap">
                            {getTopAnalysisMarks(detail.analysisMarks).length > 0
                                ? getTopAnalysisMarks(detail.analysisMarks).map((m) => <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>)
                                : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                    </div>
                    <FieldItem label="Priority" value={detail.analysisPriority != null ? String(detail.analysisPriority) : null} />
                </div>
            </div>

            {/* Retest reason */}
            {detail.retestReason && (
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-2">
                        {String(t("lab.analyses.retestReason", { defaultValue: "Lý do thử lại" }))}
                    </h3>
                    <p className="text-sm text-destructive bg-destructive/5 rounded-lg p-3">{detail.retestReason}</p>
                </div>
            )}

            {/* Consumables Used */}
            {detail.consumablesUsed && Array.isArray(detail.consumablesUsed) && (detail.consumablesUsed as unknown[]).length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                        {String(t("lab.analyses.consumablesUsed", { defaultValue: "Hóa chất đã cấp phát" }))}
                    </h3>
                    <div className="overflow-x-auto border border-border rounded-lg">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-12 ">#</TableHead>
                                    <TableHead>{String(t("lab.analyses.chemicalName", { defaultValue: "Tên hóa chất" }))}</TableHead>
                                    <TableHead>{String(t("lab.analyses.lotNumber", { defaultValue: "Số Lô" }))}</TableHead>
                                    <TableHead className="">{String(t("lab.analyses.changeQty", { defaultValue: "SL xuất" }))}</TableHead>
                                    <TableHead>{String(t("lab.analyses.chemicalUnit", { defaultValue: "ĐVT" }))}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(detail.consumablesUsed as Record<string, unknown>[]).map((c, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs ">{i + 1}</TableCell>
                                        <TableCell className="font-medium text-sm text-primary">{(c.chemicalName as string) ?? "-"}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{(c.lotNumber as string) ?? "-"}</TableCell>
                                        <TableCell className=" font-mono">{c.changeQty != null ? String(c.changeQty) : "-"}</TableCell>
                                        <TableCell className="text-xs">{(c.chemicalBaseUnit as string) ?? "-"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </>
    );
}

function FieldItem({ label, value, badge }: { label: string; value: string | null | undefined; badge?: boolean }) {
    return (
        <div>
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="text-sm font-medium text-foreground mt-1">
                {badge ? (
                    <Badge variant="outline">{value ?? "-"}</Badge>
                ) : (
                    value ?? "-"
                )}
            </div>
        </div>
    );
}
