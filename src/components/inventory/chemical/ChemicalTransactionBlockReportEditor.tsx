import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Loader2, FileText, Download, Eye, X, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/api/client";
import type { EditLineItem } from "./TransactionBlocksTab";

// Minimal content style — TinyMCE can override class-based rules,
// so we use inline styles on all structural elements.
const CONTENT_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm;
    margin: 0 auto !important;
    padding: 10mm !important;
    background-color: white;
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
  }
  .text-center { text-align: center !important; }
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
    @page { size: A4 portrait; margin: 1cm !important; }
  }
`;

// Inline style constants — avoids TinyMCE class-based overrides
const S = {
    // layout table: invisible wrapper
    layoutTable: 'style="width:100%;border-collapse:collapse;border:none;border-spacing:0"',
    layoutTd:     'style="border:none;padding:0;vertical-align:top"',
    // header td gets extra bottom padding
    layoutHeaderTd: 'style="border:none;padding:0 0 5mm 0;vertical-align:top"',

    // header block table (with visible borders)
    headerTable: 'style="width:100%;border-collapse:collapse;border:1px solid black"',
    headerTd:    'style="border:1px solid black;padding:8px 10px;vertical-align:middle"',

    // data table
    dataTable: 'style="width:100%;border-collapse:collapse;border:1px solid black;margin-top:10px"',
    dataTh:    'style="border:1px solid black;padding:5px 6px;text-align:center;font-weight:bold;background:white;vertical-align:middle"',
    dataTd:    'style="border:1px solid black;padding:5px 6px;vertical-align:middle;word-wrap:break-word"',
    dataTdC:   'style="border:1px solid black;padding:5px 6px;text-align:center;vertical-align:middle;word-wrap:break-word"',

    // sign table: truly no border
    signTable: 'style="width:100%;border-collapse:collapse;border:none;border-spacing:0;margin-top:40px"',
    signTd:    'style="border:none;padding:8px 0;text-align:center;font-weight:bold;vertical-align:top;width:33%"',

    // section title bar
    sectionTitle: 'style="margin:16px 0 4px 0;padding:5px 10px;border-left:3px solid #555;font-weight:bold;font-size:11pt"',
};

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lineItems: EditLineItem[];
    transactionType: string;
    usedBy?: string;
    referenceDocument?: string;
    /** Always the chemicalTransactionBlockId regardless of referenceDocument */
    blockId?: string;
}

function getUnitForItem(item: EditLineItem): string {
    if (item.transactionUnit) return item.transactionUnit;
    const inv = item.inventory as any;
    return inv.chemicalBaseUnit || inv.unit || inv.chemicalSku?.chemicalBaseUnit || inv.chemicalSku?.unit || "";
}

function getInvFields(item: EditLineItem) {
    const inv = item.inventory;
    const chemicalName = inv.chemicalName || (inv as any).chemicalSku?.chemicalName || inv.chemicalSkuId || "";
    const casNumber = inv.chemicalCasNumber || (inv as any).chemicalSku?.chemicalCASNumber || "";
    const unit = getUnitForItem(item);
    return { chemicalName, casNumber, unit, inv };
}

function buildHtml(
    lineItems: EditLineItem[],
    transactionType: string,
    usedBy?: string,
    referenceDocument?: string,
    blockId?: string,
): string {
    if (!lineItems || lineItems.length === 0) return "<p>Chưa có dữ liệu</p>";

    const title =
        transactionType === "LAB_CONSUMPTION" ? "NHẬT KÝ SỬ DỤNG HÓA CHẤT"
        : transactionType === "PREPARATION"   ? "SỔ PHA HÓA CHẤT"
        : transactionType === "IMPORT"        ? "PHIẾU NHẬP KHO"
        : transactionType === "EXPORT"        ? "PHIẾU XUẤT KHO"
        : "NHẬT KÝ GIAO DỊCH HÓA CHẤT";

    const logoUrl = "https://cdn.nhanlucnganhluat.vn/uploads/images/326A5071/logo/2024-10/IRDOP-LOGO-2710-02-2.png";
    // Mã phiếu: always show blockId first, then referenceDocument as fallback
    const displayBlockId = blockId || referenceDocument || "";

    // --- Data tables ---
    function th(label: string, w?: string) {
        const wStyle = w ? `width:${w};` : "";
        return `<th style="border:1px solid black;padding:5px 6px;text-align:center;font-weight:bold;background:white;vertical-align:middle;${wStyle}">${label}</th>`;
    }
    function td(content: string, center = false) {
        const align = center ? "text-align:center;" : "";
        return `<td style="border:1px solid black;padding:5px 6px;vertical-align:middle;word-wrap:break-word;${align}">${content}</td>`;
    }

    let tableContent = "";

    if (transactionType === "PREPARATION") {
        const preparedItems = lineItems.filter(i => i.preparationRole === "PRODUCT" || (i.preparationRole === undefined && i.changeQty > 0));
        const sourceItems   = lineItems.filter(i => i.preparationRole === "MATERIAL" || (i.preparationRole === undefined && i.changeQty <= 0));

        const prepHeaderRow = `<tr>${th("TT","40px")}${th("Tên hóa chất")}${th("Số CAS","85px")}${th("Số lô","80px")}${th("Mã vật tư","130px")}${th("SL","50px")}${th("Đơn vị","60px")}${th("Ghi chú")}</tr>`;

        function prepRows(items: EditLineItem[]) {
            if (!items.length) return `<tr><td colspan="8" style="border:1px solid black;padding:12px;text-align:center;font-style:italic;color:#888">Chưa có dữ liệu</td></tr>`;
            return items.map((item, i) => {
                const { chemicalName, casNumber, unit, inv } = getInvFields(item);
                return `<tr>${td(String(i+1),true)}${td(chemicalName)}${td(casNumber,true)}${td(String(inv.lotNumber||""),true)}${td(inv.chemicalInventoryId,true)}${td(String(item.changeQty||0),true)}${td(unit,true)}${td(item.chemicalTransactionBlockDetailNote||"")}</tr>`;
            }).join("");
        }

        tableContent =
            `<div ${S.sectionTitle}>1. Hóa chất được pha (Thành phẩm)</div>` +
            `<table ${S.dataTable}><thead>${prepHeaderRow}</thead><tbody>${prepRows(preparedItems)}</tbody></table>` +
            `<div ${S.sectionTitle} style="margin-top:18px;margin-bottom:4px;padding:5px 10px;border-left:3px solid #555;font-weight:bold;font-size:11pt">2. Hóa chất dùng để pha (Nguyên liệu)</div>` +
            `<table ${S.dataTable}><thead>${prepHeaderRow}</thead><tbody>${prepRows(sourceItems)}</tbody></table>`;

    } else if (transactionType === "LAB_CONSUMPTION") {
        const headerRow = `<tr>${th("TT","38px")}${th("Ngày<br/>sử dụng","72px")}${th("Người<br/>sử dụng","100px")}${th("Tên hóa chất")}${th("Số CAS","80px")}${th("Số lô","72px")}${th("Mã vật tư","118px")}${th("SL","45px")}${th("Đơn vị","54px")}${th("Mã<br/>chỉ tiêu","78px")}</tr>`;
        const rows = lineItems.map((item, i) => {
            const { chemicalName, casNumber, unit, inv } = getInvFields(item);
            const usageDateStr = item.usageDate ? new Date(item.usageDate).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN");
            const performer = item.usageBy || usedBy || "";
            return `<tr>${td(String(i+1),true)}${td(usageDateStr,true)}${td(performer,true)}${td(chemicalName)}${td(casNumber,true)}${td(String(inv.lotNumber||""),true)}${td(inv.chemicalInventoryId,true)}${td(String(item.changeQty||0),true)}${td(unit,true)}${td(item.analysisId||"",true)}</tr>`;
        }).join("");
        tableContent = `<table ${S.dataTable}><thead>${headerRow}</thead><tbody>${rows}</tbody></table>`;

    } else {
        // IMPORT, EXPORT, ADJUSTMENT
        const headerRow = `<tr>${th("STT","40px")}${th("Tên hóa chất")}${th("Số CAS","90px")}${th("Số lô","90px")}${th("Mã vật tư","130px")}${th("SL","50px")}${th("Đơn vị","60px")}${th("Ghi chú")}</tr>`;
        const rows = lineItems.map((item, i) => {
            const { chemicalName, casNumber, unit, inv } = getInvFields(item);
            return `<tr>${td(String(i+1),true)}${td(chemicalName)}${td(casNumber,true)}${td(String(inv.lotNumber||""),true)}${td(inv.chemicalInventoryId,true)}${td(String(item.changeQty||0),true)}${td(unit,true)}${td(item.chemicalTransactionBlockDetailNote||"")}</tr>`;
        }).join("");
        tableContent = `<table ${S.dataTable}><thead>${headerRow}</thead><tbody>${rows}</tbody></table>`;
    }

    // --- Header block (bordered) ---
    const headerBlock =
        `<table style="width:100%;border-collapse:collapse;border:1px solid black"><tr>` +
        `<td style="border:1px solid black;padding:6px 8px;text-align:center;vertical-align:middle;width:95px">` +
        `<img src="${logoUrl}" alt="Logo" style="max-width:65px;height:auto"/>` +
        `</td>` +
        `<td style="border:1px solid black;padding:6px 8px;text-align:center;vertical-align:middle">` +
        `<div style="font-size:10.5pt;text-transform:uppercase">VIỆN NGHIÊN CỨU &amp; PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN</div>` +
        `<div style="font-size:10.5pt;text-transform:uppercase;margin-bottom:8px">PHÒNG PHÂN TÍCH - KIỂM NGHIỆM</div>` +
        `<div style="font-size:14pt;font-weight:bold">${title}</div>` +
        `</td>` +
        `<td style="border:1px solid black;padding:6px 10px;text-align:right;font-size:10pt;line-height:1.7;vertical-align:middle;width:165px">` +
        `<div>Mã phiếu: <b>${displayBlockId}</b></div>` +
        `<div>Ngày in: ${new Date().toLocaleDateString("vi-VN")}</div>` +
        `</td>` +
        `</tr></table>`;

    // --- Sign row (absolutely no borders) ---
    const signBlock =
        `<table style="width:100%;border-collapse:collapse;border:none;border-spacing:0;margin-top:40px"><tr>` +
        `<td style="border:none;padding:6px 0;text-align:center;font-weight:bold;vertical-align:top;width:33%">Người lập<br/><br/><br/><br/></td>` +
        `<td style="border:none;padding:6px 0;text-align:center;font-weight:bold;vertical-align:top;width:33%">Người phụ trách<br/><br/><br/><br/></td>` +
        `<td style="border:none;padding:6px 0;text-align:center;font-weight:bold;vertical-align:top;width:33%">Quản lý kho<br/><br/><br/><br/></td>` +
        `</tr></table>`;

    // --- Outer layout table: header repeats on page break ---
    const html =
        `<style>${CONTENT_STYLE}</style>` +
        `<table style="width:100%;border-collapse:collapse;border:none;border-spacing:0">` +
        // thead → repeats on each printed page
        `<thead><tr><td style="border:none;padding:0 0 5mm 0;vertical-align:top">${headerBlock}</td></tr></thead>` +
        // tbody → main content
        `<tbody><tr><td style="border:none;padding:0;vertical-align:top">${tableContent}${signBlock}</td></tr></tbody>` +
        `</table>`;

    return html;
}

export function ChemicalTransactionBlockReportEditor({ open, onOpenChange, lineItems, transactionType, usedBy, referenceDocument, blockId }: Props) {
    const { t } = useTranslation();
    const editorRef = useRef<any>(null);
    const [editorReady, setEditorReady] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const getHtml = useCallback(
        () => buildHtml(lineItems, transactionType, usedBy, referenceDocument, blockId),
        [lineItems, transactionType, usedBy, referenceDocument, blockId],
    );

    useEffect(() => {
        if (editorReady && editorRef.current && open) {
            editorRef.current.setContent(getHtml());
        }
    }, [editorReady, open, getHtml]);

    const handleInit = useCallback((_evt: unknown, editor: any) => {
        editorRef.current = editor;
        setEditorReady(true);
    }, []);

    const handlePrint = () => {
        if (editorRef.current) editorRef.current.execCommand("mcePrint");
    };

    const handleDownloadPdf = async () => {
        setIsDownloading(true);
        try {
            const blob = await api.postRaw<Blob>("/v2/convert-html-to-pdf/form-3", {
                body: { html: getHtml() },
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Phieu_" + transactionType + "_" + new Date().getTime() + ".pdf";
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Tải xuống PDF thành công");
        } catch (err: any) {
            toast.error("Lỗi xuất PDF: " + err.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleExportPreview = async () => {
        setIsExporting(true);
        try {
            const blob = await api.postRaw<Blob>("/v2/convert-html-to-pdf/form-3", {
                body: { html: getHtml() },
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
            toast.success("Đã tạo bản xem trước PDF");
        } catch (err: any) {
            toast.error("Lỗi tạo bản xem trước: " + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] h-[98vh] p-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl [&>button:last-child]:hidden">
                <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/30">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {transactionType === "LAB_CONSUMPTION"
                            ? "Nhật ký sử dụng hóa chất"
                            : transactionType === "PREPARATION"
                              ? "Sổ pha hóa chất"
                              : "In Phiếu Giao Dịch"}
                        <span className="text-xs font-normal text-muted-foreground ml-2">({lineItems?.length || 0} dòng)</span>
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {pdfUrl ? (
                            <Button variant="outline" size="sm" onClick={() => setPdfUrl(null)} className="h-9 shadow-sm bg-white">
                                <X className="w-4 h-4 mr-2" />
                                {t("common.backToEditor", { defaultValue: "Quay lại Sửa" })}
                            </Button>
                        ) : (
                            <>
                                <Button variant="default" size="sm" onClick={handlePrint} className="h-9 shadow-sm">
                                    <Printer className="w-4 h-4 mr-2" />
                                    {t("common.print", { defaultValue: "In" })}
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="h-9 shadow-sm bg-white" disabled={isDownloading || isExporting}>
                                    {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                    {t("common.downloadPdf", { defaultValue: "Tải PDF" })}
                                </Button>
                                <Button variant="default" size="sm" onClick={handleExportPreview} className="h-9 shadow-sm" disabled={isDownloading || isExporting}>
                                    {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                                    {t("common.exportPdf", { defaultValue: "Xuất file PDF" })}
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleClose} className="h-9">
                            {t("common.close", { defaultValue: "Đóng" })}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-muted/10 relative overflow-hidden">
                    {pdfUrl ? (
                        <iframe src={pdfUrl} className="w-full h-full border-none" title="PDF Preview" />
                    ) : (
                        <>
                            {!editorReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                            )}
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                onInit={handleInit}
                                init={{
                                    height: "100%",
                                    width: "100%",
                                    menubar: false,
                                    statusbar: false,
                                    base_url: "/tinymce",
                                    suffix: ".min",
                                    plugins: "table lists code",
                                    toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | table | code",
                                    content_style: CONTENT_STYLE,
                                    branding: false,
                                    promotion: false,
                                    skin_url: "/tinymce/skins/ui/oxide",
                                    content_css: "/tinymce/skins/content/default/content.min.css",
                                }}
                            />
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
