import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Cpu, Wrench, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EquipmentTab } from "./EquipmentTab";
import { LabToolsTab } from "./LabToolsTab";
import { AssetActivityLogsTab } from "./AssetActivityLogsTab";

export function GeneralInventoryLayout() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("equipment");

    return (
        <div className="h-full w-full flex flex-col pt-3 px-4 gap-4 bg-background">
            <h1 className="text-2xl font-bold tracking-tight">{String(t("inventory.general.title", { defaultValue: "Kho Dụng cụ & Thiết bị" }))}</h1>
            <p className="text-sm text-muted-foreground">{String(t("inventory.general.description", { defaultValue: "Quản lý toàn bộ thông tin tài sản, thiết bị, và sổ cài truy vết hoạt động." }))}</p>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full h-full space-y-4">
                <TabsList className="w-fit">
                    <TabsTrigger value="equipment" className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        {String(t("inventory.general.tabs.equipment", { defaultValue: "Thiết bị máy móc" }))}
                    </TabsTrigger>
                    <TabsTrigger value="lab-tools" className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        {String(t("inventory.general.tabs.labTools", { defaultValue: "Dụng cụ thí nghiệm" }))}
                    </TabsTrigger>
                    <TabsTrigger value="activity-logs" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {String(t("inventory.general.tabs.activityLogs", { defaultValue: "Sổ cái Truy vết" }))}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="equipment" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <EquipmentTab />
                </TabsContent>

                <TabsContent value="lab-tools" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <LabToolsTab />
                </TabsContent>

                <TabsContent value="activity-logs" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <AssetActivityLogsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
