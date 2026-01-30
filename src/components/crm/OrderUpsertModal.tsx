import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { OrderDetail } from "@/types/crm/order";

type FormState = {
  orderId: string;
  quoteId: string;
  clientId: string;
  totalAmount: string;
  orderStatus: string;
  paymentStatus: string;
};

type Props = {
  open: boolean;
  mode: "create" | "update";
  initial?: OrderDetail | null;
  onClose: () => void;
  onSubmit?: (values: FormState) => void | Promise<unknown>;
};

function toStr(v: unknown) {
    return typeof v === "string" ? v : v == null ? "" : String(v);
  }
  
  function getProp(obj: unknown, key: string): unknown {
    if (obj && typeof obj === "object") {
      const rec = obj as Record<string, unknown>;
      return rec[key];
    }
    return undefined;
  }
  
  function getStr(obj: unknown, key: string): string {
    return toStr(getProp(obj, key));
  }

export function OrderUpsertModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const { t } = useTranslation();

  const initialForm = useMemo<FormState>(
    () => ({
      orderId: getStr(initial, "orderId"),
      quoteId: getStr(initial, "quoteId"),
      clientId: getStr(initial, "clientId"),
      totalAmount: getStr(initial, "totalAmount"),
      orderStatus: getStr(initial, "orderStatus"),
      paymentStatus: getStr(initial, "paymentStatus"),
    }),
    [initial],
  );
  

  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(initialForm);
  }, [open, initialForm]);

  if (!open) return null;

  const title = mode === "create" ? t("crm.orders.create.title") : t("crm.orders.update.title");

  const submit = async () => {
    try {
      setSubmitting(true);
      await onSubmit?.(form);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.orders.columns.orderId")}</div>
            <Input
              value={form.orderId}
              onChange={(e) => setForm((s) => ({ ...s, orderId: e.target.value }))}
              disabled={mode === "update"}
              placeholder={t("crm.orders.placeholders.orderId")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.orders.columns.quoteId")}</div>
            <Input
              value={form.quoteId}
              onChange={(e) => setForm((s) => ({ ...s, quoteId: e.target.value }))}
              placeholder={t("crm.orders.placeholders.quoteId")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.orders.columns.clientId")}</div>
            <Input
              value={form.clientId}
              onChange={(e) => setForm((s) => ({ ...s, clientId: e.target.value }))}
              placeholder={t("crm.orders.placeholders.clientId")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.orders.columns.totalAmount")}</div>
            <Input
              value={form.totalAmount}
              onChange={(e) => setForm((s) => ({ ...s, totalAmount: e.target.value }))}
              placeholder={t("crm.orders.placeholders.totalAmount")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.orders.columns.orderStatus")}</div>
            <Input
              value={form.orderStatus}
              onChange={(e) => setForm((s) => ({ ...s, orderStatus: e.target.value }))}
              placeholder={t("crm.orders.placeholders.orderStatus")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.orders.columns.paymentStatus")}</div>
            <Input
              value={form.paymentStatus}
              onChange={(e) => setForm((s) => ({ ...s, paymentStatus: e.target.value }))}
              placeholder={t("crm.orders.placeholders.paymentStatus")}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={submitting}>
            {mode === "create" ? t("common.actions.create") : t("common.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
