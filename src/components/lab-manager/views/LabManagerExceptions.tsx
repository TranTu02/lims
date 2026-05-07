import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, Eye, AlertTriangle, RefreshCw, ExternalLink, PackageSearch, UserCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useSamplesProcessing } from "@/api/samples";
import { useAnalysesProcessing } from "@/api/analyses";
import { useIdentitiesList } from "@/api/identities";
import { useIdentityGroupsList } from "@/api/identityGroups";
import { FilterPopover } from "../FilterPopover";
import type { SampleListItem } from "@/types/sample";
import type { AnalysisListItem } from "@/types/analysis";
import { getTopAnalysisMarks } from "@/lib/utils";
import { DocumentPreviewButton } from "@/components/document/DocumentPreviewButton";

type ExceptionTab = "urgent" | "complaint-sample" | "complaint-analysis" | "retest" | "subcontract-analysis" | "subcontract-sample";

/** Tabs that query SAMPLES processing API (filter by sampleMarks) */
const SAMPLE_TABS: ExceptionTab[] = ["urgent", "complaint-sample", "subcontract-sample"];


function getMarksFilter(tab: ExceptionTab): string[] {
    switch (tab) {
        case "urgent": return ["Fast"];
        case "complaint-sample": return ["Complained"];
        case "complaint-analysis": return ["Complained"];
        case "retest": return ["ReTest"];
        case "subcontract-analysis": return ["EX"];
        case "subcontract-sample": return ["EX"];
    }
}

function isSampleTab(tab: ExceptionTab): boolean {
    return SAMPLE_TABS.includes(tab);
}

function getTabLabel(tab: ExceptionTab): string {
    switch (tab) {
        case "urgent": return "Mẫu khẩn";
        case "complaint-sample": return "Mẫu khiếu nại";
        case "complaint-analysis": return "CT khiếu nại";
        case "retest": return "CT làm lại";
        case "subcontract-analysis": return "CT thầu phụ";
        case "subcontract-sample": return "Mẫu thầu phụ";
    }
}

function getTabIcon(tab: ExceptionTab) {
    switch (tab) {
        case "urgent": return <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />;
        case "complaint-sample": return null;
        case "complaint-analysis": return null;
        case "retest": return <RefreshCw className="h-3.5 w-3.5 mr-1.5" />;
        case "subcontract-analysis": return <ExternalLink className="h-3.5 w-3.5 mr-1.5" />;
        case "subcontract-sample": return <PackageSearch className="h-3.5 w-3.5 mr-1.5" />;
    }
}

