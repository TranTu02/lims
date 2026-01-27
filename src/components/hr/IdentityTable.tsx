import { useTranslation } from "react-i18next";
import { Edit, FileText, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { IdentityListItem } from "@/api/identities";
import { IdentityRoleBadges } from "./IdentityRoleBadges";

type Props = {
  items: IdentityListItem[];
  onView: (identityId: string) => void;
  onEdit: (identityId: string) => void;
  onDelete: (identityId: string) => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1] ?? "";
  return (last[0] ?? "?").toUpperCase();
}

export function IdentityTable({ items, onView, onEdit, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                {t("hr.dashboard.table.identity")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                {t("hr.dashboard.table.code")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                {t("hr.dashboard.table.role")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                {t("hr.dashboard.table.status")}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">
                {t("hr.dashboard.table.actions")}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {items.map((u) => (
              <tr
                key={u.identityId}
                className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary/15 text-primary">
                        {getInitials(u.identityName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {u.identityName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <Badge
                    variant="outline"
                    className="border-border text-foreground">
                    {u.identityId}
                  </Badge>
                </td>

                <td className="px-6 py-4">
                  <IdentityRoleBadges roles={u.roles ?? {}} />
                </td>

                <td className="px-6 py-4">
                  <Badge
                    variant={
                      u.identityStatus === "active" ? "success" : "warning"
                    }>
                    {t(`hr.status.${u.identityStatus}`, {
                      defaultValue: u.identityStatus,
                    })}
                  </Badge>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onView(u.identityId)}
                      aria-label={t("common.view")}
                      title={t("common.view")}>
                      <FileText className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(u.identityId)}
                      aria-label={t("common.edit")}
                      title={t("common.edit")}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      onClick={() => onDelete(u.identityId)}
                      aria-label={t("common.delete")}
                      title={t("common.delete")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {items.length === 0 && (
              <tr>
                <td
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                  colSpan={5}>
                  {t("common.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
