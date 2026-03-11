import { useRef, useState, useCallback, useTransition } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { useTranslation } from "react-i18next";
import { Printer, X, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { randomSafe } from "@/utils/random";
import { useGenerateHandoverPdf } from "@/api/analyses";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TechnicianGroup = {
    technician: {
        identityId: string;
        identityName: string;
        alias?: string | null;
    };
    analyses: Array<{
        analysisId: string;
        sampleId: string;
        parameterName: string | null;
        protocolCode?: string | null;
        analysisUnit?: string | null;
        analysisDeadline?: string | null;
        analysisLocation?: string | null;
        analysisNotes?: string | null;
        sample?: { sampleName?: string | null; sampleType?: string | null } | null;
    }>;
};

type Props = {
    groups: TechnicianGroup[];
    onClose: () => void;
    onConfirm: (technicianId: string, analysisIds: string[]) => void;
};

/* ------------------------------------------------------------------ */
/*  A4 Content Style - Print-ready                                     */
/* ------------------------------------------------------------------ */

const CONTENT_STYLE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm;
    margin: 0 auto !important;
    padding: 0 10mm 0 10mm !important;
    background-color: white;
    font-family: "Times New Roman", Times, serif;
    font-size: 13px;
    line-height: 1.3;
    color: #000;
  }
  thead { display: table-header-group !important; }
  tr { page-break-inside: avoid !important; }
  table { width: 100% !important; border-collapse: collapse; margin-bottom: 8px; }
  .data-table th, .data-table td {
    border: 1px solid black !important;
    padding: 4px 8px !important;
    vertical-align: top;
  }
  .data-table th {
    background-color: #f5f5f5;
    font-weight: bold;
    text-align: center;
  }
  .section { margin-bottom: 12px; }
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; }
    @page { size: A4 portrait !important; margin: 0 !important; }
  }
`;

/* ------------------------------------------------------------------ */
/*  HTML Document Generator                                            */
/* ------------------------------------------------------------------ */

function generateHandoverHtml(group: TechnicianGroup, t: any): string {
    const today = new Date().toLocaleDateString("vi-VN");
    const bbCode = `BB_${randomSafe(10)}`;

    const analysisRows = group.analyses
        .map(
            (a, i) => `
      <tr>
        <td style="border:1px solid #000;padding:4px 8px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #000;padding:4px 8px">${a.sampleId ?? "-"}</td>
        <td style="border:1px solid #000;padding:4px 8px">${a.sample?.sampleType ?? "-"}</td>
        <td style="border:1px solid #000;padding:4px 8px;font-weight:bold">${a.parameterName ?? "-"}</td>
        <td style="border:1px solid #000;padding:4px 8px">${a.protocolCode ?? "-"}</td>
        <td style="border:1px solid #000;padding:4px 8px;text-align:center">${a.analysisUnit ?? "-"}</td>
        <td style="border:1px solid #000;padding:4px 8px;text-align:center">${a.analysisDeadline ? new Date(a.analysisDeadline).toLocaleDateString("vi-VN") : "-"}</td>
        <td style="border:1px solid #000;padding:4px 8px;font-size:11px">${a.analysisNotes ?? "-"}</td>
      </tr>`,
        )
        .join("");

    return `
