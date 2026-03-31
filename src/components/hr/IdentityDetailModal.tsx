import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { identitiesGetDetail, identitiesKeys } from "@/api/identities";
import { unwrapOrThrow } from "@/utils/api";
import { IdentityRoleBadges } from "./IdentityRoleBadges";

type Props = {
  open: boolean;
  identityId: string | null;
  onClose: () => void;
  onEdit: (identityId: string) => void;
};

export function IdentityDetailModal({ open, identityId, onClose }: Props) {
  const { t } = useTranslation();

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

  const data = detailQ.data;

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : undefined)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("hr.detail.title")}</DialogTitle>
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
        ) : !data ? (
          <div className="text-sm text-muted-foreground">
            {t("common.empty")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                   {t("hr.fields.identityId")}
                </div>
                <Badge
                  variant="outline"
                  className="border-border text-foreground">
                  {data.identityId}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.status")}
                </div>
                <Badge
                  variant={
                    data.identityStatus === "active" ? "success" : "warning"
                  }>
                  {t(`hr.status.${data.identityStatus}`, {
                    defaultValue: data.identityStatus,
                  })}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                   {t("hr.fields.identityGroupId", { defaultValue: "Nhóm nhân sự" })}
                </div>
                <div className="text-sm font-medium">
                  {data.identityGroupId || "-"}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.name")}
                </div>
                <div className="text-sm text-foreground">
                  {data.identityName}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.email")}
                </div>
                <div className="text-sm text-foreground">{data.email}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.alias")}
                </div>
                <div className="text-sm text-foreground">{data.alias}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.identityPhone", { defaultValue: "Số điện thoại" })}
                </div>
                <div className="text-sm text-foreground">{data.identityPhone || "-"}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.identityNID", { defaultValue: "Số CCCD/NID" })}
                </div>
                <div className="text-sm text-foreground">{data.identityNID|| "-"}</div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.identityAddress", { defaultValue: "Địa chỉ" })}
                </div>
                <div className="text-sm text-foreground">{data.identityAddress || "-"}</div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <div className="text-xs text-muted-foreground">
                  {t("hr.fields.roles")}
                </div>
                <IdentityRoleBadges roles={data.roles} max={8} />
              </div>

              {Array.isArray(data.documents) && data.documents.length > 0 && (
                <div className="space-y-1 sm:col-span-2 pt-2 border-t border-border mt-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    {t("hr.fields.documents", { defaultValue: "Hồ sơ năng lực / Tài liệu" })}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(data.documents as any[]).map(doc => (
                      <Badge key={doc.documentId} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                        <span className="text-[10px] opacity-50">{doc.documentId}</span>
                        <span>{doc.documentTitle || doc.documentId}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
