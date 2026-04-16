import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Printer, Loader2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ChemicalTransaction } from "@/types/chemical";

const CONTENT_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm; /* A4 Portrait width */
    margin: 0 auto !important;
    padding: 10mm !important;
    background-color: white;
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.3;
    color: #000;
  }
  .master-table { width: 100%; border-collapse: collapse; border: none; }
  .master-table td { border: none !important; padding: 0 !important; }
  
  .data-table { width: 100% !important; border-collapse: collapse; margin-bottom: 15px; table-layout: fixed; }
  .data-table th, .data-table td { border: 1px solid black !important; padding: 4px 6px !important; vertical-align: middle; word-wrap: break-word; }
  .data-table th { background-color: #f2f2f2; font-weight: bold; text-align: center; font-size: 9pt; }
  .data-table td { font-size: 9pt; }
  
  .text-center { text-align: center !important; }
  .text-right { text-align: right !important; }
  .title { font-size: 16pt; font-weight: bold; text-transform: uppercase; text-align: center; margin: 15px 0 5px 0; }
  .subtitle { font-size: 9pt; text-align: center; margin-bottom: 20px; font-style: italic; }
  
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
    @page { size: A4 portrait; margin: 1cm !important; }
    .master-table thead { display: table-header-group; } /* Repeat thead on every page */
  }
