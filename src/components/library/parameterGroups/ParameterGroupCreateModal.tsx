import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

import {
    useCreateParameterGroup,
    useUpdateParameterGroup,
    useSampleTypesList,
    useSampleTypeFull,
    useMatricesList,
    useParameterGroupFull,
    type SampleType,
    type Matrix,
    type ParameterGroup,
} from "@/api/library";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

type Props = {
    onClose: () => void;
    group?: ParameterGroup | null;
};

type FormState = {
    groupName: string;
    sampleTypeId: string;
    matrixIds: string[];
    matrices: Matrix[];
    groupNote: string;
    discountRate: string;
    taxRate: string;
};

type MultiSelectOption = {
    value: string;
    label: string;
    subLabel?: string;
};

function parseFiniteNumber(raw: string): number | null {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

function uniqStrings(arr: string[]): string[] {
    return Array.from(new Set(arr));
}

function MultiSelectChips(props: {
    value: string[];
    options: MultiSelectOption[];
    onChange: (next: string[]) => void;

    label: string;
    placeholder: string;
    searchPlaceholder: string;

    selectAllLabel: string;
    unselectAllLabel: string;

    disabled?: boolean;
    onSearchChange?: (val: string) => void;
    isLoading?: boolean;
}) {
    const { t } = useTranslation();
    const { value, options, onChange, label, placeholder, searchPlaceholder, unselectAllLabel, disabled, onSearchChange, isLoading } = props;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        onSearchChange?.(search);
    }, [search, onSearchChange]);

    const optionsByValue = useMemo(() => {
        const map = new Map<string, MultiSelectOption>();
        for (const o of options) map.set(o.value, o);
        return map;
    }, [options]);

    const selectedOptions = useMemo(() => {
        return value.map((v) => optionsByValue.get(v)).filter((x): x is MultiSelectOption => Boolean(x));
    }, [value, optionsByValue]);

    const toggle = (v: string) => {
        onChange(value.includes(v) ? value.filter((x) => x !== v) : uniqStrings([...value, v]));
    };

    const removeChip = (v: string) => onChange(value.filter((x) => x !== v));

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{label}</div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className="w-full text-left border border-border rounded-lg bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                        <div className="flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                                {selectedOptions.length === 0 ? (
                                    <div className="text-sm text-muted-foreground">{placeholder}</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOptions.map((o) => (
                                            <Badge
                                                key={o.value}
                                                variant="secondary"
                                                className="gap-1 px-2 py-0.5"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <span className="max-w-[200px] truncate">{o.label}</span>
                                                <button
                                                    type="button"
                                                    className="ml-1 hover:text-destructive transition-colors shrink-0"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        removeChip(o.value);
                                                    }}
                                                    aria-label={unselectAllLabel}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground pt-0.5">
                                <Search className="h-4 w-4" />
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </button>
                </PopoverTrigger>

                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command shouldFilter={!onSearchChange}>
                        <div className="border-b border-border">
                            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
                        </div>

                        <CommandGroup>
                            <div className="max-h-64 overflow-auto">
                                {isLoading && <div className="p-4 text-center text-sm text-muted-foreground">{String(t("common.loading"))}</div>}
                                {!isLoading && options.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">{String(t("common.noData"))}</div>}
                                {options.map((o) => {
                                    const checked = value.includes(o.value);
                                    return (
                                        <CommandItem key={o.value} value={`${o.label} ${o.subLabel ?? ""} ${o.value}`} onSelect={() => toggle(o.value)}>
                                            <div className="flex w-full items-start justify-between gap-3 p-1">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-foreground truncate">{o.label}</div>
                                                    {o.subLabel ? <div className="text-xs text-muted-foreground truncate">{o.subLabel}</div> : null}
                                                </div>

                                                {checked ? <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> : <span className="h-4 w-4 shrink-0 mt-0.5" />}
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </div>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function SampleTypeSearchSelect(props: { value: string; onChange: (value: string) => void; label: string; placeholder: string }) {
    const { t } = useTranslation();
    const { value, onChange, label, placeholder } = props;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 300);

    const q = useSampleTypesList(
        {
            query: {
                page: 1,
                itemsPerPage: 50,
                search: debouncedSearch.trim() || undefined,
            },
        },
        { enabled: open },
    );

    const qSelected = useSampleTypeFull(value);

    const options = (q.data?.data ?? []) as SampleType[];
    const selectedFromList = options.find((st) => st.sampleTypeId === value);
    const selected = (selectedFromList || qSelected.data) as SampleType | undefined;

    return (
        <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{label}</div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
                        <span className="truncate">{value ? selected?.sampleTypeName || value : placeholder}</span>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command shouldFilter={false}>
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={String(t("common.search"))}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <CommandGroup>
                            <div className="max-h-64 overflow-auto">
                                {q.isLoading ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">{String(t("common.loading"))}</div>
                                ) : options.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">{String(t("common.noData"))}</div>
                                ) : (
                                    options.map((st) => (
                                        <CommandItem
                                            key={st.sampleTypeId}
                                            value={st.sampleTypeId}
                                            onSelect={() => {
                                                onChange(st.sampleTypeId);
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{st.sampleTypeName}</span>
                                                    <span className="text-xs text-muted-foreground">{st.sampleTypeId}</span>
                                                </div>
                                                {value === st.sampleTypeId && <Check className="h-4 w-4 text-primary" />}
                                            </div>
                                        </CommandItem>
                                    ))
                                )}
                            </div>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function ParameterGroupCreateModal(props: Props) {
    const { t, i18n } = useTranslation();
    const { onClose, group } = props;
    const isEdit = Boolean(group?.groupId);
    const locale = i18n.language;

    const create = useCreateParameterGroup();
    const update = useUpdateParameterGroup();

    const [form, setForm] = useState<FormState>({
        groupName: group?.groupName ?? "",
        sampleTypeId: group?.sampleTypeId ?? "",
        matrixIds: group?.matrixIds ?? [],
        matrices: [],
        groupNote: group?.groupNote ?? "",
        discountRate: String(group?.discountRate ?? "0"),
        taxRate: String(group?.taxRate ?? "0"),
    });

    const [matrixSearch, setMatrixSearch] = useState("");
    const debouncedMatrixSearch = useDebouncedValue(matrixSearch, 300);

    const qSelectedSampleType = useSampleTypeFull(form.sampleTypeId);
    const selectedSampleTypeName = (qSelectedSampleType.data as any)?.sampleTypeName;

    const listInput = useMemo(
        () => ({
            query: {
                page: 1,
                itemsPerPage: 50,
                search: debouncedMatrixSearch.trim() || undefined,
                sampleTypeName: selectedSampleTypeName ? [selectedSampleTypeName] : undefined,
            },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [debouncedMatrixSearch, selectedSampleTypeName],
    );

    const matricesQ = useMatricesList(listInput);
    const searchResultMatrices = (matricesQ.data?.data ?? []) as Matrix[];

    // Tải chi tiết gói (bao gồm snapshot matrices) khi edit
    const fullQ = useParameterGroupFull(group?.groupId ?? "", {
        enabled: Boolean(isEdit && group?.groupId),
    });

    useEffect(() => {
        const full = fullQ.data as any;
        if (full?.matrices) {
            setForm((s) => ({
                ...s,
                matrixIds: full.matrixIds || s.matrixIds,
                matrices: full.matrices,
            }));
        }
    }, [fullQ.data]);

    useEffect(() => {
        if (!form.sampleTypeId) return;

        setForm((s) => {
            if (s.matrixIds.length === 0) return s;
            const nextMatrices = s.matrices.filter((m) => m.sampleTypeId === s.sampleTypeId);
            const nextIds = nextMatrices.map((m) => m.matrixId);

            if (nextIds.length === s.matrixIds.length) return s;
            return { ...s, matrixIds: nextIds, matrices: nextMatrices };
        });
    }, [form.sampleTypeId]);

    const matrixOptions = useMemo<MultiSelectOption[]>(() => {
        // Gộp kết quả tìm kiếm và các ma trận đã chọn để hiển thị label
        const combined = [...searchResultMatrices];
        const combinedIds = new Set(combined.map((x) => x.matrixId));
        for (const m of form.matrices) {
            if (!combinedIds.has(m.matrixId)) combined.push(m);
        }

        return combined.map((m) => ({
            value: m.matrixId,
            label: `${m.matrixId} — ${m.parameterName ?? String(t("common.noData"))}`,
            subLabel: `${m.sampleTypeName ?? m.sampleTypeId} — ${m.protocolCode ?? String(t("common.noData"))}`,
        }));
    }, [searchResultMatrices, form.matrices, t]);

    const onMatricesChange = (nextIds: string[]) => {
        setForm((s) => {
            const addedIds = nextIds.filter((id) => !s.matrixIds.includes(id));
            const removedIds = s.matrixIds.filter((id) => !nextIds.includes(id));

            let nextMatrices = [...s.matrices];

            if (addedIds.length > 0) {
                const added = searchResultMatrices.filter((m) => addedIds.includes(m.matrixId));
                // Tránh trùng lặp nếu somehow nó đã có trong nextMatrices
                const existingIds = new Set(nextMatrices.map((m) => m.matrixId));
                const uniqueAdded = added.filter((m) => !existingIds.has(m.matrixId));
                nextMatrices = [...nextMatrices, ...uniqueAdded];
            }

            if (removedIds.length > 0) {
                nextMatrices = nextMatrices.filter((m) => !removedIds.includes(m.matrixId));
            }

            // Đảm bảo thứ tự theo nextIds nếu cần, nhưng quan trọng là đủ dữ liệu
            return { ...s, matrixIds: nextIds, matrices: nextMatrices };
        });
    };

    const selectedMatrices = form.matrices;

    const totalRawFee = useMemo(() => {
        return selectedMatrices.reduce((acc, m) => acc + Number(m.feeBeforeTax || 0), 0);
    }, [selectedMatrices]);

    const discountValue = (totalRawFee * Number(form.discountRate)) / 100;
    const feeBeforeTax = totalRawFee - discountValue;
    const taxValue = (feeBeforeTax * Number(form.taxRate)) / 100;
    const feeAfterTax = feeBeforeTax + taxValue;

    const submit = async () => {
        const groupName = form.groupName.trim();
        const sampleTypeId = form.sampleTypeId.trim();
        if (!groupName || !sampleTypeId) return;
        if (form.matrixIds.length === 0) return;

        const discountRate = parseFiniteNumber(form.discountRate) ?? 0;
        const taxRate = parseFiniteNumber(form.taxRate) ?? 0;

        const body = {
            groupName,
            sampleTypeId,
            sampleTypeName: selectedSampleTypeName,
            matrixIds: form.matrixIds,
            groupNote: form.groupNote.trim().length ? form.groupNote.trim() : undefined,
            discountRate,
            taxRate,
        };

        if (isEdit && group?.groupId) {
            await update.mutateAsync({
                body: {
                    groupId: group.groupId,
                    ...body,
                },
            });
        } else {
            await create.mutateAsync({
                body,
            });
        }

        onClose();
    };

    const isPending = create.isPending || update.isPending;
    const canSubmit = form.groupName.trim().length > 0 && form.sampleTypeId.trim().length > 0 && form.matrixIds.length > 0 && !isPending;

    return (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg border border-border w-full max-w-3xl shadow-xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="text-base font-semibold text-foreground">{isEdit ? t("library.parameterGroups.edit.title") : t("library.parameterGroups.create.title")}</div>
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        {String(t("common.close"))}
                    </Button>
                </div>

                <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-foreground">{String(t("library.parameterGroups.create.groupName"))}</div>
                            <Input
                                value={form.groupName}
                                onChange={(e) => setForm((s) => ({ ...s, groupName: e.target.value }))}
                                placeholder={String(t("library.parameterGroups.create.groupNamePlaceholder"))}
                            />
                        </div>

                        <SampleTypeSearchSelect
                            value={form.sampleTypeId}
                            onChange={(v) => setForm((s) => ({ ...s, sampleTypeId: v }))}
                            label={String(t("library.parameterGroups.create.sampleType"))}
                            placeholder={String(t("common.select"))}
                        />
                    </div>
                    <MultiSelectChips
                        value={form.matrixIds}
                        options={matrixOptions}
                        onChange={onMatricesChange}
                        onSearchChange={setMatrixSearch}
                        isLoading={matricesQ.isLoading}
                        disabled={matricesQ.isError}
                        label={String(t("library.parameterGroups.create.matrices"))}
                        placeholder={String(t("library.parameterGroups.create.matricesPlaceholder"))}
                        searchPlaceholder={String(t("library.parameterGroups.create.matricesSearchPlaceholder"))}
                        selectAllLabel={""}
                        unselectAllLabel={""}
                    />

                    <div className="grid grid-cols-4 gap-3 bg-muted/30 p-3 rounded-lg">
                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">{String(t("library.parameterGroups.create.feeBeforeTaxAndDiscount"))}</div>
                            <div className="text-sm font-medium tabular-nums">{new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(totalRawFee)}</div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">{String(t("library.parameterGroups.create.discountRate"))} (%)</div>
                            <Input value={form.discountRate} onChange={(e) => setForm((s) => ({ ...s, discountRate: e.target.value }))} className="h-8 text-sm" type="number" min="0" max="100" />
                        </div>

                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">{String(t("library.parameterGroups.create.taxRate"))} (%)</div>
                            <Input value={form.taxRate} onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))} className="h-8 text-sm" type="number" min="0" />
                        </div>

                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-semibold text-muted-foreground">{String(t("library.parameterGroups.create.feeAfterTax"))} (Est.)</div>
                            <div className="text-sm font-bold text-primary tabular-nums">{new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(feeAfterTax)}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">{String(t("library.parameterGroups.create.groupNote"))}</div>
                        <Input
                            value={form.groupNote}
                            onChange={(e) => setForm((s) => ({ ...s, groupNote: e.target.value }))}
                            placeholder={String(t("library.parameterGroups.create.groupNotePlaceholder"))}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                        <Button variant="outline" onClick={onClose} type="button">
                            {String(t("common.cancel"))}
                        </Button>
                        <Button onClick={() => void submit()} disabled={!canSubmit} type="button">
                            {isPending ? String(t("common.saving", { defaultValue: "Đang lưu..." })) : String(t("common.save", { defaultValue: "Lưu" }))}
                        </Button>
                    </div>

                    {create.isError || update.isError ? <div className="text-sm text-destructive">{String(t("library.parameterGroups.create.error"))}</div> : null}
                </div>
            </div>
        </div>
    );
}
