import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSerialBalance } from "@/contexts/SerialBalanceContext";
import { 
    Scale, 
    Trash2, 
    Download, 
    AlertTriangle, 
    Cpu, 
    FileSpreadsheet, 
    Settings, 
    RefreshCw, 
    Check, 
    Info,
    Barcode,
    QrCode,
    X,
    History,
    ChevronUp,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQrScanner } from "@/hooks/useQrScanner";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalyticaBalances, useCreateEquipmentLog, useEquipmentLogsList } from "@/api/equipments";
import api from "@/api/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";

export function AnalyticalBalanceStreamer() {
    const { t } = useTranslation();
    const { user } = useAuth();

    const formatActionTime = (isoString?: string) => {
        if (!isoString) return "-";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return "-";
        const pad = (n: number) => String(n).padStart(2, "0");
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        const ss = pad(d.getSeconds());
        const dd = pad(d.getDate());
        const mo = pad(d.getMonth() + 1);
        const yyyy = d.getFullYear();
        return `${hh}:${mm}:${ss} ${dd}/${mo}/${yyyy}`;
    };
    const {
        isSupported,
        isConnected,
        isConnecting,
        latestReading,
        readingsList,
        config,
        activeSampleId,
        setActiveSampleId,
        connect,
        disconnect,
        updateConfig,
        clearReadings
    } = useSerialBalance();

    const { data: balances = [] } = useAnalyticaBalances();
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
    const createLogMutation = useCreateEquipmentLog();

    const lastLoggedIdRef = useRef<string | null>(null);

    // History log modal states
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyItemsPerPage, setHistoryItemsPerPage] = useState(10);
    const [historySearch, setHistorySearch] = useState("");
    const [startDate, setStartDate] = useState(() => new Date().toLocaleDateString("en-CA"));
    const [endDate, setEndDate] = useState(() => new Date().toLocaleDateString("en-CA"));
    const [sortColumn, setSortColumn] = useState("actionTime");
    const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("DESC");

    const historyOtherFilters = useMemo(() => {
        if (startDate && endDate) {
            return [
                {
                    filterFrom: "actionTime",
                    filterValues: [`BETWEEN '${startDate} 00:00:00' AND '${endDate} 23:59:59'`]
                }
            ];
        } else if (startDate) {
            return [
                {
                    filterFrom: "actionTime",
                    filterValues: [`>= '${startDate} 00:00:00'`]
                }
            ];
        } else if (endDate) {
            return [
                {
                    filterFrom: "actionTime",
                    filterValues: [`<= '${endDate} 23:59:59'`]
                }
            ];
        }
        return [];
    }, [startDate, endDate]);

    const handleHistorySort = (col: string) => {
        if (sortColumn === col) {
            setSortDirection(prev => prev === "ASC" ? "DESC" : "ASC");
        } else {
            setSortColumn(col);
            setSortDirection("DESC");
        }
        setHistoryPage(1);
    };

    const renderHistorySortableHeader = (label: string, col: string, className?: string) => {
        const isSorted = sortColumn === col;
        return (
            <th 
                className={`cursor-pointer select-none hover:bg-muted/70 px-3 ${className || ""}`} 
                onClick={() => handleHistorySort(col)}
            >
                <div className="flex items-center gap-1 justify-center sm:justify-start">
                    <span>{label}</span>
                    {isSorted && (
                        sortDirection === "ASC" ? <ChevronUp className="w-3.5 h-3.5 text-primary" /> : <ChevronDown className="w-3.5 h-3.5 text-primary" />
                    )}
                </div>
            </th>
        );
    };

    const { data: logsRes, isLoading: isLogsLoading } = useEquipmentLogsList({
        page: historyPage,
        itemsPerPage: historyItemsPerPage,
        search: historySearch || undefined,
        equipmentId: selectedEquipmentId || undefined,
        sortColumn,
        sortDirection,
        otherFilters: historyOtherFilters as any
    });

    const logsList = logsRes?.data ?? [];
    const totalItems = logsRes?.meta?.total ?? 0;
    const totalPages = Math.ceil(totalItems / historyItemsPerPage);

    const handleExportPdf = async () => {
        toast.promise(
            (async () => {
                const rowsHtml = logsList.map((log, index) => {
                    const rowSTT = (historyPage - 1) * historyItemsPerPage + index + 1;
                    const dataObj = log.equipmentLogData || {};
                    const opId = dataObj.identityId || log.createdById || "-";
                    const opName = dataObj.identityName || "-";
                    const smpId = dataObj.sampleId || log.commonKeys?.[0] || "-";
                    const rawData = dataObj.raw || "-";
                    const valStr = dataObj.value !== undefined && dataObj.value !== null ? dataObj.value : "-";
                    const unitStr = dataObj.unit || "-";
                    const stableText = dataObj.isStable ?? true ? "Ổn định" : "Biến động";

                    return `
                        <tr>
                            <td style="text-align: center; border: 1px solid black; padding: 6px;">${rowSTT}</td>
                            <td style="border: 1px solid black; padding: 6px;">${formatActionTime(log.actionTime)}</td>
                            <td style="border: 1px solid black; padding: 6px; font-family: monospace;">${opId}</td>
                            <td style="border: 1px solid black; padding: 6px;">${opName}</td>
                            <td style="border: 1px solid black; padding: 6px; font-weight: bold; color: #059669;">${smpId}</td>
                            <td style="border: 1px solid black; padding: 6px; font-family: monospace;">${rawData}</td>
                            <td style="text-align: right; border: 1px solid black; padding: 6px; font-weight: bold;">${valStr}</td>
                            <td style="text-align: center; border: 1px solid black; padding: 6px;">${unitStr}</td>
                            <td style="text-align: center; border: 1px solid black; padding: 6px;">${stableText}</td>
                        </tr>
                    `;
                }).join("");

                const todayStr = new Date().toLocaleDateString("vi-VN");

                const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            width: 792px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            font-family: "Times New Roman", Times, serif;
            font-size: 10pt;
            line-height: 1.3;
            color: #000;
        }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
        .data-table th, .data-table td { border: 1px solid black; padding: 5px; vertical-align: middle; word-wrap: break-word; font-size: 9.5pt; }
        .data-table th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
        tr { page-break-inside: avoid; break-inside: avoid; }
        thead { display: table-header-group; }
        .text-center { text-align: center; }
    </style>
</head>
<body>
    <table style="width: 100%; border: none; border-collapse: collapse;">
        <thead>
            <tr>
                <td style="border: none; padding: 0;">
                    <!-- A4 Header Section -->
                    <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 20px;">
                        <tr>
                            <td style="width: 110px; border: 1px solid black; text-align: center; vertical-align: middle; padding: 10px;">
                                <img src="https://cdn.nhanlucnganhluat.vn/uploads/images/326A5071/logo/2024-10/IRDOP-LOGO-2710-02-2.png" alt="Logo" style="max-width: 60px; height: auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                                <div style="display: none; font-size: 20px; font-weight: bold; color: #3b82f6;">INRD</div>
                            </td>
                            <td style="border: 1px solid black; text-align: center; vertical-align: middle; padding: 10px;">
                                <div style="font-size: 10pt; text-transform: uppercase; font-weight: bold;">VIỆN NGHIÊN CỨU & PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN</div>
                                <div style="font-size: 10pt; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">PHÒNG PHÂN TÍCH - KIỂM NGHIỆM</div>
                                <div style="font-size: 12pt; font-weight: bold; color: #111; margin-top: 5px;">NHẬT KÝ SỬ DỤNG CÂN PHÂN TÍCH</div>
                            </td>
                            <td style="width: 190px; border: 1px solid black; padding: 8px; font-size: 8.5pt; line-height: 1.4;">
                                <div>Mã hiệu: BM-NKC-01</div>
                                <div>Ngày in: ${todayStr}</div>
                                <div>Cân: ${selectedEquipmentId || "Chưa chọn"}</div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="border: none; padding: 0;">
                    <!-- Main Content Table -->
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th style="width: 45px;">STT</th>
                                <th style="width: 140px;">Thời gian</th>
                                <th style="width: 80px;">Mã NV</th>
                                <th style="width: 110px;">Họ tên</th>
                                <th style="width: 90px;">Mã mẫu</th>
                                <th style="width: 100px;">Dữ liệu gốc</th>
                                <th style="width: 70px;">Giá trị</th>
                                <th style="width: 50px;">Đơn vị</th>
                                <th style="width: 85px;">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml || `<tr><td colspan="9" style="text-align: center; padding: 20px;">Không có dữ liệu nhật ký sử dụng cân</td></tr>`}
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>
                `;

                const blob = await api.postRaw<Blob>("/v2/convert-html-to-pdf/form-3", {
                    body: { html },
                    responseType: "blob",
                });

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `NhatKyCanPhanTich_${new Date().getTime()}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            })(),
            {
                loading: "Đang chuyển đổi và tải file PDF...",
                success: "Tải xuống file PDF thành công!",
                error: "Lỗi khi tạo file PDF."
            }
        );
    };

    console.log("AnalyticalBalanceStreamer - balances list:", balances);
    console.log("AnalyticalBalanceStreamer - selectedEquipmentId:", selectedEquipmentId);

    useEffect(() => {
        if (balances.length > 0 && !selectedEquipmentId) {
            const firstId = balances[0].equipmentId || balances[0].id || balances[0].equipment_id || "";
            if (firstId) {
                setSelectedEquipmentId(firstId);
            }
        }
    }, [balances, selectedEquipmentId]);

    // Automatically create a log entry on the backend as soon as a new reading is received
    useEffect(() => {
        if (latestReading && latestReading.id !== lastLoggedIdRef.current) {
            lastLoggedIdRef.current = latestReading.id;

            if (selectedEquipmentId && selectedEquipmentId !== "none") {
                const sampleIdVal = activeSampleId || latestReading.sampleId || "";
                createLogMutation.mutate({
                    equipmentId: selectedEquipmentId,
                    equipmentLogType: "Usage",
                    equipmentLogDescription: `Số liệu cân trực tiếp: ${latestReading.value !== null ? latestReading.value.toFixed(4) : "-"} ${latestReading.unit} (Mẫu: ${sampleIdVal || "Không có"})`,
                    equipmentLogLocation: "Phòng thí nghiệm",
                    commonKeys: sampleIdVal ? [sampleIdVal] : [],
                    equipmentLogData: {
                        raw: latestReading.raw,
                        value: latestReading.value,
                        unit: latestReading.unit,
                        sampleId: sampleIdVal,
                        identityId: latestReading.identityId || user?.identityId,
                        identityName: latestReading.identityName || user?.identityName,
                        isStable: latestReading.isStable
                    },
                    actionTime: new Date().toISOString()
                });
            }
        }
    }, [latestReading, selectedEquipmentId, user, activeSampleId]);

    // Auto capture QR/Barcode scanner globally when the tab is active
    useQrScanner((scannedValue) => {
        if (scannedValue.toUpperCase().startsWith("SP")) {
            setActiveSampleId(scannedValue);
            toast.success(`Đã nhận mã mẫu từ máy quét: ${scannedValue}`);
        }
    }, { enabled: true });

    const handleExportCSV = async () => {
        if (readingsList.length === 0) {
            toast.error(t("common.noData", { defaultValue: "Không có dữ liệu để xuất" }));
            return;
        }

        try {
            // Build CSV rows
            const headers = [
                "STT",
                "Thời gian",
                "Mã Nhân viên",
                "Họ tên",
                "Mã mẫu",
                "Dữ liệu gốc",
                "Giá trị",
                "Đơn vị",
                "Trạng thái"
            ];
            const rows = readingsList.map((r, idx) => [
                String(readingsList.length - idx),
                r.time,
                `"${(r.identityId || user?.identityId || "").replace(/"/g, '""')}"`,
                `"${(r.identityName || user?.identityName || "").replace(/"/g, '""')}"`,
                r.sampleId ? `"${r.sampleId.replace(/"/g, '""')}"` : "",
                `"${r.raw.replace(/"/g, '""')}"`,
                r.value !== null ? String(r.value) : "",
                r.unit,
                r.isStable ? "Stable" : "Unstable"
            ]);

            const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Balance_Streamer_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(t("common.toast.success", { defaultValue: "Xuất file thành công!" }));

            // Auto-create log in backend for each row exported
            if (selectedEquipmentId && selectedEquipmentId !== "none") {
                toast.promise(
                    (async () => {
                        for (const r of readingsList) {
                            await createLogMutation.mutateAsync({
                                equipmentId: selectedEquipmentId,
                                equipmentLogType: "Usage",
                                equipmentLogDescription: `Xuất số liệu cân: ${r.value !== null ? r.value.toFixed(4) : "-"} ${r.unit} (Mẫu: ${r.sampleId || "Không có"})`,
                                equipmentLogLocation: "Phòng thí nghiệm",
                                commonKeys: r.sampleId ? [r.sampleId] : [],
                                equipmentLogData: {
                                    raw: r.raw,
                                    value: r.value,
                                    unit: r.unit,
                                    sampleId: r.sampleId,
                                    identityId: r.identityId || user?.identityId,
                                    identityName: r.identityName || user?.identityName,
                                    isStable: r.isStable
                                },
                                actionTime: new Date().toISOString()
                            });
                        }
                    })(),
                    {
                        loading: "Đang lưu nhật ký vận hành cân lên hệ thống...",
                        success: "Đã lưu nhật ký vận hành cân thành công!",
                        error: "Gặp lỗi khi lưu nhật ký vận hành cân."
                    }
                );
            } else {
                toast.warning("Chưa cấu hình hoặc chọn thiết bị cân, hệ thống sẽ bỏ qua việc tạo nhật ký thiết bị.");
            }
        } catch (e) {
            console.error("Export CSV error:", e);
            toast.error(t("common.toast.failed", { defaultValue: "Xuất file thất bại!" }));
        }
    };

    if (!isSupported) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-lg shadow-sm max-w-2xl mx-auto space-y-6 text-center mt-8">
                <div className="p-4 bg-destructive/10 text-destructive rounded-full">
                    <AlertTriangle className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">
                        {String(t("technician.workspace.balance.notSupported", { 
                            defaultValue: "Trình duyệt không hỗ trợ Web Serial API" 
                        }))}
                    </h2>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                        Web Serial API yêu cầu trình duyệt nhân Chromium hiện đại (Google Chrome, Microsoft Edge, Opera) 
                        và ứng dụng phải chạy qua kết nối bảo mật **HTTPS** hoặc **localhost**.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button variant="outline" onClick={() => window.open("https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility", "_blank")}>
                        <Info className="w-4 h-4 mr-2" />
                        Tìm hiểu thêm
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tải lại trang
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-0 bg-background h-[calc(100vh-220px)] lg:h-[calc(100vh-220px)] overflow-hidden pb-4">
            {/* Left Column: Control Panel & Live LED */}
            <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0 overflow-y-auto max-h-full pr-1 pb-2">
                {/* Real-time LED Weight Display */}
                <div className="bg-neutral-950 border border-neutral-800 text-neutral-50 rounded-xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[240px] h-auto">
                    {/* Futuristic grid background decoration */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:1rem_1rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />
                    
                    <div className="flex justify-between items-center z-10 mb-2">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1.5">
                            <Cpu className="w-3 h-3 text-emerald-500 animate-pulse" />
                            {String(t("technician.workspace.balance.latestWeight", { defaultValue: "Khối lượng từ Cân" }))}
                        </span>
                        {isConnected && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                latestReading?.isStable 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${latestReading?.isStable ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
                                {latestReading?.isStable 
                                    ? String(t("technician.workspace.balance.stable", { defaultValue: "ỔN ĐỊNH" })) 
                                    : String(t("technician.workspace.balance.unstable", { defaultValue: "BIẾN ĐỘNG" }))}
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline justify-end font-mono select-all z-10 py-2">
                        {isConnected ? (
                            latestReading ? (
                                <>
                                    <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight transition-all duration-75">
                                        {latestReading.value !== null ? latestReading.value.toFixed(4) : "0.0000"}
                                    </span>
                                    <span className="text-xl font-medium text-emerald-500 ml-2 select-none">
                                        {latestReading.unit}
                                    </span>
                                </>
                            ) : (
                                <span className="text-3xl text-neutral-600 font-bold tracking-widest animate-pulse">
                                    READY...
                                </span>
                            )
                        ) : (
                            <span className="text-3xl text-neutral-700 font-bold tracking-widest uppercase">
                                OFFLINE
                            </span>
                        )}
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-neutral-300 font-semibold font-mono z-10 border-t border-neutral-850 pt-2 pb-2">
                        <span>TIME: {latestReading?.time ?? "--:--:--.---"}</span>
                        <span className="truncate max-w-[190px]" title={latestReading?.raw}>RAW: {latestReading?.raw ?? "-"}</span>
                    </div>

                    {/* Integrated Connection Panel inside LED Display Box */}
                    <div className="grid grid-cols-2 gap-3 z-10 mt-2 pt-2 border-t border-neutral-850">
                        {/* Baudrate Select Box */}
                        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded px-2 h-8">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 mr-2 shrink-0">Baud:</span>
                            <Select 
                                value={String(config.baudRate)} 
                                onValueChange={(v) => updateConfig({ baudRate: parseInt(v) })}
                                disabled={isConnected || isConnecting}
                            >
                                <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-xs font-bold focus:ring-0 shadow-none text-emerald-400 focus-visible:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-950 border-neutral-800 text-neutral-200">
                                    <SelectItem value="4800">4800 bps</SelectItem>
                                    <SelectItem value="9600">9600 bps</SelectItem>
                                    <SelectItem value="19200">19200 bps</SelectItem>
                                    <SelectItem value="38400">38400 bps</SelectItem>
                                    <SelectItem value="115200">115200 bps</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Connection Button */}
                        <Button 
                            onClick={isConnected ? disconnect : connect} 
                            disabled={isConnecting}
                            size="sm"
                            className={`h-8 text-xs font-bold shadow-sm tracking-wide border-0 transition-colors ${
                                isConnected 
                                    ? "bg-red-600 hover:bg-red-700 text-white" 
                                    : isConnecting 
                                        ? "bg-amber-600 text-white animate-pulse" 
                                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                        >
                            {isConnecting ? (
                                <>
                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                    Connecting...
                                </>
                            ) : isConnected ? (
                                <>
                                    <Scale className="w-3 h-3 mr-1" />
                                    DISCONNECT
                                </>
                            ) : (
                                <>
                                    <Scale className="w-3 h-3 mr-1" />
                                    CONNECT
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Barcode Scanner Input */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3.5 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border pb-2.5">
                        <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-semibold text-sm text-foreground">Đầu đọc Mã mẫu (Barcode)</h3>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="barcodeInput" className="text-xs text-muted-foreground">
                            Quét mã vạch mẫu (khi ở Tab này) hoặc nhập thủ công:
                        </Label>
                        <div className="relative">
                            <Input
                                id="barcodeInput"
                                placeholder="Nhập/Quét mã mẫu ở đây..."
                                value={activeSampleId}
                                onChange={(e) => setActiveSampleId(e.target.value)}
                                className="pr-10 h-9 text-xs bg-background"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                                {activeSampleId ? (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => setActiveSampleId("")}
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground p-0"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </Button>
                                ) : (
                                    <Barcode className="w-4 h-4 text-muted-foreground animate-pulse" />
                                )}
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Dữ liệu cân từ serial sẽ tự động gắn với mã mẫu đang hiển thị.
                        </p>
                    </div>
                </div>

                {/* Connection Controls & Config */}
                <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-5 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Settings className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm text-foreground">
                            {String(t("technician.workspace.balance.settings", { defaultValue: "Cấu hình kết nối" }))}
                        </h3>
                    </div>

                    {/* Balance Device Selector */}
                    <div className="space-y-1.5">
                        <Label htmlFor="balanceDeviceSelect" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Thiết bị Cân phân tích
                        </Label>
                        <Select
                            value={selectedEquipmentId}
                            onValueChange={setSelectedEquipmentId}
                        >
                            <SelectTrigger id="balanceDeviceSelect" className="h-9 w-full bg-background border-border text-xs">
                                <SelectValue placeholder="Chọn cân phân tích..." />
                            </SelectTrigger>
                            <SelectContent>
                                {balances.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                        Không tìm thấy thiết bị
                                    </SelectItem>
                                ) : (
                                    balances.map((b) => (
                                        <SelectItem key={b.equipmentId} value={b.equipmentId}>
                                            {b.equipmentName} ({b.equipmentId})
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Active Operator */}
                    <div className="bg-muted/45 p-3 rounded-lg border border-border/60 text-xs space-y-1">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Người vận hành thiết bị</span>
                        <div className="flex justify-between items-center mt-1">
                            <span className="font-bold text-foreground">{user?.identityName ?? "N/A"}</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border font-mono text-muted-foreground">{user?.identityId ?? "N/A"}</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Right Column: Excel Data Streamer Sheet */}
            <div className="flex-1 min-w-0 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden max-h-full">
                {/* Sheet Tool Bar */}
                <div className="p-3 border-b border-border bg-muted/20 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded">
                            <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-foreground tracking-wide">
                            {String(t("technician.workspace.balance.liveStream", { defaultValue: "Bảng dữ liệu Excel Data Streamer" }))}
                        </span>
                        <span className="text-[10px] bg-muted border border-border/80 text-muted-foreground px-2 py-0.5 rounded font-mono font-semibold">
                            ROWS: {readingsList.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowHistoryModal(true)} 
                            className="text-xs h-8 bg-background border-primary/20 hover:bg-primary/5 text-primary"
                        >
                            <History className="w-3.5 h-3.5 mr-1.5" />
                            Xem lịch sử cân
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={clearReadings} 
                            disabled={readingsList.length === 0}
                            className="text-xs h-8 bg-background"
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1.5 text-destructive" />
                            {String(t("technician.workspace.balance.clearData", { defaultValue: "Xoá dòng" }))}
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleExportCSV} 
                            disabled={readingsList.length === 0}
                            className="text-xs h-8 bg-background border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                        >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            {String(t("technician.workspace.balance.exportCsv", { defaultValue: "Xuất CSV" }))}
                        </Button>
                    </div>
                </div>

                {/* Excel Styled Sheet Table */}
                <div className="flex-1 overflow-auto font-mono text-xs relative select-text min-h-[300px]">
                    <table className="w-full border-collapse border-spacing-0 table-fixed">
                        {/* Excel Header: Column letters */}
                        <thead className="bg-muted/70 text-center select-none sticky top-0 z-20 border-b border-border shadow-xs">
                            <tr>
                                <th className="w-12 bg-muted border-r border-b border-border h-6 text-[10px] text-muted-foreground font-semibold flex-none leading-6">
                                    {/* Top-left corner box */}
                                </th>
                                <th className="w-[120px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">A (TIME)</th>
                                <th className="w-[110px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">B (MÃ NV)</th>
                                <th className="w-[135px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">C (HỌ TÊN)</th>
                                <th className="w-[130px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">D (SAMPLE ID)</th>
                                <th className="w-[170px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">E (RAW DATA)</th>
                                <th className="w-[100px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">F (VALUE)</th>
                                <th className="w-[60px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">G (UNIT)</th>
                                <th className="w-[90px] border-b border-border h-6 text-muted-foreground leading-6 font-medium">H (STABLE)</th>
                            </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-border">
                            {readingsList.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-20 text-muted-foreground text-xs select-none">
                                        <div className="flex flex-col items-center gap-3">
                                            <Scale className="w-10 h-10 text-muted-foreground/30 animate-pulse" />
                                            <p className="font-semibold text-muted-foreground/75">
                                                {isConnected 
                                                    ? "Cân đã kết nối. Hãy truyền dữ liệu từ cân..."
                                                    : "Hãy nhấn nút 'Kết nối Cân' để bắt đầu luồng dữ liệu..."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                readingsList.map((reading, index) => {
                                    // Row number like Excel
                                    const rowNum = readingsList.length - index;
                                    const isNewest = index === 0;

                                    return (
                                        <tr 
                                            key={reading.id} 
                                            className={`hover:bg-muted/30 border-b border-border h-6.5 leading-6.5 transition-colors duration-300 ${
                                                isNewest ? "bg-emerald-500/5 font-semibold text-foreground animate-fadeIn" : "text-muted-foreground"
                                            }`}
                                        >
                                            {/* Row number column */}
                                            <td className="bg-muted/40 text-center border-r border-border select-none text-[10px] text-muted-foreground font-medium flex-none">
                                                {rowNum}
                                            </td>
                                            
                                            {/* Column A: Time */}
                                            <td className="px-3 border-r border-border font-mono text-[11px] truncate select-all">
                                                {reading.time}
                                            </td>

                                            {/* Column B: Operator ID */}
                                            <td className="px-3 border-r border-border font-mono text-[11px] truncate select-all">
                                                {reading.identityId || user?.identityId || "-"}
                                            </td>

                                            {/* Column C: Operator Name */}
                                            <td className="px-3 border-r border-border font-mono text-[11px] truncate select-all">
                                                {reading.identityName || user?.identityName || "-"}
                                            </td>

                                            {/* Column D: Sample ID */}
                                            <td className="px-3 border-r border-border font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate select-all">
                                                {reading.sampleId ?? "-"}
                                            </td>

                                            {/* Column E: Raw data */}
                                            <td className="px-3 border-r border-border truncate font-mono text-[11px] select-all">
                                                {reading.raw}
                                            </td>

                                            {/* Column F: Value */}
                                            <td className="px-3 border-r border-border text-right font-semibold font-mono text-[11px] text-primary dark:text-emerald-400 select-all">
                                                {reading.value !== null ? reading.value.toFixed(4) : "-"}
                                            </td>

                                            {/* Column G: Unit */}
                                            <td className="px-3 border-r border-border text-center font-mono text-[11px] select-all">
                                                {reading.unit}
                                            </td>

                                            {/* Column H: Stable */}
                                            <td className="px-3 text-center">
                                                {reading.isStable ? (
                                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold select-none">
                                                        STABLE
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold select-none">
                                                        UNSTABLE
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Excel Bottom status bar */}
                <div className="px-3 py-1 bg-emerald-700 text-neutral-100 text-[10px] flex justify-between items-center select-none font-mono">
                    <div className="flex items-center gap-2">
                        <span className="font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            EXCEL STREAMER
                        </span>
                        <span className="border-l border-emerald-600 h-3" />
                        <span>Ready</span>
                    </div>
                    <div>
                        <span>BaudRate: {config.baudRate} bps | Parity: {config.parity} | DataBits: {config.dataBits}</span>
                    </div>
                </div>
            </div>

            {/* Lịch sử cân phân tích Dialog */}
            <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                <DialogContent className="!max-w-[85vw] !w-[85vw] h-[80vh] min-h-[80vh] flex flex-col p-0 overflow-hidden bg-background border border-border shadow-2xl">
                    <DialogHeader className="p-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
                        <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                            <History className="w-4 h-4 text-primary" />
                            Lịch sử Số liệu Cân phân tích
                        </DialogTitle>
                    </DialogHeader>

                    {/* Toolbar filters */}
                    <div className="p-4 border-b border-border bg-card flex flex-wrap items-end gap-3.5 shrink-0 text-xs">
                        <div className="space-y-1.5 w-full sm:w-48">
                            <Label className="text-xs font-semibold text-muted-foreground font-medium">Tìm kiếm mô tả</Label>
                            <Input
                                placeholder="Nhập từ khóa tìm kiếm..."
                                value={historySearch}
                                onChange={(e) => {
                                    setHistorySearch(e.target.value);
                                    setHistoryPage(1);
                                }}
                                className="h-8 text-xs bg-background"
                            />
                        </div>

                        <div className="space-y-1.5 w-full sm:w-40">
                            <Label className="text-xs font-semibold text-muted-foreground font-medium">Từ ngày (Action Time)</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setHistoryPage(1);
                                }}
                                className="h-8 text-xs bg-background"
                            />
                        </div>

                        <div className="space-y-1.5 w-full sm:w-40">
                            <Label className="text-xs font-semibold text-muted-foreground font-medium">Đến ngày (Action Time)</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setHistoryPage(1);
                                }}
                                className="h-8 text-xs bg-background"
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setHistorySearch("");
                                const today = new Date().toLocaleDateString("en-CA");
                                setStartDate(today);
                                setEndDate(today);
                                setSortColumn("actionTime");
                                setSortDirection("DESC");
                                setHistoryPage(1);
                            }}
                            className="h-8 text-xs bg-background shrink-0 font-medium"
                        >
                            Xóa bộ lọc
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleExportPdf}
                            disabled={logsList.length === 0}
                            className="h-8 text-xs shrink-0 font-semibold shadow-sm bg-primary hover:bg-primary/95 text-primary-foreground flex items-center gap-1.5"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Xuất file PDF
                        </Button>
                    </div>

                    {/* Table View */}
                    <div className="flex-1 overflow-y-auto p-4 bg-background min-h-0">
                        <div className="border border-border bg-card rounded-lg overflow-hidden h-full">
                            <table className="w-full border-collapse border-spacing-0 text-left text-xs table-fixed">
                                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold sticky top-0 z-10 shadow-xs h-9">
                                    <tr>
                                        <th className="px-3 w-12 text-center">STT</th>
                                        {renderHistorySortableHeader("Thời gian", "actionTime", "w-40")}
                                        <th className="px-3 w-28">Mã NV</th>
                                        <th className="px-3 w-36">Họ tên</th>
                                        <th className="px-3 w-28">Mã mẫu</th>
                                        <th className="px-3 w-32">Dữ liệu gốc</th>
                                        <th className="px-3 w-24 text-right">Giá trị</th>
                                        <th className="px-3 w-16 text-center">Đơn vị</th>
                                        <th className="px-3 w-28 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {isLogsLoading ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-20 text-muted-foreground select-none">
                                                Đang tải lịch sử...
                                            </td>
                                        </tr>
                                    ) : logsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-20 text-muted-foreground select-none">
                                                Không có dữ liệu lịch sử cân phù hợp.
                                            </td>
                                        </tr>
                                    ) : (
                                        logsList.map((log, index) => {
                                            const rowSTT = (historyPage - 1) * historyItemsPerPage + index + 1;
                                            const dataObj = log.equipmentLogData || {};
                                            const opId = dataObj.identityId || log.createdById || "-";
                                            const opName = dataObj.identityName || "-";
                                            const smpId = dataObj.sampleId || log.commonKeys?.[0] || "-";
                                            const rawData = dataObj.raw || "-";
                                            const valueData = dataObj.value !== undefined && dataObj.value !== null ? dataObj.value : "-";
                                            const unitData = dataObj.unit || "-";
                                            const isStable = dataObj.isStable ?? true;

                                            return (
                                                <tr key={log.equipmentLogId} className="hover:bg-muted/30 border-b border-border h-8.5 leading-8.5 transition-colors">
                                                    <td className="px-3 text-muted-foreground text-center">{rowSTT}</td>
                                                    <td className="px-3 font-mono text-[11px] text-muted-foreground">
                                                        {formatActionTime(log.actionTime)}
                                                    </td>
                                                    <td className="px-3 font-mono text-[11px] text-muted-foreground">{opId}</td>
                                                    <td className="px-3 truncate">{opName}</td>
                                                    <td className="px-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{smpId}</td>
                                                    <td className="px-3 font-mono text-[11px] text-muted-foreground truncate" title={rawData}>{rawData}</td>
                                                    <td className="px-3 font-mono text-[11px] text-right font-semibold text-primary">{valueData}</td>
                                                    <td className="px-3 text-center">{unitData}</td>
                                                    <td className="px-3 text-center">
                                                        {isStable ? (
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold select-none">
                                                                ỔN ĐỊNH
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold select-none">
                                                                BIẾN ĐỘNG
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="shrink-0 border-t border-border bg-card">
                            <Pagination
                                currentPage={historyPage}
                                totalPages={totalPages}
                                itemsPerPage={historyItemsPerPage}
                                totalItems={totalItems}
                                onPageChange={setHistoryPage}
                                onItemsPerPageChange={setHistoryItemsPerPage}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
