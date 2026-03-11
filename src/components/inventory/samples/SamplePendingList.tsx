import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Search } from "lucide-react";

import { useSamplesList } from "@/api/samples";
import { useServerPagination } from "@/components/library/hooks/useServerPagination";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { StorageLocationMap } from "./StorageLocationMap";
import { BulkStorageUpdateModal } from "./BulkStorageUpdateModal";

export function SamplePendingList() {
    const { t } = useTranslation();

    const [viewMode, setViewMode] = useState<"table" | "dnd">("table");
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);
    const [serverTotalPages, setServerTotalPages] = useState<number>(1);
    const pagination = useServerPagination(serverTotalPages, 50);

    // Bulk state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkStorageOpen, setBulkStorageOpen] = useState(false);

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim() || null,
                sampleStorageLoc: ["IS NULL"],
                sortColumn: "createdAt",
                sortDirection: "DESC",
            },
        }),
        [debouncedSearch, pagination.currentPage, pagination.itemsPerPage],
    );

    const { data, isLoading, isError } = useSamplesList(listInput);
    const items = data?.data ?? [];
    const totalItems = data?.meta?.total ?? 0;
    const totalPages = data?.meta?.totalPages ?? 1;

    useEffect(() => {
        setServerTotalPages(totalPages);
    }, [totalPages]);

    const toDash = (v: unknown) => {
        if (typeof v === "string") return v.trim() || "-";
        if (v == null) return "-";
        return String(v);
    };

    const toggleRow = (id: string, checked: boolean) => {
        setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
    };

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(items.map((x) => x.sampleId));
        } else {
            setSelectedIds([]);
        }
    };

    const isAllSelected = items.length > 0 && selectedIds.length === items.length;

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-card rounded-lg border border-border p-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-sm shrink-0">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={String(t("inventory.samples.searchPlaceholder", { defaultValue: "Tìm kiếm mẫu..." }))}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            pagination.resetPage();
                        }}
                        className="pl-10 bg-background"
                        disabled={viewMode === "dnd"}
                    />
                </div>

                <div className="flex bg-muted/50 p-1 rounded-md border border-border">
                    {selectedIds.length > 0 && viewMode === "table" && (
                        <Button variant="secondary" size="sm" className="h-8 shadow-sm mr-2" onClick={() => setBulkStorageOpen(true)}>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Xếp vị trí ({selectedIds.length})
                        </Button>
                    )}
                    <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" className={`h-8 ${viewMode === "table" ? "shadow-sm" : ""}`} onClick={() => setViewMode("table")}>
                        <List className="h-4 w-4 mr-2" />
                        Dạng Bảng
                    </Button>
                    <Button variant={viewMode === "dnd" ? "default" : "ghost"} size="sm" className={`h-8 ${viewMode === "dnd" ? "shadow-sm" : ""}`} onClick={() => setViewMode("dnd")}>
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Kéo Thả Vị Trí
                    </Button>
                </div>
            </div>

            {viewMode === "dnd" ? (
                <div className="flex-1 min-h-0 bg-card rounded-lg border border-border shadow-sm p-4">
                    <StorageLocationMap />
                </div>
            ) : (
                <>
                    {isError ? (
                        <div className="bg-card border border-destructive/20 rounded-lg p-4 flex items-start gap-3 text-destructive shadow-sm shrink-0">
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                            <div>
                                <div className="font-medium">{String(t("common.error"))}</div>
                                <div className="text-sm">{String(t("common.toast.failed"))}</div>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex-1 bg-card border border-border rounded-lg overflow-hidden flex flex-col shadow-sm min-h-0">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full min-w-4xl border-collapse">
                                <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-10">
                                            <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} disabled={items.length === 0} />
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.samples.sampleId"))}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.samples.sampleName"))}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.samples.productType"))}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                            {String(t("lab.samples.samplePreservation", { defaultValue: "ĐK Bảo quản" }))}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                            {String(t("lab.samples.sampleIsReference", { defaultValue: "Mẫu Đối Chứng" }))}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("lab.samples.sampleStatus"))}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLoading ? (
                                        Array.from({ length: Math.min(pagination.itemsPerPage, 5) }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-4 py-4">
                                                    <div className="h-4 w-4 bg-muted rounded"></div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-4 w-20 bg-muted rounded"></div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-4 w-32 bg-muted rounded"></div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-4 w-24 bg-muted rounded"></div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-4 w-24 bg-muted rounded"></div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-4 w-16 bg-muted rounded"></div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="h-4 w-20 bg-muted rounded"></div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : items.length > 0 ? (
                                        items.map((row) => {
                                            const isRowSelected = selectedIds.includes(row.sampleId);
                                            return (
                                                <tr key={row.sampleId} className={`hover:bg-muted/30 transition-colors ${isRowSelected ? "bg-primary/5" : ""}`}>
                                                    <td className="px-4 py-3">
                                                        <Checkbox checked={isRowSelected} onCheckedChange={(c) => toggleRow(row.sampleId, !!c)} />
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-primary">{row.sampleId}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{toDash((row as any).sampleName)}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{toDash((row as any).productType)}</td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">{toDash((row as any).samplePreservation)}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">
                                                        {(row as any).sampleIsReference ? (
                                                            <Badge variant="default" className="text-xs bg-primary/20 text-primary hover:bg-primary/30">
                                                                {String(t("common.yes", { defaultValue: "Có" }))}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <Badge variant="outline" className="text-xs">
                                                            {toDash(row.sampleStatus)}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                                {String(t("common.noData"))}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!isLoading && !isError && totalItems > 0 && (
                            <div className="shrink-0 pt-2 pb-2">
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalPages={Math.max(1, totalPages)}
                                    itemsPerPage={pagination.itemsPerPage}
                                    totalItems={totalItems}
                                    onPageChange={pagination.handlePageChange}
                                    onItemsPerPageChange={pagination.handleItemsPerPageChange}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}

            <BulkStorageUpdateModal
                open={bulkStorageOpen}
                onClose={() => setBulkStorageOpen(false)}
                sampleIds={selectedIds}
                onSuccess={() => {
                    setSelectedIds([]);
                    pagination.resetPage();
                }}
            />
        </div>
    );
}
