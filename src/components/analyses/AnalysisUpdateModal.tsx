import * as DialogPrimitive from "@radix-ui/react-dialog";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Save, X } from "lucide-react";

import type { ApiResponse } from "@/api/client";
import { samplesGetList } from "@/api/samples";
import { useMatricesList } from "@/api/library";
import type { Matrix } from "@/api/library";
import type { SampleListItem } from "@/types/sample";
import type {
  AnalysisListItem,
  AnalysisResultStatusDb,
  AnalysisStatusDb,
} from "@/types/analysis";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SearchableSelect, type Option } from "@/components/common/SearchableSelect";

type FormValue = {
  sampleId: string;
  matrixId: string | null;
  parameterId: string | null;
  parameterName: string | null;
  analysisStatus: AnalysisStatusDb;
  analysisResult: string | null;
  analysisResultStatus: AnalysisResultStatusDb | null;
  analysisCompletedAt: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  submitting: boolean;
  target: AnalysisListItem | null;
  onSubmit: (v: FormValue) => void;
};

const STATUS_OPTIONS: AnalysisStatusDb[] = [
  "Pending",
  "Testing",
  "DataEntered",
  "TechReview",
  "Approved",
  "ReTest",
  "Complained",
  "Cancelled",
];

const RESULT_STATUS_OPTIONS: AnalysisResultStatusDb[] = [
  "Pass",
  "Fail",
  "NotEvaluated",
];

function getAnalysisStatusLabelKey(
  s: AnalysisStatusDb,
): `lab.analyses.status.${AnalysisStatusDb}` {
  return `lab.analyses.status.${s}`;
}

function getAnalysisResultStatusLabelKey(
  s: AnalysisResultStatusDb,
): `lab.analyses.resultStatus.${AnalysisResultStatusDb}` {
  return `lab.analyses.resultStatus.${s}`;
}

function toIsoMidnightZ(dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

function isoToDateOnly(iso: string): string {
  return iso.split("T")[0] ?? "";
}

function toNullIfBlank(s: string): string | null {
  const v = s.trim();
  return v.length ? v : null;
}

function assertSuccess<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new Error(res.error?.message ?? "Unknown API error");
  return res.data as T;
}

function ensureSelectedOption(
  options: Option[],
  selectedValue: string,
  makeOption: (v: string) => Option,
): Option[] {
  const v = selectedValue.trim();
  if (!v) return options;
  if (options.some((o) => o.value === v)) return options;
  return [makeOption(v), ...options];
}

function getSampleIdSafe(s: SampleListItem): string | null {
  const maybe = s as unknown as { sampleId?: unknown };
  return typeof maybe.sampleId === "string" && maybe.sampleId.trim().length
    ? maybe.sampleId
    : null;
}

function getSampleReceiptIdSafe(s: SampleListItem): string | null {
  const maybe = s as unknown as { receiptId?: unknown };
  return typeof maybe.receiptId === "string" && maybe.receiptId.trim().length
    ? maybe.receiptId
    : null;
}

