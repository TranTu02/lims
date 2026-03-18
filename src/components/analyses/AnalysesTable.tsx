import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Filter, X, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { RowActionIcons } from "@/components/common/RowActionIcons";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import { useAnalysesFilter } from "@/api/analyses";
import type {
  AnalysisListItem,
  AnalysisResultStatusDb,
  AnalysisStatusDb,
} from "@/types/analysis";

export type AnalysesExcelFiltersState = {
  analysisId: string[];
  sampleId: string[];
  matrixId: string[];
  parameterId: string[];
  parameterName: string[];
  analysisStatus: AnalysisStatusDb[];
  analysisResultStatus: AnalysisResultStatusDb[];
};

type SupportedFilterKey =
  | "sampleId"
  | "matrixId"
  | "parameterName"
  | "analysisStatus"
  | "analysisResultStatus";

type FilterFrom = SupportedFilterKey;

type AnalysesFilterOtherFilter = {
  filterFrom: FilterFrom;
  filterValues: Array<string | number>;
};

type OptionWithCount<T extends string | number> = { value: T; count: number };

const FILTER_FROM_MAP: Record<SupportedFilterKey, FilterFrom> = {
  sampleId: "sampleId",
  matrixId: "matrixId",
  parameterName: "parameterName",
  analysisStatus: "analysisStatus",
  analysisResultStatus: "analysisResultStatus",
};

const SUPPORTED_KEYS: SupportedFilterKey[] = [
  "sampleId",
  "matrixId",
  "parameterName",
  "analysisStatus",
  "analysisResultStatus",
];

function buildOtherFilters(
  filters: AnalysesExcelFiltersState,
  excludeKey: SupportedFilterKey,
): AnalysesFilterOtherFilter[] {
  const out: AnalysesFilterOtherFilter[] = [];

  for (const k of SUPPORTED_KEYS) {
    if (k === excludeKey) continue;

    const v = filters[k];
    if (!Array.isArray(v) || v.length === 0) continue;

    out.push({
      filterFrom: FILTER_FROM_MAP[k],
      filterValues: v as Array<string | number>,
    });
  }

  return out;
}

type ExcelFilterPopoverProps =
  | {
      type: "string";
      title: string;
      filterKey: "sampleId" | "matrixId" | "parameterName";
      activeCount: number;
      selected: string[];
      excelFilters: AnalysesExcelFiltersState;
      onApply: (values: string[]) => void;
      onClear: () => void;
      limit?: number;
    }
  | {
      type: "status";
      title: string;
      filterKey: "analysisStatus";
      activeCount: number;
      selected: AnalysisStatusDb[];
      excelFilters: AnalysesExcelFiltersState;
      onApply: (values: AnalysisStatusDb[]) => void;
      onClear: () => void;
      limit?: number;
    }
  | {
      type: "resultStatus";
      title: string;
      filterKey: "analysisResultStatus";
      activeCount: number;
      selected: AnalysisResultStatusDb[];
      excelFilters: AnalysesExcelFiltersState;
      onApply: (values: AnalysisResultStatusDb[]) => void;
      onClear: () => void;
      limit?: number;
    };

