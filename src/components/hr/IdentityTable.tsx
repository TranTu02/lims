import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Edit, FileText, Trash2, Filter, X, Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  useIdentitiesFilter,
  type IdentityListItem,
  type IdentitiesFilterFrom,
  type IdentitiesFilterOtherFilter,
} from "@/api/identities";

import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";
import { IdentityRoleBadges } from "./IdentityRoleBadges";

export type IdentitiesExcelFiltersState = {
  identityName: string[];
  email: string[];
  identityId: string[];
  identityStatus: string[];
};

type FilterKey = keyof IdentitiesExcelFiltersState;

type Props = {
  items: IdentityListItem[];
  onView: (identityId: string) => void;
  onEdit: (identityId: string) => void;
  onDelete: (identityId: string) => void;

  excelFilters: IdentitiesExcelFiltersState;
  onExcelFiltersChange: (next: IdentitiesExcelFiltersState) => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  return (last[0] ?? "?").toUpperCase();
}

type OptionWithCount<T extends string> = { value: T; count: number };

type ApiFilterKey = FilterKey;

const FILTER_FROM_MAP: Record<ApiFilterKey, IdentitiesFilterFrom> = {
  identityName: "identityName",
  email: "email",
  identityId: "identityId",
  identityStatus: "identityStatus",
};

function buildOtherFiltersForApi(
  filters: IdentitiesExcelFiltersState,
  excludeKey: ApiFilterKey
): IdentitiesFilterOtherFilter[] {
  const out: IdentitiesFilterOtherFilter[] = [];

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

function pickValueForFilterKey(item: IdentityListItem, key: ApiFilterKey): string {
  if (key === "identityName") return item.identityName ?? "";
  if (key === "email") return item.email ?? "";
  if (key === "identityId") return item.identityId ?? "";
  if (key === "identityStatus") return item.identityStatus ?? "";
  return "";
}

type ExcelFilterPopoverProps = {
  title: string;
  filterKey: ApiFilterKey;
  activeCount: number;
  selected: string[];
  excelFilters: IdentitiesExcelFiltersState;
  onApply: (values: string[]) => void;
  onClear: () => void;

  itemsPerPage?: number;
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
    [filterFrom, debouncedSearch, props.excelFilters, props.filterKey, props.itemsPerPage]
  );

  const q = useIdentitiesFilter(input, { enabled: open });

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

                          <span className="text-sm text-foreground break-words whitespace-normal">
                            {props.filterKey === "identityStatus"
                              ? t(`hr.status.${o.value}`, { defaultValue: o.value })
                              : o.value}
                          </span>
                        </div>

                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                          {o.count}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
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

export function IdentityTable({
  items,
  onView,
  onEdit,
  onDelete,
  excelFilters,
  onExcelFiltersChange,
}: Props) {
  const { t } = useTranslation();

  const setStr = (key: FilterKey, values: string[]) => {
    onExcelFiltersChange({ ...excelFilters, [key]: values } as IdentitiesExcelFiltersState);
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                <span className="inline-flex items-center gap-2">
                  {t("hr.dashboard.table.identity")}
                  <ExcelFilterPopover
                    title={t("hr.dashboard.table.identity")}
                    filterKey="identityName"
                    activeCount={excelFilters.identityName.length}
                    selected={excelFilters.identityName}
                    excelFilters={excelFilters}
                    onApply={(v) => setStr("identityName", v)}
                    onClear={() => setStr("identityName", [])}
                  />
                </span>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                <span className="inline-flex items-center gap-2">
                  {t("hr.dashboard.table.email")}
                  <ExcelFilterPopover
                    title={t("hr.dashboard.table.email")}
                    filterKey="email"
                    activeCount={excelFilters.email.length}
                    selected={excelFilters.email}
                    excelFilters={excelFilters}
                    onApply={(v) => setStr("email", v)}
                    onClear={() => setStr("email", [])}
                  />
                </span>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                <span className="inline-flex items-center gap-2">
                  {t("hr.dashboard.table.code")}
                  <ExcelFilterPopover
                    title={t("hr.dashboard.table.code")}
                    filterKey="identityId"
                    activeCount={excelFilters.identityId.length}
                    selected={excelFilters.identityId}
                    excelFilters={excelFilters}
                    onApply={(v) => setStr("identityId", v)}
                    onClear={() => setStr("identityId", [])}
                  />
                </span>
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                {t("hr.dashboard.table.role")}
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                <span className="inline-flex items-center gap-2">
                  {t("hr.dashboard.table.status")}
                  <ExcelFilterPopover
                    title={t("hr.dashboard.table.status")}
                    filterKey="identityStatus"
                    activeCount={excelFilters.identityStatus.length}
                    selected={excelFilters.identityStatus}
                    excelFilters={excelFilters}
                    onApply={(v) => setStr("identityStatus", v)}
                    onClear={() => setStr("identityStatus", [])}
                  />
                </span>
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                {t("hr.dashboard.table.actions")}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {items.map((u) => (
              <tr key={u.identityId} className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {getInitials(u.identityName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium text-foreground">{u.identityName}</div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </td>

                <td className="px-6 py-4">
                  <Badge variant="outline" className="border-border text-foreground">
                    {u.identityId}
                  </Badge>
                </td>

                <td className="px-6 py-4">
                  <IdentityRoleBadges roles={u.roles ?? {}} />
                </td>

                <td className="px-6 py-4">
                  <Badge variant={u.identityStatus === "active" ? "success" : "warning"}>
                    {t(`hr.status.${u.identityStatus}`, { defaultValue: u.identityStatus })}
                  </Badge>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onView(u.identityId)}
                      aria-label={t("common.view")}
                      title={t("common.view")}
                      type="button"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(u.identityId)}
                      aria-label={t("common.edit")}
                      title={t("common.edit")}
                      type="button"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => onDelete(u.identityId)}
                      aria-label={t("common.delete")}
                      title={t("common.delete")}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 ? (
              <tr>
                <td className="px-6 py-10 text-center text-sm text-muted-foreground" colSpan={6}>
                  {t("common.empty")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
