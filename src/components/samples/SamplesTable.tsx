  import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Filter, X, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { RowActionIcons } from "@/components/common/RowActionIcons";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

import { useSamplesFilter } from "@/api/samples";
import type { SampleListItem, SampleStatus } from "@/types/sample";

export type SamplesExcelFiltersState = {
  receiptId: string[];
  sampleStatus: SampleStatus[];
  sampleTypeName: string[];
};

type FilterKey = keyof SamplesExcelFiltersState;

type FilterFrom = "receiptId" | "sampleStatus" | "sampleTypeName";

type SamplesFilterOtherFilter = {
  filterFrom: FilterFrom;
  filterValues: Array<string | number>;
};

type OptionWithCount<T extends string | number> = { value: T; count: number };

const FILTER_FROM_MAP: Record<FilterKey, FilterFrom> = {
  receiptId: "receiptId",
  sampleStatus: "sampleStatus",
  sampleTypeName: "sampleTypeName",
};

function buildOtherFilters(
  filters: SamplesExcelFiltersState,
  excludeKey: FilterKey
): SamplesFilterOtherFilter[] {
  const out: SamplesFilterOtherFilter[] = [];

  (Object.keys(filters) as FilterKey[]).forEach((k) => {
    if (k === excludeKey) return;
    const v = filters[k];
    if (!Array.isArray(v) || v.length === 0) return;

    out.push({
      filterFrom: FILTER_FROM_MAP[k],
      filterValues: v as Array<string | number>,
    });
  });

  return out;
}

type ExcelFilterPopoverProps =
  | {
      type: "string";
      title: string;
      filterKey: "receiptId" | "sampleTypeName";
      activeCount: number;
      selected: string[];
      excelFilters: SamplesExcelFiltersState;
      onApply: (values: string[]) => void;
      onClear: () => void;
      limit?: number;
    }
  | {
      type: "status";
      title: string;
      filterKey: "sampleStatus";
      activeCount: number;
      selected: SampleStatus[];
      excelFilters: SamplesExcelFiltersState;
      onApply: (values: SampleStatus[]) => void;
      onClear: () => void;
      limit?: number;
    };

