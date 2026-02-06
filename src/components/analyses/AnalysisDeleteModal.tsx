import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { AnalysisListItem } from "@/types/analysis";

type Props = {
  open: boolean;
  onClose: () => void;
  submitting: boolean;
  target: AnalysisListItem | null;
  onConfirm: () => void;
};

export function AnalysisDeleteModal({
  open,
  onClose,
  submitting,
  target,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <DialogPrimitive.Content className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-lg mx-auto bg-card rounded-lg shadow-xl z-50 border border-border">
          <div className="p-6 border-b border-border flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-xl font-semibold text-foreground">
                {t("common.delete")} {t("lab.analyses.analysisId")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                {target?.analysisId ?? "-"}
              </DialogPrimitive.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={t("common.close")}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 text-sm text-muted-foreground">
            {t("common.confirmDelete")}
          </div>

          <div className="p-6 border-t border-border flex items-center justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!target || submitting}
              onClick={onConfirm}
              className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              {t("common.delete")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
