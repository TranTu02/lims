import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { useSampleTypesList, type SampleType } from "@/api/library";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { SampleTypesTable, type SampleTypesExcelFiltersState } from "./SampleTypesTable";
import { SampleTypeFormModal } from "./SampleTypeFormModal";
import { SampleTypeDetailPanel } from "./SampleTypeDetailPanel";

function Skeleton() {
    return (
        <div className="bg-background border border-border rounded-lg p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        </div>
    );
}

function createEmptyFilters(): SampleTypesExcelFiltersState {
    return {
        sampleTypeId: [],
        sampleTypeName: [],
        displayTypeStyle: [],
    };
}

export function SampleTypesView() {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [selectedSampleType, setSelectedSampleType] = useState<SampleType | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [editSampleType, setEditSampleType] = useState<SampleType | null>(null);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 20);

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: 20,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedSearch, pagination.currentPage],
    );

    const allQ = useSampleTypesList(listInput);

    const pageItems = useMemo(() => {
        return (allQ.data?.data ?? []) as SampleType[];
    }, [allQ.data]);

    const serverMeta = allQ.data?.meta;
    const totalItems = serverMeta?.total ?? 0;
    const totalPages = serverMeta?.totalPages ?? 1;

    useEffect(() => setServerTotalPages(totalPages), [totalPages]);

    const [excelFilters] = useState<SampleTypesExcelFiltersState>(() => createEmptyFilters());

    const isLoading = allQ.isLoading;
    const isError = allQ.isError;

    return (
        <div className="space-y-4">
            <LibraryHeader
                titleKey="library.sampleTypes.title"
                subtitleKey="library.sampleTypes.total"
                totalCount={totalItems}
                searchValue={searchTerm}
                onSearchChange={(v) => {
                    setSearchTerm(v);
                    pagination.resetPage();
                }}
                onAdd={() => setCreateOpen(true)}
                addLabelKey="library.sampleTypes.actions.add"
                searchPlaceholderKey="library.sampleTypes.searchPlaceholder"
            />

            {isLoading ? <Skeleton /> : null}

            {isError ? (
                <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">{String(t("common.errorTitle"))}</div>
                        <div className="text-sm text-muted-foreground">{String(t("library.sampleTypes.errors.loadFailed"))}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="flex gap-4">
                    <div className="flex-1 bg-background rounded-lg border border-border overflow-hidden">
                        <SampleTypesTable
                            items={pageItems}
                            selectedId={selectedSampleType?.sampleTypeId ?? null}
                            onSelect={setSelectedSampleType}
                            onEdit={(st) => {
                                setEditSampleType(st);
                                setCreateOpen(true);
                            }}
                            excelFilters={excelFilters}
                            onExcelFiltersChange={() => {}}
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

                    <SampleTypeDetailPanel selected={selectedSampleType} onClose={() => setSelectedSampleType(null)} onSelectProtocolId={() => {}} />
                </div>
            ) : null}

            {createOpen ? (
                <SampleTypeFormModal
                    onClose={() => {
                        setCreateOpen(false);
                        setEditSampleType(null);
                    }}
                    initialData={
                        editSampleType
                            ? {
                                  sampleTypeName: editSampleType.sampleTypeName || "",
                                  displayDefault: editSampleType.displayTypeStyle?.default || "",
                                  displayEng: editSampleType.displayTypeStyle?.eng || "",
                              }
                            : undefined
                    }
                />
            ) : null}
        </div>
    );
}
