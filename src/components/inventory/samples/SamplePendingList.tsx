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
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { useSampleTypesList, useSampleTypeFull } from "@/api/library";

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
    const [selectedSampleTypeId, setSelectedSampleTypeId] = useState<string | null>(null);

    // Sample type list state
    const [sampleTypeSearch, setSampleTypeSearch] = useState("");
    const debouncedSampleTypeSearch = useDebouncedValue(sampleTypeSearch, 300);
    const [sampleTypePage, setSampleTypePage] = useState(1);

    // Reset sample type page when search changes
    useEffect(() => {
        setSampleTypePage(1);
    }, [debouncedSampleTypeSearch]);

    const { data: sampleTypesRes, isLoading: sampleTypesLoading } = useSampleTypesList({
        query: {
            page: sampleTypePage,
            itemsPerPage: 20,
            search: debouncedSampleTypeSearch.trim() || null,
        }
    });
    const sampleTypes = sampleTypesRes?.data ?? [];
    const sampleTypesTotalPages = sampleTypesRes?.meta?.totalPages ?? 1;

    // Fetch detail of selected sample type so it doesn't disappear if not in current page/search results
    const { data: selectedSampleTypeRes } = useSampleTypeFull(
        selectedSampleTypeId && selectedSampleTypeId !== "all" ? selectedSampleTypeId : null
    );

    const sampleTypeOptions = useMemo(() => {
        const options = sampleTypes.map((st) => ({
            value: st.sampleTypeId,
            label: st.sampleTypeName,
        }));

        const hasAll = sampleTypePage === 1 && !debouncedSampleTypeSearch;
        const result = hasAll 
            ? [{ value: "all", label: "Tất cả loại sản phẩm" }, ...options]
            : options;

        if (selectedSampleTypeId && selectedSampleTypeId !== "all" && !result.some((r) => r.value === selectedSampleTypeId)) {
            const label = selectedSampleTypeRes?.sampleTypeName || selectedSampleTypeId;
            result.push({
                value: selectedSampleTypeId,
                label: label,
            });
        }

        return result;
    }, [sampleTypes, sampleTypePage, debouncedSampleTypeSearch, selectedSampleTypeId, selectedSampleTypeRes]);

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim() || null,
                sampleStorageLoc: ["IS NULL"],
                sampleStatus: ["Distributed"],
                sortColumn: "createdAt",
                sortDirection: "DESC",
                ...(selectedSampleTypeId && selectedSampleTypeId !== "all" ? { sampleTypeId: selectedSampleTypeId } : {}),
            },
        }),
        [debouncedSearch, pagination.currentPage, pagination.itemsPerPage, selectedSampleTypeId],
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
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={String(t("inventory.samples.searchPlaceholder", { defaultValue: "Tìm kiếm mẫu..." }))}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                pagination.resetPage();
                            }}
                            className="pl-10 bg-background"
                        />
                    </div>
                    <div className="w-full sm:w-[220px] shrink-0">
                        <SearchableSelect
                            value={selectedSampleTypeId ?? "all"}
                            options={sampleTypeOptions}
                            placeholder="Loại sản phẩm..."
                            searchPlaceholder="Tìm loại sản phẩm..."
                            loading={sampleTypesLoading}
                            filterMode="server"
                            searchValue={sampleTypeSearch}
                            onSearchChange={setSampleTypeSearch}
                            hasPreviousPage={sampleTypePage > 1}
                            hasNextPage={sampleTypePage < sampleTypesTotalPages}
                            onPreviousPage={() => setSampleTypePage((p) => Math.max(1, p - 1))}
                            onNextPage={() => setSampleTypePage((p) => Math.min(sampleTypesTotalPages, p + 1))}
                            currentPage={sampleTypePage}
                            totalPages={sampleTypesTotalPages}
                            onChange={(val) => {
                                setSelectedSampleTypeId(val === "all" ? null : val);
                                pagination.resetPage();
                            }}
                        />
                    </div>
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
                    <StorageLocationMap 
                        searchTerm={debouncedSearch}
                        currentPage={pagination.currentPage}
                        itemsPerPage={pagination.itemsPerPage}
                        onPageChange={pagination.handlePageChange}
                        onItemsPerPageChange={pagination.handleItemsPerPageChange}
                        setTotalPages={setServerTotalPages}
                        selectedSampleTypeId={selectedSampleTypeId}
                    />
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
                                                    <td className="px-4 py-3 text-sm text-foreground">{toDash((row as any).productType || row.sampleTypeName)}</td>
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
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
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
