import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Package, Wrench, FlaskConical, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Chemical {
    id: string;
    name: string;
    casNo: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
    currentStock: number;
    maxCapacity: number;
    unit: string;
    status: "ok" | "warning" | "critical";
}

interface Equipment {
    id: string;
    name: string;
    equipmentCode: string;
    calibrationDate: string;
    nextCalibration: string;
    daysUntilCalibration: number;
    status: "active" | "maintenance" | "overdue";
    location: string;
}

interface Glassware {
    id: string;
    name: string;
    category: string;
    totalStock: number;
    inUse: number;
    broken: number;
    available: number;
}

const mockChemicals: Chemical[] = [
    {
        id: "c1",
        name: "H₂SO₄ 98%",
        casNo: "7664-93-9",
        batchNumber: "L12345",
        expiryDate: "20/12/2026",
        daysUntilExpiry: 336,
        currentStock: 800,
        maxCapacity: 1000,
        unit: "mL",
        status: "ok",
    },
    {
        id: "c2",
        name: "Methanol HPLC Grade",
        casNo: "67-56-1",
        batchNumber: "M99887",
        expiryDate: "25/01/2026",
        daysUntilExpiry: 7,
        currentStock: 50,
        maxCapacity: 1000,
        unit: "mL",
        status: "critical",
    },
    {
        id: "c3",
        name: "HNO₃ 65%",
        casNo: "7697-37-2",
        batchNumber: "N54321",
        expiryDate: "15/03/2026",
        daysUntilExpiry: 56,
        currentStock: 300,
        maxCapacity: 500,
        unit: "mL",
        status: "ok",
    },
    {
        id: "c4",
        name: "Acetonitrile HPLC",
        casNo: "75-05-8",
        batchNumber: "A77889",
        expiryDate: "10/02/2026",
        daysUntilExpiry: 23,
        currentStock: 150,
        maxCapacity: 1000,
        unit: "mL",
        status: "warning",
    },
    {
        id: "c5",
        name: "Standard Pb 1000ppm",
        casNo: "-",
        batchNumber: "STD-Pb-001",
        expiryDate: "30/01/2026",
        daysUntilExpiry: 12,
        currentStock: 10,
        maxCapacity: 100,
        unit: "mL",
        status: "warning",
    },
];

const mockEquipment: Equipment[] = [
    {
        id: "e1",
        name: "ICP-MS Agilent 7900",
        equipmentCode: "EQ-001",
        calibrationDate: "15/12/2025",
        nextCalibration: "15/06/2026",
        daysUntilCalibration: 148,
        status: "active",
        location: "Phòng kim loại nặng",
    },
    {
        id: "e2",
        name: "pH Meter Mettler Toledo",
        equipmentCode: "EQ-015",
        calibrationDate: "10/01/2026",
        nextCalibration: "10/02/2026",
        daysUntilCalibration: 23,
        status: "active",
        location: "Phòng hóa lý",
    },
    {
        id: "e3",
        name: "HPLC Shimadzu",
        equipmentCode: "EQ-008",
        calibrationDate: "05/10/2025",
        nextCalibration: "05/01/2026",
        daysUntilCalibration: -13,
        status: "overdue",
        location: "Phòng hữu cơ",
    },
    {
        id: "e4",
        name: "Cân phân tích Sartorius",
        equipmentCode: "EQ-022",
        calibrationDate: "20/01/2026",
        nextCalibration: "20/04/2026",
        daysUntilCalibration: 92,
        status: "active",
        location: "Phòng chuẩn bị mẫu",
    },
    {
        id: "e5",
        name: "Tủ sấy Memmert",
        equipmentCode: "EQ-030",
        calibrationDate: "01/12/2025",
        nextCalibration: "01/03/2026",
        daysUntilCalibration: 42,
        status: "maintenance",
        location: "Phòng vi sinh",
    },
];