export function LabManagerExceptions() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<ExceptionTab>("urgent");
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const marksFilter = useMemo(() => getMarksFilter(activeTab), [activeTab]);
    const tabIsSample = useMemo(() => isSampleTab(activeTab), [activeTab]);

    // Filters
    const [technicianId, setTechnicianId] = useState<string | null>(null);
    const [technicianGroupId, setTechnicianGroupId] = useState<string | null>(null);
    const [analysisDocumentIdFilter, setAnalysisDocumentIdFilter] = useState<string | null>(null);

    // Filter Datas
    const { data: techRes, isLoading: isTechLoading } = useIdentitiesList({
        query: { identityRoles: ["ROLE_TECHNICIAN"], identityStatus: ["active"], itemsPerPage: 100 }
    });
    const techsOptions = useMemo(() => {
        return (techRes?.data ?? []).map((tech: any) => ({
            value: tech.identityId,
            label: tech.identityName
        }));
    }, [techRes?.data]);

    const { data: groupsRes, isLoading: isGroupsLoading } = useIdentityGroupsList({
        query: { identityGroupMainRole: ["ROLE_TECHNICIAN"], option: "full", itemsPerPage: 100 }
    });
    const groupsOptions = useMemo(() => {
        return (groupsRes?.data ?? []).map((group: any) => ({
            value: group.identityGroupId,
            label: group.identityGroupName
        }));
    }, [groupsRes?.data]);

    const documentOptions = [
        { value: "IS NOT NULL", label: "Có biên bản" },
        { value: "IS NULL", label: "Không có biên bản" }
    ];

    // SAMPLES processing API — active only on sample tabs
    const { data: samplesRes, isLoading: samplesLoading } = useSamplesProcessing(
        {
            query: {
                sampleMarks: marksFilter,
                search: debouncedSearch || undefined,
                itemsPerPage,
                page,
            },
        },
        { enabled: tabIsSample },
    );

    // ANALYSES processing API — active only on analysis tabs
    const { data: analysesRes, isLoading: analysesLoading } = useAnalysesProcessing(
        {
            query: {
                analysisMarks: marksFilter,
                search: debouncedSearch || undefined,
                technicianId: technicianId ? [technicianId] : undefined,
                technicianGroupId: technicianGroupId ? [technicianGroupId] : undefined,
                analysisDocumentId: analysisDocumentIdFilter ? [analysisDocumentIdFilter] : undefined,
                itemsPerPage,
                page,
            },
        },
        { enabled: !tabIsSample },
    );

    const isLoading = tabIsSample ? samplesLoading : analysesLoading;

    const samplesList = useMemo(() => (samplesRes?.data ?? []) as SampleListItem[], [samplesRes?.data]);
    const analysesList = useMemo(() => (analysesRes?.data ?? []) as AnalysisListItem[], [analysesRes?.data]);
    const meta = tabIsSample ? samplesRes?.meta : analysesRes?.meta;

    useEffect(() => {
        setPage(1);
        setSearch("");
        setTechnicianId(null);
        setTechnicianGroupId(null);
        setAnalysisDocumentIdFilter(null);
    }, [activeTab]);

    const ALL_TABS: ExceptionTab[] = ["urgent", "complaint-sample", "complaint-analysis", "retest", "subcontract-analysis", "subcontract-sample"];

    return (
        <div className="flex h-full flex-col gap-4 p-6 bg-background space-y-4">
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                    {String(t("nav.managerExceptions", { defaultValue: "Mẫu - Chỉ tiêu cần xử lý" }))}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {String(t("nav.managerExceptionsDesc", { defaultValue: "Giám sát các trường hợp đặc biệt: mẫu khẩn, khiếu nại, làm lại, thầu phụ." }))}
                </p>
            </div>

            {/* Tabs + Search */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ExceptionTab)} className="flex-1 flex flex-col">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto">
                        {ALL_TABS.map((tab) => (
                            <TabsTrigger key={tab} value={tab} className="text-xs">
                                {getTabIcon(tab)}
                                {getTabLabel(tab)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={String(t("common.search"))} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 shadow-sm" />
                    </div>
                </div>

                {/* Table */}
                <div className="border-border/50 bg-card flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
                    <div className="flex-1 overflow-auto">
                        {tabIsSample ? (
                            /* ===== SAMPLE TABLE ===== */
                            <Table className="table-fixed w-full">
                                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-12">STT</TableHead>
                                        <TableHead className="w-[140px]">{String(t("lab.samples.sampleId", { defaultValue: "Mã mẫu" }))}</TableHead>
                                        <TableHead className="w-[140px]">{String(t("lab.receipts.receiptId", { defaultValue: "Mã phiếu" }))}</TableHead>
                                        <TableHead className="w-[200px]">{String(t("lab.samples.sampleTypeName", { defaultValue: "Loại mẫu" }))}</TableHead>
                                        <TableHead className="w-[120px]">{String(t("common.status", { defaultValue: "Trạng thái" }))}</TableHead>
                                        <TableHead className="w-[120px]">Marks</TableHead>
                                        <TableHead className="w-[100px]">{String(t("common.createdAt", { defaultValue: "Ngày tạo" }))}</TableHead>
                                        <TableHead className="w-[80px]">{String(t("common.view", { defaultValue: "Xem" }))}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={8} className="h-40 text-center"><Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                                    ) : samplesList.length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-muted-foreground h-40 text-center">{String(t("common.noData"))}</TableCell></TableRow>
                                    ) : (
                                        samplesList.map((sample, index) => (
                                            <TableRow key={sample.sampleId} className="transition-colors">
                                                <TableCell className="text-xs text-muted-foreground">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                                <TableCell className="font-medium text-primary text-xs break-all">{sample.sampleId}</TableCell>
                                                <TableCell className="font-medium text-xs break-all">{sample.receiptId ?? "-"}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm break-words whitespace-normal">{sample.sampleTypeName ?? "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-medium whitespace-nowrap text-xs">{sample.sampleStatus ?? "-"}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(sample.sampleMarks ?? []).map((m) => (
                                                            <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {sample.createdAt ? new Date(sample.createdAt).toLocaleDateString("vi-VN") : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title={String(t("common.view"))}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        ) : (
                            /* ===== ANALYSIS TABLE ===== */
                            <Table className="table-fixed w-full">
                                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-12">STT</TableHead>
                                        <TableHead className="w-[110px]">{String(t("lab.samples.sampleId", { defaultValue: "Mã mẫu" }))}</TableHead>
                                        <TableHead className="w-[180px]">{String(t("lab.analyses.parameterName", { defaultValue: "Chỉ tiêu" }))}</TableHead>
                                        <TableHead className="w-[130px]">{String(t("lab.analyses.protocolCode", { defaultValue: "Phương pháp" }))}</TableHead>
                                        <TableHead className="w-[150px]">{String(t("lab.analyses.analysisResult", { defaultValue: "Kết quả" }))}</TableHead>
                                        <TableHead className="w-[80px]">{String(t("lab.analyses.unit", { defaultValue: "Đơn vị" }))}</TableHead>
                                        <TableHead className="w-[110px]">{String(t("common.status"))}</TableHead>
                                        <TableHead className="w-[120px] p-0 align-middle">
                                            <FilterPopover 
                                                title={t("lab.analyses.technicianGroup", { defaultValue: "Nhóm phụ trách" })}
                                                value={technicianGroupId}
                                                options={groupsOptions}
                                                onSelect={setTechnicianGroupId}
                                                isLoading={isGroupsLoading}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[130px] p-0 align-middle">
                                            <FilterPopover 
                                                title={t("lab.analyses.technician", { defaultValue: "Người phụ trách" })}
                                                value={technicianId}
                                                options={techsOptions}
                                                onSelect={setTechnicianId}
                                                isLoading={isTechLoading}
                                            />
                                        </TableHead>
                                        <TableHead className="w-[100px]">Marks</TableHead>
                                        <TableHead className="w-[100px] p-0 align-middle">
                                            <FilterPopover 
                                                title={t("common.view", { defaultValue: "Biên bản" })}
                                                value={analysisDocumentIdFilter}
                                                options={documentOptions}
                                                onSelect={setAnalysisDocumentIdFilter}
                                            />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={11} className="h-40 text-center"><Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                                    ) : analysesList.length === 0 ? (
                                        <TableRow><TableCell colSpan={11} className="text-muted-foreground h-40 text-center">{String(t("common.noData"))}</TableCell></TableRow>
                                    ) : (
                                        analysesList.map((item, index) => (
                                            <TableRow key={item.analysisId} className="transition-colors">
                                                <TableCell className="text-xs text-muted-foreground">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                                <TableCell className="font-medium text-primary text-xs break-all">{(item as any).sample?.sampleCode || item.sampleId}</TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-sm break-words whitespace-normal">{item.parameterName ?? "-"}</div>
                                                    <div className="text-muted-foreground italic text-[11px] break-all">{item.protocolCode ?? "-"}</div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground italic text-xs break-all whitespace-normal">{item.protocolCode ?? "-"}</TableCell>
                                                <TableCell className="font-medium text-blue-600 break-words whitespace-normal">
                                                    <span dangerouslySetInnerHTML={{ __html: item.analysisResult ? String(item.analysisResult) : "-" }} />
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground break-all">{(item as any).analysisUnit ?? "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-medium whitespace-nowrap text-xs">{item.analysisStatus}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs bg-muted/40 whitespace-nowrap">{item.technicianGroupName ?? "-"}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        <span className="break-words whitespace-normal text-xs">
                                                            {(item.technician as { identityName?: string } | null)?.identityName ?? "-"}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {getTopAnalysisMarks(item.analysisMarks).map((m) => (
                                                            <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title={String(t("common.view"))}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {item.analysisDocumentId && (
                                                            <DocumentPreviewButton documentId={item.analysisDocumentId} variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-600/10 p-0" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {meta && <Pagination currentPage={page} totalPages={meta.totalPages} itemsPerPage={itemsPerPage} totalItems={(meta as Record<string, unknown>).total as number ?? (meta as Record<string, unknown>).totalItems as number ?? 0} onPageChange={setPage} onItemsPerPageChange={setItemsPerPage} />}
            </Tabs>
        </div>
    );
}
