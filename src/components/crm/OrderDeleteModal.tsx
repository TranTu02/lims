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
  orderId: string | null;
  onClose: () => void;
  onConfirm?: (orderId: string) => Promise<void> | void;
  submitting?: boolean;
};

export function OrderDeleteModal({ open, orderId, onClose, onConfirm, submitting }: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  const confirm = async () => {
    if (!orderId) return;
    await onConfirm?.(orderId);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("crm.orders.delete.title")}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">
          {t("crm.orders.delete.description")}{" "}
          <span className="text-foreground font-medium">{orderId ?? "-"}</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={Boolean(submitting)}>
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={Boolean(submitting)}
          >
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