const mockGlassware: Glassware[] = [
    {
        id: "g1",
        name: "Bình định mức 100mL",
        category: "Bình định mức",
        totalStock: 50,
        inUse: 15,
        broken: 3,
        available: 32,
    },
    {
        id: "g2",
        name: "Pipet 10mL",
        category: "Pipet",
        totalStock: 30,
        inUse: 8,
        broken: 2,
        available: 20,
    },
    {
        id: "g3",
        name: "Beaker 250mL",
        category: "Cốc thủy tinh",
        totalStock: 40,
        inUse: 12,
        broken: 1,
        available: 27,
    },
    {
        id: "g4",
        name: "Erlenmeyer 500mL",
        category: "Bình tam giác",
        totalStock: 25,
        inUse: 5,
        broken: 0,
        available: 20,
    },
];

export function InventoryDashboard({ defaultTab = "chemicals" }: { defaultTab?: string }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(defaultTab === "supplies" ? "chemicals" : defaultTab);
    const [searchTerm, setSearchTerm] = useState("");

    const criticalChemicals = mockChemicals.filter((c) => c.status === "critical").length;
    const warningChemicals = mockChemicals.filter((c) => c.status === "warning").length;
    const overdueEquipment = mockEquipment.filter((e) => e.status === "overdue").length;

    const getStockPercentage = (current: number, max: number) => {
        return (current / max) * 100;
    };

    const filteredChemicals = mockChemicals.filter((chemical) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return chemical.name.toLowerCase().includes(term) || chemical.casNo.toLowerCase().includes(term) || chemical.batchNumber.toLowerCase().includes(term);
    });

    const filteredGlassware = mockGlassware.filter((item) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
    });

    const filteredEquipment = mockEquipment.filter((equipment) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return equipment.name.toLowerCase().includes(term) || equipment.equipmentCode.toLowerCase().includes(term) || equipment.location.toLowerCase().includes(term);
    });

    return (
        <div className="p-6 space-y-6">
            {/* Alert Section */}
            {(criticalChemicals > 0 || warningChemicals > 0 || overdueEquipment > 0) && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex flex-wrap gap-2">
                        {criticalChemicals > 0 && <span dangerouslySetInnerHTML={{ __html: t("inventory.dashboard.alerts.chemicalExpiry", { count: criticalChemicals, days: 7 }) }} />}
                        {warningChemicals > 0 && <span dangerouslySetInnerHTML={{ __html: t("inventory.dashboard.alerts.chemicalWarning", { count: warningChemicals, days: 30 }) }} />}
                        {overdueEquipment > 0 && <span dangerouslySetInnerHTML={{ __html: t("inventory.dashboard.alerts.equipmentOverdue", { count: overdueEquipment }) }} />}
                    </AlertDescription>
                </Alert>
            )}

            {/* Search Bar */}
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("inventory.dashboard.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background" />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="chemicals">
                        <FlaskConical className="h-4 w-4 mr-2" />
                        {t("inventory.dashboard.tabs.chemicals")} ({mockChemicals.length})
                    </TabsTrigger>
                    <TabsTrigger value="glassware">
                        <Package className="h-4 w-4 mr-2" />
                        {t("inventory.dashboard.tabs.glassware")} ({mockGlassware.length})
                    </TabsTrigger>
                    <TabsTrigger value="equipment">
                        <Wrench className="h-4 w-4 mr-2" />
                        {t("inventory.dashboard.tabs.equipment")} ({mockEquipment.length})
                    </TabsTrigger>
                    <TabsTrigger value="supplies" disabled className="opacity-50 cursor-not-allowed">
                        <FileText className="h-4 w-4 mr-2" />
                        {t("inventory.dashboard.tabs.supplies")}
                        <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground uppercase font-mono font-bold ml-1.5">LOCKED</span>
                    </TabsTrigger>
                </TabsList>

                {/* Chemicals Tab */}
                <TabsContent value="chemicals" className="mt-6">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.chemicalName")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.casNo")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.batch")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.expiry")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase w-64">{t("inventory.dashboard.table.stock")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredChemicals.map((chemical) => {
                                        const stockPercentage = getStockPercentage(chemical.currentStock, chemical.maxCapacity);
                                        return (
                                            <tr key={chemical.id} className="hover:bg-accent/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{chemical.name}</div>
                                                    <div className="text-sm text-muted-foreground">Batch: {chemical.batchNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 text-foreground">{chemical.casNo}</td>
                                                <td className="px-6 py-4 text-foreground">{chemical.batchNumber}</td>
                                                <td className="px-6 py-4">
                                                    <div className="text-foreground">{chemical.expiryDate}</div>
                                                    {chemical.status === "critical" ? (
                                                        <Badge variant="destructive" className="mt-1">
                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                            {t("inventory.dashboard.alerts.daysLeft", { days: chemical.daysUntilExpiry })}
                                                        </Badge>
                                                    ) : chemical.status === "warning" ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="mt-1 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                                                        >
                                                            {t("inventory.dashboard.alerts.daysLeft", { days: chemical.daysUntilExpiry })}
                                                        </Badge>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground mt-1">{t("inventory.dashboard.alerts.daysLeft", { days: chemical.daysUntilExpiry })}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Progress
                                                            value={stockPercentage}
                                                            className={`flex-1 h-3 ${
                                                                stockPercentage < 10 ? "[&>div]:bg-red-500" : stockPercentage < 30 ? "[&>div]:bg-orange-500" : "[&>div]:bg-green-500"
                                                            }`}
                                                        />
                                                        <span className="text-sm font-medium text-foreground w-24 text-right">
                                                            {chemical.currentStock}/{chemical.maxCapacity} {chemical.unit}
                                                        </span>
                                                    </div>
                                                    {stockPercentage < 10 && <div className="text-xs text-destructive mt-1">{t("inventory.dashboard.alerts.stockLow")}</div>}{" "}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* Glassware Tab */}
                <TabsContent value="glassware" className="mt-6">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.glasswareName")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.category")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.totalStock")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.inUse")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.available")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.broken")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredGlassware.map((item) => (
                                        <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                                            <td className="px-6 py-4 text-foreground">{item.category}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="outline" className="border-border text-foreground">
                                                    {item.totalStock}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600">
                                                    {item.inUse}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 dark:bg-green-600">
                                                    {item.available}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.broken > 0 ? <Badge variant="destructive">{item.broken}</Badge> : <span className="text-muted-foreground">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* Equipment Tab */}
                <TabsContent value="equipment" className="mt-6">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.equipmentName")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.equipmentCode")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.location")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.lastCalib")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.nextCalib")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("inventory.dashboard.table.status")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredEquipment.map((equipment) => (
                                        <tr key={equipment.id} className="hover:bg-accent/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{equipment.name}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="text-foreground border-border">
                                                    {equipment.equipmentCode}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-foreground">{equipment.location}</td>
                                            <td className="px-6 py-4 text-foreground">{equipment.calibrationDate}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-foreground">{equipment.nextCalibration}</div>
                                                {equipment.daysUntilCalibration < 0 ? (
                                                    <Badge variant="destructive" className="mt-1">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        {t("inventory.dashboard.alerts.overdue", { days: Math.abs(equipment.daysUntilCalibration) })}
                                                    </Badge>
                                                ) : equipment.daysUntilCalibration < 30 ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="mt-1 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                                                    >
                                                        {t("inventory.dashboard.alerts.daysLeft", { days: equipment.daysUntilCalibration })}
                                                    </Badge>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground mt-1">{t("inventory.dashboard.alerts.daysLeft", { days: equipment.daysUntilCalibration })}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {equipment.status === "active" ? (
                                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 dark:bg-green-600 flex items-center gap-1 w-fit">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {t("inventory.dashboard.status.active")}
                                                    </Badge>
                                                ) : equipment.status === "maintenance" ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                                                    >
                                                        {t("inventory.dashboard.status.maintenance")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">{t("inventory.dashboard.status.overdue")}</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* Supplies Tab */}
                <TabsContent value="supplies" className="mt-6">
                    <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">{t("common.noData")}</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