export function AnalysisUpdateModal({
  open,
  onClose,
  submitting,
  target,
  onSubmit,
}: Props) {
  const { t } = useTranslation();

  const qSamples = useQuery({
    queryKey: ["samples", "list", "analysisUpdate"],
    enabled: open,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      assertSuccess(await samplesGetList({ query: { page: 1, itemsPerPage: 200 } })),
  });

  const qMatrices = useMatricesList(
    { query: { page: 1, itemsPerPage: 200 } },
    { enabled: open },
  );

  const samples = qSamples.data ?? [];
  const matrices = qMatrices.data?.data ?? [];

  const [sampleId, setSampleId] = useState<string>("");
  const [matrixId, setMatrixId] = useState<string>("");

  const [parameterId, setParameterId] = useState<string>("");
  const [parameterName, setParameterName] = useState<string>("");

  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatusDb>("Pending");
  const [analysisResultStatus, setAnalysisResultStatus] = useState<
    AnalysisResultStatusDb | ""
  >("NotEvaluated");

  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [analysisCompletedAtDate, setAnalysisCompletedAtDate] = useState<string>("");

  const [resetKey, setResetKey] = useState<number>(0);

  const canSubmit = Boolean(target?.analysisId) && sampleId.trim().length > 0;

  function applyMatrixIfReady(id: string) {
    const m = matrices.find((x) => x.matrixId === id);
    if (!m) return;
    setParameterId(m.parameterId ?? "");
    setParameterName(m.parameterName ?? "");
  }

  useEffect(() => {
    if (!open || !target) return;

    setSampleId(target.sampleId ?? "");

    const mId = target.matrixId ?? "";
    setMatrixId(mId);

    setParameterId(target.parameterId ?? "");
    setParameterName(target.parameterName ?? "");

    setAnalysisStatus((String(target.analysisStatus) as AnalysisStatusDb) || "Pending");

    setAnalysisResultStatus(
      target.analysisResultStatus
        ? (String(target.analysisResultStatus) as AnalysisResultStatusDb)
        : "",
    );

    setAnalysisResult(target.analysisResult == null ? "" : String(target.analysisResult));

    setAnalysisCompletedAtDate(
      target.analysisCompletedAt ? isoToDateOnly(String(target.analysisCompletedAt)) : "",
    );
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    if (!matrixId) return;
    if (!matrices.length) return;

    applyMatrixIfReady(matrixId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, matrixId, matrices]);

  const readyOptions =
    open &&
    !!target &&
    !qSamples.isLoading &&
    !qSamples.isError &&
    !qMatrices.isLoading &&
    !qMatrices.isError;

  useEffect(() => {
    if (!readyOptions) return;
    setResetKey((k) => k + 1);
  }, [readyOptions]);

  function isOption(v: Option | null): v is Option {
    return v !== null;
  }
  const sampleOptions: Option[] = useMemo(() => {
    const base = samples
      .map((s): Option | null => {
        const id = getSampleIdSafe(s);
        if (!id) return null;
  
        const receiptId = getSampleReceiptIdSafe(s) ?? "";
        return { value: id, label: id, keywords: receiptId };
      })
      .filter(isOption);
  
    return ensureSelectedOption(base, sampleId, (v) => ({ value: v, label: v }));
  }, [samples, sampleId]);
  
  const matrixOptions: Option[] = useMemo(() => {
    const base: Option[] = matrices.map((m: Matrix) => {
      const label =
        `${m.matrixId}` +
        (m.parameterName ? ` - ${m.parameterName}` : "") +
        (m.protocolCode ? ` (${m.protocolCode})` : "");

      const keywords = `${m.parameterId ?? ""} ${m.parameterName ?? ""} ${m.protocolCode ?? ""}`.trim();

      return { value: m.matrixId, label, keywords };
    });

    return ensureSelectedOption(base, matrixId, (v) => ({ value: v, label: v }));
  }, [matrices, matrixId]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50" />

        <DialogPrimitive.Content className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-card rounded-lg shadow-xl z-50 border border-border">
          <div className="p-6 border-b border-border flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-xl font-semibold text-foreground">
                {t("common.edit")} {t("lab.analyses.analysisId")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                {target?.analysisId ?? "-"}
              </DialogPrimitive.Description>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={String(t("common.close"))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("lab.analyses.sampleId")}</Label>
              <SearchableSelect
                resetKey={resetKey}
                value={sampleId || null}
                options={sampleOptions}
                placeholder={
                  qSamples.isLoading
                    ? t("common.loading")
                    : qSamples.isError
                      ? t("common.error")
                      : t("common.select")
                }
                searchPlaceholder={t("common.search")}
                loading={qSamples.isLoading}
                error={qSamples.isError}
                disabled={!open || qSamples.isLoading || qSamples.isError}
                onChange={(v) => setSampleId(v ?? "")}
                listMaxHeightClassName="max-h-72"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("lab.analyses.matrixId")}</Label>
              <SearchableSelect
                resetKey={resetKey}
                value={matrixId || null}
                options={matrixOptions}
                placeholder={
                  qMatrices.isLoading
                    ? t("common.loading")
                    : qMatrices.isError
                      ? t("common.error")
                      : t("common.select")
                }
                searchPlaceholder={t("common.search")}
                loading={qMatrices.isLoading}
                error={qMatrices.isError}
                disabled={!open || qMatrices.isLoading || qMatrices.isError}
                onChange={(v) => {
                  const id = v ?? "";
                  setMatrixId(id);

                  if (!id) {
                    setParameterId("");
                    setParameterName("");
                    return;
                  }
                  if (matrices.length) applyMatrixIfReady(id);
                }}
                listMaxHeightClassName="max-h-72"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("lab.analyses.parameterId")}</Label>
              <Input
                value={parameterId}
                readOnly
                className="bg-muted"
                placeholder={t("common.select")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("lab.analyses.parameterName")}</Label>
              <Input
                value={parameterName}
                readOnly
                className="bg-muted"
                placeholder={t("common.select")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("lab.analyses.analysisStatus")}</Label>
              <Select
                value={analysisStatus}
                onValueChange={(v) => setAnalysisStatus(v as AnalysisStatusDb)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(getAnalysisStatusLabelKey(s))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("lab.analyses.analysisResultStatus")}</Label>
              <Select
                value={analysisResultStatus}
                onValueChange={(v) => setAnalysisResultStatus(v as AnalysisResultStatusDb | "")}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(getAnalysisResultStatusLabelKey(s))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("lab.analyses.analysisResult")}</Label>
              <Input
                value={analysisResult}
                onChange={(e) => setAnalysisResult(e.target.value)}
                className="bg-background"
                placeholder={t("common.placeholder.enterValue")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("lab.analyses.analysisCompletedAt")}</Label>
              <Input
                type="date"
                value={analysisCompletedAtDate}
                onChange={(e) => setAnalysisCompletedAtDate(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="p-6 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>

            <Button
              disabled={!canSubmit || submitting}
              onClick={() => {
                const completedAt =
                  analysisCompletedAtDate.trim().length > 0
                    ? toIsoMidnightZ(analysisCompletedAtDate.trim())
                    : null;

                onSubmit({
                  sampleId: sampleId.trim(),
                  matrixId: toNullIfBlank(matrixId),
                  parameterId: toNullIfBlank(parameterId),
                  parameterName: toNullIfBlank(parameterName),
                  analysisStatus,
                  analysisResult: toNullIfBlank(analysisResult),
                  analysisResultStatus: analysisResultStatus === "" ? null : analysisResultStatus,
                  analysisCompletedAt: completedAt,
                });
              }}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {t("common.save")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
