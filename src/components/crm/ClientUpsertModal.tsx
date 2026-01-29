import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { ClientDetail, ClientListItem } from "@/types/crm/client";
import {
  emptyContact,
  joinArr,
  normalizeContacts,
  normalizeInvoice,
  type ClientUpsertFormState as FormState,
} from "@/components/crm/clientUpsertMapper";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  open: boolean;
  mode: "create" | "update";
  initial?: ClientDetail | ClientListItem | null;
  onClose: () => void;
  onSubmit?: (values: FormState) => void | Promise<unknown>;
};

function toStr(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function getErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof Error && e.message.trim().length > 0) return e.message;
  return fallback;
}

type AvailableRow = { id: string; name: string };

function splitTokens(s: string): string[] {
  return s
    .split(/[,;\n]/g)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function toAvailableRows(
  from: Pick<FormState, "availableByIds" | "availableByName">
): AvailableRow[] {
  const ids = splitTokens(from.availableByIds ?? "");
  const names = splitTokens(from.availableByName ?? "");

  const n = Math.max(ids.length, names.length, 1);
  return Array.from({ length: n }, (_, i) => ({
    id: ids[i] ?? "",
    name: names[i] ?? "",
  }));
}

function rowsToStrings(rows: AvailableRow[]): {
  availableByIds: string;
  availableByName: string;
} {
  const ids = rows.map((r) => r.id.trim()).filter((v) => v.length > 0);
  const names = rows.map((r) => r.name.trim()).filter((v) => v.length > 0);

  return {
    availableByIds: ids.join(", "),
    availableByName: names.join(", "),
  };
}

export function ClientUpsertModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useTranslation();

  const initialForm = useMemo<FormState>(() => {
    const base = initial ?? null;
    const detail = base as ClientDetail | null;

    return {
      clientId: toStr(base?.clientId ?? ""),
      clientName: toStr(base?.clientName ?? ""),
      legalId: toStr(base?.legalId ?? ""),
      clientAddress: toStr(base?.clientAddress ?? ""),
      clientPhone: toStr(base?.clientPhone ?? ""),
      clientEmail: toStr(base?.clientEmail ?? ""),
      clientSaleScope: toStr(base?.clientSaleScope ?? ""),

      availableByIds: joinArr(detail?.availableByIds),
      availableByName: joinArr(detail?.availableByName),
      invoiceInfo: normalizeInvoice(detail?.invoiceInfo),
      clientContacts: normalizeContacts(detail?.clientContacts),
    };
  }, [initial]);

  const [form, setForm] = useState<FormState>(initialForm);
  const [availableRows, setAvailableRows] = useState<AvailableRow[]>(() =>
    toAvailableRows(initialForm)
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setAvailableRows(toAvailableRows(initialForm));
    }
  }, [open, initialForm]);

  const title =
    mode === "create"
      ? t("crm.clients.create.title")
      : t("crm.clients.update.title");


  const submit = async () => {
    if (!onSubmit) return;

    setSubmitting(true);
    try {
      await onSubmit(form);

      toast.success(t("common.toast.saved")); // hoặc t("common.toast.created") tuỳ bạn
      onClose();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, t("common.toast.failed")));
    } finally {
      setSubmitting(false);
    }
  };

  const readOnlyInUpdate = mode === "update";

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
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
            </div>

            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="rounded-lg border border-border p-4 space-y-4">
                  <div className="text-sm font-medium text-foreground">
                    {t("crm.clients.sections.base.title")}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {t("crm.clients.columns.clientId")}
                      </div>
                      <Input
                        value={form.clientId}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, clientId: e.target.value }))
                        }
                        disabled={mode === "update"}
                        placeholder={t("crm.clients.placeholders.clientId")}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {t("crm.clients.columns.clientName")}
                      </div>
                      <Input
                        value={form.clientName}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            clientName: e.target.value,
                          }))
                        }
                        disabled={readOnlyInUpdate}
                        placeholder={t("crm.clients.placeholders.clientName")}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {t("crm.clients.columns.legalId")}
                      </div>
                      <Input
                        value={form.legalId}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, legalId: e.target.value }))
                        }
                        disabled={readOnlyInUpdate}
                        placeholder={t("crm.clients.placeholders.legalId")}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {t("crm.clients.columns.saleScope")}
                      </div>

                      {mode === "create" ? (
                        <Select
                          value={form.clientSaleScope || "private"}
                          onValueChange={(v) =>
                            setForm((s) => ({
                              ...s,
                              clientSaleScope: v,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                "crm.clients.placeholders.saleScope"
                              )}
                            />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="private">
                              {t("crm.clients.saleScope.private")}
                            </SelectItem>
                            <SelectItem value="public">
                              {t("crm.clients.saleScope.public")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={form.clientSaleScope}
                          onChange={(e) =>
                            setForm((s) => ({
                              ...s,
                              clientSaleScope: e.target.value,
                            }))
                          }
                          disabled={readOnlyInUpdate}
                          placeholder={t("crm.clients.placeholders.saleScope")}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {t("crm.clients.columns.phone")}
                      </div>
                      <Input
                        value={form.clientPhone}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            clientPhone: e.target.value,
                          }))
                        }
                        placeholder={t("crm.clients.placeholders.phone")}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        {t("crm.clients.columns.email")}
                      </div>
                      <Input
                        value={form.clientEmail}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            clientEmail: e.target.value,
                          }))
                        }
                        disabled={readOnlyInUpdate}
                        placeholder={t("crm.clients.placeholders.email")}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="text-xs text-muted-foreground">
                        {t("crm.clients.columns.address")}
                      </div>
                      <Input
                        value={form.clientAddress}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            clientAddress: e.target.value,
                          }))
                        }
                        disabled={readOnlyInUpdate}
                        placeholder={t("crm.clients.placeholders.address")}
                      />
                    </div>
                  </div>
                </div>

                {mode === "create" ? (
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-foreground">
                        {t("crm.clients.sections.available.title")}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const next = [...availableRows, { id: "", name: "" }];
                          setAvailableRows(next);
                          setForm((s) => ({ ...s, ...rowsToStrings(next) }));
                        }}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {t("crm.clients.sections.available.add")}
                      </Button>
                    </div>

                    {availableRows.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        {t("crm.clients.sections.available.empty")}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableRows.map((row, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium text-foreground">
                                {t("crm.clients.sections.available.itemTitle", {
                                  index: idx + 1,
                                })}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const next = availableRows.filter(
                                    (_, i) => i !== idx
                                  );
                                  setAvailableRows(next);
                                  setForm((s) => ({
                                    ...s,
                                    ...rowsToStrings(next),
                                  }));
                                }}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("common.delete")}
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">
                                  {t("crm.clients.sections.available.byIds")}
                                </div>
                                <Input
                                  value={row.id}
                                  onChange={(e) => {
                                    const next = [...availableRows];
                                    next[idx] = {
                                      ...next[idx],
                                      id: e.target.value,
                                    };
                                    setAvailableRows(next);
                                    setForm((s) => ({
                                      ...s,
                                      ...rowsToStrings(next),
                                    }));
                                  }}
                                  placeholder={t(
                                    "crm.clients.sections.available.byIdsPlaceholder"
                                  )}
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">
                                  {t("crm.clients.sections.available.byName")}
                                </div>
                                <Input
                                  value={row.name}
                                  onChange={(e) => {
                                    const next = [...availableRows];
                                    next[idx] = {
                                      ...next[idx],
                                      name: e.target.value,
                                    };
                                    setAvailableRows(next);
                                    setForm((s) => ({
                                      ...s,
                                      ...rowsToStrings(next),
                                    }));
                                  }}
                                  placeholder={t(
                                    "crm.clients.sections.available.byNamePlaceholder"
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="space-y-6">
                {mode === "create" ? (
                  <div className="rounded-lg border border-border p-4 space-y-4">
                    <div className="text-sm font-medium text-foreground">
                      {t("crm.clients.sections.invoice.title")}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {t("crm.clients.sections.invoice.taxName")}
                        </div>
                        <Input
                          value={form.invoiceInfo.taxName}
                          onChange={(e) =>
                            setForm((s) => ({
                              ...s,
                              invoiceInfo: {
                                ...s.invoiceInfo,
                                taxName: e.target.value,
                              },
                            }))
                          }
                          placeholder={t(
                            "crm.clients.sections.invoice.taxNamePlaceholder"
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {t("crm.clients.sections.invoice.taxCode")}
                        </div>
                        <Input
                          value={form.invoiceInfo.taxCode}
                          onChange={(e) =>
                            setForm((s) => ({
                              ...s,
                              invoiceInfo: {
                                ...s.invoiceInfo,
                                taxCode: e.target.value,
                              },
                            }))
                          }
                          placeholder={t(
                            "crm.clients.sections.invoice.taxCodePlaceholder"
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {t("crm.clients.sections.invoice.taxEmail")}
                        </div>
                        <Input
                          value={form.invoiceInfo.taxEmail}
                          onChange={(e) =>
                            setForm((s) => ({
                              ...s,
                              invoiceInfo: {
                                ...s.invoiceInfo,
                                taxEmail: e.target.value,
                              },
                            }))
                          }
                          placeholder={t(
                            "crm.clients.sections.invoice.taxEmailPlaceholder"
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {t("crm.clients.sections.invoice.taxAddress")}
                        </div>
                        <Input
                          value={form.invoiceInfo.taxAddress}
                          onChange={(e) =>
                            setForm((s) => ({
                              ...s,
                              invoiceInfo: {
                                ...s.invoiceInfo,
                                taxAddress: e.target.value,
                              },
                            }))
                          }
                          placeholder={t(
                            "crm.clients.sections.invoice.taxAddressPlaceholder"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Contacts */}
                <div className="rounded-lg border border-border p-4 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">
                      {t("crm.clients.sections.contacts.title")}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((s) => ({
                          ...s,
                          clientContacts: [
                            ...s.clientContacts,
                            { ...emptyContact },
                          ],
                        }))
                      }
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {t("crm.clients.sections.contacts.add")}
                    </Button>
                  </div>

                  {form.clientContacts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      {t("crm.clients.sections.contacts.empty")}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.clientContacts.map((c, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-border p-3 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-foreground">
                              {t("crm.clients.sections.contacts.itemTitle", {
                                index: idx + 1,
                              })}
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setForm((s) => ({
                                  ...s,
                                  clientContacts: s.clientContacts.filter(
                                    (_, i) => i !== idx
                                  ),
                                }))
                              }
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t("common.delete")}
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "crm.clients.sections.contacts.fields.contactId"
                                )}
                              </div>
                              <Input
                                value={c.contactId}
                                onChange={(e) =>
                                  setForm((s) => {
                                    const next = [...s.clientContacts];
                                    next[idx] = {
                                      ...next[idx],
                                      contactId: e.target.value,
                                    };
                                    return { ...s, clientContacts: next };
                                  })
                                }
                                placeholder={t(
                                  "crm.clients.sections.contacts.fields.contactIdPlaceholder"
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "crm.clients.sections.contacts.fields.contactName"
                                )}
                              </div>
                              <Input
                                value={c.contactName}
                                onChange={(e) =>
                                  setForm((s) => {
                                    const next = [...s.clientContacts];
                                    next[idx] = {
                                      ...next[idx],
                                      contactName: e.target.value,
                                    };
                                    return { ...s, clientContacts: next };
                                  })
                                }
                                placeholder={t(
                                  "crm.clients.sections.contacts.fields.contactNamePlaceholder"
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "crm.clients.sections.contacts.fields.contactPhone"
                                )}
                              </div>
                              <Input
                                value={c.contactPhone}
                                onChange={(e) =>
                                  setForm((s) => {
                                    const next = [...s.clientContacts];
                                    next[idx] = {
                                      ...next[idx],
                                      contactPhone: e.target.value,
                                    };
                                    return { ...s, clientContacts: next };
                                  })
                                }
                                placeholder={t(
                                  "crm.clients.sections.contacts.fields.contactPhonePlaceholder"
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "crm.clients.sections.contacts.fields.contactEmail"
                                )}
                              </div>
                              <Input
                                value={c.contactEmail}
                                onChange={(e) =>
                                  setForm((s) => {
                                    const next = [...s.clientContacts];
                                    next[idx] = {
                                      ...next[idx],
                                      contactEmail: e.target.value,
                                    };
                                    return { ...s, clientContacts: next };
                                  })
                                }
                                placeholder={t(
                                  "crm.clients.sections.contacts.fields.contactEmailPlaceholder"
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "crm.clients.sections.contacts.fields.contactPosition"
                                )}
                              </div>
                              <Input
                                value={c.contactPosition}
                                onChange={(e) =>
                                  setForm((s) => {
                                    const next = [...s.clientContacts];
                                    next[idx] = {
                                      ...next[idx],
                                      contactPosition: e.target.value,
                                    };
                                    return { ...s, clientContacts: next };
                                  })
                                }
                                placeholder={t(
                                  "crm.clients.sections.contacts.fields.contactPositionPlaceholder"
                                )}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "crm.clients.sections.contacts.fields.contactAddress"
                                )}
                              </div>
                              <Input
                                value={c.contactAddress}
                                onChange={(e) =>
                                  setForm((s) => {
                                    const next = [...s.clientContacts];
                                    next[idx] = {
                                      ...next[idx],
                                      contactAddress: e.target.value,
                                    };
                                    return { ...s, clientContacts: next };
                                  })
                                }
                                placeholder={t(
                                  "crm.clients.sections.contacts.fields.contactAddressPlaceholder"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={submit} disabled={submitting}>
              {mode === "create"
                ? t("common.create")
                : t("common.save")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
