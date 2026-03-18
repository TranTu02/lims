import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, Trash2, Loader2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { chemicalApi } from "@/api/chemical";

export type ChemicalBomItem = {
    chemicalSkuId: string;
    chemicalName: string;
    consumedQty: string;
    unit: string;
};

type Props = {
    items: ChemicalBomItem[];
    onChange: (items: ChemicalBomItem[]) => void;
    /** Optional: load chemicals from a protocol */
    onLoadFromProtocol?: () => void;
    loadFromProtocolLabel?: string;
    disabled?: boolean;
};

type SkuOption = {
    chemicalSkuId: string;
    chemicalName: string;
    chemicalBaseUnit: string;
};

function SkuSearchDropdown({ onSelect, existingIds }: { onSelect: (sku: SkuOption) => void; existingIds: string[] }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<SkuOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) return;
        if (timer.current) clearTimeout(timer.current);
        setLoading(true);
        timer.current = setTimeout(async () => {
            try {
                const res = await chemicalApi.skus.list({
                    query: { page, itemsPerPage: 10, search: search.trim() || undefined },
                });
                const raw = res as unknown as { data?: SkuOption[]; meta?: { totalPages: number; total: number } };
                const data = Array.isArray(raw.data) ? raw.data : [];
                setResults(data);
                if (raw.meta) {
                    setTotalPages(raw.meta.totalPages || 1);
                    setTotalItems(raw.meta.total ?? 0);
                }
            } catch {
                setResults([]);
                setTotalPages(1);
                setTotalItems(0);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [search, open, page]);

    // Reset page when search changes
    useEffect(() => {
        setPage(1);
    }, [search]);

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

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={String(t("library.chemicals.searchPlaceholder", { defaultValue: "Tìm hóa chất (SKU)..." }))}
                    className="pl-8 text-sm h-8"
                />
                {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-[400px] max-w-[100vw] bg-background border border-border rounded-md shadow-lg overflow-hidden flex flex-col">
                    <div className="max-h-60 overflow-y-auto w-full">
                        {results.length === 0 && !loading ? <div className="px-3 py-2 text-sm text-muted-foreground text-center">{String(t("common.noData"))}</div> : null}
                        {results.map((sku) => {
                            const isSelected = existingIds.includes(sku.chemicalSkuId);
                            return (
                                <button
                                    key={sku.chemicalSkuId}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onSelect(sku);
                                    }}
                                >
                                    <span className="flex-1 min-w-0 pr-4">
                                        <span className="block truncate font-medium">{sku.chemicalName}</span>
                                        <span className="block text-xs text-muted-foreground truncate">
                                            {sku.chemicalSkuId} · {sku.chemicalBaseUnit}
                                        </span>
                                    </span>
                                    <div
                                        className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"}`}
                                    >
                                        {isSelected && (
                                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {/* Pagination footer */}
                    {totalPages > 1 && (
                        <div className="border-t border-border px-3 py-2 flex items-center justify-between bg-muted/20">
                            <div className="text-xs text-muted-foreground">
                                {page} / {totalPages} ({totalItems})
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPage((p) => Math.max(1, p - 1));
                                    }}
                                    disabled={page <= 1}
                                >
                                    Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setPage((p) => Math.min(totalPages, p + 1));
                                    }}
                                    disabled={page >= totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function ChemicalBomTable({ items, onChange, onLoadFromProtocol, loadFromProtocolLabel, disabled }: Props) {
    const { t } = useTranslation();

    const existingIds = items.map((i) => i.chemicalSkuId);

    const toggleItem = useCallback(
        (sku: SkuOption) => {
            if (existingIds.includes(sku.chemicalSkuId)) {
                // remove
                onChange(items.filter((i) => i.chemicalSkuId !== sku.chemicalSkuId));
            } else {
                // add
                onChange([
                    ...items,
                    {
                        chemicalSkuId: sku.chemicalSkuId,
                        chemicalName: sku.chemicalName,
                        consumedQty: "",
                        unit: sku.chemicalBaseUnit || "",
                    },
                ]);
            }
        },
        [items, onChange, existingIds],
    );

    const removeItem = (idx: number) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const updateField = (idx: number, field: keyof ChemicalBomItem, value: string) => {
        onChange(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-foreground">{String(t("library.chemicals.bomTitle", { defaultValue: "Hóa chất sử dụng (BOM)" }))}</div>
                {onLoadFromProtocol && (
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onLoadFromProtocol} disabled={disabled}>
                        <Download className="h-3.5 w-3.5" />
                        {loadFromProtocolLabel || String(t("library.chemicals.loadFromProtocol", { defaultValue: "Nạp từ Phương pháp" }))}
                    </Button>
                )}
            </div>

            {!disabled && <SkuSearchDropdown onSelect={toggleItem} existingIds={existingIds} />}

            {items.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[35%]">
                                    {String(t("library.chemicals.chemicalName", { defaultValue: "Tên hóa chất" }))}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[20%]">{String(t("library.chemicals.skuId", { defaultValue: "SKU ID" }))}</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[20%]">
                                    {String(t("library.chemicals.consumedQty", { defaultValue: "Định mức" }))}
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[15%]">{String(t("library.chemicals.unit", { defaultValue: "ĐVT" }))}</th>
                                <th className="px-3 py-2 w-[10%]" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item, idx) => (
                                <tr key={`${item.chemicalSkuId}-${idx}`} className="hover:bg-muted/30">
                                    <td className="px-3 py-1.5">
                                        <span className="text-sm text-foreground truncate block" title={item.chemicalName}>
                                            {item.chemicalName}
                                        </span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <span className="text-xs text-muted-foreground">{item.chemicalSkuId}</span>
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <Input
                                            className="h-7 text-sm"
                                            inputMode="decimal"
                                            value={item.consumedQty}
                                            onChange={(e) => updateField(idx, "consumedQty", e.target.value)}
                                            disabled={disabled}
                                        />
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <Input className="h-7 text-sm" value={item.unit} onChange={(e) => updateField(idx, "unit", e.target.value)} disabled={disabled} />
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                        {!disabled && (
                                            <Button variant="ghost" size="icon" type="button" className="h-7 w-7" onClick={() => removeItem(idx)}>
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {items.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded-md">
                    {String(t("library.chemicals.emptyBom", { defaultValue: "Chưa có hóa chất. Tìm kiếm và thêm ở trên." }))}
                </div>
            )}
        </div>
    );
}
