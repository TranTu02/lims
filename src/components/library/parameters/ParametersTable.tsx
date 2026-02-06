import { useTranslation } from "react-i18next";
import type { ParameterWithMatrices } from "../hooks/useLibraryData";

type Props = {
  items: ParameterWithMatrices[];
  selectedId: string | null;
  onSelect: (p: ParameterWithMatrices) => void;
};

export function ParametersTable(props: Props) {
  const { t } = useTranslation();
  const { items, selectedId, onSelect } = props;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameters.parameterId")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameters.parameterName")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameters.technicianAlias")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameters.displayStyle")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
              {t("library.parameters.columns.matrixCount")}
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {items.map((param) => {
            const active = selectedId === param.parameterId;
            const unit = param.displayStyleResolved.unit ?? t("common.noData");

            return (
              <tr
                key={param.parameterId}
                onClick={() => onSelect(param)}
                className={`hover:bg-muted/50 cursor-pointer ${active ? "bg-muted" : ""}`}
              >
                <td className="px-4 py-3 text-sm text-foreground font-medium">
                  {param.parameterId}
                </td>

                <td className="px-4 py-3 text-sm text-foreground">
                  <div>{param.parameterName}</div>
                  <div className="text-xs text-muted-foreground">{param.parameterNameEnResolved}</div>
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {param.technicianAlias?.trim().length ? param.technicianAlias : t("common.noData")}
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">
                  <div className="text-md">{unit}</div>
                </td>

                <td className="px-4 py-3 text-sm text-muted-foreground">{param.matrices.length}</td>
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
