import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { clientsCreate } from "@/api/crm/clients";
import { crmKeys } from "@/api/crm/crmKeys";
import { ClientUpsertModal } from "@/components/crm/ClientUpsertModal";
import {
  toClientCreateBody,
  type ClientUpsertFormState,
} from "@/components/crm/clientUpsertMapper";

type Props = { open: boolean; onClose: () => void };

export function ClientCreateModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: (body: ReturnType<typeof toClientCreateBody>) =>
      clientsCreate({ body }),
  });

  return (
    <ClientUpsertModal
      open={open}
      mode="create"
      onClose={onClose}
      onSubmit={async (values: ClientUpsertFormState) => {
        const body = toClientCreateBody(values);

        await mut.mutateAsync(body);
        toast.success(t("common.toast.saved"));

        await qc.invalidateQueries({ queryKey: crmKeys.clients.all });
        onClose();
      }}
    />
  );
}
