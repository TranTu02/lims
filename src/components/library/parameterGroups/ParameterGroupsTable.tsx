import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Filter, X, Edit } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import type { ParameterGroup, ParameterGroupsFilterFrom, ParameterGroupsFilterOtherFilter } from "@/api/library";
import { useParameterGroupsFilter } from "@/api/library";

import { useDebouncedValue } from "../hooks/useDebouncedValue";

export type ParameterGroupsExcelFiltersState = {
    groupId: string[];
    groupName: string[];
    sampleTypeName: string[];
};

type FilterKey = keyof ParameterGroupsExcelFiltersState;

type Props = {
    items: ParameterGroup[];
    excelFilters: ParameterGroupsExcelFiltersState;
    onExcelFiltersChange: (next: ParameterGroupsExcelFiltersState) => void;
    onEdit?: (p: ParameterGroup) => void;

    selectedRowKey: string | null;
    onSelectRow: (rowKey: string, groupId: string) => void;
};

type OptionWithCount = { key: string; value: string; count: number };

const FILTER_FROM_MAP: Record<FilterKey, ParameterGroupsFilterFrom> = {
    groupId: "groupId",
    groupName: "groupName",
    sampleTypeName: "sampleTypeName",
};

function buildOtherFilters(filters: ParameterGroupsExcelFiltersState, excludeKey: FilterKey): ParameterGroupsFilterOtherFilter[] {
    const out: ParameterGroupsFilterOtherFilter[] = [];

    (Object.keys(filters) as FilterKey[]).forEach((k) => {
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

type ExcelFilterPopoverProps = {
    title: string;
    filterKey: FilterKey;
    activeCount: number;
    selected: string[];
    excelFilters: ParameterGroupsExcelFiltersState;
    onApply: (values: string[]) => void;
    onClear: () => void;
    limit?: number;
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
                otherFilters: buildOtherFilters(props.excelFilters, props.filterKey),
                limit: props.limit ?? 200,
            },
        }),
        [filterFrom, debouncedSearch, props.excelFilters, props.filterKey, props.limit],
    );

    const q = useParameterGroupsFilter(input, { enabled: open });

    const options = useMemo((): OptionWithCount[] => {
        const data = q.data ?? [];
        return data
            .map((x) => {
                const raw = x?.filterValue;
                const value = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
                return { key: `${filterFrom}::${value}`, value, count: x.count };
            })
            .filter((x) => x.value.trim().length > 0)
            .sort((a, b) => a.value.localeCompare(b.value));
    }, [q.data, filterFrom]);

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
                <Button variant="ghost" size="icon" type="button" aria-label={String(t("common.filter"))} className="relative">
                    <Filter className="h-4 w-4" />
                    {props.activeCount > 0 ? <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" /> : null}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-80 p-0">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">{props.title}</div>
                    <Button variant="ghost" size="icon" type="button" onClick={() => setOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-3 space-y-2">
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={String(t("common.search"))} className="border border-border" />
                </div>

                <div className="border-t border-border">
                    <Command shouldFilter={false}>
                        <CommandList className="max-h-72">
                            {q.isLoading ? (
                                <div className="p-3 text-sm text-muted-foreground">{String(t("common.loading"))}</div>
                            ) : q.isError ? (
                                <div className="p-3 text-sm text-muted-foreground">{String(t("common.toast.failed"))}</div>
                            ) : options.length === 0 ? (
                                <CommandEmpty>{String(t("common.noData"))}</CommandEmpty>
                            ) : null}

                            {!q.isLoading && !q.isError ? (
                                <CommandGroup>
                                    {options.map((o) => {
                                        const checked = localSelected.includes(o.value);
                                        return (
                                            <CommandItem key={o.key} value={o.value} onSelect={() => toggle(o.value)} className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <span
                                                        className={[
                                                            "inline-flex h-4 w-4 min-w-4 flex-none shrink-0 items-center justify-center rounded-sm border border-border",
                                                            checked ? "bg-primary text-primary-foreground" : "bg-background",
                                                        ].join(" ")}
                                                    >
                                                        {checked ? <Check className="h-3 w-3" /> : null}
                                                    </span>

                                                    <span className="text-sm text-foreground break-words whitespace-normal">{o.value}</span>
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
                            {String(t("common.clear"))}
                        </Button>
                        <Button type="button" className="w-full" onClick={apply}>
                            {String(t("common.apply"))}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function ParameterGroupsTable(props: Props) {
    const { t, i18n } = useTranslation();
    const { items, excelFilters, onExcelFiltersChange, onEdit, selectedRowKey, onSelectRow } = props;

    const locale = i18n.language;

    const setStr = (key: FilterKey, values: string[]) => {
        onExcelFiltersChange({ ...excelFilters, [key]: values } as ParameterGroupsExcelFiltersState);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.parameterGroups.groupId"))}
                                <ExcelFilterPopover
                                    title={String(t("library.parameterGroups.groupId"))}
                                    filterKey="groupId"
                                    activeCount={excelFilters.groupId.length}
                                    selected={excelFilters.groupId}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("groupId", v)}
                                    onClear={() => setStr("groupId", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.parameterGroups.groupName"))}
                                <ExcelFilterPopover
                                    title={String(t("library.parameterGroups.groupName"))}
                                    filterKey="groupName"
                                    activeCount={excelFilters.groupName.length}
                                    selected={excelFilters.groupName}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("groupName", v)}
                                    onClear={() => setStr("groupName", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.parameterGroups.sampleType"))}
                                <ExcelFilterPopover
                                    title={String(t("library.parameterGroups.sampleType"))}
                                    filterKey="sampleTypeName"
                                    activeCount={excelFilters.sampleTypeName.length}
                                    selected={excelFilters.sampleTypeName}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("sampleTypeName", v)}
                                    onClear={() => setStr("sampleTypeName", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.parameterGroups.matrixIds"))}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.parameterGroups.discountRate"))} (%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.parameterGroups.taxRate"))} (%)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.parameterGroups.createdAt"))}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.actions"))}</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-border">
                    {items.map((x) => {
                        const matrixCount = x.matrixIds?.length ?? 0;
                        const matrixPreview = (x.matrixIds ?? []).slice(0, 3);
                        const rowKey = x.groupId;
                        const active = selectedRowKey === rowKey;

                        return (
                            <tr key={x.groupId} className={`hover:bg-muted/50 cursor-pointer ${active ? "bg-muted" : ""}`} onClick={() => onSelectRow(rowKey, x.groupId)}>
                                <td className="px-4 py-3 text-sm text-foreground font-medium">{x.groupId}</td>

                                <td className="px-4 py-3 text-sm text-foreground">
                                    <div className="font-medium">{x.groupName}</div>
                                </td>

                                <td className="px-4 py-3 text-sm text-foreground">
                                    <div>{x.sampleTypeName ?? x.sampleTypeId}</div>
                                    <div className="text-xs text-muted-foreground">{x.sampleTypeId}</div>
                                </td>

                                <td className="px-4 py-3 text-sm text-foreground">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {matrixPreview.map((id) => (
                                            <Badge key={id} variant="outline">
                                                {id}
                                            </Badge>
                                        ))}

                                        {matrixCount > matrixPreview.length ? (
                                            <span className="text-xs text-muted-foreground">
                                                {String(
                                                    t("library.parameterGroups.values.moreMatrices", {
                                                        count: matrixCount - matrixPreview.length,
                                                    }),
                                                )}
                                            </span>
                                        ) : null}
                                    </div>
                                </td>

                                <td className="px-4 py-3 text-sm text-foreground text-left tabular-nums">
                                    <Badge variant="secondary">{x.discountRate}%</Badge>
                                </td>

                                <td className="px-4 py-3 text-sm text-foreground text-left tabular-nums">{x.taxRate}%</td>

                                <td className="px-4 py-3 text-sm text-muted-foreground">{x.createdAt ? new Date(x.createdAt).toLocaleDateString(locale) : "-"}</td>

                                <td className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                                    <div className="inline-flex items-center justify-start gap-1">
                                        {onEdit && (
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(x)} type="button" title={String(t("common.edit"))}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {items.length === 0 ? <div className="p-4 text-sm text-muted-foreground">{String(t("common.noData"))}</div> : null}
        </div>
    );
}
