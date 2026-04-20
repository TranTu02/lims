import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

import { analysesCreate, analysesDelete, analysesUpdate, useAnalysesList } from "@/api/analyses";
import { analysesKeys } from "@/api/analyses";

import type { AnalysisListItem, AnalysisResultStatusDb, AnalysisStatusDb } from "@/types/analysis";

import { useServerPagination } from "@/components/library/hooks/useServerPagination";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import { AnalysisCreateModal } from "./AnalysisCreateModal";
import { AnalysisUpdateModal } from "./AnalysisUpdateModal";
import { AnalysisDeleteModal } from "./AnalysisDeleteModal";
import { AnalysesTable, type AnalysesExcelFiltersState } from "./AnalysesTable";
import { HelpBubble } from "@/components/inventory/chemical/HelpBubble";

function Skeleton() {
    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        </div>
    );
}

function createEmptyFilters(): AnalysesExcelFiltersState {
    return {
        analysisId: [],
        sampleId: [],
        matrixId: [],
        parameterId: [],
        parameterName: [],
        analysisStatus: [],
        analysisResultStatus: [],
    };
}

function hasAnyExcelFilter(f: AnalysesExcelFiltersState): boolean {
    return (
        (f.analysisId?.length ?? 0) > 0 ||
        (f.sampleId?.length ?? 0) > 0 ||
        (f.matrixId?.length ?? 0) > 0 ||
        (f.parameterId?.length ?? 0) > 0 ||
        (f.parameterName?.length ?? 0) > 0 ||
        (f.analysisStatus?.length ?? 0) > 0 ||
        (f.analysisResultStatus?.length ?? 0) > 0
    );
}

function pickSingle(arr: string[]): string | undefined {
    return arr.length === 1 ? arr[0] : undefined;
}

