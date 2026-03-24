import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QRCode from "qrcode";

/**
 * Label spec:
 * - Sheet row: 100mm x 22mm, contains 2 labels side-by-side (50mm x 22mm each)
 * - Each label: 2mm margin all edges
 *   - Left section (36mm): text info (skuId, name, CAS, lot, manufacturer)
 *   - Right section (10mm): inventoryId + QR code
 */

type LabelItem = {
    chemicalInventoryId: string;
    chemicalSkuId?: string | null;
    chemicalName?: string | null;
    chemicalCasNumber?: string | null;
    lotNumber?: string | null;
    manufacturerName?: string | null;
    mfgDate?: string | null;
    expDate?: string | null;
};

type Props = {
    items: LabelItem[];
    onClose: () => void;
};

// mm to px constant removed as we use mm units directly for better accuracy in printing

function LabelSingle({ item }: { item: LabelItem }) {
    const { t } = useTranslation();
    const [qrSvg, setQrSvg] = useState<string>("");

    const formatDateShort = (dateStr: string | null | undefined) => {
        if (!dateStr) return "__/__/__";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "__/__/__";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        if (item.chemicalInventoryId) {
            QRCode.toString(item.chemicalInventoryId, {
                type: "svg",
                margin: 0,
                color: { dark: "#000000", light: "#ffffff" },
                errorCorrectionLevel: "M",
            }).then(setQrSvg);
        }
    }, [item.chemicalInventoryId]);

    return (
        <div
            className="label-single inline-flex bg-white overflow-hidden shrink-0"
            style={{
                width: "50mm",
                height: "22mm",
                padding: "1.5mm",
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
                    width: "35mm",
                    paddingRight: "1mm",
                    fontSize: "7pt",
                    lineHeight: "0.95",
                    display: "flex",
                    flexDirection: "column",
                    fontWeight: 700,
                }}
            >
                <div style={{ overflow: "hidden" }}>
                    <div
                        className="name"
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            whiteSpace: "normal",
                            fontWeight: 900,
                            fontSize: "8.5pt",
                            lineHeight: "1.0",
                            marginBottom: "0.2mm",
                            textTransform: "uppercase",
                        }}
                    >
                        {item.chemicalName || ""}
                    </div>
                    {item.chemicalCasNumber && (
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "6.5pt", marginBottom: "0.1mm" }}>
                            CAS: {item.chemicalCasNumber}
                        </div>
                    )}
                    {item.lotNumber && (
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "0.1mm" }}>
                            {t("inventory.chemical.inventories.lotShort", { defaultValue: "Lô" })}: {item.lotNumber}
                        </div>
                    )}
                    {item.manufacturerName && (
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "6.5pt", marginBottom: "0.1mm" }}>
                            {t("inventory.chemical.skus.mfgPersonShort", { defaultValue: "NhSX" })}: {item.manufacturerName}
                        </div>
                    )}
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "6.5pt" }}>
                        NSX-HSD: {formatDateShort(item.mfgDate)} - {formatDateShort(item.expDate)}
                    </div>
                </div>
            </div>

            {/* Right: 10mm section - ID + QR */}
            <div
                className="label-qr flex flex-col items-center justify-between shrink-0"
                style={{
                    width: "12mm",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ fontSize: "6pt", fontWeight: 900, textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1 }}>
                    {item.chemicalSkuId ? item.chemicalSkuId.substring(4) : ""}
                </div>
                {qrSvg ? (
                    <div
                        style={{
                            width: "9.5mm",
                            height: "9.5mm",
                            display: "block",
                        }}
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                ) : (
                    <div style={{ width: "9.5mm", height: "9.5mm", background: "#f5f5f5" }} />
                )}
                <div
                    className="id-text"
                    style={{
                        fontSize: "6.5pt",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        textAlign: "center",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        whiteSpace: "normal",
                        wordBreak: "break-all",
                        lineHeight: 0.9,
                        maxWidth: "12mm",
                    }}
                >
                    {item.chemicalInventoryId ? item.chemicalInventoryId.substring(4) : ""}
                </div>
            </div>
        </div>
    );
}

