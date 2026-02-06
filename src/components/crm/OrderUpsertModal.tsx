import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Plus, Trash2, X, ReceiptText, User, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import type { OrderDetail, OrderListItem } from "@/types/crm/order";
import {
  createEmptyOrderFormState,
  createEmptySample,
  createEmptyTransaction,
  normalizeOrderInitial,
  type OrderUpsertFormState,
} from "@/components/crm/orderUpsertMapper";
import { formatDate } from "@/utils/format";

type Props = {
  open: boolean;
  mode: "create" | "update";
  initial?: OrderDetail | OrderListItem | null;
  onClose: () => void;
  onSubmit?: (values: OrderUpsertFormState) => void | Promise<unknown>;
  submitting?: boolean;
};

function SectionBox({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          <div className="text-sm font-medium text-foreground truncate">{title}</div>
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function LabeledField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-1"}>
      <div className="text-xs text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function safeToDate(v: string | null | undefined): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function DatePickerField({
  label,
  value,
  placeholder,
  onChange,
  className,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (nextIso: string) => void;
  className?: string;
}) {
  const selected = useMemo(() => safeToDate(value), [value]);

  return (
    <LabeledField label={label} className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start font-normal">
            {selected ? formatDate(selected) : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          collisionPadding={12}
          className="w-auto min-w-[340px] p-3"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (!d) return;
              onChange(d.toISOString());
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </LabeledField>
  );
}

export function OrderUpsertModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  submitting,
}: Props) {
  const { t } = useTranslation();

  const [form, setForm] = useState<OrderUpsertFormState>(() => createEmptyOrderFormState());

  useEffect(() => {
    if (!open) return;
    if (mode === "update" && initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(normalizeOrderInitial(initial as OrderDetail));
      return;
    }
    setForm(createEmptyOrderFormState());
  }, [open, mode, initial]);

  const title = useMemo(
    () => (mode === "create" ? t("crm.orders.create.title") : t("crm.orders.update.title")),
    [mode, t]
  );

  const canEditOrderId = mode === "create";

  const orderStatusOptions = useMemo(
    () =>
      [
        { value: "Pending", label: t("crm.orders.status.pending") },
        { value: "Processing", label: t("crm.orders.status.processing") },
        { value: "Completed", label: t("crm.orders.status.completed") },
        { value: "Cancelled", label: t("crm.orders.status.cancelled") },
      ] as const,
    [t]
  );

  const paymentStatusOptions = useMemo(
    () =>
      [
        { value: "Unpaid", label: t("crm.orders.payment.unpaid") },
        { value: "Partially", label: t("crm.orders.payment.partially") },
        { value: "Paid", label: t("crm.orders.payment.paid") },
        { value: "Debt", label: t("crm.orders.payment.debt") },
      ] as const,
    [t]
  );

  async function handleSubmit() {
    if (!onSubmit) return;
    await onSubmit(form);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />

        <DialogPrimitive.Content
          className="
            fixed inset-4 z-50 flex flex-col
            bg-background border border-border rounded-lg shadow-xl
            outline-none
          "
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground truncate">
                {title}
              </DialogPrimitive.Title>

              {mode === "update" && form.orderId.trim() ? (
                <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {form.orderId.trim()}
                  </Badge>
                </div>
              ) : null}
            </div>

            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled={submitting}>
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT */}
              <div className="space-y-4">
                <SectionBox title={t("crm.orders.form.sections.basic")} icon={<ReceiptText className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <LabeledField label={t("crm.orders.columns.orderId")}>
                      <Input
                        value={form.orderId}
                        onChange={(e) => setForm((s) => ({ ...s, orderId: e.target.value }))}
                        disabled={!canEditOrderId}
                        placeholder={t("crm.orders.form.placeholders.orderId")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.quoteId")}>
                      <Input
                        value={form.quoteId}
                        onChange={(e) => setForm((s) => ({ ...s, quoteId: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.quoteId")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.clientId")}>
                      <Input
                        value={form.clientId}
                        onChange={(e) => setForm((s) => ({ ...s, clientId: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.clientId")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.salePersonId")}>
                      <Input
                        value={form.salePersonId}
                        onChange={(e) => setForm((s) => ({ ...s, salePersonId: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.salePersonId")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.saleCommissionPercent")}>
                      <Input
                        value={form.saleCommissionPercent}
                        onChange={(e) => setForm((s) => ({ ...s, saleCommissionPercent: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.saleCommissionPercent")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.totalAmount")}>
                      <Input
                        value={form.totalAmount}
                        onChange={(e) => setForm((s) => ({ ...s, totalAmount: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.totalAmount")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.taxRate")}>
                      <Input
                        value={form.taxRate}
                        onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.taxRate")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.discountRate")}>
                      <Input
                        value={form.discountRate}
                        onChange={(e) => setForm((s) => ({ ...s, discountRate: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.discountRate")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.orderStatus")}>
                      <Select value={form.orderStatus} onValueChange={(v) => setForm((s) => ({ ...s, orderStatus: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("crm.orders.form.placeholders.orderStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledField>

                    <LabeledField label={t("crm.orders.columns.paymentStatus")}>
                      <Select
                        value={form.paymentStatus}
                        onValueChange={(v) => setForm((s) => ({ ...s, paymentStatus: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("crm.orders.form.placeholders.paymentStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledField>
                  </div>
                </SectionBox>

                <SectionBox title={t("crm.orders.form.sections.contact")} icon={<User className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <LabeledField label={t("crm.orders.contact.contactName")}>
                      <Input
                        value={form.contactName}
                        onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.contactName")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.contact.contactEmail")}>
                      <Input
                        value={form.contactEmail}
                        onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.contactEmail")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.orders.contact.contactPhone")} className="md:col-span-2 space-y-1">
                      <Input
                        value={form.contactPhone}
                        onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.contactPhone")}
                      />
                    </LabeledField>
                  </div>
                </SectionBox>

                <SectionBox title={t("crm.orders.form.sections.requestForm")} icon={<FileText className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <LabeledField label={t("crm.orders.requestForm.requestedBy")}>
                      <Input
                        value={form.requestedBy}
                        onChange={(e) => setForm((s) => ({ ...s, requestedBy: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.requestedBy")}
                      />
                    </LabeledField>

                    <DatePickerField
                      label={t("crm.orders.requestForm.requestedAt")}
                      value={form.requestedAt}
                      placeholder={t("crm.orders.form.placeholders.requestedAt")}
                      onChange={(nextIso) => setForm((s) => ({ ...s, requestedAt: nextIso }))}
                    />

                    <LabeledField label={t("crm.orders.requestForm.notes")} className="md:col-span-2 space-y-1">
                      <Input
                        value={form.requestNotes}
                        onChange={(e) => setForm((s) => ({ ...s, requestNotes: e.target.value }))}
                        placeholder={t("crm.orders.form.placeholders.requestNotes")}
                      />
                    </LabeledField>
                  </div>
                </SectionBox>
              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                <SectionBox
                  title={t("crm.orders.form.sections.samples")}
                  right={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm((s) => ({ ...s, samples: [...s.samples, createEmptySample()] }))}
                      disabled={submitting}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("common.add")}
                    </Button>
                  }
                >
                  {form.samples.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                  ) : (
                    <div className="space-y-3">
                      {form.samples.map((samp, idx) => (
                        <div key={samp.id} className="bg-background rounded-lg border border-border overflow-hidden">
                          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-foreground truncate">
                              {t("crm.orders.samples.sample")} #{idx + 1}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => setForm((st) => ({ ...st, samples: st.samples.filter((x) => x.id !== samp.id) }))}
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="p-4 space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <LabeledField label={t("crm.orders.samples.fields.sampleName")}>
                                <Input
                                  value={samp.sampleName}
                                  onChange={(e) =>
                                    setForm((st) => ({
                                      ...st,
                                      samples: st.samples.map((x) => (x.id === samp.id ? { ...x, sampleName: e.target.value } : x)),
                                    }))
                                  }
                                  placeholder={t("crm.orders.form.placeholders.sampleName")}
                                />
                              </LabeledField>

                              <LabeledField label={t("crm.orders.samples.fields.userSampleId")}>
                                <Input
                                  value={samp.userSampleId}
                                  onChange={(e) =>
                                    setForm((st) => ({
                                      ...st,
                                      samples: st.samples.map((x) => (x.id === samp.id ? { ...x, userSampleId: e.target.value } : x)),
                                    }))
                                  }
                                  placeholder={t("crm.orders.form.placeholders.userSampleId")}
                                />
                              </LabeledField>

                              <LabeledField label={t("crm.orders.samples.fields.sampleTypeId")}>
                                <Input
                                  value={samp.sampleTypeId}
                                  onChange={(e) =>
                                    setForm((st) => ({
                                      ...st,
                                      samples: st.samples.map((x) => (x.id === samp.id ? { ...x, sampleTypeId: e.target.value } : x)),
                                    }))
                                  }
                                  placeholder={t("crm.orders.form.placeholders.sampleTypeId")}
                                />
                              </LabeledField>

                              <LabeledField label={t("crm.orders.samples.fields.sampleTypeName")}>
                                <Input
                                  value={samp.sampleTypeName}
                                  onChange={(e) =>
                                    setForm((st) => ({
                                      ...st,
                                      samples: st.samples.map((x) => (x.id === samp.id ? { ...x, sampleTypeName: e.target.value } : x)),
                                    }))
                                  }
                                  placeholder={t("crm.orders.form.placeholders.sampleTypeName")}
                                />
                              </LabeledField>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {t("crm.orders.samples.analyses")}
                                </div>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setForm((st) => ({
                                      ...st,
                                      samples: st.samples.map((x) =>
                                        x.id === samp.id
                                          ? {
                                              ...x,
                                              analyses: [
                                                ...x.analyses,
                                                { id: `${Date.now()}_${Math.random()}`, matrixId: "" },
                                              ],
                                            }
                                          : x
                                      ),
                                    }))
                                  }
                                  disabled={submitting}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  {t("common.add")}
                                </Button>
                              </div>

                              {samp.analyses.length === 0 ? (
                                <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                              ) : (
                                <div className="space-y-2">
                                  {samp.analyses.map((a) => (
                                    <div key={a.id} className="flex items-end gap-2">
                                      <LabeledField label={t("crm.orders.samples.fields.matrixId")} className="flex-1 space-y-1">
                                        <Input
                                          value={a.matrixId}
                                          onChange={(e) =>
                                            setForm((st) => ({
                                              ...st,
                                              samples: st.samples.map((x) =>
                                                x.id === samp.id
                                                  ? {
                                                      ...x,
                                                      analyses: x.analyses.map((y) =>
                                                        y.id === a.id ? { ...y, matrixId: e.target.value } : y
                                                      ),
                                                    }
                                                  : x
                                              ),
                                            }))
                                          }
                                          placeholder={t("crm.orders.form.placeholders.matrixId")}
                                        />
                                      </LabeledField>

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 px-2"
                                        onClick={() =>
                                          setForm((st) => ({
                                            ...st,
                                            samples: st.samples.map((x) =>
                                              x.id === samp.id ? { ...x, analyses: x.analyses.filter((y) => y.id !== a.id) } : x
                                            ),
                                          }))
                                        }
                                        disabled={submitting}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionBox>

                <SectionBox
                  title={t("crm.orders.form.sections.transactions")}
                  right={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setForm((s) => ({ ...s, transactions: [...s.transactions, createEmptyTransaction()] }))}
                      disabled={submitting}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("common.add")}
                    </Button>
                  }
                >
                  {form.transactions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                  ) : (
                    <div className="space-y-3">
                      {form.transactions.map((tx, idx) => (
                        <div key={tx.id} className="bg-background rounded-lg border border-border overflow-hidden">
                          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-foreground truncate">
                              {t("crm.orders.transactions.title")} #{idx + 1}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => setForm((st) => ({ ...st, transactions: st.transactions.filter((x) => x.id !== tx.id) }))}
                              disabled={submitting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <DatePickerField
                              label={t("crm.orders.transactions.fields.date")}
                              value={tx.date}
                              placeholder={t("crm.orders.form.placeholders.txDate")}
                              onChange={(nextIso) =>
                                setForm((st) => ({
                                  ...st,
                                  transactions: st.transactions.map((x) => (x.id === tx.id ? { ...x, date: nextIso } : x)),
                                }))
                              }
                            />

                            <LabeledField label={t("crm.orders.transactions.fields.method")}>
                              <Input
                                value={tx.method}
                                onChange={(e) =>
                                  setForm((st) => ({
                                    ...st,
                                    transactions: st.transactions.map((x) => (x.id === tx.id ? { ...x, method: e.target.value } : x)),
                                  }))
                                }
                                placeholder={t("crm.orders.form.placeholders.txMethod")}
                              />
                            </LabeledField>

                            <LabeledField label={t("crm.orders.transactions.fields.amount")}>
                              <Input
                                value={tx.amount}
                                onChange={(e) =>
                                  setForm((st) => ({
                                    ...st,
                                    transactions: st.transactions.map((x) => (x.id === tx.id ? { ...x, amount: e.target.value } : x)),
                                  }))
                                }
                                placeholder={t("crm.orders.form.placeholders.txAmount")}
                              />
                            </LabeledField>

                            <LabeledField label={t("crm.orders.transactions.fields.note")}>
                              <Input
                                value={tx.note}
                                onChange={(e) =>
                                  setForm((st) => ({
                                    ...st,
                                    transactions: st.transactions.map((x) => (x.id === tx.id ? { ...x, note: e.target.value } : x)),
                                  }))
                                }
                                placeholder={t("crm.orders.form.placeholders.txNote")}
                              />
                            </LabeledField>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionBox>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t("common.close")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {mode === "create" ? t("common.create") : t("common.save")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
