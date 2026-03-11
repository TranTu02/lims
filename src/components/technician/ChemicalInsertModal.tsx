import { useRef, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Loader2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


const CHEM_CONTENT_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    padding: 10mm 12mm;
    background-color: white;
    font-family: "Times New Roman", Times, serif;
    font-size: 13px;
    line-height: 1.4;
    color: #000;
  }
  table { width: 100% !important; border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid black !important; padding: 5px 8px !important; vertical-align: middle; }
  th { font-weight: bold; text-align: center; }
  @media print {
    body { padding: 0 !important; }
    @page { size: A4 landscape !important; margin: 1cm !important; }
  }
`;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    consumablesUsed: any[];
    onInsert: (html: string) => void;
}

export function ChemicalInsertModal({ open, onOpenChange, consumablesUsed, onInsert }: Props) {
    const { t } = useTranslation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);
    const [editorReady, setEditorReady] = useState(false);
    const [previewGenerated, setPreviewGenerated] = useState(false);

    // Build the HTML table for the chemical list
    const buildChemicalTableHtml = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rows: any[]) => {
            const rowsHtml = rows
                .map(
                    (inv, i) => `
            <tr>
              <td style="text-align:center;">${i + 1}</td>
              <td>${inv.chemicalName || "-"}</td>
              <td style="text-align:center;">${inv.chemicalCasNumber || "-"}</td>
              <td style="text-align:center;">${inv.lotNumber || "-"}</td>
              <td>${inv.manufacturerName || "-"}</td>
              <td style="text-align:right;">${inv.changeQty ? Math.abs(inv.changeQty) : "-"} ${inv.chemicalBaseUnit || ""}</td>
            </tr>`,
                )
                .join("");

            return `
        <h4 style="margin-bottom:8px;">${t("technician.workspace.chemicalInventoryList", { defaultValue: "Danh sách hóa chất sử dụng" })}</h4>
        <table>
          <thead>
            <tr>
              <th style="width:40px;">STT</th>
              <th>${t("technician.workspace.chemName", { defaultValue: "Tên hóa chất" })}</th>
              <th style="width:110px;">${t("inventory.chemical.skus.casNumber", { defaultValue: "Số CAS" })}</th>
              <th style="width:110px;">${t("inventory.chemical.inventories.lotNumber", { defaultValue: "Số lô" })}</th>
              <th>${t("inventory.chemical.inventories.manufacturer", { defaultValue: "Nhà sản xuất" })}</th>
              <th style="width:90px;">${t("inventory.chemical.inventories.currentQty", { defaultValue: "Số lượng" })}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="6" style="text-align:center;font-style:italic;">${t("common.noData", { defaultValue: "Không có dữ liệu" })}</td></tr>`}
          </tbody>
        </table>
        <br/>`;
        },
        [t],
    );

    // When editor is ready, populate
    useEffect(() => {
        if (editorReady && !previewGenerated) {
            const html = buildChemicalTableHtml(consumablesUsed || []);
            editorRef.current?.setContent(html);
            setPreviewGenerated(true);
        }
    }, [editorReady, previewGenerated, consumablesUsed, buildChemicalTableHtml]);

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setPreviewGenerated(false);
            setEditorReady(false);
        }
    }, [open]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInit = useCallback((_evt: unknown, editor: any) => {
        editorRef.current = editor;
        setEditorReady(true);
    }, []);

    const handleInsert = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.getContent();
        onInsert(html);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-[90vw] !w-[90vw] h-[85vh] p-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b shrink-0 bg-muted/30">
                    <DialogTitle className="text-base font-semibold flex items-center gap-2">
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono uppercase">
                            {t("technician.workspace.chemicalInsertModal.title", { defaultValue: "Chèn bảng Hóa chất" })}
                        </span>
                        <span className="text-muted-foreground text-sm font-normal">
                            {t("technician.workspace.chemicalInsertModal.subtitle", { defaultValue: "Chỉnh sửa nội dung trước khi chèn vào biên bản" })}
                        </span>
                    </DialogTitle>
                    <div className="flex items-center gap-2 pr-4">
                        <Button size="sm" variant="outline" onClick={() => onOpenChange(false)} className="h-8">
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            {t("common.cancel", { defaultValue: "Hủy" })}
                        </Button>
                        <Button size="sm" onClick={handleInsert} className="h-8 shadow-sm">
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            {t("technician.workspace.chemicalInsertModal.insertBtn", { defaultValue: "Chèn vào biên bản" })}
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden relative">
                    {!editorReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    <Editor
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        onInit={handleInit}
                        initialValue=""
                        init={{
                            height: "100%",
                            width: "100%",
                            menubar: false,
                            statusbar: false,
                            base_url: "/tinymce",
                            suffix: ".min",
                            plugins: "table lists code",
                            toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | table | code",
                            paste_as_text: true,
                            content_style: CHEM_CONTENT_STYLE,
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
