import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowDownToLine, Save, AlertTriangle, Trash2, Filter, Scale, RefreshCw } from "lucide-react";
import { useAnalysesUpdateBulk } from "@/api/analyses";
import type { AnalysisListItem, AnalysisResultStatusDb } from "@/types/analysis";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { HtmlResultCell } from "@/components/common/HtmlResultCell";
import { useSerialBalance } from "@/contexts/SerialBalanceContext";

interface TechnicianBulkEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAnalyses: AnalysisListItem[];
    onSuccess: () => void;
}

export function TechnicianBulkEntryModal({ open, onOpenChange, selectedAnalyses, onSuccess }: TechnicianBulkEntryModalProps) {
    const { t } = useTranslation();
    const { mutate: updateBulk, isPending } = useAnalysesUpdateBulk();
    
    // Core serial balance hook
    const { isConnected, isConnecting, latestReading, config, connect } = useSerialBalance();
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const lastFilledReadingIdRef = useRef<string | null>(null);

    // Local state to allow filtering rows within the modal
    const [editableAnalyses, setEditableAnalyses] = useState<AnalysisListItem[]>([]);
    
    // Local state for table editing: results, status, and units
    const [results, setResults] = useState<{ 
        analysisId: string; 
        result: string; 
        resultStatus: AnalysisResultStatusDb;
        unit: string;
    }[]>([]);

    // Confirmation dialog state for empty results
    const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
    const [emptyCount, setEmptyCount] = useState(0);
    const [allEmpty, setAllEmpty] = useState(false);

    useEffect(() => {
        if (open && selectedAnalyses) {
            setEditableAnalyses([...selectedAnalyses]);
            setResults(
                selectedAnalyses.map((a) => ({
                    analysisId: a.analysisId,
                    result: a.analysisResult ? String(a.analysisResult) : "",
                    resultStatus: a.analysisResultStatus || "NotEvaluated",
                    unit: (a as any).analysisUnit || "",
                })),
            );
            setShowEmptyConfirm(false);
            lastFilledReadingIdRef.current = null;
            setActiveRowIndex(null);
        }
    }, [open, selectedAnalyses]);

    // Auto-Fill & Auto-Next Logic
    useEffect(() => {
        if (!open || !isConnected || !config.autoFill || !latestReading) return;
        if (!latestReading.isStable || latestReading.value === null) return;

        // Check if this reading was already filled
        if (latestReading.id === lastFilledReadingIdRef.current) return;

        // We only want to fill if there's an active row focused
        if (activeRowIndex === null) return;

        // Perform auto-fill
        handleResultChange(activeRowIndex, String(latestReading.value));
        if (latestReading.unit) {
            handleUnitChange(activeRowIndex, latestReading.unit);
        }

        lastFilledReadingIdRef.current = latestReading.id;
        toast.success(`Đã tự động nạp ${latestReading.value} ${latestReading.unit} từ Cân`);

        // Perform auto-next
        if (config.autoNext) {
            const nextIndex = activeRowIndex + 1;
            if (nextIndex < editableAnalyses.length) {
                setTimeout(() => {
                    setActiveRowIndex(nextIndex);
                    // Find and focus/click the next cell
                    const divs = document.querySelectorAll("[role='button'][title='Click để chỉnh sửa']");
                    if (divs && divs[nextIndex]) {
                        (divs[nextIndex] as HTMLElement).focus();
                        (divs[nextIndex] as HTMLElement).click();
                    }
                }, 1000); // 1s delay
            }
        }
    }, [latestReading, isConnected, config.autoFill, config.autoNext, activeRowIndex, editableAnalyses.length, open]);

    // Key shortcut: F2 to grab balance reading
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (!open) return;

            if (e.key === "F2") {
                e.preventDefault();
                if (activeRowIndex !== null && latestReading && latestReading.value !== null) {
                    handleResultChange(activeRowIndex, String(latestReading.value));
                    if (latestReading.unit) {
                        handleUnitChange(activeRowIndex, latestReading.unit);
                    }
                    toast.success(`Đã nạp ${latestReading.value} ${latestReading.unit} từ Cân (Phím F2)`);
                } else if (!isConnected) {
                    toast.error("Cân phân tích chưa được kết nối!");
                } else {
                    toast.error("Không có số cân khả dụng hoặc chưa chọn ô!");
                }
            }
        };

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, [open, activeRowIndex, latestReading, isConnected]);

    const handleResultChange = (index: number, val: string) => {
        setResults((prev) => {
            const next = [...prev];
            next[index].result = val;
            return next;
        });
    };

    const handleUnitChange = (index: number, val: string) => {
        setResults((prev) => {
            const next = [...prev];
            next[index].unit = val;
            return next;
        });
    };

    const handleStatusChange = (index: number, val: AnalysisResultStatusDb) => {
        setResults((prev) => {
            const next = [...prev];
            next[index].resultStatus = val;
            return next;
        });
    };

    const handleFillDown = (index: number) => {
        const source = results[index];

        setResults((prev) => {
            const next = [...prev];
            // Apply current values to ALL rows below
            for (let i = index + 1; i < next.length; i++) {
                next[i] = { 
                    ...next[i], 
                    result: source.result, 
                    resultStatus: source.resultStatus,
                    unit: source.unit 
                };
            }
            return next;
        });
        toast.info(t("technician.workspace.fillDownSuccess", { defaultValue: "Đã điền tự động giá trị cho tất cả các hàng phía dưới." }));
    };

    const performUpdate = (finalResults: typeof results) => {
        const payload = finalResults.map((r) => ({
            analysisId: r.analysisId,
            analysisResult: r.result,
            analysisResultStatus: r.resultStatus,
            analysisUnit: r.unit,
            analysisStatus: "DataEntered" as const,
        }));

        updateBulk(
            { body: payload },
            {
                onSuccess: () => {
                    toast.success(t("technician.workspace.bulkEntrySuccess", { defaultValue: "Cập nhật kết quả thành công" }));
                    onSuccess();
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error(t("common.error.updateFailed", { defaultValue: "Cập nhật thất bại" }));
                },
            },
        );
    };

    const handleSave = () => {
        const emptyRowsIndices = results
            .map((r, idx) => (!r.result || r.result.trim() === "" ? idx : -1))
            .filter(idx => idx !== -1);

        if (emptyRowsIndices.length > 0) {
            setEmptyCount(emptyRowsIndices.length);
            setAllEmpty(emptyRowsIndices.length === results.length);
            setShowEmptyConfirm(true);
            return;
        }

        performUpdate(results);
    };

    // Option 1: Skip empty rows, only update non-empty
    const handleSkipEmpty = () => {
        const newAnalyses: AnalysisListItem[] = [];
        const newResults: typeof results = [];

        results.forEach((r, idx) => {
            if (r.result && r.result.trim() !== "") {
                newResults.push(r);
                newAnalyses.push(editableAnalyses[idx]);
            }
        });

        setEditableAnalyses(newAnalyses);
        setResults(newResults);
        setShowEmptyConfirm(false);
        toast.info(t("technician.workspace.emptyRowsRemoved", { defaultValue: "Đã loại bỏ các hàng trống. Vui lòng kiểm tra lại và nhấn Lưu để cập nhật." }));
    };

    // Option 2: Update ALL including empty (clear results via API)
    const handleUpdateIncludingEmpty = () => {
        setShowEmptyConfirm(false);
        performUpdate(results);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="!max-w-[85vw] w-[85vw] min-w-[85vw] flex flex-col max-h-[90vh] [&>button:last-child]:hidden">
                    <DialogHeader>
                        <DialogTitle>{t("technician.workspace.bulkEntryTitle", { count: editableAnalyses.length, defaultValue: `Nhập kết quả hàng loạt (${editableAnalyses.length})` })}</DialogTitle>
                        <DialogDescription>
                            {t("technician.workspace.bulkEntryDesc", { defaultValue: "Nhập kết quả và đơn vị cho các chỉ tiêu. Dùng ^ mũ, _ chỉ số, * dấu nhân. Click ô kết quả để sửa." })}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Integrated Analytical Balance Widget */}
                    <div className="bg-muted/40 border border-border rounded-lg p-3 mb-1 flex flex-wrap items-center justify-between gap-4 text-xs select-none">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${isConnected ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-neutral-500/10 text-neutral-500"}`}>
                                <Scale className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-semibold block text-foreground">Kết nối Cân Phân Tích</span>
                                <span className="text-[10px] text-muted-foreground">
                                    {isConnected 
                                        ? `Đang lắng nghe cổng COM | Phím F2 để lấy số cân` 
                                        : `Hỗ trợ kết nối cổng RS-232 qua Web Serial`}
                                </span>
                            </div>
                        </div>

                        {/* Stream Value LED Bar */}
                        {isConnected ? (
                            <div className="flex items-center gap-4 bg-neutral-950 dark:bg-black border border-neutral-800 text-neutral-50 rounded px-4 py-1.5 font-mono">
                                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Cân Live:</span>
                                <div className="flex items-baseline">
                                    <span className={`text-lg font-black tracking-tight ${latestReading?.isStable ? "text-emerald-400" : "text-amber-400 animate-pulse"}`}>
                                        {latestReading?.value !== null ? latestReading?.value.toFixed(4) : "0.0000"}
                                    </span>
                                    <span className="text-[11px] text-emerald-500 ml-1">
                                        {latestReading?.unit ?? "g"}
                                    </span>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-bold flex items-center gap-1 ${
                                    latestReading?.isStable 
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse"
                                }`}>
                                    <span className={`w-1 h-1 rounded-full ${latestReading?.isStable ? "bg-emerald-400" : "bg-amber-400 animate-ping"}`} />
                                    {latestReading?.isStable ? "Stable" : "Unstable"}
                                </span>
                            </div>
                        ) : (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={connect}
                                disabled={isConnecting}
                                className="bg-background border-border/80 text-xs font-semibold h-8"
                            >
                                {isConnecting ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        Đang kết nối...
                                    </>
                                ) : (
                                    <>
                                        <Scale className="w-3.5 h-3.5 mr-1.5 text-primary" />
                                        Bật Kết nối Cân
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto -mx-6 px-6 relative min-h-0">
                        <div className="w-full overflow-x-auto">
                            <Table className="w-full table-fixed">
                                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm border-b">
                                    <TableRow>
                                        <TableHead className="w-12">{t("common.stt", { defaultValue: "STT" })}</TableHead>
                                        <TableHead className="w-[180px]">{t("technician.workspace.sampleCode", { defaultValue: "Mã mẫu" })}</TableHead>
                                        <TableHead className="w-[220px]">{t("technician.workspace.parameter", { defaultValue: "Chỉ tiêu" })}</TableHead>
                                        <TableHead className="w-[280px]">
                                            {t("technician.workspace.result", { defaultValue: "Kết quả" })}
                                            <span className="ml-1 text-[10px] font-normal text-muted-foreground">^ mũ · _ chỉ số · * ×</span>
                                        </TableHead>
                                        <TableHead className="w-[120px]">{t("technician.workspace.unit", { defaultValue: "Đơn vị" })}</TableHead>
                                        <TableHead className="w-[150px]">{t("technician.workspace.evaluation", { defaultValue: "Đánh giá" })}</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {editableAnalyses.map((item, index) => {
                                        const stt = index + 1;
                                        const sampleCode = (item as any).sample?.sampleCode || item.sampleId;
                                        const parameterName = item.parameterName || "-";
                                        const rowState = results[index];

                                        if (!rowState) return null;

                                        return (
                                            <TableRow key={item.analysisId} className="hover:bg-muted/30">
                                                <TableCell className="text-muted-foreground text-xs">{stt}</TableCell>
                                                <TableCell className="font-medium text-xs break-all">{sampleCode}</TableCell>
                                                <TableCell className="text-xs font-semibold break-words">{parameterName}</TableCell>
                                                 <TableCell>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="flex-1 min-w-0">
                                                            <HtmlResultCell
                                                                value={rowState.result}
                                                                onChange={(html) => handleResultChange(index, html)}
                                                                onFocus={() => setActiveRowIndex(index)}
                                                                placeholder={t("technician.workspace.resultPlaceholder", { defaultValue: "Nhập KQ..." })}
                                                                className={`font-medium text-primary bg-background border ${activeRowIndex === index ? "ring-2 ring-primary ring-offset-1 border-primary" : ""}`}
                                                            />
                                                        </div>
                                                        {isConnected && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 shrink-0"
                                                                title={String(t("technician.workspace.balance.fillValueTooltip", { defaultValue: "Nạp khối lượng cân" }))}
                                                                onClick={() => {
                                                                    if (latestReading && latestReading.value !== null) {
                                                                        handleResultChange(index, String(latestReading.value));
                                                                        if (latestReading.unit) {
                                                                            handleUnitChange(index, latestReading.unit);
                                                                        }
                                                                    } else {
                                                                        toast.error("Không có dữ liệu cân khả dụng");
                                                                    }
                                                                }}
                                                                tabIndex={-1}
                                                            >
                                                                <Scale className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        value={rowState.unit} 
                                                        onChange={(e) => handleUnitChange(index, e.target.value)}
                                                        placeholder="..."
                                                        className="h-8 text-xs px-2"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={rowState.resultStatus} onValueChange={(val: AnalysisResultStatusDb) => handleStatusChange(index, val)}>
                                                        <SelectTrigger className="w-full h-8 text-[10px] px-2">
                                                            <SelectValue placeholder="..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[1100]">
                                                            <SelectItem value="Pass">Pass</SelectItem>
                                                            <SelectItem value="Fail">Fail</SelectItem>
                                                            <SelectItem value="NotEvaluated">{t("technician.workspace.statusNotEvaluated", { defaultValue: "KĐG" })}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-7 w-7 hover:bg-primary/10" 
                                                        title={t("technician.workspace.fillDownTooltip", { defaultValue: "Áp dụng cho tất cả hàng dưới" })} 
                                                        onClick={() => handleFillDown(index)} 
                                                        tabIndex={-1}
                                                    >
                                                        <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 border-t pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            {t("common.cancel", { defaultValue: "Huỷ" })}
                        </Button>
                        <Button onClick={handleSave} disabled={isPending || results.length === 0} className="min-w-[140px]">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {t("technician.workspace.saveResult", { defaultValue: "Lưu kết quả" })}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation dialog for empty results */}
            <AlertDialog open={showEmptyConfirm} onOpenChange={setShowEmptyConfirm}>
                <AlertDialogContent className="z-[1200] max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Có {emptyCount}/{results.length} chỉ tiêu chưa nhập kết quả
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm space-y-2">
                            <span className="block">Bạn muốn xử lý các ô kết quả trống như thế nào?</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                        {!allEmpty && (
                            <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2 h-auto py-3 text-left" 
                                onClick={handleSkipEmpty}
                            >
                                <Filter className="h-4 w-4 shrink-0 text-primary" />
                                <div className="flex flex-col items-start">
                                    <span className="font-semibold text-sm">Bỏ qua hàng trống</span>
                                    <span className="text-[11px] text-muted-foreground font-normal">Chỉ cập nhật {results.length - emptyCount} chỉ tiêu đã có kết quả</span>
                                </div>
                            </Button>
                        )}
                        <Button 
                            variant="outline" 
                            className="w-full justify-start gap-2 h-auto py-3 text-left border-destructive/40 hover:bg-destructive/5" 
                            onClick={handleUpdateIncludingEmpty}
                        >
                            <Trash2 className="h-4 w-4 shrink-0 text-destructive" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm text-destructive">Cập nhật cả kết quả rỗng (Hủy kết quả)</span>
                                <span className="text-[11px] text-muted-foreground font-normal">Gửi tất cả {results.length} chỉ tiêu, làm rỗng analysisResult cho {emptyCount} chỉ tiêu trống</span>
                            </div>
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full" 
                            onClick={() => setShowEmptyConfirm(false)}
                        >
                            Quay lại chỉnh sửa
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
