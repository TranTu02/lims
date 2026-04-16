import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EnumOption {
    value: string;
    label: string;
}

interface TableFilterPopoverProps {
    title: React.ReactNode;
    type: "enum" | "date";
    options?: EnumOption[]; // For enum
    value: string[]; // Controlled value
    onChange: (val: string[]) => void;
}

export function TableFilterPopover({ title, type, options, value, onChange }: TableFilterPopoverProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    
    // Internal state for dates (type=date input yields YYYY-MM-DD natively)
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Read date from existing BETWEEN filter value on open
    React.useEffect(() => {
        if (open && type === "date" && value.length === 1 && value[0].startsWith("BETWEEN")) {
            // value is like: "BETWEEN 'YYYY-MM-DD 00:00:00' AND 'YYYY-MM-DD 23:59:59'"
            const match = value[0].match(/BETWEEN\s+'([^']+)'\s+AND\s+'([^']+)'/i);
            if (match) {
                // date part is already YYYY-MM-DD — matches input[type=date] format
                setDateFrom(match[1].split(" ")[0]);
                setDateTo(match[2].split(" ")[0]);
            }
        }
    }, [open, type, value]);

    const handleEnumToggle = (val: string) => {
        if (value.includes(val)) {
            onChange(value.filter((v) => v !== val));
        } else {
            onChange([...value, val]);
        }
    };

    const handleApplyDate = () => {
        if (!dateFrom && !dateTo) {
            onChange([]);
            setOpen(false);
            return;
        }
        // Auto-fill missing side with the other side
        const from = dateFrom || dateTo;
        const to = dateTo || dateFrom;
        const q = `BETWEEN '${from} 00:00:00' AND '${to} 23:59:59'`;
        onChange([q]);
        setOpen(false);
    };

    const handleClearDate = () => {
        setDateFrom("");
        setDateTo("");
        onChange([]);
        setOpen(false);
    };

    const isActive = value.length > 0;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className={`inline-flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors ${isActive ? "text-primary font-semibold" : ""}`}>
                    {title}
                    <Filter className={`h-3 w-3 ${isActive ? "fill-primary" : ""}`} />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                {type === "enum" && options && (
                    <div className="space-y-1">
                        <div className="mb-2 font-medium text-sm text-muted-foreground">{t("common.filterBy", { defaultValue: "Lọc theo:" })}</div>
                        <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                            {options.map((opt) => {
                                const checked = value.includes(opt.value);
                                return (
                                    <div
                                        key={opt.value}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors ${checked ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
                                        onClick={() => handleEnumToggle(opt.value)}
                                    >
                                        <div className={`h-4 w-4 border rounded flex items-center justify-center ${checked ? "bg-primary border-primary text-primary-foreground" : "border-input"}`}>
                                            {checked && <Check className="h-3 w-3" />}
                                        </div>
                                        {opt.label}
                                    </div>
                                );
                            })}
                        </div>
                        {value.length > 0 && (
                            <div className="pt-2 mt-2 border-t border-border">
                                <Button variant="ghost" size="sm" className="w-full text-xs h-8" onClick={() => onChange([])}>
                                    {t("common.clearFilter", { defaultValue: "Xóa lọc" })}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {type === "date" && (
                    <div className="space-y-3">
                        <div className="font-medium text-sm text-muted-foreground mb-1">
                            {t("common.filterDate", { defaultValue: "Lọc theo khoảng ngày:" })}
                        </div>
                        <div className="space-y-2">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    {t("common.from", { defaultValue: "Từ ngày" })}:
                                </label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    {t("common.to", { defaultValue: "Đến ngày" })}:
                                </label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border">
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={handleClearDate}>
                                {t("common.clear", { defaultValue: "Bỏ lọc" })}
                            </Button>
                            <Button variant="default" size="sm" className="flex-1 h-8 text-xs" onClick={handleApplyDate}>
                                {t("common.apply", { defaultValue: "Áp dụng" })}
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
