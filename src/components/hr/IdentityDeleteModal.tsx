import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { unwrapOrThrow } from "@/utils/api";
import { identitiesDelete, identitiesKeys } from "@/api/identities";

type Props = {
  open: boolean;
  identityId: string | null;
  onClose: () => void;
  onDeleted?: (identityId: string) => void;
};

export function IdentityDeleteModal({ open, identityId, onClose, onDeleted }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const delM = useMutation({
    mutationFn: async (id: string) => unwrapOrThrow(await identitiesDelete({ body: { identityId: id } })),
    onSuccess: async (_data, id) => {
      await qc.invalidateQueries({ queryKey: identitiesKeys.all });
      toast.success(t("hr.delete.toastSuccess"));
      onDeleted?.(id);
      onClose();
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("hr.delete.title")}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">
          {t("hr.delete.description")}{" "}
          <span className="text-foreground font-medium">{identityId ?? "-"}</span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={delM.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!identityId) return;
              delM.mutate(identityId);
            }}
            disabled={!identityId || delM.isPending}
          >
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
