import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useChemicalSkusList } from "@/api/chemical";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, ChevronDown, X } from "lucide-react";
import type { ChemicalSku } from "@/types/chemical";
import { SkuEditModal } from "./SkuEditModal";

type Props = {
    value: string;
    onChange: (skuId: string, sku?: ChemicalSku) => void;
    placeholder?: string;
    id?: string;
    className?: string;
};

export function SkuSelect({ value, onChange, placeholder, id, className }: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const { data: result, isLoading } = useChemicalSkusList({ query: { search, page: 1, itemsPerPage: 50 } }, { enabled: open });

    const skus = (result?.data as ChemicalSku[] | undefined) ?? [];

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedSku = skus.find((s) => s.chemicalSkuId === value);

    return (
        <>
            <div ref={containerRef} className={`relative ${className ?? ""}`}>
                {/* Trigger */}
                <button
                    type="button"
                    id={id}
                    onClick={() => setOpen(!open)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-left"
                >
                    <span className={value ? "text-foreground" : "text-muted-foreground"}>
                        {value
                            ? selectedSku
                                ? `${selectedSku.chemicalSkuId} – ${selectedSku.chemicalName ?? ""}`
                                : value
                            : (placeholder ?? t("inventory.chemical.skus.selectPlaceholder", { defaultValue: "Chọn mã SKU..." }))}
                    </span>
                    <div className="flex items-center gap-1">
                        {value && (
                            <span
                                className="text-muted-foreground hover:text-destructive cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange("");
                                }}
                            >
                                <X className="h-3 w-3" />
                            </span>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-lg shadow-xl max-h-[280px] flex flex-col">
                        {/* Search */}
                        <div className="p-2 border-b border-border">
                            <div className="relative">
                                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t("inventory.chemical.skus.searchPlaceholder", { defaultValue: "Tìm mã SKU, tên, CAS..." })}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-8 pl-7 text-xs"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="p-3 space-y-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-8 w-full" />
                                    ))}
                                </div>
                            ) : skus.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">{t("common.noData", { defaultValue: "Không tìm thấy dữ liệu" })}</div>
                            ) : (
                                skus.map((sku) => (
                                    <button
                                        key={sku.chemicalSkuId}
                                        type="button"
                                        onClick={() => {
                                            onChange(sku.chemicalSkuId, sku);
                                            setOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors flex items-center justify-between ${value === sku.chemicalSkuId ? "bg-primary/5 font-medium" : ""}`}
                                    >
                                        <div>
                                            <div className="font-medium text-foreground">{sku.chemicalSkuId}</div>
                                            <div className="text-muted-foreground">
                                                {sku.chemicalName ?? ""} {sku.chemicalCASNumber ? `(${sku.chemicalCASNumber})` : ""}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground shrink-0 ml-2">{sku.chemicalBaseUnit ?? ""}</div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Create new */}
                        <div className="p-2 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => {
                                    setCreateOpen(true);
                                    setOpen(false);
                                }}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" /> {t("inventory.chemical.skus.add", { defaultValue: "Tạo SKU mới" })}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create SKU modal */}
            {createOpen && <SkuEditModal sku={null} onClose={() => setCreateOpen(false)} />}
        </>
    );
}
