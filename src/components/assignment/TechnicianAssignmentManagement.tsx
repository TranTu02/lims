import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, PenLine, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

import { useAnalysesList } from "@/api/analyses";
import { useIdentitiesList } from "@/api/identities";
import { useIdentityGroupsList } from "@/api/identityGroups";
import type { AnalysisListItem } from "@/types/analysis";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterPopover } from "@/components/lab-manager/FilterPopover";
import { TechnicianAssignmentModal } from "./TechnicianAssignmentModal";

type SortDir = "ASC" | "DESC";

function getStatusVariant(status: string) {
    if (status === "Pending") return "warning";
    if (status === "Ready") return "success";
    return "secondary";
}

function getStatusText(status: string) {
    if (status === "Pending") return "Chờ xử lý";
    if (status === "Ready") return "Sẵn sàng";
    return status;
}

/** Sortable column header */
function SortableHead({
    label,
    column,
    sortColumn,
    sortDir,
    onSort,
    className,
}: {
    label: string;
    column: string;
    sortColumn: string;
    sortDir: SortDir;
    onSort: (col: string) => void;
    className?: string;
}) {
    const isActive = sortColumn === column;
    return (
        <TableHead
            className={`cursor-pointer select-none hover:bg-muted/70 transition-colors ${className ?? ""}`}
            onClick={() => onSort(column)}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                {isActive ? (
                    sortDir === "ASC" ? (
                        <ArrowUp className="h-3 w-3 text-primary shrink-0" />
                    ) : (
                        <ArrowDown className="h-3 w-3 text-primary shrink-0" />
                    )
                ) : (
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}
            </div>
        </TableHead>
    );
}

export function TechnicianAssignmentManagement() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    // Sort state — click cycles: none→ASC→DESC→none (reset to default)
    const DEFAULT_SORT_COL = "parameterName";
    const DEFAULT_SORT_DIR: SortDir = "DESC";
    const [sortColumn, setSortColumn] = useState(DEFAULT_SORT_COL);
    const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_SORT_DIR);

    const handleSort = useCallback((col: string) => {
        setSortColumn(prev => {
            if (prev === col) return col; // keep column, toggle dir below
            setSortDir("ASC");
            return col;
        });
        setSortDir(prev => {
            if (sortColumn !== col) return "ASC";
            if (prev === "ASC") return "DESC";
            // DESC → reset to default
            setSortColumn(DEFAULT_SORT_COL);
            return DEFAULT_SORT_DIR;
        });
        setPage(1);
    }, [sortColumn]);

    // Filter state
    const [technicianId, setTechnicianId] = useState<string | null>(null);
    const [technicianIds, setTechnicianIds] = useState<string | null>(null);
    const [technicianGroupId, setTechnicianGroupId] = useState<string | null>(null);

    // NULL/NOT-NULL sentinel options
    const nullOptions = [
        { value: "IS NOT NULL", label: "✓ Đã phân công" },
        { value: "IS NULL",     label: "✗ Chưa phân công" },
    ];

    // Filter option APIs
    const { data: techRes, isLoading: isTechLoading } = useIdentitiesList({
        query: { identityRoles: ["ROLE_TECHNICIAN"], identityStatus: ["active"], itemsPerPage: 100 }
    });
    const techsOptions = useMemo(() => [
        ...nullOptions,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(techRes?.data ?? []).map((tech: any) => ({ value: tech.identityId, label: tech.identityName })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [techRes?.data]);

    const { data: groupsRes, isLoading: isGroupsLoading } = useIdentityGroupsList({
        query: { identityGroupMainRole: ["ROLE_TECHNICIAN"], option: "full", itemsPerPage: 100 }
    });
    const groupsOptions = useMemo(() => [
        ...nullOptions,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(groupsRes?.data ?? []).map((g: any) => ({ value: g.identityGroupId, label: g.identityGroupName })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [groupsRes?.data]);

    const { data: analysesRes, isLoading: isAnalysesLoading } = useAnalysesList({
        query: {
            analysisStatus: ["Pending", "Ready"] as unknown as "Pending",
            listOption: "full" as unknown as "minimal",
            sortColumn,
            sortDirection: sortDir,
            search: debouncedSearch || undefined,
            technicianId: technicianId ? [technicianId] : undefined,
            technicianIds: technicianIds ? [technicianIds] : undefined,
            technicianGroupId: technicianGroupId ? [technicianGroupId] : undefined,
            itemsPerPage,
            page,
        },
    });

    const analysesList = useMemo(() => analysesRes?.data ?? [], [analysesRes?.data]);
    const meta = analysesRes?.meta;

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
        setSelectedIds([]);
    }, [debouncedSearch, technicianId, technicianIds, technicianGroupId]);

    // Drag-to-select
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
            setSelectionBox((prev) => prev ? { ...prev, endX: e.clientX, endY: e.clientY } : null);
            const element = document.elementFromPoint(e.clientX, e.clientY);
            const row = element?.closest("tr");
            const id = row?.getAttribute("data-analysis-id");
            if (id && dragStartId) updateSelectionRange(dragStartId, id, selectionMode);
        };
        const handleMouseUp = () => { setIsSelecting(false); setSelectionBox(null); setDragStartId(null); };
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
        setSelectedIds(checked ? analysesList.map((a: { analysisId: string }) => a.analysisId) : []);
    };

    const handleSelectOne = (checked: boolean, id: string) => {
        setSelectedIds(prev => checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter(x => x !== id));
    };

    const handleMouseDownRow = (id: string, e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setIsSelecting(true);
        setDragStartId(id);
        setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY, active: true });
        const willSelect = !selectedIds.includes(id);
        setSelectionMode(willSelect ? "select" : "deselect");
        handleSelectOne(willSelect, id);
    };

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex w-full items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("assignment.title")}</h1>
                    <p className="text-muted-foreground text-sm">{t("assignment.description")}</p>
                </div>
                <Button onClick={() => setShowModal(true)} disabled={selectedIds.length === 0}>
                    <PenLine className="mr-2 h-4 w-4" />
                    {t("assignment.button")} {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                </Button>
            </div>

            {/* Search + active filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="text-muted-foreground relative max-w-sm flex-1">
                    <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                    <Input
                        type="search"
                        placeholder={t("handover.placeholder.sample")}
                        className="pl-8"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                {/* Active filter pills */}
                {technicianId && (
                    <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer" onClick={() => setTechnicianId(null)}>
                        KTV: {techsOptions.find(o => o.value === technicianId)?.label ?? technicianId}
                        <span className="ml-1 opacity-60">×</span>
                    </Badge>
                )}
                {technicianIds && (
                    <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer" onClick={() => setTechnicianIds(null)}>
                        Liên quan: {techsOptions.find(o => o.value === technicianIds)?.label ?? technicianIds}
                        <span className="ml-1 opacity-60">×</span>
                    </Badge>
                )}
                {technicianGroupId && (
                    <Badge variant="secondary" className="gap-1 pr-1 cursor-pointer" onClick={() => setTechnicianGroupId(null)}>
                        Nhóm: {groupsOptions.find(o => o.value === technicianGroupId)?.label ?? technicianGroupId}
                        <span className="ml-1 opacity-60">×</span>
                    </Badge>
                )}
            </div>

            <div ref={containerRef} className="border-border/50 bg-card z-10 flex flex-1 flex-col overflow-hidden rounded-lg border">
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    <Checkbox
                                        checked={analysesList.length > 0 && selectedIds.length === analysesList.length}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-16 text-center">{t("handover.table.stt")}</TableHead>
                                <SortableHead label={t("handover.info.sampleCode")} column="sampleId" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="min-w-[120px]" />
                                <SortableHead label={t("handover.table.parameter")} column="parameterName" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="min-w-[150px]" />

                                {/* Filterable: KTV phụ trách */}
                                <TableHead className="min-w-[150px] p-0 align-middle">
                                    <FilterPopover
                                        title={t("assignment.assignedTechnician")}
                                        value={technicianId}
                                        options={techsOptions}
                                        onSelect={setTechnicianId}
                                        isLoading={isTechLoading}
                                    />
                                </TableHead>

                                {/* Filterable: Nhóm phụ trách */}
                                <TableHead className="min-w-[150px] p-0 align-middle">
                                    <FilterPopover
                                        title={t("assignment.assignedGroup")}
                                        value={technicianGroupId}
                                        options={groupsOptions}
                                        onSelect={setTechnicianGroupId}
                                        isLoading={isGroupsLoading}
                                    />
                                </TableHead>

                                {/* Filterable: KTV liên quan */}
                                <TableHead className="min-w-[150px] p-0 align-middle">
                                    <FilterPopover
                                        title={t("assignment.relatedTechnicians")}
                                        value={technicianIds}
                                        options={techsOptions}
                                        onSelect={setTechnicianIds}
                                        isLoading={isTechLoading}
                                    />
                                </TableHead>

                                <SortableHead label="Trạng thái" column="analysisStatus" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} className="w-[120px] text-center" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isAnalysesLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-40 text-center">
                                        <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : analysesList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-muted-foreground h-40 text-center">
                                        Không có dữ liệu
                                    </TableCell>
                                </TableRow>
                            ) : (
                                analysesList.map((baseItem: AnalysisListItem, index: number) => {
                                    const item = baseItem as AnalysisListItem & {
                                        technician?: { identityName?: string };
                                        sample?: { sampleCode?: string };
                                        technicianGroupId?: string;
                                        technicianGroupName?: string;
                                    };
                                    const assignedKTV = item.technician?.identityName ?? "-";
                                    const assignedGroup = item.technicianGroupName ?? "-";
                                    const relatedKTVs = item.technicians?.length
                                        ? item.technicians.map((t) => t.identityName).join(", ")
                                        : "-";
                                    return (
                                        <TableRow
                                            key={item.analysisId}
                                            data-analysis-id={item.analysisId}
                                            onMouseDown={(e) => handleMouseDownRow(item.analysisId, e)}
                                            className={`select-none cursor-pointer transition-colors ${selectedIds.includes(item.analysisId) ? "bg-primary/5" : ""}`}
                                        >
                                            <TableCell className="text-center">
                                                <Checkbox className="pointer-events-none" checked={selectedIds.includes(item.analysisId)} />
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-muted-foreground">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                            <TableCell className="font-medium text-primary text-xs break-all">{item.sample?.sampleCode || item.sampleId}</TableCell>
                                            <TableCell className="font-medium text-sm break-words whitespace-normal">{item.parameterName ?? "-"}</TableCell>
                                            <TableCell className="text-sm break-words whitespace-normal">{assignedKTV}</TableCell>
                                            <TableCell className="text-sm break-words whitespace-normal">
                                                {assignedGroup !== "-" ? (
                                                    <Badge variant="outline" className="text-xs bg-muted/40 whitespace-nowrap font-normal">{assignedGroup}</Badge>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground break-words whitespace-normal">{relatedKTVs}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={getStatusVariant(item.analysisStatus) as any} className="font-medium">
                                                    {getStatusText(item.analysisStatus)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                {meta && (
                    <Pagination currentPage={page} totalPages={meta.totalPages} itemsPerPage={itemsPerPage} totalItems={meta.total} onPageChange={setPage} onItemsPerPageChange={setItemsPerPage} />
                )}
            </div>

            {showModal && (
                <TechnicianAssignmentModal
                    open={showModal}
                    onOpenChange={setShowModal}
                    selectedAnalysisIds={selectedIds}
                    onSuccess={() => { setShowModal(false); setSelectedIds([]); }}
                />
            )}

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
        </div>
    );
}
