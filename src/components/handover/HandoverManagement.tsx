import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Scan, Search, CheckCircle, Printer, FileDown, Loader2, User, ClipboardList, Package, Mail, ShieldAlert } from "lucide-react";
import { useSamplesInPrepAssignments } from "@/api/samples";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { HandoverDocumentModal, type TechnicianGroup } from "./HandoverDocumentModal";

interface InPrepAssignmentAnalysis {
    analysisId: string;
    parameterName: string | null;
    protocolCode?: string | null;
    analysisUnit?: string | null;
    analysisDeadline?: string | null;
    analysisLocation?: string | null;
    analysisNotes?: string | null;
}

interface InPrepAssignmentSample {
    sampleId: string;
    sampleName?: string | null;
    sampleVolume?: string | null;
    analyses: InPrepAssignmentAnalysis[];
}

interface InPrepAssignment {
    technician: {
        identityId: string | null;
        identityName: string | null;
        email?: string | null;
        identityRoles?: string[] | null;
    };
    samples: InPrepAssignmentSample[];
}

interface HandoverRecord {
    testerCode: string;
    testerName: string;
    sampleCode: string;
    sample: {
        id: string;
        code: string;
        name: string;
        sampleType: string;
        sampleTypeName?: string | null;
        receivedCondition: string;
        storageCondition: string;
        analyses: Array<{
            id: string;
            parameterName: string;
            protocol: string;
            location: string;
            unit: string;
            deadline: string;
            status: string;
        }>;
    };
    handoverDate: string;
}

const mockSamples = {
    "TNM2501-001-S01": {
        id: "s1",
        code: "TNM2501-001-S01",
        name: "Mẫu nước thải điểm 1",
        sampleType: "Nước thải",
        receivedCondition: "Đạt yêu cầu",
        storageCondition: "Lạnh (4°C)",
        analyses: [
            {
                id: "a1",
                parameterName: "pH",
                protocol: "ISO 11888-1",
                location: "Lab 1",
                unit: "pH",
                deadline: "16/01/2026",
                status: "pending",
            },
            {
                id: "a2",
                parameterName: "COD",
                protocol: "ISO 6060",
                location: "Lab 2",
                unit: "mg/L",
                deadline: "17/01/2026",
                status: "pending",
            },
            {
                id: "a3",
                parameterName: "BOD",
                protocol: "ISO 5815",
                location: "Lab 3",
                unit: "mg/L",
                deadline: "18/01/2026",
                status: "pending",
            },
        ],
    },
};

const mockTesters: Record<string, string> = {
    KTV001: "Nguyễn Văn A",
    KTV002: "Trần Thị B",
    KTV003: "Lê Văn C",
};

