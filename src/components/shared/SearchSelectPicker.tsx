import { useState, useRef, useEffect } from "react";
import { Search, X, Plus, Check, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type PickerItem = {
    id: string;
    label: string;
    sublabel?: string;
};

type Props = {
    /** Label shown above */
    label: string;
    /** Currently selected items */
    selected: PickerItem[];
    onChange: (items: PickerItem[]) => void;
    /** Async search fn - returns matching items for a given search string */
    onSearch: (q: string) => Promise<PickerItem[]>;
    /** If provided, user can click "Create" to create a new item inline */
    onCreate?: (name: string) => Promise<PickerItem>;
    placeholder?: string;
    /** Max number of items to select */
    maxItems?: number;
    /** If provided and selected items exist, displays an Edit button linking to the item */
    onEditItem?: (item: PickerItem) => void;
    /** Style variant of the selected badge */
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
};

export function SearchSelectPicker({ label, selected, onChange, onSearch, onCreate, placeholder, maxItems, onEditItem, badgeVariant }: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [inputVal, setInputVal] = useState("");
    const [results, setResults] = useState<PickerItem[]>([]);
    const [searching, setSearching] = useState(false);
    const [creating, setCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search
    useEffect(() => {
        if (!open) return;
        if (searchTimer.current) clearTimeout(searchTimer.current);
        setSearching(true);
        searchTimer.current = setTimeout(async () => {
            try {
                const res = await onSearch(inputVal.trim());
                setResults(res);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => {
            if (searchTimer.current) clearTimeout(searchTimer.current);
        };
    }, [inputVal, open, onSearch]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const isSelected = (id: string) => selected.some((s) => s.id === id);

    const toggle = (item: PickerItem) => {
        if (isSelected(item.id)) {
            onChange(selected.filter((s) => s.id !== item.id));
        } else {
            if (maxItems && selected.length >= maxItems) return;
            onChange([...selected, item]);
        }
    };

    const remove = (id: string) => onChange(selected.filter((s) => s.id !== id));

    const handleCreate = async () => {
        if (!onCreate || !inputVal.trim()) return;
        setCreating(true);
        try {
            const item = await onCreate(inputVal.trim());
            onChange([...selected, item]);
            setInputVal("");
            // Refresh results
            const res = await onSearch("");
            setResults(res);
        } finally {
            setCreating(false);
        }
    };

    // Filter out already-selected from dropdown (optional UX)
    const unselectedResults = results.filter((r) => !isSelected(r.id));
    const selectedInResults = results.filter((r) => isSelected(r.id));
    const ordered = [...selectedInResults, ...unselectedResults];

    const canCreate = onCreate && inputVal.trim().length > 0 && !results.some((r) => r.label.toLowerCase() === inputVal.trim().toLowerCase());

    return (
        <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">{label}</div>

            <div className="flex gap-4 items-start">
                <div className="w-1/3 shrink-0">
                    <div className="relative" ref={containerRef}>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                value={inputVal}
                                onChange={(e) => {
                                    setInputVal(e.target.value);
                                    setOpen(true);
                                }}
                                onFocus={() => setOpen(true)}
                                placeholder={placeholder ?? t("common.search")}
                                className="pl-8 text-sm h-9"
                            />
                            {searching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />}
                        </div>

                        {/* Combobox dropdown */}
                        {open && (
                            <div className="absolute z-50 mt-1 w-[320px] max-w-[90vw] bg-background border border-border rounded-md shadow-lg overflow-hidden flex flex-col">
                                <div className="max-h-60 overflow-y-auto w-full">
                                    {ordered.length === 0 && !searching && !canCreate ? <div className="p-2 text-sm text-muted-foreground text-center">{String(t("common.noData"))}</div> : null}
                                    {ordered.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggle(item);
                                                if (!maxItems || maxItems > 1) {
                                                    // keep open if multi-select
                                                } else {
                                                    setOpen(false);
                                                }
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="whitespace-normal break-words font-medium">{item.label}</div>
                                                {item.sublabel && <div className="whitespace-normal break-words text-xs text-muted-foreground mt-0.5">{item.sublabel}</div>}
                                            </div>
                                            {isSelected(item.id) && <Check className="h-4 w-4 text-primary shrink-0" />}
                                        </button>
                                    ))}
                                    {canCreate && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                void handleCreate();
                                            }}
                                            disabled={creating}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary/10 text-primary transition-colors text-left border-t border-border"
                                        >
                                            {creating ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                                            <div className="flex-1 min-w-0 font-medium">
                                                {String(t("common.create"))}: "{inputVal}"
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-2/3 flex flex-wrap gap-1.5 min-h-[36px] items-start pt-1">
                    {selected.length > 0 &&
                        selected.map((item) => (
                            <Badge
                                key={item.id}
                                variant={badgeVariant || "secondary"}
                                className="flex items-start gap-1.5 pl-2 pr-1 py-1 text-sm font-normal min-w-0 border-primary/20 bg-primary/5 hover:bg-primary/10 text-foreground transition-colors group h-auto max-w-full"
                            >
                                <span className="whitespace-normal break-words text-left leading-tight py-0.5">
                                    <span className="text-muted-foreground mr-1 text-xs">{item.id}:</span>
                                    <span className="font-medium text-primary">{item.label}</span>
                                </span>
                                <div className="flex items-center gap-0.5 ml-1 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                                    {onEditItem && selected.length === 1 && (
                                        <button type="button" className="rounded hover:bg-background/80 transition-colors p-1" onClick={() => onEditItem(selected[0])} title="Edit">
                                            <svg
                                                width="12"
                                                height="12"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="lucide lucide-pencil"
                                            >
                                                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                                                <path d="m15 5 4 4" />
                                            </svg>
                                        </button>
                                    )}
                                    <button type="button" className="rounded hover:bg-destructive/10 hover:text-destructive transition-colors p-1" onClick={() => remove(item.id)} title="Remove">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </Badge>
                        ))}
                    {selected.length === 0 && (
                        <div className="text-sm text-muted-foreground opacity-50 flex h-full items-center italic">{String(t("library.common.noSelection", { defaultValue: "Chưa chọn..." }))}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
