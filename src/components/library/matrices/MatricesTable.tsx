import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, Filter, X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import type { Matrix } from "@/api/library";
import { useMatricesFilter, type MatricesFilterFrom, type MatricesFilterOtherFilter } from "@/api/library";

import type { ExcelFiltersState } from "./MatricesView";
import { formatNumberVi } from "./matrixFormat";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

type FilterKey = keyof ExcelFiltersState;

type Props = {
    items: Matrix[];

    selectedRowKey: string | null;
    onSelectRow: (rowKey: string, matrixId: string) => void;

    onOpenEdit: (matrixId: string) => void;
    onOpenDelete: (matrixId: string) => void;

    excelFilters: ExcelFiltersState;
    onExcelFiltersChange: (next: ExcelFiltersState) => void;
    onClearAllExcelFilters: () => void;
};

type OptionWithCount<T extends string | number> = { value: T; count: number };

function getRowKey(m: Matrix): string {
    return [m.matrixId, m.parameterId, m.protocolId, m.sampleTypeId].join("__");
}
function getProtocolLabel(m: Matrix): string {
    return m.protocolCode && m.protocolCode.trim() ? m.protocolCode.trim() : m.protocolId;
}

const FILTER_FROM_MAP: Record<FilterKey, MatricesFilterFrom> = {
    matrixId: "matrixId",
    parameterId: "parameterId",
    parameterName: "parameterName",
    protocolId: "protocolId",
    protocolCode: "protocolCode",
    sampleTypeId: "sampleTypeId",
    sampleTypeName: "sampleTypeName",
    feeBeforeTax: "feeBeforeTax",
    feeAfterTax: "feeAfterTax",
};

function buildOtherFilters(filters: ExcelFiltersState, excludeKey: FilterKey): MatricesFilterOtherFilter[] {
    const out: MatricesFilterOtherFilter[] = [];

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
          filterKey: FilterKey;
          activeCount: number;
          selected: string[];
          excelFilters: ExcelFiltersState;
          onApply: (values: string[]) => void;
          onClear: () => void;
          limit?: number;
      }
    | {
          type: "number";
          title: string;
          filterKey: FilterKey;
          activeCount: number;
          selected: number[];
          excelFilters: ExcelFiltersState;
          onApply: (values: number[]) => void;
          onClear: () => void;
          limit?: number;
      };

