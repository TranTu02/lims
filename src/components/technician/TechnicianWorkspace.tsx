import { useState } from "react";
import { FileText, Edit, Send, FileQuestion, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

import type { Analysis } from "@/types/lab";
import { mockAnalyses, mockSamples } from "@/types/mockdata";

// Derived Task type for UI
type Task = Analysis & {
    analysisId: string; // Ensure optional in base is required here if needed, or derived
    sampleCode: string;
    receivedDate: string;
    protocol: string;
    unit: string;
    assignedTo: string;
    resultValue: string;
    notes: string;
    status: "pending" | "in-progress" | "waiting-approval" | "redo";
};

// Map mock analyses to tasks
const mapAnalysisToTask = (analysis: Analysis): Task => {
    const sample = mockSamples.find((s) => s.sampleId === analysis.sampleId);

    // Map status
    let status: Task["status"] = "pending";
    if (analysis.analysisStatus === "Testing") status = "in-progress";
    if (analysis.analysisStatus === "Review") status = "waiting-approval";
    if (analysis.analysisStatus === "Rejected") status = "redo";

    return {
        ...analysis,
        analysisId: analysis.analysisId || "N/A",
        sampleCode: sample?.sampleClientInfo || sample?.sampleId || "Unknown",
        receivedDate: sample?.createdAt?.split("T")[0] || "N/A",
        protocol: analysis.protocolCode || "N/A",
        unit: analysis.analysisUnit || "mg/kg",
        assignedTo: "Nguyen Van A", // Mock
        resultValue: analysis.analysisResult || "",
        notes: "",
        status,
    };
};

const allTasks = mockAnalyses.map(mapAnalysisToTask);
const mockTasks = allTasks.filter((t) => t.status === "pending" || t.status === "in-progress");
const mockWaitingApprovalTasks = allTasks.filter((t) => t.status === "waiting-approval");
const mockRedoTasks = allTasks.filter((t) => t.status === "redo");

export function TechnicianWorkspace() {
    const { t } = useTranslation();
    const [tasks, setTasks] = useState<Task[]>(mockTasks);
    const [activeTab, setActiveTab] = useState("todo");
    const [searchTerm, setSearchTerm] = useState("");

    const handleResultChange = (taskId: string, value: string) => {
        setTasks((prev) => prev.map((task) => (task.analysisId === taskId ? { ...task, resultValue: value } : task)));
    };

    const handleNotesChange = (taskId: string, value: string) => {
        setTasks((prev) => prev.map((task) => (task.analysisId === taskId ? { ...task, notes: value } : task)));
    };

    const TaskTable = ({ tasks, showResult = false }: { tasks: Task[]; showResult?: boolean }) => (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.sampleCode")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.parameterName")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.receivedDate")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.protocol")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.result")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.unit")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.assignedTo")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.status")}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.note")}</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("technician.workspace.table.actions")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {tasks.map((task) => (
                        <tr key={task.analysisId} className="hover:bg-accent/40 bg-card">
                            <td className="px-4 py-3 font-medium text-foreground text-sm">{task.sampleCode}</td>
                            <td className="px-4 py-3 text-foreground text-sm">{task.parameterName}</td>
                            <td className="px-4 py-3 text-muted-foreground text-sm">{task.receivedDate}</td>
                            <td className="px-4 py-3 text-muted-foreground text-sm">{task.protocol}</td>
                            <td className="px-4 py-3">
                                {showResult ? (
                                    <span className="text-foreground font-medium text-sm">{task.resultValue || "--"}</span>
                                ) : (
                                    <Input
                                        type="text"
                                        value={task.resultValue}
                                        onChange={(e) => handleResultChange(task.analysisId, e.target.value)}
                                        placeholder={t("technician.workspace.table.enterResult")}
                                        className="w-24 h-8 text-sm"
                                    />
                                )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-sm">{task.unit}</td>
                            <td className="px-4 py-3 text-muted-foreground text-sm">{task.assignedTo}</td>
                            <td className="px-4 py-3">
                                {task.status === "pending" ? (
                                    <Badge variant="outline" className="text-xs">
                                        {t("technician.workspace.status.pending")}
                                    </Badge>
                                ) : task.status === "in-progress" ? (
                                    <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                                        {t("technician.workspace.status.inProgress")}
                                    </Badge>
                                ) : task.status === "waiting-approval" ? (
                                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                                        {t("technician.workspace.status.waitingApproval")}
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="text-xs">
                                        {t("technician.workspace.status.redo")}
                                    </Badge>
                                )}
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                                {showResult ? (
                                    <span className="text-sm text-muted-foreground line-clamp-2">{task.notes || "-"}</span>
                                ) : (
                                    <Textarea
                                        value={task.notes}
                                        onChange={(e) => handleNotesChange(task.analysisId, e.target.value)}
                                        placeholder={t("technician.workspace.table.enterNote")}
                                        className="w-full min-w-[150px] h-8 text-sm resize-none"
                                        rows={1}
                                    />
                                )}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-1">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Xem chi tiết">
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    {!showResult && (
                                        <>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Chỉnh sửa">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10"
                                                title="Gửi yêu cầu duyệt"
                                                disabled={!task.resultValue}
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    {task.status === "redo" && (
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-warning hover:text-warning hover:bg-warning/10" title="Gửi yêu cầu">
                                            <FileQuestion className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="p-6 space-y-6 bg-background min-h-full">
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h1 className="text-2xl font-semibold text-foreground">{t("technician.workspace.title")}</h1>
                <p className="text-muted-foreground mt-1">{t("technician.workspace.ktv")}: Nguyễn Văn A</p>
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2 sm:pb-0">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{t("technician.workspace.totalTasks")}:</div>
                        <Badge variant="outline" className="text-base">
                            {tasks.length + mockWaitingApprovalTasks.length + mockRedoTasks.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{t("technician.workspace.todo")}:</div>
                        <Badge variant="outline" className="text-base bg-warning hover:bg-warning/90">
                            {tasks.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{t("technician.workspace.waiting")}:</div>
                        <Badge variant="outline" className="text-base bg-warning/10 text-warning border-warning/20">
                            {mockWaitingApprovalTasks.length}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">{t("technician.workspace.redo")}:</div>
                        <Badge variant="destructive" className="text-base">
                            {mockRedoTasks.length}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="todo">
                            {t("technician.workspace.todo")} ({tasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="waiting">
                            {t("technician.workspace.waiting")} ({mockWaitingApprovalTasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="redo">
                            {t("technician.workspace.redo")} ({mockRedoTasks.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Search and Filter */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={t("technician.workspace.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                        </div>
                    </div>
                </div>

                <TabsContent value="todo" className="mt-0">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <TaskTable tasks={tasks} />
                        <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
                    </div>
                </TabsContent>

                <TabsContent value="waiting" className="mt-0">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <TaskTable tasks={mockWaitingApprovalTasks} showResult={true} />
                        <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
                    </div>
                </TabsContent>

                <TabsContent value="redo" className="mt-0">
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <TaskTable tasks={mockRedoTasks} />
                        <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
