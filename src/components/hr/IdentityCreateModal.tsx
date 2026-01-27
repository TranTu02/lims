import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  identitiesCreate,
  identitiesKeys,
  type IdentityCreateBody,
  type IdentityStatus,
} from "@/api/identities";
import { roleKeys, type RoleKey } from "@/utils/roles";
import { unwrapOrThrow } from "@/utils/api";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  email: string;
  identityName: string;
  alias: string;
  password: string;
  identityStatus: IdentityStatus;
  roles: Record<RoleKey, boolean>;
  permissionsJson: string;
};

function makeDefaultRoles(): Record<RoleKey, boolean> {
  const out = {} as Record<RoleKey, boolean>;
  roleKeys.forEach((k) => {
    out[k] = false;
  });
  return out;
}

export function IdentityCreateModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [form, setForm] = useState<FormState>(() => ({
    email: "",
    identityName: "",
    alias: "",
    password: "",
    identityStatus: "active",
    roles: makeDefaultRoles(),
    permissionsJson: "{}",
  }));

  const canSubmit = useMemo(() => {
    return (
      form.email.trim().length > 0 &&
      form.identityName.trim().length > 0 &&
      form.alias.trim().length > 0 &&
      form.password.trim().length > 0
    );
  }, [form.alias, form.email, form.identityName, form.password]);

  const createM = useMutation({
    mutationFn: async (body: IdentityCreateBody) =>
      unwrapOrThrow(await identitiesCreate({ body })),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: identitiesKeys.all });
      toast.success(t("hr.create.toastSuccess"));
      onClose();
      setForm({
        email: "",
        identityName: "",
        alias: "",
        password: "",
        identityStatus: "active",
        roles: makeDefaultRoles(),
        permissionsJson: "{}",
      });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : t("common.error"));
    },
  });

  const submit = () => {
    if (!canSubmit) return;

    let permissions: Record<string, unknown> = {};
    try {
      permissions = JSON.parse(form.permissionsJson) as Record<string, unknown>;
    } catch {
      toast.error(t("hr.permissions.invalidJson"));
      return;
    }

    const body: IdentityCreateBody = {
      email: form.email.trim(),
      identityName: form.identityName.trim(),
      alias: form.alias.trim(),
      password: form.password,
      roles: { ...form.roles },
      permissions,
      identityStatus: form.identityStatus,
    };

    createM.mutate(body);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("hr.create.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {t("hr.fields.email")}
            </div>
            <Input
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
              placeholder={t("hr.fields.email")}
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {t("hr.fields.alias")}
            </div>
            <Input
              value={form.alias}
              onChange={(e) =>
                setForm((s) => ({ ...s, alias: e.target.value }))
              }
              placeholder={t("hr.fields.alias")}
            />
          </div>

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
              {t("hr.fields.password")}
            </div>
            <Input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((s) => ({ ...s, password: e.target.value }))
              }
              placeholder={t("hr.fields.password")}
            />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {t("hr.fields.status")}
            </div>
            <Select
              value={form.identityStatus}
              onValueChange={(v) =>
                setForm((s) => ({ ...s, identityStatus: v as IdentityStatus }))
              }>
              <SelectTrigger>
                <SelectValue placeholder={t("hr.fields.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("hr.status.active")}</SelectItem>
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
                  <span className="text-foreground">{t(`hr.roles.${k}`)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createM.isPending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit || createM.isPending}>
            {t("common.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
