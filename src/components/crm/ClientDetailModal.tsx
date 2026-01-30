import type React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Building2, User, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { ClientDetail, ClientListItem } from "@/types/crm/client";

type Props = {
  open: boolean;
  onClose: () => void;
  data: ClientDetail | ClientListItem | null;
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

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getProp(obj: unknown, key: string): unknown {
  return isRecord(obj) ? obj[key] : undefined;
}
function toStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function toStrOrDash(v: unknown): string {
  const s = toStr(v).trim();
  return s.length > 0 ? s : "-";
}
function toArr(obj: unknown, key: string): unknown[] {
  const v = getProp(obj, key);
  return Array.isArray(v) ? v : [];
}
function joinArr(arr: unknown[]): string {
  const items = arr.map((v) => toStr(v).trim()).filter(Boolean);
  return items.length ? items.join(", ") : "-";
}

export function ClientDetailModal({ open, onClose, data }: Props) {
  const { t } = useTranslation();

  const invoiceInfo = useMemo(() => getProp(data, "invoiceInfo"), [data]);
  const contacts = useMemo(() => toArr(data, "clientContacts"), [data]);
  const availableByIds = useMemo(() => toArr(data, "availableByIds"), [data]);
  const availableByName = useMemo(() => toArr(data, "availableByName"), [data]);

  const clientId = toStr(getProp(data, "clientId")).trim();
  const clientName = toStr(getProp(data, "clientName")).trim();

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
                {t("crm.clients.detail.title")}
              </DialogPrimitive.Title>

              <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                {clientName ? <span className="truncate">{clientName}</span> : null}
                {clientId ? (
                  <Badge variant="secondary" className="text-xs">
                    {clientId}
                  </Badge>
                ) : null}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <SectionBox
                  title={t("crm.clients.detail.sections.basic")}
                  icon={<Building2 className="h-4 w-4" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field
                      label={t("crm.clients.columns.clientId")}
                      value={toStrOrDash(getProp(data, "clientId"))}
                    />
                    <Field
                      label={t("crm.clients.columns.clientName")}
                      value={toStrOrDash(getProp(data, "clientName"))}
                    />
                    <Field
                      label={t("crm.clients.columns.legalId")}
                      value={toStrOrDash(getProp(data, "legalId"))}
                    />
                    <Field
                      label={t("crm.clients.columns.saleScope")}
                      value={toStrOrDash(getProp(data, "clientSaleScope"))}
                    />
                    <Field
                      label={t("crm.clients.columns.phone")}
                      value={toStrOrDash(getProp(data, "clientPhone"))}
                    />
                    <Field
                      label={t("crm.clients.columns.email")}
                      value={toStrOrDash(getProp(data, "clientEmail"))}
                    />
                    <Field
                      label={t("crm.clients.columns.totalOrderAmount")}
                      value={toStrOrDash(getProp(data, "totalOrderAmount"))}
                    />
                    <Field
                      label={t("crm.clients.columns.address")}
                      value={toStrOrDash(getProp(data, "clientAddress"))}
                      className="md:col-span-2 space-y-1"
                    />
                  </div>
                </SectionBox>

                <SectionBox title={t("crm.clients.detail.sections.availability")}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field
                      label={t("crm.clients.columns.availableByIds")}
                      value={joinArr(availableByIds)}
                    />
                    <Field
                      label={t("crm.clients.columns.availableByName")}
                      value={joinArr(availableByName)}
                    />
                  </div>
                </SectionBox>
              </div>

              {/* RIGHT */}
              <div className="space-y-4">
                <SectionBox
                  title={t("crm.clients.detail.sections.invoiceInfo")}
                  icon={<ReceiptText className="h-4 w-4" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field
                      label={t("crm.clients.invoice.taxCode")}
                      value={toStrOrDash(getProp(invoiceInfo, "taxCode"))}
                    />
                    <Field
                      label={t("crm.clients.invoice.taxName")}
                      value={toStrOrDash(getProp(invoiceInfo, "taxName"))}
                    />
                    <Field
                      label={t("crm.clients.invoice.taxEmail")}
                      value={toStrOrDash(getProp(invoiceInfo, "taxEmail"))}
                    />
                    <Field
                      label={t("crm.clients.invoice.taxAddress")}
                      value={toStrOrDash(getProp(invoiceInfo, "taxAddress"))}
                      className="md:col-span-2 space-y-1"
                    />
                  </div>
                </SectionBox>

                <SectionBox
                  title={t("crm.clients.detail.sections.contacts")}
                  icon={<User className="h-4 w-4" />}
                >
                  {contacts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {t("crm.clients.detail.noContacts")}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contacts.map((c, idx) => {
                        const contactId = toStr(getProp(c, "contactId")).trim();
                        const contactName = toStr(getProp(c, "contactName")).trim();
                        const title =
                          contactName ||
                          `${t("crm.clients.contact.title")} #${idx + 1}`;

                        return (
                          <div
                            key={`${contactId || "contact"}-${idx}`}
                            className="bg-background rounded-lg border border-border"
                          >
                            <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                              <div className="text-sm font-medium text-foreground">
                                {title}
                              </div>
                              {contactId ? (
                                <Badge variant="secondary">{contactId}</Badge>
                              ) : null}
                            </div>

                            <div className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field
                                  label={t("crm.clients.contact.phone")}
                                  value={toStrOrDash(getProp(c, "contactPhone"))}
                                />
                                <Field
                                  label={t("crm.clients.contact.email")}
                                  value={toStrOrDash(getProp(c, "contactEmail"))}
                                />
                                <Field
                                  label={t("crm.clients.contact.position")}
                                  value={toStrOrDash(getProp(c, "contactPosition"))}
                                />
                                <Field
                                  label={t("crm.clients.contact.address")}
                                  value={toStrOrDash(getProp(c, "contactAddress"))}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionBox>
              </div>
            </div>
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
