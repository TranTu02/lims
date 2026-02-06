import { useTranslation } from "react-i18next";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  quoteId: string | null;
  onClose: () => void;
  onConfirm?: (quoteId: string) => Promise<void> | void;
  submitting?: boolean;
};

export function QuoteDeleteModal({ open, quoteId, onClose, onConfirm, submitting }: Props) {
  const { t } = useTranslation();
  const [localSubmitting, setLocalSubmitting] = useState(false);

  if (!open) return null;

  const busy = Boolean(submitting) || localSubmitting;

  const confirm = async () => {
    if (!quoteId) return;
    try {
      setLocalSubmitting(true);
      await onConfirm?.(quoteId);
      onClose();
    } finally {
      setLocalSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("crm.quotes.delete.title")}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">
          {t("crm.quotes.delete.description")}{" "}
          <span className="text-foreground font-medium">{quoteId ?? "-"}</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={busy}>
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
