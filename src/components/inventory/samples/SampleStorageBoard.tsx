import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SamplePendingList } from "./SamplePendingList";
import { SampleRetainedList } from "./SampleRetainedList";
import { SampleDisposedList } from "./SampleDisposedList";

export function SampleStorageBoard() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("pending");

    return (
        <div className="p-6 space-y-6 flex flex-col h-full">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">{String(t("inventory.samples.storageManagement", { defaultValue: "Quản lý Lưu mẫu" }))}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {String(t("inventory.samples.storageDescription", { defaultValue: "Quản lý vị trí lưu mẫu và trạng thái của các mẫu trong kho." }))}
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="bg-muted w-fit mb-4">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                        {String(t("inventory.samples.tabs.pending", { defaultValue: "Mẫu chờ lưu" }))}
                    </TabsTrigger>
                    <TabsTrigger value="retained" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                        {String(t("inventory.samples.tabs.retained", { defaultValue: "Mẫu đang lưu" }))}
                    </TabsTrigger>
                    <TabsTrigger value="disposed" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                        {String(t("inventory.samples.tabs.disposed", { defaultValue: "Mẫu đã hủy / Trả" }))}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="flex-1 mt-0 outline-none data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <SamplePendingList />
                </TabsContent>

                <TabsContent value="retained" className="flex-1 mt-0 outline-none data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <SampleRetainedList />
                </TabsContent>

                <TabsContent value="disposed" className="flex-1 mt-0 outline-none data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <SampleDisposedList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
