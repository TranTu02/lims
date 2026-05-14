/**
 * AnalysesEditableTable.tsx
 * Bảng danh sách chỉ tiêu (analyses) có tích hợp:
 * - Checkbox chọn hàng (select all / deselect all)
 * - Edit inline từng hàng: protocolCode, analysisUnit, KTV (group combobox), hạn trả
 * - Nút "Chỉnh sửa hàng loạt" → mở panel nhập liệu + preview
 * - Gửi API bulk update khi xác nhận
 */

import { useState, useMemo, useCallback } from "react";
import { Edit, X, CheckSquare, Square, Layers, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useIdentityGroupsList } from "@/api/identityGroups";
import { useAnalysesUpdateBulk } from "@/api/analyses";
import { cn } from "@/lib/utils";
import type { ReceiptAnalysis } from "@/types/receipt";

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

// ─── Helpers ───────────────────────────────────────────────────────────────────

type GroupOption = { identityGroupId: string; identityGroupName: string; identityGroupDescription?: string | null };

function GroupSelect({
    value,
    onChange,
    groups,
    isLoading,
    placeholder = "Chọn nhóm KTV...",
    size = "sm",
}: {
    value: string;
    onChange: (groupId: string, groupName: string) => void;
    groups: GroupOption[];
    isLoading?: boolean;
    placeholder?: string;
    size?: "sm" | "xs";
}) {
    const [open, setOpen] = useState(false);
    const selected = groups.find((g) => g.identityGroupId === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    size="sm"
                    className={cn(
                        "justify-between font-normal",
                        size === "xs" ? "h-7 text-[11px] px-2 max-w-[160px]" : "h-8 text-xs w-full"
                    )}
                    disabled={isLoading}
                >
                    <span className="truncate">{selected ? selected.identityGroupName : placeholder}</span>
                    {isLoading ? (
                        <Loader2 className="ml-1 h-3 w-3 animate-spin opacity-50 shrink-0" />
                    ) : (
                        <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 shrink-0" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0 z-[1200]" align="start">
                <Command>
                    <CommandInput placeholder="Tìm nhóm..." className="h-8" />
                    <CommandList>
                        <CommandEmpty>Không tìm thấy nhóm</CommandEmpty>
                        <CommandGroup>
                            {groups.map((g) => (
                                <CommandItem
                                    key={g.identityGroupId}
                                    value={g.identityGroupName}
                                    onSelect={() => {
                                        onChange(g.identityGroupId, g.identityGroupName);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-3 w-3", value === g.identityGroupId ? "opacity-100" : "opacity-0")} />
                                    <div className="flex flex-col">
                                        <span className="text-xs">{g.identityGroupName}</span>
                                        {g.identityGroupDescription && (
                                            <span className="text-[10px] text-muted-foreground">{g.identityGroupDescription}</span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// ─── Bulk Edit Panel ──────────────────────────────────────────────────────────

type BulkValues = {
    protocolCode: string;
    analysisUnit: string;
    technicianGroupId: string;
    technicianGroupName: string;
    analysisDeadline: string;
    analysisLocation: string;
};

function BulkEditPanel({
    selectedAnalyses,
    groups,
    isGroupsLoading,
    onConfirm,
    onCancel,
    isSaving,
}: {
    selectedAnalyses: ReceiptAnalysis[];
    groups: GroupOption[];
    isGroupsLoading: boolean;
    onConfirm: (values: BulkValues) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [vals, setVals] = useState<BulkValues>({
        protocolCode: "",
        analysisUnit: "",
        technicianGroupId: "",
        technicianGroupName: "",
        analysisDeadline: "",
        analysisLocation: "",
    });

    const set = (k: keyof BulkValues, v: string) => setVals((p) => ({ ...p, [k]: v }));

    // Preview = selected analyses với giá trị được ghi đè nếu bulk field không rỗng
    const preview = useMemo(
        () =>
            selectedAnalyses.map((a) => ({
                ...a,
                protocolCode: vals.protocolCode || a.protocolCode,
                analysisUnit: vals.analysisUnit || a.analysisUnit,
                technicianGroupId: vals.technicianGroupId || (a as any).technicianGroupId,
                technicianGroupName: vals.technicianGroupName || (a as any).technicianGroupName,
                analysisDeadline: vals.analysisDeadline ? vals.analysisDeadline : a.analysisDeadline,
                analysisLocation: vals.analysisLocation || a.analysisLocation,
            })),
        [selectedAnalyses, vals]
    );

    return (
        <div className="border border-primary/30 rounded-xl bg-primary/5 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Layers className="h-4 w-4" />
                    Chỉnh sửa hàng loạt
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {selectedAnalyses.length} chỉ tiêu
                    </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0">
                    <X className="h-3.5 w-3.5" />
                </Button>
            </div>

            {/* Input row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Phương pháp</label>
                    <Input
                        className="h-8 text-xs bg-background"
                        placeholder="Để trống = giữ nguyên"
                        value={vals.protocolCode}
                        onChange={(e) => set("protocolCode", e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Đơn vị</label>
                    <Input
                        className="h-8 text-xs bg-background"
                        placeholder="Để trống = giữ nguyên"
                        value={vals.analysisUnit}
                        onChange={(e) => set("analysisUnit", e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Nhóm KTV</label>
                    <GroupSelect
                        value={vals.technicianGroupId}
                        onChange={(id, name) => setVals((p) => ({ ...p, technicianGroupId: id, technicianGroupName: name }))}
                        groups={groups}
                        isLoading={isGroupsLoading}
                        placeholder="Để trống = giữ nguyên"
                        size="sm"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Hạn trả</label>
                    <Input
                        type="date"
                        className="h-8 text-xs bg-background"
                        value={vals.analysisDeadline}
                        onChange={(e) => set("analysisDeadline", e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase font-semibold">Nơi thực hiện</label>
                    <Input
                        className="h-8 text-xs bg-background"
                        placeholder="Để trống = giữ nguyên"
                        value={vals.analysisLocation}
                        onChange={(e) => set("analysisLocation", e.target.value)}
                    />
                </div>
            </div>

            {/* Preview table */}
            <div className="rounded-lg border border-border bg-background overflow-hidden">
                <div className="px-3 py-2 bg-muted/40 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase">
                    Xem trước ({preview.length})
                </div>
                <div className="overflow-x-auto max-h-[240px] overflow-y-auto">
                    <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-muted/30">
                            <tr>
                                {["Mã PT", "Chỉ tiêu", "Phương pháp", "Đơn vị", "Nhóm KTV", "Nơi thực hiện", "Hạn trả"].map((h) => (
                                    <th key={h} className="px-3 py-2 text-left text-[10px] text-muted-foreground font-semibold">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {preview.map((a) => (
                                <tr key={a.analysisId} className="hover:bg-muted/10">
                                    <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">{a.analysisId}</td>
                                    <td className="px-3 py-1.5 font-medium max-w-[160px] truncate">{a.parameterName ?? "—"}</td>
                                    <td className={cn("px-3 py-1.5", vals.protocolCode ? "text-primary font-semibold" : "text-muted-foreground")}>
                                        {a.protocolCode ?? "—"}
                                    </td>
                                    <td className={cn("px-3 py-1.5", vals.analysisUnit ? "text-primary font-semibold" : "text-muted-foreground")}>
                                        {a.analysisUnit ?? "—"}
                                    </td>
                                    <td className={cn("px-3 py-1.5", vals.technicianGroupName ? "text-primary font-semibold" : "text-muted-foreground")}>
                                        {(a as any).technicianGroupName ?? "—"}
                                    </td>
                                    <td className={cn("px-3 py-1.5", vals.analysisLocation ? "text-primary font-semibold" : "text-muted-foreground")}>
                                        {a.analysisLocation ?? "—"}
                                    </td>
                                    <td className={cn("px-3 py-1.5", vals.analysisDeadline ? "text-destructive font-semibold" : "text-muted-foreground")}>
                                        {fmtDate(a.analysisDeadline)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
                    Huỷ
                </Button>
                <Button size="sm" onClick={() => onConfirm(vals)} disabled={isSaving || selectedAnalyses.length === 0}>
                    {isSaving && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                    Xác nhận cập nhật
                </Button>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AnalysesEditableTableProps {
    /** Flat list of analyses (from all samples in the receipt) */
    analyses: Array<ReceiptAnalysis & { sampleId?: string | null }>;
    /** Called after inline changes so parent can update local state */
    onUpdateAnalysis: (analysisId: string, patch: Partial<ReceiptAnalysis>) => void;
    /** Called after successful bulk update so parent can refresh */
    onBulkUpdated?: () => void;
}

export function AnalysesEditableTable({ analyses, onUpdateAnalysis, onBulkUpdated }: AnalysesEditableTableProps) {
    // ── Edit mode state ────────────────────────────────────────────
    const [isEditing, setIsEditing] = useState(false);
    const [showBulkPanel, setShowBulkPanel] = useState(false);

    // ── Selection state ────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const allIds = useMemo(() => analyses.map((a) => a.analysisId), [analyses]);
    const allSelected = selectedIds.size === allIds.length && allIds.length > 0;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(allIds));
    const toggleOne = (id: string) =>
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const selectedAnalyses = useMemo(() => analyses.filter((a) => selectedIds.has(a.analysisId)), [analyses, selectedIds]);

    // ── Groups data ────────────────────────────────────────────────
    const { data: groupsRes, isLoading: isGroupsLoading } = useIdentityGroupsList({
        query: { identityGroupMainRole: ["ROLE_TECHNICIAN"], option: "full", itemsPerPage: 100 },
    });
    const groups: GroupOption[] = useMemo(() => (groupsRes?.data ?? []) as GroupOption[], [groupsRes?.data]);

    // ── Bulk update API ────────────────────────────────────────────
    const { mutateAsync: mutateBulk, isPending: isBulkSaving } = useAnalysesUpdateBulk();

    const handleBulkConfirm = useCallback(
        async (vals: BulkValues) => {
            if (selectedIds.size === 0) return;
            const body = [...selectedIds].map((id) => {
                const patch: Record<string, unknown> = { analysisId: id };
                if (vals.protocolCode) patch.protocolCode = vals.protocolCode;
                if (vals.analysisUnit) patch.analysisUnit = vals.analysisUnit;
                if (vals.technicianGroupId) {
                    patch.technicianGroupId = vals.technicianGroupId;
                    patch.technicianGroupName = vals.technicianGroupName;
                }
                if (vals.analysisDeadline) patch.analysisDeadline = vals.analysisDeadline;
                if (vals.analysisLocation) patch.analysisLocation = vals.analysisLocation;
                return patch;
            });
            try {
                await mutateBulk({ body: body as any });
                toast.success(`Đã cập nhật ${body.length} chỉ tiêu`);
                setShowBulkPanel(false);
                setSelectedIds(new Set());
                onBulkUpdated?.();
            } catch {
                // error toast handled by hook
            }
        },
        [selectedIds, mutateBulk, onBulkUpdated]
    );

    // ── Inline field updater ───────────────────────────────────────
    const update = useCallback(
        (analysisId: string, field: keyof ReceiptAnalysis, value: unknown) => onUpdateAnalysis(analysisId, { [field]: value } as Partial<ReceiptAnalysis>),
        [onUpdateAnalysis]
    );

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {/* ── Toolbar ────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Chỉ tiêu phân tích
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {analyses.length}
                    </Badge>
                    {isEditing && selectedIds.size > 0 && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-primary border-primary/40">
                            {selectedIds.size} đã chọn
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            {selectedIds.size > 0 && !showBulkPanel && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs gap-1.5 border-primary/40 text-primary"
                                    onClick={() => setShowBulkPanel(true)}
                                >
                                    <Layers className="h-3 w-3" />
                                    Sửa hàng loạt ({selectedIds.size})
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1 text-muted-foreground"
                                onClick={() => { setIsEditing(false); setShowBulkPanel(false); setSelectedIds(new Set()); }}
                            >
                                <X className="h-3 w-3" />
                                Thoát sửa
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => setIsEditing(true)}>
                            <Edit className="h-3 w-3" />
                            Chỉnh sửa chỉ tiêu
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Bulk edit panel ─────────────────────────────────── */}
            {isEditing && showBulkPanel && (
                <BulkEditPanel
                    selectedAnalyses={selectedAnalyses}
                    groups={groups}
                    isGroupsLoading={isGroupsLoading}
                    onConfirm={handleBulkConfirm}
                    onCancel={() => setShowBulkPanel(false)}
                    isSaving={isBulkSaving}
                />
            )}

            {/* ── Table ──────────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-background overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                {/* Checkbox header */}
                                {isEditing && (
                                    <th className="w-8 px-3 py-2.5">
                                        <button
                                            onClick={toggleAll}
                                            className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                            title={allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                        >
                                            {allSelected ? (
                                                <CheckSquare className="h-4 w-4 text-primary" />
                                            ) : someSelected ? (
                                                <Square className="h-4 w-4 text-primary" />
                                            ) : (
                                                <Square className="h-4 w-4" />
                                            )}
                                        </button>
                                    </th>
                                )}
                                {["Mã PT", "Mẫu", "Chỉ tiêu", "Phương pháp", "Kết quả", "Đơn vị", "STT", "Nhóm KTV", "Nơi thực hiện", "Hạn trả"].map((h) => (
                                    <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {analyses.length === 0 ? (
                                <tr>
                                    <td colSpan={isEditing ? 10 : 9} className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                                        Chưa có chỉ tiêu
                                    </td>
                                </tr>
                            ) : (
                                analyses.map((a) => {
                                    const isSelected = selectedIds.has(a.analysisId);
                                    return (
                                        <tr
                                            key={a.analysisId}
                                            className={cn(
                                                "hover:bg-muted/20 transition-colors",
                                                isSelected && "bg-primary/5"
                                            )}
                                        >
                                            {/* Checkbox cell */}
                                            {isEditing && (
                                                <td className="px-3 py-2">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={() => toggleOne(a.analysisId)}
                                                        className="h-4 w-4"
                                                    />
                                                </td>
                                            )}

                                            {/* Mã PT — read only */}
                                            <td className="px-3 py-2 text-[10px] text-muted-foreground font-mono">{a.analysisId}</td>

                                            {/* Mẫu — read only */}
                                            <td className="px-3 py-2 text-[10px] text-muted-foreground font-mono">{a.sampleId ?? "—"}</td>

                                            {/* Chỉ tiêu — read only */}
                                            <td className="px-3 py-2 text-xs font-medium max-w-[160px] truncate">{a.parameterName ?? "—"}</td>

                                            {/* Phương pháp — editable */}
                                            <td className="px-2 py-1.5">
                                                {isEditing ? (
                                                    <Input
                                                        className="h-7 text-[11px] bg-background px-2 w-[120px]"
                                                        value={a.protocolCode ?? ""}
                                                        onChange={(e) => update(a.analysisId, "protocolCode", e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">{a.protocolCode ?? "—"}</span>
                                                )}
                                            </td>

                                            {/* Kết quả — read only */}
                                            <td className="px-3 py-2 text-xs font-bold text-primary">{a.analysisResult ?? "—"}</td>

                                            {/* Đơn vị — editable */}
                                            <td className="px-2 py-1.5">
                                                {isEditing ? (
                                                    <Input
                                                        className="h-7 text-[11px] bg-background px-2 w-[80px]"
                                                        value={a.analysisUnit ?? ""}
                                                        onChange={(e) => update(a.analysisId, "analysisUnit", e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">{a.analysisUnit ?? "—"}</span>
                                                )}
                                            </td>

                                            {/* STT (status) — read only */}
                                            <td className="px-3 py-2">
                                                {a.analysisStatus && (
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                        {a.analysisStatus}
                                                    </Badge>
                                                )}
                                            </td>

                                            {/* Nhóm KTV — editable (group select) */}
                                            <td className="px-2 py-1.5">
                                                {isEditing ? (
                                                    <GroupSelect
                                                        value={(a as any).technicianGroupId ?? ""}
                                                        onChange={(id, name) => {
                                                            update(a.analysisId, "technicianGroupId" as any, id);
                                                            update(a.analysisId, "technicianGroupName" as any, name);
                                                        }}
                                                        groups={groups}
                                                        isLoading={isGroupsLoading}
                                                        placeholder="Chọn nhóm..."
                                                        size="xs"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        {(a as any).technicianGroupName ?? a.technician?.identityName ?? "—"}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Nơi thực hiện — editable */}
                                            <td className="px-2 py-1.5">
                                                {isEditing ? (
                                                    <Input
                                                        className="h-7 text-[11px] bg-background px-2 w-[100px]"
                                                        value={a.analysisLocation ?? ""}
                                                        onChange={(e) => update(a.analysisId, "analysisLocation", e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground">{a.analysisLocation ?? "—"}</span>
                                                )}
                                            </td>

                                            {/* Hạn trả — editable */}
                                            <td className="px-2 py-1.5">
                                                {isEditing ? (
                                                    <Input
                                                        type="date"
                                                        className="h-7 text-[11px] bg-background px-1 w-[130px]"
                                                        value={a.analysisDeadline?.split("T")[0] ?? ""}
                                                        onChange={(e) => update(a.analysisId, "analysisDeadline", e.target.value)}
                                                    />
                                                ) : (
                                                    <span className="text-[10px] font-medium text-destructive">
                                                        {fmtDate(a.analysisDeadline)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
