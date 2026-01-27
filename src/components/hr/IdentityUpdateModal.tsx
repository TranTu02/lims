import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { pickRoles, roleKeys, type RoleKey } from "@/utils/roles";
import {
  identitiesGetDetail,
  identitiesKeys,
  identitiesUpdate,
  type IdentityStatus,
  type IdentityUpdateBody,
} from "@/api/identities";
import { unwrapOrThrow } from "@/utils/api";

type Props = {
  open: boolean;
  identityId: string | null;
  onClose: () => void;
};

type FormState = {
  identityName: string;
  identityStatus: IdentityStatus;
  roles: Record<RoleKey, boolean>;
  permissionsJson: string;
};

function defaultForm(): FormState {
  const roles = {} as Record<RoleKey, boolean>;
  roleKeys.forEach((k) => (roles[k] = false));
  return {
    identityName: "",
    identityStatus: "active",
    roles,
    permissionsJson: "{}",
  };
}

export function IdentityUpdateModal({ open, identityId, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const detailQ = useQuery({
    queryKey: identityId
      ? identitiesKeys.detail(identityId)
      : ["identities", "detail", "null"],
    enabled: open && Boolean(identityId),
    queryFn: async () => {
      if (!identityId) throw new Error("Missing identityId");
      return unwrapOrThrow(
        await identitiesGetDetail({ query: { identityId } })
      );
    },
  });

  const [form, setForm] = useState<FormState>(() => defaultForm());

  useEffect(() => {
    if (!detailQ.data) return;

    const data = detailQ.data;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      identityName: data.identityName ?? "",
      identityStatus: data.identityStatus ?? "active",
      roles: pickRoles(data.roles ?? {}, roleKeys),
      permissionsJson: JSON.stringify(data.permissions ?? {}, null, 2),
    });
  }, [detailQ.data]);

  const canSubmit = useMemo(() => {
    return Boolean(identityId) && form.identityName.trim().length > 0;
  }, [form.identityName, identityId]);

  const updateM = useMutation({
    mutationFn: async (body: IdentityUpdateBody) =>
      unwrapOrThrow(await identitiesUpdate({ body })),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: identitiesKeys.all });
      if (identityId) {
        await qc.invalidateQueries({
          queryKey: identitiesKeys.detail(identityId),
        });
      }
      toast.success(t("hr.update.toastSuccess"));
      onClose();
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    },
  });

  const submit = () => {
    if (!identityId || !canSubmit) return;

    let permissions: Record<string, unknown> | undefined = undefined;
    try {
      permissions = JSON.parse(form.permissionsJson) as Record<string, unknown>;
    } catch {
      toast.error(t("hr.permissions.invalidJson"));
      return;
    }

    const body: IdentityUpdateBody = {
      identityId,
      identityName: form.identityName.trim(),
      identityStatus: form.identityStatus,
      roles: { ...form.roles },
      permissions,
    };

    updateM.mutate(body);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("hr.update.title")}</DialogTitle>
        </DialogHeader>

        {detailQ.isLoading ? (
          <div className="text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : detailQ.isError ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-destructive">{t("common.error")}</div>
            <Button variant="outline" onClick={() => detailQ.refetch()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : !detailQ.data ? (
          <div className="text-sm text-muted-foreground">
            {t("common.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <div className="text-xs text-muted-foreground">
                {t("hr.fields.name")}
              </div>
              <Input
                value={form.identityName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, identityName: e.target.value }))
                }
                placeholder={t("hr.fields.name")}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                {t("hr.fields.status")}
              </div>
              <Select
                value={form.identityStatus}
                onValueChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    identityStatus: v as IdentityStatus,
                  }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder={t("hr.fields.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    {t("hr.status.active")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {t("hr.status.inactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2 border border-border rounded-lg p-3 bg-muted/20">
              <div className="text-sm font-medium text-foreground mb-2">
                {t("hr.fields.roles")}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {roleKeys.map((k) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.roles[k]}
                      onCheckedChange={(checked) =>
                        setForm((s) => ({
                          ...s,
                          roles: { ...s.roles, [k]: Boolean(checked) },
                        }))
                      }
                    />
                    <span className="text-foreground">
                      {t(`hr.roles.${k}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={updateM.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit || updateM.isPending}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
