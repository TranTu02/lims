import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Truck, Clock, FlaskConical, FileText, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowActionIcons } from "@/components/common/RowActionIcons";
import { FilePreviewModal } from "@/components/common/FilePreviewModal";
import type { ReceiptListItem, ReceiptStatus, ReceiptSample, ReceiptAnalysis } from "@/types/receipt";
import { TableHeaderFilter } from "@/components/reception/TableHeaderFilter";
import { RECEIPT_FILTERS } from "@/components/reception/FilterBar";

export type TabKey = "incoming-requests" | "processing" | "return-results";

type Props = {
    items: ReceiptListItem[];
    activeTab: TabKey;
    selectedRowKey: string | null;
    onSelectRow: (rowKey: string, receiptId: string) => void;
    onView: (receiptId: string) => void;
    onDelete: (receiptId: string) => void;
    onOpenShipment?: (receiptId: string) => void;
    openingReceiptId: string | null;
    filterValues?: Record<string, string[]>;
    onFilterChange?: (col: string, vals: string[]) => void;
};

/* ── Helpers ────────────────────────────────────────────────── */

function getReceiptSamples(receipt: ReceiptListItem): ReceiptSample[] {
    const raw = (receipt as any).samples;
    return Array.isArray(raw) ? (raw as ReceiptSample[]) : [];
}

function countAnalysesStats(sample: ReceiptSample) {
    const analyses: ReceiptAnalysis[] = (sample.analyses ?? []).filter((a) => a?.analysisId);
    const total = analyses.length;
    const distributed = analyses.filter((a) => a.technicianId || (a.analysisStatus && a.analysisStatus !== "Pending")).length;
    const completed = analyses.filter((a) => ["Approved", "DataEntered"].includes(a.analysisStatus ?? "") || a.analysisResult != null).length;
    return { distributed, completed, total };
}

