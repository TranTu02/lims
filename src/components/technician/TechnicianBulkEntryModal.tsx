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
import { HtmlResultCell } from "@/components/common/HtmlResultCell";

interface TechnicianBulkEntryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedAnalyses: AnalysisListItem[];
    onSuccess: () => void;
}

export function TechnicianBulkEntryModal({ open, onOpenChange, selectedAnalyses, onSuccess }: TechnicianBulkEntryModalProps) {
    const { t } = useTranslation();
    const { mutate: updateBulk, isPending } = useAnalysesUpdateBulk();

    // Local state to allow filtering rows within the modal
    const [editableAnalyses, setEditableAnalyses] = useState<AnalysisListItem[]>([]);
    
    // Local state for table editing: results, status, and units
    const [results, setResults] = useState<{ 
        analysisId: string; 
        result: string; 
        resultStatus: AnalysisResultStatusDb;
        unit: string;
    }[]>([]);

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
        }
    }, [open, selectedAnalyses]);

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

    const handleSave = () => {
        const emptyRowsIndices = results
            .map((r, idx) => (!r.result || r.result.trim() === "" ? idx : -1))
            .filter(idx => idx !== -1);

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

        if (emptyRowsIndices.length > 0) {
            if (emptyRowsIndices.length === results.length) {
                toast.error(t("technician.workspace.allResultsEmpty", { defaultValue: "Vui lòng nhập ít nhất một kết quả" }));
                return;
            }

            const confirmRemove = window.confirm(
                t("technician.workspace.confirmRemoveEmpty", { 
                    count: emptyRowsIndices.length, 
                    defaultValue: `Có ${emptyRowsIndices.length} chỉ tiêu chưa nhập kết quả. Bạn có muốn loại bỏ chúng khỏi danh sách nhập và chỉ giữ lại các chỉ tiêu đã có kết quả?` 
                })
            );

            if (confirmRemove) {
                // Filter both lists to keep only non-empty
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
                toast.info(t("technician.workspace.emptyRowsRemoved", { defaultValue: "Đã loại bỏ các hàng trống. Vui lòng kiểm tra lại và nhấn Lưu để cập nhật." }));
            }
            return;
        }

        performUpdate(results);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[85vw] w-[85vw] min-w-[85vw] flex flex-col max-h-[90vh] [&>button:last-child]:hidden">
                <DialogHeader>
                    <DialogTitle>{t("technician.workspace.bulkEntryTitle", { count: editableAnalyses.length, defaultValue: `Nhập kết quả hàng loạt (${editableAnalyses.length})` })}</DialogTitle>
                    <DialogDescription>
                        {t("technician.workspace.bulkEntryDesc", { defaultValue: "Nhập kết quả và đơn vị cho các chỉ tiêu. Dùng ^ mũ, _ chỉ số, * dấu nhân. Click ô kết quả để sửa." })}
                    </DialogDescription>
                </DialogHeader>

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
                                                <HtmlResultCell
                                                    value={rowState.result}
                                                    onChange={(html) => handleResultChange(index, html)}
                                                    placeholder={t("technician.workspace.resultPlaceholder", { defaultValue: "Nhập KQ..." })}
                                                    className="font-medium text-primary bg-background border"
                                                />
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
                                                    <SelectContent>
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
    );
}
