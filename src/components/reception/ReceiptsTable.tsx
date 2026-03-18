// src/components/reception/ReceiptsTable.tsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Filter, X, Check, Truck, Clock, FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

import { RowActionIcons } from "@/components/common/RowActionIcons";

import { useReceiptsFilter } from "@/api/receipts";
import type { ReceiptListItem, ReceiptStatus, ReceiptSample, ReceiptAnalysis } from "@/types/receipt";
import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

/** Extract samples array from receipt (available in processing endpoint) */
function getReceiptSamples(receipt: ReceiptListItem): ReceiptSample[] {
    const raw = (receipt as Record<string, unknown>).samples;
    if (Array.isArray(raw)) return raw as ReceiptSample[];
    return [];
}

/** Count analyses stats for a single sample */
function countAnalysesStats(sample: ReceiptSample): { distributed: number; completed: number; total: number } {
    const analyses: ReceiptAnalysis[] = (sample.analyses ?? []).filter((a) => a?.analysisId);
    const total = analyses.length;
    // distributed = analyses that have been handed over (have technicianId or status is not Pending)
    const distributed = analyses.filter((a) => a.technicianId || (a.analysisStatus && a.analysisStatus !== "Pending")).length;
    // completed = analyses with status Approved/DataEntered or have result
    const completed = analyses.filter((a) => a.analysisStatus === "Approved" || a.analysisStatus === "DataEntered" || a.analysisResult != null).length;
    return { distributed, completed, total };
}

export type TabKey = "incoming-requests" | "processing" | "return-results";

export type ReceiptExcelFiltersState = {
    receiptStatus: ReceiptStatus[];
    receiptCode: string[];
};

type Props = {
    items: ReceiptListItem[];
    activeTab: TabKey;

    selectedRowKey: string | null;
    onSelectRow: (rowKey: string, receiptId: string) => void;

    onView: (receiptId: string) => void;
    onDelete: (receiptId: string) => void;

    excelFilters: ReceiptExcelFiltersState;
    onExcelFiltersChange: (next: ReceiptExcelFiltersState) => void;

    openingReceiptId: string | null;
};

function parseIsoDateOnly(iso?: string | null, fallback = "--"): string {
    if (!iso) return fallback;
    const t = iso.split("T")[0];
    return t.length > 0 ? t : fallback;
}

function safeDaysLeft(deadlineIso?: string | null): number | null {
    if (!deadlineIso) return null;
    const tt = new Date(deadlineIso).getTime();
    if (!Number.isFinite(tt)) return null;
    const days = Math.ceil((tt - Date.now()) / (1000 * 3600 * 24));
    return Number.isFinite(days) ? days : null;
}

function toReceiptStatusLabelKey(status: ReceiptStatus): string {
    if (status === "Draft") return "reception.receipts.status.draft";
    if (status === "Received") return "reception.receipts.status.receive";
    if (status === "Processing") return "reception.receipts.status.processing";
    if (status === "Completed") return "reception.receipts.status.completed";
    if (status === "Reported") return "reception.receipts.status.reported";
    if (status === "Cancelled") return "reception.receipts.status.cancelled";
    return "";
}

function getReceiptStatusLabel(status: string, t: (k: string, opt?: Record<string, unknown>) => unknown): string {
    const s = status as ReceiptStatus;
    const key = toReceiptStatusLabelKey(s);
    if (!key) return status; // fallback
    return String(t(key, { defaultValue: status }));
}

function getReceiptStatusBadge(status: ReceiptStatus, t: (k: string, opt?: Record<string, unknown>) => unknown) {
    const key = toReceiptStatusLabelKey(status);
    const label = key ? String(t(key, { defaultValue: status })) : String(status);

    switch (status) {
        case "Draft":
        case "Received":
            return (
                <Badge variant="outline" className="text-muted-foreground border-border">
                    {label}
                </Badge>
            );

        case "Processing":
            return (
                <Badge variant="default" className="bg-warning text-warning-foreground hover:bg-warning/90">
                    {label}
                </Badge>
            );

        case "Completed":
            return (
                <Badge variant="default" className="bg-success text-success-foreground hover:bg-success/90">
                    {label}
                </Badge>
            );

        case "Reported":
            return (
                <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {label}
                </Badge>
            );

        case "Cancelled":
            return <Badge variant="destructive">{label}</Badge>;

        default:
            return (
                <Badge variant="secondary" className="text-muted-foreground">
                    {label}
                </Badge>
            );
    }
}

/** ===== Filter types (giống matrices) ===== */
type FilterKey = keyof ReceiptExcelFiltersState;
type FilterFrom = "receiptStatus" | "receiptCode";

type ReceiptsFilterOtherFilter = {
    filterFrom: FilterFrom;
    filterValues: Array<string | number>;
};

