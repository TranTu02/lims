import { InventoryDashboard } from "@/components/inventory/InventoryDashboard";

export function InventoryPage({ defaultTab = "supplies" }: { defaultTab?: string }) {
    return (
        <div className="h-full">
            <InventoryDashboard defaultTab={defaultTab} />
        </div>
    );
}
