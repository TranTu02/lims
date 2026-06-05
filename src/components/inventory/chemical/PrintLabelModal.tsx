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
    chemicalType?: string | null;
    preparedBy?: any;
    preparationLocation?: string | null;
    preparedDate?: string | null;
    preparationDocuments?: string | null;
    correctionFactorK?: number | string | null;
    chemicalSku?: {
        chemicalSkuId: string;
        chemicalName: string;
        chemicalType?: string | null;
        chemicalCasNumber?: string | null;
    } | null;
};

type Props = {
    items: LabelItem[];
    onClose: () => void;
};

// mm to px constant removed as we use mm units directly for better accuracy in printing

function LabelSingle({ item, mode, labelSize }: { item: LabelItem; mode: "NORMAL" | "PREPARED" | "SUPPLEMENTARY" | "STANDARD_SOLUTION" | "REAGENT"; labelSize: "50x22" | "50x30" | "50x70" }) {
    const { t } = useTranslation();
    const [qrSvg, setQrSvg] = useState<string>("");

    const formatDateShort = (dateStr: string | null | undefined) => {
        if (!dateStr) return "_ _ / _ _ / _ _ _ _";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "_ _ / _ _ / _ _ _ _";
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
        if (item.chemicalInventoryId) {
            try {
                const code = QRCode.create(item.chemicalInventoryId, { errorCorrectionLevel: "L" });
                const size = code.modules.size;
                const rects: string[] = [];
                for (let r = 0; r < size; r++) {
                    for (let c = 0; c < size; c++) {
                        if (code.modules.get(c, r)) {
                            rects.push(`<rect x="${c}" y="${r}" width="1.05" height="1.05" fill="#000000" />`);
                        }
                    }
                }
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" height="100%" style="shape-rendering:crispEdges;"><rect width="${size}" height="${size}" fill="#ffffff" />${rects.join("")}</svg>`;
                setQrSvg(svg);
            } catch (err) {
                console.error("Failed to generate QR Code", err);
            }
        }
    }, [item.chemicalInventoryId]);

    const chemType = item.chemicalType || item.chemicalSku?.chemicalType || "";
    const isPreparedLayout = mode === "PREPARED" || 
        ((mode === "STANDARD_SOLUTION" || mode === "REAGENT") && ["Hóa chất pha", "Dung dịch chuẩn độ", "Thuốc thử"].includes(chemType));

    // Common text logic
    const displayName = `${(item.chemicalName || "").normalize("NFC")}${mode === "STANDARD_SOLUTION" ? " (CĐ)" : mode === "REAGENT" ? " (TT)" : ""}`;

    if (labelSize === "50x70") {
        return (
            <div
                className="label-single inline-flex bg-white overflow-hidden shrink-0"
                style={{
                    width: "50mm",
                    height: "70mm",
                    padding: "0",
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    color: "#000",
                    display: "flex",
                    flexDirection: "row",
                    boxSizing: "border-box",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        width: "70mm",
                        height: "50mm",
                        transform: "rotate(90deg) translateY(-50mm)",
                        transformOrigin: "top left",
                        display: "flex",
                        flexDirection: "column",
                        padding: "0",
                        boxSizing: "border-box",
                    }}
                >
                    {/* Top Row: 3.0 cm (30mm) for Chemical Name */}
                    <div
                        style={{
                            height: "30mm",
                            width: "70mm",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            overflow: "hidden",
                            padding: "1mm 3mm 1.5mm 3mm",
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            className="name"
                            style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                whiteSpace: "normal",
                                fontWeight: 950,
                                fontSize: "12.57pt",
                                lineHeight: "1.15",
                            }}
                        >
                            {displayName}
                        </div>
                    </div>

                    {/* Bottom Row: 2.0 cm (20mm) split into QR (1.3cm) and Info */}
                    <div
                        style={{
                            height: "20mm",
                            width: "70mm",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "stretch",
                            padding: "0 3mm 2mm 3mm",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* QR Section: 1.3cm (13mm) */}
                        <div
                            className="label-qr flex flex-col items-center justify-between shrink-0"
                            style={{
                                width: "13mm",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "space-between",
                                height: "100%",
                                paddingRight: "1mm",
                            }}
                        >
                            <div style={{ fontSize: "5pt", fontWeight: 900, textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1 }}>
                                {item.chemicalSkuId || ""}
                            </div>
                            {qrSvg ? (
                                <div
                                    className="svg-container"
                                    style={{
                                        width: "10mm",
                                        height: "10mm",
                                        display: "block",
                                    }}
                                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                                />
                            ) : (
                                <div className="svg-container" style={{ width: "10mm", height: "10mm", background: "#f5f5f5" }} />
                            )}
                            <div
                                className="id-text"
                                style={{
                                    fontSize: "5pt",
                                    fontWeight: 900,
                                    fontFamily: "monospace",
                                    textAlign: "center",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    whiteSpace: "normal",
                                    wordBreak: "break-all",
                                    lineHeight: 1.1,
                                    maxWidth: "13mm",
                                }}
                            >
                                {item.chemicalInventoryId || ""}
                            </div>
                        </div>

                        {/* Info Section: Remaining width */}
                        <div
                            className={`label-info flex flex-col justify-center overflow-hidden ${mode === "SUPPLEMENTARY" ? "supplementary" : ""}`}
                            style={{
                                flex: 1,
                                paddingLeft: "1.5mm",
                                fontSize: "8.75pt",
                                lineHeight: "1.44",
                                display: "flex",
                                flexDirection: "column",
                                fontWeight: 700,
                                height: "100%",
                                ...(mode === "SUPPLEMENTARY" ? { justifyContent: "center", alignItems: "center", textAlign: "center" } : {})
                            }}
                        >
                            {mode === "SUPPLEMENTARY" ? (
                                <div className="supplementary flex flex-col justify-center items-center text-center w-full h-full" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", height: "100%" }}>
                                    <div style={{ fontWeight: 900, fontSize: "13.75pt", lineHeight: "1.38" }}>IDROP</div>
                                    <div style={{ fontWeight: 900, fontSize: "10pt", lineHeight: "1.38", marginTop: "1.25mm" }}>PHÒNG KIỂM NGHIỆM</div>
                                </div>
                            ) : (
                                <div style={{ overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                                    {isPreparedLayout ? (
                                        <>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "7.25pt", marginBottom: "0.2mm" }}>
                                                Người pha: {(typeof item.preparedBy === "string" ? item.preparedBy : item.preparedBy?.identityName || "").normalize("NFC")}
                                            </div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "7.25pt", marginBottom: "0.2mm" }}>
                                                Tài liệu pha: {(item.preparationDocuments || "").normalize("NFC")}
                                            </div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "7.25pt", marginBottom: "0.2mm" }}>
                                                Ngày: {formatDateShort(item.preparedDate)} - {formatDateShort(item.expDate)}
                                            </div>
                                            {mode !== "REAGENT" && (
                                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "7.25pt", fontWeight: 900 }}>
                                                    K: {item.correctionFactorK ?? ""}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {item.chemicalCasNumber && (
                                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "8.12pt", marginBottom: "0.2mm" }}>CAS: {item.chemicalCasNumber}</div>
                                            )}
                                            {item.lotNumber && (
                                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "8.12pt", marginBottom: "0.2mm" }}>
                                                    {t("inventory.chemical.inventories.lotShort", { defaultValue: "Lô" })}: {item.lotNumber}
                                                </div>
                                            )}
                                            {item.manufacturerName && (
                                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "8.12pt", marginBottom: "0.2mm" }}>
                                                    {t("inventory.chemical.skus.mfgPersonShort", { defaultValue: "NhSX" })}: {item.manufacturerName}
                                                </div>
                                            )}
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "8.12pt", marginBottom: "0.2mm" }}>
                                                NSX-HSD: {formatDateShort(item.mfgDate)} - {formatDateShort(item.expDate)}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="label-single inline-flex bg-white overflow-hidden shrink-0"
            style={{
                width: "50mm",
                height: labelSize === "50x30" ? "30mm" : "22mm",
                padding: "1.5mm",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                color: "#000",
                display: "flex",
                flexDirection: "row",
                boxSizing: "border-box",
            }}
        >
            {/* Left: 38.1mm info section */}
            <div
                className={`label-info flex flex-col justify-between overflow-hidden ${mode === "SUPPLEMENTARY" ? "supplementary" : ""}`}
                style={{
                    width: "38.1mm",
                    paddingRight: "1mm",
                    fontSize: labelSize === "50x30" ? "8.05pt" : "7pt",
                    lineHeight: labelSize === "50x30" ? "1.32" : "1.15",
                    display: "flex",
                    flexDirection: "column",
                    fontWeight: 700,
                    ...(mode === "SUPPLEMENTARY" ? { justifyContent: "center", alignItems: "center", textAlign: "center" } : {})
                }}
            >
                {mode === "SUPPLEMENTARY" ? (
                    <div className="supplementary flex flex-col justify-center items-center text-center w-full h-full" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", height: "100%" }}>
                        <div style={{ fontWeight: 900, fontSize: "11pt", lineHeight: "1.1" }}>IDROP</div>
                        <div style={{ fontWeight: 900, fontSize: "8pt", lineHeight: "1.1", marginTop: "1mm" }}>PHÒNG KIỂM NGHIỆM</div>
                    </div>
                ) : (
                    <div style={{ overflow: "hidden" }}>
                        <div
                            className="name"
                            style={{
                                display: "-webkit-box",
                                WebkitLineClamp: labelSize === "50x30" ? 4 : 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                whiteSpace: "normal",
                                fontWeight: 900,
                                fontSize: labelSize === "50x30" ? "11.27pt" : "9.8pt",
                                lineHeight: labelSize === "50x30" ? "1.32" : "1.15",
                                marginBottom: "0.2mm",
                            }}
                        >
                            {displayName}
                        </div>
                        {isPreparedLayout ? (
                            <>
                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "6.67pt" : "5.8pt", marginBottom: "0.1mm" }}>
                                    Người pha: {(typeof item.preparedBy === "string" ? item.preparedBy : item.preparedBy?.identityName || "").normalize("NFC")}
                                </div>
                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "6.67pt" : "5.8pt", marginBottom: "0.1mm" }}>
                                    Tài liệu pha: {(item.preparationDocuments || "").normalize("NFC")}
                                </div>
                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "6.67pt" : "5.8pt", marginBottom: "0.1mm" }}>
                                    Ngày: {formatDateShort(item.preparedDate)} - {formatDateShort(item.expDate)}
                                </div>
                                {mode !== "REAGENT" && (
                                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "6.67pt" : "5.8pt", fontWeight: 900 }}>
                                        K: {item.correctionFactorK ?? ""}
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {item.chemicalCasNumber && (
                                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "7.47pt" : "6.5pt", marginBottom: "0.1mm" }}>CAS: {item.chemicalCasNumber}</div>
                                )}
                                {item.lotNumber && (
                                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "7.47pt" : "6.5pt", marginBottom: "0.1mm" }}>
                                        {t("inventory.chemical.inventories.lotShort", { defaultValue: "Lô" })}: {item.lotNumber}
                                    </div>
                                )}
                                {item.manufacturerName && (
                                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "7.47pt" : "6.5pt", marginBottom: "0.1mm" }}>
                                        {t("inventory.chemical.skus.mfgPersonShort", { defaultValue: "NhSX" })}: {item.manufacturerName}
                                    </div>
                                )}
                                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: labelSize === "50x30" ? "7.47pt" : "6.5pt", marginBottom: "0.1mm" }}>
                                    NSX-HSD: {formatDateShort(item.mfgDate)} - {formatDateShort(item.expDate)}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Right: 8.9mm section - ID + QR */}
            <div
                className="label-qr flex flex-col items-center justify-between shrink-0"
                style={{
                    width: "8.9mm",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <div style={{ fontSize: "6pt", fontWeight: 900, textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1 }}>
                    {item.chemicalSkuId || ""}
                </div>
                {qrSvg ? (
                    <div
                        className="svg-container"
                        style={{
                            width: "7.8mm",
                            height: "7.8mm",
                            display: "block",
                        }}
                        dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                ) : (
                    <div className="svg-container" style={{ width: "7.8mm", height: "7.8mm", background: "#f5f5f5" }} />
                )}
                <div
                    className="id-text"
                    style={{
                        fontSize: labelSize === "50x30" ? "6pt" : "5.22pt",
                        fontWeight: 900,
                        fontFamily: "monospace",
                        textAlign: "center",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        whiteSpace: "normal",
                        wordBreak: "break-all",
                        lineHeight: 1.1,
                        marginTop: "0.5mm",
                        maxWidth: "8.9mm",
                    }}
                >
                    {item.chemicalInventoryId || ""}
                </div>
            </div>
        </div>
    );
}