type OptionWithCount<T extends string | number> = { value: T; count: number };

const FILTER_FROM_MAP: Record<FilterKey, FilterFrom> = {
    receiptStatus: "receiptStatus",
    receiptCode: "receiptCode",
};

function buildOtherFilters(filters: ReceiptExcelFiltersState, excludeKey: FilterKey): ReceiptsFilterOtherFilter[] {
    const out: ReceiptsFilterOtherFilter[] = [];

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
          filterKey: "receiptCode";
          activeCount: number;
          selected: string[];
          excelFilters: ReceiptExcelFiltersState;
          onApply: (values: string[]) => void;
          onClear: () => void;
          limit?: number;
      }
    | {
          type: "string";
          title: string;
          filterKey: "receiptStatus";
          activeCount: number;
          selected: ReceiptStatus[];
          excelFilters: ReceiptExcelFiltersState;
          onApply: (values: ReceiptStatus[]) => void;
          onClear: () => void;
          limit?: number;
      };

function ExcelFilterPopover(props: ExcelFilterPopoverProps) {
    const { t } = useTranslation();

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 250);

    const [localSelected, setLocalSelected] = useState<Array<string | number>>(props.selected as Array<string | number>);

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

    const q = useReceiptsFilter(filterInput, { enabled: open });

    const apiOptions = useMemo((): Array<OptionWithCount<string>> => {
        const data = (q.data as Array<{ filterValue: string | number; count: number }>) ?? [];
        return data.map((x) => ({ value: String(x.filterValue), count: x.count })).filter((x) => x.value.trim().length > 0);
    }, [q.data]);

    const filteredOptions = useMemo(() => {
        const qtext = search.trim().toLowerCase();
        if (!qtext) return apiOptions;
        return apiOptions.filter((o) => o.value.toLowerCase().includes(qtext));
    }, [apiOptions, search]);

    const toggle = (v: string) => {
        setLocalSelected((cur) => {
            const has = cur.some((x) => String(x) === v);
            if (has) return cur.filter((x) => String(x) !== v);
            return [...cur, v];
        });
    };

    const apply = () => {
        if (props.filterKey === "receiptStatus") {
            props.onApply(localSelected.map(String) as ReceiptStatus[]);
        } else {
            props.onApply(localSelected.map(String));
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
            setLocalSelected(props.selected as Array<string | number>);
            setSearch("");
        }
    };

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" type="button" aria-label={String(t("common.filter", { defaultValue: "Filter" }))} className="relative">
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
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={String(t("common.search", { defaultValue: "Search" }))} className="border border-border" />
                </div>

                <div className="border-t border-border">
                    <Command shouldFilter={false}>
                        <CommandList className="max-h-64">
                            {q.isLoading ? (
                                <div className="p-3 text-sm text-muted-foreground">{String(t("common.loading", { defaultValue: "Loading..." }))}</div>
                            ) : q.isError ? (
                                <div className="p-3 text-sm text-muted-foreground">{String(t("common.toast.failed", { defaultValue: "Failed" }))}</div>
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

                                                    <span className="text-sm text-foreground">{props.filterKey === "receiptStatus" ? getReceiptStatusLabel(key, t) : key}</span>
                                                </div>

                                                <span className="text-xs text-muted-foreground tabular-nums">{o.count}</span>
                                            </CommandItem>
                                        );
                                    })}
                                </CommandGroup>
                            ) : null}

                            {q.isError ? (
                                <div className="flex items-start gap-2 p-3 text-destructive">
                                    <AlertCircle className="h-4 w-4 mt-0.5" />
                                    <div className="text-sm">{String(t("common.toast.requestFailed"))}</div>
                                </div>
                            ) : null}
                        </CommandList>
                    </Command>

                    <div className="p-3 border-t border-border flex flex-col gap-2">
                        <Button variant="outline" type="button" className="w-full" onClick={clear} disabled={props.activeCount === 0}>
                            {String(t("common.clear", { defaultValue: "Clear" }))}
                        </Button>
                        <Button type="button" className="w-full" onClick={apply}>
                            {String(t("common.apply", { defaultValue: "Apply" }))}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function ReceiptsTable({ items, activeTab, selectedRowKey, onSelectRow, onView, onDelete, excelFilters, onExcelFiltersChange, openingReceiptId }: Props) {
    const { t } = useTranslation();
    const dash = String(t("common.noData"));

    const setStr = (_key: "receiptCode", values: string[]) => {
        onExcelFiltersChange({ ...excelFilters, receiptCode: values });
    };

    const setStatus = (values: ReceiptStatus[]) => {
        onExcelFiltersChange({ ...excelFilters, receiptStatus: values });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <span className="inline-flex items-center gap-2">
                                {String(t("reception.sampleReception.receiptInfo"))}
                                <ExcelFilterPopover
                                    type="string"
                                    title={String(t("reception.sampleReception.receiptInfo"))}
                                    filterKey="receiptCode"
                                    activeCount={excelFilters.receiptCode.length}
                                    selected={excelFilters.receiptCode}
                                    excelFilters={excelFilters}
                                    onApply={(v) => setStr("receiptCode", v)}
                                    onClear={() => setStr("receiptCode", [])}
                                />
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {activeTab === "processing" ? (
                                <span className="inline-flex items-center gap-2">
                                    {String(t("reception.sampleReception.table.processing.status"))}
                                    <ExcelFilterPopover
                                        type="string"
                                        title={String(t("reception.sampleReception.table.processing.status"))}
                                        filterKey="receiptStatus"
                                        activeCount={excelFilters.receiptStatus.length}
                                        selected={excelFilters.receiptStatus}
                                        excelFilters={excelFilters}
                                        onApply={(v) => setStatus(v)}
                                        onClear={() => setStatus([])}
                                    />
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">{String(t("reception.sampleReception.table.returnResults.tracking"))}</span>
                            )}
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{String(t("reception.sampleReception.table.processing.deadline"))}</th>

                        {activeTab === "processing" ? (
                            <>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 200 }}>
                                    {String(t("lab.samples.sampleId", { defaultValue: "Mẫu thử" }))}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {String(t("lab.analyses.progress", { defaultValue: "Tiến độ PT" }))}
                                </th>
                            </>
                        ) : (
                            <>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {String(t("reception.sampleReception.table.returnResults.contact"))}
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {String(t("reception.sampleReception.table.processing.actions"))}
                                </th>
                            </>
                        )}
                    </tr>
                </thead>

                <tbody className="divide-y divide-border">
                    {items.map((receipt) => {
                        const daysLeft = safeDaysLeft(receipt.receiptDeadline);

                        const trackingNo = (receipt as { receiptTrackingNo?: string | null }).receiptTrackingNo ?? (receipt as { trackingNumber?: string | null }).trackingNumber ?? null;

                        const clientEmail = (receipt.client as { clientEmail?: string | null } | null)?.clientEmail ?? null;
                        const clientAddress = (receipt.client as { clientAddress?: string | null } | null)?.clientAddress ?? null;
                        const clientPhone = (receipt.client as { clientPhone?: string | null } | null)?.clientPhone ?? null;

                        const rowKey = receipt.receiptId;
                        const isSelected = selectedRowKey === rowKey;

                        // ── Processing tab: render multi-row per receipt ─────
                        if (activeTab === "processing") {
                            const samples = getReceiptSamples(receipt);
                            const rowCount = Math.max(samples.length, 1);

                            return (
                                <React.Fragment key={receipt.receiptId}>
                                    {samples.length > 0 ? (
                                        samples.map((sample, sIdx) => {
                                            const stats = countAnalysesStats(sample);
                                            const isFirstRow = sIdx === 0;
                                            return (
                                                <tr
                                                    key={`${receipt.receiptId}-${sample.sampleId}`}
                                                    className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""} ${sIdx > 0 ? "border-t border-border/30" : ""}`}
                                                    onClick={() => onSelectRow(rowKey, receipt.receiptId)}
                                                >
                                                    {isFirstRow && (
                                                        <>
                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                <div className="space-y-1">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onView(receipt.receiptId);
                                                                        }}
                                                                        className="font-semibold text-primary hover:text-primary/80 hover:underline"
                                                                        disabled={openingReceiptId === receipt.receiptId}
                                                                    >
                                                                        {receipt.receiptCode ?? dash}
                                                                    </button>
                                                                    <div className="text-sm text-foreground">{receipt.client?.clientName ?? dash}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {parseIsoDateOnly(receipt.receiptDate, dash)} {receipt.createdBy?.identityName ? `- ${receipt.createdBy.identityName}` : ""}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                {getReceiptStatusBadge(receipt.receiptStatus, t)}
                                                            </td>

                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="font-medium text-foreground">{parseIsoDateOnly(receipt.receiptDeadline, dash)}</span>
                                                                    </div>
                                                                    {typeof daysLeft === "number" ? (
                                                                        daysLeft < 0 ? (
                                                                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                                                <AlertCircle className="h-3 w-3" />
                                                                                {String(t("reception.sampleReception.deadline.overdue"))}
                                                                            </Badge>
                                                                        ) : daysLeft <= 2 ? (
                                                                            <Badge variant="secondary" className="w-fit">
                                                                                {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge variant="outline" className="text-muted-foreground w-fit">
                                                                                {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                                                                            </Badge>
                                                                        )
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-muted-foreground w-fit">
                                                                            {dash}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* ── Sample column (single line) ── */}
                                                    <td className="px-4 py-3" style={{ minWidth: 200 }}>
                                                        <span className="text-sm">
                                                            <span className="font-semibold text-foreground">{sample.sampleId}</span>{" "}
                                                            <span className="text-muted-foreground">{(sample as any).sampleName || sample.sampleTypeName || ""}</span>
                                                        </span>
                                                    </td>

                                                    {/* ── Analyses progress column: completed / distributed / total ── */}
                                                    <td className="px-4 py-3">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <FlaskConical className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-sm font-medium tabular-nums">
                                                                    <span className="text-success">{stats.completed}</span>
                                                                    <span className="text-muted-foreground mx-0.5">/</span>
                                                                    <span className="text-primary">{stats.distributed}</span>
                                                                    <span className="text-muted-foreground mx-0.5">/</span>
                                                                    <span className="text-foreground">{stats.total}</span>
                                                                </span>
                                                            </div>
                                                            {stats.total > 0 && (
                                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all bg-primary"
                                                                        style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        /* No samples – single row */
                                        <tr className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""}`} onClick={() => onSelectRow(rowKey, receipt.receiptId)}>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onView(receipt.receiptId);
                                                        }}
                                                        className="font-semibold text-primary hover:text-primary/80 hover:underline"
                                                        disabled={openingReceiptId === receipt.receiptId}
                                                    >
                                                        {receipt.receiptCode ?? dash}
                                                    </button>
                                                    <div className="text-sm text-foreground">{receipt.client?.clientName ?? dash}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {parseIsoDateOnly(receipt.receiptDate, dash)} {receipt.createdBy?.identityName ? `- ${receipt.createdBy.identityName}` : ""}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">{getReceiptStatusBadge(receipt.receiptStatus, t)}</td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-medium text-foreground">{parseIsoDateOnly(receipt.receiptDeadline, dash)}</span>
                                                    </div>
                                                    {typeof daysLeft === "number" ? (
                                                        daysLeft < 0 ? (
                                                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                                <AlertCircle className="h-3 w-3" />
                                                                {String(t("reception.sampleReception.deadline.overdue"))}
                                                            </Badge>
                                                        ) : daysLeft <= 2 ? (
                                                            <Badge variant="secondary" className="w-fit">
                                                                {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-muted-foreground w-fit">
                                                                {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                                                            </Badge>
                                                        )
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground w-fit">
                                                            {dash}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        }

                        // ── Other tabs: Original single-row layout ──────────────────
                        return (
                            <tr key={receipt.receiptId} className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""}`} onClick={() => onSelectRow(rowKey, receipt.receiptId)}>
                                <td className="px-4 py-4">
                                    <div className="space-y-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onView(receipt.receiptId);
                                            }}
                                            className="font-semibold text-primary hover:text-primary/80 hover:underline"
                                            disabled={openingReceiptId === receipt.receiptId}
                                        >
                                            {receipt.receiptCode ?? dash}
                                        </button>
                                        <div className="text-sm text-foreground">{receipt.client?.clientName ?? dash}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {parseIsoDateOnly(receipt.receiptDate, dash)} {receipt.createdBy?.identityName ? `- ${receipt.createdBy.identityName}` : ""}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4">
                                    {trackingNo ? (
                                        <div className="flex items-center gap-2 text-sm text-foreground">
                                            <Truck className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-medium">{trackingNo}</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">{String(t("reception.sampleReception.tracking.none"))}</span>
                                    )}
                                </td>

                                <td className="px-4 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-medium text-foreground">{parseIsoDateOnly(receipt.receiptDeadline, dash)}</span>
                                        </div>
                                        {typeof daysLeft === "number" ? (
                                            daysLeft < 0 ? (
                                                <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {String(t("reception.sampleReception.deadline.overdue"))}
                                                </Badge>
                                            ) : daysLeft <= 2 ? (
                                                <Badge variant="secondary" className="w-fit">
                                                    {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground w-fit">
                                                    {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                                                </Badge>
                                            )
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground w-fit">
                                                {dash}
                                            </Badge>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-4 text-sm">
                                    <div className="space-y-1">
                                        <div className="text-foreground">{clientAddress ?? dash}</div>
                                        <div className="text-muted-foreground">
                                            {String(t("reception.sampleReception.contact.phoneLabel"))} {clientPhone ?? dash}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {String(t("reception.sampleReception.contact.emailLabel"))} {clientEmail ?? dash}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                    <RowActionIcons
                                        onView={() => onView(receipt.receiptId)}
                                        onDelete={() => onDelete(receipt.receiptId)}
                                        showEdit={false}
                                        disabled={openingReceiptId === receipt.receiptId}
                                    />
                                </td>
                            </tr>
                        );
                    })}

                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={activeTab === "processing" ? 5 : 5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                {String(t("common.noData"))}
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}
