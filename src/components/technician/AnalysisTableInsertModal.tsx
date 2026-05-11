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

// Column definitions — columns with `dataKey` pull from analysis data;
// columns with `blank: true` are empty placeholder columns for manual entry.
const COLUMNS = [
    { id: "index",                    label: "STT",                         dataKey: "index",          blank: false, defaultOn: true  },
    { id: "sampleId",                 label: "Mã mẫu",                      dataKey: "sampleId",       blank: false, defaultOn: true  },
    { id: "analysisId",               label: "Mã chỉ tiêu",                 dataKey: "analysisId",     blank: false, defaultOn: false },
    { id: "parameterName",            label: "Tên chỉ tiêu",                dataKey: "parameterName",  blank: false, defaultOn: true  },
    { id: "protocolCode",             label: "PP thử",                      dataKey: "protocolCode",   blank: false, defaultOn: true  },
    { id: "luongMau",                 label: "Lượng mẫu",                   dataKey: null,             blank: true,  defaultOn: false },
    { id: "theVichSauPhaloang",       label: "Thể tích sau pha loãng",      dataKey: null,             blank: true,  defaultOn: false },
    { id: "ketQuaDo1",                label: "Kết quả đo",                  dataKey: null,             blank: true,  defaultOn: false },
    { id: "mG",                       label: "m (g)",                       dataKey: null,             blank: true,  defaultOn: false },
    { id: "vdm",                      label: "Vđm",                         dataKey: null,             blank: true,  defaultOn: false },
    { id: "ketQuaDo2",                label: "Kết quả đo",                  dataKey: null,             blank: true,  defaultOn: false },
    { id: "hamLuong",                 label: "Hàm lượng",                   dataKey: null,             blank: true,  defaultOn: false },
    { id: "analysisUnit",             label: "Đơn vị",                      dataKey: "analysisUnit",   blank: false, defaultOn: true  },
    { id: "analysisResult",           label: "Kết quả",                     dataKey: "analysisResult", blank: false, defaultOn: true  },
    { id: "ghiChu",                   label: "Ghi chú",                     dataKey: null,             blank: true,  defaultOn: false },
] as const;

type ColId = typeof COLUMNS[number]["id"];

// Grouped for display in the UI
const GROUPS: { label: string; ids: ColId[] }[] = [
    {
        label: "Thông tin cơ bản",
        ids: ["index", "sampleId", "analysisId", "parameterName", "protocolCode"],
    },
    {
        label: "Cột bổ sung (để trống — nhập tay)",
        ids: ["luongMau", "theVichSauPhaloang", "ketQuaDo1", "mG", "vdm", "ketQuaDo2", "hamLuong"],
    },
    {
        label: "Kết quả & Ghi chú",
        ids: ["analysisUnit", "analysisResult", "ghiChu"],
    },
];

export function AnalysisTableInsertModal({ open, onOpenChange, analyses, onInsert }: Props) {
    const { t } = useTranslation();

    const [selectedCols, setSelectedCols] = useState<ColId[]>(
        COLUMNS.filter(c => c.defaultOn).map(c => c.id)
    );

    const toggleColumn = (id: ColId) => {
        setSelectedCols(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleInsert = () => {
        if (selectedCols.length === 0) return;

        // Maintain column ORDER as defined in COLUMNS array
        const orderedCols = COLUMNS.filter(c => selectedCols.includes(c.id));

        const thStyle = `border: 1px solid black; padding: 6px; background-color: #f3f4f6; font-weight: bold; text-align: center;`;
        const tdStyle = (center: boolean) =>
            `border: 1px solid black; padding: 6px; text-align: ${center ? "center" : "left"};`;

        const headerHtml = `
            <thead>
                <tr>
                    ${orderedCols.map(c => `<th style="${thStyle}">${c.label}</th>`).join("")}
                </tr>
            </thead>`;

        const rowsHtml = analyses.map((a, i) => {
            return `
                <tr>
                    ${orderedCols.map(c => {
                        if (c.blank) {
                            return `<td style="${tdStyle(false)}"></td>`;
                        }
                        let val = "";
                        if (c.dataKey === "index") val = (i + 1).toString();
                        else if (c.dataKey === "protocolCode") val = a.protocolCode || "-";
                        else if (c.dataKey === "analysisUnit") val = a.analysisUnit || "-";
                        else if (c.dataKey === "analysisResult") val = a.analysisResult || "-";
                        else val = (a as any)[c.dataKey!] || "-";

                        const center = c.id === "index";
                        return `<td style="${tdStyle(center)}">${val}</td>`;
                    }).join("")}
                </tr>`;
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
            <DialogContent className="sm:max-w-[520px] [&>button:last-child]:hidden">
                <div className="flex items-center gap-2 mb-4">
                    <TableIcon className="w-5 h-5 text-primary" />
                    <DialogTitle className="text-lg font-semibold">
                        {t("technician.workspace.insertAnalysesTable", { defaultValue: "Chèn bảng chỉ tiêu" })}
                    </DialogTitle>
                </div>

                <div className="p-1 space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                    <p className="text-sm text-muted-foreground">
                        {t("technician.workspace.selectColumnsToInsert", { defaultValue: "Lựa chọn các cột sẽ hiển thị trong biên bản:" })}
                    </p>

                    {GROUPS.map((group) => (
                        <div key={group.label}>
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 border-b pb-1">
                                {group.label}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {group.ids.map((id) => {
                                    const col = COLUMNS.find(c => c.id === id)!;
                                    return (
                                        <div
                                            key={col.id}
                                            className="flex items-center space-x-2 bg-muted/30 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => toggleColumn(col.id)}
                                        >
                                            <Checkbox
                                                id={`col-${col.id}`}
                                                checked={selectedCols.includes(col.id)}
                                                onCheckedChange={() => toggleColumn(col.id)}
                                            />
                                            <Label htmlFor={`col-${col.id}`} className="text-sm cursor-pointer leading-tight">
                                                {col.label}
                                                {col.blank && (
                                                    <span className="ml-1 text-[10px] text-muted-foreground/60 italic">(trống)</span>
                                                )}
                                            </Label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
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
