import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, ArrowDownToLine, Save } from "lucide-react";
import { useAnalysesUpdateBulk } from "@/api/analyses";
import type { AnalysisListItem, AnalysisResultStatusDb } from "@/types/analysis";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface TechnicianBulkEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAnalyses: AnalysisListItem[];
    onSuccess: () => void;
}

export function TechnicianBulkEntryModal({ open, onOpenChange, selectedAnalyses, onSuccess }: TechnicianBulkEntryModalProps) {
    const { t } = useTranslation();
    const { mutate: updateBulk, isPending } = useAnalysesUpdateBulk();

    // Local state for table editing
    const [results, setResults] = useState<{ analysisId: string; result: string; resultStatus: AnalysisResultStatusDb }[]>([]);

    useEffect(() => {
        if (open && selectedAnalyses) {
            setResults(
                selectedAnalyses.map((a) => ({
                    analysisId: a.analysisId,
                    result: a.analysisResult ? String(a.analysisResult) : "",
                    resultStatus: a.analysisResultStatus || "NotEvaluated",
                })),
            );
        }
    }, [open, selectedAnalyses]);

    const handleResultChange = (index: number, val: string) => {
        setResults((prev) => {
            const next = [...prev];
            next[index].result = val;
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
        const sourceParameter = selectedAnalyses[index].parameterName;

        setResults((prev) => {
            const next = [...prev];
            for (let i = index + 1; i < next.length; i++) {
                if (selectedAnalyses[i].parameterName === sourceParameter) {
                    next[i] = { ...next[i], result: source.result, resultStatus: source.resultStatus };
                } else {
                    // Stop filling down if it's no longer the same parameter (dính liền)
                    break;
                }
            }
            return next;
        });
        toast.info(t("technician.workspace.fillDownSuccess", "Đã điền tự động các dòng phía dưới có cùng chỉ tiêu."));
    };

    const handleSave = () => {
        const payload = results.map((r) => ({
            analysisId: r.analysisId,
            analysisResult: r.result,
            analysisResultStatus: r.resultStatus,
            analysisStatus: "DataEntered" as const,
        }));

        updateBulk(
            { body: payload },
            {
                onSuccess: () => {
                    toast.success(t("technician.workspace.bulkEntrySuccess", "Cập nhật kết quả thành công"));
                    onSuccess();
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error(t("common.error.updateFailed", "Cập nhật thất bại"));
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] flex flex-col max-h-[90vh] [&>button:last-child]:hidden">
                <DialogHeader>
                    <DialogTitle>{t("technician.workspace.bulkEntryTitle", { count: selectedAnalyses.length, defaultValue: `Nhập kết quả hàng loạt (${selectedAnalyses.length})` })}</DialogTitle>
                    <DialogDescription>{t("technician.workspace.bulkEntryDesc", { defaultValue: "Nhập kết quả cho các chỉ tiêu được đánh dấu. Có thể dùng nút điền tự động để copy xuống dưới cùng tham số/chỉ tiêu." })}</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto -mx-6 px-6 relative min-h-0">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="w-10">{t("common.stt", { defaultValue: "STT" })}</TableHead>
                                <TableHead className="w-[180px]">{t("technician.workspace.sampleCode", { defaultValue: "Mã mẫu" })}</TableHead>
                                <TableHead className="w-[200px]">{t("technician.workspace.parameter", { defaultValue: "Chỉ tiêu" })}</TableHead>
                                <TableHead className="min-w-[150px]">{t("technician.workspace.result", { defaultValue: "Kết quả" })}</TableHead>
                                <TableHead className="w-[140px]">{t("technician.workspace.evaluation", { defaultValue: "Đánh giá" })}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedAnalyses.map((item, index) => {
                                const stt = index + 1;
                                const sampleCode = (item as any).sample?.sampleCode || item.sampleId;
                                const parameterName = item.parameterName || "-";
                                const rowState = results[index];

                                if (!rowState) return null;

                                return (
                                    <TableRow key={item.analysisId}>
                                        <TableCell>{stt}</TableCell>
                                        <TableCell className="font-medium">{sampleCode}</TableCell>
                                        <TableCell>{parameterName}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2 items-center">
                                                <Input value={rowState.result} onChange={(e) => handleResultChange(index, e.target.value)} placeholder={t("technician.workspace.resultPlaceholder", { defaultValue: "Nhập KQ..." })} className="max-w-[180px]" />
                                                <Button variant="ghost" size="icon" title={t("technician.workspace.fillDownTooltip", { defaultValue: "Điền tự động xuống dưới" })} onClick={() => handleFillDown(index)} tabIndex={-1}>
                                                    <ArrowDownToLine className="h-4 w-4 text-primary" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={rowState.resultStatus} onValueChange={(val: AnalysisResultStatusDb) => handleStatusChange(index, val)}>
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue placeholder={t("common.select", { defaultValue: "Chọn" })} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pass">Pass</SelectItem>
                                                    <SelectItem value="Fail">Fail</SelectItem>
                                                    <SelectItem value="NotEvaluated">{t("technician.workspace.statusNotEvaluated", { defaultValue: "Không đánh giá" })}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        {t("common.cancel", { defaultValue: "Huỷ" })}
                    </Button>
                    <Button onClick={handleSave} disabled={isPending || results.length === 0}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" />
                        {t("technician.workspace.saveResult", { defaultValue: "Lưu kết quả" })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
