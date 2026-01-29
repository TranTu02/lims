import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { OrderDetail, OrderListItem } from "@/types/crm/order";

type Props = {
  open: boolean;
  onClose: () => void;
  data: OrderDetail | OrderListItem | null;
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground wrap-break-word">{value ?? "-"}</div>
    </div>
  );
}

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

export function OrderDetailModal({ open, onClose, data }: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("crm.orders.detail.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("crm.orders.columns.orderId")} value={getStr(data, "orderId")} />
          <Field label={t("crm.orders.columns.quoteId")} value={getStr(data, "quoteId")} />
          <Field label={t("crm.orders.columns.clientId")} value={getStr(data, "clientId")} />
          <Field label={t("crm.orders.columns.totalAmount")} value={getStr(data, "totalAmount")} />
          <Field label={t("crm.orders.columns.orderStatus")} value={getStr(data, "orderStatus")} />
          <Field label={t("crm.orders.columns.paymentStatus")} value={getStr(data, "paymentStatus")} />
          <Field label={t("common.createdAt")} value={getStr(data, "createdAt")} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
