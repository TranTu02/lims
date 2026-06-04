import { useState, useRef } from "react";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
    onClose: () => void;
};

type LabelType = "STANDARD_SOLUTION" | "REAGENT";

export function PrintA4LabelModal({ onClose }: Props) {
    const [labelType, setLabelType] = useState<LabelType>("STANDARD_SOLUTION");
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (!printRef.current) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const content = printRef.current.innerHTML;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>In mẫu dán nhãn A4</title>
                <style>
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    * { 
                        box-sizing: border-box; 
                        margin: 0; 
                        padding: 0; 
                    }
                    body { 
                        font-family: 'Segoe UI', Arial, sans-serif; 
                        -webkit-print-color-adjust: exact;
                        background: #fff;
                        width: 210mm;
                        height: 297mm;
                    }
                    .a4-page {
                        width: 210mm;
                        height: 297mm;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        grid-template-rows: repeat(4, 1fr);
                        box-sizing: border-box;
                        page-break-after: always;
                    }
                    .label-cell {
                        width: 105mm;
                        height: 74.25mm;
                        padding: 8mm; /* Lề 8mm (gấp đôi 4mm) */
                        box-sizing: border-box;
                    }
                    .label-content {
                        border: 4px double #000;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        box-sizing: border-box;
                        font-size: 11pt;
                        overflow: hidden;
                    }
                    .header-part {
                        height: 13mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        border-bottom: 1.6px solid #000;
                    }
                    .header-part .title1 {
                        font-size: 13pt;
                        font-weight: bold;
                        line-height: 1.1;
                    }
                    .header-part .title2 {
                        font-size: 11pt;
                        font-weight: bold;
                        line-height: 1.1;
                        margin-top: 2px;
                    }
                    .middle-part {
                        flex: 1 1 0%;
                        padding: 1mm 5mm 3mm 5mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    .middle-title {
                        text-align: center;
                        font-size: 14pt;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .middle-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                        font-size: 11pt;
                    }
                    .middle-info-left {
                        display: flex;
                        flex-direction: column;
                        gap: 1mm;
                    }
                    .middle-info-right {
                        margin-right: 15mm;
                        font-size: 11pt;
                        font-weight: bold;
                    }
                    .bottom-part {
                        height: 6mm;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                        padding-left: 5mm;
                        border-top: 1.6px solid #000;
                        font-size: 10.4pt;
                        font-weight: bold;
                    }
                    @media print {
                        body {
                            width: 210mm;
                            height: 297mm;
                        }
                        .label-content {
                            border-color: #000 !important;
                        }
                    }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    // Render 8 labels
    const labels = Array.from({ length: 8 });

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden w-[600px] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">In mẫu dán nhãn (Khổ A4)</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            In mẫu dán nhãn chuẩn hóa chia làm 8 ô bằng nhau trên trang A4.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 overflow-y-auto space-y-6 flex flex-col items-center">
                    {/* State Selector */}
                    <div className="flex bg-muted p-1 rounded-lg w-full max-w-sm justify-center">
                        <button
                            type="button"
                            onClick={() => setLabelType("STANDARD_SOLUTION")}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                                labelType === "STANDARD_SOLUTION" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            DUNG DỊCH CHUẨN ĐỘ
                        </button>
                        <button
                            type="button"
                            onClick={() => setLabelType("REAGENT")}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                                labelType === "REAGENT" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            THUỐC THỬ
                        </button>
                    </div>

                    {/* Preview (Scaled down for UI display) */}
                    <div className="border border-border border-dashed p-4 bg-muted/20 rounded-xl max-h-[400px] overflow-y-auto w-full flex justify-center">
                        <div 
                            style={{ 
                                width: "105mm", // 50% scale representation
                                height: "148.5mm", 
                                border: "1px solid #ccc",
                                background: "#fff",
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gridTemplateRows: "repeat(4, 1fr)",
                                boxSizing: "border-box",
                                transform: "scale(1.0)",
                                transformOrigin: "top center",
                            }}
                        >
                            {labels.map((_, i) => (
                                <div 
                                    key={i} 
                                    style={{ 
                                        width: "52.5mm", 
                                        height: "37.12mm", 
                                        padding: "4mm", 
                                        boxSizing: "border-box",
                                    }}
                                >
                                    <div 
                                        style={{ 
                                            border: "2px double #000", 
                                            height: "100%", 
                                            display: "flex", 
                                            flexDirection: "column",
                                            boxSizing: "border-box",
                                            fontSize: "5.5pt"
                                        }}
                                    >
                                        <div style={{ height: "6.5mm", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", borderBottom: "0.8px solid #000" }}>
                                            <strong style={{ fontSize: "6.5pt", lineHeight: 1.1 }}>IDROP</strong>
                                            <strong style={{ fontSize: "5.5pt", lineHeight: 1.1 }}>PHÒNG KIỂM NGHIỆM</strong>
                                        </div>
                                        <div style={{ flex: 1, padding: "0.5mm 2.5mm 1.5mm 2.5mm", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                            <div style={{ textAlign: "center", fontSize: "7pt", fontWeight: "bold", textTransform: "uppercase" }}>
                                                {labelType === "STANDARD_SOLUTION" ? "DUNG DỊCH CHUẨN ĐỘ" : "THUỐC THỬ"}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "5.5pt" }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5mm" }}>
                                                    <div>Ngày pha:</div>
                                                    <div>HSD:</div>
                                                </div>
                                                {labelType === "STANDARD_SOLUTION" && (
                                                    <div style={{ marginRight: "7.5mm", fontWeight: "bold" }}>Hệ số K:</div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ height: "3mm", display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: "2.5mm", borderTop: "0.8px solid #000", fontSize: "5.2pt", fontWeight: "bold" }}>
                                            Bảo quản: 25± 5 °C
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Print HTML Content Container (Hidden, used for printing only) */}
                <div ref={printRef} className="hidden">
                    <div className="a4-page">
                        {labels.map((_, i) => (
                            <div key={i} className="label-cell">
                                <div className="label-content">
                                    <div className="header-part">
                                        <strong className="title1">IDROP</strong>
                                        <strong className="title2">PHÒNG KIỂM NGHIỆM</strong>
                                    </div>
                                    <div className="middle-part">
                                        <div className="middle-title">
                                            {labelType === "STANDARD_SOLUTION" ? "DUNG DỊCH CHUẨN ĐỘ" : "THUỐC THỬ"}
                                        </div>
                                        <div className="middle-info">
                                            <div className="middle-info-left">
                                                <div>Ngày pha:</div>
                                                <div>HSD:</div>
                                            </div>
                                            {labelType === "STANDARD_SOLUTION" && (
                                                <div className="middle-info-right">
                                                    Hệ số K:
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bottom-part">
                                        Bảo quản: 25± 5 °C
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3.5 border-t border-border flex items-center justify-end gap-2 shrink-0">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                    <Button type="button" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" /> In Nhãn (Khổ A4)
                    </Button>
                </div>
            </div>
        </div>
    );
}
