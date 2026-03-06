import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkusTab } from "./SkusTab";
import { SuppliersTab } from "./SuppliersTab";
import { InventoriesTab } from "./InventoriesTab";
import { TransactionBlocksTab } from "./TransactionBlocksTab";
import { TransactionsTab } from "./TransactionsTab";
import { AuditBlocksTab } from "./AuditBlocksTab";
import { AuditDetailsTab } from "./AuditDetailsTab";

export function ChemicalInventoryLayout() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("inventories");

    return (
        <div className="h-full w-full flex flex-col pt-3 px-4 gap-4 bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col w-full h-full space-y-4">
                <TabsList className="w-fit">
                    <TabsTrigger value="inventories">{t("inventory.chemical.tabs.inventories", { defaultValue: "Quản lý Lọ/Chai" })}</TabsTrigger>
                    <TabsTrigger value="skus">{t("inventory.chemical.tabs.skus", { defaultValue: "Danh mục Hóa chất" })}</TabsTrigger>
                    <TabsTrigger value="suppliers">{t("inventory.chemical.tabs.suppliers", { defaultValue: "Nhà Cung Cấp & Catalog" })}</TabsTrigger>
                    <TabsTrigger value="transaction-blocks">{t("inventory.chemical.tabs.transactionBlocks", { defaultValue: "Phiếu Xuất/Nhập Kho" })}</TabsTrigger>
                    <TabsTrigger value="transactions">{t("inventory.chemical.tabs.transactions", { defaultValue: "Lịch sử Giao dịch" })}</TabsTrigger>
                    <TabsTrigger value="audit-blocks">{t("inventory.chemical.tabs.auditBlocks", { defaultValue: "Phiếu Kiểm Kê" })}</TabsTrigger>
                    <TabsTrigger value="audit-details">{t("inventory.chemical.tabs.auditDetails", { defaultValue: "Chi tiết Kiểm Kê" })}</TabsTrigger>
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

                <TabsContent value="audit-blocks" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <AuditBlocksTab />
                </TabsContent>

                <TabsContent value="audit-details" className="flex-1 mt-0 h-full border-none p-0 outline-none">
                    <AuditDetailsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
