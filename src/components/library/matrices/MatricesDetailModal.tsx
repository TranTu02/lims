import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useMatrixDetail } from "@/api/library";
import { formatNumberVi, safeText } from "./matrixFormat";

type Props = {
  open: boolean;
  matrixId: string | null;
  onClose: () => void;
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
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="text-sm text-foreground break-words">{props.value}</div>
    </div>
  );
}

function SectionTitle(props: { children: React.ReactNode }) {
  return <div className="text-sm font-semibold text-foreground">{props.children}</div>;
}

export function MatricesDetailModal(props: Props) {
  const { t } = useTranslation();
  const { open, matrixId, onClose } = props;

  const q = useMatrixDetail({ params: { matrixId: matrixId ?? "" } });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg border border-border w-full max-w-3xl shadow-xl">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-base font-semibold text-foreground">
              {t("library.matrices.detail.title")}
            </div>
            <div className="text-xs text-muted-foreground">{matrixId ?? ""}</div>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            {t("common.close")}
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">{t("common.loading")}</div>
          ) : null}

          {q.isError ? (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {t("common.errorTitle")}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t("library.matrices.errors.loadFailed")}
                </div>
              </div>
            </div>
          ) : null}

          {!q.isLoading && !q.isError && q.data ? (
            (() => {
              const m = q.data;

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

              const turnaroundText =
                m.turnaroundTime === null || m.turnaroundTime === undefined
                  ? t("common.noData")
                  : String(m.turnaroundTime);

              const tgText = safeText(m.technicianGroupId).trim() || t("common.noData");

              const createdAtText = formatIsoDate(m.createdAt) ?? t("common.noData");

              const createdByName = safeText(m.createdBy?.identityName).trim();

              const acc = m.protocolAccreditation ?? {};
              const hasAcc = Boolean(acc.VILAS) || Boolean(acc.TDC);

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label={t("library.matrices.matrixId")} value={m.matrixId} />
                    <Field label={t("library.matrices.sampleTypeId")} value={sampleTypeLabel} />
                    <Field label={t("library.matrices.parameterName")} value={parameterLabel} />
                    <Field label={t("library.matrices.protocolCode")} value={protocolLabel} />
                    <Field label={t("library.matrices.protocolSource")} value={protocolSource} />
                    <Field
                      label={t("library.matrices.protocolAccreditation")}
                      value={
                        hasAcc ? (
                          <div className="flex items-center justify-start gap-2">
                            {acc.VILAS ? <Badge variant="secondary">VILAS</Badge> : null}
                            {acc.TDC ? <Badge variant="secondary">TDC</Badge> : null}
                          </div>
                        ) : (
                          t("common.noData")
                        )
                      }
                    />
                  </div>

                  <div className="border-t border-border" />

                  <div className="space-y-3">
                    <SectionTitle>{t("library.matrices.detail.pricing")}</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label={t("library.matrices.feeBeforeTax")} value={feeBeforeTaxText} />
                      <Field label={t("library.matrices.taxRate")} value={taxRateText} />
                      <Field label={t("library.matrices.feeAfterTax")} value={feeAfterTaxText} />
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  <div className="space-y-3">
                    <SectionTitle>{t("library.matrices.detail.limits")}</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="LOD" value={lodText} />
                      <Field label="LOQ" value={loqText} />
                      <Field label={t("library.matrices.thresholdLimit")} value={thresholdText} />
                      <Field label={t("library.matrices.turnaroundTime")} value={turnaroundText} />
                      <Field label={t("library.matrices.technicianGroupId")} value={tgText} />
                    </div>
                  </div>

                  <div className="border-t border-border" />

                  <div className="space-y-3">
                    <SectionTitle>{t("library.matrices.detail.information")}</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label={t("common.createdAt")} value={createdAtText} />
                      <Field label={t("common.createdById")} value={createdByName} />
                    </div>
                  </div>
                </>
              );
            })()
          ) : null}
        </div>
      </div>
    </div>
  );
}
