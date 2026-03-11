import * as DialogPrimitive from "@radix-ui/react-dialog";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ApiResponse } from "@/api/client";
import { samplesCreate, samplesGetFull, samplesUpdate } from "@/api/samples";
import { samplesKeys } from "@/api/samplesKeys";

import { receiptsGetList } from "@/api/receipts";
import type { ReceiptListItem } from "@/types/receipt";

import {
  SAMPLE_STATUS_VALUES,
  type SampleDetail,
  type SampleStatus,
  type SamplesCreateBody,
  type SamplesUpdateBody,
} from "@/types/sample";

import {
  SearchableSelect,
  type Option,
} from "@/components/common/SearchableSelect";

type Props = {
  open: boolean;
  mode: "create" | "update";
  sampleId: string | null;
  onClose: () => void;
};

type CreateForm = {
  receiptId: string;
  sampleTypeId: string;
  sampleClientInfo: string;
  sampleVolume: string;
};

type UpdateForm = {
  sampleStatus: SampleStatus | "";
  sampleStorageLoc: string;
};

function unwrapApi<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new Error(res.error?.message ?? "Request failed");
  return res.data as T;
}

function toStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

const SAMPLE_STATUS_OPTIONS = SAMPLE_STATUS_VALUES;

export function SampleUpsertModal({ open, mode, sampleId, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const isUpdate = mode === "update";

  const [receiptSearch, setReceiptSearch] = useState("");
  const [debouncedReceiptSearch, setDebouncedReceiptSearch] = useState("");

  useEffect(() => {
    const v = receiptSearch.trim();
    const tmr = window.setTimeout(() => setDebouncedReceiptSearch(v), 300);
    return () => window.clearTimeout(tmr);
  }, [receiptSearch]);

  const receiptOptionsQuery = useMemo(
    () => ({
      query: {
        page: 1,
        itemsPerPage: 50,
        search: debouncedReceiptSearch.length > 0 ? debouncedReceiptSearch : undefined,
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
      receiptOptionsQuery.query.search ?? "",
      receiptOptionsQuery.query.itemsPerPage ?? 50,
    ],
    enabled: open && mode === "create",
    queryFn: async () => {
      const res = await receiptsGetList(receiptOptionsQuery);
      if (!res.success) throw new Error(res.error?.message ?? "Request failed");
      return res;
    },
    placeholderData: (prev) => prev,
  });
  
  const receiptOptions = receiptsQ.data?.data ?? [];

  const receiptSelectOptions: Option[] = useMemo(
    () =>
      receiptOptions.map((r) => ({
        value: r.receiptId,
        label: r.receiptId,
      })),
    [receiptOptions]
  );

  const detailQ = useQuery({
    queryKey: sampleId ? samplesKeys.detail(sampleId) : samplesKeys.detail(""),
    enabled: open && isUpdate && Boolean(sampleId),
    queryFn: async (): Promise<ApiResponse<SampleDetail>> => {
      if (!sampleId) throw new Error("Missing sampleId");
      const res = await samplesGetFull({ sampleId });
      if (!res.success) throw new Error(res.error?.message ?? "Request failed");
      return res as ApiResponse<SampleDetail>;
    },
  });

  const createMut = useMutation({
    mutationFn: async (body: SamplesCreateBody) => {
      const res = await samplesCreate(body);
      return unwrapApi(res);
    },
    onSuccess: async () => {
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: samplesKeys.all });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : t("common.toast.failed");
      toast.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: async (body: SamplesUpdateBody) => {
      const res = await samplesUpdate(body);
      return unwrapApi(res);
    },
    onSuccess: async (_data, vars) => {
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: samplesKeys.all });
      await qc.invalidateQueries({ queryKey: samplesKeys.detail(vars.sampleId) });
      onClose();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : t("common.errorGeneric");
      toast.error(msg);
    },
  });

  const [createForm, setCreateForm] = useState<CreateForm>({
    receiptId: "",
    sampleTypeId: "",
    sampleClientInfo: "",
    sampleVolume: "",
  });

  const [updateForm, setUpdateForm] = useState<UpdateForm>({
    sampleStatus: "",
    sampleStorageLoc: "",
  });

  useEffect(() => {
    if (!open) return;

    if (!isUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreateForm({
        receiptId: "",
        sampleTypeId: "",
        sampleClientInfo: "",
        sampleVolume: "",
      });
      setReceiptSearch("");
      setDebouncedReceiptSearch("");
      return;
    }

    const d = detailQ.data?.data;
    if (!d) return;

    setUpdateForm({
      sampleStatus: (d.sampleStatus ?? "") as SampleStatus | "",
      sampleStorageLoc: toStr(d.sampleStorageLoc),
    });
  }, [open, isUpdate, detailQ.data]);

  const title = useMemo(() => {
    if (mode === "create") return t("lab.samples.upsert.createTitle");
    return t("lab.samples.upsert.updateTitle");
  }, [mode, t]);

  const submitting = createMut.isPending || updateMut.isPending;

  const onSubmit = async () => {
    if (mode === "create") {
      const body: SamplesCreateBody = {
        receiptId: createForm.receiptId.trim(),
        sampleTypeId: createForm.sampleTypeId.trim(),
        sampleClientInfo:
          createForm.sampleClientInfo.trim().length > 0
            ? createForm.sampleClientInfo.trim()
            : undefined,
        sampleVolume:
          createForm.sampleVolume.trim().length > 0
            ? createForm.sampleVolume.trim()
            : undefined,
      };
      await createMut.mutateAsync(body);
      return;
    }

    if (!sampleId) return;
    const body: SamplesUpdateBody = {
      sampleId,
      sampleStatus: updateForm.sampleStatus.length > 0 ? updateForm.sampleStatus : undefined,
      sampleStorageLoc:
        updateForm.sampleStorageLoc.trim().length > 0
          ? updateForm.sampleStorageLoc.trim()
          : undefined,
    };
    await updateMut.mutateAsync(body);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/50" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[101] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-xl shadow-lg outline-none">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {isUpdate ? (
                <div className="text-sm text-muted-foreground truncate">
                  {sampleId ?? t("common.noData")}
                </div>
              ) : null}
            </div>

            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label={t("common.close")}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="p-4 space-y-4">
            {mode === "create" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("lab.samples.receiptId")}</Label>

                    <SearchableSelect
                      value={createForm.receiptId.length > 0 ? createForm.receiptId : null}
                      options={receiptSelectOptions}
                      placeholder={t("lab.samples.placeholders.receiptId")}
                      searchPlaceholder={t("common.search")}
                      disabled={submitting}
                      loading={receiptsQ.isFetching}
                      error={receiptsQ.isError}
                      filterMode="server"
                      allowCustomValue
                      onChange={(v) => {
                        setCreateForm((s) => ({ ...s, receiptId: v ?? "" }));
                      }}
                      searchValue={receiptSearch}
                      onSearchChange={(v) => {
                        setReceiptSearch(v);
                      }}
                      resetKey={`${open}-${mode}-${sampleId ?? "new"}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("lab.samples.sampleTypeId")}</Label>
                    <Input
                      value={createForm.sampleTypeId}
                      onChange={(e) =>
                        setCreateForm((s) => ({
                          ...s,
                          sampleTypeId: e.target.value,
                        }))
                      }
                      placeholder={t("lab.samples.placeholders.sampleTypeId")}
                      className="border border-border bg-background"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("lab.samples.sampleClientInfo")}</Label>
                    <Input
                      value={createForm.sampleClientInfo}
                      onChange={(e) =>
                        setCreateForm((s) => ({
                          ...s,
                          sampleClientInfo: e.target.value,
                        }))
                      }
                      placeholder={t("lab.samples.placeholders.sampleClientInfo")}
                      className="border border-border bg-background"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("lab.samples.sampleVolume")}</Label>
                    <Input
                      value={createForm.sampleVolume}
                      onChange={(e) =>
                        setCreateForm((s) => ({
                          ...s,
                          sampleVolume: e.target.value,
                        }))
                      }
                      placeholder={t("lab.samples.placeholders.sampleVolume")}
                      className="border border-border bg-background"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("lab.samples.sampleStatus")}</Label>
                    <Select
                      value={updateForm.sampleStatus}
                      onValueChange={(v) =>
                        setUpdateForm((s) => ({
                          ...s,
                          sampleStatus: v as SampleStatus,
                        }))
                      }
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("lab.samples.placeholders.sampleStatus")} />
                      </SelectTrigger>
                      <SelectContent className="z-[150]">
                        {SAMPLE_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(`lab.samples.status.${s}`, { defaultValue: s })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("lab.samples.sampleStorageLoc")}</Label>
                    <Input
                      value={updateForm.sampleStorageLoc}
                      onChange={(e) =>
                        setUpdateForm((s) => ({
                          ...s,
                          sampleStorageLoc: e.target.value,
                        }))
                      }
                      placeholder={t("lab.samples.placeholders.sampleStorageLoc")}
                      className="border border-border h-10 bg-background"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
