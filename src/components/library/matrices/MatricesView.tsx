import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { useMatricesList, type Matrix } from "@/api/library";

import { LibraryHeader } from "../LibraryHeader";
import { useServerPagination } from "../hooks/useServerPagination";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

import { MatricesTable } from "./MatricesTable";
import { MatricesCreateModal } from "./MatricesCreateModal";
import { MatricesDeleteConfirm } from "./MatricesDeleteConfirm";
import { MatricesEditModal } from "./MatricesEditModal";
import { MatrixDetailPanel } from "./MatrixDetailPanel";

export type ExcelFiltersState = {
    matrixId: string[];
    parameterId: string[];
    parameterName: string[];
    protocolId: string[];
    protocolCode: string[];
    sampleTypeId: string[];
    sampleTypeName: string[];
    feeBeforeTax: number[];
    feeAfterTax: number[];
};

function MatricesSkeleton() {
    return (
        <div className="bg-background border border-border rounded-lg p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        </div>
    );
}

function toNumberSafe(v: unknown): number | null {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isNaN(n) ? null : n;
}

function getParameterLabel(m: Matrix): string {
    return m.parameterName && m.parameterName.trim() ? m.parameterName.trim() : m.parameterId;
}

function getProtocolLabel(m: Matrix): string {
    return m.protocolCode && m.protocolCode.trim() ? m.protocolCode.trim() : m.protocolId;
}

function getSampleTypeLabel(m: Matrix): string {
    return m.sampleTypeName && m.sampleTypeName.trim() ? m.sampleTypeName.trim() : m.sampleTypeId;
}

function applyLocalFilters(items: Matrix[], f: ExcelFiltersState): Matrix[] {
    const matchStr = (value: string, selected: string[]) => (selected.length ? selected.includes(value) : true);

    const matchNum = (value: number | null, selected: number[]) => (selected.length ? value !== null && selected.includes(value) : true);

    return items.filter((m) => {
        const feeBeforeTax = toNumberSafe(m.feeBeforeTax) ?? null;
        const feeAfterTax = toNumberSafe(m.feeAfterTax) ?? null;

        const parameterLabel = getParameterLabel(m);
        const protocolLabel = getProtocolLabel(m);
        const sampleTypeLabel = getSampleTypeLabel(m);

        return (
            matchStr(m.matrixId, f.matrixId) &&
            matchStr(m.parameterId, f.parameterId) &&
            matchStr(parameterLabel, f.parameterName) &&
            matchStr(m.protocolId, f.protocolId) &&
            matchStr(protocolLabel, f.protocolCode) &&
            matchStr(m.sampleTypeId, f.sampleTypeId) &&
            matchStr(sampleTypeLabel, f.sampleTypeName) &&
            matchNum(feeBeforeTax, f.feeBeforeTax) &&
            matchNum(feeAfterTax, f.feeAfterTax)
        );
    });
}

function createEmptyFilters(): ExcelFiltersState {
    return {
        matrixId: [],
        parameterId: [],
        parameterName: [],
        protocolId: [],
        protocolCode: [],
        sampleTypeId: [],
        sampleTypeName: [],
        feeBeforeTax: [],
        feeAfterTax: [],
    };
}

export function MatricesView() {
    const { t } = useTranslation();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
    const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
    const [editMatrixId, setEditMatrixId] = useState<string | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 20);

    const listInput = useMemo(
        () => ({
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,
                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedSearch, pagination.currentPage, pagination.itemsPerPage],
    );

    const matricesListQ = useMatricesList(listInput);

    const allItems = useMemo(() => (matricesListQ.data?.data ?? []) as Matrix[], [matricesListQ.data]);

    const serverMeta = matricesListQ.data?.meta;
    const serverTotal = serverMeta?.totalItems ?? serverMeta?.total ?? 0;
    const serverPages = serverMeta?.totalPages ?? 1;

    useEffect(() => {
        setServerTotalPages(serverPages);
    }, [serverPages]);

    const onSearchChange = (v: string) => {
        setSearchTerm(v);
        pagination.resetPage();
    };

    const openCreate = () => {
        setCreateOpen(true);
    };

    const [excelFilters, setExcelFilters] = useState<ExcelFiltersState>(() => createEmptyFilters());

    const pageItems = useMemo(() => applyLocalFilters(allItems, excelFilters), [allItems, excelFilters]);

    const totalItems = serverTotal;
    const totalPages = serverPages;

    const clearAllExcelFilters = () => {
        setExcelFilters(createEmptyFilters());
        pagination.resetPage();
    };

    const isLoading = matricesListQ.isLoading;
    const isError = matricesListQ.isError;

    const onExcelFiltersChange = (next: ExcelFiltersState) => {
        setExcelFilters(next);
        pagination.resetPage();
    };

    return (
        <div className="space-y-4">
            <LibraryHeader
                titleKey="library.matrices.title"
                subtitleKey="library.matrices.total"
                totalCount={totalItems}
                searchValue={searchTerm}
                onSearchChange={onSearchChange}
                onAdd={openCreate}
                addLabelKey="library.matrices.actions.add"
                searchPlaceholderKey="library.matrices.searchPlaceholder"
            />

            {isLoading ? <MatricesSkeleton /> : null}

            {isError ? (
                <div className="bg-background border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="text-sm font-medium text-foreground">{String(t("common.errorTitle"))}</div>
                        <div className="text-sm text-muted-foreground">{String(t("library.matrices.errors.loadFailed"))}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="flex gap-4">
                    <div className="flex-1 bg-background rounded-lg border border-border overflow-hidden">
                        <MatricesTable
                            items={pageItems}
                            selectedRowKey={selectedRowKey}
                            onSelectRow={(rowKey, matrixId) => {
                                setSelectedRowKey((cur) => (cur === rowKey ? null : rowKey));
                                setSelectedMatrixId((cur) => (cur === matrixId ? null : matrixId));
                            }}
                            onOpenEdit={(id) => {
                                setEditMatrixId(id);
                                setEditOpen(true);
                            }}
                            onOpenDelete={(id) => {
                                setEditMatrixId(id); // Use the same for delete or create a deleteMatrixId, wait, I can just use a separate state or just pass it direct
                                setEditOpen(false);
                                setDeleteOpen(true);
                            }}
                            excelFilters={excelFilters}
                            onExcelFiltersChange={onExcelFiltersChange}
                            onClearAllExcelFilters={clearAllExcelFilters}
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

                    <MatrixDetailPanel
                        matrixId={selectedMatrixId}
                        onClose={() => {
                            setSelectedMatrixId(null);
                            setSelectedRowKey(null);
                        }}
                    />

                    <MatricesEditModal open={editOpen} matrixId={editOpen ? editMatrixId : null} onClose={() => setEditOpen(false)} />

                    <MatricesDeleteConfirm
                        open={deleteOpen}
                        matrixId={editMatrixId}
                        onClose={() => setDeleteOpen(false)}
                        onDeleted={(id) => {
                            if (selectedMatrixId === id) {
                                setSelectedMatrixId(null);
                                setSelectedRowKey(null);
                            }
                        }}
                    />
                </div>
            ) : null}

            <MatricesCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
}
