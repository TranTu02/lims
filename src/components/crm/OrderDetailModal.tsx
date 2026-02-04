import type React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { X, Building2, User, ReceiptText, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { crmKeys } from "@/api/crm/crmKeys";
import { ordersGetDetail } from "@/api/crm/orders";
import type { OrderDetail } from "@/types/crm/order";
import { formatDateTime } from "@/utils/format";

type Props = {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
};

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-1"}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground break-words">{value ?? "-"}</div>
    </div>
  );
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
          <div className="text-sm font-medium text-foreground truncate">
            {title}
          </div>
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function toStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function toStrOrDash(v: unknown): string {
  const s = toStr(v).trim();
  return s.length > 0 ? s : "-";
}
function toDateTimeOrDash(v: unknown): string {
  if (typeof v === "string" || v instanceof Date) return formatDateTime(v);
  return "-";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizeRequestForm(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;
    try {
      const parsed = JSON.parse(s) as unknown;
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function orderStatusLabel(
  status: unknown,
  t: (k: string, opt?: { defaultValue?: string }) => string
) {
  const s = toStr(status).trim();
  if (!s) return "-";
  return t(`crm.orders.orderStatus.${s}`, { defaultValue: s });
}

function paymentStatusLabel(
  status: unknown,
  t: (k: string, opt?: { defaultValue?: string }) => string
) {
  const s = toStr(status).trim();
  if (!s) return "-";
  return t(`crm.orders.paymentStatus.${s}`, { defaultValue: s });
}

function orderStatusBadge(
  status: unknown,
  t: (k: string, opt?: { defaultValue?: string }) => string
) {
  const s = toStr(status).trim();
  if (!s) return null;

  const label = orderStatusLabel(s, t);

  switch (s) {
    case "Completed":
      return (
        <Badge variant="success" className="text-xs">
          {label}
        </Badge>
      );
    case "Processing":
      return (
        <Badge variant="warning" className="text-xs">
          {label}
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="secondary" className="text-xs">
          {label}
        </Badge>
      );
    case "Cancelled":
      return (
        <Badge variant="destructive" className="text-xs">
          {label}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {label}
        </Badge>
      );
  }
}

function paymentStatusBadge(
  status: unknown,
  t: (k: string, opt?: { defaultValue?: string }) => string
) {
  const s = toStr(status).trim();
  if (!s) return null;

  const label = paymentStatusLabel(s, t);

  switch (s) {
    case "Paid":
      return (
        <Badge variant="success" className="text-xs">
          {label}
        </Badge>
      );
    case "Partial":
    case "PartiallyPaid":
      return (
        <Badge variant="warning" className="text-xs">
          {label}
        </Badge>
      );
    case "Unpaid":
      return (
        <Badge variant="secondary" className="text-xs">
          {label}
        </Badge>
      );
    case "Debt":
      return (
        <Badge variant="destructive" className="text-xs">
          {label}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {label}
        </Badge>
      );
  }
}

function JsonBlock({ value }: { value: unknown }) {
  if (value == null)
    return <div className="text-sm text-muted-foreground">-</div>;
  return (
    <pre className="text-xs whitespace-pre-wrap break-words bg-muted/40 border border-border rounded-md p-3">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function OrderDetailModal({ open, onClose, orderId }: Props) {
  const { t } = useTranslation();

  const q = useQuery({
    queryKey: orderId
      ? crmKeys.orders.detail(orderId)
      : ["crm", "orders", "detail", "null"],
    enabled: open && !!orderId,
    queryFn: async () => {
      if (!orderId) throw new Error("Missing orderId");
      return ordersGetDetail({ params: { orderId } }) as Promise<OrderDetail>;
    },
  });

  const headerOrderId = useMemo(
    () => toStr(q.data?.orderId).trim(),
    [q.data?.orderId]
  );

  const headerClient = useMemo(() => {
    const name = toStr(q.data?.client?.clientName).trim();
    if (name) return name;
    const id = toStr(q.data?.clientId).trim();
    return id;
  }, [q.data?.client?.clientName, q.data?.clientId]);

  const rf = useMemo(
    () => normalizeRequestForm(q.data?.requestForm),
    [q.data?.requestForm]
  );

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
                {t("crm.orders.detail.title")}
              </DialogPrimitive.Title>

              <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                {headerClient ? (
                  <span className="truncate">{headerClient}</span>
                ) : null}

                {headerOrderId ? (
                  <Badge variant="secondary" className="text-xs">
                    {headerOrderId}
                  </Badge>
                ) : null}

                {orderStatusBadge(q.data?.orderStatus, t)}
                {paymentStatusBadge(q.data?.paymentStatus, t)}
              </div>
            </div>

            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {q.isLoading ? (
              <div className="space-y-4">
                <div className="h-24 bg-muted/40 rounded-lg border border-border animate-pulse" />
                <div className="h-40 bg-muted/40 rounded-lg border border-border animate-pulse" />
                <div className="h-40 bg-muted/40 rounded-lg border border-border animate-pulse" />
              </div>
            ) : q.isError ? (
              <div className="bg-card rounded-lg border border-border p-4 space-y-3">
                <div className="text-sm text-destructive">
                  {q.error instanceof Error
                    ? q.error.message
                    : t("common.toast.loadFailed")}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => q.refetch()}>
                    {t("common.retry")}
                  </Button>
                </div>
              </div>
            ) : !q.data ? (
              <div className="text-sm text-muted-foreground">
                {t("common.empty")}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* LEFT */}
                <div className="space-y-4">
                  <SectionBox
                    title={t("crm.orders.detail.sections.basic")}
                    icon={<ReceiptText className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field
                        label={t("crm.orders.columns.orderId")}
                        value={toStrOrDash(q.data.orderId)}
                      />
                      <Field
                        label={t("crm.orders.columns.quoteId")}
                        value={toStrOrDash(q.data.quoteId)}
                      />
                      <Field
                        label={t("crm.orders.columns.clientId")}
                        value={toStrOrDash(q.data.clientId)}
                      />
                      <Field
                        label={t("crm.orders.columns.salePersonId")}
                        value={toStrOrDash(q.data.salePersonId)}
                      />
                      <Field
                        label={t("crm.orders.columns.saleCommissionPercent")}
                        value={toStrOrDash(q.data.saleCommissionPercent)}
                      />

                      <Field
                        label={t("crm.orders.columns.orderStatus")}
                        value={orderStatusBadge(q.data.orderStatus, t) ?? "-"}
                      />
                      <Field
                        label={t("crm.orders.columns.paymentStatus")}
                        value={paymentStatusBadge(q.data.paymentStatus, t) ?? "-"}
                      />

                      <Field
                        label={t("crm.orders.columns.orderUri")}
                        value={toStrOrDash(q.data.orderUri)}
                      />
                      <Field
                        label={t("crm.orders.columns.entityType")}
                        value={toStrOrDash(q.data.entity?.type)}
                      />
                    </div>
                  </SectionBox>

                  <SectionBox
                    title={t("crm.orders.detail.sections.amounts")}
                    icon={<FileText className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field
                        label={t("crm.orders.columns.totalAmount")}
                        value={toStrOrDash(q.data.totalAmount)}
                      />
                      <Field
                        label={t("crm.orders.columns.totalFeeBeforeTax")}
                        value={toStrOrDash(q.data.totalFeeBeforeTax)}
                      />
                      <Field
                        label={t("crm.orders.columns.totalFeeBeforeTaxAndDiscount")}
                        value={toStrOrDash(q.data.totalFeeBeforeTaxAndDiscount)}
                      />
                      <Field
                        label={t("crm.orders.columns.totalTaxValue")}
                        value={toStrOrDash(q.data.totalTaxValue)}
                      />
                      <Field
                        label={t("crm.orders.columns.totalDiscountValue")}
                        value={toStrOrDash(q.data.totalDiscountValue)}
                      />
                      <Field
                        label={t("crm.orders.columns.taxRate")}
                        value={toStrOrDash(q.data.taxRate)}
                      />
                      <Field
                        label={t("crm.orders.columns.discountRate")}
                        value={toStrOrDash(q.data.discountRate)}
                      />
                    </div>
                  </SectionBox>

                  <SectionBox title={t("crm.orders.detail.sections.audit")}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field
                        label={t("common.createdAt")}
                        value={toDateTimeOrDash(q.data.createdAt)}
                      />
                      <Field
                        label={t("common.createdById")}
                        value={toStrOrDash(q.data.createdById)}
                      />
                      <Field
                        label={t("common.modifiedAt")}
                        value={toDateTimeOrDash(q.data.modifiedAt)}
                      />
                      <Field
                        label={t("common.modifiedById")}
                        value={toStrOrDash(q.data.modifiedById)}
                      />
                      <Field
                        label={t("common.deletedAt")}
                        value={toDateTimeOrDash(q.data.deletedAt)}
                      />
                    </div>
                  </SectionBox>
                </div>

                {/* RIGHT */}
                <div className="space-y-4">
                  <SectionBox
                    title={t("crm.orders.detail.sections.client")}
                    icon={<Building2 className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field
                        label={t("crm.orders.columns.clientId")}
                        value={toStrOrDash(q.data.clientId)}
                      />
                      <Field
                        label={t("crm.clients.columns.clientName")}
                        value={toStrOrDash(q.data.client?.clientName)}
                      />
                      <Field
                        label={t("crm.clients.columns.clientId")}
                        value={toStrOrDash(q.data.client?.clientId)}
                      />
                    </div>
                  </SectionBox>

                  <SectionBox
                    title={t("crm.orders.detail.sections.contactPerson")}
                    icon={<User className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field
                        label={t("crm.clients.clientName")}
                        value={toStrOrDash(q.data.contactPerson?.contactName)}
                      />
                      <Field
                        label={t("crm.clients.clientEmail")}
                        value={toStrOrDash(q.data.contactPerson?.contactEmail)}
                      />
                      <Field
                        label={t("crm.clients.clientPhone")}
                        value={toStrOrDash(q.data.contactPerson?.contactPhone)}
                      />
                    </div>
                  </SectionBox>

                  <SectionBox title={t("crm.orders.detail.sections.samples")}>
                    {Array.isArray(q.data.samples) && q.data.samples.length > 0 ? (
                      <div className="space-y-3">
                        {q.data.samples.map((s, idx) => (
                          <div
                            key={idx}
                            className="bg-background rounded-lg border border-border overflow-hidden"
                          >
                            <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                              <div className="text-sm font-medium text-foreground">
                                {toStr(s.sampleName).trim() ||
                                  `${t("crm.orders.samples.sample")} #${idx + 1}`}
                              </div>
                              {s.userSampleId ? (
                                <Badge variant="secondary">
                                  {toStrOrDash(s.userSampleId)}
                                </Badge>
                              ) : null}
                            </div>

                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Field
                                  label={t("crm.orders.samples.sampleId")}
                                  value={toStrOrDash(s.sampleId)}
                                />
                                <Field
                                  label={t("crm.orders.samples.sampleTypeId")}
                                  value={toStrOrDash(s.sampleTypeId)}
                                />
                                <Field
                                  label={t("crm.orders.samples.sampleTypeName")}
                                  value={toStrOrDash(s.sampleTypeName)}
                                />
                                <Field
                                  label={t("crm.orders.samples.userSampleId")}
                                  value={toStrOrDash(s.userSampleId)}
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {t("crm.orders.samples.analyses")}
                                </div>
                                {Array.isArray(s.analyses) && s.analyses.length > 0 ? (
                                  <ul className="list-disc pl-5 text-sm">
                                    {s.analyses.map((a, aIdx) => (
                                      <li key={aIdx} className="text-foreground">
                                        {t("crm.orders.samples.matrixId")}: {toStrOrDash(a.matrixId)}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div className="text-sm text-muted-foreground">-</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                    )}
                  </SectionBox>

                  <SectionBox title={t("crm.orders.detail.sections.transactions")}>
                    {Array.isArray(q.data.transactions) && q.data.transactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                                {t("common.createdAt")}
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                                {t("common.note")}
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                                {t("crm.orders.transactions.method")}
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">
                                {t("crm.orders.transactions.amount")}
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-border">
                            {q.data.transactions.map((tx, idx) => (
                              <tr key={idx} className="hover:bg-accent/30 transition-colors">
                                <td className="px-3 py-2 text-sm">{toDateTimeOrDash(tx.date)}</td>
                                <td className="px-3 py-2 text-sm">{toStrOrDash(tx.note)}</td>
                                <td className="px-3 py-2 text-sm">{toStrOrDash(tx.method)}</td>
                                <td className="px-3 py-2 text-sm text-right">{toStrOrDash(tx.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                    )}
                  </SectionBox>

                  <SectionBox title={t("crm.orders.detail.sections.requestForm")}>
                    {rf ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field
                          label={t("crm.orders.requestForm.requestedBy")}
                          value={toStrOrDash(rf.requestedBy)}
                        />
                        <Field
                          label={t("crm.orders.requestForm.requestedAt")}
                          value={toDateTimeOrDash(rf.requestedAt)}
                        />
                        <Field
                          label={t("crm.orders.requestForm.notes")}
                          value={toStrOrDash(rf.notes)}
                          className="md:col-span-2 space-y-1"
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <JsonBlock value={q.data.requestForm ?? null} />
                      </div>
                    )}
                  </SectionBox>

                  <SectionBox title={t("crm.orders.detail.sections.reportRecipient")}>
                    <JsonBlock value={q.data.reportRecipient ?? null} />
                  </SectionBox>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
