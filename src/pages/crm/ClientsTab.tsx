import { forwardRef, useImperativeHandle, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Filter, X, Check } from "lucide-react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import type { ClientDetail, ClientListItem, ClientsCreateBody, ClientsUpdateBody } from "@/types/crm/client";
import type { ApiResponse } from "@/api/client";

import { crmKeys } from "@/api/crm/crmKeys";
import { clientsCreate, clientsDelete, clientsGetDetail, clientsGetList, clientsUpdate, useClientsFilter, type ClientsFilterFrom, type ClientsFilterOtherFilter } from "@/api/crm/clients";
import { useIdentitiesAll } from "@/api/identities";

import { ClientDetailModal } from "@/components/crm/ClientDetailModal";
import { ClientUpsertModal } from "@/components/crm/ClientUpsertModal";
import { ClientDeleteModal } from "@/components/crm/ClientDeleteModal";
import { RowActionIcons } from "@/components/common/RowActionIcons";

import { toClientCreateBody, toClientUpdateBody, type ClientUpsertFormState } from "@/components/crm/clientUpsertMapper";

import { useDebouncedValue } from "@/components/library/hooks/useDebouncedValue";

type Props = {
    externalSearch: string;
};

export type ClientsTabHandle = {
    openCreate: () => void;
};

type ClientsListResponse = {
    data: ClientListItem[];
    pagination: { total: number; totalPages: number };
};

function CardSkeleton() {
    return (
        <div className="bg-card rounded-lg border border-border p-4">
            <div className="animate-pulse space-y-3">
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        </div>
    );
}

function pickInvoiceName(c: Pick<ClientListItem, "invoiceInfo">) {
    return c.invoiceInfo?.taxName ?? "-";
}

function SaleScopeBadge(props: { scope: ClientListItem["clientSaleScope"] }) {
    const { t } = useTranslation();
    const scope = props.scope ?? null;

    if (scope === "public") {
        return (
            <Badge variant="secondary" className="text-xs">
                {t("crm.clients.saleScope.public")}
            </Badge>
        );
    }

    if (scope === "private") {
        return (
            <Badge variant="warning" className="text-xs">
                {t("crm.clients.saleScope.private")}
            </Badge>
        );
    }

    return null;
}

function useClientDetailOnHover(clientId: string) {
    const qc = useQueryClient();
    const [open, setOpen] = useState(false);

    const id = clientId.trim();

    const cached = id.length ? qc.getQueryData<ApiResponse<ClientDetail>>(crmKeys.clients.detail(id)) : undefined;

    const q = useQuery({
        queryKey: id.length ? crmKeys.clients.detail(id) : ["crm", "clients", "detail", "none"],
        enabled: open && id.length > 0 && !cached,
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => clientsGetDetail({ query: { clientId: id } }),
    });

    const res = cached ?? q.data ?? null;
    const detail = res?.success ? res.data : null;

    return {
        open,
        setOpen,
        detail,
        isLoading: q.isLoading,
        isError: q.isError || (res ? res.success === false : false),
    };
}

