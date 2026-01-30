import { useTranslation } from "react-i18next";
import { Eye, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Matrix } from "@/api/library";
import { formatNumberVi } from "./matrixFormat";

type Props = {
  items: Matrix[];
  selectedId: string | null;
  onSelect: (id: string) => void;

  onOpenDetail: (id: string) => void;
  onOpenEdit: (id: string) => void;
  onOpenDelete: (id: string) => void;
};

export function MatricesTable(props: Props) {
  const { t } = useTranslation();
  const { items, selectedId, onSelect, onOpenDetail, onOpenEdit, onOpenDelete } = props;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.matrices.matrixId")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.matrices.parameterId")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.matrices.protocolId")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.matrices.sampleTypeId")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.matrices.feeAfterTax")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("common.actions")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((m) => {
            const active = selectedId === m.matrixId;

            const parameterLabel =
              m.parameterName && m.parameterName.trim() ? m.parameterName : m.parameterId;

            const protocolLabel =
              m.protocolCode && m.protocolCode.trim() ? m.protocolCode : m.protocolId;

            const sampleTypeLabel =
              m.sampleTypeName && m.sampleTypeName.trim() ? m.sampleTypeName : m.sampleTypeId;

            const feeAfterTaxText = formatNumberVi(m.feeAfterTax) ?? t("common.noData");

            return (
              <tr
                key={m.matrixId}
                onClick={() => onSelect(m.matrixId)}
                className={`hover:bg-muted/50 cursor-pointer ${active ? "bg-muted" : ""}`}
              >
                <td className="px-4 py-3 text-sm text-foreground font-medium">{m.matrixId}</td>
                <td className="px-4 py-3 text-sm text-foreground">{parameterLabel}</td>
                <td className="px-4 py-3 text-sm text-foreground">{protocolLabel}</td>
                <td className="px-4 py-3 text-sm text-foreground">{sampleTypeLabel}</td>
                <td className="px-4 py-3 text-sm text-foreground">{feeAfterTaxText}</td>

                <td className="px-1 py-3 text-left">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={t("common.view")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(m.matrixId);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={t("common.edit")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEdit(m.matrixId);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      aria-label={t("common.delete")}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDelete(m.matrixId);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {items.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">{t("common.noData")}</div>
      ) : null}
    </div>
  );
}
