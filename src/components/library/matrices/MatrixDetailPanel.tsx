import { AlertCircle, X, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useMatrixDetail } from "@/api/library";
import { formatNumberVi, safeText } from "./matrixFormat";

type Props = {
    matrixId: string | null;
    onClose: () => void;
    onEdit?: (matrixId: string) => void;
};

function formatPercent(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return null;
    return `${n}%`;
}

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
    return <div className="text-sm font-semibold text-foreground pt-4 border-t border-border mt-4">{props.children}</div>;
}

export function MatrixDetailPanel(props: Props) {
    const { t } = useTranslation();
    const { matrixId, onClose, onEdit } = props;

    const q = useMatrixDetail({ params: { matrixId: matrixId ?? "" } });

    if (!matrixId) return null;

    return (
        <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border overflow-y-auto max-h-[calc(100vh-140px)] sticky top-[72px]">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-start justify-between z-10">
                <div>
                    <h2 className="text-base font-semibold text-foreground">{String(t("library.matrices.detail.title"))}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{matrixId}</p>
                </div>

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(matrixId)} type="button" title={String(t("common.edit"))}>
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
                            <div className="text-xs text-destructive/80 mt-1">{String(t("library.matrices.errors.loadFailed"))}</div>
                        </div>
                    </div>
                ) : null}

                {!q.isLoading && !q.isError && q.data
                    ? (() => {
                          const m = q.data as any; // any to avoid complex type errors if 'createdBy' is not strongly typed

                          const parameterLabel = safeText(m.parameterName).trim() || m.parameterId;
                          const protocolLabel = safeText(m.protocolCode).trim() || m.protocolId;
                          const sampleTypeLabel = safeText(m.sampleTypeName).trim() || m.sampleTypeId;

                          const protocolSource = safeText(m.protocolSource).trim() || t("common.noData");

                          const feeBeforeTaxText = formatNumberVi(m.feeBeforeTax) ?? t("common.noData");
                          const feeAfterTaxText = formatNumberVi(m.feeAfterTax) ?? t("common.noData");
                          const taxRateText = formatPercent(m.taxRate) ?? t("common.noData");

                          const lodText = safeText(m.LOD).trim() || t("common.noData");
                          const loqText = safeText(m.LOQ).trim() || t("common.noData");
                          const thresholdText = safeText(m.thresholdLimit).trim() || t("common.noData");

                          const turnaroundText = m.turnaroundTime === null || m.turnaroundTime === undefined ? t("common.noData") : String(m.turnaroundTime);

                          const tgText = safeText(m.technicianGroupId).trim() || t("common.noData");

                          const createdAtText = formatIsoDate(m.createdAt) ?? t("common.noData");

                          const createdByName = safeText(m.createdBy?.identityName).trim() || t("common.noData");

                          const acc = m.protocolAccreditation ?? {};
                          const hasAcc = Boolean(acc.VILAS) || Boolean(acc.TDC);

                          return (
                              <div className="space-y-0 relative">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="col-span-1 md:col-span-2">
                                          <Field label={String(t("library.matrices.parameterName"))} value={parameterLabel} />
                                      </div>
                                      <div className="col-span-1 md:col-span-2">
                                          <Field label={String(t("library.matrices.sampleTypeId"))} value={sampleTypeLabel} />
                                      </div>
                                      <div className="col-span-1 md:col-span-2">
                                          <Field label={String(t("library.matrices.protocolCode"))} value={protocolLabel} />
                                      </div>
                                      <div className="col-span-1 md:col-span-2">
                                          <Field label={String(t("library.matrices.protocolSource"))} value={protocolSource} />
                                      </div>
                                      <div className="col-span-1 md:col-span-2">
                                          <Field
                                              label={String(t("library.matrices.protocolAccreditation"))}
                                              value={
                                                  hasAcc ? (
                                                      <div className="flex items-center justify-start gap-1.5 mt-1">
                                                          {acc.VILAS ? <Badge variant="secondary">VILAS</Badge> : null}
                                                          {acc.TDC ? <Badge variant="secondary">TDC</Badge> : null}
                                                      </div>
                                                  ) : (
                                                      <Badge variant="outline" className="font-normal mt-1 text-muted-foreground">
                                                          {String(t("common.noData"))}
                                                      </Badge>
                                                  )
                                              }
                                          />
                                      </div>
                                  </div>

                                  <SectionTitle>{String(t("library.matrices.detail.pricing"))}</SectionTitle>
                                  <div className="grid grid-cols-2 gap-4 mt-3">
                                      <Field label={String(t("library.matrices.feeBeforeTax"))} value={feeBeforeTaxText} />
                                      <Field label={String(t("library.matrices.taxRate"))} value={taxRateText} />
                                      <div className="col-span-1 md:col-span-2">
                                          <Field label={String(t("library.matrices.feeAfterTax"))} value={<span className="text-primary font-bold">{feeAfterTaxText}</span>} />
                                      </div>
                                  </div>

                                  <SectionTitle>{String(t("library.matrices.detail.limits"))}</SectionTitle>
                                  <div className="grid grid-cols-2 gap-4 mt-3">
                                      <Field label="LOD" value={lodText} />
                                      <Field label="LOQ" value={loqText} />
                                      <Field label={String(t("library.matrices.thresholdLimit"))} value={thresholdText} />
                                      <Field label={String(t("library.matrices.turnaroundTime"))} value={turnaroundText} />
                                      <div className="col-span-1 md:col-span-2">
                                          <Field label={String(t("library.matrices.technicianGroupId"))} value={tgText} />
                                      </div>
                                  </div>

                                  <SectionTitle>{String(t("library.matrices.detail.information"))}</SectionTitle>
                                  <div className="grid grid-cols-2 gap-4 mt-3 pb-3">
                                      <Field label={String(t("common.createdAt"))} value={createdAtText} />
                                      <Field label={String(t("common.createdById"))} value={createdByName} />
                                  </div>
                              </div>
                          );
                      })()
                    : null}
            </div>
        </div>
    );
}