export function PrintLabelModal({ items, onClose }: Props) {
    const { t } = useTranslation();
    const [quantities, setQuantities] = useState<Record<string, number>>(
        Object.fromEntries(items.map((it) => [it.chemicalInventoryId, 1])),
    );
    const printRef = useRef<HTMLDivElement>(null);

    // Final list of items based on quantities
    const finalItems = useMemo(() => {
        const result: LabelItem[] = [];
        items.forEach((item) => {
            const qty = quantities[item.chemicalInventoryId] || 1;
            for (let i = 0; i < qty; i++) {
                result.push({ ...item });
            }
        });
        return result;
    }, [items, quantities]);

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
                        size: 100mm 22mm;
                        margin: 0;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Inter', 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; }
                    .label-row {
                        width: 100mm;
                        height: 22mm;
                        display: flex;
                        flex-direction: row;
                        page-break-after: always;
                        overflow: hidden;
                    }
                    .label-single {
                        width: 50mm;
                        height: 22mm;
                        padding: 1.5mm;
                        display: flex;
                        flex-direction: row;
                        border: 0.1mm solid #eee;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                    .label-info {
                        width: 35mm;
                        padding-right: 1mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        overflow: hidden;
                        font-size: 7pt;
                        line-height: 0.95;
                        font-weight: 700;
                    }
                    .label-info .name { 
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        white-space: normal;
                        font-weight: 900; 
                        font-size: 8.5pt; 
                        line-height: 1.0; 
                        margin-bottom: 0.2mm;
                        text-transform: uppercase;
                    }
                    .label-info div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .label-qr {
                        width: 12mm;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between;
                        flex-shrink: 0;
                    }
                    .label-qr .svg-container { width: 9.5mm; height: 9.5mm; display: block; }
                    .label-qr svg { width: 9.5mm !important; height: 9.5mm !important; display: block; }
                    .label-qr .id-text {
                        font-size: 6.5pt;
                        font-weight: 900;
                        font-family: monospace;
                        text-align: center;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        white-space: normal;
                        word-break: break-all;
                        line-height: 0.9;
                        max-width: 12mm;
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
    for (let i = 0; i < finalItems.length; i += 2) {
        rows.push(finalItems.slice(i, i + 2));
    }

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-background rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
                style={{ width: "1000px", height: "90vh" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">{t("inventory.chemical.inventories.printLabelTitle", { defaultValue: "In Tem Vật Tư" })}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("inventory.chemical.inventories.printLabelDescFull", {
                                defaultValue: "Tổng cộng {{totalLabel}} tem cho {{count}} mẫu hóa chất",
                                count: items.length,
                                totalLabel: finalItems.length
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" onClick={handlePrint} size="sm">
                            <Printer className="h-4 w-4 mr-2" /> {t("common.print", { defaultValue: "In" })}
                        </Button>
                        <button type="button" onClick={onClose} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex divide-x divide-border">
                    {/* Left: Input quantities */}
                    <div className="w-[350px] overflow-y-auto p-4 bg-muted/10 space-y-3">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                            {t("inventory.chemical.inventories.configQuantities", { defaultValue: "Cấu hình số lượng tem" })}
                        </div>
                        {items.map((item) => (
                            <div key={item.chemicalInventoryId} className="bg-background border border-border p-3 rounded-lg flex items-center justify-between gap-3 shadow-sm">
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold truncate text-foreground uppercase">{item.chemicalName}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">ID: {item.chemicalInventoryId}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("common.quantityShort", { defaultValue: "S.L" })}</span>
                                    <div className="flex items-center">
                                        <button 
                                            className="h-7 w-7 flex items-center justify-center border border-input rounded-l-md hover:bg-muted"
                                            onClick={() => setQuantities(q => ({ ...q, [item.chemicalInventoryId]: Math.max(0, (q[item.chemicalInventoryId] || 1) - 1) }))}
                                        >
                                            -
                                        </button>
                                        <Input
                                            type="number"
                                            value={quantities[item.chemicalInventoryId] || 1}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value) || 0;
                                                setQuantities(q => ({ ...q, [item.chemicalInventoryId]: Math.min(100, Math.max(0, v)) }));
                                            }}
                                            className="h-7 w-12 rounded-none border-x-0 text-center text-xs font-bold p-0"
                                            min="0"
                                            max="100"
                                        />
                                        <button 
                                            className="h-7 w-7 flex items-center justify-center border border-input rounded-r-md hover:bg-muted"
                                            onClick={() => setQuantities(q => ({ ...q, [item.chemicalInventoryId]: Math.min(100, (q[item.chemicalInventoryId] || 1) + 1) }))}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Preview */}
                    <div className="flex-1 overflow-y-auto p-6 bg-muted/20 flex flex-col items-center">
                        <div className="w-full max-w-[500px] flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("common.preview", { defaultValue: "Xem trước bản in (Grid 100x22mm)" })}</span>
                        </div>
                        <div className="bg-white shadow-2xl p-6 border border-border border-dashed inline-block">
                            <div ref={printRef} className="space-y-0">
                                {rows.map((row, ri) => (
                                    <div key={ri} className="label-row flex border-b border-gray-100 last:border-b-0" style={{ width: "100mm", height: "22mm" }}>
                                        {row.map((item) => (
                                            <LabelSingle key={`row-${ri}-it-${item.chemicalInventoryId}`} item={item} />
                                        ))}
                                        {/* Fill empty slot if odd number */}
                                        {row.length === 1 && <div style={{ width: "50mm", height: "22mm" }} className="label-single border-l border-gray-100" />}
                                    </div>
                                ))}
                                {rows.length === 0 && (
                                    <div className="w-[100mm] h-[22mm] flex items-center justify-center text-muted-foreground text-xs italic bg-gray-50 uppercase tracking-widest">
                                        {t("inventory.chemical.inventories.noLabels", { defaultValue: "Chưa có tem nào để in" })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0 bg-background">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {t("inventory.chemical.inventories.sheetSpecFull", { 
                                defaultValue: "Giấy: 100×22mm | Tem: 50×22mm | Lề: 1.5mm | {{count}} bản in", 
                                count: finalItems.length 
                            })}
                        </span>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={onClose}>
                        {t("common.close", { defaultValue: "Đóng" })}
                    </Button>
                </div>
            </div>
        </div>
    );
}