function ExcelFilterPopover(props: ExcelFilterPopoverProps) {
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 250);

    const [localSelected, setLocalSelected] = useState<Array<string | number>>(props.selected);

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

    const q = useMatricesFilter(filterInput, { enabled: open });

    const apiOptions = useMemo((): Array<OptionWithCount<string> | OptionWithCount<number>> => {
        const data = q.data ?? [];

        if (props.type === "string") {
            return data.map((x) => ({ value: x.filterValue, count: x.count })).filter((x) => x.value.trim().length > 0);
        }

        return data
            .map((x) => {
                const n = Number(x.filterValue);
                if (Number.isNaN(n)) return null;
                return { value: n, count: x.count };
            })
            .filter((x): x is OptionWithCount<number> => Boolean(x));
    }, [q.data, props.type]);

    const filteredOptions = useMemo(() => {
        const qtext = search.trim().toLowerCase();
        if (!qtext) return apiOptions;

        if (props.type === "string") {
            return (apiOptions as OptionWithCount<string>[]).filter((o) => o.value.toLowerCase().includes(qtext));
        }
        return (apiOptions as OptionWithCount<number>[]).filter((o) => String(o.value).includes(qtext));
    }, [apiOptions, props.type, search]);

    const toggle = (v: string) => {
        setLocalSelected((cur) => {
            const has = cur.some((x) => String(x) === v);
            if (has) return cur.filter((x) => String(x) !== v);
            return [...cur, props.type === "number" ? Number(v) : v];
        });
    };

    const apply = () => {
        if (props.type === "string") {
            props.onApply(localSelected.map(String));
        } else {
            const nums = localSelected.map((x) => Number(x)).filter((n) => !Number.isNaN(n));
            props.onApply(nums);
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
                            ) : filteredOptions.length === 0 ? (
                                <CommandEmpty>{String(t("common.noData"))}</CommandEmpty>
                            ) : null}

                            {!q.isLoading && !q.isError ? (
                                <CommandGroup>
                                    {filteredOptions.map((o) => {
                                        const key = String(o.value);
                                        const checked = localSelected.some((x) => String(x) === key);

                                        return (
                                            <CommandItem key={key} value={key} onSelect={() => toggle(key)} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={[
                                                            "inline-flex h-4 w-4 items-center justify-center rounded-sm border border-border",
                                                            checked ? "bg-primary text-primary-foreground" : "bg-background",
                                                        ].join(" ")}
                                                    >
                                                        {checked ? <Check className="h-3 w-3" /> : null}
                                                    </span>
                                                    <span className="text-sm text-foreground">{key}</span>
                                                </div>

                                                <span className="text-xs text-muted-foreground tabular-nums">{o.count}</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            ) : null}
                        </CommandList>
                    </Command>

                    <div className="p-3 border-t border-border flex items-center justify-end gap-2">
                        <Button variant="outline" type="button" onClick={clear} disabled={props.activeCount === 0}>
                            {String(t("common.clear"))}
                        </Button>
                        <Button type="button" onClick={apply}>
                            {String(t("common.apply"))}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function MatricesTable(props: Props) {
    const { t } = useTranslation();
    const { items, selectedRowKey, onSelectRow, onOpenEdit, onOpenDelete, excelFilters, onExcelFiltersChange } = props;

    const setStr = (key: FilterKey, values: string[]) => {
        onExcelFiltersChange({ ...excelFilters, [key]: values } as ExcelFiltersState);
    };

    const setNum = (key: FilterKey, values: number[]) => {
        onExcelFiltersChange({ ...excelFilters, [key]: values } as ExcelFiltersState);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-max">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.matrices.matrixId"))}
                                <ExcelFilterPopover
                                    type="string"
                                    title={String(t("library.matrices.matrixId"))}
                                    filterKey="matrixId"
                                    activeCount={excelFilters.matrixId.length}
                                    selected={excelFilters.matrixId}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("matrixId", v)}
                                    onClear={() => setStr("matrixId", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.matrices.parameterId"))}
                                <ExcelFilterPopover
                                    type="string"
                                    title={String(t("library.matrices.parameterId"))}
                                    filterKey="parameterId"
                                    activeCount={excelFilters.parameterId.length}
                                    selected={excelFilters.parameterId}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("parameterId", v)}
                                    onClear={() => setStr("parameterId", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.matrices.protocolId"))}
                                <ExcelFilterPopover
                                    type="string"
                                    title={String(t("library.matrices.protocolId"))}
                                    filterKey="protocolId"
                                    activeCount={excelFilters.protocolId.length}
                                    selected={excelFilters.protocolId}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("protocolId", v)}
                                    onClear={() => setStr("protocolId", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.matrices.sampleTypeId"))}
                                <ExcelFilterPopover
                                    type="string"
                                    title={String(t("library.matrices.sampleTypeId"))}
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
                                {String(t("library.matrices.feeBeforeTax"))}
                                <ExcelFilterPopover
                                    type="number"
                                    title={String(t("library.matrices.feeBeforeTax"))}
                                    filterKey="feeBeforeTax"
                                    activeCount={excelFilters.feeBeforeTax.length}
                                    selected={excelFilters.feeBeforeTax}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setNum("feeBeforeTax", v)}
                                    onClear={() => setNum("feeBeforeTax", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.matrices.feeAfterTax"))}
                                <ExcelFilterPopover
                                    type="number"
                                    title={String(t("library.matrices.feeAfterTax"))}
                                    filterKey="feeAfterTax"
                                    activeCount={excelFilters.feeAfterTax.length}
                                    selected={excelFilters.feeAfterTax}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setNum("feeAfterTax", v)}
                                    onClear={() => setNum("feeAfterTax", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{String(t("common.actions"))}</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-border">
                    {items.map((m) => {
                        const rowKey = getRowKey(m);
                        const active = selectedRowKey === rowKey;

                        const protocolLabel = getProtocolLabel(m);
                        const feeAfterTaxText = formatNumberVi(m.feeAfterTax) ?? String(t("common.noData"));

                        return (
                            <tr key={rowKey} onClick={() => onSelectRow(rowKey, m.matrixId)} className={`hover:bg-muted/50 cursor-pointer ${active ? "bg-muted" : ""}`}>
                                <td className="px-4 py-3 text-sm text-foreground font-medium">{m.matrixId}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{m.parameterId}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{protocolLabel}</td>
                                <td className="px-4 py-3 text-sm text-foreground">{m.sampleTypeId}</td>

                                <td className="px-4 py-3 text-sm text-foreground">{formatNumberVi(m.feeBeforeTax) ?? String(t("common.noData"))}</td>

                                <td className="px-4 py-3 text-sm text-foreground">{feeAfterTaxText}</td>

                                <td className="px-1 py-3 text-left">
                                    <div className="inline-flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            aria-label={String(t("common.edit"))}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenEdit(m.matrixId);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            aria-label={String(t("common.delete"))}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenDelete(m.matrixId);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
