import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, ReceiptText, FileText, Search, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ClientsTab } from "./ClientsTab";
import { OrdersTab } from "./OrdersTab";
import { QuotesTab } from "./QuotesTab";
import { CrmCreateModalHost } from "@/components/crm/CrmCreateModal";


type CrmTab = "clients" | "orders" | "quotes";

export function CRMPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CrmTab>("clients");
  const [globalSearch, setGlobalSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const tabs = useMemo(
    () => [
      { key: "clients" as const, Icon: Users, label: t("crm.tabs.clients") },
      { key: "orders" as const, Icon: ReceiptText, label: t("crm.tabs.orders") },
      { key: "quotes" as const, Icon: FileText, label: t("crm.tabs.quotes") },
    ],
    [t],
  );

  return (
    <div className="p-6 space-y-6">
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="text-lg font-semibold text-foreground">{t("crm.title")}</div>
        <div className="text-sm text-muted-foreground">{t("crm.subtitle")}</div>
      </div>

      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
            {tabs.map(({ key, Icon, label }) => (
              <Button
                key={key}
                type="button"
                variant={activeTab === key ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 ${
                  activeTab === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 w-full md:w-auto md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <Button
              type="button"
              variant="default"
              className="flex items-center gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              {t("common.create")}
            </Button>
          </div>
        </div>
      </div>

      <CrmCreateModalHost
        open={createOpen}
        tab={activeTab}
        onClose={() => setCreateOpen(false)}
      />

      {activeTab === "clients" && <ClientsTab externalSearch={globalSearch} />}
      {activeTab === "orders" && <OrdersTab externalSearch={globalSearch} />}
      {activeTab === "quotes" && <QuotesTab externalSearch={globalSearch} />}
    </div>
  );
}
