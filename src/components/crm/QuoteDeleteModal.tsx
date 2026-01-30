import { useState } from "react";
import { useTranslation } from "react-i18next";

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
};

export function QuoteDeleteModal({ open, quoteId, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const confirm = async () => {
    if (!quoteId) return;
    try {
      setSubmitting(true);
      await onConfirm?.(quoteId);
      onClose();
    } finally {
      setSubmitting(false);
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
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={submitting}>
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
