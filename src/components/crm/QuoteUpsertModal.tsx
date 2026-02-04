import type React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ReceiptText, User, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { QuoteDetail, QuoteFormFields, QuotesUpdateBody } from "@/types/crm/quote";

const QUOTE_STATUS_OPTIONS = ["Draft", "Sent", "Approved", "Expired"] as const;
type QuoteStatusOption = (typeof QUOTE_STATUS_OPTIONS)[number];

type FormState = {
  quoteId: string;

  quoteCode: string;
  clientId: string;
  salePersonId: string;

  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactPosition: string;

  taxRate: string;
  discount: string;

  totalFeeBeforeTax: string;
  totalFeeBeforeTaxAndDiscount: string;
  totalTaxValue: string;
  totalDiscountValue: string;

  totalAmount: string;
  quoteStatus: QuoteStatusOption | "";
};

type Props = {
  open: boolean;
  mode: "create" | "update";
  initial?: QuoteDetail | null;
  onClose: () => void;

  onSubmit?: (body: QuoteFormFields | QuotesUpdateBody) => Promise<void> | void;
  submitting?: boolean;
  onSaved?: () => Promise<void> | void;
};

function toStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function isQuoteStatus(v: string): v is QuoteStatusOption {
  return (QUOTE_STATUS_OPTIONS as readonly string[]).includes(v);
}

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

