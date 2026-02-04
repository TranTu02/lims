import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertCircle, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { receiptsDelete } from "@/api/receipts";

import type { ReceiptsDeleteBody } from "@/types/receipt";

type Props = {
  open: boolean;
  receiptId: string | null;
  onClose: () => void;

  onDeleted?: () => void;
};

function toDeleteBody(receiptId: string): ReceiptsDeleteBody {
  return { receiptId } as ReceiptsDeleteBody;
}

export function ReceiptDeleteModal({ open, receiptId, onClose, onDeleted }: Props) {
  const { t } = useTranslation();

  const safeId = useMemo(() => receiptId?.trim() ?? "", [receiptId]);
  const canSubmit = safeId.length > 0;

  const [submitting, setSubmitting] = useState(false);

  async function handleDelete() {
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);

      const res = await receiptsDelete({ body: toDeleteBody(safeId) });
      if (!res.success) throw new Error(res.error?.message ?? "Request failed");

      toast.success(t("common.toast.deleteSuccess"));
      onDeleted?.();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("common.toast.requestFailed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />

        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                {t("reception.receipts.delete.title")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {t("reception.receipts.delete.description")}
              </DialogPrimitive.Description>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={onClose}
              disabled={submitting}
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 rounded-lg border border-border bg-background p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  {t("reception.receipts.delete.confirmLabel")}
                </div>

                <div className="text-sm text-muted-foreground">
                  {t("reception.receipts.delete.receiptIdLabel")}:{" "}
                  <span className="font-mono text-foreground">{safeId || "--"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t("common.cancel")}
            </Button>

            <Button
              type="button"
              variant="destructive"
              className="flex items-center gap-2"
              disabled={!canSubmit || submitting}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="h-4 w-4" />
              {t("common.delete")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
