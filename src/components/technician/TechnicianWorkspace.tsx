import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, FastForward, FlaskConical, PenLine, Beaker, FilePenLine, RotateCcw, RefreshCw, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalysesProcessing, useAnalysesUpdateBulk } from "@/api/analyses";
import { useIdentityGroupsList } from "@/api/identityGroups";
import { FilterPopover } from "@/components/lab-manager/FilterPopover";
import type { AnalysisListItem } from "@/types/analysis";
import { TechnicianAssignmentModal } from "@/components/assignment/TechnicianAssignmentModal";
import { TechnicianBulkEntryModal } from "@/components/technician/TechnicianBulkEntryModal";
import { TestProtocolEditor } from "@/components/technician/TestProtocolEditor";
import { TechnicianChemicalRequestsTab } from "@/components/technician/TechnicianChemicalRequestsTab";
import { TechnicianChemicalAllocationModal } from "@/components/technician/TechnicianChemicalAllocationModal";
import { DocumentPreviewButton } from "@/components/document/DocumentPreviewButton";
import { HelpBubble } from "@/components/inventory/chemical/HelpBubble";
import { convertResultToHtml } from "@/utils/resultHtml";

// function getStatusVariant(status: string) {
//     if (status === "Pending") return "warning";
//     if (status === "Ready") return "success";
//     if (status === "HandedOver") return "secondary";
//     if (status === "Testing") return "default";
//     if (status === "ReTest") return "destructive";
//     if (status === "Complained") return "destructive";
//     if (status === "DataEntered" || status === "TechReview") return "secondary";
//     return "outline";
// }

// function getStatusText(status: string) {
//     if (status === "Pending") return "Chờ xử lý";
//     if (status === "Ready") return "Sẵn sàng";
//     if (status === "HandedOver") return "Đã nhận bàn giao";
//     if (status === "Testing") return "Đang thử nghiệm";
//     if (status === "DataEntered") return "Đã nhập KQ";
//     if (status === "TechReview") return "Chờ soát xét";
//     if (status === "ReTest") return "Cần làm lại";
//     if (status === "Complained") return "Khiếu nại";
//     return status;
// }

