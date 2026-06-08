import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Printer, CheckSquare, FileText, Scan, X, ZoomIn, ZoomOut } from "lucide-react";
import { useChemicalInventoriesList, useEnumList, chemicalApi } from "@/api/chemical";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChemicalInventory } from "@/types/chemical";
import { Pagination } from "@/components/ui/pagination";
import { InventoryDetailPanel } from "./InventoryDetailPanel";
import { InventoryEditModal } from "./InventoryEditModal";
import { PrintLabelModal } from "./PrintLabelModal";
import { ChemicalLogReportEditor } from "./ChemicalLogReportEditor";
import { PrintA4LabelModal } from "./PrintA4LabelModal";
import { Badge } from "@/components/ui/badge";
import { TableFilterPopover } from "./TableFilterPopover";
import { RefreshCw } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

function CameraScannerModal({ onClose, onScanSuccess }: { onClose: () => void; onScanSuccess: (text: string) => void }) {
    const qrRegionRef = useRef<HTMLDivElement>(null);
    const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
    const [zoom, setZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(5);

    const applyZoom = useCallback((zoomValue: number) => {
        const html5QrCode = html5QrcodeRef.current;
        if (!html5QrCode || !html5QrCode.isScanning) return;
        
        try {
            const track = (html5QrCode as any).getRunningTrack();
            if (track) {
                const capabilities = track.getCapabilities() as any;
                if (capabilities && capabilities.zoom) {
                    html5QrCode.applyVideoConstraints({
                        advanced: [{ zoom: zoomValue }]
                    } as any).catch(err => {
                        console.warn("Failed to apply video constraints, trying track constraints:", err);
                        track.applyConstraints({ advanced: [{ zoom: zoomValue }] }).catch((e: any) => {
                            console.warn("track.applyConstraints failed:", e);
                        });
                    });
                }
            }
        } catch (e: any) {
            console.warn("Hardware zoom error, using CSS zoom fallback:", e);
        }

        // Apply CSS zoom to video elements as fallback/supplement
        const videoEl = qrRegionRef.current?.querySelector("video");
        if (videoEl) {
            videoEl.style.transform = `scale(${zoomValue})`;
            videoEl.style.transformOrigin = "center center";
            videoEl.style.transition = "transform 0.1s ease-out";
        }
    }, []);

    useEffect(() => {
        const qrId = "camera-qr-reader";
        let isStopped = false;

        const startScanning = async () => {
            try {
                await new Promise((resolve) => setTimeout(resolve, 350));
                if (isStopped) return;

                const html5QrCode = new Html5Qrcode(qrId);
                html5QrcodeRef.current = html5QrCode;

                // Query all camera devices for explicit rear camera selection on mobile devices
                let cameraIdOrConfig: any = { facingMode: "environment" };
                try {
                    const devices = await Html5Qrcode.getCameras();
                    if (devices && devices.length > 0) {
                        const backCamera = devices.find(device => 
                            device.label.toLowerCase().includes("back") || 
                            device.label.toLowerCase().includes("rear") || 
                            device.label.toLowerCase().includes("environment") ||
                            device.label.toLowerCase().includes("sau")
                        );
                        if (backCamera) {
                            cameraIdOrConfig = backCamera.id;
                        } else {
                            // Usually the last camera in the list is the main rear camera
                            cameraIdOrConfig = devices[devices.length - 1].id;
                        }
                    }
                } catch (cameraErr) {
                    console.warn("Failed to get cameras list, falling back to facingMode constraint:", cameraErr);
                }

                await html5QrCode.start(
                    cameraIdOrConfig,
                    {
                        fps: 10,
                        qrbox: { width: 180, height: 180 }
                    },
                    (decodedText) => {
                        onScanSuccess(decodedText);
                        stopScanning();
                        onClose();
                    },
                    () => {}
                );

                // Detect zoom capability after starting
                if (!isStopped) {
                    try {
                        const track = (html5QrCode as any).getRunningTrack();
                        if (track) {
                            const capabilities = track.getCapabilities() as any;
                            if (capabilities && capabilities.zoom) {
                                setMaxZoom(capabilities.zoom.max || 5);
                            }
                        }
                    } catch (e: any) {
                        console.warn("Could not query zoom capabilities", e);
                    }
                }
            } catch (err: any) {
                console.error("Camera scan start error:", err);
            }
        };

        const stopScanning = async () => {
            isStopped = true;
            if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
                try {
                    await html5QrcodeRef.current.stop();
                } catch (e: any) {
                    console.error("Failed to stop html5-qrcode scanner:", e);
                }
            }
        };

        startScanning();

        return () => {
            stopScanning();
        };
    }, [onClose, onScanSuccess]);

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col justify-between p-4 safe-area-inset pb-safe">
            <style>{`
                @keyframes scan-glow {
                    0%, 100% { top: 5%; }
                    50% { top: 95%; }
                }
                .safe-area-inset {
                    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
                }
                #camera-qr-reader {
                    width: 100% !important;
                    height: 100% !important;
                }
                #camera-qr-reader video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
            `}</style>
            
            <div className="flex items-center justify-between text-white pb-3 shrink-0">
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">Quét mã QR hóa chất</h3>
                    <p className="text-[10px] text-zinc-400">Đặt mã QR vào khung chính giữa</p>
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="h-5 w-5 text-white" />
                </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-2xl bg-black border border-zinc-800">
                <div id="camera-qr-reader" className="w-full h-full [&_video]:object-cover" ref={qrRegionRef} />
                
                {/* Modern HUD Scanning UI with Smaller Range */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                    <div className="bg-black/75 flex-1" />
                    <div className="flex shrink-0">
                        <div className="bg-black/75 flex-1" />
                        <div className="w-[180px] h-[180px] relative border border-white/10 shrink-0">
                            {/* Neon Corner Brackets */}
                            <div className="absolute -top-[1.5px] -left-[1.5px] w-6 h-6 border-t-[3px] border-l-[3px] border-emerald-500 rounded-tl-md" />
                            <div className="absolute -top-[1.5px] -right-[1.5px] w-6 h-6 border-t-[3px] border-r-[3px] border-emerald-500 rounded-tr-md" />
                            <div className="absolute -bottom-[1.5px] -left-[1.5px] w-6 h-6 border-b-[3px] border-l-[3px] border-emerald-500 rounded-bl-md" />
                            <div className="absolute -bottom-[1.5px] -right-[1.5px] w-6 h-6 border-b-[3px] border-r-[3px] border-emerald-500 rounded-br-md" />
                            
                            {/* Pulse Laser Scan Line */}
                            <div className="absolute left-1.5 right-1.5 h-[2px] bg-emerald-400 opacity-90 shadow-[0_0_10px_#34d399] animate-[scan-glow_2.5s_ease-in-out_infinite]" />
                        </div>
                        <div className="bg-black/75 flex-1" />
                    </div>
                    <div className="bg-black/75 flex-1" />
                </div>
            </div>

            {/* Slider zoom and helper text */}
            <div className="mt-4 flex flex-col gap-3 shrink-0">
                {/* Zoom Controller */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 font-medium">Độ phóng đại camera</span>
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">{zoom.toFixed(1)}x</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ZoomOut className="h-4 w-4 text-zinc-500 cursor-pointer hover:text-white" onClick={() => {
                            const val = Math.max(1, zoom - 0.5);
                            setZoom(val);
                            applyZoom(val);
                        }} />
                        <input
                            type="range"
                            min="1"
                            max={maxZoom}
                            step="0.1"
                            value={zoom}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setZoom(val);
                                applyZoom(val);
                            }}
                            className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                        />
                        <ZoomIn className="h-4 w-4 text-zinc-500 cursor-pointer hover:text-white" onClick={() => {
                            const val = Math.min(maxZoom, zoom + 0.5);
                            setZoom(val);
                            applyZoom(val);
                        }} />
                    </div>
                </div>

                <div className="text-center text-[10px] text-zinc-500">
                    Sử dụng thanh trượt để phóng to và căn chỉnh chính xác mã QR
                </div>
            </div>
        </div>
    );
}



function StatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const STATUS_MAP: Record<string, { label: string; cls: string }> = {
        Quarantined: { label: t("inventory.chemical.inventories.status.Quarantined", { defaultValue: "Kiểm dịch" }), cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
        New: { label: t("inventory.chemical.inventories.status.New", { defaultValue: "Mới" }), cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
        InUse: { label: t("inventory.chemical.inventories.status.InUse", { defaultValue: "Đang dùng" }), cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
        Empty: { label: t("inventory.chemical.inventories.status.Empty", { defaultValue: "Hết" }), cls: "bg-muted text-muted-foreground" },
        Expired: { label: t("inventory.chemical.inventories.status.Expired", { defaultValue: "Hết hạn" }), cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
        Disposed: { label: t("inventory.chemical.inventories.status.Disposed", { defaultValue: "Đã huỷ" }), cls: "bg-gray-200 text-gray-600" },
        Pending: { label: t("inventory.chemical.inventories.status.Pending", { defaultValue: "Chờ kiểm kê" }), cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
    };
    const s = status ? STATUS_MAP[status] : undefined;
    if (s) return <Badge className={`${s.cls} hover:${s.cls} transition-none shadow-none border-none`}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

const STATUS_FILTER_OPTIONS = [
    { label: "Mới", value: "New" },
    { label: "Đang dùng", value: "InUse" },
    { label: "Kiểm dịch", value: "Quarantined" },
    { label: "Chờ kiểm kê", value: "Pending" },
    { label: "Hết", value: "Empty" },
    { label: "Hết hạn", value: "Expired" },
    { label: "Đã huỷ", value: "Disposed" },
];

export function InventoriesTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeInv, setActiveInv] = useState<ChemicalInventory | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [filters, setFilters] = useState<{
        chemicalInventoryStatus: string[];
        expDate: string[];
        openedDate: string[];
        chemicalType: string[];
        storageBinLocation: string[];
    }>({ chemicalInventoryStatus: [], expDate: [], openedDate: [], chemicalType: [], storageBinLocation: [] });

    const { data: chemicalTypesList } = useEnumList("chemicalType");
    const { data: binLocationsList } = useEnumList("storageBinLocation");



    // Label print state
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [printOpen, setPrintOpen] = useState(false);
    const [logReportOpen, setLogReportOpen] = useState(false);
    const [printA4Open, setPrintA4Open] = useState(false);
    const [scanOpen, setScanOpen] = useState(false);

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalInventoriesList({
        query: { search: submittedSearch, page, itemsPerPage, sortColumn: "createdAt", sortDirection: "DESC", ...filters },
    });

    const allItems = (result?.data as any[] | undefined) ?? [];

    // QR/Barcode Scanner Global Keydown Listener
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
                return;
            }

            if (e.key === "Control" || e.key === "Alt" || e.key === "Shift" || e.key === "Meta") {
                return;
            }

            const now = Date.now();
            if (now - lastKeyTime > 100) {
                buffer = "";
            }
            lastKeyTime = now;

            if (e.key === "Enter") {
                if (buffer.trim()) {
                    const scannedId = buffer.trim();
                    const foundItem = allItems.find((inv: any) => inv.chemicalInventoryId === scannedId);
                    if (foundItem) {
                        setActiveInv(foundItem);
                    } else {
                        setSearch(scannedId);
                        setSubmittedSearch(scannedId);
                        setPage(1);
                        chemicalApi.inventories.getTechnicians().then(() => {
                            chemicalApi.inventories.full({ id: scannedId }).then((res) => {
                                if (res.success && res.data) {
                                    setActiveInv(res.data as ChemicalInventory);
                                }
                            });
                        });
                    }
                    buffer = "";
                }
            } else if (e.key.length === 1) {
                buffer += e.key;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [allItems]);

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleLabelClick = () => {
        if (!selectMode) {
            setSelectMode(true);
            setSelectedIds(new Set());
        } else {
            if (selectedIds.size === 0) setSelectMode(false);
            else setPrintOpen(true);
        }
    };

    const handleLogReportClick = () => {
        if (!selectMode) {
            setSelectMode(true);
            setSelectedIds(new Set());
        } else {
            if (selectedIds.size === 0) setSelectMode(false);
            else setLogReportOpen(true);
        }
    };

    const exitSelectMode = () => {
        setSelectMode(false);
        setSelectedIds(new Set());
    };

    const selectedItems = allItems.filter((inv: any) => selectedIds.has(inv.chemicalInventoryId));

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || t("common.loadError", { defaultValue: "Không thể tải dữ liệu" })}</div>;
    }

    return (
        <div className="h-full flex gap-4 overflow-hidden">
            <div className="flex flex-col flex-1 space-y-3 min-w-0 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 w-full lg:flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="inv-search"
                                placeholder={t("inventory.chemical.inventories.searchPlaceholder", { defaultValue: "Tìm barcode, mã SKU, số lô..." })}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground flex md:hidden shrink-0 border border-border items-center justify-center rounded-md hover:bg-muted" onClick={() => setScanOpen(true)} title="Quét mã QR">
                            <Scan className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={handleSearch}>
                            {t("common.search", { defaultValue: "Tìm kiếm" })}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => refetch()} title="Tải lại">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 w-full lg:w-auto">
                        {selectMode && (
                            <Button variant="ghost" size="sm" type="button" onClick={exitSelectMode}>
                                {t("common.cancelSelect", { defaultValue: "Hủy chọn" })}
                            </Button>
                        )}
                        <Button variant={selectMode ? "secondary" : "outline"} type="button" onClick={handleLogReportClick}>
                            <FileText className="h-4 w-4 mr-2" />
                            {selectMode ? (selectedIds.size > 0 ? `In Sổ Nhật ký (${selectedIds.size})` : `In Sổ Nhật ký`) : `In Sổ Nhật ký`}
                        </Button>
                        <Button variant="outline" type="button" onClick={() => setPrintA4Open(true)}>
                            <Printer className="h-4 w-4 mr-2" />
                            In Mẫu Dán Nhãn
                        </Button>
                        <Button variant={selectMode ? "default" : "outline"} type="button" onClick={handleLabelClick}>
                            <Printer className="h-4 w-4 mr-2" />
                            {selectMode
                                ? selectedIds.size > 0
                                    ? `${t("inventory.chemical.transactionBlocks.printLabel", { defaultValue: "In Tem" })} (${selectedIds.size})`
                                    : t("inventory.chemical.transactionBlocks.printLabel", { defaultValue: "In Tem" })
                                : t("inventory.chemical.transactionBlocks.printLabel", { defaultValue: "In Tem" })}
                        </Button>
                        <Button variant="default" type="button" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t("inventory.chemical.inventories.add", { defaultValue: "Nhập Lọ Mới" })}
                        </Button>
                    </div>
                </div>

                {/* Select mode hint */}
                {selectMode && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                        <CheckSquare className="h-4 w-4 text-primary" />
                        <span className="text-primary font-medium">{t("inventory.chemical.inventories.selectMode", { defaultValue: "Chế độ chọn tem:" })}</span>
                        <span className="text-muted-foreground">{t("inventory.chemical.inventories.selectModeDesc", { defaultValue: 'Click vào các hàng để chọn, sau đó nhấn "In" để in tem.' })}</span>
                        {selectedIds.size > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                                {selectedIds.size} {t("common.selected", { defaultValue: "đã chọn" })}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    {selectMode && (
                                        <th className="px-3 py-2 w-8">
                                            <input
                                                type="checkbox"
                                                className="accent-primary"
                                                checked={allItems.length > 0 && allItems.every((inv: any) => selectedIds.has(inv.chemicalInventoryId))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(new Set(allItems.map((inv: any) => inv.chemicalInventoryId)));
                                                    } else {
                                                        setSelectedIds(new Set());
                                                    }
                                                }}
                                            />
                                        </th>
                                    )}
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.chemicalInventoryId", { defaultValue: "Mã" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.skus.chemicalName", { defaultValue: "Tên hóa chất" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.skus.chemicalType", { defaultValue: "Loại hóa chất" })}
                                            type="enum"
                                            value={filters.chemicalType}
                                            options={(chemicalTypesList || []).map((t) => ({ label: t, value: t }))}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, chemicalType: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.chemicalSkuId", { defaultValue: "Mã SKU" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                        {t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số Lô" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.storageBinLocation", { defaultValue: "Vị trí lưu kho" })}
                                            type="enum"
                                            value={filters.storageBinLocation}
                                            options={(binLocationsList || []).map((l) => ({ label: l, value: l }))}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, storageBinLocation: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {t("inventory.chemical.inventories.currentAvailableQty", { defaultValue: "Lượng còn lại" })}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.chemicalInventoryStatus", { defaultValue: "Trạng thái" })}
                                            type="enum"
                                            value={filters.chemicalInventoryStatus}
                                            options={STATUS_FILTER_OPTIONS}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, chemicalInventoryStatus: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                        <TableFilterPopover
                                            title={t("inventory.chemical.inventories.expiryDate", { defaultValue: "Hạn sử dụng" })}
                                            type="date"
                                            value={filters.expDate}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, expDate: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                        {t("inventory.chemical.inventories.storageConditions", { defaultValue: "Điều kiện bảo quản" })}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {selectMode && <td className="p-3"><Skeleton className="h-4 w-4" /></td>}
                                            <td className="p-3"><Skeleton className="h-4 w-12" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                                            <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                                            <td className="p-3 text-right"><Skeleton className="h-4 w-16" /></td>
                                            <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                            <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                                            <td className="p-3 hidden md:table-cell"><Skeleton className="h-4 w-24" /></td>
                                        </tr>
                                    ))
                                ) : allItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={selectMode ? 11 : 10} className="p-6 text-center text-muted-foreground">
                                            {t("common.noData", { defaultValue: "Không có dữ liệu" })}
                                        </td>
                                    </tr>
                                ) : (
                                    allItems.map((inv: any) => {
                                        const isSelected = selectedIds.has(inv.chemicalInventoryId);
                                        return (
                                            <tr
                                                key={inv.chemicalInventoryId}
                                                className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                                                    selectMode && isSelected ? "bg-primary/5" : activeInv?.chemicalInventoryId === inv.chemicalInventoryId ? "bg-muted" : ""
                                                }`}
                                                onClick={() => {
                                                    if (selectMode) {
                                                        toggleSelect(inv.chemicalInventoryId);
                                                    } else {
                                                        setActiveInv(inv);
                                                    }
                                                }}
                                            >
                                                {selectMode && (
                                                    <td className="px-3 py-2 text-center">
                                                        <input type="checkbox" readOnly checked={isSelected} className="accent-primary" />
                                                    </td>
                                                )}
                                                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium text-primary">{inv.chemicalInventoryId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap font-medium">{inv.chemicalName || (inv as any).chemicalSku?.chemicalName || "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{inv.chemicalType || (inv as any).chemicalSku?.chemicalType || "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">{inv.chemicalSkuId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap hidden md:table-cell">{inv.lotNumber ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{inv.storageBinLocation ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right font-medium text-foreground">{inv.currentAvailableQty ?? 0}</td>
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <StatusBadge status={inv.chemicalInventoryStatus} />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground hidden md:table-cell">{inv.expDate ? new Date(inv.expDate).toLocaleDateString("vi-VN") : "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground truncate max-w-[150px] hidden md:table-cell" title={inv.storageConditions}>{inv.storageConditions ?? "-"}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {result?.pagination && (
                        <Pagination
                            currentPage={page}
                            totalPages={result.pagination.totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={result.pagination.totalItems ?? result.pagination.total}
                            onPageChange={(p) => setPage(p)}
                            onItemsPerPageChange={(iper) => {
                                setItemsPerPage(iper);
                                setPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {activeInv && (
                <InventoryDetailPanel
                    inventory={activeInv}
                    onClose={() => setActiveInv(null)}
                    onEdit={(inv: ChemicalInventory) => {
                        console.log("Edit Inventory", inv);
                    }}
                />
            )}

            {createOpen && <InventoryEditModal inventory={null} onClose={() => setCreateOpen(false)} />}

            {scanOpen && (
                <CameraScannerModal
                    onClose={() => setScanOpen(false)}
                    onScanSuccess={(decodedText) => {
                        console.log("Camera QR Scanned:", decodedText);
                        const scannedId = decodedText.trim();
                        const foundItem = allItems.find((inv: any) => inv.chemicalInventoryId === scannedId);
                        if (foundItem) {
                            setActiveInv(foundItem);
                        } else {
                            setSearch(scannedId);
                            setSubmittedSearch(scannedId);
                            setPage(1);
                            chemicalApi.inventories.getTechnicians().then(() => {
                                chemicalApi.inventories.full({ id: scannedId }).then((res) => {
                                    if (res.success && res.data) {
                                        setActiveInv(res.data as ChemicalInventory);
                                    }
                                });
                            });
                        }
                    }}
                />
            )}

            {/* Print label modal */}
            {printOpen && (
                <PrintLabelModal
                    items={selectedItems}
                    onClose={() => {
                        setPrintOpen(false);
                        exitSelectMode();
                    }}
                />
            )}

            {/* Log report modal */}
            {logReportOpen && (
                <ChemicalLogReportEditor
                    open={logReportOpen}
                    onOpenChange={(open) => {
                        setLogReportOpen(open);
                        if (!open) exitSelectMode();
                    }}
                    inventories={selectedItems}
                />
            )}

            {/* Print A4 labels modal */}
            {printA4Open && (
                <PrintA4LabelModal
                    onClose={() => setPrintA4Open(false)}
                />
            )}

            {/* <HelpBubble guidePath="guide-inventories.html" label="Hướng dẫn: Quản lý Lọ/Chai" /> */}
        </div>
    );
}
