import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { useParameterGroupsAll, type ParameterGroup } from "@/api/library";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { ParameterGroupsTable, type ParameterGroupsExcelFiltersState } from "./ParameterGroupsTable";
import { ParameterGroupCreateModal } from "./ParameterGroupCreateModal";

function Skeleton() {
    return (
        <div className="bg-background border border-border rounded-lg p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-44 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        </div>
    );
}

function createEmptyFilters(): ParameterGroupsExcelFiltersState {
    return {
        groupId: [],
        groupName: [],
        sampleTypeName: [],
    };
}

function applyLocalFilters(items: ParameterGroup[], f: ParameterGroupsExcelFiltersState) {
    const matchStr = (value: string, selected: string[]) => (selected.length ? selected.includes(value) : true);

    return items.filter((x) => {
        const id = x.groupId ?? "";
        const name = x.groupName ?? "";
        const stName = (x.sampleTypeName ?? x.sampleTypeId ?? "") as string;

        return matchStr(id, f.groupId) && matchStr(name, f.groupName) && matchStr(stName, f.sampleTypeName);
    });
}

export function ParameterGroupsView() {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [createOpen, setCreateOpen] = useState(false);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 10);

    const allInput = useMemo(
        () => ({
            query: {
                page: 1,
                itemsPerPage: 5000,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedSearch],
    );

    const allQ = useParameterGroupsAll(allInput);

    const allItems = useMemo(() => {
        return (allQ.data?.data ?? []) as ParameterGroup[];
    }, [allQ.data]);

    const [excelFilters, setExcelFilters] = useState<ParameterGroupsExcelFiltersState>(() => createEmptyFilters());

    const filteredAll = useMemo(() => applyLocalFilters(allItems, excelFilters), [allItems, excelFilters]);

    const totalItems = filteredAll.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.itemsPerPage));

    useEffect(() => setServerTotalPages(totalPages), [totalPages]);

    useEffect(() => {
        if (pagination.currentPage > totalPages) pagination.handlePageChange(totalPages);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);

    const pageItems = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const end = start + pagination.itemsPerPage;
        return filteredAll.slice(start, end);
    }, [filteredAll, pagination.currentPage, pagination.itemsPerPage]);

    const isLoading = allQ.isLoading;
    const isError = allQ.isError;

    return (
        <div className="space-y-4">
            <LibraryHeader
                titleKey="library.parameterGroups.title"
                subtitleKey="library.parameterGroups.total"
                totalCount={totalItems}
                searchValue={searchTerm}
                onSearchChange={(v) => {
                    setSearchTerm(v);
                    pagination.resetPage();
                }}
                onAdd={() => setCreateOpen(true)}
                addLabelKey="library.parameterGroups.actions.add"
                searchPlaceholderKey="library.parameterGroups.searchPlaceholder"
            />

            {isLoading ? <Skeleton /> : null}

            {isError ? (
                <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">{String(t("common.errorTitle"))}</div>
                        <div className="text-sm text-muted-foreground">{String(t("library.parameterGroups.errors.loadFailed"))}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="bg-background rounded-lg border border-border overflow-hidden">
                    <ParameterGroupsTable
                        items={pageItems}
                        excelFilters={excelFilters}
                        onEdit={() => {}}
                        onExcelFiltersChange={(next) => {
                            setExcelFilters(next);
                            pagination.resetPage();
                        }}
                    />

                    <div className="border-t p-3">
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={totalPages}
                            itemsPerPage={pagination.itemsPerPage}
                            totalItems={totalItems}
                            onPageChange={pagination.handlePageChange}
                            onItemsPerPageChange={pagination.handleItemsPerPageChange}
                        />
                    </div>
                </div>
            ) : null}

            {createOpen ? <ParameterGroupCreateModal onClose={() => setCreateOpen(false)} /> : null}
        </div>
    );
}
