import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Scale, Microscope, Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSerialBalance } from "@/contexts/SerialBalanceContext";
import { AnalyticalBalanceStreamer } from "./AnalyticalBalanceStreamer";
import { CameraStreamer } from "./CameraStreamer";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function EquipmentWorkspace({ hideHeader = false }: { hideHeader?: boolean }) {
    const { t } = useTranslation();
    const { isConnected } = useSerialBalance();
    const [activeTab, setActiveTab] = useState("balance");
    const [isDefaultBalance, setIsDefaultBalance] = useState(() => localStorage.getItem("uiMode") === "equipment");

    const handleDefaultBalanceChange = (checked: boolean) => {
        if (checked) {
            toast.warning("Thiết bị này chỉ dùng cho cân, không thực hiện được các phần khác.", {
                duration: 5000,
            });
            localStorage.setItem("uiMode", "equipment");
            setIsDefaultBalance(true);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            localStorage.removeItem("uiMode");
            setIsDefaultBalance(false);
            window.location.reload();
        }
    };

    return (
        <div className={`flex h-full flex-col gap-4 ${hideHeader ? "" : "p-6"} bg-background space-y-4`}>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
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

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card shadow-sm text-xs font-medium text-foreground">
                        <label htmlFor="default-balance-mode" className="cursor-pointer select-none">
                            Mặc định thiết bị kết nối cân
                        </label>
                        <Switch
                            id="default-balance-mode"
                            checked={isDefaultBalance}
                            onCheckedChange={handleDefaultBalanceChange}
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                    {activeTab === "balance" && <AnalyticalBalanceStreamer />}
                    
                    {activeTab === "microscope" && (
                        <CameraStreamer deviceType="microscope" />
                    )}

                    {activeTab === "tlc" && (
                        <CameraStreamer deviceType="tlc" />
                    )}
                </div>
            </Tabs>
        </div>
    );
}
