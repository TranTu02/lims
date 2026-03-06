import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, UserPlus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface Analysis {
    id: string;
    sampleCode: string;
    sampleName: string;
    parameterName: string;
    parameterGroup: string; // Add parameter group
    protocol: string;
    location: string;
    unit: string;
    deadline: string;
    status: "pending" | "assigned";
    assignedTo?: string;
}

interface TesterGroup {
    id: string;
    name: string;
    members: string[];
}

const mockAnalyses: Analysis[] = [
    {
        id: "a1",
        sampleCode: "TNM2501-001-S01",
        sampleName: "Mẫu nước thải điểm 1",
        parameterName: "pH",
        parameterGroup: "Hoá lý cơ bản",
        protocol: "ISO 11888-1",
        location: "Lab 1",
        unit: "pH",
        deadline: "16/01/2026",
        status: "pending",
    },
    {
        id: "a2",
        sampleCode: "TNM2501-001-S01",
        sampleName: "Mẫu nước thải điểm 1",
        parameterName: "COD",
        parameterGroup: "Ô nhiễm",
        protocol: "ISO 6060",
        location: "Lab 2",
        unit: "mg/L",
        deadline: "17/01/2026",
        status: "pending",
    },
    {
        id: "a3",
        sampleCode: "TNM2501-001-S02",
        sampleName: "Mẫu nước thải điểm 2",
        parameterName: "BOD",
        parameterGroup: "Ô nhiễm",
        protocol: "ISO 5815",
        location: "Lab 3",
        unit: "mg/L",
        deadline: "18/01/2026",
        status: "pending",
    },
    {
        id: "a4",
        sampleCode: "TNM2501-001-S03",
        sampleName: "Mẫu nước thải điểm 3",
        parameterName: "Nitrate",
        parameterGroup: "Dinh dưỡng",
        protocol: "ISO 7890-3",
        location: "Lab 2",
        unit: "mg/L",
        deadline: "19/01/2026",
        status: "assigned",
        assignedTo: "Nguyễn Văn A",
    },
    {
        id: "a5",
        sampleCode: "TNM2501-002-S01",
        sampleName: "Mẫu nước sinh hoạt",
        parameterName: "Phosphate",
        parameterGroup: "Dinh dưỡng",
        protocol: "ISO 6878",
        location: "Lab 1",
        unit: "mg/L",
        deadline: "16/01/2026",
        status: "pending",
    },
    {
        id: "a6",
        sampleCode: "TNM2501-003-S01",
        sampleName: "Mẫu thực phẩm chức năng",
        parameterName: "Ginsenoside",
        parameterGroup: "Định tính dược liệu",
        protocol: "TCVN 12345",
        location: "Lab 4",
        unit: "mg/100g",
        deadline: "20/01/2026",
        status: "pending",
    },
    {
        id: "a7",
        sampleCode: "TNM2501-003-S02",
        sampleName: "Mẫu đất nông nghiệp",
        parameterName: "Cadmium",
        parameterGroup: "Kim loại",
        protocol: "ISO 11047",
        location: "Lab 5",
        unit: "mg/kg",
        deadline: "21/01/2026",
        status: "pending",
    },
    {
        id: "a8",
        sampleCode: "TNM2501-004-S01",
        sampleName: "Mẫu thực phẩm",
        parameterName: "E. coli",
        parameterGroup: "Vi sinh",
        protocol: "TCVN 6846",
        location: "Lab 6",
        unit: "CFU/g",
        deadline: "17/01/2026",
        status: "pending",
    },
];

const mockTesterGroups: TesterGroup[] = [
    {
        id: "g1",
        name: "Nhóm Hóa học",
        members: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"],
    },
    {
        id: "g2",
        name: "Nhóm Vi sinh",
        members: ["Phạm Thị D", "Hoàng Văn E"],
    },
    {
        id: "g3",
        name: "Nhóm Kim loại nặng",
        members: ["Vũ Thị F", "Đỗ Văn G", "Ngô Thị H"],
    },
];

