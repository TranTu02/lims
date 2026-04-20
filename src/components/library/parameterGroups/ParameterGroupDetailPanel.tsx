import { AlertCircle, X, Pencil, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParameterGroupFull } from "@/api/library";

type Props = {
    groupId: string | null;
    onClose: () => void;
    onEdit?: (groupId: string) => void;
};

function formatIsoDate(value: string | null | undefined): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("vi-VN");
}

function Field(props: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{props.label}</div>
            <div className="text-sm text-foreground break-words font-medium">{props.value}</div>
        </div>
    );
}

function SectionTitle(props: { children: React.ReactNode }) {
    return <div className="text-sm font-semibold text-foreground pt-4 border-t border-border mt-4 mb-3">{props.children}</div>;
}

export function ParameterGroupDetailPanel(props: Props) {
    const { t, i18n } = useTranslation();
    const { groupId, onClose, onEdit } = props;

    const q = useParameterGroupFull(groupId ?? "");

    const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

    if (!groupId) return null;

    return (
        <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px] shadow-sm">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{String(t("library.parameterGroups.detail.title", { defaultValue: "Chi tiết gói kiểm" }))}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{groupId}</p>
                </div>

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(groupId)} type="button" title={String(t("common.edit"))}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {q.isLoading ? <div className="text-sm text-muted-foreground">{String(t("common.loading"))}</div> : null}

                {q.isError ? (
                    <div className="flex items-start gap-3 bg-red-50/50 p-3 rounded-md border border-red-100 dark:border-red-900/30 dark:bg-red-900/10">
                        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                        <div>
                            <div className="text-sm font-medium text-destructive">{String(t("common.errorTitle"))}</div>
                            <div className="text-xs text-destructive/80 mt-1">{String(t("library.parameterGroups.errors.loadFailed"))}</div>
                        </div>
                    </div>
                ) : null}

                {!q.isLoading && !q.isError && q.data ? (
                    <div className="space-y-0 relative">
                        <div className="grid grid-cols-1 gap-4">
                            <Field label={String(t("library.parameterGroups.groupName"))} value={q.data.groupName} />
                            <Field label={String(t("library.parameterGroups.sampleType"))} value={q.data.sampleTypeName || q.data.sampleTypeId} />

                            {q.data.groupNote && <Field label={String(t("library.parameterGroups.create.groupNote"))} value={q.data.groupNote} />}
                        </div>

                        <SectionTitle>{String(t("library.parameterGroups.create.matrices", { defaultValue: "Danh sách chỉ tiêu / Ma trận" }))}</SectionTitle>
                        <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                            <div className="divide-y divide-border">
                                {q.data.matrices?.map((m: any) => (
                                    <div key={m.matrixId} className="p-3 bg-background/50 hover:bg-background transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-foreground truncate">{m.parameterName || m.parameterId}</div>
                                                <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 font-normal">
                                                        {m.matrixId}
                                                    </Badge>
                                                    <span className="truncate">{m.protocolCode || m.protocolId}</span>
                                                </div>
                                            </div>
                                            <div className="text-sm font-semibold text-primary tabular-nums shrink-0">{new Intl.NumberFormat(locale).format(Number(m.feeBeforeTax || 0))}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <SectionTitle>{String(t("library.parameterGroups.create.pricing"))}</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <Field label={String(t("library.parameterGroups.feeBeforeTaxAndDiscount"))} value={new Intl.NumberFormat(locale).format(Number(q.data.feeBeforeTaxAndDiscount || 0))} />
                            <Field label={String(t("library.parameterGroups.discountRate"))} value={`${q.data.discountRate || 0}%`} />
                            <Field label={String(t("library.parameterGroups.feeBeforeTax"))} value={new Intl.NumberFormat(locale).format(Number(q.data.feeBeforeTax || 0))} />
                            <Field label={String(t("library.parameterGroups.taxRate"))} value={`${q.data.taxRate || 0}%`} />
                            <div className="col-span-2 pt-2">
                                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 flex items-center justify-between">
                                    <span className="text-sm font-semibold text-foreground">{String(t("library.parameterGroups.feeAfterTax"))}</span>
                                    <span className="text-lg font-bold text-primary tabular-nums">
                                        {new Intl.NumberFormat(locale, { style: "currency", currency: "VND" }).format(Number(q.data.feeAfterTax || 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <SectionTitle>{String(t("common.createdAt"))}</SectionTitle>
                        <div className="grid grid-cols-2 gap-4 mt-3 pb-3">
                            <Field label={String(t("common.createdAt"))} value={formatIsoDate(q.data.createdAt) ?? "-"} />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
