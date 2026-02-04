import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, AlertCircle, Check, ChevronsUpDown } from "lucide-react";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import type { ApiResponse } from "@/api/client";
import { samplesGetList } from "@/api/samples";
import { samplesKeys } from "@/api/samplesKeys";

import { receiptsGetList } from "@/api/receipts";
import type { ReceiptListItem } from "@/types/receipt";

import type {
  SampleListItem,
  SamplesGetListInput,
  SampleStatus,
} from "@/types/sample";

import { RowActionIcons } from "../common/RowActionIcons";
import { useQuery } from "@tanstack/react-query";
import { SampleDetailModal } from "../samples/SampleDetailModal";
import { SampleUpsertModal } from "../samples/SampleUpsertModal";

function Skeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-9 w-full bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const { t } = useTranslation();

  if (!status) {
    return (
      <Badge variant="outline" className="text-xs">
        {t("common.noData")}
      </Badge>
    );
  }

  if (status === "Stored") {
    return (
      <Badge variant="success" className="text-xs">
        {t("lab.samples.status.Stored")}
      </Badge>
    );
  }

  if (status === "Analyzing") {
    return (
      <Badge variant="warning" className="text-xs">
        {t("lab.samples.status.Analyzing")}
      </Badge>
    );
  }

  if (status === "Received") {
    return (
      <Badge variant="secondary" className="text-xs">
        {t("lab.samples.status.Received")}
      </Badge>
    );
  }

  if (status === "Disposed") {
    return (
      <Badge variant="destructive" className="text-xs">
        {t("lab.samples.status.Disposed")}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      {status}
    </Badge>
  );
}

const STATUS_ALL = "__ALL__" as const;
type StatusFilterValue = typeof STATUS_ALL | SampleStatus;

