import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { crmKeys } from "@/api/crm/crmKeys";
import { ordersCreate } from "@/api/crm/orders";
import { OrderUpsertModal } from "@/components/crm/OrderUpsertModal";
import {
  toOrdersCreateBody,
  type OrderUpsertFormState,
} from "@/components/crm/orderUpsertMapper";

type Props = { open: boolean; onClose: () => void };

export function OrderCreateModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async (values: OrderUpsertFormState) => {
      const body = toOrdersCreateBody(values);
      return ordersCreate({ body });
    },
    onSuccess: async () => {
      toast.success(t("common.toast.saved"));
      await qc.invalidateQueries({ queryKey: crmKeys.orders.all });
      onClose();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  return (
    <OrderUpsertModal
      open={open}
      mode="create"
      onClose={onClose}
      onSubmit={(values) => mut.mutateAsync(values)}
      submitting={mut.isPending}
    />
  );
}
