import { useTranslation } from "react-i18next";
import { Search, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  onCreate: () => void;
};

export function IdentityToolbar({ search, onSearchChange, onCreate }: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-card rounded-lg border border-border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("hr.dashboard.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-background"
          aria-label={t("hr.dashboard.searchPlaceholder")}
        />
      </div>

      <Button onClick={onCreate} className="flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        {t("hr.dashboard.addIdentity")}
      </Button>
    </div>
  );
}
