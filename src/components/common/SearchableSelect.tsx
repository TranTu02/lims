import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export type Option = {
    value: string;
    label: string;
    keywords?: string;
};

type Props = {
    value: string | null;
    options: Option[];
    placeholder: string;
    searchPlaceholder: string;

    disabled?: boolean;
    loading?: boolean;
    error?: boolean;

    onChange: (value: string | null) => void;
    listMaxHeightClassName?: string;
    resetKey?: string | number;

    searchValue?: string;
    onSearchChange?: (value: string) => void;

    filterMode?: "client" | "server";

    allowCustomValue?: boolean;
    onCreateNew?: (searchValue: string) => void;
};

function normalize(s: string) {
    return s.trim();
}

export function SearchableSelect({
    value,
    options,
    placeholder,
    searchPlaceholder,
    disabled,
    loading,
    error,
    onChange,
    listMaxHeightClassName = "max-h-64",
    resetKey,
    searchValue,
    onSearchChange,
    filterMode = "client",
    allowCustomValue = false,
    onCreateNew,
}: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const [localSearch, setLocalSearch] = useState("");
    const effectiveSearch = searchValue ?? localSearch;

    useEffect(() => {
        setOpen(false);
        setLocalSearch("");
        onSearchChange?.("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

    const shouldFilter = filterMode === "client";

    const normalizedSearch = useMemo(() => normalize(effectiveSearch), [effectiveSearch]);

    const hasExactOption = useMemo(() => {
        if (normalizedSearch.length === 0) return false;
        return options.some((o) => o.value.toLowerCase() === normalizedSearch.toLowerCase() || o.label.toLowerCase() === normalizedSearch.toLowerCase());
    }, [options, normalizedSearch]);

    const canCreateCustom = allowCustomValue && normalizedSearch.length > 0 && !hasExactOption;

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                <Button type="button" variant="outline" disabled={disabled} className={cn("w-full justify-between bg-background h-auto py-2 min-h-10", !selected?.label && "text-muted-foreground")}>
                    <span className="text-left line-clamp-2 whitespace-normal break-words flex-1 min-w-0 pr-2">
                        {loading ? t("common.loading") : error ? t("common.error") : (selected?.label ?? placeholder)}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverPrimitive.Trigger>

            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    align="start"
                    side="bottom"
                    sideOffset={6}
                    collisionPadding={8}
                    className="z-[200] rounded-md border border-border bg-popover p-0 shadow-md"
                    style={{ width: "var(--radix-popover-trigger-width)" }}
                >
                    <Command key={String(resetKey ?? "default")} shouldFilter={shouldFilter}>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            value={effectiveSearch}
                            onValueChange={(v) => {
                                if (searchValue === undefined) setLocalSearch(v);
                                onSearchChange?.(v);
                            }}
                        />

                        <CommandList className={cn("overflow-y-auto", listMaxHeightClassName)}>
                            <CommandEmpty>{loading ? t("common.loading") : t("common.noResults")}</CommandEmpty>

                            <CommandGroup>
                                {canCreateCustom ? (
                                    <CommandItem
                                        key={`__custom__:${normalizedSearch}`}
                                        value={shouldFilter ? normalizedSearch : "__custom__"}
                                        onSelect={() => {
                                            onChange(normalizedSearch);
                                            setOpen(false);

                                            if (searchValue === undefined) setLocalSearch("");
                                            onSearchChange?.("");
                                        }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex flex-col">
                                            <span>{normalizedSearch}</span>
                                            <span className="text-xs text-muted-foreground">{t("common.create")}</span>
                                        </div>
                                    </CommandItem>
                                ) : null}

                                {options.map((o) => (
                                    <CommandItem
                                        key={o.value}
                                        value={shouldFilter ? `${o.label} ${o.value} ${o.keywords ?? ""}` : o.value}
                                        onSelect={() => {
                                            onChange(o.value);
                                            setOpen(false);

                                            if (searchValue === undefined) setLocalSearch("");
                                            onSearchChange?.("");
                                        }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                                            <span className="line-clamp-2 whitespace-normal break-words text-left">{o.label}</span>
                                            {o.label !== o.value ? <span className="text-xs text-muted-foreground">{o.value}</span> : null}
                                        </div>

                                        {value === o.value ? <Check className="h-4 w-4" /> : null}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {onCreateNew && (
                                <div className="p-1 mt-1 border-t border-border sticky bottom-0 bg-popover">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        className="w-full justify-start text-sm text-primary font-medium"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setOpen(false);
                                            onCreateNew(effectiveSearch);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {t("common.createNew", { defaultValue: "Thêm mới" })}
                                    </Button>
                                </div>
                            )}
                        </CommandList>
                    </Command>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}