<table style="width:100%;border-collapse:collapse;border:none;">
  <!-- HEADER: Professional logo + Info + BB Code -->
  <thead style="display:table-header-group;">
    <tr>
      <th style="border:none !important;padding-bottom:12px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
          <!-- Left: logo + info -->
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:6px; flex: 1;">
            <img
              src="https://documents-sea.bildr.com/rc19670b8d48b4c5ba0f89058aa6e7e4b/doc/IRDOP%20LOGO%20with%20Name.w8flZn8NnkuLrYinAamIkw.PAAKeAHDVEm9mFvCFtA46Q.svg"
              style="height:28px; width:auto; object-fit:contain;"
              draggable="false"
            />
            <div style="font-size:10.5px !important; line-height:1.3 !important; color:#0f172a; text-align:left; align-self: center;">
              <div style="font-weight:700 !important;">
                ${t("sampleRequest.institute.name")}
              </div>
              <div style="font-size:9.5px !important;">
                ${t("sampleRequest.institute.address")} - ${t("sampleRequest.institute.tel")} - ${t("sampleRequest.institute.email")}
              </div>
            </div>
            <div style="flex:1;">
              <div style="text-align:right; font-size:9px !important; font-weight:700 !important; white-space:nowrap; text-transform:uppercase;">
                Biên bản bàn giao nội bộ
              </div>
              <div style="text-align:right; font-size:9px !important; font-weight:700 !important; margin-top:2px;">
                 ${bbCode}
              </div>
            </div>
          </div>
        </div>
        <div style="border-top:1px solid #cbd5e1; margin-top:10px; margin-bottom: 4mm;"></div>
      </th>
    </tr>
  </thead>

  <!-- NỘI DUNG CHÍNH -->
  <tbody>
    <tr>
      <td style="border:none !important;">

        <!-- National Motto & Main Title below header -->
        <div style="text-align:center; margin-bottom:10px;">
          <p style="font-size:11px; font-weight:700; margin-bottom:4px;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p style="font-size:11px; font-weight:700; margin-bottom:12px;"><u>Độc lập - Tự do - Hạnh phúc</u></p>
          <h2 style="font-size:16px; font-weight:700; text-transform:uppercase; margin-bottom:4px;">BIÊN BẢN BÀN GIAO MẪU THỬ / CHỈ TIÊU PHÂN TÍCH</h2>
          <p style="font-size:12px; font-style:italic;">Ngày ${today}</p>
        </div>

        <div class="section" style="margin-top:12px;font-size:13px;line-height:1.8;">
          Căn cứ quy trình quản lý mẫu thử của Phòng thí nghiệm;<br/>
          Căn cứ vào nhu cầu thực tế công việc;<br/>
          <br/>
          Hôm nay, ngày <strong>${today}</strong>, tại Phòng thí nghiệm, chúng tôi gồm:
        </div>

        <table style="width:100%;border-collapse:collapse;border:none;margin:10px 0;font-size:13px;">
          <tr>
            <td style="border:none;width:50%;vertical-align:top;padding:0 8px 0 0;">
              <strong>BÊN GIAO (Quản lý mẫu):</strong><br/>
              Họ và tên: ........................................<br/>
              Chức vụ: Quản lý mẫu phòng thí nghiệm
            </td>
            <td style="border:none;width:50%;vertical-align:top;">
              <strong>BÊN NHẬN (Kỹ thuật viên):</strong><br/>
              Họ và tên: <strong>${group.technician.identityName}</strong><br/>
              Mã KTV: <strong>${group.technician.identityId}</strong>${group.technician.alias ? `<br/>Alias: <strong>${group.technician.alias}</strong>` : ""}
            </td>
          </tr>
        </table>

        <p style="font-size:13px;margin-bottom:8px;">Cùng thống nhất bàn giao các mẫu/chỉ tiêu phân tích dưới đây:</p>

        <table class="data-table" style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background-color:#f0f0f0;">
              <th style="border:1px solid #000;padding:5px 8px;text-align:center;width:30px">STT</th>
              <th style="border:1px solid #000;padding:5px 8px;text-align:left">Mã mẫu</th>
              <th style="border:1px solid #000;padding:5px 8px;text-align:left">Nền mẫu</th>
              <th style="border:1px solid #000;padding:5px 8px;text-align:left">Chỉ tiêu phân tích</th>
              <th style="border:1px solid #000;padding:5px 8px;text-align:left">Phương pháp</th>
              <th style="border:1px solid #000;padding:5px 8px;text-align:center">Đơn vị</th>
              <th style="border:1px solid #000;padding:5px 8px;text-align:center">Hạn trả</th>
              <th style="border:1px solid #000;padding:5px 8px;text-align:left">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${analysisRows}
          </tbody>
        </table>

        <div class="section" style="margin-top:14px;font-size:13px;line-height:1.8;">
          <strong>CAM KẾT:</strong>
          <ul style="margin:4px 0 0 20px;padding:0;">
            <li>Bên nhận cam kết thực hiện các phép thử theo đúng phương pháp và tiêu chuẩn quy định.</li>
            <li>Bên nhận cam kết bảo quản mẫu đúng quy định trong suốt quá trình thực hiện.</li>
            <li>Bên nhận cam kết hoàn thành và bàn giao kết quả đúng thời hạn đã cam kết.</li>
          </ul>
        </div>

        <p style="font-size:13px;margin-top:10px;">Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.</p>

        <!-- Phần ký -->
        <table style="width:100%; border-collapse:collapse; border:none; margin-top:40px; font-size:13px;">
          <tr>
            <td style="border:none !important; width:50%; text-align:center; vertical-align:top;">
              <div style="margin-bottom: 2px;"><strong>BÊN GIAO</strong></div>
              <div style="font-size:11px; font-style:italic;">(Ký, ghi rõ họ tên)</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold;">........................................</div>
            </td>
            <td style="border:none !important; width:50%; text-align:center; vertical-align:top;">
              <div style="margin-bottom: 2px;"><strong>BÊN NHẬN</strong></div>
              <div style="font-size:11px; font-style:italic;">(Ký, ghi rõ họ tên)</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold;">${group.technician.identityName}</div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </tbody>
  <!-- FOOTER: Space for bottom margin -->
  <tfoot style="display:table-footer-group;">
    <tr>
      <td style="border:none !important; height: 8mm;"></td>
    </tr>
  </tfoot>
