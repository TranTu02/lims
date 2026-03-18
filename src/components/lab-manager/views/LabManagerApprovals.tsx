import { useState, useMemo, useEffect } from "react";
import { Search, Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalysesList, useUpdateAnalysis, useAnalysesUpdateBulk } from "@/api/analyses";
import type { AnalysisListItem } from "@/types/analysis";
import { AnalysisReviewModal } from "../modals/AnalysisReviewModal";
import type { Analysis } from "../hooks/useLabApprovals";
import { toast } from "sonner";

/* ── helpers ── */
function getStatusVariant(status: string) {
    if (status === "DataEntered") return "secondary";
    if (status === "TechReview") return "secondary";
    if (status === "Approved") return "success";
    if (status === "ReTest") return "destructive";
    return "outline";
}

function getStatusText(status: string) {
    if (status === "DataEntered") return "Chờ soát xét";
    if (status === "TechReview") return "Chờ duyệt QA";
    if (status === "Approved") return "Đã duyệt";
    if (status === "ReTest") return "Cần làm lại";
    if (status === "Testing") return "Đang TN";
    return status;
}

export function LabManagerApprovals() {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState("data-entered");
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const statusFilter = useMemo(() => {
        if (activeTab === "data-entered") return ["DataEntered"];
        if (activeTab === "tech-review") return ["TechReview"];
        if (activeTab === "retest") return ["ReTest"];
        return ["DataEntered"];
    }, [activeTab]);

    const {
        data: analysesRes,
        isLoading,
        refetch,
    } = useAnalysesList({
        query: {
            analysisStatus: statusFilter as unknown as "Pending",
            sortColumn: "createdAt",
            sortDirection: "DESC",
            search: debouncedSearch || undefined,
            itemsPerPage,
            page,
        },
    });

    const analysesList = useMemo(() => analysesRes?.data ?? [], [analysesRes?.data]);
    const meta = analysesRes?.meta;

    const { mutate: bulkUpdate, isPending: isUpdating } = useAnalysesUpdateBulk();
    const { mutate: singleUpdate } = useUpdateAnalysis();

    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
        setSearch("");
    }, [activeTab]);

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? analysesList.map((a: AnalysisListItem) => a.analysisId) : []);
    };

    const handleSelectOne = (checked: boolean, id: string) => {
        setSelectedIds((prev) => checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id));
    };

    const handleBulkApprove = () => {
        if (!selectedIds.length) return;
        const newStatus = activeTab === "data-entered" ? "TechReview" : "Approved";
        const payload = selectedIds.map((id) => ({ analysisId: id, analysisStatus: newStatus as "TechReview" }));
        bulkUpdate({ body: payload }, { onSuccess: () => { setSelectedIds([]); refetch(); toast.success(`Đã duyệt ${payload.length} chỉ tiêu`); } });
    };

    const handleBulkReject = () => {
        if (!selectedIds.length) return;
        const payload = selectedIds.map((id) => ({ analysisId: id, analysisStatus: "Testing" as const }));
        bulkUpdate({ body: payload }, { onSuccess: () => { setSelectedIds([]); refetch(); toast.success(`Đã trả lại ${payload.length} chỉ tiêu`); } });
    };

    const handleViewDetail = (item: AnalysisListItem) => {
        const ext = item as any;
        setSelectedAnalysis({
            analysisId: ext.analysisId,
            receiptId: ext.receiptId || "",
            sampleId: ext.sampleId,
            parameterName: ext.parameterName || "",
            protocolCode: ext.protocolCode || "",
            resultValue: ext.resultValue || "-",
            resultUnit: ext.resultUnit || "",
            analysisResultStatus: ext.analysisResultStatus || "",
            analysisNotes: ext.analysisNotes || "",
            analysisStatus: ext.analysisStatus,
            submitLastResultAt: ext.submitLastResultAt || ext.createdAt,
            labTestFileId: ext.labTestFileId,
            technicianName: ext.technician?.identityName,
            technicianAlias: ext.technician?.alias,
        });
        setModalOpen(true);
    };

    const handleModalApprove = async (analysisId: string) => {
        setProcessing(true);
        const newStatus = activeTab === "data-entered" ? "TechReview" : "Approved";
        singleUpdate({ body: { analysisId, analysisStatus: newStatus as "TechReview" } }, { onSuccess: () => { setModalOpen(false); refetch(); toast.success("Đã duyệt"); }, onSettled: () => setProcessing(false) });
    };

    const handleModalReject = async (analysisId: string, reason: string) => {
        if (!reason.trim()) { toast.warning("Vui lòng nhập lý do"); return; }
        setProcessing(true);
        singleUpdate({ body: { analysisId, analysisStatus: "Testing", analysisNotes: reason } }, { onSuccess: () => { setModalOpen(false); refetch(); toast.success("Đã trả lại"); }, onSettled: () => setProcessing(false) });
    };

    const handleQuickApprove = (analysisId: string) => {
        const newStatus = activeTab === "data-entered" ? "TechReview" : "Approved";
        singleUpdate({ body: { analysisId, analysisStatus: newStatus as "TechReview" } }, { onSuccess: () => { refetch(); toast.success("Duyệt thành công"); } });
    };

    const approveLabel = activeTab === "data-entered" ? "Duyệt soát xét" : activeTab === "tech-review" ? "Duyệt chốt (QA)" : "Phân công lại";
    const modalMode = activeTab === "data-entered" ? "DataEntered" : "TechReview";

    return (
        <div className="flex h-full flex-col gap-4 p-6 bg-background space-y-4">
            {/* Header Card */}
            <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-start gap-4 shadow-sm">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Kiểm soát & Duyệt kết quả</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Xin chào, <span className="font-semibold text-foreground">{user?.identityName || "Quản lý"}</span>. Soát xét và duyệt chốt kết quả phân tích.
                    </p>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 border bg-muted/30 p-2 rounded-md">
                    <span className="text-sm font-medium mr-2">Thao tác:</span>
                    <Button size="sm" variant="secondary" disabled={selectedIds.length === 0 || activeTab === "retest" || isUpdating} onClick={handleBulkApprove} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {approveLabel} ({selectedIds.length})
                    </Button>
                    <Button size="sm" variant="outline" disabled={selectedIds.length === 0 || activeTab === "retest" || isUpdating} onClick={handleBulkReject} className="border-rose-200 text-rose-600 hover:bg-rose-50">
                        <XCircle className="w-4 h-4 mr-2" />
                        Làm lại ({selectedIds.length})
                    </Button>
                </div>
            </div>

            {/* Tabs + Search */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full grid-cols-3 md:w-[550px]">
                        <TabsTrigger value="data-entered">Chờ soát xét (Leader)</TabsTrigger>
                        <TabsTrigger value="tech-review">Chờ duyệt chốt (QA)</TabsTrigger>
                        <TabsTrigger value="retest">Cần làm lại</TabsTrigger>
                    </TabsList>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Tìm mã mẫu, chỉ tiêu, phương pháp..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 shadow-sm" />
                    </div>
                </div>

                {/* Table */}
                <div className="border-border/50 bg-card z-10 flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm relative">
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                                <TableRow>
                                    <TableHead className="w-12 "><Checkbox checked={analysesList.length > 0 && selectedIds.length === analysesList.length} onCheckedChange={handleSelectAll} /></TableHead>
                                    <TableHead className="w-16 ">STT</TableHead>
                                    <TableHead className="min-w-[120px]">Mã mẫu</TableHead>
                                    <TableHead className="min-w-[180px]">Chỉ tiêu</TableHead>
                                    <TableHead className="min-w-[140px]">Phương pháp</TableHead>
                                    <TableHead className="min-w-[100px] ">Kết quả</TableHead>
                                    <TableHead className="w-[80px] ">Đơn vị</TableHead>
                                    <TableHead className="min-w-[140px]">Người phụ trách</TableHead>
                                    <TableHead className="min-w-[140px]">Nhóm thực hiện</TableHead>
                                    <TableHead className="w-[120px] ">Trạng thái</TableHead>
                                    <TableHead className="w-[100px] ">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={11} className="h-40 text-center"><Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
                                ) : analysesList.length === 0 ? (
                                    <TableRow><TableCell colSpan={11} className="text-muted-foreground h-40 text-center">Không có dữ liệu</TableCell></TableRow>
                                ) : (
                                    analysesList.map((baseItem: AnalysisListItem, index: number) => {
                                        const item = baseItem as any;
                                        return (
                                            <TableRow key={item.analysisId} className={`transition-colors ${selectedIds.includes(item.analysisId) ? "bg-primary/5" : ""}`}>
                                                <TableCell className=""><Checkbox checked={selectedIds.includes(item.analysisId)} onCheckedChange={(c) => handleSelectOne(!!c, item.analysisId)} /></TableCell>
                                                <TableCell className="">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                                <TableCell className="font-medium text-primary">{item.sampleId}</TableCell>
                                                <TableCell className="font-semibold">{item.parameterName || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground italic text-xs">{item.protocolCode || "-"}</TableCell>
                                                <TableCell className=" font-mono font-medium text-blue-600">{item.resultValue ?? "-"}</TableCell>
                                                <TableCell className=" text-muted-foreground text-xs">{item.analysisUnit || item.resultUnit || "-"}</TableCell>
                                                <TableCell>{item.technician?.identityName ?? "-"}</TableCell>
                                                <TableCell>{item.technicianGroupName ?? "-"}</TableCell>
                                                <TableCell className=""><Badge variant={getStatusVariant(item.analysisStatus)} className="font-medium whitespace-nowrap">{getStatusText(item.analysisStatus)}</Badge></TableCell>
                                                <TableCell className="">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => handleViewDetail(item)} title="Xem chi tiết"><Eye className="h-4 w-4" /></Button>
                                                        {activeTab !== "retest" && (
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleQuickApprove(item.analysisId)} title="Duyệt nhanh"><CheckCircle2 className="h-4 w-4" /></Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {meta && <Pagination currentPage={page} totalPages={meta.totalPages} itemsPerPage={itemsPerPage} totalItems={meta.total} onPageChange={setPage} onItemsPerPageChange={setItemsPerPage} />}
            </Tabs>

            {selectedAnalysis && (
                <AnalysisReviewModal open={modalOpen} onOpenChange={setModalOpen} analysis={selectedAnalysis} mode={modalMode} onApprove={handleModalApprove} onReject={handleModalReject} loading={processing} />
            )}
        </div>
    );
}
