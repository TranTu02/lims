import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, X, Check, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import type { SampleType } from "@/api/library";
import { useSampleTypesFilter, type SampleTypesFilterFrom, type SampleTypesFilterOtherFilter } from "@/api/library";

import { renderInlineEm } from "@/utils/renderInlineEm";

import { useDebouncedValue } from "../hooks/useDebouncedValue";

type Props = {
    items: SampleType[];
    selectedId: string | null;
    onSelect: (p: SampleType) => void;
    onEdit?: (p: SampleType) => void;
    excelFilters: SampleTypesExcelFiltersState;
    onExcelFiltersChange: (next: SampleTypesExcelFiltersState) => void;
};

export type SampleTypesExcelFiltersState = {
    sampleTypeId: string[];
    sampleTypeName: string[];
    displayTypeStyle: string[];
};

type FilterKey = keyof SampleTypesExcelFiltersState;

type Option = { value: string; count: number; key: string };

const FILTER_FROM_MAP: Record<FilterKey, SampleTypesFilterFrom> = {
    sampleTypeId: "sampleTypeId",
    sampleTypeName: "sampleTypeName",
    displayTypeStyle: "displayTypeStyle",
};

function formatDateTime(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
}

function normalizeDisplayStyle(i18n: { language: string }, raw: unknown): { label: string; stableKey: string } {
    if (!raw || typeof raw !== "object") {
        const s = raw == null ? "" : String(raw);
        return { label: s, stableKey: s };
    }

    const obj = raw as Record<string, unknown>;
    const en = typeof obj.en === "string" ? obj.en : "";
    const vi = typeof obj.vi === "string" ? obj.vi : "";

    const lang = (i18n.language || "vi").toLowerCase();
    const label = lang.startsWith("vi") ? vi || en : en || vi;

    return { label, stableKey: `en:${en}|||vi:${vi}` };
}

function buildOtherFilters(filters: SampleTypesExcelFiltersState, excludeKey: FilterKey): SampleTypesFilterOtherFilter[] {
    const out: SampleTypesFilterOtherFilter[] = [];

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
    excelFilters: SampleTypesExcelFiltersState;

    onApply: (values: string[]) => void;
    onClear: () => void;
    limit?: number;
};

function ExcelFilterPopover(props: ExcelFilterPopoverProps) {
    const { t, i18n } = useTranslation();
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

    const q = useSampleTypesFilter(input, { enabled: open });

    const options = useMemo((): Option[] => {
        const data = q.data ?? [];

        return data
            .map((x) => {
                if (props.filterKey === "displayTypeStyle") {
                    const { label, stableKey } = normalizeDisplayStyle(i18n, x?.filterValue);
                    return { value: label, key: stableKey, count: x?.count ?? 0 };
                }

                const raw = x?.filterValue;
                const value = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
                return { value, key: value, count: x?.count ?? 0 };
            })
            .filter((x) => x.value.trim().length > 0)
            .sort((a, b) => a.value.localeCompare(b.value));
    }, [q.data, props.filterKey, i18n]);

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
                                            <CommandItem key={`${filterFrom}::${o.key}`} value={o.value} onSelect={() => toggle(o.value)} className="flex items-start justify-between gap-3">
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

export function SampleTypesTable(props: Props) {
    const { t } = useTranslation();
    const { items, selectedId, onSelect, onEdit, excelFilters, onExcelFiltersChange } = props;

    const setStr = (key: FilterKey, values: string[]) => {
        onExcelFiltersChange({
            ...excelFilters,
            [key]: values,
        } as SampleTypesExcelFiltersState);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.sampleTypes.table.sampleTypeId"))}
                                <ExcelFilterPopover
                                    title={String(t("library.sampleTypes.table.sampleTypeId"))}
                                    filterKey="sampleTypeId"
                                    activeCount={excelFilters.sampleTypeId.length}
                                    selected={excelFilters.sampleTypeId}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("sampleTypeId", v)}
                                    onClear={() => setStr("sampleTypeId", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.sampleTypes.table.sampleTypeName"))}
                                <ExcelFilterPopover
                                    title={String(t("library.sampleTypes.table.sampleTypeName"))}
                                    filterKey="sampleTypeName"
                                    activeCount={excelFilters.sampleTypeName.length}
                                    selected={excelFilters.sampleTypeName}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("sampleTypeName", v)}
                                    onClear={() => setStr("sampleTypeName", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.sampleTypes.table.displayTypeStyle"))}
                                <ExcelFilterPopover
                                    title={String(t("library.sampleTypes.table.displayTypeStyle"))}
                                    filterKey="displayTypeStyle"
                                    activeCount={excelFilters.displayTypeStyle.length}
                                    selected={excelFilters.displayTypeStyle}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("displayTypeStyle", v)}
                                    onClear={() => setStr("displayTypeStyle", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("library.sampleTypes.table.createAt"))}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.actions"))}</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-border">
                    {items.map((x) => {
                        const active = selectedId === x.sampleTypeId;
                        const def = x.displayTypeStyle?.default;
                        const eng = x.displayTypeStyle?.eng;

                        return (
                            <tr key={x.sampleTypeId} onClick={() => onSelect(x)} className={`hover:bg-muted/50 cursor-pointer ${active ? "bg-muted" : ""}`}>
                                <td className="px-4 py-3 text-sm text-foreground font-medium">{x.sampleTypeId}</td>

                                <td className="px-4 py-3 text-sm text-foreground">{x.sampleTypeName}</td>

                                <td>
                                    <div className="px-4 py-3 flex flex-col gap-0.5">
                                        {def ? <div className="text-sm text-foreground break-words whitespace-normal">{renderInlineEm(def)}</div> : null}
                                        {eng ? <div className="text-xs text-muted-foreground break-words whitespace-normal">{renderInlineEm(eng)}</div> : null}
                                        {!def && !eng ? <span className="text-sm text-muted-foreground">{String(t("common.none"))}</span> : null}
                                    </div>
                                </td>

                                <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(x.createdAt)}</td>

                                <td className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                                    {onEdit && (
                                        <div className="inline-flex items-center justify-start gap-1">
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(x)} type="button" title={String(t("common.edit"))}>
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
