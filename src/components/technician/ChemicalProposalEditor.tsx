import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Printer, Loader2, Beaker } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ChemicalTransactionBlock } from "@/types/chemical";

const CONTENT_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm;
    margin: 0 auto !important;
    padding: 10mm !important;
    background-color: white;
    font-family: "Times New Roman", Times, serif;
    font-size: 14px;
    line-height: 1.5;
    color: #000;
  }
  table { width: 100% !important; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid black !important; padding: 6px !important; vertical-align: middle; }
  th { background-color: #f7f7f7; font-weight: bold; text-align: center; }
  
  .text-center { text-align: center !important; }
  .text-right { text-align: right !important; }
  
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
    @page { size: A4 portrait; margin: 1cm !important; }
  }
`;

const LOGO_URL = "https://documents-sea.bildr.com/rc19670b8d48b4c5ba0f89058aa6e7e4b/doc/IRDOP%20LOGO%20with%20Name.w8flZn8NnkuLrYinAamIkw.PAAKeAHDVEm9mFvCFtA46Q.svg";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    block: ChemicalTransactionBlock;
}

export function ChemicalProposalEditor({ open, onOpenChange, block }: Props) {
    const { t } = useTranslation();
    const editorRef = useRef<any>(null);
    const [editorReady, setEditorReady] = useState(false);

    const buildProposalHtml = useCallback(() => {
        const orgName = t("testReport.institute.organizationName", { defaultValue: "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN" });
        const title = t("inventory.chemical.proposal.title", { defaultValue: "PHIẾU ĐỀ XUẤT HÓA CHẤT / VẬT TƯ" });
        
        const hasTransactions = block.chemicalTransactions && block.chemicalTransactions.length > 0;
        const items = (hasTransactions ? block.chemicalTransactions : block.chemicalTransactionBlockDetails) || [];
        
        const rowsHtml = items.map((item: any, i: number) => {
            const unit = item.chemicalTransactionUnit || item.chemicalTransactionBlockDetailUnit || "";
            const absQty = Math.abs(parseFloat(item.changeQty || "0"));
            
            let noteStr = item.chemicalTransactionNote || item.chemicalTransactionBlockDetailNote || "";
            if (item.parameterName) {
                noteStr = noteStr ? `${noteStr} (Chỉ tiêu: ${item.parameterName})` : `Chỉ tiêu: ${item.parameterName}`;
            }

            return `
                <tr>
                    <td style="text-align:center;">${i + 1}</td>
                    <td>${item.chemicalName || "-"}</td>
                    <td style="text-align:center;">${item.chemicalCasNumber || "-"}</td>
                    <td style="text-align:center;">${item.chemicalInventoryId || "-"}</td>
                    <td style="text-align:right;">${absQty} ${unit}</td>
                    <td>${noteStr || "-"}</td>
                </tr>
            `;
        }).join("");

        return `
            <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:20px;">
                <tr>
                    <td style="border:none !important; width:80px; vertical-align:top; padding:0;">
                      <img src="${LOGO_URL}" style="height:52px; width:auto;" />
                    </td>
                    <td style="border:none !important; text-align:center; vertical-align:middle; padding:0 8px;">
                      <div style="font-size:11px; font-weight:700; text-transform:uppercase;">${orgName}</div>
                      <div style="font-size:16px; font-weight:700; text-transform:uppercase; margin-top:5px;">${title}</div>
                      <div style="font-size:12px; margin-top:2px;">Mã phiếu: ${block.chemicalTransactionBlockId}</div>
                    </td>
                </tr>
            </table>

            <p style="margin-bottom:10px;"><strong>Ngày lập:</strong> ${new Date(block.createdAt).toLocaleDateString("vi-VN")}</p>
            <p style="margin-bottom:20px;"><strong>Người đề xuất:</strong> ${block.createdBy || block.createdById || "-"}</p>

            <table>
                <thead>
                    <tr>
                        <th style="width:40px;">STT</th>
                        <th>Tên hóa chất / Vật tư</th>
                        <th style="width:100px;">Số CAS</th>
                        <th style="width:100px;">Mã chai</th>
                        <th style="width:100px;">Số lượng</th>
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="6" style="text-align:center;">Không có dữ liệu</td></tr>'}
                </tbody>
            </table>

            <br/>
            <table style="width:100%; border:none !important;">
                <tr>
                    <td style="border:none !important; text-align:center; width:33%;">
                        <strong>Người lập phiếu</strong><br/>
                        <em style="font-size:12px;">(Ký, ghi rõ họ tên)</em>
                        <br/><br/><br/><br/>
                    </td>
                    <td style="border:none !important; text-align:center; width:33%;">
                        <strong>Quản lý kho</strong><br/>
                        <em style="font-size:12px;">(Ký, ghi rõ họ tên)</em>
                        <br/><br/><br/><br/>
                    </td>
                    <td style="border:none !important; text-align:center; width:33%;">
                        <strong>Người duyệt</strong><br/>
                        <em style="font-size:12px;">(Ký, ghi rõ họ tên)</em>
                        <br/><br/><br/><br/>
                    </td>
                </tr>
            </table>
        `;
    }, [t, block]);

    useEffect(() => {
        if (editorReady && editorRef.current && open) {
            const html = buildProposalHtml();
            editorRef.current.setContent(html);
        }
    }, [editorReady, open, buildProposalHtml]);

    const handleInit = useCallback((_evt: unknown, editor: any) => {
        editorRef.current = editor;
        setEditorReady(true);
    }, []);

    const handlePrint = () => {
        if (editorRef.current) editorRef.current.execCommand("mcePrint");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[95vw] !w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl [&>button:last-child]:hidden">
                <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/30">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <Beaker className="w-4 h-4 text-primary" />
                        {t("inventory.chemical.proposal.editorTitle", { defaultValue: "Soạn thảo Phiếu đề xuất hóa chất" })}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 shadow-sm">
                            <Printer className="w-4 h-4 mr-2" />
                            {t("common.print", { defaultValue: "In / Xuất PDF" })}
                        </Button>
                        <Button size="sm" onClick={() => onOpenChange(false)} className="h-8">
                            {t("common.close", { defaultValue: "Đóng" })}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-muted/10 relative overflow-hidden">
                    {!editorReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
