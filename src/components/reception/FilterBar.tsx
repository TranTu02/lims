/**
 * FilterBar.tsx
 * Bộ lọc cho các tab danh sách ở trang Tiếp nhận mẫu.
 * Hỗ trợ:
 *   - Enum multi-select  → col[]=val1&col[]=val2
 *   - Khoảng ngày       → col[]=BETWEEN 2026-01-01 AND 2026-05-31
 */
import { useState, useCallback } from "react";
import { Filter, X, ChevronDown, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─── Types ───────────────────────────────────────────────────────── */

export interface EnumFilterDef {
    type: "enum";
    column: string;
    label: string;
    options: string[];
    labelMap?: Record<string, string>; // optional display label
}

export interface DateRangeFilterDef {
    type: "daterange";
    column: string;
    label: string;
}

export type FilterDef = EnumFilterDef | DateRangeFilterDef;

/** Active filter values keyed by column */
export type FilterValues = Record<string, string[]>;

interface Props {
    filters: FilterDef[];
    values: FilterValues;
    onChange: (values: FilterValues) => void;
}

/* ─── Helper: count active filters ───────────────────────────────── */
function countActive(values: FilterValues) {
    return Object.values(values).filter((v) => v.length > 0).length;
}

/* ─── Enum filter popover ─────────────────────────────────────────── */
function EnumFilter({ def, selected, onChange }: {
    def: EnumFilterDef;
    selected: string[];
    onChange: (vals: string[]) => void;
}) {
    const toggle = (val: string) => {
        if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
        else onChange([...selected, val]);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 text-xs font-medium border-dashed",
                        selected.length > 0 && "border-primary/60 bg-primary/5 text-primary"
                    )}
                >
                    <Filter className="h-3 w-3" />
                    {def.label}
                    {selected.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full">
                            {selected.length}
                        </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-52 p-2">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                    {def.options.map((opt) => (
                        <label
                            key={opt}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/60 cursor-pointer text-xs"
                        >
                            <Checkbox
                                checked={selected.includes(opt)}
                                onCheckedChange={() => toggle(opt)}
                                className="h-3.5 w-3.5"
                            />
                            <span className="truncate">
                                {def.labelMap?.[opt] ?? opt}
                            </span>
                        </label>
                    ))}
                </div>
                {selected.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2 h-7 text-[11px] text-muted-foreground"
                        onClick={() => onChange([])}
                    >
                        <X className="h-3 w-3 mr-1" /> Bỏ lọc
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
}

/* ─── Date range filter popover ───────────────────────────────────── */
function DateRangeFilter({ def, selected, onChange }: {
    def: DateRangeFilterDef;
    selected: string[];
    onChange: (vals: string[]) => void;
}) {
    // selected will have 0 or 1 element: ["BETWEEN 2026-01-01 AND 2026-05-31"]
    const existing = selected[0] ?? "";
    const match = existing.match(/BETWEEN\s+(\S+)\s+AND\s+(\S+)/i);
    const [from, setFrom] = useState(match?.[1] ?? "");
    const [to, setTo] = useState(match?.[2] ?? "");
    const [open, setOpen] = useState(false);

    const apply = () => {
        if (from && to) {
            onChange([`BETWEEN ${from} AND ${to}`]);
        } else if (from) {
            onChange([`BETWEEN ${from} AND ${to || from}`]);
        }
        setOpen(false);
    };

    const clear = () => {
        setFrom(""); setTo("");
        onChange([]);
        setOpen(false);
    };

    const hasValue = selected.length > 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5 text-xs font-medium border-dashed",
                        hasValue && "border-primary/60 bg-primary/5 text-primary"
                    )}
                >
                    <CalendarRange className="h-3 w-3" />
                    {def.label}
                    {hasValue && (
                        <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full">
                            1
                        </Badge>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3 space-y-3">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    {def.label}
                </p>
                <div className="space-y-2">
                    <div>
                        <label className="text-[10px] text-muted-foreground">Từ ngày</label>
                        <Input
                            type="date"
                            className="h-8 mt-0.5 text-xs bg-background"
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-muted-foreground">Đến ngày</label>
                        <Input
                            type="date"
                            className="h-8 mt-0.5 text-xs bg-background"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-7 text-xs" onClick={apply} disabled={!from}>
                        Áp dụng
                    </Button>
                    {hasValue && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clear}>
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

/* ─── Main FilterBar ──────────────────────────────────────────────── */
export function FilterBar({ filters, values, onChange }: Props) {
    const activeCount = countActive(values);

    const handleChange = useCallback(
        (column: string, vals: string[]) => {
            onChange({ ...values, [column]: vals });
        },
        [values, onChange]
    );

    const clearAll = () => {
        const cleared: FilterValues = {};
        filters.forEach((f) => { cleared[f.column] = []; });
        onChange(cleared);
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide flex items-center gap-1">
                <Filter className="h-3 w-3" /> Lọc:
            </span>

            {filters.map((def) => {
                const selected = values[def.column] ?? [];
                if (def.type === "enum") {
                    return (
                        <EnumFilter
                            key={def.column}
                            def={def}
                            selected={selected}
                            onChange={(v) => handleChange(def.column, v)}
                        />
                    );
                }
                return (
                    <DateRangeFilter
                        key={def.column}
                        def={def}
                        selected={selected}
                        onChange={(v) => handleChange(def.column, v)}
                    />
                );
            })}

            {activeCount > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-muted-foreground gap-1"
                    onClick={clearAll}
                >
                    <X className="h-3 w-3" />
                    Xóa tất cả ({activeCount})
                </Button>
            )}
        </div>
    );
}

/* ─── Filter defs per tab ─────────────────────────────────────────── */
export const RECEIPT_FILTERS: FilterDef[] = [
    {
        type: "enum",
        column: "receiptStatus",
        label: "Trạng thái",
        options: ["Draft", "Received", "Processing", "Completed", "Reported", "Cancelled"],
    },
    {
        type: "enum",
        column: "receiptPriority",
        label: "Ưu tiên",
        options: ["Normal", "Urgent", "Flash"],
        labelMap: { Normal: "Bình thường", Urgent: "Khẩn", Flash: "Hỏa tốc" },
    },
    {
        type: "enum",
        column: "receiptDeliveryMethod",
        label: "Giao nhận",
        options: ["HandOver", "Post", "Pickup"],
        labelMap: { HandOver: "Bàn giao trực tiếp", Post: "Bưu điện", Pickup: "Tự đến lấy" },
    },
    {
        type: "daterange",
        column: "receiptDeadline",
        label: "Hạn trả",
    },
    {
        type: "daterange",
        column: "createdAt",
        label: "Ngày tạo",
    },
];

export const INCOMING_FILTERS: FilterDef[] = [
    {
        type: "enum",
        column: "incomingStatus",
        label: "Trạng thái",
        options: ["New", "Processing", "Converted", "Rejected"],
        labelMap: {
            New: "Mới",
            Processing: "Đang xử lý",
            Converted: "Đã tạo phiếu",
            Rejected: "Từ chối",
        },
    },
    {
        type: "daterange",
        column: "createdAt",
        label: "Ngày tạo",
    },
];