export function HandoverManagement() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
    const [selectedAnalysisIds, setSelectedAnalysisIds] = useState<string[]>([]);

    const { data: assignments = [], isLoading, refetch } = useSamplesInPrepAssignments();

    // Client-side search & filter
    const filteredAssignments = useMemo(() => {
        if (!search.trim()) return assignments;
        const s = search.toLowerCase();

        return assignments.map(group => {
            const techName = group.technician?.identityName ?? "Chưa phân công KTV";
            const techId = group.technician?.identityId ?? "unassigned";
            const techMatch = 
                techName.toLowerCase().includes(s) || 
                techId.toLowerCase().includes(s);

            const filteredSamples = group.samples.map(sample => {
                const sampleMatch = 
                    sample.sampleId.toLowerCase().includes(s) || 
                    (sample.sampleName || "").toLowerCase().includes(s);

                const filteredAnalyses = sample.analyses.filter(analysis => {
                    return (analysis.parameterName || "").toLowerCase().includes(s) ||
                           (analysis.protocolCode || "").toLowerCase().includes(s) ||
                           (analysis.analysisLocation || "").toLowerCase().includes(s);
                });

                if (sampleMatch || filteredAnalyses.length > 0) {
                    return {
                        ...sample,
                        analyses: sampleMatch ? sample.analyses : filteredAnalyses
                    };
                }
                return null;
            }).filter((x): x is InPrepAssignmentSample => x !== null);

            if (techMatch || filteredSamples.length > 0) {
                return {
                    ...group,
                    samples: techMatch ? group.samples : filteredSamples
                };
            }
            return null;
        }).filter((x): x is InPrepAssignment => x !== null);
    }, [assignments, search]);

    // Keep track of selected tech (handling null/unassigned values gracefully)
    useEffect(() => {
        if (filteredAssignments.length > 0) {
            const ids = filteredAssignments.map(g => g.technician?.identityId ?? "unassigned");
            if (!selectedTechId || !ids.includes(selectedTechId)) {
                setSelectedTechId(filteredAssignments[0].technician?.identityId ?? "unassigned");
            }
        } else {
            setSelectedTechId(null);
        }
    }, [filteredAssignments, selectedTechId]);

    const activeGroup = filteredAssignments.find(g => (g.technician?.identityId ?? "unassigned") === selectedTechId);

    // Group items for handover modal
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [groupedData, setGroupedData] = useState<TechnicianGroup[]>([]);

    const handleBulkHandover = () => {
        if (selectedAnalysisIds.length === 0) return;

        const map = new Map<string, TechnicianGroup>();

        for (const group of assignments) {
            const tech = group.technician;
            const techId = tech?.identityId ?? "unassigned";
            for (const sample of group.samples) {
                for (const analysis of sample.analyses) {
                    if (selectedAnalysisIds.includes(analysis.analysisId)) {
                        if (!map.has(techId)) {
                            map.set(techId, {
                                technician: {
                                    identityId: techId,
                                    identityName: tech?.identityName ?? "Chưa phân công KTV",
                                    alias: null,
                                },
                                analyses: [],
                            });
                        }
                        map.get(techId)!.analyses.push({
                            analysisId: analysis.analysisId,
                            sampleId: sample.sampleId,
                            parameterName: analysis.parameterName,
                            protocolCode: analysis.protocolCode,
                            analysisUnit: analysis.analysisUnit,
                            analysisDeadline: analysis.analysisDeadline,
                            analysisLocation: analysis.analysisLocation,
                            analysisNotes: analysis.analysisNotes,
                            sampleTypeName: null,
                            sample: {
                                sampleName: sample.sampleName,
                                sampleType: null,
                                sampleTypeName: null
                            }
                        });
                    }
                }
            }
        }

        setGroupedData(Array.from(map.values()));
        setShowBulkModal(true);
    };

    const handleHandoverExported = async () => {
        setSelectedAnalysisIds([]);
        await refetch();
    };

    // Selection helper functions
    const toggleSelectAnalysis = (analysisId: string) => {
        setSelectedAnalysisIds(prev => 
            prev.includes(analysisId) ? prev.filter(id => id !== analysisId) : [...prev, analysisId]
        );
    };

    const toggleSelectSample = (sample: InPrepAssignmentSample, checked: boolean) => {
        const ids = sample.analyses.map(a => a.analysisId);
        if (checked) {
            setSelectedAnalysisIds(prev => [...new Set([...prev, ...ids])]);
        } else {
            setSelectedAnalysisIds(prev => prev.filter(id => !ids.includes(id)));
        }
    };

    const toggleSelectTech = (group: InPrepAssignment, checked: boolean) => {
        const ids: string[] = [];
        group.samples.forEach(s => s.analyses.forEach(a => ids.push(a.analysisId)));
        if (checked) {
            setSelectedAnalysisIds(prev => [...new Set([...prev, ...ids])]);
        } else {
            setSelectedAnalysisIds(prev => prev.filter(id => !ids.includes(id)));
        }
    };

    const isSampleAllSelected = (sample: InPrepAssignmentSample) => {
        return sample.analyses.every(a => selectedAnalysisIds.includes(a.analysisId));
    };

    const isSampleSomeSelected = (sample: InPrepAssignmentSample) => {
        const selectedCount = sample.analyses.filter(a => selectedAnalysisIds.includes(a.analysisId)).length;
        return selectedCount > 0 && selectedCount < sample.analyses.length;
    };

    const isTechAllSelected = (group: InPrepAssignment) => {
        const allIds: string[] = [];
        group.samples.forEach(s => s.analyses.forEach(a => allIds.push(a.analysisId)));
        if (allIds.length === 0) return false;
        return allIds.every(id => selectedAnalysisIds.includes(id));
    };

    const isTechSomeSelected = (group: InPrepAssignment) => {
        const allIds: string[] = [];
        group.samples.forEach(s => s.analyses.forEach(a => allIds.push(a.analysisId)));
        if (allIds.length === 0) return false;
        const selectedCount = allIds.filter(id => selectedAnalysisIds.includes(id)).length;
        return selectedCount > 0 && selectedCount < allIds.length;
    };

    // Calculate count of selected items for a technician
    const getTechSelectedCount = (group: InPrepAssignment) => {
        let count = 0;
        group.samples.forEach(s => {
            s.analyses.forEach(a => {
                if (selectedAnalysisIds.includes(a.analysisId)) count++;
            });
        });
        return count;
    };

    // Scanner simulated actions
    const [testerCode, setTesterCode] = useState("");
    const [sampleCode, setSampleCode] = useState("");
    const [handoverData, setHandoverData] = useState<HandoverRecord | null>(null);
    const [showHandoverDocument, setShowHandoverDocument] = useState(false);
    const [handoverDocument, setHandoverDocument] = useState({
        title: "BIÊN BẢN BÀN GIAO MẪU THỬ",
        date: new Date().toLocaleDateString("vi-VN"),
        content: "",
    });

    const handleScanTester = () => {
        const testerName = mockTesters[testerCode];
        if (testerName) {
            console.log("Tester found:", testerName);
        } else {
            alert("Không tìm thấy kiểm nghiệm viên");
        }
    };

    const handleScanSample = () => {
        const sample = mockSamples[sampleCode as keyof typeof mockSamples];
        const testerName = mockTesters[testerCode];

        if (!testerName) {
            alert("Vui lòng quét mã kiểm nghiệm viên trước");
            return;
        }

        if (sample) {
            setHandoverData({
                testerCode,
                testerName,
                sampleCode,
                sample,
                handoverDate: new Date().toLocaleString("vi-VN"),
            });

            const content = `
Căn cứ quy trình quản lý mẫu thử của Phòng thí nghiệm;
Căn cứ vào nhu cầu thực tế công việc;

Hôm nay, ngày ${new Date().toLocaleDateString("vi-VN")}, tại Phòng thí nghiệm, chúng tôi gồm:

BÊN GIAO (Người quản lý mẫu):
- Họ và tên: [Người quản lý mẫu]
- Chức vụ: Quản lý mẫu

BÊN NHẬN (Kiểm nghiệm viên):
- Họ và tên: ${testerName}
- Mã KTV: ${testerCode}

Cùng thống nhất bàn giao mẫu thử như sau:

I. THÔNG TIN MẪU THỬ:
- Mã mẫu: ${sample.code}
- Tên mẫu: ${sample.name}
- Loại mẫu: ${sample.sampleType}
- Tình trạng tiếp nhận: ${sample.receivedCondition}
- Điều kiện bảo quản: ${sample.storageCondition}

II. DANH SÁCH PHÉP THỬ CẦN THỰC HIỆN:
${sample.analyses.map((a, idx) => `${idx + 1}. ${a.parameterName} (${a.protocol}) - Vị trí: ${a.location} - Hạn: ${a.deadline}`).join("\n")}

III. CAM KẾT:
- Bên nhận cam kết thực hiện các phép thử theo đúng phương pháp quy định
- Bên nhận cam kết bảo quản mẫu đúng quy định trong quá trình thực hiện
- Bên nhận cam kết hoàn thành đúng thời hạn đã cam kết

Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.
      `.trim();

            setHandoverDocument({
                ...handoverDocument,
                content,
            });
        } else {
            alert("Không tìm thấy mẫu thử");
        }
    };

    const handleConfirmHandover = () => {
        setShowHandoverDocument(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        alert("Chức năng xuất PDF đang được phát triển");
    };

    return (
        <div className="p-6 space-y-6">
            <Tabs defaultValue="list" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
                    <TabsList>
                        <TabsTrigger value="list">{t("handover.tabs.list", "Danh sách chờ bàn giao")}</TabsTrigger>
                        <TabsTrigger value="scan">{t("handover.tabs.scan", "Quét mã QR")}</TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("handover.searchPlaceholder", "Tìm kiếm KTV, mã mẫu...")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-9"
                            />
                        </div>
                        {selectedAnalysisIds.length > 0 && (
                            <Button onClick={handleBulkHandover} className="flex items-center gap-2 h-9 px-4">
                                <CheckCircle className="h-4 w-4" />
                                {t("handover.bulkHandover", "Bàn giao đã chọn")} ({selectedAnalysisIds.length})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tab: Analysis List Grouped by KTV */}
                <TabsContent value="list" className="m-0 focus-visible:outline-none">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[500px]">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredAssignments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-border rounded-xl text-muted-foreground">
                            <ClipboardList className="h-12 w-12 mb-3 opacity-20" />
                            <p>{t("handover.emptyList", "Không có thông tin nào đang chờ bàn giao.")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-12 gap-6 items-stretch">
                            {/* Left Panel: Master list of Technicians */}
                            <div className="col-span-12 lg:col-span-4 border border-border rounded-xl bg-card flex flex-col overflow-hidden max-h-[calc(100vh-5.5rem)] lg:sticky lg:top-16">
                                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                                    <span className="font-semibold text-sm">Danh sách Kỹ thuật viên</span>
                                    <Badge variant="secondary" className="font-semibold">
                                        {filteredAssignments.length} KTV
                                    </Badge>
                                </div>
                                <div className="flex-1 overflow-y-auto divide-y divide-border">
                                    {filteredAssignments.map((group) => {
                                        const totalAnalyses = group.samples.reduce((acc, s) => acc + s.analyses.length, 0);
                                        const selectedCount = getTechSelectedCount(group);
                                        const techId = group.technician?.identityId ?? "unassigned";
                                        const isActive = selectedTechId === techId;

                                        return (
                                            <div
                                                key={techId}
                                                onClick={() => setSelectedTechId(techId)}
                                                className={`p-4 cursor-pointer transition-colors flex items-start gap-3 hover:bg-muted/40 ${
                                                    isActive ? "bg-primary/5 border-l-4 border-primary" : "pl-5"
                                                }`}
                                            >
                                                <div className="flex items-center mt-1">
                                                    <Checkbox
                                                        disabled={group.technician?.identityId === null}
                                                        checked={isTechSomeSelected(group) ? "indeterminate" : isTechAllSelected(group)}
                                                        onCheckedChange={(checked) => toggleSelectTech(group, checked as boolean)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className={`font-semibold text-sm truncate ${isActive ? "text-primary" : ""}`}>
                                                            {group.technician?.identityName ?? "Chưa phân công KTV"}
                                                        </p>
                                                        <Badge variant={selectedCount > 0 ? "default" : "outline"} className="text-[10px] ml-2 shrink-0">
                                                            {selectedCount > 0 ? `${selectedCount}/${totalAnalyses}` : totalAnalyses} CT
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                                                        ID: {group.technician?.identityId ?? "N/A"}
                                                    </p>
                                                    {group.technician?.email && (
                                                        <p className="text-xs text-muted-foreground/80 mt-1 flex items-center gap-1 truncate">
                                                            <Mail className="h-3 w-3 shrink-0" />
                                                            {group.technician?.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Panel: Detail view of selected Technician */}
                            <div className="col-span-12 lg:col-span-8 border border-border rounded-xl bg-card p-6 flex flex-col min-h-[500px]">
                                {activeGroup ? (
                                    <div className="space-y-6 flex-1 flex flex-col">
                                        {/* KTV Header */}
                                        <div className="border-b border-border pb-4 flex justify-between items-start gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-5 w-5 text-primary" />
                                                    <h3 className="font-bold text-lg text-foreground">{activeGroup.technician?.identityName ?? "Chưa phân công KTV"}</h3>
                                                    {activeGroup.technician?.identityId && (
                                                        <Badge variant="secondary" className="text-xs font-mono">{activeGroup.technician?.identityId}</Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                                                    {activeGroup.technician?.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3.5 w-3.5" />
                                                            {activeGroup.technician?.email}
                                                        </span>
                                                    )}
                                                    {activeGroup.technician?.identityRoles && activeGroup.technician?.identityRoles.length > 0 && (
                                                        <span className="border-l border-border pl-2">
                                                            Vai trò: {activeGroup.technician?.identityRoles.join(", ")}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="select-all-tech"
                                                    disabled={activeGroup.technician?.identityId === null}
                                                    checked={isTechSomeSelected(activeGroup) ? "indeterminate" : isTechAllSelected(activeGroup)}
                                                    onCheckedChange={(checked) => toggleSelectTech(activeGroup, checked as boolean)}
                                                />
                                                <Label htmlFor="select-all-tech" className="text-xs font-medium cursor-pointer">
                                                    Chọn tất cả cho KTV này
                                                </Label>
                                            </div>
                                        </div>

                                        {activeGroup.technician?.identityId === null && (
                                            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4 shrink-0" />
                                                <span>Các chỉ tiêu này chưa được phân công kỹ thuật viên phụ trách. Vui lòng phân công KTV tại giao diện Phân công trước khi thực hiện bàn giao.</span>
                                            </div>
                                        )}

                                        {/* Samples List */}
                                        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                                            {activeGroup.samples.map((sample) => (
                                                <div key={sample.sampleId} className="border border-border rounded-xl overflow-hidden bg-background">
                                                    {/* Sample Card Title */}
                                                    <div className="bg-muted/30 px-4 py-3 border-b border-border flex justify-between items-center gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={isSampleSomeSelected(sample) ? "indeterminate" : isSampleAllSelected(sample)}
                                                                onCheckedChange={(checked) => toggleSelectSample(sample, checked as boolean)}
                                                            />
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="font-bold text-sm text-primary">{sample.sampleId}</span>
                                                                {sample.sampleName && (
                                                                    <span className="text-xs text-muted-foreground">({sample.sampleName})</span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {sample.sampleVolume && (
                                                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                                                                <Package className="h-3 w-3" />
                                                                {sample.sampleVolume}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {/* Analyses Table */}
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-muted/10 border-b border-border text-muted-foreground font-semibold">
                                                                <tr>
                                                                    <th className="px-4 py-2.5 text-left w-10"></th>
                                                                    <th className="px-4 py-2.5 text-left w-12">STT</th>
                                                                    <th className="px-4 py-2.5 text-left">Chỉ tiêu</th>
                                                                    <th className="px-4 py-2.5 text-left">Phương pháp</th>
                                                                    <th className="px-4 py-2.5 text-left">Đơn vị</th>
                                                                    <th className="px-4 py-2.5 text-left">Hạn trả</th>
                                                                    <th className="px-4 py-2.5 text-left">Nơi thực hiện</th>
                                                                    <th className="px-4 py-2.5 text-left">Ghi chú</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {sample.analyses.map((analysis, index) => (
                                                                    <tr key={analysis.analysisId} className="hover:bg-muted/10">
                                                                        <td className="px-4 py-2.5">
                                                                            <Checkbox
                                                                                checked={selectedAnalysisIds.includes(analysis.analysisId)}
                                                                                onCheckedChange={() => toggleSelectAnalysis(analysis.analysisId)}
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                                                                        <td className="px-4 py-2.5 font-bold">{analysis.parameterName}</td>
                                                                        <td className="px-4 py-2.5 text-muted-foreground">{analysis.protocolCode ?? "-"}</td>
                                                                        <td className="px-4 py-2.5 text-muted-foreground">{analysis.analysisUnit ?? "-"}</td>
                                                                        <td className="px-4 py-2.5">
                                                                            {analysis.analysisDeadline 
                                                                                ? new Date(analysis.analysisDeadline).toLocaleDateString("vi-VN") 
                                                                                : "-"
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            {analysis.analysisLocation ? (
                                                                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                                                                                    {analysis.analysisLocation}
                                                                                </Badge>
                                                                            ) : "-"}
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-muted-foreground italic truncate max-w-[120px]" title={analysis.analysisNotes ?? ""}>
                                                                            {analysis.analysisNotes ?? "-"}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                        <ShieldAlert className="h-12 w-12 mb-3 opacity-20" />
                                        <p>Vui lòng chọn Kỹ thuật viên từ danh sách bên trái để quản lý bàn giao.</p>
                                    </div>
                                )}
							</div>
                        </div>
                    )}
                </TabsContent>

                {/* Tab: Scanner */}
                <TabsContent value="scan" className="space-y-6 m-0 focus-visible:outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tester Scan */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <Label className="text-sm text-muted-foreground mb-2 block">{t("handover.scanTester")}</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("handover.placeholder.tester")}
                                        value={testerCode}
                                        onChange={(e) => setTesterCode(e.target.value)}
                                        className="pl-10 bg-background"
                                        onKeyPress={(e) => e.key === "Enter" && handleScanTester()}
                                    />
                                </div>
                                <Button onClick={handleScanTester} variant="outline">
                                    <Scan className="h-4 w-4" />
                                </Button>
                            </div>
                            {testerCode && mockTesters[testerCode] && (
                                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <div>
                                            <div className="font-medium text-foreground">{mockTesters[testerCode]}</div>
                                            <div className="text-sm text-muted-foreground">ID: {testerCode}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sample Scan */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <Label className="text-sm text-muted-foreground mb-2 block">{t("handover.scanSample")}</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={t("handover.placeholder.sample")}
                                        value={sampleCode}
                                        onChange={(e) => setSampleCode(e.target.value)}
                                        className="pl-10 bg-background"
                                        onKeyPress={(e) => e.key === "Enter" && handleScanSample()}
                                    />
                                </div>
                                <Button onClick={handleScanSample} variant="outline">
                                    <Scan className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Handover Information */}
                    {handoverData && (
                        <div className="bg-card rounded-lg border border-border overflow-hidden">
                            <div className="p-6 border-b border-border bg-blue-50 dark:bg-blue-900/10">
                                <h3 className="font-semibold text-foreground flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    {t("handover.info.title")}
                                </h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Handover Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm text-muted-foreground">{t("handover.info.tester")}</Label>
                                        <div className="mt-1 font-medium text-foreground">{handoverData.testerName}</div>
                                        <div className="text-sm text-muted-foreground">ID: {handoverData.testerCode}</div>
                                    </div>
                                    <div>
                                        <Label className="text-sm text-muted-foreground">{t("handover.info.date")}</Label>
                                        <div className="mt-1 font-medium text-foreground">{handoverData.handoverDate}</div>
                                    </div>
                                </div>

                                {/* Sample Information */}
                                <div>
                                    <h4 className="font-semibold text-foreground mb-3">{t("handover.info.sampleTitle")}</h4>
                                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label className="text-sm text-muted-foreground">{t("handover.info.sampleCode")}</Label>
                                                <div className="mt-1 font-medium text-blue-600 dark:text-blue-400">{handoverData.sample.code}</div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground">{t("handover.info.sampleName")}</Label>
                                                <div className="mt-1 text-foreground">{handoverData.sample.name}</div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground">{t("handover.info.sampleType")}</Label>
                                                <div className="mt-1">
                                                    <Badge variant="outline" className="text-foreground border-border">
                                                        {handoverData.sample.sampleTypeName || "-"}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground">{t("handover.info.receivedCondition")}</Label>
                                                <div className="mt-1 text-foreground">{handoverData.sample.receivedCondition}</div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <Label className="text-sm text-muted-foreground">{t("handover.info.storageCondition")}</Label>
                                                <div className="mt-1 text-foreground">{handoverData.sample.storageCondition}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Analyses to Perform */}
                                <div>
                                    <h4 className="font-semibold text-foreground mb-3">{t("handover.info.analysisList")}</h4>
                                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                                        <table className="w-full">
                                            <thead className="bg-muted/50 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.stt")}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.parameter")}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.protocol")}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.location")}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.unit")}</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("handover.table.deadline")}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {handoverData.sample.analyses.map((analysis, index) => (
                                                    <tr key={analysis.id} className="hover:bg-accent/30 transition-colors">
                                                        <td className="px-4 py-3 text-sm text-foreground">{index + 1}</td>
                                                        <td className="px-4 py-3 text-sm font-medium text-foreground">{analysis.parameterName}</td>
                                                        <td className="px-4 py-3 text-xs text-muted-foreground">{analysis.protocol}</td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="outline" className="text-xs border-border text-foreground">
                                                                {analysis.location}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-foreground">{analysis.unit}</td>
                                                        <td className="px-4 py-3 text-sm text-foreground">{analysis.deadline}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Confirm Button */}
                                <div className="flex items-center justify-end">
                                    <Button onClick={handleConfirmHandover} className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        {t("handover.confirm")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Bulk Handover Document Modal */}
            {showBulkModal && groupedData.length > 0 && (
                <HandoverDocumentModal 
                    groups={groupedData} 
                    onClose={() => setShowBulkModal(false)} 
                    onExportSuccess={handleHandoverExported} 
                />
            )}

            {/* Handover Document Modal (Legacy - Scan Tab) */}
            {showHandoverDocument && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowHandoverDocument(false)}></div>
                    <div className="fixed inset-4 bg-background rounded-lg shadow-xl z-50 flex flex-col border border-border">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">{t("handover.document.title")}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{t("handover.document.description")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                                    <Printer className="h-4 w-4" />
                                    {t("handover.document.print")}
                                </Button>
                                <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
                                    <FileDown className="h-4 w-4" />
                                    {t("handover.document.exportPDF")}
                                </Button>
                                <Button variant="ghost" onClick={() => setShowHandoverDocument(false)}>
                                    {t("handover.document.close")}
                                </Button>
                            </div>
                        </div>

                        {/* Document Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-muted/20">
                            <div className="max-w-4xl mx-auto bg-white text-black border rounded-lg p-8 space-y-4">
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold">{handoverDocument.title}</h1>
                                    <p className="text-sm mt-2">Ngày {handoverDocument.date}</p>
                                </div>
                                <Textarea
                                    value={handoverDocument.content}
                                    onChange={(e) => setHandoverDocument({ ...handoverDocument, content: e.target.value })}
                                    className="min-h-[600px] font-mono text-sm border-0 focus-visible:ring-0 resize-none bg-transparent"
                                />
                                <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-gray-200">
                                    <div className="text-center">
                                        <div className="font-semibold">BÊN GIAO</div>
                                        <div className="text-sm mt-1">(Ký, ghi rõ họ tên)</div>
                                        <div className="mt-20 border-t border-gray-300 pt-2">
                                            <div className="text-sm">[Người quản lý mẫu]</div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="font-semibold">BÊN NHẬN</div>
                                        <div className="text-sm mt-1">(Ký, ghi rõ họ tên)</div>
                                        <div className="mt-20 border-t border-gray-300 pt-2">
                                            <div className="text-sm">{handoverData?.testerName}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
