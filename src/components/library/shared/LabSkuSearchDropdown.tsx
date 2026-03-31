import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generalInventoryApi, type LabSku } from "@/api/generalInventory";

type Props = {
    onSelect: (sku: LabSku) => void;
    existingIds: string[];
    skuType: string;
    placeholder?: string;
};

export function LabSkuSearchDropdown({ onSelect, existingIds, skuType, placeholder }: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [results, setResults] = useState<LabSku[]>([]);
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
                const res = await generalInventoryApi.labSkus.list({
                    query: { page, itemsPerPage: 10, search: search.trim() || undefined, labSkuType: [skuType] },
                });
                const raw = res as unknown as { data?: LabSku[]; meta?: { totalPages: number; total: number } };
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
    }, [search, open, page, skuType]);

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
                    placeholder={placeholder || String(t("library.protocols.searchEquipment", { defaultValue: "Tìm SKU..." }))}
                    className="pl-8 text-sm h-8"
                />
                {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-[400px] max-w-[100vw] bg-background border border-border rounded-md shadow-lg overflow-hidden flex flex-col">
                    <div className="max-h-60 overflow-y-auto w-full">
                        {results.length === 0 && !loading ? <div className="px-3 py-2 text-sm text-muted-foreground text-center">{String(t("common.noData"))}</div> : null}
                        {results.map((sku) => {
                            const isSelected = existingIds.includes(sku.labSkuId);
                            return (
                                <button
                                    key={sku.labSkuId}
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onSelect(sku);
                                    }}
                                >
                                    <span className="flex-1 min-w-0 pr-4">
                                        <span className="block truncate font-medium">{sku.labSkuName}</span>
                                        <span className="block text-xs text-muted-foreground truncate">
                                            {sku.labSkuId} {sku.labSkuCode ? `(${sku.labSkuCode})` : ""}
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
