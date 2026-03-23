import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Save, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Analysis {
    id: string;
    parameterName: string;
    protocol: string;
    location: string;
    unit: string;
    assignedTo: string;
    deadline: string;
    status: "pending" | "in-progress" | "completed" | "approved";
}

interface Sample {
    id: string;
    code: string;
    name: string;
    sampleType: string;
    sampleTypeName?: string;
    analyses: Analysis[];
}

interface Receipt {
    id: string;
    receiptCode: string;
    customer: string;
    samples: Sample[];
}

interface SampleHandoverModalProps {
    receipt: Receipt;
    onClose: () => void;
    onSave: (handoverData: any) => void;
}

const mockTechnicians = [
    { id: "tech1", name: "Nguyễn Văn A", specialty: "Hóa lý" },
    { id: "tech2", name: "Trần Thị B", specialty: "Kim loại nặng" },
    { id: "tech3", name: "Lê Văn C", specialty: "Vi sinh" },
    { id: "tech4", name: "Phạm Thị D", specialty: "Hóa lý" },
];

export function SampleHandoverModal({ receipt, onClose, onSave }: SampleHandoverModalProps) {
    const { t } = useTranslation();
    const [assignments, setAssignments] = useState<{
        [key: string]: { technicianId: string; notes: string };
    }>({});

    const handleAssignmentChange = (analysisId: string, technicianId: string) => {
        setAssignments({
            ...assignments,
            [analysisId]: {
                ...assignments[analysisId],
                technicianId,
            },
        });
    };

    const handleNotesChange = (analysisId: string, notes: string) => {
        setAssignments({
            ...assignments,
            [analysisId]: {
                ...assignments[analysisId],
                notes,
            },
        });
    };

    const handleSave = () => {
        onSave(assignments);
        onClose();
    };

    const getTechnicianName = (techId: string) => {
        const tech = mockTechnicians.find((t) => t.id === techId);
        return tech ? tech.name : "";
    };

    const totalTests = receipt.samples.reduce((acc, sample) => acc + sample.analyses.length, 0);
    const assignedTests = Object.keys(assignments).filter((key) => assignments[key]?.technicianId).length;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-4 bg-card rounded-lg shadow-xl z-50 flex flex-col border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-semibold text-foreground">{t("handover.modal.title")}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {t("handover.modal.receipt")}: {receipt.receiptCode} - {receipt.customer}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline" className="border-border text-foreground">
                                {t("handover.modal.totalTests", { count: totalTests })}
                            </Badge>
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-700">
                                {t("handover.modal.assigned", { count: assignedTests })}
                            </Badge>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800">
                                {t("handover.modal.unassigned", { count: totalTests - assignedTests })}
                            </Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSave} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {t("handover.modal.save")}
                        </Button>
                        <Button variant="outline" onClick={onClose}>
                            {t("common.cancel")}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.info.sampleCode")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.info.sampleName")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.info.sampleType")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.parameter")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.protocol")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.location")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.deadline")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.modal.receipt")} KTV</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.note")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {receipt.samples.map((sample) => (
                                        <>
                                            {sample.analyses.map((analysis, index) => (
                                                <tr key={analysis.id} className="hover:bg-accent/30 transition-colors">
                                                    {index === 0 && (
                                                        <>
                                                            <td className="px-4 py-3 align-top border-r border-border bg-blue-50/10 dark:bg-blue-900/10" rowSpan={sample.analyses.length}>
                                                                <span className="font-medium text-foreground text-sm">{sample.code}</span>
                                                            </td>
                                                            <td className="px-4 py-3 align-top border-r border-border bg-blue-50/10 dark:bg-blue-900/10" rowSpan={sample.analyses.length}>
                                                                <div className="text-sm text-foreground">{sample.name}</div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top border-r border-border bg-blue-50/10 dark:bg-blue-900/10" rowSpan={sample.analyses.length}>
                                                                <Badge variant="outline" className="text-xs border-border text-foreground">
                                                                    {sample.sampleTypeName || sample.sampleType}
                                                                </Badge>
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-4 py-3 text-sm text-foreground">{analysis.parameterName}</td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">{analysis.protocol}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{analysis.location}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{analysis.deadline}</td>
                                                    <td className="px-4 py-3">
                                                        <Select value={assignments[analysis.id]?.technicianId || ""} onValueChange={(value) => handleAssignmentChange(analysis.id, value)}>
                                                            <SelectTrigger className="w-48 h-9 bg-background">
                                                                <SelectValue placeholder={t("handover.modal.selectTester")} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {mockTechnicians.map((tech) => (
                                                                    <SelectItem key={tech.id} value={tech.id}>
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <span>{tech.name}</span>
                                                                            <Badge variant="outline" className="text-xs ml-2 border-border text-foreground">
                                                                                {tech.specialty}
                                                                            </Badge>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {assignments[analysis.id]?.technicianId && (
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {t("handover.modal.assignedTo")} {getTechnicianName(assignments[analysis.id].technicianId)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Textarea
                                                            value={assignments[analysis.id]?.notes || ""}
                                                            onChange={(e) => handleNotesChange(analysis.id, e.target.value)}
                                                            placeholder={t("common.note")}
                                                            className="w-full min-w-[200px] h-9 text-sm resize-none bg-background"
                                                            rows={1}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Assignment */}
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            {t("handover.modal.quickAssign")}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {mockTechnicians.map((tech) => {
                                const assignedCount = Object.values(assignments).filter((a) => a?.technicianId === tech.id).length;
                                return (
                                    <div key={tech.id} className="bg-card rounded-lg p-4 border border-border hover:border-primary transition-colors cursor-pointer">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="font-medium text-foreground">{tech.name}</div>
                                                <Badge variant="outline" className="text-xs mt-1 border-border text-muted-foreground">
                                                    {tech.specialty}
                                                </Badge>
                                            </div>
                                            <Badge variant="default" className="bg-primary text-primary-foreground">
                                                {assignedCount}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-2">{t("handover.modal.testsAssigned", { count: assignedCount })}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
