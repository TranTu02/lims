import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

import {
  analysesCreate,
  analysesDelete,
  analysesGetList,
  analysesUpdate,
} from "@/api/analyses";
import { analysesKeys } from "@/api/analysesKeys";

import type {
  AnalysisListItem,
  AnalysisResultStatusDb,
  AnalysisStatusDb,
} from "@/types/analysis";

import { AnalysisCreateModal } from "./AnalysisCreateModal";
import { AnalysisUpdateModal } from "./AnalysisUpdateModal";
import { AnalysisDeleteModal } from "./AnalysisDeleteModal";
import { RowActionIcons } from "../common/RowActionIcons";

type Row = AnalysisListItem;

function getAnalysisStatusBadgeProps(status: AnalysisStatusDb): {
  className: string;
  labelKey: `lab.analyses.status.${AnalysisStatusDb}`;
} {
  switch (status) {
    case "Approved":
      return {
        className: "bg-success text-success-foreground",
        labelKey: `lab.analyses.status.${status}`,
      };

    case "TechReview":
      return {
        className: "bg-warning text-warning-foreground",
        labelKey: `lab.analyses.status.${status}`,
      };

    case "DataEntered":
      return {
        className: "bg-secondary text-secondary-foreground",
        labelKey: `lab.analyses.status.${status}`,
      };

    case "Testing":
      return {
        className: "bg-primary text-primary-foreground",
        labelKey: `lab.analyses.status.${status}`,
      };

    case "ReTest":
      return {
        className: "bg-warning text-warning-foreground",
        labelKey: `lab.analyses.status.${status}`,
      };

    case "Pending":
      return {
        className: "bg-muted text-foreground",
        labelKey: `lab.analyses.status.${status}`,
      };

    case "Cancelled":
      return {
        className: "bg-destructive text-destructive-foreground",
        labelKey: `lab.analyses.status.${status}`,
      };

    default: {
      const _exhaustive: never = status;
      return {
        className: "bg-muted text-foreground",
        labelKey: `lab.analyses.status.${_exhaustive}`,
      };
    }
  }
}

function getAnalysisResultStatusBadgeProps(status: AnalysisResultStatusDb): {
  className: string;
  labelKey: `lab.analyses.resultStatus.${AnalysisResultStatusDb}`;
} {
  switch (status) {
    case "Pass":
      return {
        className: "bg-success text-success-foreground",
        labelKey: `lab.analyses.resultStatus.${status}`,
      };

    case "Fail":
      return {
        className: "bg-destructive text-destructive-foreground",
        labelKey: `lab.analyses.resultStatus.${status}`,
      };

    case "NotEvaluated":
      return {
        className: "bg-muted text-muted-foreground",
        labelKey: `lab.analyses.resultStatus.${status}`,
      };

    default: {
      const _exhaustive: never = status;
      return {
        className: "bg-muted text-foreground",
        labelKey: `lab.analyses.resultStatus.${_exhaustive}`,
      };
    }
  }
}

