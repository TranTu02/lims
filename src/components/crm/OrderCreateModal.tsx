import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { crmKeys } from "@/api/crm/crmKeys";
import { ordersCreate } from "@/api/crm/orders";
import { OrderUpsertModal } from "@/components/crm/OrderUpsertModal";
import type { OrdersCreateBody } from "@/types/crm/order";

type Props = { open: boolean; onClose: () => void };

export function OrderCreateModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (body: OrdersCreateBody) => ordersCreate({ body }),
    onSuccess: async (res) => {
      if (!res.success) throw new Error(res.error?.message ?? "Create failed");
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.orders.all });
      onClose();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    },
  });

  return (
    <OrderUpsertModal
      open={open}
      mode="create"
      onClose={onClose}
      onSubmit={(values) => mut.mutateAsync(values as OrdersCreateBody)}
    />
  );
}
