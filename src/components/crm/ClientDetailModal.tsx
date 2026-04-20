import type React from "react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Building2, User, ReceiptText, ShoppingCart, FileText } from "lucide-react";
import { useClientsFull } from "@/api/crm/clients";
import { formatCurrency } from "@/utils/format";
import { OrderDetailModal } from "./OrderDetailModal";
import { QuoteDetailModal } from "./QuoteDetailModal";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import type { ClientDetail, ClientListItem } from "@/types/crm/client";

type Props = {
    open: boolean;
    onClose: () => void;
    data: ClientDetail | ClientListItem | null;
    staff?: any[];
};

function Field({ label, value, className }: { label: string; value?: React.ReactNode; className?: string }) {
    return (
        <div className={className ?? "space-y-1"}>
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-sm text-foreground break-words">{value ?? "-"}</div>
        </div>
    );
}

function SectionBox({ title, icon, right, children }: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
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

function orderStatusBadge(status: unknown, t: any) {
    const s = toStr(status).trim();
    if (!s) return null;
    const label = t(`crm.orders.orderStatus.${s}`, { defaultValue: s });
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

function paymentStatusBadge(status: unknown, t: any) {
    const s = toStr(status).trim();
    if (!s) return null;
    const label = t(`crm.orders.paymentStatus.${s}`, { defaultValue: s });
    switch (s) {
        case "Paid":
            return (
                <Badge variant="success" className="text-xs">
                    {label}
                </Badge>
            );
        case "Partial":
        case "PartiallyPaid":
        case "Partially":
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

function quoteStatusBadge(status: unknown, t: any) {
    const s = toStr(status).trim();
    if (!s) return null;
    const label = t(`crm.quotes.status.${s}`, { defaultValue: s });
    switch (s) {
        case "approved":
            return (
                <Badge variant="success" className="text-xs">
                    {label}
                </Badge>
            );
        case "sent":
            return (
                <Badge variant="warning" className="text-xs">
                    {label}
                </Badge>
            );
        case "draft":
            return (
                <Badge variant="secondary" className="text-xs">
                    {label}
                </Badge>
            );
        case "expired":
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

export function ClientDetailModal({ open, onClose, data, staff }: Props) {
    const { t } = useTranslation();

    const [viewOrderId, setViewOrderId] = useState<string | null>(null);
    const [viewQuote, setViewQuote] = useState<any | null>(null);

    const clientIdRaw = toStr(getProp(data, "clientId")).trim();
    const { data: fullData, isLoading } = useClientsFull({ query: { clientId: clientIdRaw } }, { enabled: open && !!clientIdRaw });

    const client = fullData || data;

    const invoiceInfo = useMemo(() => getProp(client, "invoiceInfo"), [client]);
    const contacts = useMemo(() => toArr(client, "clientContacts"), [client]);
    const availableByIds = useMemo(() => toArr(client, "availableByIds"), [client]);
    const availableByName = useMemo(() => toArr(client, "availableByName"), [client]);

    const orders = useMemo(() => toArr(client, "orders"), [client]);
    const quotes = useMemo(() => toArr(client, "quotes"), [client]);

    const clientId = toStr(getProp(client, "clientId")).trim();
    const clientName = toStr(getProp(client, "clientName")).trim();

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
                            <DialogPrimitive.Title className="text-lg font-semibold text-foreground truncate">{t("crm.clients.detail.title")}</DialogPrimitive.Title>

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
                        {isLoading && !fullData ? (
                            <div className="space-y-4">
                                <div className="h-40 bg-muted/40 rounded-lg animate-pulse" />
                                <div className="h-40 bg-muted/40 rounded-lg animate-pulse" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <SectionBox title={t("crm.clients.detail.sections.basic")} icon={<Building2 className="h-4 w-4" />}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Field label={t("crm.clients.columns.clientId")} value={toStrOrDash(getProp(client, "clientId"))} />
                                                <Field label={t("crm.clients.columns.clientName")} value={toStrOrDash(getProp(client, "clientName"))} />
                                                <Field label={t("crm.clients.columns.legalId")} value={toStrOrDash(getProp(client, "legalId"))} />
                                                <Field label={t("crm.clients.columns.saleScope")} value={toStrOrDash(getProp(client, "clientSaleScope"))} />
                                                <Field label={t("crm.clients.columns.phone")} value={toStrOrDash(getProp(client, "clientPhone"))} />
                                                <Field label={t("crm.clients.columns.email")} value={toStrOrDash(getProp(client, "clientEmail"))} />
                                                <Field label={t("crm.clients.columns.totalOrderAmount")} value={toStrOrDash(getProp(client, "totalOrderAmount"))} />
                                                <Field
                                                    label={t("crm.clients.columns.assignedSale", { defaultValue: "Sale phụ trách" })}
                                                    value={(() => {
                                                        const sid = toStr(getProp(client, "assignedSaleId")).trim();
                                                        if (!sid) return "-";
                                                        const s = staff?.find((x) => x.identityId === sid);
                                                        return s ? `${s.identityName} (${s.alias || s.email})` : sid;
                                                    })()}
                                                />
                                                <Field label={t("crm.clients.columns.scope", { defaultValue: "Phạm vi (Scope)" })} value={toStrOrDash(getProp(client, "clientScope"))} />
                                                <Field label={t("crm.clients.columns.address")} value={toStrOrDash(getProp(client, "clientAddress"))} className="md:col-span-2 space-y-1" />
                                            </div>
                                        </SectionBox>

                                        <SectionBox title={t("crm.clients.detail.sections.availability")}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Field label={t("crm.clients.columns.availableByIds")} value={joinArr(availableByIds)} />
                                                <Field label={t("crm.clients.columns.availableByName")} value={joinArr(availableByName)} />
                                            </div>
                                        </SectionBox>
                                    </div>

                                    {/* RIGHT */}
                                    <div className="space-y-4">
                                        <SectionBox title={t("crm.clients.detail.sections.invoiceInfo")} icon={<ReceiptText className="h-4 w-4" />}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Field label={t("crm.clients.invoice.taxCode")} value={toStrOrDash(getProp(invoiceInfo, "taxCode"))} />
                                                <Field label={t("crm.clients.invoice.taxName")} value={toStrOrDash(getProp(invoiceInfo, "taxName"))} />
                                                <Field label={t("crm.clients.invoice.taxEmail")} value={toStrOrDash(getProp(invoiceInfo, "taxEmail"))} />
                                                <Field label={t("crm.clients.invoice.taxAddress")} value={toStrOrDash(getProp(invoiceInfo, "taxAddress"))} className="md:col-span-2 space-y-1" />
                                            </div>
                                        </SectionBox>

                                        <SectionBox title={t("crm.clients.detail.sections.contacts")} icon={<User className="h-4 w-4" />}>
                                            {contacts.length === 0 ? (
                                                <div className="text-sm text-muted-foreground">{t("crm.clients.detail.noContacts")}</div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {contacts.map((c, idx) => {
                                                        const contactId = toStr(getProp(c, "contactId")).trim();
                                                        const contactName = toStr(getProp(c, "contactName")).trim();
                                                        const title = contactName || `${t("crm.clients.contact.title")} #${idx + 1}`;

                                                        return (
                                                            <div key={`${contactId || "contact"}-${idx}`} className="bg-background rounded-lg border border-border">
                                                                <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2">
                                                                    <div className="text-sm font-medium text-foreground">{title}</div>
                                                                    {contactId ? <Badge variant="secondary">{contactId}</Badge> : null}
                                                                </div>

                                                                <div className="p-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <Field label={t("crm.clients.contact.phone")} value={toStrOrDash(getProp(c, "contactPhone"))} />
                                                                        <Field label={t("crm.clients.contact.email")} value={toStrOrDash(getProp(c, "contactEmail"))} />
                                                                        <Field label={t("crm.clients.contact.position")} value={toStrOrDash(getProp(c, "contactPosition"))} />
                                                                        <Field label={t("crm.clients.contact.address")} value={toStrOrDash(getProp(c, "contactAddress"))} />
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

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <SectionBox title={t("crm.tabs.orders", { defaultValue: "Đơn hàng" })} icon={<ShoppingCart className="h-4 w-4" />}>
                                        {orders.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50 border-b border-border">
                                                        <tr>
                                                            <th className="px-2 py-2 text-left font-medium text-muted-foreground">{t("crm.orders.columns.orderId")}</th>
                                                            <th className="px-2 py-2 text-left font-medium text-muted-foreground">{t("crm.orders.columns.totalAmount")}</th>
                                                            <th className="px-2 py-2 text-left font-medium text-muted-foreground">{t("crm.orders.columns.orderStatus")}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {orders.map((o: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setViewOrderId(toStr(o.orderId))}>
                                                                <td className="px-2 py-2 font-medium">{toStrOrDash(o.orderId)}</td>
                                                                <td className="px-2 py-2">{formatCurrency(o.totalAmount)}</td>
                                                                <td className="px-2 py-2">
                                                                    <div className="flex flex-col gap-1">
                                                                        {orderStatusBadge(o.orderStatus, t)}
                                                                        {paymentStatusBadge(o.paymentStatus, t)}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </SectionBox>

                                    <SectionBox title={t("crm.tabs.quotes", { defaultValue: "Báo giá" })} icon={<FileText className="h-4 w-4" />}>
                                        {quotes.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50 border-b border-border">
                                                        <tr>
                                                            <th className="px-2 py-2 text-left font-medium text-muted-foreground">
                                                                {t("crm.quotes.columns.quoteCode", { defaultValue: "Số báo giá" })}
                                                            </th>
                                                            <th className="px-2 py-2 text-left font-medium text-muted-foreground">{t("crm.quotes.columns.totalAmount")}</th>
                                                            <th className="px-2 py-2 text-left font-medium text-muted-foreground">{t("common.status")}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {quotes.map((q: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-accent/30 transition-colors cursor-pointer" onClick={() => setViewQuote(q)}>
                                                                <td className="px-2 py-2 font-medium">{toStrOrDash(q.quoteCode || q.quoteId)}</td>
                                                                <td className="px-2 py-2">{formatCurrency(q.totalAmount)}</td>
                                                                <td className="px-2 py-2">{quoteStatusBadge(q.quoteStatus, t)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
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

            <OrderDetailModal open={!!viewOrderId} orderId={viewOrderId} onClose={() => setViewOrderId(null)} />
            <QuoteDetailModal open={!!viewQuote} data={viewQuote} onClose={() => setViewQuote(null)} />
        </DialogPrimitive.Root>
    );
}
