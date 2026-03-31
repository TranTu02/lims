import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, X, Check, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import type { ParameterWithMatrices } from "../hooks/useLibraryData";
import { useParametersFilter, type ParametersFilterFrom, type ParametersFilterOtherFilter } from "@/api/library";
import { useIdentityGroupsList } from "@/api/identityGroups";
import { useEnumList } from "@/api/chemical";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { renderInlineEm } from "@/utils/renderInlineEm";

export type ParametersExcelFiltersState = {
    technicianAlias: string[];
    technicianGroupId: string[];
    parameterStatus: string[];
};

type FilterKey = keyof ParametersExcelFiltersState;

type Props = {
    items: ParameterWithMatrices[];
    selectedId: string | null;
    onSelect: (p: ParameterWithMatrices) => void;
    onEdit?: (p: ParameterWithMatrices) => void;

    excelFilters: ParametersExcelFiltersState;
    onExcelFiltersChange: (next: ParametersExcelFiltersState) => void;
};

type OptionWithCount<T extends string> = { value: T; count: number };

const FILTER_FROM_MAP: Record<FilterKey, ParametersFilterFrom> = {
    technicianAlias: "technicianAlias",
    technicianGroupId: "technicianGroupId",
    parameterStatus: "parameterStatus",
};

function buildOtherFilters(filters: ParametersExcelFiltersState, excludeKey: FilterKey): ParametersFilterOtherFilter[] {
    const out: ParametersFilterOtherFilter[] = [];

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
    excelFilters: ParametersExcelFiltersState;
    onApply: (values: string[]) => void;
    onClear: () => void;
    limit?: number;
    staticOptions?: string[];
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

    const isAliasFilter = props.filterKey === "technicianAlias";
    const isGroupFilter = props.filterKey === "technicianGroupId";
    const isApiFilter = isAliasFilter || isGroupFilter;

    const qParams = useParametersFilter(input, { enabled: open && !props.staticOptions && !isApiFilter });

    const qAliasEnum = useEnumList("technicianAlias", { enabled: open && isAliasFilter });

    const qGroups = useIdentityGroupsList(
        {
            query: {
                page: 1,
                itemsPerPage: 100,
                search: debouncedSearch.trim() || undefined,
                identityGroupMainRole: ["ROLE_TECHNICIAN"],
            },
        },
        { enabled: open && isGroupFilter },
    );

    const q = isAliasFilter ? qAliasEnum : isGroupFilter ? qGroups : qParams;

    const options = useMemo((): OptionWithCount<string>[] => {
        if (isAliasFilter) {
            const data = (qAliasEnum.data ?? []) as string[];
            return data.map((alias) => ({
                value: String(alias),
                label: String(alias),
                count: 0,
            }));
        }

        if (isGroupFilter) {
            const data = (qGroups.data?.data ?? []) as any[];
            return data.map((g) => ({
                value: String(g.identityGroupId),
                label: g.identityGroupName ? `${g.identityGroupId} - ${g.identityGroupName}` : g.identityGroupId,
                count: 0,
            }));
        }

        if (props.staticOptions) {
            return props.staticOptions.filter((x) => x.toLowerCase().includes(debouncedSearch.toLowerCase())).map((x) => ({ value: x, count: 0 }));
        }

        const rawBody = qParams.data as any;
        const data = Array.isArray(rawBody) ? rawBody : (rawBody?.data ?? []) as any[];

        return data
            .map((x) => {
                const raw = x?.filterValue;
                const value = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
                return { value, count: Number(x?.count ?? 0) };
            })
            .filter((x) => x.value.trim().length > 0)
            .sort((a, b) => a.value.localeCompare(b.value));
    }, [qParams.data, qAliasEnum.data, qGroups.data, props.staticOptions, debouncedSearch, isAliasFilter, isGroupFilter]);

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

            <PopoverContent align="end" className="w-72 p-0">
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
                        <CommandList className="max-h-64">
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
                                            <CommandItem key={`${filterFrom}::${o.value}`} value={o.value} onSelect={() => toggle(o.value)} className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-2 min-w-0">
                                                    <span
                                                        className={[
                                                            "inline-flex h-4 w-4 min-w-4 flex-none shrink-0 items-center justify-center rounded-sm border border-border",
                                                            checked ? "bg-primary text-primary-foreground" : "bg-background",
                                                        ].join(" ")}
                                                    >
                                                        {checked ? <Check className="h-3 w-3" /> : null}
                                                    </span>

                                                    <span className="text-sm text-foreground break-words whitespace-normal">{(o as any).label || o.value}</span>
                                                </div>

                                                {!isAliasFilter && !isGroupFilter && !props.staticOptions && <span className="text-xs text-muted-foreground tabular-nums shrink-0">{o.count}</span>}
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

export function ParametersTable(props: Props) {
    const { t } = useTranslation();
    const { items, selectedId, onSelect, onEdit, excelFilters, onExcelFiltersChange } = props;

    const setStr = (key: FilterKey, values: string[]) => {
        onExcelFiltersChange({ ...excelFilters, [key]: values });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.parameters.parameterId"))}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.parameters.parameterName"))}</th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.parameters.technicianAlias"))}
                                <ExcelFilterPopover
                                    title={String(t("library.parameters.technicianAlias"))}
                                    filterKey="technicianAlias"
                                    activeCount={excelFilters.technicianAlias.length}
                                    selected={excelFilters.technicianAlias}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("technicianAlias", v)}
                                    onClear={() => setStr("technicianAlias", [])}
                                />
                            </span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.parameters.technicianGroupId"))}
                                <ExcelFilterPopover
                                    title={String(t("library.parameters.technicianGroupId"))}
                                    filterKey="technicianGroupId"
                                    activeCount={excelFilters.technicianGroupId.length}
                                    selected={excelFilters.technicianGroupId}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("technicianGroupId", v)}
                                    onClear={() => setStr("technicianGroupId", [])}
                                />
                            </span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.parameters.parameterStatus"))}
                                <ExcelFilterPopover
                                    title={String(t("library.parameters.parameterStatus"))}
                                    filterKey="parameterStatus"
                                    activeCount={excelFilters.parameterStatus.length}
                                    selected={excelFilters.parameterStatus}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("parameterStatus", v)}
                                    onClear={() => setStr("parameterStatus", [])}
                                    staticOptions={["Active", "Inactive"]}
                                />
                            </span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.parameters.displayStyle"))}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.actions"))}</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-border">
                    {items.map((param) => {
                        const active = selectedId === param.parameterId;
                        const alias = param.technicianAlias?.trim().length ? param.technicianAlias : t("common.noData");
                        const def = param.displayStyleResolved?.default;
                        const eng = param.displayStyleResolved?.eng;

                        return (
                            <tr key={param.parameterId} onClick={() => onSelect(param)} className={`hover:bg-muted/50 cursor-pointer ${active ? "bg-muted" : ""}`}>
                                <td className="px-4 py-3 text-sm text-foreground font-medium">{param.parameterId}</td>

                                <td className="px-4 py-3 text-sm text-foreground">{param.parameterName}</td>

                                <td className="px-4 py-3 text-sm text-muted-foreground">{alias}</td>

                                <td className="px-4 py-3 text-sm text-muted-foreground">{param.technicianGroupId ?? "-"}</td>

                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {param.parameterStatus === "Active" ? (
                                        <span className="inline-flex items-center rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-600/20">
                                            Active
                                        </span>
                                    ) : param.parameterStatus === "Inactive" ? (
                                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500 ring-1 ring-inset ring-red-600/20">
                                            Inactive
                                        </span>
                                    ) : (
                                        "-"
                                    )}
                                </td>

                                <td>
                                    <div className="px-4 py-3 flex flex-col gap-0.5">
                                        {def ? <div className="text-sm text-foreground break-words whitespace-normal">{renderInlineEm(def)}</div> : null}
                                        {eng ? <div className="text-xs text-muted-foreground break-words whitespace-normal">{renderInlineEm(eng)}</div> : null}
                                        {!def && !eng ? <span className="text-sm text-muted-foreground">{String(t("common.noData"))}</span> : null}
                                    </div>
                                </td>

                                <td className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                                    {onEdit && (
                                        <div className="inline-flex items-center justify-start gap-1">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(param)} type="button" title={String(t("common.edit"))}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
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
