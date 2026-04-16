import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Lock, LockOpen, AlertCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
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

import { IdentityDocumentManager } from "./IdentityDocumentManager";
import { IdentityGroupSelect } from "./IdentityGroupSelect";
import type { PickerItem } from "@/components/shared/SearchSelectPicker";

type Props = {
  open: boolean;
  identityId: string | null;
  onClose: () => void;
};

type FormState = {
  email: string;
  password: string;
  identityName: string;
  identityStatus: IdentityStatus;
  roles: Record<RoleKey, boolean>;
  permissionsJson: string;
  identityGroupId: string;
  identityPhone: string;
  identityNID: string;
  identityAddress: string;
};

function defaultForm(): FormState {
  const roles = {} as Record<RoleKey, boolean>;
  roleKeys.forEach((k) => (roles[k] = false));
  return {
    email: "",
    password: "",
    identityName: "",
    identityStatus: "active",
    roles,
    permissionsJson: "{}",
    identityGroupId: "",
    identityPhone: "",
    identityNID: "",
    identityAddress: "",
  };
}

export function IdentityUpdateModal({ open, identityId, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();

  // Document states
  const [identityDocumentIds, setIdentityDocumentIds] = useState<string[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<PickerItem[]>([]);

  // Password change state — locked by default, must confirm to unlock
  const [changePassword, setChangePassword] = useState(false);

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
    setForm({
      email: (data as any).email ?? "",
      password: "",
      identityName: data.identityName ?? "",
      identityStatus: data.identityStatus ?? "active",
      roles: pickRoles(data.roles ?? {}, roleKeys),
      permissionsJson: JSON.stringify(data.permissions ?? {}, null, 2),
      identityGroupId: data.identityGroupId ?? "",
      identityPhone: data.identityPhone ?? "",
      identityNID: data.identityNID ?? "",
      identityAddress: data.identityAddress ?? "",
    });
    // Reset password lock when loading new user
    setChangePassword(false);

    if (Array.isArray(data.documents)) {
      const docs = data.documents as any[];
      setIdentityDocumentIds(docs.map((d) => d.documentId));
      setSelectedDocs(
        docs.map((d) => ({
          id: d.documentId,
          label: d.documentTitle || d.documentId,
          sublabel: d.documentId,
        }))
      );
    } else if (Array.isArray(data.identityDocumentIds)) {
      setIdentityDocumentIds(data.identityDocumentIds);
      setSelectedDocs(
        data.identityDocumentIds.map((id) => ({ id, label: id, sublabel: id }))
      );
    } else {
      setIdentityDocumentIds([]);
      setSelectedDocs([]);
    }
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

    const rolesArray = Object.entries(form.roles)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const body: IdentityUpdateBody = {
      identityId,
      email: form.email.trim() || undefined,
      // Only send password if user explicitly unlocked and entered a value
      ...(changePassword && form.password.trim()
        ? { password: form.password }
        : {}),
      identityName: form.identityName.trim(),
      identityStatus: form.identityStatus,
      identityRoles: rolesArray,
      permissions,
      identityDocumentIds:
        identityDocumentIds.length > 0 ? identityDocumentIds : undefined,
      identityGroupId: form.identityGroupId || undefined,
      identityPhone: form.identityPhone.trim() || undefined,
      identityNID: form.identityNID.trim() || undefined,
      identityAddress: form.identityAddress.trim() || undefined,
    } as any;

    updateM.mutate(body);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="w-[80vw] !max-w-[1240px] min-w-[400px] h-[90vh] max-h-[90vh] flex flex-col p-0">
        <div className="px-6 py-4 border-b border-border flex-none">
          <DialogTitle>{t("hr.update.title")}</DialogTitle>
        </div>

        {detailQ.isLoading ? (
          <div className="flex-1 flex justify-center items-center py-8">
            <div className="text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          </div>
        ) : detailQ.isError ? (
          <div className="flex-1 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-destructive">{t("common.error")}</div>
              <Button variant="outline" onClick={() => detailQ.refetch()}>
                {t("common.retry", { defaultValue: "Thử lại" })}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Identity ID — readonly */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t("hr.fields.identityId")}
                  </div>
                  <Input value={identityId ?? ""} disabled className="bg-muted" />
                </div>

                {/* Group */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t("hr.fields.identityGroup")}
                  </div>
                  <IdentityGroupSelect
                    value={form.identityGroupId}
                    onValueChange={(v) => setForm((s) => ({ ...s, identityGroupId: v }))}
                  />
                </div>

                {/* Status */}
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
                    }
                  >
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
                      <SelectItem value="blocked">
                        {t("hr.status.blocked")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Full name */}
                <div className="space-y-1 sm:col-span-3">
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

                {/* Email */}
                <div className="space-y-1 sm:col-span-2">
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

                {/* Password — locked by default */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {changePassword ? (
                      <LockOpen className="h-3 w-3 text-orange-500" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {t("hr.fields.password")}
                  </div>

                  {changePassword ? (
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, password: e.target.value }))
                        }
                        placeholder={t("hr.update.enterNewPassword")}
                        autoFocus
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        title={t("hr.update.cancelPasswordChange")}
                        onClick={() => {
                          setChangePassword(false);
                          setForm((s) => ({ ...s, password: "" }));
                        }}
                      >
                        <Lock className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => {
                        const ok = window.confirm(
                          t("hr.update.confirmPasswordChange")
                        );
                        if (ok) setChangePassword(true);
                      }}
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{t("hr.update.clickToChangePassword")}</span>
                    </button>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    {t("hr.fields.identityPhone")}
                  </div>
                  <Input
                    value={form.identityPhone}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, identityPhone: e.target.value }))
                    }
                    placeholder="0x..."
                  />
                </div>

                {/* NID */}
                <div className="space-y-1 sm:col-span-2">
                  <div className="text-xs text-muted-foreground">
                    {t("hr.fields.identityNID")}
                  </div>
                  <Input
                    value={form.identityNID}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, identityNID: e.target.value }))
                    }
                    placeholder="12 số..."
                  />
                </div>

                {/* Address */}
                <div className="space-y-1 sm:col-span-3">
                  <div className="text-xs text-muted-foreground">
                    {t("hr.fields.identityAddress")}
                  </div>
                  <Input
                    value={form.identityAddress}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, identityAddress: e.target.value }))
                    }
                    placeholder="Số nhà, tên đường..."
                  />
                </div>

                {/* Documents */}
                <div className="sm:col-span-3">
                  <IdentityDocumentManager
                    selectedIds={identityDocumentIds}
                    selectedItems={selectedDocs}
                    onChange={(ids, items) => {
                      setIdentityDocumentIds(ids);
                      setSelectedDocs(items);
                    }}
                  />
                </div>

                {/* Roles */}
                <div className="sm:col-span-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <div className="font-medium text-sm">
                      {t("hr.fields.roles")}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border border-border rounded-md p-4 bg-muted/20 gap-y-3">
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
            </div>

            <DialogFooter className="px-6 py-4 border-t border-border flex-none">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={updateM.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={submit}
                disabled={!canSubmit || updateM.isPending}
              >
                {updateM.isPending
                  ? t("common.toast.processing")
                  : t("common.save")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