export function AnalysesMainPanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");

  const [createOpen, setCreateOpen] = useState(false);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<Row | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [loadingList, setLoadingList] = useState(false);
  const [errorList, setErrorList] = useState<string | null>(null);

  const [list, setList] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{
    totalPages: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoadingList(true);
      setErrorList(null);

      const res = await analysesGetList({
        query: { page, itemsPerPage },
      });

      if (cancelled) return;

      if (!res.success) {
        setList([]);
        setMeta(null);
        setErrorList(res.error?.message ?? t("common.toast.failed"));
        setLoadingList(false);
        return;
      }

      const data = res.data ?? [];
      setList(Array.isArray(data) ? data : []);

      const m = res.meta ?? null;

      const totalPages =
        typeof m?.totalPages === "number" && Number.isFinite(m.totalPages)
          ? m.totalPages
          : 1;

      const totalFromTotal =
        typeof (m as { total?: unknown } | null)?.total === "number" &&
        Number.isFinite((m as { total: number }).total)
          ? (m as { total: number }).total
          : null;

      const totalFromTotalItems =
        typeof (m as { totalItems?: unknown } | null)?.totalItems === "number" &&
        Number.isFinite((m as { totalItems: number }).totalItems)
          ? (m as { totalItems: number }).totalItems
          : null;

      const total = totalFromTotal ?? totalFromTotalItems ?? data.length;

      setMeta({ totalPages, total });
      setLoadingList(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [page, itemsPerPage, refreshTick, t]);

  const rows = list;

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) => {
      const sampleId = (r.sampleId ?? "").toLowerCase();
      const analysisId = (r.analysisId ?? "").toLowerCase();
      const param = (r.parameterName ?? "").toLowerCase();
      return (
        sampleId.includes(term) ||
        analysisId.includes(term) ||
        param.includes(term)
      );
    });
  }, [rows, searchTerm]);

  const pendingCount = rows.filter((r) => r.analysisStatus === "Pending").length;

  const mCreate = useMutation({
    mutationFn: analysesCreate,
    onSuccess: async (res) => {
      if (!res.success) {
        toast.error(res.error?.message ?? t("common.toast.failed"));
        return;
      }
      toast.success(t("common.success"));
      setCreateOpen(false);
      setPage(1);
      setRefreshTick((x) => x + 1);
      await qc.invalidateQueries({ queryKey: analysesKeys.lists() });
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
      setRefreshTick((x) => x + 1);
      await qc.invalidateQueries({ queryKey: analysesKeys.lists() });
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
      setRefreshTick((x) => x + 1);
      await qc.invalidateQueries({ queryKey: analysesKeys.lists() });
    },
    onError: () => toast.error(t("common.toast.failed")),
  });

  const totalAnalyses = meta?.total ?? rows.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("common.count")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {totalAnalyses}
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">
            {t("lab.analyses.status.Pending")}
          </div>
          <div className="text-3xl font-semibold mt-1 text-foreground">
            {pendingCount}
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-background"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("common.create")}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loadingList && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-56 bg-muted rounded" />
            <div className="h-24 w-full bg-muted rounded" />
            <div className="h-40 w-full bg-muted rounded" />
          </div>
        </div>
      )}

      {/* Error */}
      {!loadingList && errorList && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">{errorList}</div>
        </div>
      )}

      {/* Table */}
      {!loadingList && !errorList && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("lab.analyses.analysisId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("lab.analyses.sampleId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("lab.analyses.matrixId")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("lab.analyses.parameterName")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("lab.analyses.analysisStatus")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    {t("lab.analyses.analysisResultStatus")}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr
                    key={r.analysisId}
                    className="hover:bg-accent transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-primary">
                      {r.analysisId}
                    </td>

                    <td className="px-4 py-3 text-sm text-foreground">
                      {r.sampleId}
                    </td>

                    <td className="px-4 py-3 text-sm text-foreground">
                      {r.matrixId}
                    </td>

                    <td className="px-4 py-3 text-sm text-foreground">
                      {r.parameterName ?? t("common.noData")}
                    </td>

                    <td className="px-4 py-3">
                      {(() => {
                        const p = getAnalysisStatusBadgeProps(r.analysisStatus);
                        return (
                          <Badge
                            variant="secondary"
                            className={`text-xs ${p.className}`}>
                            {t(p.labelKey)}
                          </Badge>
                        );
                      })()}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {r.analysisResultStatus ? (
                        (() => {
                          const p = getAnalysisResultStatusBadgeProps(
                            r.analysisResultStatus
                          );
                          return (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${p.className}`}>
                              {t(p.labelKey)}
                            </Badge>
                          );
                        })()
                      ) : (
                        <span className="text-muted-foreground">
                          {t("common.noData")}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <RowActionIcons
                        showView={false}
                        onEdit={() => {
                          setUpdateTarget(r);
                          setUpdateOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteTarget(r);
                          setDeleteOpen(true);
                        }}
                      />
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-muted-foreground">
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <Pagination
            totalPages={meta?.totalPages ?? 1}
            currentPage={page}
            itemsPerPage={itemsPerPage}
            totalItems={meta?.total ?? list.length}
            onPageChange={(p) => setPage(p)}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* ===== Modals live inside MainPanel ===== */}

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
              analysisResultStatus: (v.analysisResultStatus ??
                null) as AnalysisResultStatusDb | null,
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
              analysisResultStatus: (v.analysisResultStatus ??
                null) as AnalysisResultStatusDb | null,
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
    </div>
  );
}
