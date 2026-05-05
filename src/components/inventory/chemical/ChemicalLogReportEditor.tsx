import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Loader2, FileText, Download, Eye, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/api/client";
import type { ChemicalInventory } from "@/types/chemical";

const CONTENT_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm; /* A4 Portrait width */
    margin: 0 auto !important;
    padding: 10mm !important;
    background-color: white;
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
  }
  .page { page-break-after: always; padding-bottom: 20px; }
  .page:last-child { page-break-after: auto; }
  .data-table { width: 100% !important; border-collapse: collapse; margin-top: 15px; table-layout: fixed; }
  .data-table th, .data-table td { border: 1px solid black !important; padding: 6px !important; vertical-align: middle; word-wrap: break-word; }
  .data-table th { background-color: white; font-weight: bold; text-align: center; }
  tr { page-break-inside: avoid !important; break-inside: avoid !important; }
  thead { display: table-header-group !important; }
  .text-center { text-align: center !important; }
  
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
    @page { size: A4 portrait; margin: 1cm !important; }
  }
`;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inventories: ChemicalInventory[];
}

export function ChemicalLogReportEditor({ open, onOpenChange, inventories }: Props) {
    const { t } = useTranslation();
    const editorRef = useRef<any>(null);
    const [editorReady, setEditorReady] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const buildReportHtml = useCallback(() => {
        if (!inventories || inventories.length === 0) return "";

        const content = inventories
            .map((item, index) => {
                const chemicalName = item.chemicalName || (item as any).chemicalSku?.chemicalName || item.chemicalSkuId || "";
                const casNumber = item.chemicalCasNumber || (item as any).chemicalSku?.chemicalCASNumber || "";
                const manufacturer = item.manufacturerName || "";
                const country = item.manufacturerCountry || "";
                const lotNumber = item.lotNumber || "";
                const mfgDate = item.mfgDate ? new Date(item.mfgDate).toLocaleDateString("vi-VN") : "";
                const expDate = item.expDate ? new Date(item.expDate).toLocaleDateString("vi-VN") : "";

                const rows = Array.from({ length: 39 })
                    .map(
                        () => `
                <tr>
                    <td style="height: 40px; border: 1px solid black;"></td>
                    <td style="border: 1px solid black;"></td>
                    <td style="border: 1px solid black;"></td>
                    <td style="border: 1px solid black;"></td>
                    <td style="border: 1px solid black;"></td>
                    <td style="border: 1px solid black;"></td>
                    <td style="border: 1px solid black;"></td>
                </tr>
            `,
                    )
                    .join("");

                return `
                <div class="page">
                    <table style="width: 100%; border: none; border-collapse: collapse;">
                        <thead>
                            <tr>
                                <td style="border: none; padding: 0;">
                                    <table style="width: 100%; border-collapse: collapse; border: 1px solid black; margin-bottom: 20px;">
                                        <tr>
                                            <td style="width: 110px; border: 1px solid black; text-align: center; vertical-align: middle; padding: 10px;">
                                                <img src="https://cdn.nhanlucnganhluat.vn/uploads/images/326A5071/logo/2024-10/IRDOP-LOGO-2710-02-2.png" alt="Logo" style="max-width: 72px; height: auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                                                <div style="display: none; font-size: 24px; font-weight: bold; color: #3b82f6;">INRD</div>
                                            </td>
                                            <td style="border: 1px solid black; text-align: center; vertical-align: middle; padding: 10px;">
                                                <div style="font-size: 11pt; text-transform: uppercase;">VIỆN NGHIÊN CỨU & PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN</div>
                                                <div style="font-size: 11pt; text-transform: uppercase; margin-bottom: 10px;">PHÒNG PHÂN TÍCH - KIỂM NGHIỆM</div>
                                                <div style="font-size: 12pt; font-weight: bold; color: #555;">THEO DÕI HÓA CHẤT, CHẤT CHUẨN</div>
                                            </td>
                                            <td style="width: 170px; border: 1px solid black; padding: 10px; font-size: 10pt; line-height: 1.5;">
                                                <div>Mã hiệu: BM04-QT03-KN</div>
                                                <div>Lần ban hành: 03</div>
                                                <div>Ngày ban hành: 24/04/2026</div>
                                                <div>Trang: ___ / ___</div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: none; padding: 0;">
                                    <div style="margin-bottom: 10px; font-size: 11pt; display: flex; align-items: baseline;">
                        <span style="white-space: nowrap;">Tên hoá chất, chất chuẩn:</span>
                        <span style="flex: 1; border-bottom: 1px solid black; margin: 0 10px; padding-left: 10px; font-weight: bold;">${chemicalName}</span>
                        <span style="white-space: nowrap;">Mã số:</span>
                        <span style="flex: 1; border-bottom: 1px solid black; margin-left: 10px; padding-left: 10px; font-weight: bold;">${item.chemicalSkuId || ""}</span>
                    </div>

                    <table class="data-table" style="margin-bottom: 20px; width: 100%; border-collapse: collapse; border: 1px solid black;">
                        <tr>
                            <td style="width: 50%; padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">Dạng:</div>
                                    <div style="flex: 1;">Rắn &#9744; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Lỏng &#9744;</div>
                                </div>
                            </td>
                            <td style="width: 50%; padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">Ngày sản xuất:</div>
                                    <div style="flex: 1; font-weight: bold;">${mfgDate}</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">Công thức hóa học:</div>
                                    <div style="flex: 1; font-weight: bold;"></div>
                                </div>
                            </td>
                            <td style="padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">Nơi sản xuất:</div>
                                    <div style="flex: 1; font-weight: bold;">${country || manufacturer}</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">Số CAS:</div>
                                    <div style="flex: 1; font-weight: bold;">${casNumber}</div>
                                </div>
                            </td>
                            <td style="padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">Hạn sử dụng:</div>
                                    <div style="flex: 1; font-weight: bold;">${expDate}</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">Số ID_VT:</div>
                                    <div style="flex: 1; font-weight: bold; display: flex; align-items: flex-start; gap: 8px;">
                                        <div style="margin-top: 4px;">${item.chemicalInventoryId}</div>
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(item.chemicalInventoryId)}" style="width: 40px; height: 40px;" />
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 8px !important; border: 1px solid black;">
                                <div style="display: flex; margin-bottom: 5px;">
                                    <div style="width: 150px;">LOT:</div>
                                    <div style="flex: 1; font-weight: bold;">${lotNumber}</div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <table class="data-table" style="width: 100%; border-collapse: collapse; border: 1px solid black;">
                        <thead>
                            <tr>
                                <th rowspan="2" style="width: 120px; border: 1px solid black;">Ngày/tháng<br/>/năm</th>
                                <th rowspan="2" style="width: 130px; border: 1px solid black;">Khối<br/>lượng/thể<br/>tích<br/>( g/ml)</th>
                                <th colspan="3" style="border: 1px solid black;">Số lượng</th>
                                <th rowspan="2" style="width: 140px; border: 1px solid black;">Người<br/>Nhận</th>
                                <th rowspan="2" style="border: 1px solid black;">Ghi chú</th>
                            </tr>
                            <tr>
                                <th style="width: 70px; border: 1px solid black;">Nhập</th>
                                <th style="width: 70px; border: 1px solid black;">Xuất</th>
                                <th style="width: 70px; border: 1px solid black;">Tồn</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
