import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Cpu, Wrench, Activity, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EquipmentTab } from "./EquipmentTab";
import { LabToolsTab } from "./LabToolsTab";
import { AssetActivityLogsTab } from "./AssetActivityLogsTab";
import { EquipmentCatalogTab } from "@/components/technician/EquipmentCatalogTab";

export function GeneralInventoryLayout() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("lab-equipment");

    return (
        <div className="h-full w-full flex flex-col pt-3 px-4 gap-4 bg-background">
            <h1 className="text-2xl font-bold tracking-tight">{String(t("inventory.general.title", { defaultValue: "Kho Dụng cụ & Thiết bị" }))}</h1>
            <p className="text-sm text-muted-foreground">{String(t("inventory.general.description", { defaultValue: "Quản lý toàn bộ thông tin tài sản, thiết bị, và sổ cài truy vết hoạt động." }))}</p>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full h-full space-y-4">
                <TabsList className="w-fit">
                    <TabsTrigger value="lab-equipment" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {String(t("inventory.general.tabs.labEquipment", { defaultValue: "Danh mục thiết bị" }))}
                    </TabsTrigger>
                    <TabsTrigger value="equipment" disabled className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                        <Cpu className="h-4 w-4" />
                        {String(t("inventory.general.tabs.inventory", { defaultValue: "Vật tư - Kho" }))}
                        <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground uppercase font-mono font-bold ml-1.5">LOCKED</span>
                    </TabsTrigger>
                    <TabsTrigger value="lab-tools" disabled className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                        <Wrench className="h-4 w-4" />
                        {String(t("inventory.general.tabs.skus", { defaultValue: "Danh mục thiết bị & Dụng cụ" }))}
                        <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground uppercase font-mono font-bold ml-1.5">LOCKED</span>
                    </TabsTrigger>
                    <TabsTrigger value="activity-logs" disabled className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                        <Activity className="h-4 w-4" />
                        {String(t("inventory.general.tabs.activityLogs", { defaultValue: "Sổ cái truy vết" }))}
                        <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground uppercase font-mono font-bold ml-1.5">LOCKED</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="equipment" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <EquipmentTab />
                </TabsContent>

                <TabsContent value="lab-tools" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <LabToolsTab />
                </TabsContent>

                <TabsContent value="lab-equipment" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <EquipmentCatalogTab />
                </TabsContent>

                <TabsContent value="activity-logs" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <AssetActivityLogsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
