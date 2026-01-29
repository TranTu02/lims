import { FileText, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

type Props = {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function RowActionIcons({ onView, onEdit, onDelete, disabled }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onView}
        disabled={disabled}
        aria-label={t("common.actions.view")}
        title={t("common.actions.view")}
      >
        <FileText className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={onEdit}
        disabled={disabled}
        aria-label={t("common.actions.edit")}
        title={t("common.actions.edit")}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-destructive hover:text-destructive"
        onClick={onDelete}
        disabled={disabled}
        aria-label={t("common.delete")}
        title={t("common.delete")}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