function ExcelFilterPopover(props: ExcelFilterPopoverProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [localSelected, setLocalSelected] = useState<Array<string | number>>(
    props.selected as Array<string | number>,
  );

  const filterFrom = FILTER_FROM_MAP[props.filterKey];

  const filterInput = useMemo(
    () => ({
      body: {
        filterFrom,
        textFilter: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
        otherFilters: buildOtherFilters(props.excelFilters, props.filterKey),
        limit: props.limit ?? 200,
      },
    }),
    [filterFrom, debouncedSearch, props.excelFilters, props.filterKey, props.limit],
  );

  const q = useAnalysesFilter(filterInput, { enabled: open });

  const apiOptions = useMemo((): Array<OptionWithCount<string>> => {
    const data = q.data ?? [];
    return data
      .map((x) => ({ value: String(x.filterValue), count: x.count }))
      .filter((x) => x.value.trim().length > 0);
  }, [q.data]);

  const filteredOptions = useMemo(() => {
    const qtext = search.trim().toLowerCase();
    if (!qtext) return apiOptions;
    return apiOptions.filter((o) => o.value.toLowerCase().includes(qtext));
  }, [apiOptions, search]);

  const toggle = (v: string) => {
    setLocalSelected((cur) => {
      const has = cur.some((x) => String(x) === v);
      if (has) return cur.filter((x) => String(x) !== v);
      return [...cur, v];
    });
  };

  const renderValueLabel = (v: string) => {
    if (props.filterKey === "analysisStatus") {
      return String(t(`lab.analyses.status.${v as AnalysisStatusDb}`));
    }
    if (props.filterKey === "analysisResultStatus") {
      return String(t(`lab.analyses.resultStatus.${v as AnalysisResultStatusDb}`));
    }
    return v;
  };

  const apply = () => {
    if (props.filterKey === "analysisStatus") {
      props.onApply(localSelected.map(String) as AnalysisStatusDb[]);
    } else if (props.filterKey === "analysisResultStatus") {
      props.onApply(localSelected.map(String) as AnalysisResultStatusDb[]);
    } else {
      props.onApply(localSelected.map(String));
    }
    setOpen(false);
  };

  const clear = () => {
    props.onClear();
    setLocalSelected([]);
    setSearch("");
    setOpen(false);
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setLocalSelected(props.selected as Array<string | number>);
      setSearch("");
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={String(t("common.filter", { defaultValue: "Filter" }))}
          className="relative"
        >
          <Filter className="h-4 w-4" />
          {props.activeCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">{props.title}</div>
          <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 space-y-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={String(t("common.search", { defaultValue: "Search" }))}
            className="border border-border"
          />
        </div>

        <div className="border-t border-border">
          <Command shouldFilter={false}>
            <CommandList className="max-h-64">
              {q.isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">
                  {String(t("common.loading", { defaultValue: "Loading..." }))}
                </div>
              ) : q.isError ? (
                <div className="p-3 text-sm text-muted-foreground">
                  {String(t("common.toast.failed", { defaultValue: "Failed" }))}
                </div>
              ) : filteredOptions.length === 0 ? (
                <CommandEmpty>{String(t("common.noData"))}</CommandEmpty>
              ) : null}

              {!q.isLoading && !q.isError ? (
                <CommandGroup>
                  {filteredOptions.map((o) => {
                    const key = String(o.value);
                    const checked = localSelected.some((x) => String(x) === key);

                    return (
                      <CommandItem
                        key={key}
                        value={key}
                        onSelect={() => toggle(key)}
                        className="flex items-start justify-between gap-2"
                      >
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          <span
                            className={[
                              "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border",
                              checked ? "bg-primary text-primary-foreground" : "bg-background",
                            ].join(" ")}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>

                          <span className="min-w-0 flex-1 text-sm text-foreground break-words">
                            {renderValueLabel(key)}
                          </span>
                        </div>

                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {o.count}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}

              {q.isError ? (
                <div className="flex items-start gap-2 p-3 text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div className="text-sm">{String(t("common.toast.requestFailed"))}</div>
                </div>
              ) : null}
            </CommandList>
          </Command>

          <div className="p-3 border-t border-border flex flex-col gap-2">
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={clear}
              disabled={props.activeCount === 0}
            >
              {String(t("common.clear", { defaultValue: "Clear" }))}
            </Button>
            <Button type="button" className="w-full" onClick={apply}>
              {String(t("common.apply", { defaultValue: "Apply" }))}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AnalysisStatusBadge({ status }: { status: AnalysisStatusDb }) {
  const { t } = useTranslation();

  const map: Record<AnalysisStatusDb, string> = {
    Approved: "bg-success text-success-foreground",
    TechReview: "bg-warning text-warning-foreground",
    DataEntered: "bg-secondary text-secondary-foreground",
    Testing: "bg-primary text-primary-foreground",
    ReTest: "bg-warning text-warning-foreground",
    Complained: "bg-destructive/80 text-destructive-foreground",
    Pending: "bg-muted text-foreground",
    Cancelled: "bg-destructive text-destructive-foreground",
  };

  return (
    <Badge variant="secondary" className={`text-xs ${map[status]}`}>
      {t(`lab.analyses.status.${status}`)}
    </Badge>
  );
}

function AnalysisResultStatusBadge({ status }: { status: AnalysisResultStatusDb | null }) {
  const { t } = useTranslation();

  if (!status) return <span className="text-muted-foreground">{t("common.noData")}</span>;

  const map: Record<AnalysisResultStatusDb, string> = {
    Pass: "bg-success text-success-foreground",
    Fail: "bg-destructive text-destructive-foreground",
    NotEvaluated: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="secondary" className={`text-xs ${map[status]}`}>
      {t(`lab.analyses.resultStatus.${status}`)}
    </Badge>
  );
}

type Props = {
  items: AnalysisListItem[];

  selectedRowKey: string | null;
  onSelectRow: (rowKey: string, analysisId: string) => void;

  onEdit: (analysisId: string) => void;
  onDelete: (analysisId: string) => void;

  excelFilters: AnalysesExcelFiltersState;
  onExcelFiltersChange: (next: AnalysesExcelFiltersState) => void;
};

export function AnalysesTable({
  items,
  selectedRowKey,
  onSelectRow,
  onEdit,
  onDelete,
  excelFilters,
  onExcelFiltersChange,
}: Props) {
  const { t } = useTranslation();
  const dash = String(t("common.noData"));

  const setSampleId = (values: string[]) =>
    onExcelFiltersChange({ ...excelFilters, sampleId: values });

  const setMatrixId = (values: string[]) =>
    onExcelFiltersChange({ ...excelFilters, matrixId: values });

  const setParameterName = (values: string[]) =>
    onExcelFiltersChange({ ...excelFilters, parameterName: values });

  const setStatus = (values: AnalysisStatusDb[]) =>
    onExcelFiltersChange({ ...excelFilters, analysisStatus: values });

  const setResultStatus = (values: AnalysisResultStatusDb[]) =>
    onExcelFiltersChange({ ...excelFilters, analysisResultStatus: values });

  const toDash = (v: unknown) => {
    if (typeof v === "string") return v.trim().length ? v : dash;
    if (v == null) return dash;
    return String(v);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              {String(t("lab.analyses.analysisId"))}
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.analyses.sampleId"))}
                <ExcelFilterPopover
                  type="string"
                  title={String(t("lab.analyses.sampleId"))}
                  filterKey="sampleId"
                  activeCount={excelFilters.sampleId.length}
                  selected={excelFilters.sampleId}
                  excelFilters={excelFilters}
                  onApply={(v) => setSampleId(v)}
                  onClear={() => setSampleId([])}
                />
              </span>
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.analyses.matrixId"))}
                <ExcelFilterPopover
                  type="string"
                  title={String(t("lab.analyses.matrixId"))}
                  filterKey="matrixId"
                  activeCount={excelFilters.matrixId.length}
                  selected={excelFilters.matrixId}
                  excelFilters={excelFilters}
                  onApply={(v) => setMatrixId(v)}
                  onClear={() => setMatrixId([])}
                />
              </span>
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.analyses.parameterName"))}
                <ExcelFilterPopover
                  type="string"
                  title={String(t("lab.analyses.parameterName"))}
                  filterKey="parameterName"
                  activeCount={excelFilters.parameterName.length}
                  selected={excelFilters.parameterName}
                  excelFilters={excelFilters}
                  onApply={(v) => setParameterName(v)}
                  onClear={() => setParameterName([])}
                />
              </span>
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.analyses.analysisStatus"))}
                <ExcelFilterPopover
                  type="status"
                  title={String(t("lab.analyses.analysisStatus"))}
                  filterKey="analysisStatus"
                  activeCount={excelFilters.analysisStatus.length}
                  selected={excelFilters.analysisStatus}
                  excelFilters={excelFilters}
                  onApply={(v) => setStatus(v)}
                  onClear={() => setStatus([])}
                />
              </span>
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.analyses.analysisResultStatus"))}
                <ExcelFilterPopover
                  type="resultStatus"
                  title={String(t("lab.analyses.analysisResultStatus"))}
                  filterKey="analysisResultStatus"
                  activeCount={excelFilters.analysisResultStatus.length}
                  selected={excelFilters.analysisResultStatus}
                  excelFilters={excelFilters}
                  onApply={(v) => setResultStatus(v)}
                  onClear={() => setResultStatus([])}
                />
              </span>
            </th>

            <th className="px-3 py-4 text-center text-xs font-medium text-muted-foreground uppercase">
              {String(t("common.actions"))}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((row) => {
            const rowKey = row.analysisId;
            const isSelected = selectedRowKey === rowKey;

            return (
              <tr
                key={row.analysisId}
                className={`hover:bg-accent/30 transition-colors ${
                  isSelected ? "bg-accent/20" : ""
                }`}
                onClick={() => onSelectRow(rowKey, row.analysisId)}
              >
                <td className="px-3 py-4 font-semibold text-sm text-primary">
                  {toDash(row.analysisId)}
                </td>

                <td className="px-3 py-4 text-sm text-foreground">{toDash(row.sampleId)}</td>
                <td className="px-3 py-4 text-sm text-foreground">{toDash(row.matrixId)}</td>
                <td className="px-3 py-4 text-sm text-foreground">
                  {row.parameterName ? row.parameterName : String(t("common.noData"))}
                </td>

                <td className="px-3 py-4">
                  <AnalysisStatusBadge status={row.analysisStatus} />
                </td>

                <td className="px-3 py-4">
                  <AnalysisResultStatusBadge status={row.analysisResultStatus ?? null} />
                </td>

                <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                  <RowActionIcons
                    showView={false}
                    showDelete
                    onEdit={() => onEdit(row.analysisId)}
                    onDelete={() => onDelete(row.analysisId)}
                  />
                </td>
              </tr>
            );
          })}

          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                {String(t("common.noData"))}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
