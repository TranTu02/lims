// src/components/reception/SamplePrintLabelModal.tsx
// In tem dán nhãn mẫu: 50mm x 22mm hoặc 50mm x 30mm × 2 tem / hàng (100mm per row)
// Bố cục mỗi tem: Trái → sampleId & sampleTypeName | Phải → QR code

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { X, Printer, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCode from "qrcode";

// ── Types ──────────────────────────────────────────────────────────────────────
export type SampleLabelItem = {
    sampleId: string;
    sampleTypeName?: string | null;
    productType?: string | null;
    sampleClientInfo?: string | null;
};

interface Props {
    items: SampleLabelItem[];
    receiptCode?: string | null;
    onClose: () => void;
}

// ── Single Label Component ────────────────────────────────────────────────────
function SampleLabelSingle({ item, labelSize }: { item: SampleLabelItem; labelSize: "22x50" | "30x50" }) {
    const [qrSvg, setQrSvg] = useState<string>("");

    useEffect(() => {
        if (item.sampleId) {
            QRCode.toString(item.sampleId, {
                type: "svg",
                margin: 0,
                color: { dark: "#000000", light: "#ffffff" },
                errorCorrectionLevel: "M",
            })
                .then(setQrSvg)
                .catch(() => {});
        }
    }, [item.sampleId]);

    const is22 = labelSize === "22x50";
    const height = is22 ? "22mm" : "30mm";
    const qrSize = is22 ? "18mm" : "24mm";
    const titleSize = is22 ? "9pt" : "11pt";
    const typeSize = is22 ? "7pt" : "8.5pt";

    return (
        <div
            className="label-single"
            style={{
                width: "50mm",
                height: height,
                padding: "2mm",
                fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                color: "#000",
                display: "flex",
                flexDirection: "row",
                boxSizing: "border-box",
                backgroundColor: "#fff",
                overflow: "hidden",
                flexShrink: 0,
            }}
        >
            {/* Left: Text info — sampleId & sampleTypeName */}
            <div
                className="label-info"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "1.5mm",
                    overflow: "hidden",
                    paddingRight: "2mm",
                }}
            >
                {/* Line 1: sampleId — most important */}
                <div
                    className="label-sample-id"
                    style={{
                        fontWeight: 900,
                        fontSize: titleSize,
                        wordBreak: "break-all",
                        lineHeight: 1.1,
                    }}
                >
                    {item.sampleId}
                </div>

                {/* Line 2: sampleTypeName */}
                <div
                    className="label-type"
                    style={{
                        fontSize: typeSize,
                        color: "#333",
                        fontWeight: 600,
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                    }}
                >
                    {item.sampleTypeName || "—"}
                </div>
            </div>

            {/* Right: QR code */}
            <div
                className="label-qr"
                style={{
                    width: qrSize,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                {qrSvg ? (
                    <div
                        style={{
                            width: qrSize,
                            height: qrSize,
                            display: "block",
                        }}
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                ) : (
                    <div
                        style={{
                            width: qrSize,
                            height: qrSize,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f5f5f5",
                            fontSize: "5pt",
                            color: "#999",
                        }}
                    >
                        QR
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function SamplePrintLabelModal({ items, receiptCode, onClose }: Props) {
    const printRef = useRef<HTMLDivElement>(null);
    const [labelSize, setLabelSize] = useState<"22x50" | "30x50">(() => {
        const saved = localStorage.getItem("preferredLabelSize");
        return (saved === "22x50" || saved === "30x50") ? saved : "22x50";
    });
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Sync labelSize selection with localStorage
    useEffect(() => {
        localStorage.setItem("preferredLabelSize", labelSize);
    }, [labelSize]);

    // Initialize quantities on items change
    useEffect(() => {
        const initial: Record<string, number> = {};
        items.forEach((item) => {
            initial[item.sampleId] = initial[item.sampleId] ?? 1;
        });
        setQuantities(initial);
    }, [items]);

    const handleQtyChange = (sampleId: string, delta: number) => {
        setQuantities((prev) => {
            const current = prev[sampleId] ?? 1;
            const next = Math.max(0, current + delta);
            return { ...prev, [sampleId]: next };
        });
    };

    const handleResetAll = () => {
        const reset: Record<string, number> = {};
        items.forEach((item) => {
            reset[item.sampleId] = 1;
        });
        setQuantities(reset);
    };

    // Flatten items list based on selected quantities
    const flatItems: SampleLabelItem[] = [];
    items.forEach((item) => {
        const qty = quantities[item.sampleId] ?? 1;
        for (let i = 0; i < qty; i++) {
            flatItems.push(item);
        }
    });

    // Group items into pairs (2 per row)
    const rows: SampleLabelItem[][] = [];
    for (let i = 0; i < flatItems.length; i += 2) {
        rows.push(flatItems.slice(i, i + 2));
    }

    const is22 = labelSize === "22x50";
    const rowHeight = is22 ? "22mm" : "30mm";
    const labelHeight = is22 ? "22mm" : "30mm";
    const qrSize = is22 ? "18mm" : "24mm";
    const titleSize = is22 ? "9pt" : "11pt";
    const typeSize = is22 ? "7pt" : "8.5pt";

    const printCSS = `
        @page {
            size: 100mm ${rowHeight};
            margin: 0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .print-body {
            width: 100mm;
        }
        .label-row {
            width: 100mm;
            height: ${rowHeight};
            display: flex;
            flex-direction: row;
            page-break-after: always;
            overflow: hidden;
        }
        .label-row:last-child {
            page-break-after: avoid;
        }
        .label-single {
            width: 50mm;
            height: ${labelHeight};
            padding: 2mm;
            display: flex;
            flex-direction: row;
            overflow: hidden;
            box-sizing: border-box;
            background: #fff;
        }
        .label-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 1.5mm;
            overflow: hidden;
            padding-right: 2mm;
        }
        .label-sample-id {
            font-weight: 900;
            font-size: ${titleSize};
            line-height: 1.1;
            word-break: break-all;
            color: #000;
        }
        .label-type {
            font-size: ${typeSize};
            color: #333;
            font-weight: 600;
            line-height: 1.2;
            word-break: break-word;
        }
        .label-qr {
            width: ${qrSize};
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .label-qr svg {
            width: ${qrSize} !important;
            height: ${qrSize} !important;
            display: block;
        }
        @media print {
            .label-single { border: none; }
        }
    `;

    const handlePrint = useCallback(() => {
        if (!printRef.current) return;

        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const content = printRef.current.innerHTML;

        printWindow.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8"/>
    <title>In tem mẫu${receiptCode ? ` — Phiếu ${receiptCode}` : ""}</title>
    <style>${printCSS}</style>
</head>
<body onload="window.print(); window.close();">
<div class="print-body">
${content}
</div>
</body>
</html>`);
        printWindow.document.close();
    }, [receiptCode, printCSS]);

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1100] transition-all duration-300" onClick={onClose} aria-hidden="true" />
            <div
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto bg-background rounded-xl shadow-2xl z-[1101] border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200"
                style={{ width: "950px", height: "85vh" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <h3 className="text-base font-semibold text-foreground">In tem nhãn mẫu</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {receiptCode && <span className="font-medium">Phiếu {receiptCode} · </span>}
                            {flatItems.length} tem cần in ({rows.length} hàng)
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Khổ tem:</span>
                            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as "22x50" | "30x50")}>
                                <SelectTrigger className="h-8 w-28 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[1200]">
                                    <SelectItem value="22x50" className="text-xs">22 x 50 mm</SelectItem>
                                    <SelectItem value="30x50" className="text-xs">30 x 50 mm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button size="sm" onClick={handlePrint} disabled={flatItems.length === 0} className="gap-1.5 h-8">
                            <Printer className="h-3.5 w-3.5" />
                            In tem
                        </Button>
                        <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area: Left Panel (Quantities) & Right Panel (Preview) */}
                <div className="flex-1 min-h-0 flex">
                    {/* Left Panel: Quantity Selector */}
                    <div className="w-[300px] border-r border-border flex flex-col bg-muted/10 shrink-0">
                        <div className="p-3 border-b border-border flex items-center justify-between bg-card shrink-0">
                            <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Số lượng tem in</span>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-primary px-2" onClick={handleResetAll}>
                                <RefreshCw className="h-2.5 w-2.5" />
                                Đặt lại 1
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
                            {items.map((item) => {
                                const qty = quantities[item.sampleId] ?? 1;
                                return (
                                    <div key={item.sampleId} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background shadow-sm hover:border-primary/20 transition-colors">
                                        <div className="min-w-0 pr-2">
                                            <div className="font-mono text-xs font-bold text-foreground truncate" title={item.sampleId}>{item.sampleId}</div>
                                            <div className="text-[10px] text-muted-foreground truncate" title={item.sampleTypeName ?? ""}>{item.sampleTypeName || "Chưa có phân loại"}</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-6 w-6 rounded-md hover:bg-muted font-bold text-xs"
                                                onClick={() => handleQtyChange(item.sampleId, -1)}
                                                disabled={qty <= 0}
                                            >
                                                -
                                            </Button>
                                            <span className="text-xs font-bold w-6 text-center">{qty}</span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-6 w-6 rounded-md hover:bg-muted font-bold text-xs"
                                                onClick={() => handleQtyChange(item.sampleId, 1)}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Panel: Live Preview */}
                    <div className="flex-1 overflow-y-auto p-6 bg-muted/30 flex justify-center items-start">
                        {flatItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground self-center">
                                <Package className="h-10 w-10 mb-3 opacity-30" />
                                <p className="text-sm font-medium">{"Chọn số lượng > 0 để hiển thị bản xem trước tem"}</p>
                            </div>
                        ) : (
                            <div
                                ref={printRef}
                                className="space-y-4"
                                style={{
                                    transform: is22 ? "scale(2.2)" : "scale(1.8)",
                                    transformOrigin: "top center",
                                    marginBottom: "100px",
                                }}
                            >
                                {rows.map((row, ri) => (
                                    <div
                                        key={ri}
                                        className="label-row flex"
                                        style={{
                                            width: "100mm",
                                            height: rowHeight,
                                            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                                        }}
                                    >
                                        {row.map((item, idx) => (
                                            <SampleLabelSingle key={`${item.sampleId}-${ri}-${idx}`} item={item} labelSize={labelSize} />
                                        ))}
                                        {/* Empty slot when odd number */}
                                        {row.length === 1 && (
                                            <div
                                                style={{
                                                    width: "50mm",
                                                    height: labelHeight,
                                                    background: "#fafafa",
                                                    borderLeft: "1px dashed #eee",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "6pt",
                                                    color: "#bbb",
                                                }}
                                            >
                                                trống
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0 bg-card">
                    <span className="text-[11px] text-muted-foreground">Khổ tem: 50×{is22 ? "22" : "30"}mm × 2 tem/hàng (100×{is22 ? "22" : "30"}mm) · Lề 2mm · QR {is22 ? "18×18" : "24×24"}mm (SVG)</span>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </div>
        </>,
        document.body,
    );
}
