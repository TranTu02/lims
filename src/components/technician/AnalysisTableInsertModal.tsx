import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X, Table as TableIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    analyses: any[];
    onInsert: (html: string) => void;
}

export function AnalysisTableInsertModal({ open, onOpenChange, analyses, onInsert }: Props) {
    const { t } = useTranslation();

    const columns = [
        { id: "index", label: t("common.stt", { defaultValue: "STT" }) },
        { id: "sampleId", label: t("technician.workspace.sampleCode", { defaultValue: "Mã mẫu" }) },
        { id: "analysisId", label: t("technician.workspace.analysisId", { defaultValue: "Mã chỉ tiêu" }) },
        { id: "parameterName", label: t("technician.workspace.parameterName", { defaultValue: "Tên chỉ tiêu" }) },
        { id: "protocolCode", label: t("technician.workspace.protocolCodeCol", { defaultValue: "PP thử" }) },
        { id: "analysisUnit", label: t("technician.workspace.unit", { defaultValue: "Đơn vị" }) },
        { id: "analysisResult", label: t("technician.workspace.result", { defaultValue: "Kết quả" }) },
    ];

    const [selectedCols, setSelectedCols] = useState<string[]>(["index", "sampleId", "parameterName", "protocolCode", "analysisResult"]);

    const toggleColumn = (id: string) => {
        setSelectedCols(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleInsert = () => {
        if (selectedCols.length === 0) return;

        const headerHtml = `
            <thead>
                <tr>
                    ${columns.filter(c => selectedCols.includes(c.id)).map(c => `<th style="border: 1px solid black; padding: 6px; background-color: #f3f4f6; font-weight: bold; text-align: center;">${c.label}</th>`).join("")}
                </tr>
            </thead>
        `;

        const rowsHtml = analyses.map((a, i) => {
            return `
                <tr>
                    ${columns.filter(c => selectedCols.includes(c.id)).map(c => {
                        let val = "";
                        if (c.id === "index") val = (i + 1).toString();
                        else if (c.id === "protocolCode") val = a.protocolCode || "-";
                        else if (c.id === "analysisUnit") val = a.analysisUnit || "-";
                        else val = (a as any)[c.id] || "-";
                        
                        return `<td style="border: 1px solid black; padding: 6px; text-align: ${c.id === "index" ? "center" : "left"};">${val}</td>`;
                    }).join("")}
                </tr>
            `;
        }).join("");

        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-family: 'Times New Roman', serif; font-size: 13px;">
                ${headerHtml}
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <p><br/></p>
        `;

        onInsert(tableHtml);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] [&>button:last-child]:hidden">
                <div className="flex items-center gap-2 mb-4">
                    <TableIcon className="w-5 h-5 text-primary" />
                    <DialogTitle className="text-lg font-semibold">
                        {t("technician.workspace.insertAnalysesTable", { defaultValue: "Chèn bảng chỉ tiêu" })}
                    </DialogTitle>
                </div>

                <div className="p-1 space-y-4">
                    <div className="text-sm text-muted-foreground mb-4">
                        {t("technician.workspace.selectColumnsToInsert", { defaultValue: "Lựa chọn các cột thông tin sẽ hiển thị trong biên bản:" })}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {columns.map((col) => (
                            <div key={col.id} className="flex items-center space-x-2 bg-muted/30 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => toggleColumn(col.id)}>
                                <Checkbox id={`col-${col.id}`} checked={selectedCols.includes(col.id)} onCheckedChange={() => toggleColumn(col.id)} />
                                <Label htmlFor={`col-${col.id}`} className="text-sm cursor-pointer">{col.label}</Label>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-9">
                        <X className="w-4 h-4 mr-1.5" />
                        {t("common.cancel", { defaultValue: "Hủy" })}
                    </Button>
                    <Button onClick={handleInsert} disabled={selectedCols.length === 0} className="h-9 shadow-sm">
                        <Check className="w-4 h-4 mr-1.5" />
                        {t("common.insert", { defaultValue: "Chèn ngay" })}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