export function TesterAssignment() {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>("");

    const filteredAnalyses = mockAnalyses.filter((analysis) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return analysis.sampleCode.toLowerCase().includes(term) || analysis.sampleName.toLowerCase().includes(term) || analysis.parameterName.toLowerCase().includes(term);
    });

    const handleSelectAll = () => {
        if (selectedAnalyses.length === filteredAnalyses.length) {
            setSelectedAnalyses([]);
        } else {
            setSelectedAnalyses(filteredAnalyses.map((a) => a.id));
        }
    };

    const handleSelectAnalysis = (id: string) => {
        if (selectedAnalyses.includes(id)) {
            setSelectedAnalyses(selectedAnalyses.filter((a) => a !== id));
        } else {
            setSelectedAnalyses([...selectedAnalyses, id]);
        }
    };

    const handleAssign = () => {
        console.log("Assigning analyses:", selectedAnalyses, "to group:", selectedGroup);
        setShowAssignModal(false);
        setSelectedAnalyses([]);
    };

    const pendingCount = mockAnalyses.filter((a) => a.status === "pending").length;
    const assignedCount = mockAnalyses.filter((a) => a.status === "assigned").length;

    return (
        <div className="p-6 space-y-6">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{t("handover.testerAssignment.total")}</div>
                    <div className="text-3xl font-semibold mt-1 text-foreground">{mockAnalyses.length}</div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{t("handover.testerAssignment.unassigned")}</div>
                    <div className="text-3xl font-semibold mt-1 text-orange-600 dark:text-orange-400">{pendingCount}</div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">{t("handover.testerAssignment.assigned")}</div>
                    <div className="text-3xl font-semibold mt-1 text-green-600 dark:text-green-400">{assignedCount}</div>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t("handover.testerAssignment.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background" />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            {t("handover.testerAssignment.filter")}
                        </Button>
                        <Button onClick={() => setShowAssignModal(true)} disabled={selectedAnalyses.length === 0} className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            {t("handover.testerAssignment.assign")} ({selectedAnalyses.length})
                        </Button>
                    </div>
                </div>
            </div>

            {/* Analyses Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input type="checkbox" checked={selectedAnalyses.length === filteredAnalyses.length} onChange={handleSelectAll} className="rounded border-border bg-background" />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.info.sampleCode")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.info.sampleName")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.storedSamples.parameters.group")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.parameter")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.protocol")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.location")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.deadline")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.storedSamples.parameters.status")}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.storedSamples.parameters.performer")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredAnalyses.map((analysis) => (
                                <tr key={analysis.id} className="hover:bg-accent/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedAnalyses.includes(analysis.id)}
                                            onChange={() => handleSelectAnalysis(analysis.id)}
                                            className="rounded border-border bg-background"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">{analysis.sampleCode}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">{analysis.sampleName}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary" className="text-xs bg-muted text-foreground hover:bg-muted/80">
                                            {analysis.parameterGroup}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">{analysis.parameterName}</td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">{analysis.protocol}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline" className="text-xs border-border text-foreground">
                                            {analysis.location}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">{analysis.deadline}</td>
                                    <td className="px-4 py-3">
                                        {analysis.status === "pending" ? (
                                            <Badge variant="outline" className="text-xs border-border text-foreground">
                                                {t("handover.testerAssignment.unassigned")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 dark:bg-green-600 text-xs">
                                                {t("handover.testerAssignment.assigned")}
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">{analysis.assignedTo || <span className="text-muted-foreground">-</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAssignModal(false)}></div>
                    <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-2xl mx-auto bg-card rounded-lg shadow-xl z-50 border border-border">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold text-foreground">{t("handover.testerAssignment.modal.title")}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{t("handover.testerAssignment.modal.description", { count: selectedAnalyses.length })}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <Label className="text-sm text-muted-foreground">{t("handover.testerAssignment.modal.group")}</Label>
                                <div className="mt-2 space-y-2">
                                    {mockTesterGroups.map((group) => (
                                        <label
                                            key={group.id}
                                            className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors ${
                                                selectedGroup === group.id ? "bg-blue-50 dark:bg-blue-900/10 border-primary" : "border-border"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="group"
                                                value={group.id}
                                                checked={selectedGroup === group.id}
                                                onChange={() => setSelectedGroup(group.id)}
                                                className="mt-1 accent-primary"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-foreground">{group.name}</div>
                                                <div className="text-sm text-muted-foreground mt-1">{t("handover.testerAssignment.modal.members", { members: group.members.join(", ") })}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-border flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                                {t("common.cancel")}
                            </Button>
                            <Button onClick={handleAssign} disabled={!selectedGroup}>
                                {t("handover.testerAssignment.assign")}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