</table>`;
}

/* ------------------------------------------------------------------ */
/*  Single Tab Editor Component                                        */
/* ------------------------------------------------------------------ */

type TabEditorProps = {
    group: TechnicianGroup;
    registerPrint: (fn: () => void) => void;
    registerExport: (fn: () => Promise<void>) => void;
};

function TechnicianTabEditor({ group, registerPrint, registerExport }: TabEditorProps) {
    const { t } = useTranslation();
    const exportPdf = useGenerateHandoverPdf();
    const editorRef = useRef<any>(null);
    const [, setEditorReady] = useState(false);

    const handleExport = useCallback(async () => {
        if (!editorRef.current) return;
        const html = editorRef.current.getContent();
        const analyses = group.analyses.map((a) => a.analysisId);
        const filename = `BAN_GIAO_NOI_BO_${group.technician.identityId}_${new Date().getTime()}`;

        try {
            const blob = await exportPdf.mutateAsync({
                analyses,
                html,
                filename,
                receivedBy: group.technician.identityName,
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${filename}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
        }
    }, [group, exportPdf]);

    const handleInit = useCallback(
        (_evt: unknown, editor: any) => {
            editorRef.current = editor;
            setEditorReady(true);
            // Register print function for this tab
            registerPrint(() => {
                editor.execCommand("mcePrint");
            });
            // Register export function
            registerExport(handleExport);
        },
        [registerPrint, registerExport, handleExport],
    );

    return (
        <div className="w-full h-full">
            <Editor
                tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js"
                onInit={handleInit}
                initialValue={generateHandoverHtml(group, t)}
                init={{
                    height: "100%",
                    width: "100%",
                    menubar: false,
                    statusbar: false,
                    plugins: "table lists code print autoresize noneditable",
                    toolbar: "bold italic underline | alignleft aligncenter alignright | table | code | print",
                    toolbar_mode: "wrap" as const,
                    paste_as_text: true,
                    min_height: 800,
                    autoresize_bottom_margin: 20,
                    content_style: CONTENT_STYLE,
                    branding: false,
                    promotion: false,
                }}
            />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Modal Component                                                    */
/* ------------------------------------------------------------------ */

export function HandoverDocumentModal({ groups, onClose, onConfirm }: Props) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState(groups[0]?.technician.identityId ?? "");
    const [isExporting, setIsExporting] = useState(false);
    const [, startTransition] = useTransition();

    // Store print function per technician tab
    const printFns = useRef<Record<string, () => void>>({});
    const exportFns = useRef<Record<string, () => Promise<void>>>({});

    const handlePrint = () => {
        const fn = printFns.current[activeTab];
        if (fn) fn();
    };

    const handleExport = async () => {
        const fn = exportFns.current[activeTab];
        if (fn) {
            setIsExporting(true);
            try {
                await fn();
            } finally {
                setIsExporting(false);
            }
        }
    };

    const handleTabChange = (val: string) => {
        startTransition(() => {
            setActiveTab(val);
        });
    };

    const handleConfirmAll = () => {
        groups.forEach((g) => {
            onConfirm(
                g.technician.identityId,
                g.analyses.map((a) => a.analysisId),
            );
        });
        onClose();
    };

    if (groups.length === 0) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />

            {/* Modal */}
            <div className="fixed inset-4 bg-background rounded-lg shadow-2xl z-50 flex flex-col border border-border overflow-hidden">
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-card">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">{t("handover.document.title", "Biên bản bàn giao mẫu thử / chỉ tiêu phân tích")}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{t("handover.document.subtitle", "Xem trước, chỉnh sửa và in biên bản trước khi xác nhận.")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={handlePrint} disabled={isExporting}>
                            <Printer className="h-3.5 w-3.5" />
                            {t("handover.document.print", "In biên bản")}
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={handleExport} disabled={isExporting}>
                            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                            {t("handover.document.export", "Xuất PDF")}
                        </Button>
                        <Button size="sm" className="flex items-center gap-1.5" onClick={handleConfirmAll} disabled={isExporting}>
                            {t("handover.confirmAll", "Xác nhận bàn giao")}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Tabs + Editors ── */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col flex-1 overflow-hidden">
                    {/* Tab list */}
                    <div className="shrink-0 px-4 pt-3 border-b border-border bg-muted/30">
                        <TabsList className="h-auto flex-wrap gap-1 justify-start bg-transparent p-0">
                            {groups.map((g) => (
                                <TabsTrigger key={g.technician.identityId} value={g.technician.identityId} className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    {g.technician.identityName}
                                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{g.analyses.length}</span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Editor content per technician (Lazy load for better performance) */}
                    {groups.map((g) => (
                        <TabsContent key={g.technician.identityId} value={g.technician.identityId} className="flex-1 overflow-auto m-0 p-0 focus-visible:outline-none" style={{ minHeight: 0 }}>
                            {activeTab === g.technician.identityId ? (
                                <TechnicianTabEditor
                                    group={g}
                                    registerPrint={(fn) => {
                                        printFns.current[g.technician.identityId] = fn;
                                    }}
                                    registerExport={(fn) => {
                                        exportFns.current[g.technician.identityId] = fn;
                                    }}
                                />
                            ) : (
                                <div className="p-8 text-center text-muted-foreground animate-pulse">Đang tải biên bản...</div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </>
    );
}
