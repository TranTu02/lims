import { useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, Eye, PackageSearch, Calendar, ArrowRightLeft, Beaker, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { useSamplesProcessing } from "@/api/samples";
import { useSampleFull } from "@/api/samples";
import type { SampleListItem, SampleDetail } from "@/types/sample";
import { DocumentPreviewButton } from "@/components/document/DocumentPreviewButton";

type SamplesSubTab = "processing" | "handover" | "supplement";

export function LabManagerSamples() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<SamplesSubTab>("processing");
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [search, setSearch] = useState("");
    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);
    const debouncedSearch = useDebounce(search, 300);

    const { data: processingRes, isLoading } = useSamplesProcessing({
        query: {
            search: debouncedSearch || undefined,
            itemsPerPage,
            page,
        },
    });

    const samplesList = useMemo(() => (processingRes?.data ?? []) as SampleListItem[], [processingRes?.data]);
    const meta = processingRes?.meta;

    // Detail query
    const { data: sampleDetail, isLoading: detailLoading } = useSampleFull(
        { sampleId: selectedSampleId ?? "" },
        { enabled: Boolean(selectedSampleId) },
    );

    useEffect(() => {
        setPage(1);
        setSearch("");
    }, [activeTab]);

    const handleViewDetail = useCallback((sampleId: string) => {
        setSelectedSampleId(sampleId);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedSampleId(null);
    }, []);

    return (
        <div className="flex h-full flex-col gap-4 p-6 bg-background space-y-4">
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <PackageSearch className="h-6 w-6 text-blue-500" />
                    {String(t("nav.managerSamples", { defaultValue: "Danh sách mẫu đang thực hiện" }))}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {String(t("nav.managerSamplesDesc", { defaultValue: "Giám sát tiến độ mẫu, thông tin bàn giao, và kiểm soát cấp bổ sung." }))}
                </p>
            </div>

            {/* Sub-tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SamplesSubTab)} className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full grid-cols-3 md:w-[500px]">
                        <TabsTrigger value="processing" className="text-xs gap-1.5">
                            <PackageSearch className="h-3.5 w-3.5" />
                            {String(t("lab.manager.processingTab", { defaultValue: "Mẫu đang thực hiện" }))}
                        </TabsTrigger>
                        <TabsTrigger value="handover" className="text-xs gap-1.5">
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            {String(t("lab.manager.handoverTab", { defaultValue: "Bàn giao" }))}
                        </TabsTrigger>
                        <TabsTrigger value="supplement" className="text-xs gap-1.5">
                            <Beaker className="h-3.5 w-3.5" />
                            {String(t("lab.manager.supplementTab", { defaultValue: "Cấp bổ sung" }))}
                        </TabsTrigger>
                    </TabsList>
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
                                    <TableHead className="w-16 ">STT</TableHead>
                                    <TableHead className="min-w-[140px]">{String(t("lab.samples.sampleId", { defaultValue: "Mã mẫu" }))}</TableHead>
                                    <TableHead className="min-w-[120px]">{String(t("lab.receipts.receiptId", { defaultValue: "Mã phiếu" }))}</TableHead>
                                    <TableHead className="min-w-[160px]">{String(t("lab.samples.sampleTypeName", { defaultValue: "Loại mẫu" }))}</TableHead>
                                    <TableHead className="w-[120px] ">{String(t("common.status"))}</TableHead>
                                    <TableHead className="w-[100px]">{String(t("common.createdAt", { defaultValue: "Ngày tạo" }))}</TableHead>
                                    <TableHead className="w-[100px] ">Marks</TableHead>
                                    <TableHead className="w-[80px] ">{String(t("common.view"))}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={8} className="h-40 text-center"><Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                                ) : samplesList.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-muted-foreground h-40 text-center">{String(t("common.noData"))}</TableCell></TableRow>
                                ) : (
                                    samplesList.map((sample, index) => (
                                        <TableRow key={sample.sampleId} className="transition-colors cursor-pointer hover:bg-muted/40" onClick={() => handleViewDetail(sample.sampleId)}>
                                            <TableCell className="">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                            <TableCell className="font-medium text-primary">{sample.sampleId}</TableCell>
                                            <TableCell className="font-medium">{sample.receiptId ?? "-"}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{sample.sampleTypeName ?? "-"}</TableCell>
                                            <TableCell className="">
                                                <Badge variant="outline" className="font-medium">{sample.sampleStatus ?? "-"}</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 opacity-70" />
                                                    {sample.createdAt ? new Date(sample.createdAt).toLocaleDateString("vi-VN") : "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="">
                                                {(sample.sampleMarks ?? []).map((m) => (
                                                    <Badge key={m} variant="secondary" className="text-[10px] mr-1">{m}</Badge>
                                                ))}
                                            </TableCell>
                                            <TableCell className="">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" title={String(t("common.view"))} onClick={(e) => { e.stopPropagation(); handleViewDetail(sample.sampleId); }}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {meta && <Pagination currentPage={page} totalPages={meta.totalPages} itemsPerPage={itemsPerPage} totalItems={meta.total ?? meta.totalItems ?? 0} onPageChange={setPage} onItemsPerPageChange={setItemsPerPage} />}
            </Tabs>

            {/* Detail Modal */}
            <Dialog open={Boolean(selectedSampleId)} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
                <DialogContent className="sm:max-w-[70vw] w-full min-w-[800px] h-[80vh] max-h-[85vh] overflow-hidden flex flex-col p-0 [&>button:last-child]:hidden block-close-icon">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <DialogTitle className="text-lg font-semibold text-foreground">
                            {String(t("lab.samples.detail", { defaultValue: "Chi tiết mẫu" }))} — {selectedSampleId}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleCloseModal}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {detailLoading ? (
                            <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                        ) : sampleDetail ? (
                            <SampleDetailContent detail={sampleDetail as SampleDetail} />
                        ) : (
                            <p className="text-muted-foreground text-center">{String(t("common.noData"))}</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function SampleDetailContent({ detail }: { detail: SampleDetail }) {
    const { t } = useTranslation();

    const totalAnalyses = detail.analyses?.length ?? 0;
    const completedAnalyses = (detail.analyses ?? []).filter((a) => ["Approved", "TechReview", "Completed"].includes(a.analysisStatus ?? "")).length;
    const percent = totalAnalyses > 0 ? Math.round((completedAnalyses / totalAnalyses) * 100) : 0;

    return (
        <>
            {/* Basic Info */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {String(t("lab.samples.basicInfo", { defaultValue: "Thông tin mẫu" }))}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                    <FieldItem label={String(t("lab.samples.sampleId"))} value={detail.sampleId} />
                    <FieldItem label={String(t("lab.receipts.receiptId", { defaultValue: "Mã phiếu" }))} value={detail.receiptId} />
                    <FieldItem label={String(t("lab.samples.sampleTypeName", { defaultValue: "Loại mẫu" }))} value={detail.sampleTypeName} />
                    <FieldItem label={String(t("lab.samples.sampleName", { defaultValue: "Tên mẫu" }))} value={detail.sampleId} />
                    <FieldItem label={String(t("lab.samples.sampleStatus", { defaultValue: "Trạng thái" }))} value={detail.sampleStatus} badge />
                    <FieldItem label={String(t("lab.samples.sampleVolume", { defaultValue: "Lượng mẫu" }))} value={detail.sampleVolume} />
                    <FieldItem label={String(t("lab.samples.sampleWeight", { defaultValue: "Khối lượng" }))} value={detail.sampleWeight ? String(detail.sampleWeight) : null} />
                    <FieldItem label={String(t("lab.samples.samplePreservation", { defaultValue: "Bảo quản" }))} value={detail.samplePreservation} />
                    <FieldItem label={String(t("lab.samples.sampleStorageLoc", { defaultValue: "Vị trí lưu" }))} value={detail.sampleStorageLoc} />
                    <FieldItem label={String(t("lab.samples.physicalState", { defaultValue: "Trạng thái vật lý" }))} value={detail.physicalState} />
                    <FieldItem label={String(t("lab.samples.sampleClientInfo", { defaultValue: "Thông tin KH" }))} value={detail.sampleClientInfo} />
                    <FieldItem label={String(t("lab.samples.parentSampleId", { defaultValue: "Mẫu gốc" }))} value={detail.parentSampleId} />
                    <FieldItem label={String(t("common.createdAt"))} value={detail.createdAt ? new Date(detail.createdAt).toLocaleString("vi-VN") : null} />
                    <div>
                        <Label className="text-xs text-muted-foreground">Marks</Label>
                        <div className="mt-1 flex gap-1 flex-wrap">
                            {(detail.sampleMarks ?? []).length > 0
                                ? (detail.sampleMarks ?? []).map((m) => <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>)
                                : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                    </div>
                    <FieldItem label="Priority" value={detail.samplePriority != null ? String(detail.samplePriority) : null} />
                </div>
            </div>

            {/* Note */}
            {detail.sampleNote && (
                <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-2">{String(t("common.note"))}</h3>
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">{String(detail.sampleNote)}</p>
                </div>
            )}

            {/* Progress */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {String(t("lab.manager.progress", { defaultValue: "Tiến độ" }))}
                </h3>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                        <span className="font-medium">{percent}%</span>
                        <span className="text-muted-foreground">{completedAnalyses}/{totalAnalyses} {String(t("lab.analyses.analysisId", { defaultValue: "chỉ tiêu" }))}</span>
                    </div>
                    <Progress value={percent} className="h-2.5" />
                </div>
            </div>

            {/* Analyses table */}
            <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                    {String(t("lab.analyses.title", { defaultValue: "Chỉ tiêu" }))} ({totalAnalyses})
                </h3>
                <div className="overflow-x-auto border border-border rounded-lg">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-12 ">#</TableHead>
                                <TableHead>{String(t("lab.analyses.parameterName", { defaultValue: "Chỉ tiêu" }))}</TableHead>
                                <TableHead>{String(t("lab.analyses.protocolCode", { defaultValue: "Phương pháp" }))}</TableHead>
                                <TableHead className="">{String(t("lab.analyses.analysisResult", { defaultValue: "Kết quả" }))}</TableHead>
                                <TableHead className="">{String(t("lab.analyses.unit", { defaultValue: "Đơn vị" }))}</TableHead>
                                <TableHead>{String(t("lab.analyses.technicianGroup", { defaultValue: "Nhóm phụ trách" }))}</TableHead>
                                <TableHead>{String(t("lab.analyses.technician", { defaultValue: "Người thực hiện" }))}</TableHead>
                                <TableHead className="">{String(t("common.status"))}</TableHead>
                                <TableHead className=" w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(detail.analyses ?? []).map((a, i) => (
                                <TableRow key={a.analysisId}>
                                    <TableCell className=" text-xs">{i + 1}</TableCell>
                                    <TableCell className="font-medium">{a.parameterName ?? "-"}</TableCell>
                                    <TableCell className="text-xs italic text-muted-foreground">{a.protocolCode ?? "-"}</TableCell>
                                    <TableCell className=" font-mono text-sm text-blue-600">{a.analysisResult ?? "-"}</TableCell>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <TableCell className=" text-xs text-muted-foreground">{(a as any).analysisUnit ?? "-"}</TableCell>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <TableCell className="text-xs"><Badge variant="outline" className="bg-muted/40 font-normal">{(a as any).technicianGroupName ?? "-"}</Badge></TableCell>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <TableCell className="text-xs">{(a as any).technician?.identityName ?? "-"}</TableCell>
                                    <TableCell className=""><Badge variant="outline" className="text-xs">{a.analysisStatus ?? "-"}</Badge></TableCell>
                                    <TableCell className="">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {(a as any).analysisDocumentId ? (
                                            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                            <DocumentPreviewButton documentId={(a as any).analysisDocumentId} className="h-6 w-6 text-blue-600 hover:bg-blue-600/10" variant="ghost" />
                                        ) : null}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
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
