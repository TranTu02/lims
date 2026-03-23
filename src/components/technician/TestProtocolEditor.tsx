import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Editor } from "@tinymce/tinymce-react";
import { Save, Printer, PlusCircle, Loader2, Beaker, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import * as mammoth from "mammoth";

import { useAnalysisDetail, useAnalysesUpdateBulk, useAnalysesGenerateLabReport } from "@/api/analyses";
import { useMatrixFull, useProtocolDetail } from "@/api/library";
import { documentApi } from "@/api/documents";

import type { AnalysisListItem } from "@/types/analysis";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChemicalInsertModal } from "@/components/technician/ChemicalInsertModal";
import { AnalysisTableInsertModal } from "@/components/technician/AnalysisTableInsertModal";

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
  th, td { border: 1px solid black !important; padding: 6px !important; vertical-align: top; text-align: left !important; font-weight: normal !important; }
  
  /* Alignment helpers mapped from docx */
  .text-center { text-align: center !important; }
  .text-right { text-align: right !important; }
  .text-justify { text-align: justify !important; }
  
  @media print {
    body { margin: 0 !important; box-shadow: none !important; width: 100% !important; padding: 0 !important; }
    @page { size: A4 portrait !important; margin: 1cm !important; }
  }
`;

const LOGO_URL =
    "https://documents-sea.bildr.com/rc19670b8d48b4c5ba0f89058aa6e7e4b/doc/IRDOP%20LOGO%20with%20Name.w8flZn8NnkuLrYinAamIkw.PAAKeAHDVEm9mFvCFtA46Q.svg";

interface ProtocolEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    // Support single or multiple analyses
    analysis?: AnalysisListItem | null;
    analyses?: AnalysisListItem[];
    onSuccess?: () => void;
}

export function TestProtocolEditor({ open, onOpenChange, analysis, analyses: analysesProp, onSuccess }: ProtocolEditorProps) {
    const { t } = useTranslation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);
    const [editorReady, setEditorReady] = useState(false);

    // Normalise: support both single `analysis` and multi `analyses`
    const analyses = useMemo<AnalysisListItem[]>(() => {
        if (analysesProp && analysesProp.length > 0) return analysesProp;
        if (analysis) return [analysis];
        return [];
    }, [analysesProp, analysis]);

    // Protocol selection: if analyses have different protocolCodes, let user pick
    const uniqueProtocols = useMemo(() => {
        const seen = new Map<string, { code: string; label: string }>();
        analyses.forEach((a) => {
            const code = (a as AnalysisListItem & { protocolCode?: string }).protocolCode || "";
            if (code && !seen.has(code)) seen.set(code, { code, label: code });
        });
        return Array.from(seen.values());
    }, [analyses]);

    const [selectedProtocolCode, setSelectedProtocolCode] = useState<string>("");

    useEffect(() => {
        if (uniqueProtocols.length > 0 && !selectedProtocolCode) {
            setSelectedProtocolCode(uniqueProtocols[0].code);
        }
    }, [uniqueProtocols, selectedProtocolCode]);

    // Primary analysis (find based on selected protocol, fallback to first)
    const primaryAnalysis = useMemo(() => {
        if (!selectedProtocolCode) return analyses[0] ?? null;
        return (analyses.find((a) => (a as AnalysisListItem & { protocolCode?: string }).protocolCode === selectedProtocolCode) || analyses[0]) ?? null;
    }, [analyses, selectedProtocolCode]);

    // Fetch details of primary analysis
    const { data: analysisDetail, isLoading: isLoadingAnalysis } = useAnalysisDetail(
        { analysisId: primaryAnalysis?.analysisId || "" },
        { enabled: open && !!primaryAnalysis?.analysisId },
    );

    const matrixId = (primaryAnalysis as AnalysisListItem & { matrixId?: string })?.matrixId || analysisDetail?.matrixId || null;
    const { data: matrixFull } = useMatrixFull(matrixId);

    const directProtocolId = matrixFull?.protocolId || null;
    const { data: protocolDetail, isLoading: isLoadingProtocol } = useProtocolDetail({ params: { protocolId: directProtocolId || "" } });
    // Mutators
    const { mutate: updateBulk, isPending: isUpdating } = useAnalysesUpdateBulk();
    const { mutate: generateLabReport, isPending: isGenerating } = useAnalysesGenerateLabReport();
    const [isExported, setIsExported] = useState(false);

    // Chemical states: Aggregate from all selected analyses
    const availableChemicals = useMemo(() => {
        const aggregated = new Map<string, any>();
        analyses.forEach(a => {
            const rawList = (a as any).consumablesUsed;
            const list = Array.isArray(rawList) ? rawList : (typeof rawList === 'string' ? (JSON.parse(rawList) || []) : []);
            list.forEach((c: any) => {
                if (c.chemicalSkuId) {
                    // We might need to handle duplicates if the same SKU is in multiple analyses,
                    // but usually, it's safer to keep them separate if they are for different analyses.
                    // However, for the UI list, we want a merged view or a clear mapping.
                    // Let's use analysisId_skuId as a key for the quantities state to be precise.
                    const key = `${a.analysisId}_${c.chemicalSkuId}`;
                    aggregated.set(key, { ...c, analysisId: a.analysisId, uniqueKey: key });
                }
            });
        });
        return Array.from(aggregated.values());
    }, [analyses]);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [showChemicalInsertModal, setShowChemicalInsertModal] = useState(false);
    const [showAnalysisTableInsertModal, setShowAnalysisTableInsertModal] = useState(false);

    // Mammoth docx upload
    const docxInputRef = useRef<HTMLInputElement>(null);
    const [isDocxLoading, setIsDocxLoading] = useState(false);
    const [showProtocolDocsModal, setShowProtocolDocsModal] = useState(false);
    const [isSysDocLoading, setIsSysDocLoading] = useState(false);



    // Build header HTML (reused for both initial template and docx wrap)
    const buildHeaderInnerHtml = useCallback(() => {
        const orgName = t("testReport.institute.organizationName", { defaultValue: "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN" });
            const reportTitle = t("testReport.title", { defaultValue: "BIÊN BẢN THỬ NGHIỆM" });
            const protocolName = protocolDetail?.protocolTitle || protocolDetail?.protocolCode || selectedProtocolCode || (primaryAnalysis as AnalysisListItem & { protocolCode?: string })?.protocolCode || "-";

            return `
        <table style="width:100%; border-collapse:collapse; border:none; font-family:'Times New Roman',Times,serif;">
          <thead>
            <tr>
              <th style="border:none !important; padding-bottom:10px;">
                <table style="border:none !important; width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="border:none !important; width:80px; vertical-align:top; padding:0;">
                      <img src="${LOGO_URL}" style="height:52px; width:auto; object-fit:contain;" />
                    </td>
                    <td style="border:none !important; text-align:center; vertical-align:middle; padding:0 8px;">
                      <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">${orgName}</div>
                      <div style="font-size:15px; font-weight:700; text-transform:uppercase; margin-top:3px;">${reportTitle}</div>
                      <div style="font-size:11px; font-weight:600; font-style:italic; margin-top:2px;">${protocolName}</div>
                    </td>
                    <td style="border:none !important; width:80px; padding:0;"></td>
                  </tr>
                </table>
                <div style="border-top:1.5px solid #374151; margin-top:8px;"></div>
              </th>
            </tr>
          </thead>
        </table>`;
        },
        [t, protocolDetail, selectedProtocolCode, primaryAnalysis],
    );

    const buildHeaderHtml = useCallback(() => {
            return `
        <table style="width:100%; border-collapse:collapse; border:none; font-family:'Times New Roman',Times,serif;">
          <thead>
            <tr>
              <th id="report-dynamic-header" style="border:none !important; padding-bottom:10px;">
                ${buildHeaderInnerHtml()}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:none !important;">`;
        },
        [buildHeaderInnerHtml]
    );

    // Update dynamic header when protocol changes
    useEffect(() => {
        if (editorReady && editorRef.current) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const dom = (editorRef.current as any).dom;
                if (dom) {
                    const el = dom.get("report-dynamic-header");
                    if (el) {
                        dom.setHTML(el, buildHeaderInnerHtml());
                    }
                }
            } catch (e) {
                console.error("Failed to update header dynamically", e);
            }
        }
    }, [protocolDetail, selectedProtocolCode, buildHeaderInnerHtml, editorReady]);

    const HEADER_FOOTER = `              </td>
            </tr>
          </tbody>
        </table>`;

    const handleDocxUpload = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.name.toLowerCase().endsWith(".docx")) {
                toast.error(t("technician.workspace.invalidDocx", { defaultValue: "Chỉ hỗ trợ file .docx" }));
                return;
            }
            setIsDocxLoading(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                await processDocxArrayBuffer(arrayBuffer);
            } catch (err) {
                console.error("File upload error:", err);
                toast.error(t("technician.workspace.docxError", { defaultValue: "Lỗi khi đọc file Word" }));
            } finally {
                setIsDocxLoading(false);
                if (docxInputRef.current) docxInputRef.current.value = "";
            }
        },
        [t],
    );

    const processDocxArrayBuffer = async (arrayBuffer: ArrayBuffer) => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const transformParagraph = (paragraph: any) => {
                if (paragraph.alignment === "center" && !paragraph.styleId) {
                    return { ...paragraph, styleId: "AlignmentCenter", styleName: "Alignment Center" };
                }
                if (paragraph.alignment === "right" && !paragraph.styleId) {
                    return { ...paragraph, styleId: "AlignmentRight", styleName: "Alignment Right" };
                }
                if (paragraph.alignment === "justify" && !paragraph.styleId) {
                    return { ...paragraph, styleId: "AlignmentJustify", styleName: "Alignment Justify" };
                }
                return paragraph;
            };

            const options = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                transformDocument: (mammoth as any).transforms.paragraph(transformParagraph),
                styleMap: [
                    "p[style-name='Alignment Center'] => p.text-center:fresh",
                    "p[style-name='Alignment Right'] => p.text-right:fresh",
                    "p[style-name='Alignment Justify'] => p.text-justify:fresh",
                    // Also attempt generic preservation if possible
                ]
            };

            const result = await mammoth.convertToHtml({ arrayBuffer }, options);
            if (result.messages?.length > 0) console.warn("Mammoth warnings:", result.messages);

            const header = buildHeaderHtml();
            const wrappedHtml = `${header}\n${result.value}\n${HEADER_FOOTER}`;

            if (editorRef.current) {
                editorRef.current.setContent(wrappedHtml);
                toast.success(t("technician.workspace.docxImported", { defaultValue: "Đã tải nội dung Word vào biên bản" }));
            }
        } catch (err) {
            console.error("Mammoth convert error:", err);
            toast.error(t("technician.workspace.docxError", { defaultValue: "Lỗi khi chuyển đổi file Word" }));
            throw err;
        }
    };

    const handleSelectProtocolDoc = async (documentId: string, filename: string) => {
        setIsSysDocLoading(true);
        const loadingToastId = toast.loading(
            t("technician.workspace.sysDocLoading", { defaultValue: `Đang tải tài liệu "${filename}"...` })
        );
        try {
            // Step 1: Get presigned URL from backend
            const res = await documentApi.url(documentId);
            const urlData = (res as any).data ?? res;
            const presignedUrl = urlData?.url;
            if (!presignedUrl) throw new Error("No URL returned from server.");

            // Step 2: Fetch file as ArrayBuffer using native fetch (NO auth headers)
            // Presigned S3 URLs embed signing info in query params — adding extra
            // Authorization headers will cause a SignatureDoesNotMatch 403 error.
            const fetchRes = await fetch(presignedUrl, { method: "GET" });
            if (!fetchRes.ok) {
                throw new Error(`S3 fetch failed: ${fetchRes.status} ${fetchRes.statusText}`);
            }
            const arrayBuffer = await fetchRes.arrayBuffer();

            // Step 3: Convert & load into editor
            await processDocxArrayBuffer(arrayBuffer);
            toast.dismiss(loadingToastId);
            toast.success(
                t("technician.workspace.sysDocLoaded", { defaultValue: `Đã tải biểu mẫu "${filename}" vào biên bản` })
            );
            setShowProtocolDocsModal(false);
        } catch (e) {
            console.error("Failed to load protocol document", e);
            toast.dismiss(loadingToastId);
            toast.error(t("technician.workspace.sysDocLoadFail", { defaultValue: "Tải biểu mẫu hệ thống thất bại" }));
        } finally {
            setIsSysDocLoading(false);
        }
    };

    useEffect(() => {
        if (open && analyses.length > 0) {
            const initialQty: Record<string, string> = {};
            analyses.forEach(a => {
                const rawList = (a as any).consumablesUsed;
                const list = Array.isArray(rawList) ? rawList : (typeof rawList === 'string' ? (JSON.parse(rawList) || []) : []);
                list.forEach((c: any) => {
                    if (c.chemicalSkuId) {
                        const key = `${a.analysisId}_${c.chemicalSkuId}`;
                        const qty = c.changeQty ? Math.abs(c.changeQty) : (c.consumedQty || "1");
                        initialQty[key] = String(qty);
                    }
                });
            });
            setQuantities(initialQty);
        }
    }, [open, analyses]);

    // Reset protocol selection when analyses change
    useEffect(() => {
        setSelectedProtocolCode(prev => prev ? "" : prev);
    }, [analyses.map((a) => a.analysisId).join(",")]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInit = useCallback((_evt: unknown, editor: any) => {
        editorRef.current = editor;
        setEditorReady(true);
    }, []);

    const handleQtyChange = (key: string, val: string) => {
        setQuantities((prev) => ({ ...prev, [key]: val }));
    };


    const insertResultTable = () => {
        if (!editorRef.current) return;
        const paramName = analysisDetail?.parameterName || primaryAnalysis?.parameterName || "";
        const resultVal = analysisDetail?.analysisResult || "";
        const resultStatus = analysisDetail?.analysisResultStatus || "";
        editorRef.current.insertContent(`
            <br/><h4>Tóm tắt Kết quả:</h4>
            <table><thead><tr>
                <th>${t("technician.workspace.parameterOrNorm", { defaultValue: "Chỉ tiêu / Thông số" })}</th>
                <th>${t("technician.workspace.measuredResult", { defaultValue: "Kết quả đo được" })}</th>
                <th>${t("technician.workspace.statusEval", { defaultValue: "Đánh giá (Status)" })}</th>
            </tr></thead><tbody><tr>
                <td><strong>${paramName}</strong></td><td>${resultVal}</td><td>${resultStatus}</td>
            </tr></tbody></table><br/>`);
    };

    const finalizeHtmlForExport = (html: string) => {
        // Enforce consistent styles during PDF generation/Print that match editor's CSS
        // Include full CONTENT_STYLE so backend renderer displays exactly what the user sees
        const stylePrefix = `
<style>
${CONTENT_STYLE}
</style>
`;
        if (html.includes(stylePrefix.trim())) return `<div class="report-content-wrapper">${html}</div>`; // already present
        return `<!DOCTYPE html><html><head><meta charset="UTF-8">${stylePrefix}</head><body>${html}</body></html>`;
    };

    const handleSave = () => {
        if (analyses.length === 0) return;
        const htmlContent = editorRef.current?.getContent() || "";
        const payloadHtml = finalizeHtmlForExport(htmlContent);

        // Dispatch updates for all analyses. 
        // Note: Currently we save the same HTML to the primary analysis or all? 
        // Requirement says "protocol nào làm tiêu đề chính", so usually we save html to primaryAnalysis.
        
        const payload = analyses.map(a => {
            const myChems = availableChemicals
                .filter(c => c.analysisId === a.analysisId)
                .map(c => ({
                    ...c,
                    consumedQty: quantities[c.uniqueKey] || "0",
                    changeQty: -Math.abs(Number(quantities[c.uniqueKey] || 0)),
                }));
            
            const existingRaw = (a as any).rawData || {};

            return {
                analysisId: a.analysisId,
                consumablesUsed: myChems,
                // Save HTML only to the primary one or all? Let's save to all if they are part of one report.
                rawData: { ...existingRaw, protocolReportHtml: payloadHtml },
            };
        });

        updateBulk(
            { body: payload },
            {
                onSuccess: () => {
                    toast.success(t("technician.workspace.saveProtocolSuccess", { defaultValue: "Đã sao lưu Biên bản thử nghiệm và danh sách hóa chất gốc" }));
                    onSuccess?.();
                },
                onError: () => toast.error(t("common.error.saveFailed", { defaultValue: "Có lỗi xảy ra khi lưu" })),
            },
        );
    };

    const handlePrint = () => {
        if (editorRef.current) editorRef.current.execCommand("mcePrint");
    };

    const handleExport = () => {
        if (analyses.length === 0) return;
        const htmlContent = editorRef.current?.getContent() || "";
        const payloadHtml = finalizeHtmlForExport(htmlContent);

        generateLabReport({
            analyses: analyses.map(a => a.analysisId),
            html: payloadHtml,
        }, {
            onSuccess: async (data: any) => {
                console.log("Export API success:", data);
                toast.success(t("technician.workspace.exportSuccess", { defaultValue: "Đã xuất báo cáo và tạo tài liệu thành công." }));
                setIsExported(true);

                // Automatically update the already-opened window with the real URL
                const docId = data.documentId || data.data?.documentId;
                
                if (docId) {
                    try {
                        const urlRes = await documentApi.url(docId);
                        const urlData = (urlRes as any).data ?? urlRes;
                        const finalUrl = urlData?.url || urlData;
                        
                        if (typeof finalUrl === 'string' && finalUrl.startsWith('http')) {
                            // Try to open window
                            const newWin = window.open(finalUrl, '_blank');
                            
                            // If window.open was blocked by the browser
                            if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                                toast.info(
                                    <div className="flex flex-col gap-2 p-1">
                                        <p className="text-sm font-medium">{t("technician.workspace.popupBlocked", { defaultValue: "Tab mới đã bị chặn." })}</p>
                                        <Button size="sm" variant="outline" className="h-8" onClick={() => window.open(finalUrl, '_blank')}>
                                            {t("common.open", { defaultValue: "Mở tài liệu" })}
                                        </Button>
                                    </div>,
                                    { duration: 6000, position: 'bottom-right' }
                                );
                            }
                        } else {
                            console.error("Invalid URL format:", finalUrl);
                            toast.error(t("common.error.invalidUrl", { defaultValue: "Không lấy được liên kết tài liệu." }));
                        }
                    } catch (e) {
                        console.error("Failed to fetch document URL after export:", e);
                        toast.error(t("common.error.urlFetchFailed", { defaultValue: "Lỗi khi lấy liên kết xem tài liệu." }));
                    }
                }
                
                // Also trigger onSuccess so that parent component refetches (updating document icons)
                onSuccess?.();
            },
            onError: (error) => {
                console.error("Export API error:", error);
            }
        });
    };

    // Stable initialHtml computed once per open/primary-analysis change
    const stableInitialHtml = useRef<string>("");
    const lastKey = useRef<string>("");

    const currentKey = analyses.map((a) => a.analysisId).join("|");
    if (currentKey !== lastKey.current || stableInitialHtml.current === "") {
        lastKey.current = currentKey;
        const savedHtmlNow = (analysisDetail?.rawData as Record<string, unknown>)?.protocolReportHtml as string;
        if (!savedHtmlNow) {
            const orgName = t("testReport.institute.organizationName", { defaultValue: "VIỆN NGHIÊN CỨU VÀ PHÁT TRIỂN SẢN PHẨM THIÊN NHIÊN" });
            const reportTitle = t("testReport.title", { defaultValue: "BIÊN BẢN THỬ NGHIỆM" });
            const protocolName = protocolDetail?.protocolTitle || protocolDetail?.protocolCode || selectedProtocolCode || (primaryAnalysis as AnalysisListItem & { protocolCode?: string })?.protocolCode || "-";
            stableInitialHtml.current = `
        <table style="width:100%; border-collapse:collapse; border:none; font-family:'Times New Roman',Times,serif;">
          <thead>
            <tr>
              <th style="border:none !important; padding-bottom:10px;">
                <table style="border:none !important; width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="border:none !important; width:80px; vertical-align:top; padding:0;">
                      <img src="${LOGO_URL}" style="height:52px; width:auto; object-fit:contain;" />
                    </td>
                    <td style="border:none !important; text-align:center; vertical-align:middle; padding:0 8px;">
                      <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">${orgName}</div>
                      <div style="font-size:15px; font-weight:700; text-transform:uppercase; margin-top:3px;">${reportTitle}</div>
                      <div style="font-size:11px; font-weight:600; font-style:italic; margin-top:2px;">${protocolName}</div>
                    </td>
                    <td style="border:none !important; width:80px; padding:0;"></td>
                  </tr>
                </table>
                <div style="border-top:1.5px solid #374151; margin-top:8px;"></div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border:none !important;">
                <br/>
                <h3>1. ${t("technician.workspace.testingSequence", { defaultValue: "Trình tự thử nghiệm" })}</h3>
                <p>[${t("technician.workspace.fillContent", { defaultValue: "Điền nội dung..." })}]</p>
                <br/>
                <h3>2. ${t("technician.workspace.recordedData", { defaultValue: "Dữ liệu ghi nhận" })}</h3>
                <p>[${t("technician.workspace.fillContent", { defaultValue: "Điền nội dung..." })}]</p>
              </td>
            </tr>
          </tbody>
        </table>`;
        } else {
            stableInitialHtml.current = savedHtmlNow;
        }
    }

    const hasMultipleProtocols = uniqueProtocols.length > 1;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-[90vw] w-[90vw] sm:max-w-[90vw] h-[90vh] p-0 flex flex-col overflow-hidden bg-background border-none shadow-2xl [&>button:last-child]:hidden">
                    {/* App-level Header Bar */}
                    <div className="flex items-center justify-between px-6 py-3 border-b shrink-0 bg-muted/30">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="text-base font-bold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider">Editor</span>
                                <span className="text-muted-foreground font-medium text-sm">
                                    {t("technician.workspace.reportTitle", { defaultValue: "Biên bản báo cáo" })}
                                </span>
                            </DialogTitle>
                            {/* Badge showing number of selected analyses */}
                            <Badge variant="secondary" className="text-xs">
                                {analyses.length} {t("technician.workspace.analysesCount", { defaultValue: "chỉ tiêu" })}
                            </Badge>
                            {/* Protocol selector — shown only when analyses differ */}
                            {hasMultipleProtocols && (
                                <div className="flex items-center gap-1.5 ml-2">
                                    <span className="text-xs text-muted-foreground">{t("technician.workspace.mainProtocol", { defaultValue: "Phương pháp chính:" })}</span>
                                    <Select value={selectedProtocolCode} onValueChange={setSelectedProtocolCode}>
                                        <SelectTrigger className="h-7 text-xs w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uniqueProtocols.map((p) => (
                                                <SelectItem key={p.code} value={p.code} className="text-xs">
                                                    {p.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pr-6">
                            <Button variant="outline" size="sm" onClick={handleExport} disabled={isGenerating} className="h-8 px-3 border-blue-200 text-blue-700 hover:bg-blue-50">
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileText className="w-4 h-4 mr-1.5" />}
                                {t("technician.workspace.exportProtocol", { defaultValue: "Xuất PDF" })}
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!isExported} className="h-8 px-3">
                                <Printer className="w-4 h-4 mr-1.5" />
                                {t("technician.workspace.printProtocol", { defaultValue: "In Biên bản" })}
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isUpdating} className="h-8 px-3 shadow-sm">
                                {isUpdating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
                                {t("technician.workspace.saveData", { defaultValue: "Lưu dữ liệu" })}
                            </Button>
                        </div>
                    </div>

                    {/* Body (Split Layout) */}
                    <div className="flex flex-1 overflow-hidden h-full">
                        {/* Left: TinyMCE Editor (70%) */}
                        <div className="w-[70%] h-full border-r bg-muted/5 relative">
                            {isLoadingAnalysis ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : null}
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                onInit={handleInit}
                                initialValue={stableInitialHtml.current}
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
                                    content_style: CONTENT_STYLE,
                                    branding: false,
                                    promotion: false,
                                    skin_url: "/tinymce/skins/ui/oxide",
                                    content_css: "/tinymce/skins/content/default/content.min.css",
                                }}
                            />
                        </div>

                        {/* Right: Sidebar Panel (30%) */}
                        <div className="w-[30%] h-full flex flex-col bg-background overflow-hidden">
                            <Tabs defaultValue="chemicals" className="flex-1 flex flex-col h-full overflow-hidden">
                                <div className="px-4 pt-3 border-b bg-muted/20 shrink-0 h-14 flex items-end pb-0">
                                    <TabsList className="grid w-full grid-cols-2 bg-muted/40 h-10 border-b-0 rounded-b-none">
                                        <TabsTrigger value="chemicals" className="flex items-center gap-2 data-[state=active]:bg-background transition-all">
                                            <Beaker className="w-4 h-4" /> {t("technician.workspace.chemicalsBom", { defaultValue: "Hóa chất (BOM)" })}
                                        </TabsTrigger>
                                        <TabsTrigger value="protocol" className="flex items-center gap-2 data-[state=active]:bg-background transition-all">
                                            <FileText className="w-4 h-4" /> {t("technician.workspace.protocolMethod", { defaultValue: "Phương pháp" })}
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Chemicals Tab */}
                                <TabsContent value="chemicals" className="flex-1 overflow-y-auto mt-0 p-4">
                                    <div className="space-y-4">
                                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-1 relative overflow-hidden">
                                            <div className="absolute -right-4 -top-4 bg-primary/10 w-24 h-24 rounded-full blur-2xl pointer-events-none" />
                                            <h3 className="font-semibold text-primary flex items-center gap-2 text-sm">
                                                <Beaker className="w-4 h-4" />
                                                {t("technician.workspace.suggestFromBom", { defaultValue: "Đề xuất từ BOM hệ thống" })}
                                            </h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {t("technician.workspace.suggestFromBomDesc", {
                                                    defaultValue: "Danh sách hóa chất dự kiến theo cấu hình phương pháp. Nhập số lượng thực tế sử dụng.",
                                                })}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {availableChemicals.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground text-sm italic">
                                                    {t("technician.workspace.noChemicalUsed", { defaultValue: "Chưa có danh sách hóa chất đã cấp phát." })}
                                                </div>
                                            ) : (
                                                <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
                                                    <table className="w-full text-sm">
                                                        <thead className="border-b">
                                                            <tr>
                                                                <th className="text-left px-3 py-2 font-semibold text-xs">Mã SKU</th>
                                                                <th className="text-left px-3 py-2 font-semibold text-xs">Tên hóa chất</th>
                                                                <th className="w-24  px-3 py-2 font-semibold text-xs">Số lượng</th>
                                                                <th className="w-16  px-1 py-2 font-semibold text-xs">Đơn vị</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {availableChemicals.map((c) => (
                                                                <tr key={c.uniqueKey} className="hover:bg-muted/30 transition-colors">
                                                                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                                                                        {c.chemicalSkuId}
                                                                        <div className="text-[9px] opacity-70">{c.analysisId}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2 leading-tight font-medium text-[13px]">{c.chemicalName}</td>
                                                                    <td className="px-2 py-2">
                                                                        <Input
                                                                            className="h-7 text-right text-xs bg-background focus:ring-1"
                                                                            type="number"
                                                                            placeholder="0"
                                                                            value={quantities[c.uniqueKey] || ""}
                                                                            onChange={(e) => handleQtyChange(c.uniqueKey, e.target.value)}
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2  text-muted-foreground text-xs whitespace-nowrap">{c.chemicalBaseUnit || c.unit || "-"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t flex flex-col gap-2 sticky bottom-0 bg-background pb-2">
                                            <Button variant="secondary" className="w-full flex justify-between" onClick={() => setShowChemicalInsertModal(true)} disabled={isLoadingAnalysis}>
                                                {t("technician.workspace.insertChemicalTable", { defaultValue: "Chèn bảng Hóa chất" })} <PlusCircle className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Selected analyses table */}
                                        {analyses.length > 0 && (
                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="bg-muted/40 px-3 py-2 border-b">
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                        {t("technician.workspace.selectedAnalyses", { defaultValue: "Chỉ tiêu đã chọn" })} ({analyses.length})
                                                    </h4>
                                                </div>
                                                <div className="overflow-y-auto max-h-48">
                                                    <table className="w-full text-xs">
                                                        <thead className="sticky top-0 bg-background/95 backdrop-blur">
                                                            <tr>
                                                                <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                                                                    {t("technician.workspace.sampleCode", { defaultValue: "Mã mẫu" })}
                                                                </th>
                                                                <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                                                                    {t("technician.workspace.analysisId", { defaultValue: "Mã chỉ tiêu" })}
                                                                </th>
                                                                <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                                                                    {t("technician.workspace.parameterName", { defaultValue: "Tên chỉ tiêu" })}
                                                                </th>
                                                                <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                                                                    {t("technician.workspace.protocolCodeCol", { defaultValue: "PP thử" })}
                                                                </th>
                                                                 <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                                                                    {t("technician.workspace.unit", { defaultValue: "Đơn vị" })}
                                                                </th>
                                                                <th className="text-left px-2 py-1.5 font-semibold whitespace-nowrap">
                                                                    {t("technician.workspace.result", { defaultValue: "Kết quả" })}
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {analyses.map((a) => (
                                                                <tr key={a.analysisId} className="hover:bg-muted/20">
                                                                    <td className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{a.sampleId}</td>
                                                                    <td className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{a.analysisId}</td>
                                                                    <td className="px-2 py-1.5 leading-tight">{a.parameterName}</td>
                                                                    <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">
                                                                        {(a as AnalysisListItem & { protocolCode?: string }).protocolCode || "-"}
                                                                    </td>
                                                                    <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap ">
                                                                        {(a as AnalysisListItem & { analysisUnit?: string }).analysisUnit || "-"}
                                                                    </td>
                                                                    <td className="px-2 py-1.5 font-medium text-blue-600 whitespace-nowrap ">
                                                                        {a.analysisResult || "-"}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="p-2 border-t">
                                                    <Button variant="ghost" className="w-full h-8 text-xs text-primary hover:bg-primary/10 flex justify-between px-3" onClick={() => setShowAnalysisTableInsertModal(true)}>
                                                        {t("technician.workspace.insertAnalysesTable", { defaultValue: "Chèn bảng chỉ tiêu vào mẫu" })} <PlusCircle className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Protocol Tab */}
                                <TabsContent value="protocol" className="flex-1 overflow-y-auto mt-0 p-4">
                                    <div className="space-y-4">
                                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 space-y-1">
                                            <h3 className="font-semibold text-primary text-sm">
                                                {t("technician.workspace.protocolContent", { defaultValue: "Nội dung phương pháp" })}
                                            </h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {t("technician.workspace.protocolContentDesc", {
                                                    defaultValue: "Xem nhanh nội dung quy trình thử nghiệm để làm tham chiếu nhập liệu.",
                                                })}
                                            </p>
                                        </div>

                                        {/* Upload .docx from PC or System */}
                                        <div className="flex flex-col gap-2">
                                            <input ref={docxInputRef} type="file" accept=".docx" className="hidden" onChange={handleDocxUpload} />
                                            <Button
                                                variant="outline"
                                                className="w-full flex justify-between shadow-sm"
                                                onClick={() => setShowProtocolDocsModal(true)}
                                            >
                                                <FileText className="w-4 h-4" />
                                                {t("technician.workspace.selectSysDoc", { defaultValue: "Chọn biểu mẫu từ Hệ thống" })}
                                            </Button>

                                            <div className="relative py-2">
                                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t("common.or", { defaultValue: "Hoặc" })}</span></div>
                                            </div>

                                            <Button
                                                variant="default"
                                                className="w-full flex justify-between shadow-sm"
                                                onClick={() => docxInputRef.current?.click()}
                                                disabled={isDocxLoading}
                                            >
                                                {isDocxLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                {t("technician.workspace.uploadDocx", { defaultValue: "Tải file Word (.docx) vào biên bản" })}
                                            </Button>
                                            <p className="text-xs text-muted-foreground text-center">
                                                {t("technician.workspace.uploadDocxHint", { defaultValue: "File Word sẽ thay thế toàn bộ nội dung trong editor" })}
                                            </p>
                                        </div>

                                        <Button variant="outline" className="w-full flex justify-between shadow-sm" onClick={insertResultTable}>
                                            {t("technician.workspace.insertResultForm", { defaultValue: "Chèn Form Kết quả mẫu" })} <PlusCircle className="w-4 h-4" />
                                        </Button>

                                        <div className="p-4 bg-muted/40 rounded-lg border text-sm prose prose-sm max-w-none">
                                            {isLoadingProtocol ? (
                                                <div className="py-8 flex justify-center">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                                </div>
                                            ) : protocolDetail ? (
                                                <div>
                                                    <h4 className="text-base font-bold mb-2">{protocolDetail.protocolTitle || protocolDetail.protocolCode}</h4>
                                                    <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed text-xs">
                                                        {protocolDetail.protocolDescription ||
                                                            t("technician.workspace.noDetailsSetting", { defaultValue: "Không có hướng dẫn mô tả chi tiết." })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-muted-foreground italic">
                                                    {t("technician.workspace.unavailableProtocol", { defaultValue: "Dữ liệu phương pháp không khả dụng hoặc chưa gán." })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ChemicalInsertModal
                open={showChemicalInsertModal}
                onOpenChange={setShowChemicalInsertModal}
                consumablesUsed={availableChemicals.map(c => ({
                    ...c,
                    changeQty: -Math.abs(Number(quantities[c.uniqueKey] || 0))
                }))}
                onInsert={(html) => {
                    if (editorRef.current) {
                        setTimeout(() => {
                            editorRef.current.focus();
                            editorRef.current.insertContent(html);
                            toast.success(t("technician.workspace.insertSuccess", { defaultValue: "Đã chèn nội dung vào biên bản" }));
                        }, 100);
                    }
                }}
            />
            <AnalysisTableInsertModal
                open={showAnalysisTableInsertModal}
                onOpenChange={setShowAnalysisTableInsertModal}
                analyses={analyses}
                onInsert={(html) => {
                    if (editorRef.current) {
                        setTimeout(() => {
                            editorRef.current.focus();
                            editorRef.current.insertContent(html);
                            toast.success(t("technician.workspace.insertSuccess", { defaultValue: "Đã chèn nội dung vào biên bản" }));
                        }, 100);
                    }
                }}
            />
            {/* Protocol Docs Selection Modal */}
            <Dialog open={showProtocolDocsModal} onOpenChange={setShowProtocolDocsModal}>
                <DialogContent className="sm:max-w-[600px] [&>button:last-child]:hidden">
                    <DialogTitle className="text-lg font-semibold">{t("technician.workspace.sysProtocolDocs", { defaultValue: "Biểu mẫu Phương pháp" })}</DialogTitle>
                    <div className="text-sm text-muted-foreground -mt-1 mb-2">
                        {t("technician.workspace.sysProtocolDocsHint", { defaultValue: "Danh sách các file đính kèm thuộc phương pháp thử nghiệm. Chọn biểu mẫu để nạp vào trình soạn thảo." })}
                    </div>
                    {isLoadingProtocol && (
                        <div className="py-8 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    )}
                    {!isLoadingProtocol && (!protocolDetail?.documents?.length && !protocolDetail?.protocolDocumentIds?.length) ? (
                        <div className="text-center py-8 text-muted-foreground bg-muted/20 border border-border rounded-lg border-dashed text-sm">
                            {t("technician.workspace.noSysDocs", { defaultValue: "Phương pháp này chưa có biểu mẫu đính kèm nào." })}
                        </div>
                    ) : null}
                    {!isLoadingProtocol && (protocolDetail?.documents?.length || protocolDetail?.protocolDocumentIds?.length) ? (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                            {(() => {
                                const list = protocolDetail?.documents?.length ? protocolDetail.documents : protocolDetail?.protocolDocumentIds?.map((id: string) => ({ documentId: id })) || [];
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                return list.map((doc: any, i: number) => {
                                    const title = doc.jsonContent?.documentTitle || doc.documentTitle || doc.file?.fileName || doc.documentId;
                                    return (
                                        <div key={doc.documentId || i} className="p-3 border rounded-lg flex items-center justify-between transition-colors hover:bg-muted/40 bg-card">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText className="w-4 h-4 shrink-0 text-blue-600" />
                                                <div className="truncate text-sm font-medium">{title}</div>
                                            </div>
                                            <Button 
                                                variant="default"
                                                size="sm" 
                                                disabled={isSysDocLoading}
                                                onClick={() => handleSelectProtocolDoc(doc.documentId, title)}
                                                className="shrink-0 h-8"
                                            >
                                                {isSysDocLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                                                {t("common.select", { defaultValue: "Chọn" })}
                                            </Button>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}

