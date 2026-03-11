import React, { useState, useMemo, useEffect } from "react";
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { AlertCircle, FlaskConical, LayoutGrid } from "lucide-react";

import { useSamplesList, useBulkUpdateSamples } from "@/api/samples";
import { Badge } from "@/components/ui/badge";

// Hardcoded locations for demo
const STORAGE_LOCATIONS = [
    { id: "Tu_Lanh_A", name: "Tủ Lạnh A", type: "cold" },
    { id: "Tu_Lanh_B", name: "Tủ Lạnh B", type: "cold" },
    { id: "Tu_Dong_C", name: "Tủ Đông C", type: "frozen" },
    { id: "Ke_Kho_1", name: "Kệ Khô 1", type: "dry" },
    { id: "Ke_Kho_2", name: "Kệ Khô 2", type: "dry" },
];

function DraggableSampleCard({ sample }: { sample: any }) {
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
            {...listeners}
            {...attributes}
            style={style}
            className={`p-3 bg-card border ${isDragging ? "border-primary shadow-md" : "border-border hover:border-primary/50"} rounded-md cursor-grab active:cursor-grabbing mb-2 shadow-sm transition-colors`}
        >
            <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-primary">{sample.sampleId}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {sample.productType || "-"}
                </Badge>
            </div>
            <div className="text-xs text-foreground font-medium truncate mb-1">{sample.sampleName || "-"}</div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
                <FlaskConical className="h-3 w-3" />
                <span className="truncate">{sample.samplePreservation || "Thường"}</span>
            </div>
        </div>
    );
}

function DroppableZone({ id, name, items }: { id: string; name: string; items: any[]; type?: string }) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`p-3 rounded-lg border-2 flex flex-col h-64 overflow-hidden transition-colors ${isOver ? "border-primary bg-primary/5" : "border-dashed border-border/60 bg-muted/20"}`}
        >
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm text-foreground flex items-center gap-1.5">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                    {name}
                </h3>
                <Badge variant="outline" className="text-xs">
                    {items.length}
                </Badge>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 pb-2 space-y-2">
                {items.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">Thả mẫu vào đây</div>
                ) : (
                    items.map((item) => (
                        <div key={item.sampleId} className="p-2 border border-border bg-card rounded-md shadow-sm opacity-80 text-xs flex justify-between items-center group">
                            <div className="truncate flex-1">
                                <span className="font-medium text-primary mr-2">{item.sampleId}</span>
                                <span className="text-muted-foreground">{item.sampleName || "-"}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export function StorageLocationMap() {
    const updateMutation = useBulkUpdateSamples();

    // Fetch pending samples
    const pendingInput = useMemo(
        () => ({
            query: {
                page: 1,
                itemsPerPage: 100, // Fetch up to 100 for Dnd
                sampleStorageLoc: ["IS NULL"],
                sortColumn: "createdAt",
                sortDirection: "DESC",
            },
        }),
        [],
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

        const sourceLoc = active.data.current?.sampleStorageLoc;
        const targetLocId = over.id as string;
        const sampleId = active.id as string;

        // If it's already in the target (or if we drag from unassigned back to unassigned), do nothing
        if (sourceLoc === targetLocId) return;
        if (!sourceLoc && targetLocId === "unassigned") return;

        // Optimistic UI update
        // We only support moving from Pending (unassigned) -> Retained (assigned) in this view right now
        // To keep it simple, we don't fully support moving between zones for now
        const movedSample = pendingItems.find((s) => s.sampleId === sampleId) || retainedItems.find((s) => s.sampleId === sampleId);

        if (!movedSample) return;

        if (targetLocId !== "unassigned") {
            const locName = STORAGE_LOCATIONS.find((l) => l.id === targetLocId)?.name || targetLocId;
            setPendingItems((prev) => prev.filter((s) => s.sampleId !== sampleId));

            // Call API
            try {
                await updateMutation.mutateAsync({
                    sampleIds: [sampleId],
                    updateData: {
                        sampleStorageLoc: locName,
                        sampleStatus: "Retained",
                    },
                });
            } catch (error) {
                // If it fails, revert UI by invalidating cache handled by useBulkUpdateSamples
            }
        }
    };

    if (pendingQ.isError || retainedQ.isError) {
        return (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-start gap-2 h-32 mt-4">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <p>Không thể tải dữ liệu để kéo thả.</p>
            </div>
        );
    }

    // Prepare location lists
    const itemsByLoc = useMemo(() => {
        const result: Record<string, any[]> = {};
        STORAGE_LOCATIONS.forEach((loc) => (result[loc.name] = []));
        retainedItems.forEach((item) => {
            const loc = item.sampleStorageLoc;
            if (loc && result[loc] !== undefined) {
                result[loc].push(item);
            }
        });
        return result;
    }, [retainedItems]);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col md:flex-row gap-6 mt-4 h-[600px]">
                {/* Left side: Unassigned Samples */}
                <div className="w-full md:w-1/3 flex flex-col bg-muted/30 border border-border rounded-lg overflow-hidden">
                    <div className="p-3 border-b border-border bg-card">
                        <h3 className="font-semibold text-foreground flex justify-between items-center">
                            <span>Mẫu chưa xếp vị trí</span>
                            <Badge variant="default" className="text-xs h-5 px-1.5">
                                {pendingItems.length}
                            </Badge>
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Kéo mẫu từ đây thả vào các vị trí bên phải</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                        {pendingQ.isLoading ? (
                            <div className="text-sm text-center py-4 text-muted-foreground">Đang tải...</div>
                        ) : pendingItems.length === 0 ? (
                            <div className="text-sm text-center py-8 text-muted-foreground h-full flex items-center justify-center flex-col gap-2">
                                <AlertCircle className="h-8 w-8 text-border" />
                                <p>Không có mẫu chờ lưu.</p>
                            </div>
                        ) : (
                            pendingItems.map((item) => <DraggableSampleCard key={item.sampleId} sample={item} />)
                        )}
                    </div>
                </div>

                {/* Right side: Locations */}
                <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min max-h-full overflow-y-auto pr-2">
                    {STORAGE_LOCATIONS.map((loc) => (
                        <DroppableZone key={loc.id} id={loc.id} name={loc.name} type={loc.type} items={itemsByLoc[loc.name] || []} />
                    ))}
                </div>
            </div>

            <DragOverlay>{activeSample ? <DraggableSampleCard sample={activeSample} /> : null}</DragOverlay>
        </DndContext>
    );
}
