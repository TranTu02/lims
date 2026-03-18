import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Filter, X, Check } from "lucide-react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import type { QuoteDetail, QuoteListItem, QuotesCreateBody, QuotesUpdateBody } from "@/types/crm/quote";
import { crmKeys } from "@/api/crm/crmKeys";
import {
  quotesCreate,
  quotesDelete,
  quotesGetDetail,
  quotesGetList,
  quotesUpdate,
  useQuotesFilter,
  type QuotesFilterFrom,
  type QuotesFilterOtherFilter,
} from "@/api/crm/quotes";

import { QuoteDetailModal } from "@/components/crm/QuoteDetailModal";
import { QuoteUpsertModal } from "@/components/crm/QuoteUpsertModal";
import { QuoteDeleteModal } from "@/components/crm/QuoteDeleteModal";
import { RowActionIcons } from "@/components/common/RowActionIcons";

import { formatCurrency } from "@/utils/format";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

type Props = {
  externalSearch: string;
};

export type QuotesTabHandle = {
  openCreate: () => void;
};

function CardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

function toStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function quoteStatusText(status: string | null, t: (k: string, opt?: { defaultValue?: string }) => string) {
  const s = toStr(status).trim();
  if (!s) return t("common.noData");
  return t(`crm.quotes.status.${s}`, { defaultValue: s });
}

