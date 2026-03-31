import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, X, Check, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import { type Protocol } from "@/api/library";

import { AccreditationBadges } from "../shared/AccreditationTagInput";

export type ProtocolsExcelFiltersState = {
    accreditation: string[];
};

type FilterKey = keyof ProtocolsExcelFiltersState;

type Props = {
    items: Protocol[];
    selectedId: string | null;
    onView: (p: Protocol) => void;
    onEdit: (p: Protocol) => void;

    excelFilters: ProtocolsExcelFiltersState;
    onExcelFiltersChange: (next: ProtocolsExcelFiltersState) => void;
};


type AccreditationFilterPopoverProps = {
    title: string;
    activeCount: number;
    selected: string[];
    onApply: (values: string[]) => void;
    onClear: () => void;
};

function AccreditationFilterPopover(props: AccreditationFilterPopoverProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [localSelected, setLocalSelected] = useState<string[]>(props.selected);

    const options = useMemo(
        () => [
            { value: "VILAS997", label: "VILAS997" },
            { value: "TDC", label: "TDC" },
            { value: "NONE", label: String(t("common.noData")) },
        ],
        [t],
    );

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
        setOpen(false);
    };

    const onOpenChange = (next: boolean) => {
        setOpen(next);
        if (next) setLocalSelected(props.selected);
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

                <div className="border-t border-border">
                    <Command shouldFilter={false}>
                        <CommandList className="max-h-64">
                            <CommandGroup>
                                {options.map((o) => {
                                    const checked = localSelected.includes(o.value);
                                    return (
                                        <CommandItem key={o.value} value={o.value} onSelect={() => toggle(o.value)} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={[
                                                        "inline-flex h-4 w-4 items-center justify-center rounded-sm border border-border",
                                                        checked ? "bg-primary text-primary-foreground" : "bg-background",
                                                    ].join(" ")}
                                                >
                                                    {checked ? <Check className="h-3 w-3" /> : null}
                                                </span>

                                                <span className="text-sm text-foreground">{o.label}</span>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
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

export function ProtocolsTable(props: Props) {
    const { t } = useTranslation();
    const { items, selectedId, onView, onEdit, excelFilters, onExcelFiltersChange } = props;

    const setStr = (key: FilterKey, values: string[]) => {
        onExcelFiltersChange({
            ...excelFilters,
            [key]: values,
        } as ProtocolsExcelFiltersState);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[800px]">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-[20%]">{String(t("library.protocols.protocolCode"))}</th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-[30%]">{String(t("library.protocols.protocolTitle"))}</th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-[15%]">{String(t("library.protocols.protocolSource"))}</th>

                        <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-[15%]">
                            <span className="inline-flex items-center gap-2">
                                {String(t("library.protocols.protocolAccreditation.title"))}
                                <AccreditationFilterPopover
                                    title={String(t("library.protocols.protocolAccreditation.title"))}
                                    activeCount={excelFilters.accreditation.length}
                                    selected={excelFilters.accreditation}
                                    onApply={(v) => setStr("accreditation", v)}
                                    onClear={() => setStr("accreditation", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-[10%]">{String(t("library.protocols.turnaroundDays", { defaultValue: "Dự kiến" }))}</th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-[15%]">{String(t("library.protocols.detail.description", { defaultValue: "Mô tả" }))}</th>

                        <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase w-[5%]">{String(t("library.protocols.columns.actions"))}</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-border">
                    {items.map((p) => {
                        const active = p.protocolId === selectedId;
                        return (
                            <tr key={p.protocolId} onClick={() => onView(p)} className={`hover:bg-muted/50 cursor-pointer ${active ? "bg-muted" : ""}`}>
                                <td className="px-3 py-3 align-top">
                                    <div className="text-sm text-foreground font-medium line-clamp-2 break-words" title={p.protocolCode}>
                                        {p.protocolCode}
                                    </div>
                                </td>

                                <td className="px-4 py-3 align-top">
                                    <div className="text-sm text-foreground line-clamp-2 break-words" title={p.protocolTitle || ""}>
                                        {p.protocolTitle || "-"}
                                    </div>
                                </td>

                                <td className="px-3 py-3 align-top">
                                    <div className="text-sm text-foreground line-clamp-2 break-words" title={p.protocolSource}>
                                        {p.protocolSource}
                                    </div>
                                </td>

                                <td className="px-3 py-3 align-top">
                                    <div className="flex flex-wrap gap-1">
                                        <AccreditationBadges value={p.protocolAccreditation} className="text-xs" />
                                    </div>
                                </td>

                                <td className="px-4 py-3 align-top">
                                    <div className="text-sm text-foreground text-center" title={String(p.turnaroundDays)}>
                                        {p.turnaroundDays != null ? p.turnaroundDays : "-"}
                                    </div>
                                </td>

                                <td className="px-4 py-3 align-top">
                                    <div className="text-sm text-muted-foreground line-clamp-2 break-words" title={p.protocolDescription || ""}>
                                        {p.protocolDescription || "-"}
                                    </div>
                                </td>

                                <td className="px-3 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(p)} type="button" title={String(t("common.edit"))}>
                                            <Edit className="h-4 w-4" />
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