export function AnalysesMainPanel() {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    const [excelFilters, setExcelFilters] = useState<AnalysesExcelFiltersState>(() => createEmptyFilters());

    const excelFiltering = useMemo(() => hasAnyExcelFilter(excelFilters), [excelFilters]);

    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);

    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);
    const pagination = useServerPagination(serverTotalPages, 10);

    const [createOpen, setCreateOpen] = useState(false);

    const [updateOpen, setUpdateOpen] = useState(false);
    const [updateTarget, setUpdateTarget] = useState<AnalysisListItem | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<AnalysisListItem | null>(null);

    const listInput = useMemo(() => {
        const singleAnalysisId = pickSingle(excelFilters.analysisId);
        const singleSampleId = pickSingle(excelFilters.sampleId);
        const singleMatrixId = pickSingle(excelFilters.matrixId);
        const singleParameterId = pickSingle(excelFilters.parameterId);
        const singleParameterName = pickSingle(excelFilters.parameterName);

        const singleStatus = excelFilters.analysisStatus.length === 1 ? excelFilters.analysisStatus[0] : undefined;

        const singleResultStatus = excelFilters.analysisResultStatus.length === 1 ? excelFilters.analysisResultStatus[0] : undefined;

        return {
            query: {
                page: pagination.currentPage,
                itemsPerPage: pagination.itemsPerPage,

                search: debouncedSearch.trim().length ? debouncedSearch.trim() : null,

                ...(singleAnalysisId ? { analysisId: singleAnalysisId } : {}),
                ...(singleSampleId ? { sampleId: singleSampleId } : {}),
                ...(singleMatrixId ? { matrixId: singleMatrixId } : {}),
                ...(singleParameterId ? { parameterId: singleParameterId } : {}),
                ...(singleParameterName ? { parameterName: singleParameterName } : {}),
                ...(singleStatus ? { analysisStatus: singleStatus } : {}),
                ...(singleResultStatus ? { analysisResultStatus: singleResultStatus } : {}),

                filters: {
                    analysisId: excelFilters.analysisId,
                    sampleId: excelFilters.sampleId,
                    matrixId: excelFilters.matrixId,
                    parameterId: excelFilters.parameterId,
                    parameterName: excelFilters.parameterName,
                    analysisStatus: excelFilters.analysisStatus,
                    analysisResultStatus: excelFilters.analysisResultStatus,
                },
            },
        };
    }, [
        pagination.currentPage,
        pagination.itemsPerPage,
        debouncedSearch,
        excelFilters.analysisId,
        excelFilters.sampleId,
        excelFilters.matrixId,
        excelFilters.parameterId,
        excelFilters.parameterName,
        excelFilters.analysisStatus,
        excelFilters.analysisResultStatus,
    ]);

    const listQ = useAnalysesList(listInput, { enabled: true });

    const items = useMemo(() => (listQ.data?.data ?? []) as AnalysisListItem[], [listQ.data]);

    const totalItems = useMemo(() => {
        const meta = listQ.data?.meta ?? null;
        const totalFromTotal = typeof (meta as { total?: unknown } | null)?.total === "number" ? (meta as { total: number }).total : null;

        const totalFromTotalItems = typeof (meta as { totalItems?: unknown } | null)?.totalItems === "number" ? (meta as unknown as { totalItems: number }).totalItems : null;

        return (totalFromTotal ?? totalFromTotalItems ?? 0) as number;
    }, [listQ.data?.meta]);

    const totalPages = useMemo(() => (listQ.data?.meta?.totalPages ?? 1) as number, [listQ.data?.meta?.totalPages]);

    useEffect(() => {
        setServerTotalPages(totalPages);
    }, [totalPages]);

    useEffect(() => {
        if (pagination.currentPage > totalPages) {
            pagination.handlePageChange(totalPages);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);

    const onSearchChange = (v: string) => {
        setSearchTerm(v);
        pagination.resetPage();
    };

    const onExcelFiltersChange = (next: AnalysesExcelFiltersState) => {
        setExcelFilters(next);
        pagination.resetPage();
    };

    const pendingCountOnPage = useMemo(() => items.filter((r) => r.analysisStatus === "Pending").length, [items]);

    const mCreate = useMutation({
        mutationFn: analysesCreate,
        onSuccess: async (res) => {
            if (!res.success) {
                toast.error(res.error?.message ?? t("common.toast.failed"));
                return;
            }
            toast.success(t("common.success"));
            setCreateOpen(false);
            pagination.resetPage();
            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
        },
        onError: () => toast.error(t("common.toast.failed")),
    });

    const mUpdate = useMutation({
        mutationFn: analysesUpdate,
        onSuccess: async (res) => {
            if (!res.success) {
                toast.error(res.error?.message ?? t("common.toast.failed"));
                return;
            }
            toast.success(t("common.success"));
            setUpdateOpen(false);
            setUpdateTarget(null);
            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
        },
        onError: () => toast.error(t("common.toast.failed")),
    });

    const mDelete = useMutation({
        mutationFn: analysesDelete,
        onSuccess: async (res) => {
            if (!res.success) {
                toast.error(res.error?.message ?? t("common.toast.failed"));
                return;
            }
            toast.success(t("common.success"));
            setDeleteOpen(false);
            setDeleteTarget(null);
            await qc.invalidateQueries({ queryKey: analysesKeys.all, exact: false });
        },
        onError: () => toast.error(t("common.toast.failed")),
    });

    const isLoading = listQ.isLoading;
    const isError = listQ.isError;

    return (
        <div className="p-6 space-y-6 relative">
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t("common.search")} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 bg-background" />
                    </div>

                    <div className="flex w-full md:w-auto md:justify-end">
                        <Button variant="default" className="flex w-full items-center gap-2 md:w-auto" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4" />
                            {t("common.create")}
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border p-3 bg-background">
                        <div className="text-sm text-muted-foreground">{t("common.count")}</div>
                        <div className="text-2xl font-semibold text-foreground">{totalItems}</div>
                    </div>

                    <div className="rounded-lg border border-border p-3 bg-background">
                        <div className="text-sm text-muted-foreground">{t("lab.analyses.status.Pending")}</div>
                        <div className="text-2xl font-semibold text-foreground">{pendingCountOnPage}</div>
                    </div>
                </div>

                {excelFiltering ? <div className="mt-3 text-xs text-muted-foreground">{t("common.filteringActive", { defaultValue: "Filtering is active." })}</div> : null}
            </div>

            {isLoading ? <Skeleton /> : null}

            {isError ? (
                <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                        <div className="font-medium text-foreground">{t("common.error")}</div>
                        <div className="text-sm text-muted-foreground">{t("common.toast.failed")}</div>
                    </div>
                </div>
            ) : null}

            {!isLoading && !isError ? (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <AnalysesTable
                        items={items}
                        selectedRowKey={selectedRowKey}
                        onSelectRow={(rowKey, analysisId) => {
                            setSelectedRowKey(rowKey);
                            void analysisId;
                        }}
                        onEdit={(analysisId) => {
                            const row = items.find((x) => x.analysisId === analysisId) ?? null;
                            if (!row) return;
                            setUpdateTarget(row);
                            setUpdateOpen(true);
                        }}
                        onDelete={(analysisId) => {
                            const row = items.find((x) => x.analysisId === analysisId) ?? null;
                            if (!row) return;
                            setDeleteTarget(row);
                            setDeleteOpen(true);
                        }}
                        excelFilters={excelFilters}
                        onExcelFiltersChange={onExcelFiltersChange}
                    />

                    <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={totalPages}
                        itemsPerPage={pagination.itemsPerPage}
                        totalItems={totalItems}
                        onPageChange={pagination.handlePageChange}
                        onItemsPerPageChange={pagination.handleItemsPerPageChange}
                    />
                </div>
            ) : null}

            <AnalysisCreateModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                submitting={mCreate.isPending}
                onSubmit={(v) => {
                    mCreate.mutate({
                        body: {
                            sampleId: v.sampleId,
                            matrixId: v.matrixId,
                            parameterId: v.parameterId,
                            parameterName: v.parameterName,
                            analysisStatus: v.analysisStatus as AnalysisStatusDb,
                            analysisResultStatus: (v.analysisResultStatus ?? null) as AnalysisResultStatusDb | null,
                            analysisResult: v.analysisResult,
                            analysisCompletedAt: v.analysisCompletedAt,
                        },
                    });
                }}
            />

            <AnalysisUpdateModal
                open={updateOpen}
                onClose={() => {
                    setUpdateOpen(false);
                    setUpdateTarget(null);
                }}
                submitting={mUpdate.isPending}
                target={updateTarget}
                onSubmit={(v) => {
                    if (!updateTarget) return;
                    mUpdate.mutate({
                        body: {
                            analysisId: updateTarget.analysisId,
                            sampleId: v.sampleId,
                            matrixId: v.matrixId,
                            parameterId: v.parameterId,
                            parameterName: v.parameterName,
                            analysisStatus: v.analysisStatus as AnalysisStatusDb,
                            analysisResult: v.analysisResult,
                            analysisResultStatus: (v.analysisResultStatus ?? null) as AnalysisResultStatusDb | null,
                            analysisCompletedAt: v.analysisCompletedAt,
                        },
                    });
                }}
            />

            <AnalysisDeleteModal
                open={deleteOpen}
                onClose={() => {
                    setDeleteOpen(false);
                    setDeleteTarget(null);
                }}
                submitting={mDelete.isPending}
                target={deleteTarget}
                onConfirm={() => {
                    if (!deleteTarget) return;
                    mDelete.mutate({ body: { analysisId: deleteTarget.analysisId } });
                }}
            />
            <HelpBubble guidePath="guide-analyses.html" />
        </div>
    );
}
