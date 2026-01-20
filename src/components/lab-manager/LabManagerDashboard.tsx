import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, XCircle, AlertCircle, Eye, MessageSquare, FileCheck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface PendingResult {
    id: string;
    sampleCode: string;
    receiptCode: string;
    parameterName: string;
    protocol: string;
    resultValue: string;
    unit: string;
    technicianName: string;
    submittedDate: string;
    notes: string;
    thresholdMin?: number;
    thresholdMax?: number;
    assessment: "pass" | "fail" | "warning";
}

interface FinalResult {
    id: string;
    receiptCode: string;
    customer: string;
    customerType: "company" | "individual";
    sampleCount: number;
    testCount: number;
    completedDate: string;
    status: "approved" | "delivered" | "complaint";
    complaintReason?: string;
    complaintDate?: string;
}

const mockPendingResults: PendingResult[] = [
    {
        id: "pr1",
        sampleCode: "TNM2501-002-S01",
        receiptCode: "TNM2501-002",
        parameterName: "E.Coli",
        protocol: "TCVN 6187-2:2009",
        resultValue: "<3",
        unit: "MPN/100mL",
        technicianName: "Nguyễn Văn A",
        submittedDate: "17/01/2026 14:30",
        notes: "Kết quả đạt tiêu chuẩn nước sinh hoạt",
        thresholdMax: 100,
        assessment: "pass",
    },
    {
        id: "pr2",
        sampleCode: "TNM2501-001-S03",
        receiptCode: "TNM2501-001",
        parameterName: "TSS",
        protocol: "SMEWW 2540D",
        resultValue: "45",
        unit: "mg/L",
        technicianName: "Nguyễn Văn A",
        submittedDate: "17/01/2026 15:20",
        notes: "",
        thresholdMax: 50,
        assessment: "pass",
    },
    {
        id: "pr3",
        sampleCode: "TNM2501-003-S01",
        receiptCode: "TNM2501-003",
        parameterName: "Pb",
        protocol: "SMEWW 3125B",
        resultValue: "0.078",
        unit: "mg/L",
        technicianName: "Phạm Thị D",
        submittedDate: "18/01/2026 09:15",
        notes: "Kết quả vượt ngưỡng cho phép",
        thresholdMax: 0.05,
        assessment: "fail",
    },
    {
        id: "pr4",
        sampleCode: "TNM2501-003-S02",
        receiptCode: "TNM2501-003",
        parameterName: "As",
        protocol: "SMEWW 3125B",
        resultValue: "0.045",
        unit: "mg/L",
        technicianName: "Phạm Thị D",
        submittedDate: "18/01/2026 09:20",
        notes: "Gần ngưỡng cho phép",
        thresholdMax: 0.05,
        assessment: "warning",
    },
];

const mockFinalResults: FinalResult[] = [
    {
        id: "fr1",
        receiptCode: "TNM2501-002",
        customer: "Cá nhân Nguyễn Văn B",
        customerType: "individual",
        sampleCount: 1,
        testCount: 2,
        completedDate: "18/01/2026",
        status: "approved",
    },
    {
        id: "fr2",
        receiptCode: "TNM2412-045",
        customer: "Công ty TNHH XYZ",
        customerType: "company",
        sampleCount: 5,
        testCount: 15,
        completedDate: "15/01/2026",
        status: "delivered",
    },
    {
        id: "fr3",
        receiptCode: "TNM2412-038",
        customer: "Công ty CP ABC",
        customerType: "company",
        sampleCount: 3,
        testCount: 9,
        completedDate: "10/01/2026",
        status: "complaint",
        complaintReason: "Khách hàng yêu cầu kiểm tra lại kết quả pH",
        complaintDate: "12/01/2026",
    },
    {
        id: "fr4",
        receiptCode: "TNM2412-042",
        customer: "Công ty TNHH DEF",
        customerType: "company",
        sampleCount: 2,
        testCount: 6,
        completedDate: "16/01/2026",
        status: "delivered",
    },
];

