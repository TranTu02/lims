import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, PenLine, Loader2 } from "lucide-react";

import { useAnalysesList } from "@/api/analyses";
import type { AnalysisListItem } from "@/types/analysis";
import { useDebounce } from "@/hooks/useDebounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TechnicianAssignmentModal } from "./TechnicianAssignmentModal";

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

export function TechnicianAssignmentManagement() {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const { data: analysesRes, isLoading: isAnalysesLoading } = useAnalysesList({
        query: {
            analysisStatus: ["Pending", "Ready"] as unknown as "Pending", // satisfying API typing
            listOption: "full" as unknown as "minimal", // satisfying API typing
            sortColumn: "parameterName",
            sortDirection: "DESC",
            search: debouncedSearch || undefined,
            itemsPerPage,
            page,
        },
    });

    const analysesList = useMemo(() => analysesRes?.data ?? [], [analysesRes?.data]);
    const meta = analysesRes?.meta;

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showModal, setShowModal] = useState(false);

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

            // Find row under mouse
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

    useEffect(() => {
        // Option to reset selection on list change (kept empty for now unless asked)
    }, [analysesList]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(analysesList.map((a: { analysisId: string }) => a.analysisId));
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
        if (e.button !== 0) return; // Only left click
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

            <div className="flex items-center gap-2">
                <div className="text-muted-foreground relative max-w-sm flex-1">
                    <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                    <Input
                        type="search"
                        placeholder={t("handover.placeholder.sample")}
                        className="pl-8"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div ref={containerRef} className="border-border/50 bg-card z-10 flex flex-1 flex-col overflow-hidden rounded-lg border">
                <div className="flex-1 overflow-auto">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    <Checkbox checked={analysesList.length > 0 && selectedIds.length === analysesList.length} onCheckedChange={handleSelectAll} aria-label="Select all" />
                                </TableHead>
                                <TableHead className="w-16 text-center">{t("handover.table.stt")}</TableHead>
                                <TableHead className="min-w-[120px]">{t("handover.info.sampleCode")}</TableHead>
                                <TableHead className="min-w-[150px]">{t("handover.table.parameter")}</TableHead>
                                <TableHead className="min-w-[150px]">{t("assignment.assignedTechnician")}</TableHead>
                                <TableHead className="min-w-[150px]">{t("assignment.assignedGroup")}</TableHead>
                                <TableHead className="min-w-[150px]">{t("assignment.relatedTechnicians")}</TableHead>
                                <TableHead className="w-[120px] text-center">Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isAnalysesLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <Loader2 className="text-primary mx-auto h-8 w-8 animate-spin" />
                                    </TableCell>
                                </TableRow>
                            ) : analysesList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-muted-foreground h-40 text-center">
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
                                    const relatedKTVs = item.technicians?.length ? item.technicians.map((t) => t.identityName).join(", ") : "-";
                                    return (
                                        <TableRow
                                            key={item.analysisId}
                                            data-analysis-id={item.analysisId}
                                            onMouseDown={(e) => handleMouseDownRow(item.analysisId, e)}
                                            className="select-none cursor-pointer"
                                        >
                                            <TableCell className="text-center">
                                                <Checkbox className="pointer-events-none" checked={selectedIds.includes(item.analysisId)} />
                                            </TableCell>
                                            <TableCell className="text-center">{(page - 1) * itemsPerPage + index + 1}</TableCell>
                                            <TableCell className="font-medium">{item.sample?.sampleCode || item.sampleId}</TableCell>
                                            <TableCell>{item.parameterName}</TableCell>
                                            <TableCell>{assignedKTV}</TableCell>
                                            <TableCell>{assignedGroup}</TableCell>
                                            <TableCell>{relatedKTVs}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={getStatusVariant(item.analysisStatus)} className="font-medium">
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
                    onSuccess={() => {
                        setShowModal(false);
                        setSelectedIds([]);
                    }}
                />
            )}

            {selectionBox?.active && (
                <div
                    className="bg-primary/20 border-primary fixed z-50 pointer-events-none border"
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
