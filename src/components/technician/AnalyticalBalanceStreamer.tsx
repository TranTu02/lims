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
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQrScanner } from "@/hooks/useQrScanner";

export function AnalyticalBalanceStreamer() {
    const { t } = useTranslation();
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

    // Auto capture QR/Barcode scanner globally when the tab is active
    useQrScanner((scannedValue) => {
        setActiveSampleId(scannedValue);
        toast.success(`Đã nhận mã mẫu từ máy quét: ${scannedValue}`);
    }, { enabled: isConnected });

    const handleExportCSV = () => {
        if (readingsList.length === 0) {
            toast.error(t("common.noData", { defaultValue: "Không có dữ liệu để xuất" }));
            return;
        }

        try {
            // Build CSV rows
            const headers = ["STT", "TIME (Thời gian)", "SAMPLE ID (Mã mẫu)", "RAW DATA (Dữ liệu thô)", "VALUE (Trọng lượng)", "UNIT (Đơn vị)", "STABLE (Trạng thái)"];
            const rows = readingsList.map((r, idx) => [
                String(readingsList.length - idx),
                r.time,
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
        <div className="flex-1 flex flex-col lg:flex-row gap-6 items-stretch min-h-0 bg-background">
            {/* Left Column: Control Panel & Live LED */}
            <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
                {/* Real-time LED Weight Display */}
                <div className="bg-neutral-950 border border-neutral-800 text-neutral-50 rounded-xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden h-44">
                    {/* Futuristic grid background decoration */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:1rem_1rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10 pointer-events-none" />
                    
                    <div className="flex justify-between items-center z-10">
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

                    <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono z-10 border-t border-neutral-900 pt-2">
                        <span>TIME: {latestReading?.time ?? "--:--:--.---"}</span>
                        <span className="truncate max-w-[200px]" title={latestReading?.raw}>RAW: {latestReading?.raw ?? "-"}</span>
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

                    {/* Port Status */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                            <span className="text-muted-foreground block text-[10px] uppercase font-medium">Trạng thái</span>
                            <span className={`font-semibold mt-1 flex items-center gap-1.5 ${
                                isConnected ? "text-success" : isConnecting ? "text-warning animate-pulse" : "text-destructive"
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    isConnected ? "bg-success animate-pulse" : isConnecting ? "bg-warning" : "bg-destructive"
                                }`} />
                                {isConnected 
                                    ? String(t("technician.workspace.balance.connected", { defaultValue: "Đã kết nối" }))
                                    : isConnecting 
                                        ? String(t("technician.workspace.balance.connecting", { defaultValue: "Đang kết nối" }))
                                        : String(t("technician.workspace.balance.disconnected", { defaultValue: "Ngoại tuyến" }))}
                            </span>
                        </div>
                        <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50">
                            <span className="text-muted-foreground block text-[10px] uppercase font-medium">Baudrate</span>
                            <Select 
                                value={String(config.baudRate)} 
                                onValueChange={(v) => updateConfig({ baudRate: parseInt(v) })}
                                disabled={isConnected || isConnecting}
                            >
                                <SelectTrigger className="h-6 mt-1 border-0 bg-transparent p-0 text-xs font-semibold focus:ring-0 shadow-none text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4800">4800 bps</SelectItem>
                                    <SelectItem value="9600">9600 bps</SelectItem>
                                    <SelectItem value="19200">19200 bps</SelectItem>
                                    <SelectItem value="38400">38400 bps</SelectItem>
                                    <SelectItem value="115200">115200 bps</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                        onClick={isConnected ? disconnect : connect} 
                        disabled={isConnecting}
                        variant={isConnected ? "destructive" : "default"}
                        size="lg"
                        className="w-full text-sm font-semibold shadow-sm tracking-wide h-10"
                    >
                        {isConnecting ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                {String(t("technician.workspace.balance.connecting", { defaultValue: "Đang kết nối..." }))}
                            </>
                        ) : isConnected ? (
                            <>
                                <Scale className="w-4 h-4 mr-2" />
                                {String(t("technician.workspace.balance.disconnect", { defaultValue: "Ngắt kết nối Cân" }))}
                            </>
                        ) : (
                            <>
                                <Scale className="w-4 h-4 mr-2" />
                                {String(t("technician.workspace.balance.connect", { defaultValue: "Kết nối Cân phân tích" }))}
                            </>
                        )}
                    </Button>

                    {/* Data Processing Options */}
                    <div className="space-y-4 border-t border-border pt-4">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                            Bộ lọc & Đồng bộ dữ liệu
                        </Label>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="skipEmpty" 
                                    checked={config.skipEmpty} 
                                    onCheckedChange={(checked) => updateConfig({ skipEmpty: !!checked })}
                                />
                                <Label htmlFor="skipEmpty" className="text-xs text-foreground cursor-pointer font-medium">
                                    {String(t("technician.workspace.balance.skipEmpty", { defaultValue: "Loại bỏ hàng trống" }))}
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="stableOnly" 
                                    checked={config.stableOnly} 
                                    onCheckedChange={(checked) => updateConfig({ stableOnly: !!checked })}
                                />
                                <Label htmlFor="stableOnly" className="text-xs text-foreground cursor-pointer font-medium">
                                    {String(t("technician.workspace.balance.stableOnly", { defaultValue: "Chỉ lấy số đo ổn định" }))}
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="autoCopy" 
                                    checked={config.autoCopy} 
                                    onCheckedChange={(checked) => updateConfig({ autoCopy: !!checked })}
                                />
                                <Label htmlFor="autoCopy" className="text-xs text-foreground cursor-pointer font-medium">
                                    {String(t("technician.workspace.balance.autoCopy", { defaultValue: "Tự động copy clipboard" }))}
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2 border-t border-dashed border-border/80 pt-3">
                                <Checkbox 
                                    id="autoFill" 
                                    checked={config.autoFill} 
                                    onCheckedChange={(checked) => updateConfig({ autoFill: !!checked })}
                                />
                                <Label htmlFor="autoFill" className="text-xs text-foreground cursor-pointer font-medium flex flex-col gap-0.5">
                                    <span>{String(t("technician.workspace.balance.autoFill", { defaultValue: "Auto Fill khi nhập lô" }))}</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Tự động nạp khi số đo ổn định</span>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="autoNext" 
                                    checked={config.autoNext} 
                                    onCheckedChange={(checked) => updateConfig({ autoNext: !!checked })}
                                    disabled={!config.autoFill}
                                />
                                <Label htmlFor="autoNext" className={`text-xs cursor-pointer font-medium flex flex-col gap-0.5 ${!config.autoFill ? "text-muted-foreground/60" : "text-foreground"}`}>
                                    <span>{String(t("technician.workspace.balance.autoNext", { defaultValue: "Auto Next khi ổn định" }))}</span>
                                    <span className="text-[10px] text-muted-foreground font-normal">Tự động nhảy ô tiếp theo</span>
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Excel Data Streamer Sheet */}
            <div className="flex-1 min-w-0 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
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
                                <th className="w-[150px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">B (SAMPLE ID)</th>
                                <th className="w-[180px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">C (RAW DATA)</th>
                                <th className="w-[110px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">D (VALUE)</th>
                                <th className="w-[70px] border-r border-b border-border h-6 text-muted-foreground leading-6 font-medium">E (UNIT)</th>
                                <th className="w-[100px] border-b border-border h-6 text-muted-foreground leading-6 font-medium">F (STABLE)</th>
                            </tr>
                        </thead>
                        
                        <tbody className="divide-y divide-border">
                            {readingsList.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-20 text-muted-foreground text-xs select-none">
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

                                            {/* Column B: Sample ID */}
                                            <td className="px-3 border-r border-border font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate select-all">
                                                {reading.sampleId ?? "-"}
                                            </td>

                                            {/* Column C: Raw data */}
                                            <td className="px-3 border-r border-border truncate font-mono text-[11px] select-all">
                                                {reading.raw}
                                            </td>

                                            {/* Column D: Value */}
                                            <td className="px-3 border-r border-border text-right font-semibold font-mono text-[11px] text-primary dark:text-emerald-400 select-all">
                                                {reading.value !== null ? reading.value.toFixed(4) : "-"}
                                            </td>

                                            {/* Column E: Unit */}
                                            <td className="px-3 border-r border-border text-center font-mono text-[11px] select-all">
                                                {reading.unit}
                                            </td>

                                            {/* Column F: Stable */}
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
        </div>
    );
}