export function LabManagerDashboard() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("pending");
    const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});
    const [searchTerm, setSearchTerm] = useState("");

    const handleApprove = (resultId: string) => {
        console.log("Approved:", resultId);
        // In real app, this would update the database
    };

    const handleReject = (resultId: string) => {
        console.log("Rejected:", resultId, "Notes:", reviewNotes[resultId]);
        // In real app, this would update the database and notify technician
    };

    const pendingCount = mockPendingResults.length;
    const approvedCount = mockFinalResults.filter((r) => r.status === "approved").length;
    const complaintCount = mockFinalResults.filter((r) => r.status === "complaint").length;

    const filteredPendingResults = mockPendingResults.filter((result) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            result.receiptCode.toLowerCase().includes(term) ||
            result.sampleCode.toLowerCase().includes(term) ||
            result.parameterName.toLowerCase().includes(term) ||
            result.technicianName.toLowerCase().includes(term)
        );
    });

    const filteredFinalResults = mockFinalResults.filter((result) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return result.receiptCode.toLowerCase().includes(term) || result.customer.toLowerCase().includes(term);
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-background rounded-lg border border-border p-6">
                <h1 className="text-2xl font-semibold text-foreground">{t("labManager.dashboard.title")}</h1>
                <p className="text-muted-foreground mt-1">{t("labManager.dashboard.description")}</p>

                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">{t("labManager.dashboard.pending")}:</div>
                        <Badge variant="default" className="text-base bg-orange-500 hover:bg-orange-600">
                            {pendingCount}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">{t("labManager.dashboard.approved")}:</div>
                        <Badge variant="outline" className="text-base bg-green-50 text-green-700 border-green-200">
                            {approvedCount}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">{t("labManager.dashboard.complaint")}:</div>
                        <Badge variant="destructive" className="text-base">
                            {complaintCount}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-background rounded-lg border border-border p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("labManager.dashboard.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background" />
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="pending">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {t("labManager.dashboard.tabs.pending")} ({pendingCount})
                    </TabsTrigger>
                    <TabsTrigger value="final">
                        <FileCheck className="h-4 w-4 mr-2" />
                        {t("labManager.dashboard.tabs.final")} ({mockFinalResults.length})
                    </TabsTrigger>
                </TabsList>

                {/* Pending Results Tab */}
                <TabsContent value="pending" className="mt-6">
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.receiptCode")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.sampleCode")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.parameterName")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.protocol")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.result")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.assessment")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.technician")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.timestamp")}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.note")}</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredPendingResults.map((result) => (
                                        <tr key={result.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium text-foreground text-sm">{result.receiptCode}</td>
                                            <td className="px-4 py-3 text-foreground text-sm">{result.sampleCode}</td>
                                            <td className="px-4 py-3 text-foreground text-sm">{result.parameterName}</td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{result.protocol}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground text-sm">
                                                    {result.resultValue} {result.unit}
                                                </div>
                                                {(result.thresholdMin !== undefined || result.thresholdMax !== undefined) && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {t("labManager.dashboard.table.threshold")}:{" "}
                                                        {result.thresholdMin !== undefined && result.thresholdMax !== undefined
                                                            ? `${result.thresholdMin} - ${result.thresholdMax}`
                                                            : result.thresholdMax !== undefined
                                                              ? `≤ ${result.thresholdMax}`
                                                              : `≥ ${result.thresholdMin}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {result.assessment === "pass" ? (
                                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-1 w-fit">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {t("labManager.dashboard.status.pass")}
                                                    </Badge>
                                                ) : result.assessment === "fail" ? (
                                                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                        <XCircle className="h-3 w-3" />
                                                        {t("labManager.dashboard.status.fail")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1 w-fit">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {t("labManager.dashboard.status.warning")}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-foreground text-sm">{result.technicianName}</td>
                                            <td className="px-4 py-3 text-muted-foreground text-xs">{result.submittedDate}</td>
                                            <td className="px-4 py-3 max-w-xs">
                                                <div className="space-y-2">
                                                    {result.notes && <p className="text-sm text-foreground line-clamp-2">{result.notes}</p>}
                                                    <Textarea
                                                        placeholder={t("labManager.dashboard.table.notePlaceholder")}
                                                        value={reviewNotes[result.id] || ""}
                                                        onChange={(e) => setReviewNotes({ ...reviewNotes, [result.id]: e.target.value })}
                                                        className="w-full min-w-[200px] h-16 text-sm resize-none bg-background"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title={t("labManager.dashboard.table.view")}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-green-600 border-green-200 hover:bg-green-50 flex items-center gap-1"
                                                        onClick={() => handleApprove(result.id)}
                                                    >
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {t("labManager.dashboard.table.approve")}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-1"
                                                        onClick={() => handleReject(result.id)}
                                                    >
                                                        <XCircle className="h-3 w-3" />
                                                        {t("labManager.dashboard.table.reject")}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>

                {/* Final Results Tab */}
                <TabsContent value="final" className="mt-6">
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.receiptCode")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.customer")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.customerType")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.sampleCount")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.testCount")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.completedDate")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.status")}</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.view")}</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">{t("labManager.dashboard.table.actions")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredFinalResults.map((result) => (
                                        <tr key={result.id} className="hover:bg-muted/50">
                                            <td className="px-6 py-4 font-medium text-foreground">{result.receiptCode}</td>
                                            <td className="px-6 py-4 text-foreground">{result.customer}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline">
                                                    {result.customerType === "company" ? t("labManager.dashboard.customerTypes.company") : t("labManager.dashboard.customerTypes.individual")}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-center text-foreground">{result.sampleCount}</td>
                                            <td className="px-6 py-4 text-center text-foreground">{result.testCount}</td>
                                            <td className="px-6 py-4 text-foreground">{result.completedDate}</td>
                                            <td className="px-6 py-4">
                                                {result.status === "approved" ? (
                                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                        {t("labManager.dashboard.approved")}
                                                    </Badge>
                                                ) : result.status === "delivered" ? (
                                                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                                                        {t("labManager.dashboard.delivered")}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive"> {t("labManager.dashboard.complaint")}</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {result.complaintReason ? (
                                                    <div className="max-w-xs">
                                                        <div className="flex items-center gap-1 text-red-600 mb-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            <span className="text-xs font-medium">{result.complaintDate}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground line-clamp-2">{result.complaintReason}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {t("labManager.dashboard.table.view")}
                                                    </Button>
                                                    {result.status === "complaint" && (
                                                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            {t("labManager.dashboard.table.process")}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