export function PrintLabelModal({ items, onClose }: Props) {
    const { t } = useTranslation();
    const [quantities, setQuantities] = useState<Record<string, number>>(Object.fromEntries(items.map((it) => [it.chemicalInventoryId, 1])));
    const printRef = useRef<HTMLDivElement>(null);

    const initialTab = useMemo(() => {
        return items.some(it => ["Hóa chất pha", "Dung dịch chuẩn độ", "Thuốc thử"].includes(it.chemicalType || it.chemicalSku?.chemicalType || "")) ? "PREPARED" : "NORMAL";
    }, [items]);
    const [activeTab, setActiveTab] = useState<"NORMAL" | "PREPARED" | "SUPPLEMENTARY" | "STANDARD_SOLUTION" | "REAGENT">(initialTab);
    const [labelSize, setLabelSize] = useState<"50x22" | "50x30" | "50x70">("50x22");

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
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${t("inventory.chemical.inventories.printLabelTitle", { defaultValue: "In tem vật tư" })}</title>
                <style>
                    @page {
                        size: 100mm ${labelSize === "50x70" ? "70mm" : labelSize === "50x30" ? "30mm" : "22mm"};
                        margin: 0;
                    }
                    html, body {
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { font-family: 'Inter', 'Segoe UI', sans-serif; -webkit-print-color-adjust: exact; }
                    .label-row {
                        width: 100mm;
                        height: ${labelSize === "50x70" ? "70mm" : labelSize === "50x30" ? "30mm" : "22mm"};
                        display: flex;
                        flex-direction: row;
                        page-break-after: always;
                        page-break-inside: avoid;
                        break-inside: avoid;
                        overflow: hidden;
                    }
                    .label-single {
                        width: 50mm;
                        height: ${labelSize === "50x70" ? "70mm" : labelSize === "50x30" ? "30mm" : "22mm"};
                        padding: ${labelSize === "50x70" ? "0" : "1.5mm"};
                        display: flex;
                        flex-direction: row;
                        border: 0.1mm solid #eee;
                        overflow: hidden;
                        box-sizing: border-box;
                        position: relative;
                    }
                    .label-info {
                        padding-right: 1mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        overflow: hidden;
                        font-weight: 700;
                    }
                    .label-info.supplementary {
                        justify-content: center !important;
                        align-items: center !important;
                        text-align: center !important;
                    }
                    .label-info .name { 
                        display: -webkit-box;
                        -webkit-line-clamp: ${labelSize === "50x70" ? "4" : labelSize === "50x30" ? "4" : "3"};
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        white-space: normal;
                        font-weight: 900; 
                        font-size: ${labelSize === "50x70" ? "12.57pt" : labelSize === "50x30" ? "11.27pt" : "9.8pt"}; 
                        line-height: ${labelSize === "50x70" ? "1.15" : labelSize === "50x30" ? "1.32" : "1.15"}; 
                        margin-bottom: 0.25mm;
                    }
                    .label-info div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .label-qr {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-between;
                        flex-shrink: 0;
                    }
                    .label-qr .svg-container { 
                        width: ${labelSize === "50x70" ? "10mm" : "7.8mm"}; 
                        height: ${labelSize === "50x70" ? "10mm" : "7.8mm"}; 
                        display: block; 
                    }
                    .label-qr svg { 
                        width: ${labelSize === "50x70" ? "10mm" : "7.8mm"} !important; 
                        height: ${labelSize === "50x70" ? "10mm" : "7.8mm"} !important; 
                        display: block; 
                        shape-rendering: crispEdges; 
                    }
                    .label-qr .id-text {
                        font-size: ${labelSize === "50x70" ? "6.5pt" : labelSize === "50x30" ? "6pt" : "5.22pt"};
                        font-weight: 900;
                        font-family: monospace;
                        text-align: center;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        white-space: normal;
                        word-break: break-all;
                        line-height: 1.1;
                        margin-top: 0.5mm;
                        max-width: ${labelSize === "50x70" ? "16mm" : "8.9mm"};
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
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-background rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden" style={{ width: "1000px", height: "90vh" }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-base font-semibold">{t("inventory.chemical.inventories.printLabelTitle", { defaultValue: "In Tem Vật Tư" })}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {t("inventory.chemical.inventories.printLabelDescFull", {
                                defaultValue: "Tổng cộng {{totalLabel}} tem cho {{count}} mẫu hóa chất",
                                count: items.length,
                                totalLabel: finalItems.length,
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

                {/* Tab Switcher */}
                <div className="px-5 border-b border-border flex gap-4 bg-muted/20 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
                    <button
                        type="button"
                        onClick={() => setActiveTab("NORMAL")}
                        className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                            activeTab === "NORMAL" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Mẫu thông thường
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("PREPARED")}
                        className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                            activeTab === "PREPARED" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Mẫu hóa chất pha
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("SUPPLEMENTARY")}
                        className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                            activeTab === "SUPPLEMENTARY" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Mẫu dán bổ sung
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("STANDARD_SOLUTION")}
                        className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                            activeTab === "STANDARD_SOLUTION" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Dung dịch chuẩn độ
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("REAGENT")}
                        className={`py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                            activeTab === "REAGENT" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Thuốc thử
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex divide-x divide-border">
                    {/* Left: Input quantities */}
                    <div className="w-[350px] overflow-y-auto p-4 bg-muted/10 space-y-4">
                        <div className="bg-background border border-border p-3 rounded-lg shadow-sm space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                                Khổ nhãn (Kích thước)
                            </label>
                            <select
                                value={labelSize}
                                onChange={(e) => setLabelSize(e.target.value as "50x22" | "50x30" | "50x70")}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                                <option value="50x22">Khổ tiêu chuẩn 50x22 mm</option>
                                <option value="50x30">Khổ lớn 50x30 mm (Chữ & giãn hàng +15%)</option>
                                <option value="50x70">Khổ dọc 50x70 mm (Xoay ngang, Chữ +25%, Tên +50%)</option>
                            </select>
                        </div>

                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                            {t("inventory.chemical.inventories.configQuantities", { defaultValue: "Cấu hình số lượng tem" })}
                        </div>
                        {items.map((item) => (
                            <div key={item.chemicalInventoryId} className="bg-background border border-border p-3 rounded-lg flex items-center justify-between gap-3 shadow-sm">
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold truncate text-foreground">{item.chemicalName}</div>
                                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">ID: {item.chemicalInventoryId}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{t("common.quantityShort", { defaultValue: "S.L" })}</span>
                                    <div className="flex items-center">
                                        <button
                                            className="h-7 w-7 flex items-center justify-center border border-input rounded-l-md hover:bg-muted"
                                            onClick={() => setQuantities((q) => ({ ...q, [item.chemicalInventoryId]: Math.max(0, (q[item.chemicalInventoryId] || 1) - 1) }))}
                                        >
                                            -
                                        </button>
                                        <Input
                                            type="number"
                                            value={quantities[item.chemicalInventoryId] || 1}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value) || 0;
                                                setQuantities((q) => ({ ...q, [item.chemicalInventoryId]: Math.min(100, Math.max(0, v)) }));
                                            }}
                                            className="h-7 w-12 rounded-none border-x-0 text-center text-xs font-bold p-0"
                                            min="0"
                                            max="100"
                                        />
                                        <button
                                            className="h-7 w-7 flex items-center justify-center border border-input rounded-r-md hover:bg-muted"
                                            onClick={() => setQuantities((q) => ({ ...q, [item.chemicalInventoryId]: Math.min(100, (q[item.chemicalInventoryId] || 1) + 1) }))}
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
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {t("common.preview", { defaultValue: `Xem trước bản in (Grid 100x${labelSize === "50x70" ? "70" : labelSize === "50x30" ? "30" : "22"}mm)` })}
                            </span>
                        </div>
                        <div className="bg-white shadow-2xl p-6 border border-border border-dashed inline-block">
                            <div ref={printRef} className="space-y-0">
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .label-qr svg {
                                        width: ${labelSize === "50x70" ? "10mm" : "7.1mm"} !important;
                                        height: ${labelSize === "50x70" ? "10mm" : "7.1mm"} !important;
                                        display: block !important;
                                        shape-rendering: crispEdges !important;
                                    }
                                `}} />
                                {rows.map((row, ri) => (
                                    <div key={ri} className="label-row flex border-b border-gray-100 last:border-b-0" style={{ width: "100mm", height: labelSize === "50x70" ? "70mm" : labelSize === "50x30" ? "30mm" : "22mm" }}>
                                        {row.map((item) => (
                                            <LabelSingle key={`row-${ri}-it-${item.chemicalInventoryId}`} item={item} mode={activeTab} labelSize={labelSize} />
                                        ))}
                                        {/* Fill empty slot if odd number */}
                                        {row.length === 1 && <div style={{ width: "50mm", height: labelSize === "50x70" ? "70mm" : labelSize === "50x30" ? "30mm" : "22mm" }} className="label-single border-l border-gray-100" />}
                                    </div>
                                ))}
                                {rows.length === 0 && (
                                    <div className="flex items-center justify-center text-muted-foreground text-xs italic bg-gray-50 uppercase tracking-widest" style={{ width: "100mm", height: labelSize === "50x70" ? "70mm" : labelSize === "50x30" ? "30mm" : "22mm" }}>
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
                                defaultValue: `Giấy: 100×${labelSize === "50x70" ? "70" : labelSize === "50x30" ? "30" : "22"}mm | Tem: 50×${labelSize === "50x70" ? "70" : labelSize === "50x30" ? "30" : "22"}mm | Lề: 1.5mm | {{count}} bản in`,
                                count: finalItems.length,
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
