// src/components/reception/SamplePrintLabelModal.tsx
// In tem dán nhãn mẫu: 50mm x 22mm × 2 tem / hàng (100mm × 22mm per row)
// Bố cục mỗi tem: Trái → 3 dòng text | Phải → QR 18×18mm (lề 2mm)

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

import { X, Printer, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
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
function SampleLabelSingle({ item }: { item: SampleLabelItem }) {
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

    return (
        <div
            className="label-single"
            style={{
                width: "50mm",
                height: "22mm",
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
            {/* Left: Text info — sampleId (bold, large), sampleTypeName, productType */}
            <div
                className="label-info"
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "1mm",
                    overflow: "hidden",
                    paddingRight: "2mm",
                }}
            >
                {/* Line 1: sampleId — most important */}
                <div
                    className="label-sample-id"
                    style={{
                        fontWeight: 900,
                        fontSize: "9pt",
                        wordBreak: "break-all",
                        lineHeight: 1.1,
                        marginBottom: "0.5mm",
                    }}
                >
                    {item.sampleId}
                </div>

                {/* Line 2: sampleTypeName */}
                <div
                    className="label-type"
                    style={{
                        fontSize: "7.5pt",
                        color: "#000",
                        fontWeight: 600,
                        lineHeight: 1.1,
                        wordBreak: "break-word",
                    }}
                >
                    {item.sampleTypeName || "—"}
                </div>

                {/* Line 3: productType */}
                <div
                    className="label-product"
                    style={{
                        fontSize: "7pt",
                        color: "#000",
                        fontWeight: 500,
                        lineHeight: 1.1,
                        wordBreak: "break-word",
                    }}
                >
                    {item.productType || item.sampleClientInfo || "—"}
                </div>
            </div>

            {/* Right: QR code — 18×18mm */}
            <div
                className="label-qr"
                style={{
                    width: "18mm",
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
                            width: "18mm",
                            height: "18mm",
                            display: "block",
                        }}
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                ) : (
                    <div
                        style={{
                            width: "18mm",
                            height: "18mm",
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

// ── Print CSS ─────────────────────────────────────────────────────────────────
const PRINT_CSS = `
    @page {
        size: 100mm 22mm;
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
        height: 22mm;
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
        height: 22mm;
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
        gap: 1mm;
        overflow: hidden;
        padding-right: 2mm;
    }
    .label-sample-id {
        font-weight: 900;
        font-size: 9pt;
        line-height: 1.1;
        word-break: break-all;
        margin-bottom: 0.5mm;
        color: #000;
    }
    .label-type {
        font-size: 7.5pt;
        color: #000;
        font-weight: 600;
        line-height: 1.1;
        word-break: break-word;
    }
    .label-product {
        font-size: 7pt;
        color: #000;
        font-weight: 500;
        line-height: 1.1;
        word-break: break-word;
    }
    .label-qr {
        width: 18mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .label-qr svg {
        width: 18mm !important;
        height: 18mm !important;
        display: block;
    }
    @media print {
        .label-single { border: none; }
    }
`;

// ── Main Modal ────────────────────────────────────────────────────────────────
export function SamplePrintLabelModal({ items, receiptCode, onClose }: Props) {
    const printRef = useRef<HTMLDivElement>(null);

    // Group items into pairs (2 per row)
    const rows: SampleLabelItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2));
    }

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
    <style>${PRINT_CSS}</style>
</head>
<body onload="window.print(); window.close();">
<div class="print-body">
${content}
</div>
</body>
</html>`);
        printWindow.document.close();
    }, [receiptCode]);

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1100] transition-all duration-300" onClick={onClose} aria-hidden="true" />
            <div
                className="fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto bg-background rounded-xl shadow-2xl z-[1101] border border-border flex flex-col animate-in fade-in zoom-in-95 duration-200"
                style={{ width: "850px", height: "80vh" }}
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
                            {items.length} tem · kích thước 50×22mm · 2 tem/hàng
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={handlePrint} className="gap-1.5">
                            <Printer className="h-3.5 w-3.5" />
                            In
                        </Button>
                        <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Preview area */}
                <div className="flex-1 overflow-y-auto p-6 bg-muted/20 flex justify-center">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Package className="h-10 w-10 mb-3 opacity-30" />
                            <p className="text-sm">Chưa có mẫu nào để in tem</p>
                        </div>
                    ) : (
                        <div ref={printRef} className="space-y-4" style={{ transform: "scale(2.2)", transformOrigin: "top center" }}>
                            {rows.map((row, ri) => (
                                    <div
                                        key={ri}
                                        className="label-row flex"
                                        style={{
                                            width: "100mm",
                                            height: "22mm",
                                            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                                            marginBottom: ri === rows.length - 1 ? "40px" : "0", // Gap for the scaled preview at bottom
                                        }}
                                    >
                                    {row.map((item) => (
                                        <SampleLabelSingle key={item.sampleId} item={item} />
                                    ))}
                                    {/* Empty slot when odd number */}
                                    {row.length === 1 && (
                                        <div
                                            style={{
                                                width: "50mm",
                                                height: "22mm",
                                                background: "#fafafa",
                                                borderLeft: "1px dashed #ccc",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "6pt",
                                                color: "#999",
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

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
                    <span className="text-xs text-muted-foreground">Kích thước: 50×22mm × 2 tem/hàng (100×22mm) · Lề 2mm · QR 18×18mm (SVG)</span>
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
            </div>
        </>,
        document.body,
    );
}