export function StoredSamples() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [receiptSearch, setReceiptSearch] = useState("");
  const [debouncedReceiptSearch, setDebouncedReceiptSearch] = useState("");
  const [receiptIdFilter, setReceiptIdFilter] = useState<string>("");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const v = receiptSearch.trim();
    const tmr = window.setTimeout(() => {
      setDebouncedReceiptSearch(v);
    }, 300);
    return () => window.clearTimeout(tmr);
  }, [receiptSearch]);

  const [status, setStatus] = useState<StatusFilterValue>(STATUS_ALL);

  const [page, setPage] = useState(1);

  const [detailOpen, setDetailOpen] = useState(false);
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<"create" | "update">("create");
  const [selected, setSelected] = useState<SampleListItem | null>(null);

  function toDash(v: unknown, dash = t("common.noData")): string {
    if (typeof v === "string") {
      const s = v.trim();
      return s.length > 0 ? s : dash;
    }
    if (v == null) return dash;
    return String(v);
  }
  const receiptOptionsQuery = useMemo(
    () => ({
      query: {
        page: 1,
        itemsPerPage: 50,
        search:
          debouncedReceiptSearch.length > 0
            ? debouncedReceiptSearch
            : undefined,
      },
      sort: {},
    }),
    [debouncedReceiptSearch]
  );

  const receiptsQ = useQuery<ApiResponse<ReceiptListItem[]>, Error>({
    queryKey: [
      "operations",
      "receipts",
      "list",
      receiptOptionsQuery.query?.search ?? "",
      receiptOptionsQuery.query?.itemsPerPage ?? 50,
    ],
    enabled: debouncedReceiptSearch.length > 0,
    queryFn: async () => {
      const res = await receiptsGetList(receiptOptionsQuery);
      if (!res.success) throw new Error(res.error?.message ?? "Request failed");
      return res;
    },
    placeholderData: (prev) => prev,
  });

  const receiptOptions = receiptsQ.data?.data ?? [];

  const listInput: SamplesGetListInput = useMemo(
    () => ({
      query: {
        page,
        itemsPerPage,
        receiptId:
          receiptIdFilter.trim().length > 0
            ? receiptIdFilter.trim()
            : undefined,
        status: status === STATUS_ALL ? undefined : status,
      },
      sort: {},
    }),
    [page, itemsPerPage, receiptIdFilter, status]
  );

  const listQ = useQuery<ApiResponse<SampleListItem[]>, Error>({
    queryKey: samplesKeys.list(
      (listInput.query ?? {}) as Record<string, unknown>,
      (listInput.sort ?? {}) as Record<string, unknown>
    ),
    queryFn: async () => {
      const res = await samplesGetList(listInput);
      if (!res.success) throw new Error(res.error?.message ?? "Request failed");
      return res;
    },
    placeholderData: (prev) => prev,
  });

  const items = listQ.data?.data ?? [];
  const totalItems = listQ.data?.meta?.total ?? 0;
  const totalPages = listQ.data?.meta?.totalPages ?? 1;

  const onOpenDetail = (row: SampleListItem) => {
    setSelected(row);
    setDetailOpen(true);
  };

  const onOpenCreate = () => {
    setSelected(null);
    setUpsertMode("create");
    setUpsertOpen(true);
  };

  const onOpenUpdate = (row: SampleListItem) => {
    setSelected(row);
    setUpsertMode("update");
    setUpsertOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="md:w-100">
              <PopoverPrimitive.Root
                open={receiptOpen}
                onOpenChange={setReceiptOpen}>
                <PopoverPrimitive.Anchor asChild>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

                    <Input
                      ref={(el) => {
                        inputRef.current = el;
                      }}
                      value={receiptSearch}
                      placeholder={t("handover.storedSamples.searchPlaceholder")}
                      className="pl-10 pr-10 bg-background"
                      onChange={(e) => {
                        const v = e.target.value;
                        setPage(1);
                        setReceiptSearch(v);
                        setReceiptIdFilter("");
                        if (v.trim().length > 0) {
                          window.setTimeout(() => setReceiptOpen(true), 0);
                        } else {
                          setReceiptOpen(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setReceiptOpen(false);
                          return;
                        }
                        if (e.key === "Enter") {
                          const v = receiptSearch.trim();
                          setPage(1);
                          setReceiptIdFilter(v);
                          setReceiptOpen(false);
                        }
                      }}
                    />

                    <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </PopoverPrimitive.Anchor>

                <PopoverPrimitive.Content
                  align="start"
                  sideOffset={6}
                  className="z-50 w-[--radix-popover-anchor-width] rounded-md border border-border bg-popover p-0 shadow-md"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    const node = e.target as Node;
                    if (inputRef.current && inputRef.current.contains(node)) {
                      e.preventDefault();
                    }
                  }}>
                  <Command shouldFilter={false}>
                    <CommandList>
                      <CommandEmpty>
                        <div className="px-3 py-4 text-sm text-muted-foreground">
                          {receiptsQ.isFetching
                            ? t("common.loading")
                            : t("common.noData")}
                        </div>
                      </CommandEmpty>

                      <CommandGroup>
                        {receiptOptions.map((r: ReceiptListItem) => {
                          const isSelected = receiptIdFilter === r.receiptId;
                          return (
                            <CommandItem
                              key={r.receiptId}
                              value={r.receiptId}
                              onSelect={() => {
                                setPage(1);
                                setReceiptSearch(r.receiptId);
                                setReceiptIdFilter(r.receiptId);
                                setReceiptOpen(false);
                              }}>
                              <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                                {isSelected ? (
                                  <Check className="h-4 w-4" />
                                ) : null}
                              </span>
                              <span className="truncate">{r.receiptId}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverPrimitive.Content>
              </PopoverPrimitive.Root>
            </div>

            <div className="md:w-60">
              <Select
                value={status}
                onValueChange={(v) => {
                  setPage(1);
                  setStatus(v as StatusFilterValue);
                }}>
                <SelectTrigger className="bg-background">
                  <SelectValue
                    placeholder={t("common.status")}
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={STATUS_ALL}>{t("common.all")}</SelectItem>
                  <SelectItem value="Received">
                    {t("lab.samples.status.Received")}
                  </SelectItem>
                  <SelectItem value="Analyzing">
                    {t("lab.samples.status.Analyzing")}
                  </SelectItem>
                  <SelectItem value="Stored">
                    {t("lab.samples.status.Stored")}
                  </SelectItem>
                  <SelectItem value="Disposed">
                    {t("lab.samples.status.Disposed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex md:justify-end">
            <Button onClick={onOpenCreate} className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              {t("common.create")}
            </Button>
          </div>
        </div>
      </div>

      {listQ.isLoading ? (
        <Skeleton />
      ) : listQ.isError ? (
        <div className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <div className="font-medium text-foreground">
              {t("common.error")}
            </div>
            <div className="text-sm text-muted-foreground">
              {t("common.toast.failed")}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full min-w-4xl">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                  {t("lab.samples.sampleId")}
                </th>
                <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                  {t("lab.samples.receiptId")}
                </th>
                <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                  {t("lab.samples.sampleTypeName")}
                </th>
                <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                  {t("lab.samples.sampleVolume")}
                </th>
                <th className="px-3 py-4 text-left text-xs font-medium text-muted-foreground uppercase">
                  {t("lab.samples.sampleStatus")}
                </th>
                <th className="px-3 py-4 text-center text-xs font-medium text-muted-foreground uppercase">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                items.map((row: SampleListItem) => (
                  <tr
                    key={row.sampleId}
                    className="hover:bg-accent/30 transition-colors">
                    <td className="px-3 py-4 font-semibold text-sm text-foreground">
                      <button
                        className="text-primary hover:underline"
                        onClick={() => onOpenDetail(row)}>
                        {row.sampleId}
                      </button>
                    </td>

                    <td className="px-3 py-4 text-sm text-foreground">
                      {toDash(row.receiptId)}
                    </td>
                    <td className="px-3 py-4 text-sm text-foreground">
                      {toDash(row.sampleTypeName)}
                    </td>
                    <td className="px-3 py-4 text-sm text-muted-foreground">
                      {toDash(row.sampleVolume)}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={row.sampleStatus ?? null} />
                    </td>

                    <td className="px-3 py-4">
                      <RowActionIcons
                        onView={() => onOpenDetail(row)}
                        onEdit={() => onOpenUpdate(row)}
                        showDelete={false}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-2">
        <Pagination
          totalItems={totalItems}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          currentPage={page}
          onPageChange={setPage}
          onItemsPerPageChange={(n) => {
            setPage(1);
            setItemsPerPage(n);
          }}
        />
      </div>

      <SampleDetailModal
        open={detailOpen}
        sampleId={selected?.sampleId ?? null}
        onClose={() => setDetailOpen(false)}
      />

      <SampleUpsertModal
        open={upsertOpen}
        mode={upsertMode}
        sampleId={upsertMode === "update" ? selected?.sampleId ?? null : null}
        onClose={() => setUpsertOpen(false)}
      />
    </div>
  );
}