`;

const LOGO_URL = "https://documents-sea.bildr.com/rc19670b8d48b4c5ba0f89058aa6e7e4b/doc/IRDOP%20LOGO%20with%20Name.w8flZn8NnkuLrYinAamIkw.PAAKeAHDVEm9mFvCFtA46Q.svg";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ChemicalTransaction[];
}

export function ChemicalTransactionReportEditor({ open, onOpenChange, data }: Props) {
    const { t } = useTranslation();
    const editorRef = useRef<any>(null);
    const [editorReady, setEditorReady] = useState(false);

    const buildReportHtml = useCallback(() => {
        const orgName = t("testReport.institute.organizationName", { defaultValue: "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN" });
        const title = t("inventory.chemical.transactions.reportTitle", { defaultValue: "BÁO CÁO LỊCH SỬ GIAO DỊCH HÓA CHẤT / VẬT TƯ" });
        
        const rowsHtml = data.map((item, i) => {
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "-";
            const typeStr = item.transactionType === "IMPORT" ? t("inventory.chemical.transactionBlocks.types.INBOUND") : item.transactionType === "EXPORT" ? t("inventory.chemical.transactionBlocks.types.OUTBOUND") : t("inventory.chemical.transactionBlocks.types.ADJUSTMENT");
            const qtyStr = `${item.changeQty > 0 ? "+" : ""}${item.changeQty}`;
            const unitStr = item.chemicalTransactionUnit || (item as any).unit || "-";
            
            return `
                <tr>
                    <td style="text-align:center; width:30px;">${i + 1}</td>
                    <td style="text-align:center; width:75px;">${dateStr}</td>
                    <td style="text-align:center; width:70px; font-family:monospace; font-size:8pt;">${item.chemicalTransactionId || "-"}</td>
                    <td style="text-align:center; width:50px;">${typeStr}</td>
                    <td>${item.chemicalName || "-"}</td>
                    <td style="text-align:center; width:80px;">${item.chemicalCasNumber || "-"}</td>
                    <td style="text-align:center; width:95px; font-family:monospace; font-size:8pt;">${item.chemicalInventoryId || "-"}</td>
                    <td style="text-align:right; width:50px; font-weight:bold;">${qtyStr}</td>
                    <td style="text-align:center; width:45px;">${unitStr}</td>
                    <td style="font-size:8pt;">${item.chemicalTransactionNote || (item as any).note || "-"}</td>
                </tr>
            `;
        }).join("");

        const now = new Date().toLocaleString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        return `
            <table class="master-table">
                <thead>
                    <tr>
                        <td style="border:none !important; padding-bottom: 10px;">
                            <!-- Header Layout similar to Phiếu nhập xuất kho -->
                            <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:14px;">
                                <tr>
                                    <td style="border:none!important; width:80px; vertical-align:top; padding:0;">
                                        <img src="${LOGO_URL}" style="height:52px; width:auto;" />
                                    </td>
                                    <td style="border:none!important; text-align:center; vertical-align:middle; padding:0 10px;">
                                        <div style="font-size:11px; font-weight:700; text-transform:uppercase;">${orgName}</div>
                                        <div style="font-size:18px; font-weight:700; text-transform:uppercase; margin-top:6px; letter-spacing:1px;">${title}</div>
                                        <div style="font-size:10px; margin-top:2px; font-style:italic; color:#666;">${t("inventory.chemical.transactions.subtitle", { defaultValue: "Dữ liệu trích xuất từ danh sách đang hiển thị" })}</div>
                                    </td>
                                    <td style="border:none!important; text-align:right; vertical-align:top; padding:0; white-space:nowrap; font-size:11px; min-width:140px;">
                                        <div><strong>${t("common.extractionDate", { defaultValue: "Ngày trích xuất" })}:</strong> ${now}</div>
                                        <div style="margin-top:2px; font-size:10px;">${t("common.count", { defaultValue: "Số bản ghi" })}: ${data.length}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border:none !important;">
                            <!-- Data Table (Content Row) -->
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th style="width:30px;">${t("inventory.chemical.transactions.stt", { defaultValue: "STT" })}</th>
                                        <th style="width:75px;">${t("common.createdAt", { defaultValue: "Ngày" })}</th>
                                        <th style="width:70px;">${t("inventory.chemical.transactions.transactionId", { defaultValue: "Mã GD" })}</th>
                                        <th style="width:50px;">${t("common.type", { defaultValue: "Loại" })}</th>
                                        <th>${t("inventory.chemical.transactions.chemicalName", { defaultValue: "Tên hóa chất / Vật tư" })}</th>
                                        <th style="width:80px;">${t("inventory.chemical.transactions.cas", { defaultValue: "CAS" })}</th>
                                        <th style="width:95px;">${t("inventory.chemical.transactions.inventoryId", { defaultValue: "Mã chai" })}</th>
                                        <th style="width:50px;">${t("inventory.chemical.transactions.qty", { defaultValue: "SL" })}</th>
                                        <th style="width:45px;">${t("inventory.chemical.transactions.unit", { defaultValue: "ĐVT" })}</th>
                                        <th>${t("common.note", { defaultValue: "Ghi chú" })}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml || `<tr><td colspan="10" style="text-align:center; padding: 20px;">${t("common.noData")}</td></tr>`}
                                </tbody>
                            </table>

                            <div style="margin-top: 30px;">
                                <table style="width: 100%; border: none;">
                                    <tr>
                                        <td style="border:none !important; width: 60%;"></td>
                                        <td style="text-align: center; border:none !important; width: 40%;">
                                            <strong>${t("common.reportPreparedBy")}</strong><br/>
                                            <em style="font-size: 9pt;">${t("common.signAndWriteName")}</em>
                                            <br/><br/><br/><br/><br/>
                                            __________________________
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }, [t, data]);

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

    const handlePrint = () => {
        if (editorRef.current) editorRef.current.execCommand("mcePrint");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] h-[98vh] p-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl [&>button:last-child]:hidden">
                <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/30">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        {t("inventory.chemical.transactions.reportEditorTitle", { defaultValue: "Trích xuất Báo cáo Giao dịch" })}
                        <span className="text-xs font-normal text-muted-foreground ml-2">({data.length} bản ghi)</span>
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="default" size="sm" onClick={handlePrint} className="h-9 shadow-sm">
                            <Printer className="w-4 h-4 mr-2" />
                            {t("common.print", { defaultValue: "In / Xuất PDF" })}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-9">
                            {t("common.close", { defaultValue: "Đóng" })}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-muted/10 relative overflow-hidden">
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
