import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkusTab } from "./SkusTab";
import { SuppliersTab } from "./SuppliersTab";
import { InventoriesTab } from "./InventoriesTab";
import { TransactionBlocksTab } from "./TransactionBlocksTab";
import { TransactionsTab } from "./TransactionsTab";

export function ChemicalInventoryLayout() {
    const [activeTab, setActiveTab] = useState("inventories");

    return (
        <div className="h-full w-full flex flex-col pt-3 px-4 gap-4 bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full h-full space-y-4">
                <TabsList className="w-fit">
                    <TabsTrigger value="inventories">Quản lý Lọ/Chai</TabsTrigger>
                    <TabsTrigger value="skus">Danh mục Hóa chất</TabsTrigger>
                    <TabsTrigger value="suppliers">Nhà Cung Cấp &amp; Catalog</TabsTrigger>
                    <TabsTrigger value="transaction-blocks">Phiếu Xuất/Nhập Kho</TabsTrigger>
                    <TabsTrigger value="transactions">Lịch sử Giao dịch</TabsTrigger>
                </TabsList>

                <TabsContent value="inventories" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <InventoriesTab />
                </TabsContent>

                <TabsContent value="skus" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <SkusTab />
                </TabsContent>

                <TabsContent value="suppliers" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <SuppliersTab />
                </TabsContent>

                <TabsContent value="transaction-blocks" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <TransactionBlocksTab />
                </TabsContent>

                <TabsContent value="transactions" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <TransactionsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
