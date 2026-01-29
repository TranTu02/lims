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

import type { QuoteDetail } from "@/types/crm/quote";

type FormState = {
  quoteId: string;
  quoteCode: string;
  clientId: string;
  totalAmount: string;
  quoteStatus: string;
};

type Props = {
  open: boolean;
  mode: "create" | "update";
  initial?: QuoteDetail | null;
  onClose: () => void;
  onSubmit?: (values: FormState) => Promise<void> | void;
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

export function QuoteUpsertModal({ open, mode, initial, onClose, onSubmit }: Props) {
  const { t } = useTranslation();

  const initialForm = useMemo<FormState>(
    () => ({
      quoteId: getStr(initial, "quoteId"),
      quoteCode: getStr(initial, "quoteCode"),
      clientId: getStr(initial, "clientId"),
      totalAmount: getStr(initial, "totalAmount"),
      quoteStatus: getStr(initial, "quoteStatus"),
    }),
    [initial],
  );
  

  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(initialForm);
  }, [open, initialForm]);

  if (!open) return null;

  const title = mode === "create" ? t("crm.quotes.create.title") : t("crm.quotes.update.title");

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
            <div className="text-xs text-muted-foreground">{t("crm.quotes.columns.quoteId")}</div>
            <Input
              value={form.quoteId}
              onChange={(e) => setForm((s) => ({ ...s, quoteId: e.target.value }))}
              disabled={mode === "update"}
              placeholder={t("crm.quotes.placeholders.quoteId")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.quotes.columns.quoteCode")}</div>
            <Input
              value={form.quoteCode}
              onChange={(e) => setForm((s) => ({ ...s, quoteCode: e.target.value }))}
              placeholder={t("crm.quotes.placeholders.quoteCode")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.quotes.columns.clientId")}</div>
            <Input
              value={form.clientId}
              onChange={(e) => setForm((s) => ({ ...s, clientId: e.target.value }))}
              placeholder={t("crm.quotes.placeholders.clientId")}
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{t("crm.quotes.columns.totalAmount")}</div>
            <Input
              value={form.totalAmount}
              onChange={(e) => setForm((s) => ({ ...s, totalAmount: e.target.value }))}
              placeholder={t("crm.quotes.placeholders.totalAmount")}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="text-xs text-muted-foreground">{t("crm.quotes.columns.quoteStatus")}</div>
            <Input
              value={form.quoteStatus}
              onChange={(e) => setForm((s) => ({ ...s, quoteStatus: e.target.value }))}
              placeholder={t("crm.quotes.placeholders.quoteStatus")}
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
