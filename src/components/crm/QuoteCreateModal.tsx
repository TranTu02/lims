import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { crmKeys } from "@/api/crm/crmKeys";
import { quotesCreate, quotesUpdate } from "@/api/crm/quotes";
import { QuoteUpsertModal } from "@/components/crm/QuoteUpsertModal";
import type { QuotesCreateBody, QuotesUpdateBody } from "@/types/crm/quote";
import type { ApiResponse } from "@/api/library";

type Props = { open: boolean; onClose: () => void };

function unwrapOrThrow<T>(res: ApiResponse<T>): T {
  if (!res.success) throw new Error(res.error?.message ?? "Request failed");
  if (res.data == null) throw new Error("Request succeeded but missing data");
  return res.data;
}

export function QuoteCreateModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async (body: QuotesCreateBody) => {
      const seed =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    
      const quoteId = `QUO-${seed}`;
    
      const createdRes = await quotesCreate({
        body: {
          entity: body.entity,
          quoteId,
        } as QuotesCreateBody,
      });
    
      const created = unwrapOrThrow(createdRes);
    
      const finalQuoteId = created.quoteId || quoteId;
    
      const updateRes = await quotesUpdate({
        body: {
          ...body,
          quoteId: finalQuoteId,
        } as QuotesUpdateBody,
      });
    
      return unwrapOrThrow(updateRes);
    },
    
    onSuccess: async () => {
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
      submitting={mut.isPending}
      onSubmit={async (body) => {
        await mut.mutateAsync(body as QuotesCreateBody);
      }}
      
    />
  );
}