function getLatestResultCert(sample: ReceiptSample): any | null {
    const docs: any[] = (sample as any).documents ?? [];
    const certs = docs.filter((d) => d.documentType === "RESULT_CERT" && d.documentStatus === "Issued");
    if (!certs.length) return null;
    return certs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

function parseIsoDateOnly(iso?: string | null, fallback = "--"): string {
    if (!iso) return fallback;
    const t = iso.split("T")[0];
    return t.length > 0 ? t : fallback;
}

function safeDaysLeft(deadlineIso?: string | null): number | null {
    if (!deadlineIso) return null;
    const tt = new Date(deadlineIso).getTime();
    if (!Number.isFinite(tt)) return null;
    const days = Math.ceil((tt - Date.now()) / (1000 * 3600 * 24));
    return Number.isFinite(days) ? days : null;
}

const DOC_TYPE_LABELS: Record<string, { label: string; cls: string }> = {
    RESULT_CERT: { label: "PKKQ", cls: "bg-primary/90 text-primary-foreground" },
    RECEIPT:     { label: "PKN",  cls: "bg-success/80 text-white" },
    ANALYSIS:    { label: "PT",   cls: "bg-warning/80 text-white" },
};

/* ── Sub-components ─────────────────────────────────────────── */

function DocTypeMark({ type }: { type: string }) {
    const cfg = DOC_TYPE_LABELS[type] ?? { label: type, cls: "bg-muted text-muted-foreground" };
    return (
        <span className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1 py-0 rounded leading-tight ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

function DocChip({ doc, onPreview }: { doc: any; onPreview: (id: string, title: string) => void }) {
    return (
        <div
            className="relative inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors group text-xs max-w-[200px]"
            onClick={(e) => { e.stopPropagation(); onPreview(doc.documentId, doc.documentTitle || doc.documentId); }}
            title={doc.documentTitle || doc.documentId}
        >
            <DocTypeMark type={doc.documentType} />
            <FileText className="h-3 w-3 text-primary shrink-0" />
            <span className="truncate font-medium">{doc.documentTitle || doc.documentId}</span>
            <Eye className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
        </div>
    );
}

function DeadlineCell({ receiptDeadline, t }: { receiptDeadline?: string | null; t: any }) {
    const daysLeft = safeDaysLeft(receiptDeadline);
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-foreground">{parseIsoDateOnly(receiptDeadline)}</span>
            </div>
            {typeof daysLeft === "number" ? (
                daysLeft < 0 ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <AlertCircle className="h-3 w-3" />
                        {String(t("reception.sampleReception.deadline.overdue"))}
                    </Badge>
                ) : daysLeft <= 2 ? (
                    <Badge variant="secondary" className="w-fit">
                        {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-muted-foreground w-fit">
                        {String(t("reception.sampleReception.deadline.daysLeft", { count: daysLeft }))}
                    </Badge>
                )
            ) : (
                <Badge variant="outline" className="text-muted-foreground w-fit">--</Badge>
            )}
        </div>
    );
}

function ReceiptInfoCell({ receipt, onView, openingReceiptId, dash }: { receipt: ReceiptListItem; onView: (id: string) => void; openingReceiptId: string | null; dash: string }) {
    return (
        <div className="space-y-1">
            <button
                onClick={(e) => { e.stopPropagation(); onView(receipt.receiptId); }}
                className="font-semibold text-primary hover:text-primary/80 hover:underline"
                disabled={openingReceiptId === receipt.receiptId}
            >
                {receipt.receiptCode ?? dash}
            </button>
            <div className="text-sm text-foreground">{receipt.client?.clientName ?? dash}</div>
            <div className="text-xs text-muted-foreground">
                {parseIsoDateOnly(receipt.receiptDate, dash)}
                {receipt.createdBy?.identityName ? ` - ${receipt.createdBy.identityName}` : ""}
            </div>
        </div>
    );
}

function toReceiptStatusLabelKey(status: ReceiptStatus): string {
    const map: Record<string, string> = {
        Draft: "reception.receipts.status.draft",
        Received: "reception.receipts.status.receive",
        Processing: "reception.receipts.status.processing",
        Completed: "reception.receipts.status.completed",
        Reported: "reception.receipts.status.reported",
        Cancelled: "reception.receipts.status.cancelled",
    };
    return map[status] ?? "";
}

function getReceiptStatusBadge(status: ReceiptStatus, t: any) {
    const key = toReceiptStatusLabelKey(status);
    const label = key ? String(t(key, { defaultValue: status })) : String(status);
    switch (status) {
        case "Draft": case "Received":
            return <Badge variant="outline" className="text-muted-foreground border-border">{label}</Badge>;
        case "Processing":
            return <Badge variant="default" className="bg-warning text-warning-foreground hover:bg-warning/90">{label}</Badge>;
        case "Completed":
            return <Badge variant="default" className="bg-success text-success-foreground hover:bg-success/90">{label}</Badge>;
        case "Reported":
            return <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">{label}</Badge>;
        case "Cancelled":
            return <Badge variant="destructive">{label}</Badge>;
        default:
            return <Badge variant="secondary" className="text-muted-foreground">{label}</Badge>;
    }
}

function AnalysesProgressCell({ sample }: { sample: ReceiptSample }) {
    const stats = countAnalysesStats(sample);
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-1.5">
                <FlaskConical className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm font-medium tabular-nums">
                    <span className="text-success">{stats.completed}</span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-primary">{stats.distributed}</span>
                    <span className="text-muted-foreground mx-0.5">/</span>
                    <span className="text-foreground">{stats.total}</span>
                </span>
            </div>
            {stats.total > 0 && (
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all bg-primary"
                        style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

/* ── Main component ─────────────────────────────────────────── */

export function ReceiptsTable({ items, activeTab, selectedRowKey, onSelectRow, onView, onDelete, onOpenShipment, openingReceiptId, filterValues = {}, onFilterChange }: Props) {
    const { t } = useTranslation();
    const dash = String(t("common.noData"));

    const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string } | null>(null);

    const isProcessing = activeTab === "processing";
    const isReturnResults = activeTab === "return-results";

    const colSpanEmpty = isProcessing ? 5 : isReturnResults ? 8 : 5;

    return (
        <>
            <FilePreviewModal
                documentId={previewDoc?.id ?? null}
                documentTitle={previewDoc?.title}
                onClose={() => setPreviewDoc(null)}
            />

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {String(t("reception.sampleReception.receiptInfo"))}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {!isProcessing && !isReturnResults ? (
                                    String(t("reception.sampleReception.table.returnResults.tracking"))
                                ) : (
                                    <TableHeaderFilter
                                        title={String(t("reception.sampleReception.table.processing.status"))}
                                        {...(RECEIPT_FILTERS.find((f) => f.column === "receiptStatus") as any)}
                                        value={filterValues["receiptStatus"]}
                                        onChange={(vals) => onFilterChange?.("receiptStatus", vals)}
                                    />
                                )}
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <TableHeaderFilter
                                    title={String(t("reception.sampleReception.table.processing.deadline"))}
                                    type="daterange"
                                    value={filterValues["receiptDeadline"]}
                                    onChange={(vals) => onFilterChange?.("receiptDeadline", vals)}
                                />
                            </th>

                            {isProcessing && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 180 }}>
                                        {String(t("lab.samples.sampleId", { defaultValue: "Mẫu thử" }))}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {String(t("lab.analyses.progress", { defaultValue: "Tiến độ PT" }))}
                                    </th>
                                </>
                            )}

                            {isReturnResults && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 140 }}>
                                        <TableHeaderFilter
                                            title="Vận đơn"
                                            type="enum"
                                            options={["IS NOT NULL", "IS NULL"]}
                                            labelMap={{ "IS NOT NULL": "Đã tạo vận đơn", "IS NULL": "Chưa tạo vận đơn" }}
                                            value={filterValues["shipmentTrackingNumber"]}
                                            onChange={(vals) => onFilterChange?.("shipmentTrackingNumber", vals)}
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 140 }}>
                                        Mã mẫu
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 180 }}>
                                        Phiếu kết quả
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 160 }}>
                                        Chỉ tiêu
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 180 }}>
                                        Tài liệu tiếp nhận
                                    </th>
                                </>
                            )}

                            {!isProcessing && !isReturnResults && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {String(t("reception.sampleReception.table.returnResults.contact"))}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        {String(t("reception.sampleReception.table.processing.actions"))}
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {items.map((receipt) => {
                            const r = receipt as any;
                            const trackingNo = r.shipmentTrackingNumber ? String(r.shipmentTrackingNumber) : null;
                            const shipmentId = typeof r.shipmentId === "string" ? r.shipmentId : null;
                            const rowKey = receipt.receiptId;
                            const isSelected = selectedRowKey === rowKey;

                            /* ── PROCESSING TAB ── */
                            if (isProcessing) {
                                const samples = getReceiptSamples(receipt);
                                const rowCount = Math.max(samples.length, 1);
                                return (
                                    <React.Fragment key={receipt.receiptId}>
                                        {samples.length > 0 ? samples.map((sample, sIdx) => (
                                            <tr
                                                key={`${receipt.receiptId}-${sample.sampleId}`}
                                                className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""} ${sIdx > 0 ? "border-t border-border/30" : ""}`}
                                                onClick={() => onSelectRow(rowKey, receipt.receiptId)}
                                            >
                                                {sIdx === 0 && (
                                                    <>
                                                        <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                            <ReceiptInfoCell receipt={receipt} onView={onView} openingReceiptId={openingReceiptId} dash={dash} />
                                                        </td>
                                                        <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                            {getReceiptStatusBadge(receipt.receiptStatus, t)}
                                                        </td>
                                                        <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                            <DeadlineCell receiptDeadline={receipt.receiptDeadline} t={t} />
                                                        </td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3" style={{ minWidth: 180 }}>
                                                    <span className="font-semibold text-foreground text-sm">{sample.sampleId}</span>
                                                    {" "}
                                                    <span className="text-muted-foreground text-sm">{(sample as any).sampleName || sample.sampleTypeName || ""}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <AnalysesProgressCell sample={sample} />
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr className={`hover:bg-accent/30 ${isSelected ? "bg-accent/20" : ""}`} onClick={() => onSelectRow(rowKey, receipt.receiptId)}>
                                                <td className="px-4 py-4"><ReceiptInfoCell receipt={receipt} onView={onView} openingReceiptId={openingReceiptId} dash={dash} /></td>
                                                <td className="px-4 py-4">{getReceiptStatusBadge(receipt.receiptStatus, t)}</td>
                                                <td className="px-4 py-4"><DeadlineCell receiptDeadline={receipt.receiptDeadline} t={t} /></td>
                                                <td className="px-4 py-3 text-muted-foreground text-sm">-</td>
                                                <td className="px-4 py-3 text-muted-foreground text-sm">-</td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }

                            /* ── RETURN-RESULTS TAB ── */
                            if (isReturnResults) {
                                const samples = getReceiptSamples(receipt);
                                const rowCount = Math.max(samples.length, 1);
                                const receiptDocs: any[] = (receipt as any).documents ?? [];

                                return (
                                    <React.Fragment key={receipt.receiptId}>
                                        {samples.length > 0 ? samples.map((sample, sIdx) => {
                                            const certDoc = getLatestResultCert(sample);
                                            const stats = countAnalysesStats(sample);
                                            return (
                                                <tr
                                                    key={`${receipt.receiptId}-${sample.sampleId}`}
                                                    className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""} ${sIdx > 0 ? "border-t border-border/30" : ""}`}
                                                    onClick={() => onSelectRow(rowKey, receipt.receiptId)}
                                                >
                                                    {sIdx === 0 && (
                                                        <>
                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                <ReceiptInfoCell receipt={receipt} onView={onView} openingReceiptId={openingReceiptId} dash={dash} />
                                                            </td>
                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                {getReceiptStatusBadge(receipt.receiptStatus, t)}
                                                            </td>
                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                <DeadlineCell receiptDeadline={receipt.receiptDeadline} t={t} />
                                                            </td>
                                                            {/* Shipment button - spans all sample rows */}
                                                            <td className="px-4 py-3 align-top" rowSpan={rowCount} style={{ minWidth: 140 }}>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="gap-1.5 border-primary/20 hover:bg-primary/5 text-primary w-fit justify-start px-3 py-1.5 h-auto text-xs"
                                                                    onClick={(e) => { e.stopPropagation(); onOpenShipment?.(receipt.receiptId); }}
                                                                    disabled={openingReceiptId === receipt.receiptId}
                                                                >
                                                                    <Truck className="h-3.5 w-3.5 shrink-0" />
                                                                    <div className="flex flex-col items-start text-left">
                                                                        {trackingNo
                                                                            ? <span className="font-semibold truncate max-w-[100px]" title={trackingNo}>{trackingNo}</span>
                                                                            : <span className="whitespace-nowrap font-medium">{String(t("reception.sampleReception.tracking.none", { defaultValue: "Tạo Vận Đơn" }))}</span>}
                                                                        {shipmentId && <span className="font-mono opacity-60 text-[10px]">#{shipmentId}</span>}
                                                                    </div>
                                                                </Button>
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* Col: Mã mẫu */}
                                                    <td className="px-4 py-3 align-top" style={{ minWidth: 140 }}>
                                                        <div className="font-semibold text-sm text-foreground">{sample.sampleId}</div>
                                                        <div className="text-xs text-muted-foreground">{(sample as any).sampleName || sample.sampleTypeName || ""}</div>
                                                    </td>

                                                    {/* Col: Phiếu kết quả */}
                                                    <td className="px-4 py-3 align-top" style={{ minWidth: 180 }}>
                                                        {certDoc ? (
                                                            <DocChip doc={certDoc} onPreview={(id, title) => setPreviewDoc({ id, title })} />
                                                        ) : (
                                                            <span className="text-[11px] text-muted-foreground italic">Chưa có PKKQ</span>
                                                        )}
                                                    </td>

                                                    {/* Col: Chỉ tiêu */}
                                                    <td className="px-4 py-3 align-top" style={{ minWidth: 160 }}>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <FlaskConical className="h-3 w-3 text-muted-foreground" />
                                                                <span className="text-sm font-medium tabular-nums">
                                                                    <span className="text-success">{stats.completed}</span>
                                                                    <span className="text-muted-foreground mx-0.5">/</span>
                                                                    <span className="text-primary">{stats.distributed}</span>
                                                                    <span className="text-muted-foreground mx-0.5">/</span>
                                                                    <span className="text-foreground">{stats.total}</span>
                                                                </span>
                                                            </div>
                                                            {stats.total > 0 && (
                                                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Col: Tài liệu tiếp nhận (first row spans all) */}
                                                    {sIdx === 0 && (
                                                        <td className="px-4 py-3 align-top" rowSpan={rowCount} style={{ minWidth: 180 }}>
                                                            {receiptDocs.length > 0 ? (
                                                                <div className="flex flex-col gap-1.5">
                                                                    {receiptDocs.map((doc: any) => (
                                                                        <DocChip key={doc.documentId} doc={doc} onPreview={(id, title) => setPreviewDoc({ id, title })} />
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground italic">Không có</span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        }) : (
                                            <tr className={`hover:bg-accent/30 ${isSelected ? "bg-accent/20" : ""}`} onClick={() => onSelectRow(rowKey, receipt.receiptId)}>
                                                <td className="px-4 py-4"><ReceiptInfoCell receipt={receipt} onView={onView} openingReceiptId={openingReceiptId} dash={dash} /></td>
                                                <td className="px-4 py-4">{getReceiptStatusBadge(receipt.receiptStatus, t)}</td>
                                                <td className="px-4 py-4"><DeadlineCell receiptDeadline={receipt.receiptDeadline} t={t} /></td>
                                                <td className="px-4 py-3 text-muted-foreground italic text-sm" colSpan={4}>Không có mẫu</td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            }

                            /* ── DEFAULT TAB ── */
                            const clientEmail = (receipt.client as any)?.clientEmail ?? null;
                            const clientAddress = (receipt.client as any)?.clientAddress ?? null;
                            const clientPhone = (receipt.client as any)?.clientPhone ?? null;
                            return (
                                <tr key={receipt.receiptId} className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""}`} onClick={() => onSelectRow(rowKey, receipt.receiptId)}>
                                    <td className="px-4 py-4"><ReceiptInfoCell receipt={receipt} onView={onView} openingReceiptId={openingReceiptId} dash={dash} /></td>
                                    <td className="px-4 py-4">
                                        <Button variant="outline" size="sm"
                                            className="gap-2 shrink-0 border-primary/20 hover:bg-primary/5 text-primary w-fit min-w-[120px] justify-start px-3 py-1.5 h-auto"
                                            onClick={(e) => { e.stopPropagation(); onOpenShipment?.(receipt.receiptId); }}
                                            disabled={openingReceiptId === receipt.receiptId}
                                        >
                                            <Truck className="h-4 w-4 shrink-0" />
                                            <div className="flex flex-col items-start text-xs text-left max-w-[150px] overflow-hidden">
                                                {trackingNo
                                                    ? <span className="font-semibold truncate w-full">{trackingNo}</span>
                                                    : !shipmentId
                                                        ? <span className="font-medium whitespace-nowrap">{String(t("reception.sampleReception.tracking.none", { defaultValue: "Tạo Vận Đơn" }))}</span>
                                                        : null}
                                                {shipmentId && <span className="font-mono opacity-60 text-[10px] truncate w-full">#{shipmentId}</span>}
                                            </div>
                                        </Button>
                                    </td>
                                    <td className="px-4 py-4"><DeadlineCell receiptDeadline={receipt.receiptDeadline} t={t} /></td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="space-y-1">
                                            <div className="text-foreground">{clientAddress ?? dash}</div>
                                            <div className="text-muted-foreground">{String(t("reception.sampleReception.contact.phoneLabel"))} {clientPhone ?? dash}</div>
                                            <div className="text-muted-foreground">{String(t("reception.sampleReception.contact.emailLabel"))} {clientEmail ?? dash}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                        <RowActionIcons onView={() => onView(receipt.receiptId)} onDelete={() => onDelete(receipt.receiptId)} showEdit={false} disabled={openingReceiptId === receipt.receiptId} />
                                    </td>
                                </tr>
                            );
                        })}

                        {items.length === 0 && (
                            <tr>
                                <td colSpan={colSpanEmpty} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                    {String(t("common.noData"))}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
