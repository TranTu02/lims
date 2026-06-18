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
        <div className="p-6 flex flex-col h-full min-h-0">

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList className="bg-muted w-fit mb-4">
                    <TabsTrigger value="pending" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                        {String(t("inventory.samples.tabs.pending", { defaultValue: "Mẫu chờ lưu" }))}
                    </TabsTrigger>
                    <TabsTrigger value="retained" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                        {String(t("inventory.samples.tabs.retained", { defaultValue: "Mẫu đang lưu" }))}
                    </TabsTrigger>
                    <TabsTrigger value="disposed" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                        {String(t("inventory.samples.tabs.disposedOnly", { defaultValue: "Đã hủy" }))}
                    </TabsTrigger>
                    <TabsTrigger value="returned" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                        {String(t("inventory.samples.tabs.returnedOnly", { defaultValue: "Trả lại khách hàng" }))}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="flex-1 mt-0 outline-none data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <SamplePendingList />
                </TabsContent>

                <TabsContent value="retained" className="flex-1 mt-0 outline-none data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <SampleRetainedList />
                </TabsContent>

                <TabsContent value="disposed" className="flex-1 mt-0 outline-none data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <SampleDisposedList status="Disposed" />
                </TabsContent>

                <TabsContent value="returned" className="flex-1 mt-0 outline-none data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
                    <SampleDisposedList status="Returned" />
                </TabsContent>
            </Tabs>
        </div>
    );
}
