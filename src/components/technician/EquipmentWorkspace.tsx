import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Scale, Microscope, Layers, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSerialBalance } from "@/contexts/SerialBalanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { AnalyticalBalanceStreamer } from "./AnalyticalBalanceStreamer";
import { CameraStreamer } from "./CameraStreamer";
import { EquipmentCatalogTab } from "./EquipmentCatalogTab";

export function EquipmentWorkspace() {
    const { t } = useTranslation();
    const { isConnected } = useSerialBalance();
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState(isAdmin ? "catalog" : "balance");

    return (
        <div className="flex h-full flex-col gap-4 p-6 bg-background space-y-4">
            <div className="bg-card rounded-lg border border-border p-6 flex flex-col items-start gap-4 shadow-sm">
                <div className="flex w-full justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {String(t("equipment.title", { defaultValue: "Thiết bị phòng Lab" }))}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {String(t("equipment.subtitle", { defaultValue: "Quản lý luồng dữ liệu, hiệu chuẩn và trạng thái thiết bị." }))}
                        </p>
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList className={`grid w-full ${isAdmin ? "grid-cols-4 md:w-[800px]" : "grid-cols-3 md:w-[600px]"}`}>
                        {isAdmin && (
                            <TabsTrigger value="catalog" className="flex items-center gap-1.5">
                                <Settings className="w-3.5 h-3.5" />
                                <span>Danh mục thiết bị</span>
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="balance" className="relative flex items-center gap-1.5">
                            <Scale className="w-3.5 h-3.5" />
                            <span>{String(t("equipment.tabs.balance", { defaultValue: "Cân phân tích" }))}</span>
                            {isConnected && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full animate-pulse border border-background" />
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="microscope" className="flex items-center gap-1.5">
                            <Microscope className="w-3.5 h-3.5" />
                            <span>{String(t("equipment.tabs.microscope", { defaultValue: "Kính hiển vi" }))}</span>
                            <span className="text-[10px] bg-muted border border-border/80 text-muted-foreground px-1.5 py-0.2 rounded font-semibold ml-1">
                                camera
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="tlc" className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{String(t("equipment.tabs.tlc", { defaultValue: "Sắc ký lớp mỏng (TLC)" }))}</span>
                            <span className="text-[10px] bg-muted border border-border/80 text-muted-foreground px-1.5 py-0.2 rounded font-semibold ml-1">
                                camera
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {activeTab === "balance" && <AnalyticalBalanceStreamer />}
                    
                    {activeTab === "microscope" && (
                        <CameraStreamer deviceType="microscope" />
                    )}

                    {activeTab === "tlc" && (
                        <CameraStreamer deviceType="tlc" />
                    )}

                    {activeTab === "catalog" && isAdmin && (
                        <EquipmentCatalogTab />
                    )}
                </div>
            </Tabs>
        </div>
    );
}
