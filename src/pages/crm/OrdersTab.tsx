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

import type { OrderListItem } from "@/types/crm/order";
import { crmKeys } from "@/api/crm/crmKeys";
import {
  ordersDelete,
  ordersGetList,
  ordersUpdate,
  useOrdersFilter,
  type OrdersFilterFrom,
  type OrdersFilterOtherFilter,
} from "@/api/crm/orders";

import { OrderDetailModal } from "@/components/crm/OrderDetailModal";
import { OrderUpsertModal } from "@/components/crm/OrderUpsertModal";
import { OrderDeleteModal } from "@/components/crm/OrderDeleteModal";
import { RowActionIcons } from "@/components/common/RowActionIcons";

import { toOrdersUpdateBody, type OrderUpsertFormState } from "@/components/crm/orderUpsertMapper";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

type Props = {
  externalSearch: string;
};

export type OrdersTabHandle = {
  openCreate: () => void;
};

type OrdersListResponse = {
  data: OrderListItem[];
  pagination: { total: number; totalPages: number };
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

function orderStatusText(status: string | null, t: (k: string, opt?: { defaultValue?: string }) => string) {
  const s = toStr(status).trim();
  if (!s) return t("common.noData");
  return t(`crm.orders.orderStatus.${s}`, { defaultValue: s });
}

function statusBadge(status: string | null, t: (k: string, opt?: { defaultValue?: string }) => string) {
  const s = toStr(status).trim();
  if (!s) return <Badge variant="outline">{t("common.noData")}</Badge>;

  const label = orderStatusText(s, t);

  switch (s) {
    case "Completed":
      return <Badge variant="success">{label}</Badge>;
    case "Processing":
      return <Badge variant="warning">{label}</Badge>;
    case "Pending":
      return <Badge variant="secondary">{label}</Badge>;
    case "Cancelled":
      return <Badge variant="destructive">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}


type OrdersExcelFiltersState = {
  orderId: string[];
  quoteId: string[];
  clientId: string[];
  orderStatus: string[];
  paymentStatus: string[];
};

type FilterKey = keyof OrdersExcelFiltersState;
type ApiFilterKey = FilterKey;

const FILTER_FROM_MAP: Record<ApiFilterKey, OrdersFilterFrom> = {
  orderId: "orderId",
  quoteId: "quoteId",
  clientId: "clientId",
  orderStatus: "orderStatus",
  paymentStatus: "paymentStatus",
};

function createEmptyFilters(): OrdersExcelFiltersState {
  return {
    orderId: [],
    quoteId: [],
    clientId: [],
    orderStatus: [],
    paymentStatus: [],
  };
}

function buildOtherFiltersForApi(filters: OrdersExcelFiltersState, excludeKey: ApiFilterKey): OrdersFilterOtherFilter[] {
  const out: OrdersFilterOtherFilter[] = [];

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

function buildAllOtherFiltersForApi(filters: OrdersExcelFiltersState): OrdersFilterOtherFilter[] {
  const out: OrdersFilterOtherFilter[] = [];

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

type OptionWithCount<T extends string> = { value: T; count: number };

function pickValueForFilterKey(item: OrderListItem, key: ApiFilterKey): string {
  if (key === "orderId") return item.orderId ?? "";
  if (key === "quoteId") return (item.quoteId as string | null) ?? "";
  if (key === "clientId") return (item.clientId as string | null) ?? "";
  if (key === "orderStatus") return (item.orderStatus as string | null) ?? "";
  if (key === "paymentStatus") return (item.paymentStatus as string | null) ?? "";
  return "";
}

function hasAnyExcelFilter(f: OrdersExcelFiltersState) {
  return (
    f.orderId.length > 0 ||
    f.quoteId.length > 0 ||
    f.clientId.length > 0 ||
    f.orderStatus.length > 0 ||
    f.paymentStatus.length > 0
  );
}

type ExcelFilterPopoverProps = {
  title: string;
  filterKey: ApiFilterKey;
  activeCount: number;
  selected: string[];
  excelFilters: OrdersExcelFiltersState;

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

  const q = useOrdersFilter(input, { enabled: open });

  const options = useMemo((): OptionWithCount<string>[] => {
    const list = q.data?.data ?? [];
    const counts = new Map<string, number>();

    for (const it of list) {
      const raw = pickValueForFilterKey(it, props.filterKey);
      const v = typeof raw === "string" ? raw.trim() : "";
      if (!v) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [q.data, props.filterKey]);

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
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label={t("common.filter")}
          className="relative"
        >
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
                    const label = props.renderValue ? props.renderValue(o.value) : o.value;

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

                          <span className="text-sm text-foreground break-words whitespace-normal">{label}</span>
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
  excelFilters: OrdersExcelFiltersState;
  onExcelFiltersChange: (next: OrdersExcelFiltersState) => void;
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

export const OrdersTab = forwardRef<OrdersTabHandle, Props>(function OrdersTab(props, ref) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected, setSelected] = useState<OrderListItem | null>(null);

  const [excelFilters, setExcelFilters] = useState<OrdersExcelFiltersState>(() => createEmptyFilters());

  useImperativeHandle(ref, () => ({
    openCreate: () => toast.info(t("common.info.useGlobalCreate")),
  }));

  const searchText = props.externalSearch.trim().length ? props.externalSearch.trim() : "";
  const hasFilters = hasAnyExcelFilter(excelFilters);

  const filterListInput = useMemo(() => {
    const searchText = props.externalSearch.trim();

    if (searchText.length > 0) {
      return {
        body: {
          filterFrom: "clientId" as OrdersFilterFrom,
          textFilter: searchText,
          otherFilters: buildOtherFiltersForApi(excelFilters, "clientId"),
          page,
          itemsPerPage,
        },
      };
    }

    return {
      body: {
        filterFrom: "orderId" as OrdersFilterFrom,
        textFilter: null,
        otherFilters: buildAllOtherFiltersForApi(excelFilters),
        page,
        itemsPerPage,
      },
    };
  }, [excelFilters, itemsPerPage, page, props.externalSearch]);

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

  const q = useQuery({
    queryKey: hasFilters ? ["crm", "orders", "filter-list", filterListInput] : crmKeys.orders.list(listQuery),
    placeholderData: keepPreviousData,
    retry: false,
    queryFn: async () => {
      if (!hasFilters) {
        const res = (await ordersGetList({ query: listQuery })) as unknown as OrdersListResponse;
        return res;
      }
      throw new Error("FILTER_LIST_USE_HOOK");
    },
  });

  const filterListQ = useOrdersFilter(filterListInput, { enabled: hasFilters });

  const items: OrderListItem[] = hasFilters ? filterListQ.data?.data ?? [] : q.data?.data ?? [];

  const totalCount = hasFilters
    ? (filterListQ.data as unknown as { meta?: { total?: number } } | undefined)?.meta?.total ?? items.length
    : q.data?.pagination?.total ?? items.length;

  const totalPages = hasFilters
    ? (filterListQ.data as unknown as { meta?: { totalPages?: number } } | undefined)?.meta?.totalPages ?? 1
    : q.data?.pagination?.totalPages ?? 1;

  const listIsLoading = hasFilters ? filterListQ.isLoading : q.isLoading;
  const listIsError = hasFilters ? filterListQ.isError : q.isError;
  const listError = hasFilters ? filterListQ.error : q.error;

  const updateMut = useMutation({
    mutationFn: async (values: OrderUpsertFormState) => {
      const body = toOrdersUpdateBody(values);
      return ordersUpdate({ body });
    },
    onSuccess: async () => {
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.orders.all });
      await qc.invalidateQueries({ queryKey: ["crm", "orders", "filter-list"] });
      setEditOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const deleteMut = useMutation({
    mutationFn: async (orderId: string) => ordersDelete({ params: { orderId } }),
    onSuccess: async () => {
      toast.success(t("common.toast.deleted"));
      await qc.invalidateQueries({ queryKey: crmKeys.orders.all });
      await qc.invalidateQueries({ queryKey: ["crm", "orders", "filter-list"] });
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
      <OrderDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} orderId={selected?.orderId ?? null} />

      {editOpen && selected ? (
        <OrderUpsertModal
          open={editOpen}
          mode="update"
          initial={selected}
          onClose={() => setEditOpen(false)}
          onSubmit={(values) => updateMut.mutateAsync(values)}
          submitting={updateMut.isPending}
        />
      ) : null}

      <OrderDeleteModal
        open={deleteOpen}
        orderId={selected?.orderId ?? null}
        onClose={() => setDeleteOpen(false)}
        onConfirm={(orderId) => deleteMut.mutateAsync(orderId).then(() => {})}
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
                    label={t("crm.orders.columns.orderId")}
                    filterKey="orderId"
                    excelFilters={excelFilters}
                    onExcelFiltersChange={(next) => {
                      setExcelFilters(next);
                      setPage(1);
                    }}
                  />
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ThWithFilter
                    label={t("crm.orders.columns.quoteId")}
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
                    label={t("crm.orders.columns.clientId")}
                    filterKey="clientId"
                    excelFilters={excelFilters}
                    onExcelFiltersChange={(next) => {
                      setExcelFilters(next);
                      setPage(1);
                    }}
                  />
                </th>

                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t("crm.orders.columns.totalAmount")}
                </th>

                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ThWithFilter
                    label={t("crm.orders.columns.orderStatus")}
                    filterKey="orderStatus"
                    excelFilters={excelFilters}
                    onExcelFiltersChange={(next) => {
                      setExcelFilters(next);
                      setPage(1);
                    }}
                    renderValue={(v) => t(`crm.orders.orderStatus.${v}`, { defaultValue: v })}
                  />
                </th>

                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <ThWithFilter
                    label={t("crm.orders.columns.paymentStatus")}
                    filterKey="paymentStatus"
                    excelFilters={excelFilters}
                    onExcelFiltersChange={(next) => {
                      setExcelFilters(next);
                      setPage(1);
                    }}
                    renderValue={(v) => t(`crm.orders.paymentStatus.${v}`, { defaultValue: v })}
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
                  <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={7}>
                    {t("common.empty")}
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <tr key={o.orderId} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-foreground">{o.orderId}</div>
                    </td>

                    <td className="px-4 py-4 text-sm text-foreground">{o.quoteId ?? "-"}</td>

                    <td className="px-4 py-4 text-sm text-foreground">{o.clientId ?? "-"}</td>

                    <td className="px-4 py-4 text-right text-sm text-foreground">{o.totalAmount ?? "-"}</td>

                    <td className="px-4 py-4 text-center">{statusBadge((o.orderStatus as string | null) ?? null, t)}</td>

                    <td className="px-4 py-4 text-center">
                      {toStr(o.paymentStatus).trim() ? (
                        <Badge variant="outline">
                          {t(`crm.orders.paymentStatus.${String(o.paymentStatus)}`, {
                            defaultValue: String(o.paymentStatus),
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t("common.noData")}</Badge>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <RowActionIcons
                        onView={() => {
                          setSelected(o);
                          setDetailOpen(true);
                        }}
                        onEdit={() => {
                          setSelected(o);
                          setEditOpen(true);
                        }}
                        onDelete={() => {
                          setSelected(o);
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