</div>
            `;
            })
            .join("");

        return `
            <style>${CONTENT_STYLE}</style>
            ${content}
        `;
    }, [inventories]);

    useEffect(() => {
        if (editorReady && editorRef.current && open) {
            const html = buildReportHtml();
            editorRef.current.setContent(html);
        }
    }, [editorReady, open, buildReportHtml]);

    const handleInit = useCallback((_evt: unknown, editor: any) => {
        editorRef.current = editor;
        setEditorReady(true);
    }, []);

    const [isDownloading, setIsDownloading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadPdf = async () => {
        if (!editorRef.current) return;
        setIsDownloading(true);
        try {
            const html = buildReportHtml();
            const blob = await api.postRaw<Blob>("/v2/convert-html-to-pdf/form-3", {
                body: { html },
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `NhatKyHoaChat_${new Date().getTime()}.pdf`;
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
        if (!editorRef.current) return;
        setIsExporting(true);
        try {
            const html = buildReportHtml();
            const blob = await api.postRaw<Blob>("/v2/convert-html-to-pdf/form-3", {
                body: { html },
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
                        {t("inventory.chemical.inventories.logReportTitle", { defaultValue: "In Sổ (Nhật ký) Theo dõi Hóa chất" })}
                        <span className="text-xs font-normal text-muted-foreground ml-2">({inventories?.length || 0} lọ/chai)</span>
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        {pdfUrl ? (
                            <Button variant="outline" size="sm" onClick={() => setPdfUrl(null)} className="h-9 shadow-sm bg-white">
                                <X className="w-4 h-4 mr-2" />
                                {t("common.backToEditor", { defaultValue: "Quay lại Sửa" })}
                            </Button>
                        ) : (
                            <>
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
