import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { Scan, Search, CheckCircle, Printer, FileDown, Loader2, X } from "lucide-react";
import { useAnalysesList } from "@/api/analyses";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { HandoverDocumentModal, type TechnicianGroup } from "./HandoverDocumentModal";
import { getTopAnalysisMarks } from "@/lib/utils";

interface Analysis {
    id: string;
    parameterName: string;
    protocol: string;
    location: string;
    unit: string;
    deadline: string;
    status: string;
}

interface Sample {
    id: string;
    code: string;
    name: string;
    sampleType: string;
    sampleTypeName?: string | null;
    receivedCondition: string;
    storageCondition: string;
    analyses: Analysis[];
}

interface HandoverRecord {
    testerCode: string;
    testerName: string;
    sampleCode: string;
    sample: Sample;
    handoverDate: string;
}

const mockSamples: Record<string, Sample> = {
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
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [filterTechnicianId, setFilterTechnicianId] = useState<string | null>(null);

    const { data: analysesRes, isLoading: isAnalysesLoading, refetch } = useAnalysesList({
        query: {
            analysisStatus: ["Ready"] as any,
            listOption: "full" as any,
            sortColumn: "technicianId",
            sortDirection: "DESC",
            search: debouncedSearch || undefined,
            technicianId: filterTechnicianId ? [filterTechnicianId] : undefined,
            itemsPerPage,
            page,
        },
    });

    // Ensure API is called when filter changes
    useEffect(() => {
        refetch();
    }, [filterTechnicianId, page, debouncedSearch, refetch]);

    const analysesList = analysesRes?.data ?? [];
    const meta = analysesRes?.meta;

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(analysesList.map((a: any) => a.analysisId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (checked: boolean, id: string) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, id]);
        } else {
            setSelectedIds((prev) => prev.filter((x) => x !== id));
        }
    };

    const [showBulkModal, setShowBulkModal] = useState(false);
    const [groupedData, setGroupedData] = useState<TechnicianGroup[]>([]);

    const handleBulkHandover = () => {
        if (selectedIds.length === 0) return;

        // Filter selected analyses
        const selected = analysesList.filter((a: any) => selectedIds.includes(a.analysisId));

        // Group by technicianId
        const map = new Map<string, TechnicianGroup>();
        for (const item of selected as any[]) {
            const techId = item.technician?.identityId ?? item.technicianId ?? "unknown";
            if (!map.has(techId)) {
                map.set(techId, {
                    technician: {
                        identityId: techId,
                        identityName: item.technician?.identityName ?? techId,
                        alias: item.technician?.alias ?? null,
                    },
                    analyses: [],
                });
            }
            map.get(techId)!.analyses.push(item);
        }

        setGroupedData(Array.from(map.values()));
        setShowBulkModal(true);
    };

    const handleHandoverExported = async () => {
        await refetch();
    };

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
        // Simulate QR scan
        const testerName = mockTesters[testerCode];
        if (testerName) {
            console.log("Tester found:", testerName);
        } else {
            alert("Không tìm thấy kiểm nghiệm viên");
        }
    };

    const handleScanSample = () => {
        // Simulate QR scan
        const sample = mockSamples[sampleCode];
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

            // Generate handover document content
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
        console.log("Exporting to PDF...");
        alert("Chức năng xuất PDF đang được phát triển");
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-foreground mb-2">{t("handover.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("handover.description")}</p>
            </div>

            <Tabs defaultValue="list" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="list">{t("handover.tabs.list", "Danh sách chờ bàn giao")}</TabsTrigger>
                    <TabsTrigger value="scan">{t("handover.tabs.scan", "Quét mã")}</TabsTrigger>
                </TabsList>

                {/* Tab: Analysis List */}
                <TabsContent value="list" className="space-y-6 m-0 focus-visible:outline-none">
                    <div className="bg-card rounded-lg border border-border p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">{t("handover.tabs.listTitle", "Danh sách các chỉ tiêu đủ điều kiện bàn giao")}</h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={t("handover.searchPlaceholder", "Tìm kiếm mã mẫu, tên mẫu...")}
                                            value={search}
                                            onChange={(e) => {
                                                setSearch(e.target.value);
                                                setPage(1);
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                    {filterTechnicianId && (
                                        <Badge variant="secondary" className="h-9 gap-1.5 pl-3 pr-1.5 border-primary/20 bg-primary/5 text-primary">
                                            KTV: <span className="font-bold">{filterTechnicianId}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 rounded-full p-0 hover:bg-primary/20 text-primary"
                                                onClick={() => setFilterTechnicianId(null)}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </Badge>
                                    )}
                                </div>
                                {selectedIds.length > 0 && (
                                    <Button onClick={handleBulkHandover} className="flex items-center gap-2 h-9 px-4">
                                        <CheckCircle className="h-4 w-4" />
                                        {t("handover.bulkHandover", "Bàn giao đã chọn")} ({selectedIds.length})
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isAnalysesLoading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : analysesList.length === 0 ? (
                            <div className="text-center text-muted-foreground p-8">{t("handover.emptyList", "Không có thông tin nào đang chờ bàn giao.")}</div>
                        ) : (
                            <div className="bg-background border border-border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 text-left w-10">
                                                    <Checkbox checked={analysesList.length > 0 && selectedIds.length === analysesList.length} onCheckedChange={handleSelectAll} />
                                                </th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">STT</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mã mẫu</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Chỉ tiêu</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nền mẫu</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phương pháp</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Đơn vị</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">KTV Phụ trách</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hạn trả</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Ghi chú</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Marks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {analysesList.map((item: any, index: number) => (
                                                <tr key={item.analysisId} className="hover:bg-muted/30">
                                                    <td className="px-4 py-3">
                                                        <Checkbox checked={selectedIds.includes(item.analysisId)} onCheckedChange={(checked) => handleSelectOne(checked as boolean, item.analysisId)} />
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{(page - 1) * itemsPerPage + index + 1}</td>
                                                    <td className="px-4 py-3 font-medium text-primary">{item.sampleId}</td>
                                                    <td className="px-4 py-3 font-semibold">{item.parameterName}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline">{item.sampleTypeName || item.sample?.sampleTypeName || "-"}</Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">{item.protocolCode ?? "-"}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{item.analysisUnit ?? "-"}</td>
                                                    <td 
                                                        className={`px-4 py-3 cursor-pointer transition-colors hover:bg-primary/5 ${filterTechnicianId === item.technician?.identityId ? "bg-primary/10" : ""}`}
                                                        onClick={() => {
                                                            const techId = item.technician?.identityId;
                                                            if (!techId) return;
                                                            setFilterTechnicianId(prev => prev === techId ? null : techId);
                                                            setPage(1);
                                                        }}
                                                    >
                                                        {item.technician?.identityName ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className={filterTechnicianId === item.technician?.identityId ? "font-bold text-primary" : ""}>
                                                                    {item.technician.identityName}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">({item.technician.identityId})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">{item.analysisDeadline ? new Date(item.analysisDeadline).toLocaleDateString("vi-VN") : "-"}</td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[150px]" title={item.analysisNotes}>
                                                        {item.analysisNotes ?? "-"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {getTopAnalysisMarks(item.analysisMarks).map((m) => (
                                                                <Badge key={m} variant="secondary" className="text-[10px] px-1.5 h-5 font-normal">
                                                                    {m}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {meta && (
                                    <Pagination
                                        currentPage={page}
                                        totalPages={meta.totalPages}
                                        itemsPerPage={itemsPerPage}
                                        totalItems={meta.total}
                                        onPageChange={setPage}
                                        onItemsPerPageChange={(next) => {
                                            setItemsPerPage(next);
                                            setPage(1);
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
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

            {/* Bulk Handover Document Modal (Phase 04) */}
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
