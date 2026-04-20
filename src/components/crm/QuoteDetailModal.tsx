import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, User, FileText, Building2, ReceiptText } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { crmKeys } from "@/api/crm/crmKeys";
import { quotesGetFull } from "@/api/crm/quotes";
import type { QuoteDetail, QuoteListItem } from "@/types/crm/quote";
import { formatCurrency, formatDateTime, formatPercent } from "@/utils/format";

type Props = {
    open: boolean;
    onClose: () => void;
    data: QuoteDetail | QuoteListItem | null;
};

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

function quoteStatusBadge(status: unknown, t: (k: string, opt?: { defaultValue?: string }) => string) {
    const s = toStr(status).trim();
    if (!s) return null;

    const low = s.toLowerCase();
    const label = t(`crm.quotes.status.${low}`, { defaultValue: s });

    switch (low) {
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

export function QuoteDetailModal({ open, onClose, data }: Props) {
    const { t } = useTranslation();

    const quoteId = data?.quoteId ?? null;

    const q = useQuery({
        queryKey: quoteId ? crmKeys.quotes.full(quoteId) : ["crm", "quotes", "full", "null"],
        enabled: open && !!quoteId,
        retry: false,
        queryFn: async () => quotesGetFull({ params: { quoteId: quoteId as string } }),
    });

    const finalData = (q.data as any) ?? data;
    const d = finalData as any;

    const cp = useMemo(() => {
        const raw = d?.contactPerson ?? null;
        return raw as {
            contactName?: unknown;
            contactEmail?: unknown;
            contactPhone?: unknown;
            contactPosition?: unknown;
        } | null;
    }, [d]);

    const headerQuoteId = useMemo(() => toStr(d?.quoteId).trim(), [d?.quoteId]);

    const headerClient = useMemo(() => {
        const clientObj = d?.client as Record<string, unknown> | null | undefined;

        const taxName = clientObj ? toStr(clientObj["taxName"]).trim() : "";
        if (taxName) return taxName;

        const id = toStr(d?.clientId).trim();
        return id;
    }, [d]);

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
                            <DialogPrimitive.Title className="text-lg font-semibold text-foreground truncate">{t("crm.quotes.detail.title")}</DialogPrimitive.Title>

                            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                                {headerClient ? <span className="truncate">{headerClient}</span> : null}
                                {headerQuoteId ? (
                                    <Badge variant="secondary" className="text-xs">
                                        {headerQuoteId}
                                    </Badge>
                                ) : null}
                                {quoteStatusBadge(d?.quoteStatus, t)}
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
                        {q.isLoading && !q.data ? (
                            <div className="space-y-4">
                                <div className="h-24 bg-muted/40 rounded-lg border border-border animate-pulse" />
                                <div className="h-40 bg-muted/40 rounded-lg border border-border animate-pulse" />
                            </div>
                        ) : !finalData ? (
                            <div className="text-sm text-muted-foreground">{t("common.empty")}</div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* LEFT */}
                                <div className="space-y-4">
                                    <SectionBox title={t("crm.quotes.detail.sections.basic")} icon={<ReceiptText className="h-4 w-4" />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Field label={t("crm.quotes.columns.quoteId")} value={toStrOrDash(d?.quoteId)} />
                                            <Field label={t("crm.quotes.columns.quoteCode")} value={toStrOrDash(d?.quoteCode)} />
                                            <Field label={t("crm.quotes.columns.quoteStatus")} value={quoteStatusBadge(d?.quoteStatus, t) ?? "-"} />
                                            <Field label={t("crm.quotes.columns.salePerson")} value={toStrOrDash(d?.salePerson)} />
                                            <Field label={t("crm.quotes.columns.salePersonId")} value={toStrOrDash(d?.salePersonId)} />
                                            <Field label={t("crm.quotes.columns.quoteScope", { defaultValue: "Phạm vi" })} value={toStrOrDash(d?.quoteScope)} />
                                        </div>
                                    </SectionBox>

                                    <SectionBox title={t("crm.quotes.detail.sections.client")} icon={<Building2 className="h-4 w-4" />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Field label={t("crm.clients.columns.clientName")} value={toStrOrDash(d?.client?.clientName)} />
                                            <Field label={t("crm.clients.columns.clientId")} value={toStrOrDash(d?.clientId)} />
                                            <Field label={t("crm.clients.columns.clientEmail")} value={toStrOrDash(d?.client?.clientEmail)} />
                                            <Field label={t("crm.clients.columns.clientPhone")} value={toStrOrDash(d?.client?.clientPhone)} />
                                            <Field label={t("crm.clients.columns.clientAddress")} value={toStrOrDash(d?.client?.clientAddress)} className="md:col-span-2" />
                                        </div>
                                    </SectionBox>

                                    <SectionBox title={t("crm.quotes.detail.sections.contact")} icon={<User className="h-4 w-4" />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Field label={t("crm.quotes.columns.contactName")} value={toStrOrDash(cp?.contactName)} />
                                            <Field label={t("crm.quotes.columns.contactEmail")} value={toStrOrDash(cp?.contactEmail)} />
                                            <Field label={t("crm.quotes.columns.contactPhone")} value={toStrOrDash(cp?.contactPhone)} />
                                            <Field label={t("crm.quotes.columns.contactPosition")} value={toStrOrDash(cp?.contactPosition)} />
                                        </div>
                                    </SectionBox>
                                </div>

                                {/* RIGHT */}
                                <div className="space-y-4">
                                    <SectionBox title={t("crm.quotes.detail.sections.amounts")} icon={<FileText className="h-4 w-4" />}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Field label={t("crm.quotes.columns.totalFeeBeforeTax")} value={formatCurrency(d?.totalFeeBeforeTax)} />
                                            <Field label={t("crm.quotes.columns.totalFeeBeforeTaxAndDiscount")} value={formatCurrency(d?.totalFeeBeforeTaxAndDiscount)} />
                                            <Field label={t("crm.quotes.columns.totalTaxValue")} value={formatCurrency(d?.totalTaxValue)} />
                                            <Field label={t("crm.quotes.columns.totalDiscountValue")} value={formatCurrency(d?.totalDiscountValue)} />
                                            <Field label={t("crm.quotes.columns.taxRate")} value={formatPercent(d?.taxRate)} />
                                            <Field label={t("crm.quotes.columns.discount")} value={formatPercent(d?.discount)} />
                                        </div>
                                    </SectionBox>

                                    <SectionBox title={t("crm.quotes.detail.sections.audit")}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <Field label={t("common.createdAt")} value={toDateTimeOrDash(d?.createdAt)} />
                                            <Field label={t("common.createdById")} value={toStrOrDash(d?.createdBy?.identityName || d?.createdById)} />
                                            <Field label={t("common.modifiedAt")} value={toDateTimeOrDash(d?.modifiedAt)} />
                                            <Field label={t("common.modifiedById")} value={toStrOrDash(d?.modifiedBy?.identityName || d?.modifiedById)} />
                                            <Field label={t("common.deletedAt")} value={toDateTimeOrDash(d?.deletedAt)} />
                                        </div>
                                    </SectionBox>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Samples Section */}
                    {!q.isLoading && d && Array.isArray(d.samples) && d.samples.length > 0 && (
                        <div className="px-4 pb-4 border-t border-border pt-4 bg-muted/5 overflow-y-auto max-h-[50%]">
                            <SectionBox title={t("crm.quotes.detail.sections.samples", { defaultValue: "Danh sách mẫu và Chỉ tiêu" })}>
                                <div className="space-y-4">
                                    {(d.samples as any[]).map((s: any, idx) => (
                                        <div key={idx} className="bg-background rounded-lg border border-border overflow-hidden">
                                            <div className="px-4 py-3 border-b border-border flex flex-wrap items-center justify-between gap-2 bg-muted/20">
                                                <div className="text-sm font-medium text-foreground">
                                                    {toStr(s.sampleName).trim() || `${t("crm.quotes.samples.sample", { defaultValue: "Mẫu" })} #${idx + 1}`}
                                                </div>
                                                <Badge variant="outline">{toStrOrDash(s.sampleTypeName)}</Badge>
                                            </div>

                                            <div className="p-4 space-y-4">
                                                <div className="space-y-2">
                                                    <div className="text-xs font-medium text-muted-foreground">{t("crm.quotes.samples.analyses", { defaultValue: "Chỉ tiêu phân tích" })}</div>
                                                    {Array.isArray(s.analyses) && s.analyses.length > 0 ? (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="border-b border-border text-muted-foreground uppercase tracking-wider bg-muted/30">
                                                                        <th className="px-2 py-2 text-left font-medium">
                                                                            {t("crm.quotes.samples.columns.parameterName", { defaultValue: "Chỉ tiêu" })}
                                                                        </th>
                                                                        <th className="px-2 py-2 text-left font-medium">
                                                                            {t("crm.quotes.samples.columns.protocolCode", { defaultValue: "Phương pháp" })}
                                                                        </th>
                                                                        <th className="px-2 py-2 text-right font-medium">{t("crm.quotes.samples.columns.unitPrice", { defaultValue: "Đơn giá" })}</th>
                                                                        <th className="px-2 py-2 text-right font-medium">{t("crm.quotes.samples.columns.discount", { defaultValue: "CK (%)" })}</th>
                                                                        <th className="px-2 py-2 text-right font-medium">{t("crm.quotes.samples.columns.taxValue", { defaultValue: "Thuế" })}</th>
                                                                        <th className="px-2 py-2 text-right font-medium">{t("crm.quotes.samples.columns.total", { defaultValue: "Thành tiền" })}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border">
                                                                    {s.analyses.map((a: any, aIdx: number) => (
                                                                        <tr key={aIdx} className="hover:bg-accent/20 transition-colors">
                                                                            <td className="px-2 py-2 font-medium">{toStrOrDash(a.parameterName)}</td>
                                                                            <td className="px-2 py-2">
                                                                                <div className="max-w-[200px] truncate" title={toStr(a.protocolCode)}>
                                                                                    {toStrOrDash(a.protocolCode)}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-2 py-2 text-right font-mono">{formatCurrency(a.unitPrice)}</td>
                                                                            <td className="px-2 py-2 text-right text-muted-foreground">{a.discountRate > 0 ? `${a.discountRate}%` : "-"}</td>
                                                                            <td className="px-2 py-2 text-right text-muted-foreground font-mono">
                                                                                {a.tax > 0 ? formatCurrency(a.tax) : "-"}
                                                                                {a.taxRate ? <span className="text-[10px] ml-1">({a.taxRate}%)</span> : null}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-right font-bold font-mono">{formatCurrency(a.feeBeforeTax)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">-</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SectionBox>
                        </div>
                    )}

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