function quoteStatusBadge(status: string | null, t: (k: string, opt?: { defaultValue?: string }) => string) {
  const s = toStr(status).trim();
  if (!s) return <Badge variant="outline">{t("common.noData")}</Badge>;

  const label = quoteStatusText(s, t);

  switch (s) {
    case "Approved":
      return <Badge variant="success">{label}</Badge>;
    case "Sent":
      return <Badge variant="warning">{label}</Badge>;
    case "Draft":
      return <Badge variant="secondary">{label}</Badge>;
    case "Expired":
      return <Badge variant="destructive">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}

type QuotesExcelFiltersState = {
  quoteId: string[];
  clientId: string[];
  quoteStatus: string[];
};

type FilterKey = keyof QuotesExcelFiltersState;
type ApiFilterKey = FilterKey;

const FILTER_FROM_MAP: Record<ApiFilterKey, QuotesFilterFrom> = {
  quoteId: "quoteId",
  clientId: "clientId",
  quoteStatus: "quoteStatus",
};

function createEmptyFilters(): QuotesExcelFiltersState {
  return {
    quoteId: [],
    clientId: [],
    quoteStatus: [],
  };
}

function hasAnyExcelFilter(f: QuotesExcelFiltersState) {
  return f.quoteId.length > 0 || f.clientId.length > 0 || f.quoteStatus.length > 0;
}

function buildOtherFiltersForApi(filters: QuotesExcelFiltersState, excludeKey: ApiFilterKey): QuotesFilterOtherFilter[] {
  const out: QuotesFilterOtherFilter[] = [];

  (Object.keys(FILTER_FROM_MAP) as ApiFilterKey[]).forEach((k) => {
    if (k === excludeKey) return;
    const v = filters[k];
    if (!Array.isArray(v) || v.length === 0) return;

    out.push({
      filterFrom: FILTER_FROM_MAP[k],
      filterValues: v,
    });
  });

  return out;
}

function buildAllOtherFiltersForApi(filters: QuotesExcelFiltersState): QuotesFilterOtherFilter[] {
  const out: QuotesFilterOtherFilter[] = [];

  (Object.keys(FILTER_FROM_MAP) as ApiFilterKey[]).forEach((k) => {
    const v = filters[k];
    if (!Array.isArray(v) || v.length === 0) return;

    out.push({
      filterFrom: FILTER_FROM_MAP[k],
      filterValues: v,
    });
  });

  return out;
}

function pickValueForFilterKey(item: QuoteListItem, key: ApiFilterKey): string {
  if (key === "quoteId") return item.quoteId ?? "";
  if (key === "clientId") return (item.clientId as string | null) ?? "";
  if (key === "quoteStatus") return (item.quoteStatus as string | null) ?? "";
  return "";
}

type OptionWithCount<T extends string> = { value: T; count: number; label: string };

type ExcelFilterPopoverProps = {
  title: string;
  filterKey: ApiFilterKey;
  activeCount: number;
  selected: string[];
  excelFilters: QuotesExcelFiltersState;

  onApply: (values: string[]) => void;
  onClear: () => void;

  itemsPerPage?: number;
  renderValue?: (value: string) => string;
};

function ExcelFilterPopover(props: ExcelFilterPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [localSelected, setLocalSelected] = useState<string[]>(props.selected);

  const filterFrom = FILTER_FROM_MAP[props.filterKey];

  const input = useMemo(
    () => ({
      body: {
        filterFrom,
        textFilter: debouncedSearch.trim().length ? debouncedSearch.trim() : null,
        otherFilters: buildOtherFiltersForApi(props.excelFilters, props.filterKey),
        page: 1,
        itemsPerPage: props.itemsPerPage ?? 200,
      },
    }),
    [filterFrom, debouncedSearch, props.excelFilters, props.filterKey, props.itemsPerPage],
  );

  const q = useQuotesFilter(input, { enabled: open });
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const options = useMemo((): OptionWithCount<string>[] => {
    const list = q.data?.data ?? [];
    const counts = new Map<string, number>();

    const codeById = new Map<string, string>();

    for (const it of list) {
      if (props.filterKey === "quoteId") {
        const id = (it.quoteId ?? "").trim();
        if (!id) continue;

        counts.set(id, (counts.get(id) ?? 0) + 1);

        const code = (it.quoteCode ?? "").trim();
        if (code && !codeById.has(id)) codeById.set(id, code);

        continue;
      }

      const raw = pickValueForFilterKey(it, props.filterKey);
      const v = typeof raw === "string" ? raw.trim() : "";
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([value, count]) => {
        if (props.filterKey === "quoteId") {
          const code = codeById.get(value) ?? "";
          return { value, count, label: code ? `${value} (${code})` : value };
        }

        const label = props.renderValue ? props.renderValue(value) : value;
        return { value, count, label };
      })
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [q.data, props.filterKey, props.renderValue]);

  const toggle = (v: string) => {
    setLocalSelected((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  };

  const apply = () => {
    props.onApply(localSelected);
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
      setLocalSelected(props.selected);
      setSearch("");
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button" aria-label={t("common.filter")} className="relative">
          <Filter className="h-4 w-4" />
          {props.activeCount > 0 ? <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" /> : null}
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
            placeholder={t("common.search")}
            className="border border-border"
          />
        </div>

        <div className="border-t border-border">
          <Command shouldFilter={false}>
            <CommandList className="max-h-64">
              {q.isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">{t("common.loading")}</div>
              ) : q.isError ? (
                <div className="p-3 text-sm text-muted-foreground">{t("common.toast.failed")}</div>
              ) : options.length === 0 ? (
                <CommandEmpty>{t("common.noData")}</CommandEmpty>
              ) : null}

              {!q.isLoading && !q.isError ? (
                <CommandGroup>
                  {options.map((o) => {
                    const checked = localSelected.includes(o.value);

                    return (
                      <CommandItem
                        key={`${filterFrom}::${o.value}`}
                        value={o.value}
                        onSelect={() => toggle(o.value)}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className={[
                              "inline-flex h-4 w-4 min-w-4 flex-none shrink-0 items-center justify-center rounded-sm border border-border",
                              checked ? "bg-primary text-primary-foreground" : "bg-background",
                            ].join(" ")}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>

                          <span className="text-sm text-foreground break-words whitespace-normal">{o.label}</span>
                        </div>

                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{o.count}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : null}
            </CommandList>
          </Command>

          <div className="p-3 border-t border-border flex flex-col gap-2">
            <Button variant="outline" type="button" className="w-full" onClick={clear} disabled={props.activeCount === 0}>
              {t("common.clear")}
            </Button>
            <Button type="button" className="w-full" onClick={apply}>
              {t("common.apply")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ThWithFilter(props: {
  label: string;
  filterKey: ApiFilterKey;
  excelFilters: QuotesExcelFiltersState;
  onExcelFiltersChange: (next: QuotesExcelFiltersState) => void;
  itemsPerPageForOptions?: number;
  renderValue?: (value: string) => string;
}) {
  const { label, filterKey, excelFilters, onExcelFiltersChange } = props;

  const setStr = (key: FilterKey, values: string[]) => {
    onExcelFiltersChange({ ...excelFilters, [key]: values });
  };

  const activeCount = excelFilters[filterKey].length;

  return (
    <span className="inline-flex items-center gap-2">
      {label}
      <ExcelFilterPopover
        title={label}
        filterKey={filterKey}
        activeCount={activeCount}
        selected={excelFilters[filterKey]}
        excelFilters={excelFilters}
        onApply={(v) => setStr(filterKey, v)}
        onClear={() => setStr(filterKey, [])}
        itemsPerPage={props.itemsPerPageForOptions}
        renderValue={props.renderValue}
      />
    </span>
  );
}

export const QuotesTab = forwardRef<QuotesTabHandle, Props>(function QuotesTab(props, ref) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState<QuoteListItem | null>(null);
  const [excelFilters, setExcelFilters] = useState<QuotesExcelFiltersState>(() => createEmptyFilters());

  useImperativeHandle(ref, () => ({
    openCreate: () => setCreateOpen(true),
  }));

  const searchText = props.externalSearch.trim().length ? props.externalSearch.trim() : "";
  const hasFilters = hasAnyExcelFilter(excelFilters);

  const filterListInput = useMemo(() => {
    if (searchText.length > 0) {
      return {
        body: {
          filterFrom: "clientId" as QuotesFilterFrom,
          textFilter: searchText,
          otherFilters: buildOtherFiltersForApi(excelFilters, "clientId"),
          page,
          itemsPerPage,
        },
      };
    }

    return {
      body: {
        filterFrom: "quoteId" as QuotesFilterFrom,
        textFilter: null,
        otherFilters: buildAllOtherFiltersForApi(excelFilters),
        page,
        itemsPerPage,
      },
    };
  }, [excelFilters, itemsPerPage, page, searchText]);

  const listQuery = useMemo(
    () => ({
      page,
      itemsPerPage,
      search: searchText.length ? searchText : undefined,
      sortColumn: "createdAt",
      sortDirection: "DESC",
    }),
    [page, itemsPerPage, searchText],
  );

  const listQ = useQuery({
    queryKey: crmKeys.quotes.list(listQuery),
    enabled: !hasFilters,
    placeholderData: keepPreviousData,
    retry: false,
    queryFn: () => quotesGetList({ query: listQuery }),
  });

  const filterListQ = useQuotesFilter(filterListInput, { enabled: hasFilters });

  const items: QuoteListItem[] = hasFilters ? filterListQ.data?.data ?? [] : listQ.data?.data ?? [];

  const totalCount = hasFilters
    ? filterListQ.data?.pagination?.total ?? items.length
    : listQ.data?.pagination?.total ?? items.length;

  const totalPages = hasFilters
    ? filterListQ.data?.pagination?.totalPages ?? 1
    : listQ.data?.pagination?.totalPages ?? 1;

  const listIsLoading = hasFilters ? filterListQ.isLoading : listQ.isLoading;
  const listIsError = hasFilters ? filterListQ.isError : listQ.isError;
  const listError = hasFilters ? filterListQ.error : listQ.error;

  const editQuoteId = selected?.quoteId ?? null;

  const detailQ = useQuery({
    queryKey: editQuoteId ? crmKeys.quotes.detail(editQuoteId) : ["crm", "quotes", "detail", "null"],
    enabled: editOpen && !!editQuoteId,
    retry: false,
    queryFn: async () => {
      if (!editQuoteId) throw new Error("Missing quoteId");
      return quotesGetDetail({ params: { quoteId: editQuoteId } });
    },
  });

  const createMut = useMutation({
    mutationFn: (body: QuotesCreateBody) => quotesCreate({ body }),
    onSuccess: async () => {
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
      setCreateOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const updateMut = useMutation({
    mutationFn: (body: QuotesUpdateBody) => quotesUpdate({ body }),
    onSuccess: async () => {
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
      setEditOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (quoteId: string) => quotesDelete({ params: { quoteId } }),
    onSuccess: async () => {
      toast.success(t("common.toast.deleted"));
      await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
      setDeleteOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  if (listIsLoading) return <CardSkeleton />;

  if (listIsError) {
    const msg = listError instanceof Error ? listError.message : String(listError);
    return (
      <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {msg}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <QuoteDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} data={selected} />

      <QuoteUpsertModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
        submitting={createMut.isPending}
        onSubmit={(body) => createMut.mutateAsync(body as QuotesCreateBody).then(() => undefined)}
      />

      {editOpen ? (
        <QuoteUpsertModal
          key={editQuoteId ?? "edit-null"}
          open={editOpen}
          mode="update"
          initial={(detailQ.data ?? selected) as QuoteDetail | QuoteListItem | null}
          onClose={() => setEditOpen(false)}
          submitting={detailQ.isLoading || updateMut.isPending}
          onSubmit={(body) => updateMut.mutateAsync(body as QuotesUpdateBody).then(() => undefined)}
          onSaved={async () => {
            toast.success(t("common.toast.saved"));
            await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
          }}
        />
      ) : null}

      <QuoteDeleteModal
        open={deleteOpen}
        quoteId={selected?.quoteId ?? null}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(quoteId) => deleteMut.mutateAsync(quoteId).then(() => undefined)}
        submitting={deleteMut.isPending}
      />

      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-sm">
          {t("common.count")}: {totalCount || items.length}
        </Badge>

        {hasFilters ? (
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setExcelFilters(createEmptyFilters());
              setPage(1);
            }}
          >
            {t("common.clear")}
          </Button>
        ) : null}
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ThWithFilter
                    label={t("crm.quotes.columns.quoteId")}
                    filterKey="quoteId"
                    excelFilters={excelFilters}
                    onExcelFiltersChange={(next) => {
                      setExcelFilters(next);
                      setPage(1);
                    }}
                  />
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ThWithFilter
                    label={t("crm.quotes.columns.clientId")}
                    filterKey="clientId"
                    excelFilters={excelFilters}
                    onExcelFiltersChange={(next) => {
                      setExcelFilters(next);
                      setPage(1);
                    }}
                  />
                </th>

                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.quotes.columns.totalAmount")}
                </th>

                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ThWithFilter
                    label={t("crm.quotes.columns.quoteStatus")}
                    filterKey="quoteStatus"
                    excelFilters={excelFilters}
                    onExcelFiltersChange={(next) => {
                      setExcelFilters(next);
                      setPage(1);
                    }}
                    renderValue={(v) => t(`crm.quotes.status.${v}`, { defaultValue: v })}
                  />
                </th>

                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={5}>
                    {t("common.empty")}
                  </td>
                </tr>
              ) : (
                items.map((qit) => (
                  <tr key={qit.quoteId} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">{qit.quoteId}</div>
                      <div className="text-xs text-muted-foreground">{qit.quoteCode ?? "-"}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-foreground">{qit.clientId ?? "-"}</td>

                    <td className="px-4 py-4 text-right text-sm text-foreground">
                      {formatCurrency(qit.totalAmount)}
                    </td>

                    <td className="px-4 py-4 text-center">{quoteStatusBadge(qit.quoteStatus ?? null, t)}</td>

                    <td className="px-4 py-4">
                      <RowActionIcons
                        onView={() => {
                          setSelected(qit);
                          setDetailOpen(true);
                        }}
                        onEdit={() => {
                          setSelected(qit);
                          setEditOpen(true);
                        }}
                        onDelete={() => {
                          setSelected(qit);
                          setDeleteOpen(true);
                        }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalPages={totalPages}
          currentPage={page}
          itemsPerPage={itemsPerPage}
          totalItems={totalCount}
          onPageChange={setPage}
          onItemsPerPageChange={(n) => {
            setPage(1);
            setItemsPerPage(n);
          }}
        />
      </div>
    </div>
  );
});
