import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useTranslation } from "react-i18next";
import { DndContext, DragOverlay, closestCenter, pointerWithin, rectIntersection, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable, useDraggable } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, CollisionDetection } from "@dnd-kit/core";
import { AlertCircle, FlaskConical, LayoutGrid, CheckSquare, X } from "lucide-react";

import { useSamplesList, useBulkUpdateSamples } from "@/api/samples";
import { useEnumList } from "@/api/chemical";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

function DraggableSampleCard({ 
    sample, 
    isChecked, 
    onCheckedChange,
    showCheckbox = true
}: { 
    sample: any; 
    isChecked?: boolean; 
    onCheckedChange?: (checked: boolean) => void; 
    showCheckbox?: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: sample.sampleId,
        data: sample,
    });

    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
        touchAction: "none",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => {
                if (showCheckbox && onCheckedChange) {
                    onCheckedChange(!isChecked);
                }
            }}
            className={`flex items-start gap-2 p-2 bg-card border ${isDragging ? "border-primary shadow-md" : "border-border hover:border-primary/50"} rounded-md mb-2 shadow-sm transition-colors cursor-pointer`}
        >
            {/* Grab handle next to checkbox to avoid conflicts with drag start */}
            <div 
                {...listeners}
                {...attributes}
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
            >
                {/* Drag handle icon */}
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm6-12a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2zm0 6a2 2 0 11-2 2 2 2 0 012-2z" />
                </svg>
            </div>

            {/* Checkbox for bulk select */}
            {showCheckbox && (
                <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="mt-1 h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary shrink-0 pointer-events-none"
                />
            )}

            {/* Text description: Code: Name */}
            <div className="flex-1 min-w-0 text-xs leading-relaxed text-foreground font-medium break-all whitespace-normal">
                <span className="text-primary font-bold">{sample.sampleId}: </span>
                {sample.sampleName || "-"}
            </div>
        </div>
    );
}

function DroppableContainer({
    id,
    htmlId,
    className,
    activeClassName,
    children
}: {
    id: string;
    htmlId: string;
    className: string;
    activeClassName: string;
    children: React.ReactNode;
}) {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            id={htmlId}
            className={`${className} ${isOver ? activeClassName : ""}`}
        >
            {children}
        </div>
    );
}