function ExcelFilterPopover(props: ExcelFilterPopoverProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const [localSelected, setLocalSelected] = useState<Array<string | number>>(
    props.selected as Array<string | number>
  );

  const filterFrom = FILTER_FROM_MAP[props.filterKey];

  const filterInput = useMemo(
    () => ({
      body: {
        filterFrom,
        textFilter: debouncedSearch.trim().length
          ? debouncedSearch.trim()
          : null,
        otherFilters: buildOtherFilters(props.excelFilters, props.filterKey),
        limit: props.limit ?? 200,
      },
    }),
    [
      filterFrom,
      debouncedSearch,
      props.excelFilters,
      props.filterKey,
      props.limit,
    ]
  );

  const q = useSamplesFilter(filterInput, { enabled: open });

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
    if (props.filterKey !== "sampleStatus") return v;

    if (v === "Received") return String(t("lab.samples.status.Received"));
    if (v === "Analyzing") return String(t("lab.samples.status.Analyzing"));
    if (v === "Stored") return String(t("lab.samples.status.Stored"));
    if (v === "Disposed") return String(t("lab.samples.status.Disposed"));
    return v;
  };

  const apply = () => {
    if (props.filterKey === "sampleStatus") {
      props.onApply(localSelected.map(String) as SampleStatus[]);
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
          className="relative">
          <Filter className="h-4 w-4" />
          {props.activeCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 p-0">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">
            {props.title}
          </div>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setOpen(false)}>
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
                    const checked = localSelected.some(
                      (x) => String(x) === key
                    );

                    return (
                      <CommandItem
                        key={key}
                        value={key}
                        onSelect={() => toggle(key)}
                        className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          {/* ✅ checkbox fixed size, không bị co */}
                          <span
                            className={[
                              "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-border",
                              checked
                                ? "bg-primary text-primary-foreground"
                                : "bg-background",
                            ].join(" ")}>
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>

                          {/* ✅ text không ép checkbox; wrap/truncate tùy bạn */}
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
                  <div className="text-sm">
                    {String(t("common.toast.requestFailed"))}
                  </div>
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

/** ========= badges ========= */
function StatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();

  if (!status) {
    return (
      <Badge variant="outline" className="text-xs">
        {t("common.noData")}
      </Badge>
    );
  }

  if (status === "Stored") {
    return (
      <Badge variant="success" className="text-xs">
        {t("lab.samples.status.stored")}
      </Badge>
    );
  }

  if (status === "Analyzing") {
    return (
      <Badge variant="warning" className="text-xs">
        {t("lab.samples.status.analyzing")}
      </Badge>
    );
  }

  if (status === "Received") {
    return (
      <Badge variant="secondary" className="text-xs">
        {t("lab.samples.status.received")}
      </Badge>
    );
  }

  if (status === "Disposed") {
    return (
      <Badge variant="destructive" className="text-xs">
        {t("lab.samples.status.disposed")}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      {status}
    </Badge>
  );
}

type Props = {
  items: SampleListItem[];

  selectedRowKey: string | null;
  onSelectRow: (rowKey: string, sampleId: string) => void;

  onView: (sampleId: string) => void;
  onEdit: (sampleId: string) => void;
  onDelete: (sampleId: string) => void;

  excelFilters: SamplesExcelFiltersState;
  onExcelFiltersChange: (next: SamplesExcelFiltersState) => void;
};

export function SamplesTable({
  items,
  selectedRowKey,
  onSelectRow,
  onView,
  onEdit,
  onDelete,
  excelFilters,
  onExcelFiltersChange,
}: Props) {
  const { t } = useTranslation();
  const dash = String(t("common.noData"));

  const setReceiptId = (values: string[]) =>
    onExcelFiltersChange({ ...excelFilters, receiptId: values });

  const setStatus = (values: SampleStatus[]) =>
    onExcelFiltersChange({ ...excelFilters, sampleStatus: values });

  const setSampleTypeName = (values: string[]) =>
    onExcelFiltersChange({ ...excelFilters, sampleTypeName: values });

  const toDash = (v: unknown) => {
    if (typeof v === "string") {
      const s = v.trim();
      return s.length ? s : dash;
    }
    if (v == null) return dash;
    return String(v);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-4xl">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              {String(t("lab.samples.sampleId"))}
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.samples.receiptId"))}
                <ExcelFilterPopover
                  type="string"
                  title={String(t("lab.samples.receiptId"))}
                  filterKey="receiptId"
                  activeCount={excelFilters.receiptId.length}
                  selected={excelFilters.receiptId}
                  excelFilters={excelFilters}
                  onApply={(v) => setReceiptId(v)}
                  onClear={() => setReceiptId([])}
                />
              </span>
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.samples.sampleTypeName"))}
                <ExcelFilterPopover
                  type="string"
                  title={String(t("lab.samples.sampleTypeName"))}
                  filterKey="sampleTypeName"
                  activeCount={excelFilters.sampleTypeName.length}
                  selected={excelFilters.sampleTypeName}
                  excelFilters={excelFilters}
                  onApply={(v) => setSampleTypeName(v)}
                  onClear={() => setSampleTypeName([])}
                />
              </span>
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              {String(t("lab.samples.sampleVolume"))}
            </th>

            <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
              <span className="inline-flex items-center gap-2">
                {String(t("lab.samples.sampleStatus"))}
                <ExcelFilterPopover
                  type="status"
                  title={String(t("lab.samples.sampleStatus"))}
                  filterKey="sampleStatus"
                  activeCount={excelFilters.sampleStatus.length}
                  selected={excelFilters.sampleStatus}
                  excelFilters={excelFilters}
                  onApply={(v) => setStatus(v)}
                  onClear={() => setStatus([])}
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
            const rowKey = row.sampleId;
            const isSelected = selectedRowKey === rowKey;

            return (
              <tr
                key={row.sampleId}
                className={`hover:bg-accent/30 transition-colors ${
                  isSelected ? "bg-accent/20" : ""
                }`}
                onClick={() => onSelectRow(rowKey, row.sampleId)}>
                <td className="px-3 py-4 font-semibold text-sm text-foreground">
                  <button
                    className="text-primary hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(row.sampleId);
                    }}>
                    {row.sampleId}
                  </button>
                </td>

                <td className="px-3 py-4 text-sm text-foreground">
                  {toDash(row.receiptId)}
                </td>
                <td className="px-3 py-4 text-sm text-foreground">
                  {toDash(row.sampleTypeName)}
                </td>
                <td className="px-3 py-4 text-sm text-muted-foreground">
                  {toDash(row.sampleVolume)}
                </td>
                <td className="px-3 py-4">
                  <StatusBadge status={row.sampleStatus ?? null} />
                </td>

                <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                  <RowActionIcons
                    onView={() => onView(row.sampleId)}
                    onEdit={() => onEdit(row.sampleId)}
                    onDelete={() => onDelete(row.sampleId)}
                    showDelete
                  />
                </td>
              </tr>
            );
          })}

          {items.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-3 py-6 text-center text-sm text-muted-foreground">
                {String(t("common.noData"))}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
