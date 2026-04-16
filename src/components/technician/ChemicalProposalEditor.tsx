import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Printer, Loader2, FileText } from "lucide-react";
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
    font-size: 13px;
    line-height: 1.5;
    color: #000;
  }
  table { width: 100% !important; border-collapse: collapse; margin-bottom: 10px; }
  th, td { border: 1px solid black !important; padding: 5px 7px !important; vertical-align: middle; }
  th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
  .no-border td, .no-border th { border: none !important; }
  .text-center { text-align: center !important; }
  .text-right { text-align: right !important; }
  p { margin-bottom: 4px; }
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
    @page { size: A4 portrait; margin: 1.2cm 1.5cm !important; }
  }
`;

const LOGO_URL =
    "https://documents-sea.bildr.com/rc19670b8d48b4c5ba0f89058aa6e7e4b/doc/IRDOP%20LOGO%20with%20Name.w8flZn8NnkuLrYinAamIkw.PAAKeAHDVEm9mFvCFtA46Q.svg";

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
        const orgName = t("testReport.institute.organizationName", {
            defaultValue: "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN",
        });

        const transactionType = block.transactionType ?? (block as any).type ?? "";
        const isExport = transactionType === "EXPORT";
        const isImport = transactionType === "IMPORT";

        const titleMap: Record<string, string> = {
            EXPORT: "PHIẾU XUẤT KHO",
            IMPORT: "PHIẾU NHẬP KHO",
            ADJUSTMENT: "PHIẾU ĐIỀU CHỈNH KHO",
        };
        const title = titleMap[transactionType] ?? "PHIẾU GIAO DỊCH KHO";

        const dateStr = block.createdAt
            ? new Date(block.createdAt).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
              })
            : new Date().toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
              });

        const hasTransactions = block.chemicalTransactions && block.chemicalTransactions.length > 0;
        const items = (hasTransactions ? block.chemicalTransactions : block.chemicalTransactionBlockDetails) || [];

        const rowsHtml = items
            .map((item: any, i: number) => {
                const unit = item.chemicalTransactionUnit || item.chemicalTransactionBlockDetailUnit || "";
                const absQty = Math.abs(parseFloat(item.changeQty || "0"));
                // Số lô: lấy từ item nếu có, hoặc từ nested inventory
                const lotNumber = item.lotNumber || item.chemicalInventory?.lotNumber || "-";

                let noteStr = item.chemicalTransactionNote || item.chemicalTransactionBlockDetailNote || "";
                if (item.parameterName) {
                    noteStr = noteStr
                        ? `${noteStr} (CT: ${item.parameterName})`
                        : `CT: ${item.parameterName}`;
                }

                return `
                <tr>
                    <td style="text-align:center;width:36px;">${i + 1}</td>
                    <td>${item.chemicalName || "-"}</td>
                    <td style="text-align:center;width:90px;">${item.chemicalCasNumber || "-"}</td>
                    <td style="text-align:center;font-family:monospace;width:110px;">${item.chemicalInventoryId || "-"}</td>
                    <td style="text-align:right;width:65px;">${absQty}</td>
                    <td style="text-align:center;width:55px;">${unit || "-"}</td>
                    <td style="text-align:center;width:90px;">${lotNumber}</td>
                    <td>${noteStr || "-"}</td>
                </tr>`;
            })
            .join("");

        // -------  Người xuất/nhập & người nhận / vị trí  -------
        const issuerLabel = isExport ? "Người xuất" : isImport ? "Người nhập" : "Người thực hiện";
        const receiverLabel = isExport ? "Người nhận hóa chất" : isImport ? "Vị trí nhập kho" : "Ghi chú";

        const infoBlock = `
            <table class="no-border" style="margin-bottom:14px;">
                <tr>
                    <td style="border:none!important; width:50%; padding:2px 0;">
                        <strong>${issuerLabel}:</strong>&nbsp;${block.createdBy || (block as any).createdById || "_____________________"}
                    </td>
                    <td style="border:none!important; width:50%; padding:2px 0;">
                        <strong>${receiverLabel}:</strong>&nbsp;_____________________
                    </td>
                </tr>
            </table>`;

        // ------- Signatures -------
        const signaturesHtml = isExport
            ? `<tr>
                <td style="border:none!important; text-align:center; width:33%;">
                    <strong>Kế toán</strong><br/>
                    <em style="font-size:11px;">(Ký, ghi rõ họ tên)</em>
                    <br/><br/><br/><br/>
                </td>
                <td style="border:none!important; text-align:center; width:33%;">
                    <strong>Thủ kho</strong><br/>
                    <em style="font-size:11px;">(Ký, ghi rõ họ tên)</em>
                    <br/><br/><br/><br/>
                </td>
                <td style="border:none!important; text-align:center; width:33%;">
                    <strong>Người nhận</strong><br/>
                    <em style="font-size:11px;">(Ký, ghi rõ họ tên)</em>
                    <br/><br/><br/><br/>
                </td>
               </tr>`
            : `<tr>
                <td style="border:none!important; text-align:center; width:50%;">
                    <strong>Kế toán</strong><br/>
                    <em style="font-size:11px;">(Ký, ghi rõ họ tên)</em>
                    <br/><br/><br/><br/>
                </td>
                <td style="border:none!important; text-align:center; width:50%;">
                    <strong>Thủ kho</strong><br/>
                    <em style="font-size:11px;">(Ký, ghi rõ họ tên)</em>
                    <br/><br/><br/><br/>
                </td>
               </tr>`;

        return `
            <!-- Header -->
            <table style="width:100%; border-collapse:collapse; border:none; margin-bottom:14px;">
                <tr>
                    <td style="border:none!important; width:80px; vertical-align:top; padding:0;">
                        <img src="${LOGO_URL}" style="height:52px; width:auto;" />
                    </td>
                    <td style="border:none!important; text-align:center; vertical-align:middle; padding:0 8px;">
                        <div style="font-size:11px; font-weight:700; text-transform:uppercase;">${orgName}</div>
                        <div style="font-size:18px; font-weight:700; text-transform:uppercase; margin-top:6px; letter-spacing:1px;">${title}</div>
                    </td>
                    <td style="border:none!important; text-align:right; vertical-align:top; padding:0; white-space:nowrap; font-size:12px; min-width:140px;">
                        <div><strong>Ngày:</strong> ${dateStr}</div>
                        <div style="margin-top:4px; font-family:monospace; font-weight:700; font-size:11px;">Mã phiếu: ${block.chemicalTransactionBlockId}</div>
                        ${block.referenceDocument ? `<div style="margin-top:2px; font-size:11px;">Chứng từ: ${block.referenceDocument}</div>` : ""}
                    </td>
                </tr>
            </table>

            <!-- Người thực hiện & người nhận -->
            ${infoBlock}

            <!-- Bảng hóa chất -->
            <table>
                <thead>
                    <tr>
                        <th style="width:36px;">STT</th>
                        <th>Tên hóa chất / Vật tư</th>
                        <th style="width:90px;">Số CAS</th>
                        <th style="width:110px;">Mã vật tư (kho)</th>
                        <th style="width:65px;">Số lượng</th>
                        <th style="width:55px;">Đơn vị</th>
                        <th style="width:90px;">Số lô</th>
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml || '<tr><td colspan="8" style="text-align:center;padding:12px;">Không có dữ liệu</td></tr>'}
                </tbody>
            </table>

            <!-- Signatures -->
            <br/>
            <table class="no-border">
                ${signaturesHtml}
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

    // Dynamic dialog title
    const transactionType = block.transactionType ?? (block as any).type ?? "";
    const dialogTitleMap: Record<string, string> = {
        EXPORT: "Soạn thảo Phiếu Xuất Kho",
        IMPORT: "Soạn thảo Phiếu Nhập Kho",
        ADJUSTMENT: "Soạn thảo Phiếu Điều Chỉnh Kho",
    };
    const dialogTitle = dialogTitleMap[transactionType] ?? "Soạn thảo Phiếu Giao Dịch Kho";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[95vw] !w-[95vw] h-[95vh] p-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl [&>button:last-child]:hidden">
                <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/30">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {t("inventory.chemical.proposal.editorTitle", { defaultValue: dialogTitle })}
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