export function TechnicianWorkspace() {
    const { user, isAdmin } = useAuth();
    const { t } = useTranslation();

    // Check if user is a manager of any group. For now, checking roles.
    const isManager = isAdmin;

    const [activeTab, setActiveTab] = useState("pending"); // pending, testing, retest
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const [technicianGroupId, setTechnicianGroupId] = useState<string | null>(null);

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

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showBulkEntryModal, setShowBulkEntryModal] = useState(false);
    const [showChemicalModal, setShowChemicalModal] = useState(false);
    const [selectedBulkAnalyses, setSelectedBulkAnalyses] = useState<AnalysisListItem[]>([]);
    const [selectedAnalysesForProtocol, setSelectedAnalysesForProtocol] = useState<AnalysisListItem[]>([]);
    const [showProtocolEditor, setShowProtocolEditor] = useState(false);

    // Filter bases on tab
    const statusFilter = useMemo(() => {
        if (activeTab === "pending") return ["Pending", "Ready"];
        if (activeTab === "handedover") return ["HandedOver"];
        if (activeTab === "testing") return ["Testing"];
        if (activeTab === "data-entered") return ["DataEntered"];
        if (activeTab === "retest") return ["ReTest"];
        return ["Testing"]; // fallback
    }, [activeTab]);

    const {
        data: analysesRes,
        isLoading: isAnalysesLoading,
        refetch,
    } = useAnalysesProcessing({
        query: {
            analysisStatus: statusFilter as unknown as "Pending", // send as array
            sortColumn: "createdAt",
            sortDirection: "DESC",
            search: debouncedSearch || undefined,
            technicianGroupId: technicianGroupId ? [technicianGroupId] : undefined,
            itemsPerPage,
            page,
        },
    });

    const analysesList = useMemo(() => analysesRes?.data ?? [], [analysesRes?.data]);
    const meta = analysesRes?.meta;

    const { mutate: bulkUpdate, isPending: isUpdating } = useAnalysesUpdateBulk();

    // Reset selection when tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
        setSearch("");
    }, [activeTab, technicianGroupId]);

    // Drag-to-select state and logic
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionMode, setSelectionMode] = useState<"select" | "deselect">("select");
    const [dragStartId, setDragStartId] = useState<string | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number; active: boolean } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const updateSelectionRange = useCallback(
        (startId: string, endId: string, mode: "select" | "deselect") => {
            const startIndex = analysesList.findIndex((a: AnalysisListItem) => a.analysisId === startId);
            const endIndex = analysesList.findIndex((a: AnalysisListItem) => a.analysisId === endId);
            if (startIndex === -1 || endIndex === -1) return;

            const start = Math.min(startIndex, endIndex);
            const end = Math.max(startIndex, endIndex);
            const rangeIds = analysesList.slice(start, end + 1).map((a: AnalysisListItem) => a.analysisId);

            if (mode === "select") {
                setSelectedIds((prev) => Array.from(new Set([...prev, ...rangeIds])));
            } else {
                setSelectedIds((prev) => prev.filter((x) => !rangeIds.includes(x)));
            }
        },
        [analysesList],
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isSelecting) return;

            setSelectionBox((prev) => {
                if (!prev) return null;
                return { ...prev, endX: e.clientX, endY: e.clientY };
            });

            const element = document.elementFromPoint(e.clientX, e.clientY);
            const row = element?.closest("tr");
            const id = row?.getAttribute("data-analysis-id");
            if (id && dragStartId) {
                updateSelectionRange(dragStartId, id, selectionMode);
            }
        };

        const handleMouseUp = () => {
            setIsSelecting(false);
            setSelectionBox(null);
            setDragStartId(null);
        };

        if (isSelecting) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isSelecting, selectionMode, dragStartId, updateSelectionRange]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(analysesList.map((a: AnalysisListItem) => a.analysisId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (checked: boolean, id: string) => {
        if (checked) {
            setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
        } else {
            setSelectedIds((prev) => prev.filter((x) => x !== id));
        }
    };

    const handleMouseDownRow = (id: string, e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsSelecting(true);
        setDragStartId(id);
        setSelectionBox({
            startX: e.clientX,
            startY: e.clientY,
            endX: e.clientX,
            endY: e.clientY,
            active: true,
        });

        const willSelect = !selectedIds.includes(id);
        setSelectionMode(willSelect ? "select" : "deselect");
        handleSelectOne(willSelect, id);
    };

    // Actions
    const handleReceiveSamples = () => {
        if (!selectedIds.length) return;

        const isStarting = activeTab === "handedover";
        const nextStatus = isStarting ? "Testing" : "HandedOver";

        const payload = selectedIds.map((id) => ({
            analysisId: id,
            analysisStatus: nextStatus as any,
            ...(isStarting ? { analysisStartedAt: new Date().toISOString() } : {}),
        }));

        bulkUpdate(
            { body: payload },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                },
            },
        );
    };

    const handleRequestReassignment = () => {
        if (!selectedIds.length) return;

        const payload = selectedIds.map((id) => ({
            analysisId: id,
            analysisStatus: "Ready" as any,
        }));

        bulkUpdate(
            { body: payload },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                },
            },
        );
    };

    const handleOpenBulkEntry = () => {
        const analysesToEnter = analysesList.filter((a: AnalysisListItem) => selectedIds.includes(a.analysisId));
        setSelectedBulkAnalyses(analysesToEnter);
        setShowBulkEntryModal(true);
    };

    const handleOpenProtocolEditor = (singleItem?: AnalysisListItem) => {
        if (singleItem) {
            setSelectedAnalysesForProtocol([singleItem]);
        } else {
            const selected = analysesList.filter((a: AnalysisListItem) => selectedIds.includes(a.analysisId));
            setSelectedAnalysesForProtocol(selected);
        }
        setShowProtocolEditor(true);
    };

    const handleMoveToTesting = () => {
        if (!selectedIds.length) return;
        const payload = selectedIds.map((id) => ({
            analysisId: id,
            analysisStatus: "Testing" as any,
        }));
        bulkUpdate(
            { body: payload },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                },
            },
        );
    };

    const handleSendForReview = () => {
        if (!selectedIds.length) return;
        const payload = selectedIds.map((id) => ({
            analysisId: id,
            analysisStatus: "TechReview" as any,
        }));
        bulkUpdate(
            { body: payload },
            {
                onSuccess: () => {
                    setSelectedIds([]);
                    refetch();
                },
            },
        );
    };

    return (
        <div className="flex h-full flex-col gap-4 p-6 bg-background space-y-4 relative">
            <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-start gap-4 shadow-sm">
                <div className="flex w-full justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">{t("technician.workspace.title", { defaultValue: "Không gian làm việc (KTV)" })}</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            {t("technician.workspace.greeting", { defaultValue: "Xin chào," })}{" "}
                            <span className="font-semibold text-foreground">{user?.identityName || t("technician.workspace.technician", { defaultValue: "Kỹ thuật viên" })}</span>.{" "}
                            {t("technician.workspace.subtitle", { defaultValue: "Quản lý công việc phân công tại đây." })}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isAnalysesLoading} className="bg-background">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isAnalysesLoading ? "animate-spin" : ""}`} />
                        {t("common.refresh", { defaultValue: "Làm mới" })}
                    </Button>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 border bg-muted/30 p-2 rounded-md">
                    <span className="text-sm font-medium mr-2">{t("common.actions", { defaultValue: "Hành động:" })}</span>
                    <Button size="sm" variant="secondary" disabled={selectedIds.length === 0 || (activeTab !== "pending" && activeTab !== "handedover") || isUpdating} onClick={handleReceiveSamples}>
                        <FlaskConical className="w-4 h-4 mr-2" />
                        {activeTab === "handedover"
                            ? t("technician.workspace.startTesting", { defaultValue: "Bắt đầu thử nghiệm" })
                            : t("technician.workspace.receiveSamples", { defaultValue: "Nhận chỉ tiêu" })}{" "}
                        ({selectedIds.length})
                    </Button>

                    <Button size="sm" variant="outline" disabled={selectedIds.length === 0 || isUpdating} onClick={handleRequestReassignment}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {t("technician.workspace.requestResample", { defaultValue: "Xin cấp lại mẫu" })}
                    </Button>

                    <Button size="sm" variant="default" disabled={selectedIds.length === 0 || (activeTab !== "testing" && activeTab !== "retest")} onClick={handleOpenBulkEntry}>
                        <PenLine className="w-4 h-4 mr-2" />
                        {t("technician.workspace.bulkEntry", { defaultValue: "Nhập kết quả lô" })} ({activeTab === "testing" || activeTab === "retest" ? selectedIds.length : 0})
                    </Button>

                    <Button
                        size="sm"
                        variant="outline"
                        disabled={selectedIds.length === 0 || (activeTab !== "testing" && activeTab !== "retest" && activeTab !== "handedover")}
                        onClick={() => setShowChemicalModal(true)}
                    >
                        <Beaker className="w-4 h-4 mr-2" />
                        {t("technician.workspace.suggestChemicals", { defaultValue: "Gợi ý hóa chất FEFO" })}
                    </Button>

                    <Button size="sm" variant="outline" disabled={selectedIds.length === 0 || (activeTab !== "testing" && activeTab !== "retest")} onClick={() => handleOpenProtocolEditor()}>
                        <FilePenLine className="w-4 h-4 mr-2" />
                        {t("technician.workspace.createProtocolBulk", { defaultValue: "Lập biên bản" })} ({activeTab === "testing" || activeTab === "retest" ? selectedIds.length : 0})
                    </Button>

                    {activeTab === "data-entered" && (
                        <>
                            <Button size="sm" variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200" disabled={selectedIds.length === 0 || isUpdating} onClick={handleMoveToTesting}>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                {t("technician.workspace.backToTesting", { defaultValue: "Chuyển về đang thực hiện" })} ({selectedIds.length})
                            </Button>
                            <Button size="sm" variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" disabled={selectedIds.length === 0 || isUpdating} onClick={handleSendForReview}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {t("technician.workspace.sendForReview", { defaultValue: "Gửi duyệt" })} ({selectedIds.length})
                            </Button>
                        </>
                    )}

                    {isManager && (
                        <Button size="sm" variant="outline" className="ml-auto" disabled={selectedIds.length === 0} onClick={() => setShowAssignmentModal(true)}>
                            <FastForward className="w-4 h-4 mr-2" />
                            {t("technician.workspace.handover", { defaultValue: "Bàn giao việc" })}
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full grid-cols-6 md:w-[850px]">
                        <TabsTrigger value="pending">{t("technician.workspace.tabs.pending", { defaultValue: "Chờ nhận" })}</TabsTrigger>
                        <TabsTrigger value="handedover">{t("technician.workspace.tabs.handedover", { defaultValue: "Đã nhận bàn giao" })}</TabsTrigger>
                        <TabsTrigger value="testing">{t("technician.workspace.tabs.testing", { defaultValue: "Đang thử nghiệm" })}</TabsTrigger>
                        <TabsTrigger value="data-entered">{t("technician.workspace.tabs.dataEntered", { defaultValue: "Đã nhập kết quả" })}</TabsTrigger>
                        <TabsTrigger value="retest">{t("technician.workspace.tabs.retest", { defaultValue: "Cần làm lại" })}</TabsTrigger>
                        <TabsTrigger value="chemical-requests">{t("technician.workspace.tabs.chemicalRequests", { defaultValue: "Yêu cầu hóa chất" })}</TabsTrigger>
                    </TabsList>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={
                                activeTab === "chemical-requests"
                                    ? t("inventory.chemical.transactionBlocks.searchPlaceholder", { defaultValue: "Tìm mã phiếu, tham chiếu..." })
                                    : t("technician.workspace.searchPlaceholder", { defaultValue: "Tìm mã mẫu, tên chỉ tiêu..." })
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 shadow-sm"
                        />
                    </div>
                </div>

                {activeTab === "chemical-requests" ? (
                    <TechnicianChemicalRequestsTab search={debouncedSearch} />
                ) : (
                    <>
                        <div ref={containerRef} className="border-border/50 bg-card z-10 flex flex-1 flex-col overflow-hidden rounded-lg border shadow-sm relative">
                            <div className="flex-1 overflow-x-auto overflow-y-auto max-w-full">
                                <Table className="table-fixed w-full">
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                                        <TableRow>
                                            <TableHead className="w-10">
                                                <Checkbox checked={analysesList.length > 0 && selectedIds.length === analysesList.length} onCheckedChange={handleSelectAll} aria-label="Select all" />
                                            </TableHead>
                                            <TableHead className="w-12">{t("common.stt", { defaultValue: "STT" })}</TableHead>
                                            <TableHead className="w-[110px]">{t("technician.workspace.sampleCode", { defaultValue: "Mã mẫu" })}</TableHead>
                                            <TableHead className="w-[160px]">{t("technician.workspace.parameter", { defaultValue: "Chỉ tiêu" })}</TableHead>
                                            <TableHead className="w-[130px]">{t("technician.workspace.protocolCodeCol", { defaultValue: "Phương pháp" })}</TableHead>
                                            <TableHead className="w-[160px]">{t("technician.workspace.result", { defaultValue: "Kết quả" })}</TableHead>
                                            <TableHead className="w-[80px]">{t("technician.workspace.unit", { defaultValue: "Đơn vị" })}</TableHead>
                                            <TableHead className="w-[140px]">{t("technician.workspace.assignee", { defaultValue: "Người phụ trách" })}</TableHead>
                                            <TableHead className="w-[130px] p-0 align-middle">
                                                <FilterPopover 
                                                    title={String(t("technician.workspace.assignedGroup", { defaultValue: "Nhóm thực hiện" }))}
                                                    value={technicianGroupId}
                                                    options={groupsOptions}
                                                    onSelect={setTechnicianGroupId}
                                                    isLoading={isGroupsLoading}
                                                />
                                            </TableHead>
                                            <TableHead className="w-[80px]">{t("common.actions", { defaultValue: "Hành động" })}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isAnalysesLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={10} className="h-40 text-center">
                                                    <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
                                                </TableCell>
                                            </TableRow>
                                        ) : analysesList.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={11} className="text-muted-foreground h-40 text-center">
                                                    {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            analysesList.map((baseItem: AnalysisListItem, index: number) => {
                                                const item = baseItem as AnalysisListItem & {
                                                    technician?: { identityName?: string };
                                                    sample?: { sampleCode?: string };
                                                    technicianGroupName?: string;
                                                    protocolId?: string;
                                                    protocolCode?: string;
                                                    analysisUnit?: string;
                                                };
                                                const assignedKTV = item.technician?.identityName ?? "-";
                                                const assignedGroup = item.technicianGroupName ?? "-";

                                                return (
                                                    <TableRow
                                                        key={item.analysisId}
                                                        data-analysis-id={item.analysisId}
                                                        onMouseDown={(e) => handleMouseDownRow(item.analysisId, e)}
                                                        className={`select-none cursor-pointer transition-colors ${selectedIds.includes(item.analysisId) ? "bg-primary/5" : ""}`}
                                                    >
                                                        <TableCell className="overflow-hidden">
                                                            <Checkbox className="pointer-events-none" checked={selectedIds.includes(item.analysisId)} />
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                                        <TableCell className="font-medium text-primary break-all text-xs">{item.sample?.sampleCode || item.sampleId}</TableCell>
                                                        <TableCell className="font-semibold text-sm break-words whitespace-normal">{item.parameterName || "-"}</TableCell>
                                                        <TableCell className="text-muted-foreground italic text-xs break-all whitespace-normal">{item.protocolCode || "-"}</TableCell>
                                                        <TableCell className="font-medium text-blue-600 break-words whitespace-normal">
                                                            <span
                                                                dangerouslySetInnerHTML={{ __html: item.analysisResult ? convertResultToHtml(String(item.analysisResult)) : "-" }}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-xs break-all whitespace-normal">{item.analysisUnit || "-"}</TableCell>
                                                        <TableCell className="text-sm break-words whitespace-normal">{assignedKTV}</TableCell>
                                                        <TableCell className="text-sm break-words whitespace-normal">{assignedGroup}</TableCell>
                                                        <TableCell className="" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={`h-8 w-8 ${!item.protocolId ? "text-warning hover:text-warning hover:bg-warning/10" : "text-primary hover:text-primary hover:bg-primary/10"}`}
                                                                    onClick={() => handleOpenProtocolEditor(item)}
                                                                    title={t("technician.workspace.createProtocol", { defaultValue: "Lập biên bản thử nghiệm" })}
                                                                >
                                                                    <FilePenLine className="h-4 w-4" />
                                                                </Button>
                                                                {item.analysisDocumentId && (
                                                                    <DocumentPreviewButton
                                                                        documentId={item.analysisDocumentId}
                                                                        className="h-8 w-8 text-blue-600 hover:bg-blue-600/10"
                                                                        variant="ghost"
                                                                    />
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
                        {meta && (
                            <Pagination
                                currentPage={page}
                                totalPages={meta.totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={meta.total}
                                onPageChange={setPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        )}
                    </>
                )}
            </Tabs>

            {selectionBox?.active && (
                <div
                    className="bg-primary/20 border-primary fixed z-50 pointer-events-none border rounded-[2px]"
                    style={{
                        left: Math.min(selectionBox.startX, selectionBox.endX),
                        top: Math.min(selectionBox.startY, selectionBox.endY),
                        width: Math.abs(selectionBox.startX - selectionBox.endX),
                        height: Math.abs(selectionBox.startY - selectionBox.endY),
                    }}
                />
            )}

            {showAssignmentModal && (
                <TechnicianAssignmentModal
                    open={showAssignmentModal}
                    onOpenChange={setShowAssignmentModal}
                    selectedAnalysisIds={selectedIds}
                    onSuccess={() => {
                        setShowAssignmentModal(false);
                        setSelectedIds([]);
                        refetch();
                    }}
                />
            )}

            {showBulkEntryModal && (
                <TechnicianBulkEntryModal
                    open={showBulkEntryModal}
                    onOpenChange={setShowBulkEntryModal}
                    selectedAnalyses={selectedBulkAnalyses}
                    onSuccess={() => {
                        setShowBulkEntryModal(false);
                        setSelectedIds([]);
                        refetch();
                    }}
                />
            )}

            {showChemicalModal && (
                <TechnicianChemicalAllocationModal
                    open={showChemicalModal}
                    onOpenChange={setShowChemicalModal}
                    selectedAnalyses={analysesList.filter((a: AnalysisListItem) => selectedIds.includes(a.analysisId))}
                    onSuccess={() => {
                        setSelectedIds([]);
                        refetch();
                    }}
                />
            )}

            {showProtocolEditor && (
                <TestProtocolEditor
                    open={showProtocolEditor}
                    onOpenChange={(o) => {
                        if (!o) {
                            setShowProtocolEditor(false);
                            setSelectedAnalysesForProtocol([]);
                        }
                    }}
                    analyses={selectedAnalysesForProtocol}
                    onSuccess={() => {
                        setShowProtocolEditor(false);
                        setSelectedAnalysesForProtocol([]);
                        setSelectedIds([]);
                        refetch();
                    }}
                />
            )}
            <HelpBubble guidePath="guide-technician.html" />
        </div>
    );
}