export function QuoteUpsertModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  submitting,
  onSaved,
}: Props) {
  const { t } = useTranslation();

  const initialForm = useMemo<FormState>(() => {
    const cp = (initial?.contactPerson ?? null) as
      | {
          contactName?: unknown;
          contactEmail?: unknown;
          contactPhone?: unknown;
          contactPosition?: unknown;
        }
      | null;

    const qs = toStr(initial?.quoteStatus).trim();
    const safeStatus: QuoteStatusOption | "" = isQuoteStatus(qs) ? qs : "";

    return {
      quoteId: mode === "update" ? toStr(initial?.quoteId) : "",

      quoteCode: toStr(initial?.quoteCode),
      clientId: toStr(initial?.clientId),
      salePersonId: toStr(initial?.salePersonId),

      contactName: toStr(cp?.contactName),
      contactEmail: toStr(cp?.contactEmail),
      contactPhone: toStr(cp?.contactPhone),
      contactPosition: toStr(cp?.contactPosition),

      taxRate: toStr(initial?.taxRate),
      discount: toStr(initial?.discount),

      totalFeeBeforeTax: toStr(initial?.totalFeeBeforeTax),
      totalFeeBeforeTaxAndDiscount: toStr(initial?.totalFeeBeforeTaxAndDiscount),
      totalTaxValue: toStr(initial?.totalTaxValue),
      totalDiscountValue: toStr(initial?.totalDiscountValue),

      totalAmount: toStr(initial?.totalAmount),
      quoteStatus: safeStatus,
    };
  }, [initial?.clientId, initial?.contactPerson, initial?.discount, initial?.quoteCode, initial?.quoteId, initial?.quoteStatus, initial?.salePersonId, initial?.taxRate, initial?.totalAmount, initial?.totalDiscountValue, initial?.totalFeeBeforeTax, initial?.totalFeeBeforeTaxAndDiscount, initial?.totalTaxValue, mode]);

  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(initialForm);
  }, [open, initialForm]);

  const title = useMemo(
    () => (mode === "create" ? t("crm.quotes.create.title") : t("crm.quotes.update.title")),
    [mode, t]
  );

  const toContactPerson = () => {
    const hasAny =
      form.contactName || form.contactEmail || form.contactPhone || form.contactPosition;
    if (!hasAny) return null;

    return {
      contactName: form.contactName || null,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      contactPosition: form.contactPosition || null,
    };
  };

  const buildFields = (): QuoteFormFields => ({
    quoteCode: form.quoteCode || null,
    clientId: form.clientId || null,
    salePersonId: form.salePersonId || null,
  
    contactPerson: toContactPerson(),
  
    taxRate: form.taxRate || null,
    discount: form.discount || null,
  
    totalFeeBeforeTax: form.totalFeeBeforeTax || null,
    totalFeeBeforeTaxAndDiscount: form.totalFeeBeforeTaxAndDiscount || null,
    totalTaxValue: form.totalTaxValue || null,
    totalDiscountValue: form.totalDiscountValue || null,
  
    totalAmount: form.totalAmount || null,
    quoteStatus: form.quoteStatus || null,
  
    samples: null,
  });
  

  const buildUpdateBody = (): QuotesUpdateBody => ({
    entity: { type: "staff" as const },
    quoteId: form.quoteId.trim(),
    ...buildFields(),
  });
  

  async function handleSubmit() {
    if (submitting) return;
    if (!onSubmit) return;

    if (mode === "update" && !form.quoteId.trim()) return;

    const body = mode === "create" ? buildFields() : buildUpdateBody();
    await onSubmit(body);

    await onSaved?.();
    onClose();
  }

  const disableSave = submitting || (mode === "update" && !form.quoteId.trim());

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
                <SectionBox title={t("crm.quotes.form.sections.basic")} icon={<ReceiptText className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mode === "update" ? (
                      <LabeledField label={t("crm.quotes.columns.quoteId")}>
                        <Input value={form.quoteId} disabled placeholder={t("crm.quotes.placeholders.quoteId")} />
                      </LabeledField>
                    ) : null}

                    <LabeledField label={t("crm.quotes.columns.quoteCode")}>
                      <Input
                        value={form.quoteCode}
                        onChange={(e) => setForm((s) => ({ ...s, quoteCode: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.quoteCode")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.quoteStatus")}>
                      <Select
                        value={form.quoteStatus}
                        onValueChange={(v) =>
                          setForm((s) => ({ ...s, quoteStatus: (v || "") as QuoteStatusOption | "" }))
                        }
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("crm.quotes.placeholders.quoteStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          {QUOTE_STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {t(`crm.quotes.status.${s.toLowerCase()}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.clientId")}>
                      <Input
                        value={form.clientId}
                        onChange={(e) => setForm((s) => ({ ...s, clientId: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.clientId")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.salePersonId")}>
                      <Input
                        value={form.salePersonId}
                        onChange={(e) => setForm((s) => ({ ...s, salePersonId: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.salePersonId")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.totalAmount")}>
                      <Input
                        value={form.totalAmount}
                        onChange={(e) => setForm((s) => ({ ...s, totalAmount: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.totalAmount")}
                      />
                    </LabeledField>
                  </div>
                </SectionBox>

                <SectionBox title={t("crm.quotes.form.sections.contact")} icon={<User className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <LabeledField label={t("crm.quotes.columns.contactName")}>
                      <Input
                        value={form.contactName}
                        onChange={(e) => setForm((s) => ({ ...s, contactName: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.contactName")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.contactEmail")}>
                      <Input
                        value={form.contactEmail}
                        onChange={(e) => setForm((s) => ({ ...s, contactEmail: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.contactEmail")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.contactPhone")} className="md:col-span-2 space-y-1">
                      <Input
                        value={form.contactPhone}
                        onChange={(e) => setForm((s) => ({ ...s, contactPhone: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.contactPhone")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.contactPosition")} className="md:col-span-2 space-y-1">
                      <Input
                        value={form.contactPosition}
                        onChange={(e) => setForm((s) => ({ ...s, contactPosition: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.contactPosition")}
                      />
                    </LabeledField>
                  </div>
                </SectionBox>
              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                <SectionBox title={t("crm.quotes.form.sections.amounts")} icon={<FileText className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <LabeledField label={t("crm.quotes.columns.taxRate")}>
                      <Input
                        value={form.taxRate}
                        onChange={(e) => setForm((s) => ({ ...s, taxRate: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.taxRate")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.discount")}>
                      <Input
                        value={form.discount}
                        onChange={(e) => setForm((s) => ({ ...s, discount: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.discount")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.totalFeeBeforeTax")}>
                      <Input
                        value={form.totalFeeBeforeTax}
                        onChange={(e) => setForm((s) => ({ ...s, totalFeeBeforeTax: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.totalFeeBeforeTax")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.totalFeeBeforeTaxAndDiscount")}>
                      <Input
                        value={form.totalFeeBeforeTaxAndDiscount}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, totalFeeBeforeTaxAndDiscount: e.target.value }))
                        }
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.totalFeeBeforeTaxAndDiscount")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.totalTaxValue")}>
                      <Input
                        value={form.totalTaxValue}
                        onChange={(e) => setForm((s) => ({ ...s, totalTaxValue: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.totalTaxValue")}
                      />
                    </LabeledField>

                    <LabeledField label={t("crm.quotes.columns.totalDiscountValue")}>
                      <Input
                        value={form.totalDiscountValue}
                        onChange={(e) => setForm((s) => ({ ...s, totalDiscountValue: e.target.value }))}
                        disabled={submitting}
                        placeholder={t("crm.quotes.placeholders.totalDiscountValue")}
                      />
                    </LabeledField>
                  </div>
                </SectionBox>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t("common.close")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={disableSave}>
              {mode === "create" ? t("common.create") : t("common.save")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
