import { Badge } from "@/components/ui/badge";
import { activeRoleKeys } from "@/utils/roles";
import { useTranslation } from "react-i18next";

type Props = {
  roles: unknown;
  max?: number;
};

export function IdentityRoleBadges({ roles, max = 2 }: Props) {
  const { t } = useTranslation();
  const keys = activeRoleKeys(roles);

  if (keys.length === 0) return <Badge variant="outline">{t("common.noData")}</Badge>;

  const shown = keys.slice(0, max);
  const remaining = keys.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((k) => (
        <Badge key={k} variant="outline" className="border-border text-foreground">
          {t(`hr.roles.${k}`)}
        </Badge>
      ))}
      {remaining > 0 && <Badge variant="secondary">+{remaining}</Badge>}
    </div>
  );
}
