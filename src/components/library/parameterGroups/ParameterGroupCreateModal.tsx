import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

import { useCreateParameterGroupFull, useSampleTypesList, useMatricesList, type SampleType, type Matrix } from "@/api/library";

type Props = {
    onClose: () => void;
};

type FormState = {
    groupName: string;
    sampleTypeId: string;
    matrixIds: string[];
    groupNote: string;

    feeBeforeTaxAndDiscount: string;
    discountRate: string;
    feeBeforeTax: string;
    taxRate: string;
    feeAfterTax: string;
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
}) {
    const { value, options, onChange, label, placeholder, searchPlaceholder, unselectAllLabel, disabled } = props;

    const [open, setOpen] = useState(false);

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
                                                className="gap-1"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <span className="max-w-fit truncate">{o.label}</span>
                                                <button
                                                    type="button"
                                                    className="ml-1 inline-flex items-center"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        removeChip(o.value);
                                                    }}
                                                    aria-label={unselectAllLabel}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Search className="h-4 w-4" />
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    </button>
                </PopoverTrigger>

                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command>
                        <div className="border-b border-border">
                            <CommandInput placeholder={searchPlaceholder} />
                        </div>

                        <CommandGroup>
                            <div className="max-h-64 overflow-auto">
                                {options.map((o) => {
                                    const checked = value.includes(o.value);
                                    return (
                                        <CommandItem key={o.value} value={`${o.label} ${o.subLabel ?? ""} ${o.value}`} onSelect={() => toggle(o.value)}>
                                            <div className="flex w-full items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-sm text-foreground truncate">{o.label}</div>
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

export function ParameterGroupCreateModal(props: Props) {
    const { t } = useTranslation();
    const { onClose } = props;

    const create = useCreateParameterGroupFull();

    const listInput = useMemo(
        () => ({
            query: { page: 1, itemsPerPage: 2000, search: null },
            sort: { column: "createdAt", direction: "DESC" as const },
        }),
        [],
    );

    const sampleTypesQ = useSampleTypesList(listInput);
    const matricesQ = useMatricesList(listInput);

    const sampleTypes = (sampleTypesQ.data?.data ?? []) as SampleType[];
    const matrices = (matricesQ.data?.data ?? []) as Matrix[];

    const [form, setForm] = useState<FormState>({
        groupName: "",
        sampleTypeId: "",
        matrixIds: [],
        groupNote: "",

        feeBeforeTaxAndDiscount: "0",
        discountRate: "0",
        feeBeforeTax: "0",
        taxRate: "0",
        feeAfterTax: "0",
    });

    const matrixSampleTypeMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of matrices) map.set(m.matrixId, m.sampleTypeId);
        return map;
    }, [matrices]);

    useEffect(() => {
        if (!form.sampleTypeId) return;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm((s) => {
            if (s.matrixIds.length === 0) return s;

            const next = s.matrixIds.filter((id) => matrixSampleTypeMap.get(id) === s.sampleTypeId);

            if (next.length === s.matrixIds.length) return s;
            return { ...s, matrixIds: next };
        });
    }, [form.sampleTypeId, matrixSampleTypeMap]);

    const matrixOptions = useMemo<MultiSelectOption[]>(() => {
        const source = form.sampleTypeId ? matrices.filter((m) => m.sampleTypeId === form.sampleTypeId) : matrices;

        return source.map((m) => ({
            value: m.matrixId,
            label: `${m.matrixId} — ${m.parameterName ?? String(t("common.noData", { defaultValue: "Chưa có dữ liệu" }))}`,
            subLabel: `${m.sampleTypeName ?? m.sampleTypeId} — ${m.protocolCode ?? String(t("common.noData", { defaultValue: "Chưa có dữ liệu" }))}`,
        }));
    }, [matrices, form.sampleTypeId, t]);
    const submit = async () => {
        const groupName = form.groupName.trim();
        const sampleTypeId = form.sampleTypeId.trim();
        if (!groupName || !sampleTypeId) return;
        if (form.matrixIds.length === 0) return;

        const feeBeforeTaxAndDiscount = parseFiniteNumber(form.feeBeforeTaxAndDiscount);
        const discountRate = parseFiniteNumber(form.discountRate);
        const feeBeforeTax = parseFiniteNumber(form.feeBeforeTax);
        const taxRate = parseFiniteNumber(form.taxRate);
        const feeAfterTax = parseFiniteNumber(form.feeAfterTax);

        if (feeBeforeTaxAndDiscount === null || discountRate === null || feeBeforeTax === null || taxRate === null || feeAfterTax === null) {
            return;
        }

        const st = sampleTypes.find((x) => x.sampleTypeId === sampleTypeId);

        await create.mutateAsync({
            body: {
                groupName,
                sampleTypeId,
                sampleTypeName: st?.sampleTypeName,
                matrixIds: form.matrixIds,
                groupNote: form.groupNote.trim().length ? form.groupNote.trim() : null,
                feeBeforeTaxAndDiscount,
                discountRate,
                feeBeforeTax,
                taxRate,
                feeAfterTax,
            },
        });

        onClose();
    };

    const canSubmit = form.groupName.trim().length > 0 && form.sampleTypeId.trim().length > 0 && form.matrixIds.length > 0 && !create.isPending;

    return (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg border border-border w-full max-w-3xl shadow-xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div className="text-base font-semibold text-foreground">{String(t("library.parameterGroups.create.title"))}</div>
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

                        <div className="space-y-2 min-w-0">
                            <div className="text-sm font-medium text-foreground">{String(t("library.parameterGroups.create.sampleType"))}</div>

                            <select
                                value={form.sampleTypeId}
                                onChange={(e) => setForm((s) => ({ ...s, sampleTypeId: e.target.value }))}
                                className={[
                                    "w-full min-w-0 max-w-full",
                                    "px-3 py-2 border rounded-lg text-sm",
                                    "bg-background text-foreground border-border",
                                    "focus:outline-none focus:ring-2 focus:ring-ring",
                                    "overflow-hidden text-ellipsis whitespace-nowrap",
                                ].join(" ")}
                                title={sampleTypes.find((x) => x.sampleTypeId === form.sampleTypeId)?.sampleTypeName ?? ""}
                            >
                                <option value="">{String(t("common.select"))}</option>
                                {sampleTypes.map((st) => (
                                    <option key={st.sampleTypeId} value={st.sampleTypeId}>
                                        {st.sampleTypeName}
                                    </option>
                                ))}
                            </select>

                            {sampleTypesQ.isLoading ? <div className="text-xs text-muted-foreground">{String(t("common.loading"))}</div> : null}
                            {sampleTypesQ.isError ? <div className="text-xs text-destructive">{String(t("library.parameterGroups.create.sampleTypesLoadError"))}</div> : null}
                        </div>
                    </div>
                    <MultiSelectChips
                        value={form.matrixIds}
                        options={matrixOptions}
                        onChange={(next) => setForm((s) => ({ ...s, matrixIds: next }))}
                        disabled={matricesQ.isLoading || matricesQ.isError}
                        label={String(t("library.parameterGroups.create.matrices"))}
                        placeholder={String(t("library.parameterGroups.create.matricesPlaceholder"))}
                        searchPlaceholder={String(t("library.parameterGroups.create.matricesSearchPlaceholder"))}
                        selectAllLabel={""}
                        unselectAllLabel={""}
                    />

                    <div className="grid grid-cols-5 gap-3">
                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{String(t("library.parameterGroups.create.feeBeforeTaxAndDiscount"))}</div>
                            <Input
                                value={form.feeBeforeTaxAndDiscount}
                                onChange={(e) =>
                                    setForm((s) => ({
                                        ...s,
                                        feeBeforeTaxAndDiscount: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{String(t("library.parameterGroups.create.discountRate"))}</div>
                            <Input value={form.discountRate} onChange={(e) => setForm((s) => ({ ...s, discountRate: e.target.value }))} />
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{String(t("library.parameterGroups.create.feeBeforeTax"))}</div>
                            <Input value={form.feeBeforeTax} onChange={(e) => setForm((s) => ({ ...s, feeBeforeTax: e.target.value }))} />
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{String(t("library.parameterGroups.create.taxRate"))}</div>
                            <Input value={form.taxRate} onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))} />
                        </div>

                        <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{String(t("library.parameterGroups.create.feeAfterTax"))}</div>
                            <Input value={form.feeAfterTax} onChange={(e) => setForm((s) => ({ ...s, feeAfterTax: e.target.value }))} />
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
                            {create.isPending ? String(t("common.saving", { defaultValue: "Đang lưu..." })) : String(t("common.save", { defaultValue: "Lưu" }))}
                        </Button>
                    </div>

                    {create.isError ? <div className="text-sm text-destructive">{String(t("library.parameterGroups.create.error"))}</div> : null}
                </div>
            </div>
        </div>
    );
}
