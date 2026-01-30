import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { crmKeys } from "@/api/crm/crmKeys";
import { quotesCreate } from "@/api/crm/quotes";
import { QuoteUpsertModal } from "@/components/crm/QuoteUpsertModal";
import type { QuotesCreateBody } from "@/types/crm/quote";

type Props = { open: boolean; onClose: () => void };

export function QuoteCreateModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (body: QuotesCreateBody) => quotesCreate({ body }),
    onSuccess: async (res) => {
      if (!res.success) throw new Error(res.error?.message ?? "Create failed");
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.quotes.all });
      onClose();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    },
  });

  return (
    <QuoteUpsertModal
      open={open}
      mode="create"
      onClose={onClose}
      onSubmit={async (values) => {
        await mut.mutateAsync(values);
      }}
    />
  );
}
