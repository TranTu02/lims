import { useRef, useState, useMemo, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Editor } from "@tinymce/tinymce-react";
import { useTranslation } from "react-i18next";
import { Printer, X, FileDown, FlaskConical, Beaker, ClipboardList, Info, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { ReceiptDetail, ReceiptSample } from "@/types/receipt";
import { useExportReport, receiptsGetFull } from "@/api/receipts";
import { reportApi } from "@/api/reports";
import { documentApi } from "@/api/documents";
import { samplesGetFull } from "@/api/samples";
import { toast } from "sonner";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receipt: ReceiptDetail;
};

/* ------------------------------------------------------------------ */
/*  A4 Content Style - Print-ready                                     */
/* ------------------------------------------------------------------ */

const CONTENT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Wix+Madefor+Display:wght@400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm;
    margin: 0 auto !important;
    padding: 0 !important;
    background-color: white;
    font-family: 'Wix Madefor Display', sans-serif !important;
    font-size: 12px;
    line-height: 1.25;
    color: #000;
  }
  
  /* Print Layout Wrapper */
  .print-wrapper { width: 100% !important; border: none !important; border-collapse: collapse !important; }
  .print-wrapper > thead > tr > td,
  .print-wrapper > tbody > tr > td {
    border: none !important;
    padding: 0 !important;
  }

  table { width: 100% !important; border-collapse: collapse; margin-bottom: 0px; }
  th, td {
    border: 1px solid black !important;
    padding: 4px 8px !important;
    vertical-align: middle;
  }
  th {
    background-color: #f2f2f2;
    font-weight: 500;
    text-align: left;
  }
  .info-box {
    border: 1px solid #000;
    padding: 5pt 8pt;
    margin-bottom: 4mm;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  #signature-section {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .grid-container {
    display: grid;
    grid-template-columns: 27% 23% 30% 20%;
    gap: 0;
  }
  .grid-item {
    font-size: 12px;
    line-height: 1.2;
    text-align: left;
  }
  h2 { font-size: 18px; margin-bottom: 10px; text-transform: uppercase; text-align: center; }
  .info-table td { border: none !important; padding: 2px 0 !important; }
  .ref_code { font-weight: bold; }
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; }
    @page { 
      size: A4 portrait !important; 
      margin: 0 !important; 
    }
    
    /* Ensure thead repeats on every page */
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  }
`;

function generateSampleResultHtml(sample: ReceiptSample, receipt: ReceiptDetail, tVi: any, tEn: any, replacingReportId?: string | null, language: "vie" | "eng" = "vie"): string {
    const analyses = sample.analyses ?? [];
    const rows = analyses.map((a, i) => {
        let nameVie = a.parameterName || "-";
        let nameEng = "";
        if (a.analysisReportDisplay && typeof a.analysisReportDisplay === 'object') {
            nameVie = (a.analysisReportDisplay as any).vie || a.parameterName || "-";
            nameEng = (a.analysisReportDisplay as any).eng || "";
        }
        
        let displayName = `${nameVie}`;
        if (language === "eng" && nameEng) {
            displayName = `${nameVie} / ${nameEng}`;
        }

        let loc = a.analysisLocation || "";
        let accKeys: string[] = [];
        if (a.protocolAccreditation && typeof a.protocolAccreditation === 'object') {
            accKeys = Object.keys(a.protocolAccreditation).filter(k => (a.protocolAccreditation as any)[k] === true);
        }
        let accStr = accKeys.length > 0 ? accKeys.join(", ") : "";
        let protocolAndAcc = [loc, accStr].filter(Boolean).join(" ");
        if (!protocolAndAcc) protocolAndAcc = "-";

        return `
        <tr class="table-row">
            <td style="border: 1px solid black; padding: 4px 8px; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;">${i + 1}.</td>
            <td style="border: 1px solid black; padding: 4px 8px; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;">${displayName}</td>
            <td style="border: 1px solid black; padding: 4px 8px; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;">${a.analysisResult ?? "--"}</td>
            <td style="border: 1px solid black; padding: 4px 8px; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;">${a.analysisUnit ?? "--"}</td>
            <td style="border: 1px solid black; padding: 4px 8px; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;">${a.protocolCode ?? "-"}</td>
            <td style="border: 1px solid black; padding: 4px 8px; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;">${protocolAndAcc}</td>
        </tr>
    `;
    }).join("");

    const replacementHtml = replacingReportId 
        ? `<div style="font-size: 11px; font-weight: 600; margin-top: 5px; color: #000;">
             Thay thế cho phiếu có mã xuất bản ${replacingReportId} / This report replaces report no. ${replacingReportId}
           </div>`
        : "";

    const refCode = `${tVi("testReport.draft")} / ${tEn("testReport.draft")}`;
    const dateStr = new Date().toLocaleDateString("vi-VN");

    // Helper to find value by label in sampleInfo/sampleReceiptInfo
    const getInfo = (list: any[] | null | undefined, labelSearch: string) => {
        if (!list) return "--";
        const item = list.find(it => it.label?.toLowerCase().includes(labelSearch.toLowerCase()));
        return item?.value || "--";
    };

    // Customer Provided Info
    const sampleName = getInfo(sample.sampleInfo, "Tên mẫu") || sample.sampleName;
    const lotNo = getInfo(sample.sampleInfo, "Số lô") || getInfo(sample.sampleInfo, "Lot");
    const origin = getInfo(sample.sampleInfo, "Nơi sản xuất");
    const mfgDate = getInfo(sample.sampleInfo, "Ngày sản xuất") || getInfo(sample.sampleInfo, "MFG");
    const expDate = getInfo(sample.sampleInfo, "Hạn sử dụng") || getInfo(sample.sampleInfo, "EXP");
    const appearance = getInfo(sample.sampleInfo, "Trạng thái") || getInfo(sample.sampleInfo, "ngoại quan");

    // Receipt Info
    const receiptDateStr = getInfo(sample.sampleReceiptInfo, "Ngày tiếp nhận") !== "--" 
        ? getInfo(sample.sampleReceiptInfo, "Ngày tiếp nhận")
        : (receipt.receiptDate ? new Date(receipt.receiptDate).toLocaleDateString("vi-VN") : "--");
    const storageInfo = getInfo(sample.sampleReceiptInfo, "Mẫu lưu");
    const testTime = getInfo(sample.sampleReceiptInfo, "Thời gian thực hiện");
    const description = getInfo(sample.sampleReceiptInfo, "Mô tả");
    const condition = getInfo(sample.sampleReceiptInfo, "Điều kiện mẫu") || getInfo(sample.sampleReceiptInfo, "Tình trạng");

    return `
        <table class="print-wrapper">
            <thead>
                <tr>
                    <td>
                        <div id="header-section" style="position: relative; height: fit-content; margin-bottom: 20px;">
                            <div style="position: relative; display: flex; overflow: visible; align-items: flex-start;">
                                <div>
                                    <img src="https://documents-sea.bildr.com/rc19670b8d48b4c5ba0f89058aa6e7e4b/doc/IRDOP%20LOGO%20with%20Name.w8flZn8NnkuLrYinAamIkw.PAAKeAHDVEm9mFvCFtA46Q.svg" loading="lazy" style="width: 4cm;">
                                </div>
                                <div style="text-align: right; flex-grow: 1; display: flex; flex-direction: column; align-items: flex-end;">
                                    <p style="font-weight: bold; font-size: 14.4px; color: #0058a3; margin-bottom: 0; line-height: 17.6px;">${tVi("testReport.institute.organizationName")}</p>
                                    <p style="font-weight: 400; font-size: 11.2px; margin: 0; line-height: 12px;">/ ${tEn("testReport.institute.organizationName")}</p>
                                    <span style="font-weight: 400; font-size: 11.2px; border-bottom: 1px solid rgba(128,128,128,0.5); width: fit-content; display: block; margin: 0; line-height: 12px; padding-bottom: 1px;">
                                        ${tVi("testReport.institute.departmentName")} / ${tEn("testReport.institute.departmentName")}
                                    </span>
                                </div>
                            </div>
                            
                            <div style="padding-top: 2mm; position: relative; margin-top: 5mm;">
                                <div style="position: relative; text-align: left;">
                                    <p style="font-weight: 900; font-size: 24pt; color: #0058a3; margin: 0; line-height: 1;">${tVi("testReport.title")}</p>
                                    <p style="font-weight: 800; font-size: 21pt; color: #0058a3; margin: 0; line-height: 1;">/ ${tEn("testReport.title")}</p>
                                    <div style="display: flex; align-items: center; gap: 2mm; font-size: 12px; margin-top: 10px;">
                                        ${tVi("testReport.ref")} / ${tEn("testReport.ref")}: 
                                        <span class="ref_code" style="min-width: 5pt; margin: 0; margin-right: 5mm;">${refCode}</span>
                                        <span style="min-width: 5pt; margin: 0;">${tVi("testReport.date")} / ${tEn("testReport.date")}: ${dateStr}</span>
                                    </div>
                                    ${replacementHtml}
                                </div>
                                <div class="vlas_icon" style="position: absolute; right: 0mm; top: 0;">
                                    <img src="https://documents-sea.bildr.com/rc19670b8d48b4c5ba0f89058aa6e7e4b/doc/VILAS%20997.WIu1HeH5wkOQ5k1olzA3Wg.png" loading="lazy" style="width: 4.16cm;">
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <div id="customer-section" class="info-box">
                             <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                                <p style="font-size: 11px; margin: 0;">${tVi("testReport.customerInfo")} / ${tEn("testReport.customerInfo")}</p>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                <p style="font-weight: 760; margin: 0; font-size: 16px;">${(receipt.client?.clientName || "-").toUpperCase()}</p>
                                <p style="margin: 0; font-size: 12px;">${receipt.client?.clientAddress || "-"}</p>
                            </div>
                        </div>

                        <div id="sample-section" class="info-box">
                            <div style="display: flex; justify-content: space-between; border-bottom: 0.5px solid #000; margin-bottom: 4px; padding-bottom: 2px;">
                                <p style="font-size: 11px; margin: 0;">${tVi("testReport.sampleInfo")} / ${tEn("testReport.sampleInfo")}</p>
                                <p style="font-size: 11px; margin: 0;"><strong>${sample.sampleId ?? "-"}</strong></p>
                            </div>

                            <div style="margin-bottom: 6px;">
                                <p style="font-size: 10px; font-style: italic; margin-bottom: 2px; color: #555;">Thông tin khách hàng cung cấp / Information provided by client:</p>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>${tVi("testReport.sampleLabels.name")}</strong> / Name</div>
                                    <div class="grid-item" style="grid-column: span 3;"><strong>${sampleName}</strong></div>
                                </div>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>Số lô</strong> / LOT no.</div>
                                    <div class="grid-item">${lotNo}</div>
                                    <div class="grid-item"><strong>Nơi sản xuất</strong> / Origin</div>
                                    <div class="grid-item">${origin}</div>
                                </div>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>Ngày SX</strong> / MFG date</div>
                                    <div class="grid-item">${mfgDate}</div>
                                    <div class="grid-item"><strong>Hạn dùng</strong> / EXP date</div>
                                    <div class="grid-item">${expDate}</div>
                                </div>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>Trạng thái</strong> / Appearance</div>
                                    <div class="grid-item" style="grid-column: span 3;">${appearance}</div>
                                </div>
                            </div>

                            <div style="border-top: 0.5px dashed #ccc; padding-top: 4px;">
                                <p style="font-size: 10px; font-style: italic; margin-bottom: 2px; color: #555;">Thông tin tiếp nhận / Receipt information:</p>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>Ngày tiếp nhận</strong> / Receipt date</div>
                                    <div class="grid-item">${receiptDateStr}</div>
                                    <div class="grid-item"><strong>Mẫu lưu</strong> / Retention</div>
                                    <div class="grid-item">${storageInfo}</div>
                                </div>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>Thời gian thử</strong> / Testing time</div>
                                    <div class="grid-item" style="grid-column: span 3;">${testTime}</div>
                                </div>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>Mô tả mẫu</strong> / Description</div>
                                    <div class="grid-item" style="grid-column: span 3;">${description}</div>
                                </div>
                                <div class="grid-container">
                                    <div class="grid-item"><strong>Tình trạng mẫu</strong> / Condition</div>
                                    <div class="grid-item" style="grid-column: span 3;">${condition}</div>
                                </div>
                            </div>
                        </div>

                        <div id="analysis-section">
                            <table style="width: 100%; border-collapse: collapse; font-size: 11px;" class="mce-item-table">
                                <thead>
                                    <tr>
                                        <th style="border: 1px solid black; padding: 4px 8px; background-color: #f2f2f2; font-weight: 500; width: 45px; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;"><strong>${tVi("testReport.table.stt")}</strong><br/><span style="font-size: 11px; color: #444444;">/ ${tEn("testReport.table.stt")}</span></th>
                                        <th style="border: 1px solid black; padding: 4px 8px; background-color: #f2f2f2; font-weight: 500; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;"><strong>${tVi("testReport.table.test")}</strong><br/><span style="font-size: 11px; color: #444444;">/ ${tEn("testReport.table.test")}</span></th>
                                        <th style="border: 1px solid black; padding: 4px 8px; background-color: #f2f2f2; font-weight: 500; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;"><strong>${tVi("testReport.table.result")}</strong><br/><span style="font-size: 11px; color: #444444;">/ ${tEn("testReport.table.result")}</span></th>
                                        <th style="border: 1px solid black; padding: 4px 8px; background-color: #f2f2f2; font-weight: 500; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;"><strong>${tVi("testReport.table.unit")}</strong><br/><span style="font-size: 11px; color: #444444;">/ ${tEn("testReport.table.unit")}</span></th>
                                        <th style="border: 1px solid black; padding: 4px 8px; background-color: #f2f2f2; font-weight: 500; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;"><strong>${tVi("testReport.table.protocol")}</strong><br/><span style="font-size: 11px; color: #444444;">/ ${tEn("testReport.table.protocol")}</span></th>
                                        <th style="border: 1px solid black; padding: 4px 8px; background-color: #f2f2f2; font-weight: 500; text-align: left; font-size: 11px; vertical-align: middle; line-height: 1.2;"><strong>${tVi("testReport.table.scope")}</strong><br/><span style="font-size: 11px; color: #444444;">/ ${tEn("testReport.table.scope")}</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                    ${analyses.length === 0 ? '<tr><td colspan="6" style="text-align: center;">Chưa có chỉ tiêu nào</td></tr>' : ""}
                                </tbody>
                            </table>
                        </div>

                        <div style="height: 4mm;"></div>

                        <div id="notes-section" class="info-box">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <p style="font-weight: bold; margin: 0; font-size: 11px;">${tVi("testReport.notesTitle")} / ${tEn("testReport.notesTitle")}</p>
                            </div>
                            <p style="font-size: 11px; margin: 0; line-height: 1.2;">
                                ${tVi("testReport.notesContent")}
                            </p>
                        </div>

                        <div style="height: 4mm;"></div>

                        <div id="signature-section" style="padding: 0 8px; display: flex; justify-content: space-between; margin: 0; min-height: 2.7cm;">
                            <div style="flex-grow: 1; text-align: center; display: flex; flex-direction: column; justify-content: space-between; max-width: 45%;">
                                <strong style="font-size: 12px; line-height: 1.2; margin: 0;">${tVi("testReport.signatures.qaManager")}<br/><span style="font-weight: 400;">/ ${tEn("testReport.signatures.qaManager")}</span></strong>
                                <p style="font-size: 12px; margin: 0; line-height: 1.4; margin-top: 1.5cm;">Trần Thị Lan</p>
                            </div>
                            <div style="flex-grow: 1; text-align: center; display: flex; flex-direction: column; justify-content: space-between; max-width: 45%;">
                                <strong style="font-size: 12px; line-height: 1.2; margin: 0;">${tVi("testReport.signatures.vicePresident")}<br/><span style="font-weight: 400;">/ ${tEn("testReport.signatures.vicePresident")}</span></strong>
                                <p style="font-size: 12px; margin: 0; line-height: 1.4; margin-top: 1.5cm;">Nguyễn Bá Xuân Trường</p>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    `;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function ResultCertificateModal({ open, onOpenChange, receipt }: Props) {
    const { t, i18n } = useTranslation();
    const tVi = i18n.getFixedT("vi");
    const tEn = i18n.getFixedT("en");

    const samples = receipt.samples ?? [];
    const [activeSampleId, setActiveSampleId] = useState(samples[0]?.sampleId ?? "");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [replacingReportId, setReplacingReportId] = useState<string | null>(null);
    const [reportLanguage, setReportLanguage] = useState<"vie" | "eng">("vie");
    const editorRef = useRef<any>(null);
    const exportMutation = useExportReport();
    const queryClient = useQueryClient();

    const { data: fullReceipt } = useQuery({
        queryKey: ["receipts", "full", receipt.receiptId],
        enabled: open && !!receipt.receiptId,
        queryFn: async () => {
            const res = await receiptsGetFull({ receiptId: receipt.receiptId });
            if (res.success && res.data) return res.data;
            return res as unknown as ReceiptDetail;
        },
        initialData: receipt,
    });

    const activeReceipt = fullReceipt || receipt;
    const activeSamples = activeReceipt.samples ?? [];
    const selectedSample = useMemo(() => activeSamples.find((s) => s.sampleId === activeSampleId), [activeSamples, activeSampleId]);

    // Update editor content when replacement report or sample changes
    useEffect(() => {
        if (selectedSample && editorRef.current) {
            editorRef.current.setContent(generateSampleResultHtml(selectedSample, activeReceipt, tVi, tEn, replacingReportId, reportLanguage));
        }
    }, [replacingReportId, selectedSample?.sampleId, activeReceipt, tVi, tEn, reportLanguage]);

    const extractHtmlParts = (html: string) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        
        // Ensure inline styles or outer CSS are brought over.
        // TinyMCE puts the raw HTML in the content but lacks the head styles
        const headerTd = doc.querySelector("thead tr td");
        const bodyTd = doc.querySelector("tbody tr td");

        // We inject the CONTENT_STYLE into the header to ensure the backend puppeteer picks it up
        return {
            headerHtml: `<style>${CONTENT_STYLE}</style>` + (headerTd?.innerHTML || ""),
            contentHtml: bodyTd?.innerHTML || "",
        };
    };

    const handleExport = async (preview: boolean) => {
        if (!editorRef.current) return;

        const html = editorRef.current.getContent();
        const { headerHtml, contentHtml } = extractHtmlParts(html);

        try {
            const res = (await exportMutation.mutateAsync({
                body: {
                    receiptId: receipt.receiptId,
                    sampleId: selectedSample?.sampleId || "",
                    preview,
                    headerHtml,
                    contentHtml,
                    replacedByReportId: replacingReportId || undefined,
                },
            })) as { url?: string; base64?: string; pdfBase64?: string; reportId?: string; documentId?: string; fileId?: string };

            const finalBase64 = res.pdfBase64 || res.base64;

            if (preview) {
                if (res.url) {
                    setPreviewUrl(res.url);
                } else if (finalBase64) {
                    const byteCharacters = atob(finalBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(url);
                }
            } else if (!preview) {
                toast.success(t("common.toast.success", "Xuất báo cáo thành công"), { duration: 1000 });
                
                // Refresh sample/receipt data to show new report IDs
                queryClient.invalidateQueries({ queryKey: ["receipts", "full", receipt.receiptId] });

                // Fetch latest sample data and update cache for immediate UI refresh
                if (selectedSample?.sampleId) {
                    try {
                        const sRes = await samplesGetFull({ sampleId: selectedSample.sampleId });
                        if (sRes.success && sRes.data) {
                             queryClient.setQueryData(["receipts", "full", receipt.receiptId], (old: any) => {
                                 if (!old) return old;
                                 return {
                                     ...old,
                                     samples: (old.samples || []).map((s: any) => 
                                         s.sampleId === selectedSample.sampleId ? { ...s, ...sRes.data } : s
                                     )
                                 };
                             });
                        }
                    } catch (e) {
                         console.error("Failed to fetch fresh sample data", e);
                    }
                }

                if (res.reportId || res.documentId || res.fileId) {
                    try {
                        let url = "";
                        if (res.reportId) {
                            const previewRes = await reportApi.getPreview(res.reportId);
                            url = (previewRes as any).data?.url || (previewRes as any).url;
                        } else {
                            const targetId = (res.documentId || res.fileId) as string;
                            const docRes = await documentApi.url(targetId);
                            url = (docRes as any).data?.url || (docRes as any).url;
                        }

                        if (url) {
                            setPreviewUrl(url);
                        }
                    } catch (e) {
                         console.error("Failed to get report URL", e);
                         toast.error("Không thể lấy đường dẫn tệp báo cáo.", { duration: 1000 });
                    }
                }
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || t("common.toast.failed", "Thao tác thất bại"), { duration: 1000 });
        }
    };

    const handlePreviewReport = async (reportId: string) => {
        try {
            const res = await reportApi.getPreview(reportId);
            // Handle both { success, data: { url } } and { url }
            const url = (res as any).data?.url || (res as any).url;
            if (url) {
                setPreviewUrl(url);
            } else {
                toast.error("Không thể lấy liên kết xem báo cáo.", { duration: 1000 });
            }
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải báo cáo.", { duration: 1000 });
        }
    };

    const { data: receiptDocs } = useQuery({
        queryKey: ["documents", "list", { receiptId: receipt.receiptId }],
        queryFn: async () => {
            const res = await documentApi.list({ search: receipt.receiptId, itemsPerPage: 50 });
            const raw = res as any;
            return Array.isArray(raw.data) ? raw.data : [];
        },
        enabled: open && !!receipt.receiptId,
    });

    const handleOpenDocument = async (docId: string) => {
        try {
            const res = await documentApi.url(docId);
            const url = (res as any).data?.url || (res as any).url;
            if (url) window.open(url, "_blank");
        } catch (e) {
            toast.error("Không thể mở tài liệu");
        }
    };

    // const selectedSample = useMemo(() => samples.find((s) => s.sampleId === activeSampleId), [samples, activeSampleId]);

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[80]" onClick={() => onOpenChange(false)} />
            <div className="fixed inset-4 bg-background rounded-lg shadow-2xl z-[80] flex flex-col border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0 bg-card">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Phiếu kết quả thử nghiệm</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Mã biên nhận: {receipt.receiptCode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleExport(true)}
                            disabled={exportMutation.isPending}
                        >
                            {exportMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                            {t("common.preview", "Xem trước")}
                        </Button>
                        <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleExport(false)}
                            disabled={exportMutation.isPending}
                        >
                            {exportMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                            {t("reception.handover.document.exportPDF", "Xuất PDF")}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)} disabled={exportMutation.isPending}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <Tabs value={activeSampleId} onValueChange={setActiveSampleId} className="flex-1 flex flex-col overflow-hidden">
                    <div className="shrink-0 px-4 pt-2 border-b border-border bg-muted/30">
                        <TabsList className="h-auto flex-wrap gap-1 justify-start bg-transparent p-0">
                            {samples.map((s) => (
                                <TabsTrigger key={`${s.sampleId}`} value={`${s.sampleId}`} className="px-4 py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <FlaskConical className="h-3.5 w-3.5 mr-2 opacity-50" />
                                    {`${s.sampleId}`}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="flex-1 flex overflow-x-auto overflow-y-hidden">
                        {/* Column 1: Receipt Info & Documents (Left) */}
                        <div className="w-[300px] border-r border-border bg-muted/5 p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
                            {/* Client Info */}
                            <div className="bg-background rounded-xl border border-border p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                    <Info className="h-4 w-4" />
                                    Thông tin khách hàng
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <p className="text-foreground font-bold leading-tight uppercase">{`${activeReceipt.client?.clientName || ""}`}</p>
                                    <p className="text-xs">{`${activeReceipt.client?.clientAddress || ""}`}</p>
                                    {activeReceipt.contactPerson && (
                                        <div className="pt-2 border-t mt-2">
                                            <p className="text-[11px] font-medium text-foreground">Liên hệ: {`${activeReceipt.contactPerson.contactName || ""}`}</p>
                                            <p className="text-[11px]">{`${activeReceipt.contactPerson.contactPhone || ""}`}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Documents Section */}
                            <div className="bg-background rounded-xl border border-border p-4 shadow-sm flex-1 overflow-hidden flex flex-col">
                                <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm shrink-0">
                                    <ClipboardList className="h-4 w-4" />
                                    Hồ sơ document
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                                    {!!receiptDocs?.length ? (
                                        receiptDocs.map((doc: any) => (
                                            <div 
                                                key={`${doc.documentId}`} 
                                                className="group flex items-center justify-between p-2 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                                                onClick={() => handleOpenDocument(String(doc.documentId))}
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-medium text-foreground truncate" title={`${String(doc.documentTitle || doc.documentId)}`}>
                                                        {`${String(doc.documentTitle || doc.documentId)}`}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">{`${String(doc.documentStatus || "Issued")}`}</p>
                                                </div>
                                                <Eye className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground opacity-50 flex flex-col items-center">
                                            <ClipboardList className="h-8 w-8 mb-2 stroke-1" />
                                            <p className="text-[11px]">Chưa có tài liệu liên quan</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Editor (Center) */}
                        <div className="flex-1 border-r border-border bg-muted/5 p-4 overflow-hidden flex flex-col min-w-[800px]">
                            {selectedSample && (
                                <div className="flex-1 bg-background rounded-lg border border-border shadow-sm overflow-hidden relative">
                                    <Editor
                                        tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.2/tinymce.min.js"
                                        onInit={(_evt, editor) => (editorRef.current = editor)}
                                        initialValue={generateSampleResultHtml(selectedSample, activeReceipt, tVi, tEn, replacingReportId, reportLanguage)}
                                        init={{
                                            height: "100%",
                                            menubar: false,
                                            statusbar: false,
                                            plugins: "table lists code print",
                                            toolbar: "bold italic underline | alignleft aligncenter alignright | table | code | print",
                                            content_style: CONTENT_STYLE,
                                            branding: false,
                                            promotion: false,
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Visual Layout (Right) */}
                        <div className="w-[350px] bg-background p-6 overflow-y-auto shrink-0 border-l border-border">
                            {selectedSample ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Beaker className="h-5 w-5" />
                                         </div>
                                         <div>
                                             <h3 className="font-bold text-lg leading-none">{`${selectedSample.sampleId}`}</h3>
                                             <p className="text-sm text-muted-foreground mt-1">{`${selectedSample.sampleTypeName || ""}`}</p>
                                         </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Configuration Section */}
                                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                                <Info className="h-4 w-4" />
                                                Cấu hình báo cáo
                                            </div>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-medium text-muted-foreground pl-0.5">Ngôn ngữ báo cáo</label>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant={reportLanguage === "vie" ? "default" : "outline"}
                                                            size="sm"
                                                            className={`flex-1 h-8 text-xs ${reportLanguage !== "vie" ? "bg-background" : ""}`}
                                                            onClick={() => setReportLanguage("vie")}
                                                        >
                                                            VIE
                                                        </Button>
                                                        <Button 
                                                            variant={reportLanguage === "eng" ? "default" : "outline"}
                                                            size="sm"
                                                            className={`flex-1 h-8 text-xs ${reportLanguage !== "eng" ? "bg-background" : ""}`}
                                                            onClick={() => setReportLanguage("eng")}
                                                        >
                                                            ENG
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-medium text-muted-foreground pl-0.5">Thay thế báo cáo</label>
                                                    <Select value={replacingReportId || "none"} onValueChange={(val) => setReplacingReportId(val === "none" ? null : val)}>
                                                        <SelectTrigger className="h-8 text-xs bg-background">
                                                            <SelectValue placeholder="Chọn báo cáo để thay thế" />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[100]">
                                                            <SelectItem value="none">Không thay thế</SelectItem>
                                                            {(() => {
                                                                const list = selectedSample.reports
                                                                    ? selectedSample.reports.map((r: any) => `${r.reportId || r}`)
                                                                    : (selectedSample.reportIds || []);
                                                                return list.map((rid: string) => (
                                                                    <SelectItem key={rid} value={rid}>{rid}</SelectItem>
                                                                ));
                                                            })()}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                                <Info className="h-4 w-4" />
                                                Thông tin mẫu
                                            </div>
                                            <div className="space-y-2 text-sm text-muted-foreground">
                                                <div className="flex justify-between">
                                                    <span>Tên mẫu:</span>
                                                    <span className="text-foreground font-medium">{`${selectedSample.sampleName || "-"}`}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Khách hàng:</span>
                                                    <span className="text-foreground font-medium text-right">{`${activeReceipt.client?.clientName || "-"}`}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Nền mẫu:</span>
                                                    <Badge variant="outline" className="h-5 text-[10px]">{`${selectedSample.sampleTypeName || "-"}`}</Badge>
                                                </div>
                                                {!!selectedSample.sampleNote && (
                                                    <div className="pt-2 border-t mt-2">
                                                        <span className="text-[11px] font-semibold mb-1 block">Ghi chú mẫu:</span>
                                                        <p className="text-xs italic bg-yellow-50/50 p-2 rounded border border-yellow-100">{`${selectedSample.sampleNote || ""}`}</p>
                                                    </div>
                                                )}
                                                {(() => {
                                                    const list = selectedSample.reports
                                                        ? selectedSample.reports.map((r: any) => `${r.reportId || r}`)
                                                        : (selectedSample.reportIds || []);
                                                    if (list.length === 0) return null;
                                                    return (
                                                        <div className="pt-2 border-t mt-2">
                                                            <span className="text-[11px] font-semibold mb-1 block">Báo cáo đã xuất:</span>
                                                            <div className="flex flex-col gap-1">
                                                                {list.map((rid: string) => (
                                                                    <div key={rid} className="flex items-center justify-between bg-background p-1.5 px-2 rounded border text-[11px]">
                                                                        <span className="font-medium">{rid}</span>
                                                                        <Button 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="h-6 w-6" 
                                                                            onClick={() => handlePreviewReport(rid)}
                                                                            title="Xem báo cáo"
                                                                        >
                                                                            <Eye className="h-3 w-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                                            <div className="flex items-center gap-2 mb-3 text-primary font-semibold text-sm">
                                                <ClipboardList className="h-4 w-4" />
                                                Danh sách chỉ tiêu ({selectedSample.analyses?.length || 0})
                                            </div>
                                            <div className="space-y-3">
                                                {selectedSample.analyses?.map((a) => (
                                                    <div key={`${a.analysisId}`} className="bg-background p-3 rounded-lg border border-border shadow-sm">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="font-medium text-sm text-foreground">{`${a.parameterName || ""}`}</div>
                                                            <Badge className="text-[10px] h-5">{`${a.analysisStatus || ""}`}</Badge>
                                                        </div>
                                                         <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                             <span>{`${a.protocolCode || ""}`}</span>
                                                             <span className="font-bold text-primary">{`${a.analysisResult || ""}`} {`${a.analysisUnit || ""}`}</span>
                                                         </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <Beaker className="h-12 w-12 mb-3" />
                                    <p>Chọn một mẫu để xem chi tiết</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Tabs>
            </div>

            {/* PDF Preview Modal */}
            {previewUrl && (
                <>
                    <div className="fixed inset-0 bg-black/70 z-[90]" onClick={() => setPreviewUrl(null)} />
                    <div className="fixed inset-10 bg-background rounded-lg shadow-2xl z-[100] flex flex-col border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card">
                            <h3 className="font-semibold">Xem trước PDF</h3>
                            <Button variant="ghost" size="icon" onClick={() => setPreviewUrl(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 bg-muted">
                            <iframe 
                                src={`${previewUrl}#toolbar=0`} 
                                className="w-full h-full border-none"
                                title="PDF Preview"
                            />
                        </div>
                        <div className="p-3 border-t bg-card flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setPreviewUrl(null)}>Đóng</Button>
                            <Button onClick={() => window.open(previewUrl)}>
                                <Printer className="h-4 w-4 mr-2" />
                                In phiếu
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
