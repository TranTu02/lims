import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

/**
 * Label spec:
 * - Sheet row: 100mm x 30mm, contains 2 labels side-by-side (50mm x 30mm each)
 * - Each label: 2mm margin all edges
 *   - Left section (40mm): text info (skuId, name, CAS, lot, manufacturer)
 *   - Right section (10mm): inventoryId + QR code
 */

type LabelItem = {
    chemicalInventoryId: string;
    chemicalSkuId?: string | null;
    chemicalName?: string | null;
    chemicalCASNumber?: string | null;
    lotNumber?: string | null;
    manufacturerName?: string | null;
};

type Props = {
    items: LabelItem[];
    onClose: () => void;
};

// mm to px constant removed as we use mm units directly for better accuracy in printing

function LabelSingle({ item }: { item: LabelItem }) {
    const { t } = useTranslation();
    const [qrData, setQrData] = useState<string>("");

    useEffect(() => {
        if (item.chemicalInventoryId) {
            QRCode.toDataURL(item.chemicalInventoryId, {
                width: 100, // higher res for better print
                margin: 0,
                color: { dark: "#000000", light: "#ffffff" },
            }).then(setQrData);
        }
    }, [item.chemicalInventoryId]);

    return (
        <div
            className="label-single inline-flex bg-white overflow-hidden shrink-0"
            style={{
                width: "50mm",
                height: "30mm",
                padding: "2mm",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                color: "#000",
                display: "flex",
                flexDirection: "row",
                boxSizing: "border-box",
            }}
        >
            {/* Left: 36mm info section (38mm - 2mm padding) */}
            <div
                className="label-info flex flex-col justify-between overflow-hidden"
                style={{
                    width: "36mm",
                    paddingRight: "1mm",
                    fontSize: "7pt",
                    lineHeight: "1.3",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{ overflow: "hidden" }}>
                    <div className="sku" style={{ fontWeight: 700, fontSize: "7.5pt", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.chemicalSkuId || "-"}
                    </div>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.chemicalName || ""}</div>
                    {item.chemicalCASNumber && <div style={{ color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>CAS: {item.chemicalCASNumber}</div>}
                    {item.lotNumber && (
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t("inventory.chemical.inventories.lotShort", { defaultValue: "Lô" })}: {item.lotNumber}
                        </div>
                    )}
                    {item.manufacturerName && (
                        <div style={{ color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t("inventory.chemical.skus.mfgShort", { defaultValue: "NSX" })}: {item.manufacturerName}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: 10mm section - ID + QR */}
            <div
                className="label-qr flex flex-col items-center justify-center shrink-0"
                style={{
                    width: "10mm",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {qrData && (
                    <img
                        src={qrData}
                        alt="QR"
                        style={{
                            width: "8mm",
                            height: "8mm",
                            display: "block",
                        }}
                    />
                )}
                <div
                    className="id-text"
                    style={{
                        fontSize: "5pt",
                        fontFamily: "monospace",
                        textAlign: "center",
                        marginTop: "0.5mm",
                        wordBreak: "break-all",
                        lineHeight: 1.1,
                        maxWidth: "10mm",
                    }}
                >
                    {item.chemicalInventoryId}
                </div>
            </div>
        </div>
    );
}

export function PrintLabelModal({ items, onClose }: Props) {
    const { t } = useTranslation();
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
                <title>${t("inventory.chemical.inventories.printLabelTitle", { defaultValue: "In tem vật tư" })}</title>
                <style>
                    @page {
                        size: 100mm 30mm;
                        margin: 0;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Inter', 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; }
                    .label-row {
                        width: 100mm;
                        height: 30mm;
                        display: flex;
                        flex-direction: row;
                        page-break-after: always;
                        overflow: hidden;
                    }
                    .label-single {
                        width: 50mm;
                        height: 30mm;
                        padding: 2mm;
                        display: flex;
                        flex-direction: row;
                        border: 0.1mm solid #eee;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                    .label-info {
                        width: 36mm;
                        padding-right: 1mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        overflow: hidden;
                        font-size: 7pt;
                        line-height: 1.3;
                    }
                    .label-info .sku { font-weight: 700; font-size: 7.5pt; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .label-info div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .label-qr {
                        width: 10mm;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    .label-qr img { width: 8mm; height: 8mm; display: block; }
                    .label-qr .id-text {
                        font-size: 5pt;
                        font-family: monospace;
                        text-align: center;
                        margin-top: 0.5mm;
                        word-break: break-all;
                        line-height: 1.1;
                        max-width: 10mm;
                    }
                    @media print {
                        .label-single { border: none; }
                    }
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        printWindow.document.close();

        // Wait for images (QR) to load then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    // Group items into pairs for rows (2 labels per row)
    const rows: LabelItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
        rows.push(items.slice(i, i + 2));
    }

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-background rounded-xl shadow-2xl border border-border flex flex-col" style={{ width: "700px", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">{t("inventory.chemical.inventories.printLabelTitle", { defaultValue: "In Tem Vật Tư" })}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("inventory.chemical.inventories.printLabelDesc", { defaultValue: "{{count}} tem sẽ được in (50×30mm × 2/hàng)", count: items.length })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" /> {t("common.print", { defaultValue: "In" })}
                        </Button>
                        <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex-1 overflow-y-auto p-5 bg-muted/20 flex justify-center">
                    <div ref={printRef} className="space-y-4">
                        {rows.map((row, ri) => (
                            <div key={ri} className="label-row flex bg-white shadow-sm border border-gray-100" style={{ width: "100mm", height: "30mm" }}>
                                {row.map((item) => (
                                    <LabelSingle key={item.chemicalInventoryId} item={item} />
                                ))}
                                {/* Fill empty slot if odd number */}
                                {row.length === 1 && <div style={{ width: "50mm", height: "30mm" }} className="border-l border-gray-100 bg-gray-50/30" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
                    <span className="text-xs text-muted-foreground">{t("inventory.chemical.inventories.sheetSpec", { defaultValue: "Kích thước hàng: 100×30mm | Tem: 50×30mm | Lề: 2mm" })}</span>
                    <Button type="button" variant="outline" onClick={onClose}>
                        {t("common.close", { defaultValue: "Đóng" })}
                    </Button>
                </div>
            </div>
        </div>
    );
}