function DroppableZone({ 
    id, 
    name, 
    items, 
    onHeaderClick 
}: { 
    id: string; 
    name: string; 
    items: any[]; 
    type?: string; 
    onHeaderClick?: () => void; 
}) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`p-3 rounded-lg border-2 flex flex-col h-64 overflow-hidden transition-colors ${isOver ? "border-primary bg-primary/5" : "border-dashed border-border/60 bg-muted/20"}`}
        >
            <div 
                onClick={onHeaderClick}
                className="flex items-center justify-between mb-2 cursor-pointer hover:text-primary transition-colors group/header"
            >
                <h3 className="font-medium text-sm text-foreground group-hover/header:text-primary flex items-center gap-1.5 truncate">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground group-hover/header:text-primary shrink-0" />
                    <span className="truncate">{name}</span>
                    <svg className="w-3.5 h-3.5 opacity-0 group-hover/header:opacity-100 transition-opacity ml-1 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                </h3>
                <Badge variant="outline" className="text-xs shrink-0 bg-background group-hover/header:border-primary/35">
                    {items.length}
                </Badge>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 pb-2 space-y-2">
                {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">Thả mẫu vào đây</div>
                ) : (
                    items.map((item) => (
                        <DraggableSampleCard
                            key={item.sampleId}
                            sample={item}
                            showCheckbox={false}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

interface StorageLocationMapProps {
    searchTerm: string;
    currentPage: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (limit: number) => void;
    setTotalPages: (total: number) => void;
    selectedSampleTypeId: string | null;
}

export function StorageLocationMap({
    searchTerm,
    currentPage,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    setTotalPages,
    selectedSampleTypeId,
}: StorageLocationMapProps) {
    const updateMutation = useBulkUpdateSamples();
    const { data: enumData } = useEnumList("sampleStorageLoc");

    // Fallback locations in case API is empty/loading
    const defaultLocations = useMemo(() => [
        { id: "Tu_Lanh_A", name: "Tủ Lạnh A", type: "cold" },
        { id: "Tu_Lanh_B", name: "Tủ Lạnh B", type: "cold" },
        { id: "Tu_Dong_C", name: "Tủ Đông C", type: "frozen" },
        { id: "Ke_Kho_1", name: "Kệ Khô 1", type: "dry" },
        { id: "Ke_Kho_2", name: "Kệ Khô 2", type: "dry" },
    ], []);

    const locations = useMemo(() => {
        if (enumData && Array.isArray(enumData) && enumData.length > 0) {
            return enumData.map((name) => {
                const lower = name.toLowerCase();
                const type = lower.includes("đông") ? "frozen" : lower.includes("lạnh") ? "cold" : "dry";
                const id = name.replace(/\s+/g, "_");
                return { id, name, type };
            });
        }
        return defaultLocations;
    }, [enumData, defaultLocations]);

    // Fetch pending samples (filtered by search and page)
    const pendingInput = useMemo(
        () => ({
            query: {
                page: currentPage,
                itemsPerPage: itemsPerPage,
                search: searchTerm.trim() || null,
                sampleStorageLoc: ["IS NULL"],
                sampleStatus: ["Distributed"],
                sortColumn: "createdAt",
                sortDirection: "DESC",
                ...(selectedSampleTypeId && selectedSampleTypeId !== "all" ? { sampleTypeId: selectedSampleTypeId } : {}),
            },
        }),
        [currentPage, itemsPerPage, searchTerm, selectedSampleTypeId],
    );

    // Fetch retained to show what is already in spots
    const retainedInput = useMemo(
        () => ({
            query: {
                page: 1,
                itemsPerPage: 500,
                sampleStatus: ["Retained"],
                sortColumn: "modifiedAt",
                sortDirection: "DESC",
            },
        }),
        [],
    );

    const pendingQ = useSamplesList(pendingInput);
    const retainedQ = useSamplesList(retainedInput);

    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [retainedItems, setRetainedItems] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [targetBulkLocation, setTargetBulkLocation] = useState<string>("");
    const [activeCabinet, setActiveCabinet] = useState<string | null>(null);

    useEffect(() => {
        if (pendingQ.data?.data) {
            setPendingItems(pendingQ.data.data);
        }
    }, [pendingQ.data?.data]);

    useEffect(() => {
        if (retainedQ.data?.data) {
            setRetainedItems(retainedQ.data.data);
        }
    }, [retainedQ.data?.data]);

    const totalItems = pendingQ.data?.meta?.total ?? 0;
    const totalPages = pendingQ.data?.meta?.totalPages ?? 1;

    useEffect(() => {
        if (pendingQ.data?.meta?.totalPages !== undefined) {
            setTotalPages(pendingQ.data.meta.totalPages);
        }
    }, [pendingQ.data?.meta?.totalPages, setTotalPages]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

    const [activeSample, setActiveSample] = useState<any | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveSample(active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveSample(null);

        if (!over) return;

        const sampleId = active.id as string;
        const targetLocId = over.id as string;

        const sample = pendingItems.find((s) => s.sampleId === sampleId) || retainedItems.find((s) => s.sampleId === sampleId);
        if (!sample) return;

        const sourceLocName = sample.sampleStorageLoc;
        const targetLocName = targetLocId === "unassigned" ? null : (locations.find((l) => l.id === targetLocId)?.name || targetLocId);

        // If it's already in the target, do nothing
        if (sourceLocName === targetLocName) return;
        if (!sourceLocName && targetLocId === "unassigned") return;

        // Clear selection if it was selected
        setSelectedIds((prev) => prev.filter((id) => id !== sampleId));

        if (targetLocId === "unassigned") {
            // Move back to unassigned (null location, Distributed status)
            setRetainedItems((prev) => prev.filter((s) => s.sampleId !== sampleId));
            const updated = { ...sample, sampleStorageLoc: null, sampleStatus: "Distributed" };
            setPendingItems((prev) => {
                if (prev.some((s) => s.sampleId === sampleId)) {
                    return prev.map((s) => (s.sampleId === sampleId ? updated : s));
                }
                return [updated, ...prev];
            });

            try {
                await updateMutation.mutateAsync({
                    sampleIds: [sampleId],
                    updateData: {
                        sampleStorageLoc: null,
                        sampleStatus: "Distributed",
                    },
                });
            } catch (error) {
                // mutation handles rollback via query invalidation
            }
        } else {
            // Move to an assigned location (targetLocName, Retained status)
            setPendingItems((prev) => prev.filter((s) => s.sampleId !== sampleId));
            const updated = { ...sample, sampleStorageLoc: targetLocName, sampleStatus: "Retained" };
            setRetainedItems((prev) => {
                if (prev.some((s) => s.sampleId === sampleId)) {
                    return prev.map((s) => (s.sampleId === sampleId ? updated : s));
                }
                return [updated, ...prev];
            });

            try {
                await updateMutation.mutateAsync({
                    sampleIds: [sampleId],
                    updateData: {
                        sampleStorageLoc: targetLocName,
                        sampleStatus: "Retained",
                    },
                });
            } catch (error) {
                // mutation handles rollback via query invalidation
            }
        }
    };

    const handleBulkMove = async () => {
        if (selectedIds.length === 0 || !targetBulkLocation) return;

        try {
            await updateMutation.mutateAsync({
                sampleIds: selectedIds,
                updateData: {
                    sampleStorageLoc: targetBulkLocation,
                    sampleStatus: "Retained",
                },
            });
            setSelectedIds([]);
            setTargetBulkLocation("");
        } catch (error) {
            // Error managed by mutation hook
        }
    };

    // Prepare location lists
    const itemsByLoc = useMemo(() => {
        const result: Record<string, any[]> = {};
        locations.forEach((loc) => (result[loc.name] = []));
        retainedItems.forEach((item) => {
            const loc = item.sampleStorageLoc;
            if (loc && result[loc] !== undefined) {
                result[loc].push(item);
            }
        });
        return result;
    }, [retainedItems, locations]);

    const isAllSelected = pendingItems.length > 0 && selectedIds.length === pendingItems.length;

    // Custom collision detection: prefer pointerWithin (reliably detects the "unassigned"
    // droppable container when dragging items back from shelves), then fall back to
    // rectIntersection / closestCenter for shelf-to-shelf movement.
    const customCollisionDetection: CollisionDetection = useCallback((args) => {
        const containerId = "unassigned-samples-container";
        const containerEl = document.getElementById(containerId);

        if (containerEl) {
            const rect = containerEl.getBoundingClientRect();

            // 1. Explicitly check if pointer coordinates are within the actual live DOM bounding rect of the left panel
            if (args.pointerCoordinates) {
                const { x, y } = args.pointerCoordinates;
                const padding = 30; // 30px buffer to make dropping easier
                if (
                    x >= rect.left - padding &&
                    x <= rect.right + padding &&
                    y >= rect.top - padding &&
                    y <= rect.bottom + padding
                ) {
                    return [{ id: "unassigned" }];
                }
            }

            // 2. Also check overlapping rect intersection if pointer is not available/detected
            if (args.collisionRect) {
                const activeRect = args.collisionRect;
                const intersectionX = Math.max(
                    0,
                    Math.min(activeRect.left + activeRect.width, rect.right) - Math.max(activeRect.left, rect.left)
                );
                const intersectionY = Math.max(
                    0,
                    Math.min(activeRect.top + activeRect.height, rect.bottom) - Math.max(activeRect.top, rect.top)
                );
                const intersectionArea = intersectionX * intersectionY;
                const activeArea = activeRect.width * activeRect.height;

                // If at least 35% of the active dragged card overlaps the left unassigned panel, trigger unassigned target
                if (intersectionArea > activeArea * 0.35) {
                    return [{ id: "unassigned" }];
                }
            }
        }

        // 3. Fallback to pointerWithin, but prioritize "unassigned" if it is in the detected list
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            const hasUnassigned = pointerCollisions.some((c) => c.id === "unassigned");
            if (hasUnassigned) {
                return [{ id: "unassigned" }];
            }
            return pointerCollisions;
        }

        // 4. Fallback to rectIntersection, prioritizing "unassigned" as well
        const rectCollisions = rectIntersection(args);
        if (rectCollisions.length > 0) {
            const hasUnassigned = rectCollisions.some((c) => c.id === "unassigned");
            if (hasUnassigned) {
                return [{ id: "unassigned" }];
            }
            return rectCollisions;
        }

        // 5. Fallback to closestCenter
        return closestCenter(args);
    }, []);

    if (pendingQ.isError || retainedQ.isError) {
        return (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-2 h-32 mt-4">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p>Không thể tải dữ liệu để kéo thả.</p>
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={customCollisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col md:flex-row gap-6 mt-4 h-[600px]">
                {/* Left side: Unassigned Samples */}
                <DroppableContainer
                    id="unassigned"
                    htmlId="unassigned-samples-container"
                    className="w-full md:w-[400px] flex flex-col bg-muted/30 border rounded-lg overflow-hidden shrink-0 transition-colors"
                    activeClassName="border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                >
                    <div className="p-3 border-b border-border bg-card">
                        <h3 className="font-semibold text-foreground flex justify-between items-center mb-1">
                            <span>Mẫu chưa xếp vị trí</span>
                            <Badge variant="default" className="text-xs h-5 px-1.5">
                                {totalItems}
                            </Badge>
                        </h3>
                        <p className="text-[11px] text-muted-foreground">Kéo mẫu hoặc chọn hàng loạt để đổi vị trí</p>
                    </div>

                    {/* Bulk controls when at least one item is checked */}
                    {pendingItems.length > 0 && (
                        <div className="p-3 border-b border-border bg-card/60 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-semibold text-primary">
                                <span>Đã chọn {selectedIds.length} mẫu</span>
                                <button 
                                    type="button" 
                                    onClick={() => setSelectedIds(isAllSelected ? [] : pendingItems.map(s => s.sampleId))}
                                    className="underline hover:text-primary/80"
                                >
                                    {isAllSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                </button>
                            </div>
                            
                            {selectedIds.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Select value={targetBulkLocation} onValueChange={setTargetBulkLocation}>
                                        <SelectTrigger className="h-8 text-xs bg-background flex-1">
                                            <SelectValue placeholder="-- Chọn vị trí --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc) => (
                                                <SelectItem key={loc.id} value={loc.name} className="text-xs">
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        size="sm" 
                                        className="h-8 text-xs shrink-0" 
                                        disabled={!targetBulkLocation || updateMutation.isPending}
                                        onClick={handleBulkMove}
                                    >
                                        {updateMutation.isPending ? "Chuyển..." : "Chuyển"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <div 
                        className="flex-1 overflow-y-auto p-3 flex flex-col"
                    >
                        {pendingQ.isLoading ? (
                            <div className="text-sm text-center py-4 text-muted-foreground">Đang tải...</div>
                        ) : pendingItems.length === 0 ? (
                            <div className="text-sm text-center py-8 text-muted-foreground h-full flex items-center justify-center flex-col gap-2">
                                <AlertCircle className="h-8 w-8 text-border" />
                                <p>Không có mẫu chờ lưu.</p>
                            </div>
                        ) : (
                            pendingItems.map((item) => (
                                <DraggableSampleCard 
                                    key={item.sampleId} 
                                    sample={item} 
                                    isChecked={selectedIds.includes(item.sampleId)}
                                    onCheckedChange={(checked) => {
                                        setSelectedIds(prev => 
                                            checked 
                                                ? [...prev, item.sampleId] 
                                                : prev.filter(id => id !== item.sampleId)
                                        );
                                    }}
                                />
                            ))
                        )}
                    </div>

                    {/* Pagination control at the bottom of the pending list container */}
                    {!pendingQ.isLoading && !pendingQ.isError && totalItems > 0 && (
                        <div className="shrink-0 border-t border-border overflow-hidden">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={totalItems}
                                onPageChange={onPageChange}
                                onItemsPerPageChange={onItemsPerPageChange}
                                isCompact={true}
                            />
                        </div>
                    )}
                </DroppableContainer>

                {/* Right side: Locations */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min max-h-full overflow-y-auto pr-2">
                    {locations.map((loc) => (
                        <DroppableZone 
                            key={loc.id} 
                            id={loc.id} 
                            name={loc.name} 
                            type={loc.type} 
                            items={itemsByLoc[loc.name] || []} 
                            onHeaderClick={() => setActiveCabinet(loc.name)}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeSample ? (
                    <DraggableSampleCard 
                        sample={activeSample} 
                        isChecked={false} 
                        onCheckedChange={() => {}} 
                        showCheckbox={!activeSample.sampleStorageLoc}
                    />
                ) : null}
            </DragOverlay>

            {activeCabinet && (
                <CabinetDetailModal 
                    cabinetName={activeCabinet}
                    onClose={() => setActiveCabinet(null)}
                />
            )}
        </DndContext>
    );
}

interface CabinetDetailModalProps {
    cabinetName: string;
    onClose: () => void;
}

function CabinetDetailModal({ cabinetName, onClose }: CabinetDetailModalProps) {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const queryInput = useMemo(
        () => ({
            query: {
                page,
                itemsPerPage,
                sampleStorageLoc: [cabinetName],
                sampleStatus: ["Retained"],
                sortColumn: "modifiedAt",
                sortDirection: "DESC",
            },
        }),
        [cabinetName, page, itemsPerPage],
    );

    const { data, isLoading, isError } = useSamplesList(queryInput);
    const items = data?.data ?? [];
    const totalItems = data?.meta?.total ?? 0;
    const totalPages = data?.meta?.totalPages ?? 1;

    const toDash = (v: unknown) => {
        if (typeof v === "string") return v.trim() || "-";
        if (v == null) return "-";
        return String(v);
    };

    return (
        <DialogPrimitive.Root open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/50" />
                <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[101] w-[90vw] h-[90vh] max-w-7xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-xl shadow-lg outline-none flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
                        <div className="min-w-0">
                            <DialogPrimitive.Title className="text-lg font-bold text-foreground flex items-center gap-2">
                                <span>Chi tiết vị trí: {cabinetName}</span>
                                <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                                    {totalItems} mẫu lưu
                                </Badge>
                            </DialogPrimitive.Title>
                            <p className="text-xs text-muted-foreground mt-0.5">Danh sách các mẫu đang được lưu trữ tại vị trí này</p>
                        </div>
                        <DialogPrimitive.Close asChild>
                            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng">
                                <X className="h-4 w-4" />
                            </Button>
                        </DialogPrimitive.Close>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden p-4 flex flex-col min-h-0 bg-muted/10">
                        {isError ? (
                            <div className="flex-1 flex items-center justify-center text-destructive flex-col gap-2">
                                <AlertCircle className="h-8 w-8" />
                                <p className="font-semibold">Không thể tải danh sách mẫu</p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                                <span>Đang tải dữ liệu...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
                                <AlertCircle className="h-8 w-8 text-border" />
                                <p>Không có mẫu nào đang lưu trữ ở vị trí này</p>
                            </div>
                        ) : (
                            <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col min-h-0 shadow-sm">
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full min-w-4xl border-collapse">
                                        <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Mã Mẫu</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Tên Mẫu</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Loại Sản Phẩm</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">ĐK Bảo Quản</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Thời gian cập nhật</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {items.map((row) => (
                                                <tr key={row.sampleId} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-semibold text-primary">{row.sampleId}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{toDash((row as any).sampleName)}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{toDash((row as any).productType || row.sampleTypeName)}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">{toDash((row as any).samplePreservation)}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {(row as any).modifiedAt ? new Date((row as any).modifiedAt).toLocaleString("vi-VN") : "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="shrink-0 border-t border-border pt-2 pb-2">
                                    <Pagination
                                        currentPage={page}
                                        totalPages={totalPages}
                                        itemsPerPage={itemsPerPage}
                                        totalItems={totalItems}
                                        onPageChange={setPage}
                                        onItemsPerPageChange={setItemsPerPage}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