function ClientInvoiceTooltip(props: { clientId: string; preview: ClientListItem; children: ReactNode }) {
    const { t } = useTranslation();
    const { open, setOpen, detail, isLoading, isError } = useClientDetailOnHover(props.clientId);

    const invoice = detail?.invoiceInfo ?? props.preview.invoiceInfo;

    return (
        <TooltipProvider>
            <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
                <TooltipTrigger asChild>{props.children}</TooltipTrigger>

                <TooltipContent className="max-w-lg border border-border bg-popover text-popover-foreground shadow-md">
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-foreground">{t("crm.clients.tooltip.invoiceTitle")}</div>

                        <div className="text-xs text-muted-foreground">
                            {t("crm.clients.tooltip.taxName")}: <span className="text-foreground">{invoice?.taxName ?? "-"}</span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {t("crm.clients.tooltip.taxCode")}: <span className="text-foreground">{invoice?.taxCode ?? "-"}</span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {t("crm.clients.tooltip.taxEmail")}: <span className="text-foreground">{invoice?.taxEmail ?? "-"}</span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            {t("crm.clients.tooltip.taxAddress")}: <span className="text-foreground">{invoice?.taxAddress ?? "-"}</span>
                        </div>

                        {isLoading ? <div className="text-xs text-muted-foreground">{t("common.loading")}</div> : null}

                        {isError ? <div className="text-xs text-destructive">{t("common.error")}</div> : null}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function ClientContactsTooltip(props: { clientId: string; preview: ClientListItem; children: ReactNode }) {
    const { t } = useTranslation();
    const { open, setOpen, detail, isLoading, isError } = useClientDetailOnHover(props.clientId);

    const contacts = detail?.clientContacts ?? props.preview.clientContacts ?? [];

    return (
        <TooltipProvider>
            <Tooltip open={open} onOpenChange={setOpen} delayDuration={150}>
                <TooltipTrigger asChild>{props.children}</TooltipTrigger>

                <TooltipContent className="max-w-lg border border-border bg-popover text-popover-foreground shadow-md">
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-foreground">{t("crm.clients.tooltip.contactsTitle")}</div>

                        {contacts.length === 0 ? (
                            <div className="text-xs text-muted-foreground">{t("common.empty")}</div>
                        ) : (
                            <div className="space-y-2">
                                {contacts.map((c, idx) => (
                                    <div key={`${c.contactId ?? "none"}-${idx}`} className="rounded-md border border-border p-2">
                                        <div className="text-xs font-medium text-foreground">{c.contactName ?? "-"}</div>
                                        <div className="text-xs text-muted-foreground">{c.contactPosition ?? "-"}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {c.contactPhone ?? "-"} • {c.contactEmail ?? "-"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{c.contactAddress ?? "-"}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {isLoading ? <div className="text-xs text-muted-foreground">{t("common.loading")}</div> : null}

                        {isError ? <div className="text-xs text-destructive">{t("common.error")}</div> : null}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

function ContactsCompactLabel(props: { contacts: ClientListItem["clientContacts"] }) {
    const contacts = props.contacts ?? [];
    const first = contacts[0]?.contactName ?? "-";
    const more = Math.max(0, contacts.length - 1);

    return (
        <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground">{first}</span>

            {more > 0 ? <span className="inline-flex items-center justify-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">+{more}</span> : null}
        </div>
    );
}

type ClientsExcelFiltersState = {
    clientId: string[];
    clientName: string[];
    legalId: string[];
    clientPhone: string[];
    clientEmail: string[];
    clientSaleScope: string[];
};

type FilterKey = keyof ClientsExcelFiltersState;
type ApiFilterKey = FilterKey;

const FILTER_FROM_MAP: Record<ApiFilterKey, ClientsFilterFrom> = {
    clientId: "clientId",
    clientName: "clientName",
    legalId: "legalId",
    clientPhone: "clientPhone",
    clientEmail: "clientEmail",
    clientSaleScope: "clientSaleScope",
};

function createEmptyFilters(): ClientsExcelFiltersState {
    return {
        clientId: [],
        clientName: [],
        legalId: [],
        clientPhone: [],
        clientEmail: [],
        clientSaleScope: [],
    };
}

function buildOtherFiltersForApi(filters: ClientsExcelFiltersState, excludeKey: ApiFilterKey): ClientsFilterOtherFilter[] {
    const out: ClientsFilterOtherFilter[] = [];

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

function buildAllOtherFiltersForApi(filters: ClientsExcelFiltersState): ClientsFilterOtherFilter[] {
    const out: ClientsFilterOtherFilter[] = [];

    (Object.keys(FILTER_FROM_MAP) as ApiFilterKey[]).forEach((k) => {
        const v = filters[k];
        if (!Array.isArray(v) || v.length === 0) return;

        out.push({
            filterFrom: FILTER_FROM_MAP[k],
            filterValues: v,
        });
    });

    return out;
}

type OptionWithCount<T extends string> = { value: T; count: number };

function pickValueForFilterKey(item: ClientListItem, key: ApiFilterKey): string {
    if (key === "clientId") return item.clientId ?? "";
    if (key === "clientName") return item.clientName ?? "";
    if (key === "legalId") return item.legalId ?? "";
    if (key === "clientPhone") return item.clientPhone ?? "";
    if (key === "clientEmail") return item.clientEmail ?? "";
    if (key === "clientSaleScope") return item.clientSaleScope ?? "";
    return "";
}

function hasAnyExcelFilter(f: ClientsExcelFiltersState) {
    return f.clientId.length > 0 || f.clientName.length > 0 || f.legalId.length > 0 || f.clientPhone.length > 0 || f.clientEmail.length > 0 || f.clientSaleScope.length > 0;
}

type ExcelFilterPopoverProps = {
    title: string;
    filterKey: ApiFilterKey;
    activeCount: number;
    selected: string[];
    excelFilters: ClientsExcelFiltersState;

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
        [filterFrom, debouncedSearch, props.excelFilters, props.filterKey, props.itemsPerPage],
    );

    const q = useClientsFilter(input, { enabled: open });

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
                <Button variant="ghost" size="icon" type="button" aria-label={t("common.filter")} className="relative">
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
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.search")} className="border border-border" />
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

                                                    <span className="text-sm text-foreground break-words whitespace-normal">
                                                        {props.filterKey === "clientSaleScope"
                                                            ? t(`crm.clients.saleScope.${o.value}`, {
                                                                  defaultValue: o.value,
                                                              })
                                                            : o.value}
                                                    </span>
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

function ThWithFilter(props: {
    label: string;
    filterKey: ApiFilterKey;
    excelFilters: ClientsExcelFiltersState;
    onExcelFiltersChange: (next: ClientsExcelFiltersState) => void;
    itemsPerPageForOptions?: number;
}) {
    const { label, filterKey, excelFilters, onExcelFiltersChange } = props;

    const setStr = (key: FilterKey, values: string[]) => {
        onExcelFiltersChange({ ...excelFilters, [key]: values });
    };

    const activeCount = excelFilters[filterKey].length;

    return (
        <span className="inline-flex items-center gap-2">
            {label}
            <ExcelFilterPopover
                title={label}
                filterKey={filterKey}
                activeCount={activeCount}
                selected={excelFilters[filterKey]}
                excelFilters={excelFilters}
                onApply={(v) => setStr(filterKey, v)}
                onClear={() => setStr(filterKey, [])}
                itemsPerPage={props.itemsPerPageForOptions}
            />
        </span>
    );
}

export const ClientsTab = forwardRef<ClientsTabHandle, Props>(function ClientsTab(props, ref) {
    const { t } = useTranslation();
    const qc = useQueryClient();

    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [selected, setSelected] = useState<ClientListItem | null>(null);

    const [excelFilters, setExcelFilters] = useState<ClientsExcelFiltersState>(() => createEmptyFilters());

    const { data: staffData } = useIdentitiesAll({ query: { itemsPerPage: 1000 } });
    const staff = staffData?.data ?? [];

    useImperativeHandle(ref, () => ({
        openCreate: () => setCreateOpen(true),
    }));

    const searchText = props.externalSearch.trim().length ? props.externalSearch.trim() : "";

    const hasFilters = hasAnyExcelFilter(excelFilters);

    const filterListInput = useMemo(() => {
        const searchText = props.externalSearch.trim();

        if (searchText.length > 0) {
            return {
                body: {
                    filterFrom: "clientName" as ClientsFilterFrom,
                    textFilter: searchText,
                    otherFilters: buildOtherFiltersForApi(excelFilters, "clientName"),
                    page,
                    itemsPerPage,
                },
            };
        }

        return {
            body: {
                filterFrom: "clientId" as ClientsFilterFrom,
                textFilter: null,
                otherFilters: buildAllOtherFiltersForApi(excelFilters),
                page,
                itemsPerPage,
            },
        };
    }, [excelFilters, itemsPerPage, page, props.externalSearch]);

    const listQuery = useMemo(
        () => ({
            page,
            itemsPerPage,
            search: searchText.length ? searchText : undefined,
        }),
        [page, itemsPerPage, searchText],
    );

    const q = useQuery({
        queryKey: hasFilters ? ["crm", "clients", "filter-list", filterListInput] : crmKeys.clients.list(listQuery),
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => {
            if (!hasFilters) {
                const res = (await clientsGetList({
                    query: listQuery,
                })) as unknown as ClientsListResponse;
                return res;
            }
            throw new Error("FILTER_LIST_USE_HOOK");
        },
    });

    const filterListQ = useClientsFilter(filterListInput, {
        enabled: hasFilters,
    });

    const items: ClientListItem[] = hasFilters ? (filterListQ.data?.data ?? []) : (q.data?.data ?? []);

    const totalCount = hasFilters ? (filterListQ.data?.meta?.total ?? items.length) : (q.data?.pagination?.total ?? items.length);

    const totalPages = hasFilters ? (filterListQ.data?.meta?.totalPages ?? 1) : (q.data?.pagination?.totalPages ?? 1);

    const listIsLoading = hasFilters ? filterListQ.isLoading : q.isLoading;
    const listIsError = hasFilters ? filterListQ.isError : q.isError;
    const listError = hasFilters ? filterListQ.error : q.error;

    const selectedClientId = selected?.clientId ?? null;
    const selectedClientIdTrimmed = selectedClientId?.trim() ?? "";

    const detailQ = useQuery({
        queryKey: selectedClientIdTrimmed.length > 0 ? crmKeys.clients.detail(selectedClientIdTrimmed) : ["crm", "clients", "detail", "none"],
        enabled: selectedClientIdTrimmed.length > 0 && (detailOpen || editOpen),
        placeholderData: keepPreviousData,
        retry: false,
        queryFn: async () => clientsGetDetail({ query: { clientId: selectedClientIdTrimmed } }),
    });

    const createMut = useMutation({
        mutationFn: (body: ClientsCreateBody) => clientsCreate({ body }),
    });

    const updateMut = useMutation({
        mutationFn: (body: ClientsUpdateBody) => clientsUpdate({ body }),
    });

    const deleteMut = useMutation({
        mutationFn: (clientId: string) => clientsDelete({ body: { clientId } }),
    });

    if (listIsLoading) return <CardSkeleton />;

    if (listIsError) {
        const msg = listError instanceof Error ? listError.message : String(listError);
        return (
            <div className="bg-card rounded-lg border border-border p-4 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {msg}
            </div>
        );
    }

    const detailRes = detailQ.data ?? null;
    const detailData: ClientDetail | ClientListItem | null = (detailRes && detailRes.success ? detailRes.data : null) ?? selected;

    return (
        <div className="space-y-3">
            <ClientDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} data={detailData} staff={staff} />

            <ClientUpsertModal
                open={createOpen}
                mode="create"
                onClose={() => setCreateOpen(false)}
                onSubmit={async (values: ClientUpsertFormState) => {
                    const body = toClientCreateBody(values);

                    const res = await createMut.mutateAsync(body);
                    if (!res.success) {
                        toast.error(res.error?.message ?? t("common.error"));
                        return;
                    }

                    toast.success(t("common.toast.created"));
                    await qc.invalidateQueries({ queryKey: crmKeys.clients.all });
                    await qc.invalidateQueries({
                        queryKey: ["crm", "clients", "filter-list"],
                    });
                    if (!hasFilters) await q.refetch();
                    else await filterListQ.refetch();
                }}
            />

            {editOpen && selected ? (
                <ClientUpsertModal
                    open={editOpen}
                    mode="update"
                    initial={detailData}
                    onClose={() => setEditOpen(false)}
                    onSubmit={async (values: ClientUpsertFormState) => {
                        const body = toClientUpdateBody(values);

                        const res = await updateMut.mutateAsync(body);
                        if (!res.success) {
                            toast.error(res.error?.message ?? t("common.error"));
                            return;
                        }

                        toast.success(t("common.toast.updated"));

                        await qc.invalidateQueries({ queryKey: crmKeys.clients.all });
                        await qc.invalidateQueries({
                            queryKey: crmKeys.clients.detail(body.clientId),
                        });
                        await qc.invalidateQueries({
                            queryKey: ["crm", "clients", "filter-list"],
                        });

                        if (!hasFilters) await q.refetch();
                        else await filterListQ.refetch();
                    }}
                />
            ) : null}

            <ClientDeleteModal
                open={deleteOpen}
                clientId={selected?.clientId ?? null}
                onClose={() => setDeleteOpen(false)}
                onConfirm={async (clientId) => {
                    const res = await deleteMut.mutateAsync(clientId);
                    if (!res.success) {
                        toast.error(res.error?.message ?? t("common.error"));
                        return;
                    }

                    toast.success(t("common.toast.deleted"));
                    await qc.invalidateQueries({ queryKey: crmKeys.clients.all });
                    await qc.invalidateQueries({
                        queryKey: ["crm", "clients", "filter-list"],
                    });

                    if (!hasFilters) await q.refetch();
                    else await filterListQ.refetch();
                }}
            />

            <div className="flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-sm">
                    {t("common.count")}: {totalCount || items.length}
                </Badge>

                {hasFilters ? (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            setExcelFilters(createEmptyFilters());
                            setPage(1);
                        }}
                    >
                        {t("common.clear")}
                    </Button>
                ) : null}
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-5xl">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <ThWithFilter
                                        label={t("crm.clients.columns.clientId")}
                                        filterKey="clientId"
                                        excelFilters={excelFilters}
                                        onExcelFiltersChange={(next) => {
                                            setExcelFilters(next);
                                            setPage(1);
                                        }}
                                    />
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <ThWithFilter
                                        label={t("crm.clients.columns.clientName")}
                                        filterKey="clientName"
                                        excelFilters={excelFilters}
                                        onExcelFiltersChange={(next) => {
                                            setExcelFilters(next);
                                            setPage(1);
                                        }}
                                    />
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    <ThWithFilter
                                        label={t("crm.clients.columns.legalId")}
                                        filterKey="legalId"
                                        excelFilters={excelFilters}
                                        onExcelFiltersChange={(next) => {
                                            setExcelFilters(next);
                                            setPage(1);
                                        }}
                                    />
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("crm.clients.columns.invoiceName")}</th>

                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("crm.clients.columns.primaryContact")}</th>

                                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.actions")}</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-border">
                            {items.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-sm text-muted-foreground" colSpan={6}>
                                        {t("common.empty")}
                                    </td>
                                </tr>
                            ) : (
                                items.map((c) => (
                                    <tr key={c.clientId} className="hover:bg-accent/30 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="font-semibold text-foreground">{c.clientId}</div>
                                            <div className="mt-1">
                                                <SaleScopeBadge scope={c.clientSaleScope} />
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="font-medium text-foreground">{c.clientName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {c.clientPhone ?? "-"} • {c.clientEmail ?? "-"}
                                            </div>
                                        </td>

                                        <td className="px-4 py-4 text-sm text-foreground">{c.legalId ?? "-"}</td>

                                        <td className="px-4 py-4 text-sm text-foreground">
                                            <ClientInvoiceTooltip clientId={c.clientId} preview={c}>
                                                <div className="cursor-default">
                                                    <div className="font-medium text-foreground">{pickInvoiceName(c)}</div>
                                                    <div className="text-xs text-muted-foreground">{c.invoiceInfo?.taxCode ?? "-"}</div>
                                                </div>
                                            </ClientInvoiceTooltip>
                                        </td>

                                        <td className="px-4 py-4 text-sm text-foreground">
                                            <ClientContactsTooltip clientId={c.clientId} preview={c}>
                                                <div className="cursor-default">
                                                    <ContactsCompactLabel contacts={c.clientContacts} />
                                                </div>
                                            </ClientContactsTooltip>
                                        </td>

                                        <td className="px-4 py-4">
                                            <RowActionIcons
                                                onView={() => {
                                                    setSelected(c);
                                                    setDetailOpen(true);
                                                }}
                                                onEdit={() => {
                                                    setSelected(c);
                                                    setEditOpen(true);
                                                }}
                                                onDelete={() => {
                                                    setSelected(c);
                                                    setDeleteOpen(true);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    totalPages={totalPages}
                    currentPage={page}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalCount}
                    onPageChange={setPage}
                    onItemsPerPageChange={(n) => {
                        setPage(1);
                        setItemsPerPage(n);
                    }}
                />
            </div>
        </div>
    );
});
