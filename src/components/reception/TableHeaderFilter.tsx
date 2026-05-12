import React, { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type FilterType = "enum" | "daterange" | "text";

export interface TableHeaderFilterProps {
    title: React.ReactNode;
    type: FilterType;
    options?: string[];
    labelMap?: Record<string, string>;
    value?: string[];
    onChange: (vals: string[]) => void;
    className?: string;
}

export function TableHeaderFilter({ title, type, options = [], labelMap = {}, value = [], onChange, className }: TableHeaderFilterProps) {
    const [open, setOpen] = useState(false);

    const isNullChecked = value.includes("IS NULL");
    const isNotNullChecked = value.includes("IS NOT NULL");
    const activeCount = value.length;

    const toggleValue = (val: string) => {
        if (val === "IS NULL" || val === "IS NOT NULL") {
            // If selecting null/not null, clear other values and set this one
            if (value.includes(val)) {
                onChange([]);
            } else {
                onChange([val]);
            }
            return;
        }

        // If selecting a normal value, remove null/not null
        let current = value.filter(v => v !== "IS NULL" && v !== "IS NOT NULL");
        
        // Date range
        if (val.startsWith("BETWEEN ")) {
            onChange([val]);
            return;
        }

        // Enum multi-select
        if (current.includes(val)) {
            current = current.filter((v) => v !== val);
        } else {
            current = [...current, val];
        }
        onChange(current);
    };

    const clear = () => {
        onChange([]);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={cn("inline-flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors group select-none", className, activeCount > 0 && "text-primary font-semibold")}>
                    {title}
                    <div className={cn("p-0.5 rounded transition-colors", activeCount > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground/50 group-hover:bg-muted group-hover:text-foreground")}>
                        <Filter className="h-3 w-3" />
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60 p-3" onClick={e => e.stopPropagation()}>
                <div className="space-y-4">
                    {/* Special Options */}
                    <div className="space-y-2 border-b pb-3">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox 
                                checked={isNullChecked} 
                                onCheckedChange={() => toggleValue("IS NULL")} 
                                className="h-3.5 w-3.5"
                            />
                            <span className="text-muted-foreground italic">[Trống] (Chưa có dữ liệu)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <Checkbox 
                                checked={isNotNullChecked} 
                                onCheckedChange={() => toggleValue("IS NOT NULL")} 
                                className="h-3.5 w-3.5"
                            />
                            <span className="text-muted-foreground italic">[Có dữ liệu] (Đã điền)</span>
                        </label>
                    </div>

                    {/* Type-specific inputs */}
                    {!isNullChecked && !isNotNullChecked && type === "enum" && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {options.map((opt) => (
                                <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded -ml-1">
                                    <Checkbox 
                                        checked={value.includes(opt)} 
                                        onCheckedChange={() => toggleValue(opt)} 
                                        className="h-3.5 w-3.5"
                                    />
                                    <span className="truncate">{labelMap[opt] ?? opt}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {!isNullChecked && !isNotNullChecked && type === "daterange" && (
                        <DateRangeInput 
                            value={value.find(v => v.startsWith("BETWEEN "))} 
                            onApply={(val) => { toggleValue(val); setOpen(false); }} 
                        />
                    )}

                    {activeCount > 0 && (
                        <Button variant="ghost" size="sm" className="w-full h-8 text-xs mt-2 text-muted-foreground hover:text-foreground" onClick={clear}>
                            <X className="h-3 w-3 mr-1.5" /> Bỏ lọc cột này
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function DateRangeInput({ value, onApply }: { value?: string, onApply: (val: string) => void }) {
    const match = value?.match(/BETWEEN\s+(\S+)\s+AND\s+(\S+)/i);
    const [from, setFrom] = useState(match?.[1] ?? "");
    const [to, setTo] = useState(match?.[2] ?? "");

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Từ ngày</label>
                    <Input type="date" className="h-8 mt-0.5 text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] text-muted-foreground uppercase">Đến ngày</label>
                    <Input type="date" className="h-8 mt-0.5 text-xs" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
            </div>
            <Button size="sm" className="w-full h-8 text-xs" disabled={!from} onClick={() => onApply(`BETWEEN ${from} AND ${to || from}`)}>
                Áp dụng khoảng ngày
            </Button>
        </div>
    );
}
