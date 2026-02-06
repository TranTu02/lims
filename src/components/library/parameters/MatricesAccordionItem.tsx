import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, FileText, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { type Matrix, useDeleteMatrix, useUpdateMatrix } from "@/api/library";

type Props = {
  matrix: Matrix;
  expanded: boolean;
  onToggle: () => void;
  onSelectProtocolCode: (protocolId: string) => void;
};

type EditState = {
  feeBeforeTax: string;
  feeAfterTax: string;
  turnaroundTime: string;
};

function toNumberOrNull(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function MatricesAccordionItem(props: Props) {
  const { t } = useTranslation();
  const { matrix, expanded, onToggle, onSelectProtocolCode } = props;

  const updateM = useUpdateMatrix();
  const deleteM = useDeleteMatrix();

  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<EditState>(() => ({
    feeBeforeTax: String(matrix.feeBeforeTax ?? ""),
    feeAfterTax: String(matrix.feeAfterTax ?? ""),
    turnaroundTime: matrix.turnaroundTime != null ? String(matrix.turnaroundTime) : "",
  }));

  const canSave = useMemo(() => {
    const feeBeforeTax = toNumberOrNull(edit.feeBeforeTax);
    const feeAfterTax = toNumberOrNull(edit.feeAfterTax);
    const turnaround =
      edit.turnaroundTime.trim().length ? toNumberOrNull(edit.turnaroundTime) : 0;

    if (feeBeforeTax == null || feeBeforeTax < 0) return false;
    if (feeAfterTax == null || feeAfterTax < 0) return false;

    if (edit.turnaroundTime.trim().length) {
      if (turnaround == null || turnaround < 0) return false;
    }

    return true;
  }, [edit]);

  const onCancel = () => {
    setEditing(false);
    setEdit({
      feeBeforeTax: String(matrix.feeBeforeTax ?? ""),
      feeAfterTax: String(matrix.feeAfterTax ?? ""),
      turnaroundTime: matrix.turnaroundTime != null ? String(matrix.turnaroundTime) : "",
    });
  };

  const onSave = async () => {
    const feeBeforeTax = toNumberOrNull(edit.feeBeforeTax);
    const feeAfterTax = toNumberOrNull(edit.feeAfterTax);
    const turnaroundTime =
      edit.turnaroundTime.trim().length ? toNumberOrNull(edit.turnaroundTime) : null;

    if (feeBeforeTax == null || feeAfterTax == null) return;
    if (turnaroundTime === null && edit.turnaroundTime.trim().length) return;

    await updateM.mutateAsync({
      params: { matrixId: matrix.matrixId },
      patch: {
        feeBeforeTax,
        feeAfterTax,
        turnaroundTime,
      },
    });

    setEditing(false);
  };

  const onDelete = async () => {
    await deleteM.mutateAsync({ params: { matrixId: matrix.matrixId } });
  };

  const feeAfterTaxNumber = useMemo(() => Number(matrix.feeAfterTax), [matrix.feeAfterTax]);
  const feeBeforeTaxNumber = useMemo(() => Number(matrix.feeBeforeTax), [matrix.feeBeforeTax]);

  const headerTitle = matrix.sampleTypeName ?? matrix.sampleTypeId ?? t("common.noData");

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between"
        type="button"
      >
        <div className="text-left">
          <div className="text-sm font-medium text-foreground">{headerTitle}</div>
          <div className="text-xs text-muted-foreground">
            {t("library.parameters.detail.matrixCode")}: {matrix.matrixId}
          </div>
        </div>

        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded ? (
        <div className="px-3 py-3 space-y-3 bg-background border-t border-border">
          {!editing ? (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">{t("library.parameters.detail.feeBeforeTax")}</div>
                  <div className="font-medium text-foreground">
                    {Number.isFinite(feeBeforeTaxNumber) ? feeBeforeTaxNumber.toLocaleString("vi-VN") : "-"}
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("library.parameters.detail.feeAfterTax")}</div>
                  <div className="font-medium text-foreground">
                    {Number.isFinite(feeAfterTaxNumber) ? feeAfterTaxNumber.toLocaleString("vi-VN") : "-"}
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("library.protocols.protocolId")}</div>
                  <div className="font-medium text-foreground">{matrix.protocolId ?? "-"}</div>
                </div>

                <div>
                  <div className="text-muted-foreground">{t("library.matrices.turnaroundTime")}</div>
                  <div className="font-medium text-foreground">{matrix.turnaroundTime ?? "-"}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectProtocolCode(matrix.protocolId)}
                  className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                  type="button"
                  disabled={!matrix.protocolId}
                >
                  <FileText className="h-3 w-3" />
                  {matrix.protocolId ?? t("common.noData")}
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    type="button"
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    {t("common.edit")}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void onDelete()}
                    disabled={deleteM.isPending}
                    type="button"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{t("library.parameters.detail.feeBeforeTax")}</div>
                  <Input
                    value={edit.feeBeforeTax}
                    onChange={(e) => setEdit((s) => ({ ...s, feeBeforeTax: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{t("library.parameters.detail.feeAfterTax")}</div>
                  <Input
                    value={edit.feeAfterTax}
                    onChange={(e) => setEdit((s) => ({ ...s, feeAfterTax: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">{t("library.matrices.turnaroundTime")}</div>
                  <Input
                    value={edit.turnaroundTime}
                    onChange={(e) => setEdit((s) => ({ ...s, turnaroundTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={onCancel} type="button">
                  {t("common.cancel")}
                </Button>
                <Button onClick={() => void onSave()} disabled={!canSave || updateM.isPending} type="button">
                  {updateM.isPending ? t("common.saving") : t("common.save")}
                </Button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
