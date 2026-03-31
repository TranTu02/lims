// src/components/reception/ReceiptsTable.tsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Filter, X, Check, Truck, Clock, FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RowActionIcons } from "@/components/common/RowActionIcons";
import type { ReceiptListItem, ReceiptStatus, ReceiptSample, ReceiptAnalysis } from "@/types/receipt";

/** Extract samples array from receipt (available in processing endpoint) */
function getReceiptSamples(receipt: ReceiptListItem): ReceiptSample[] {
    const raw = (receipt as Record<string, unknown>).samples;
    if (Array.isArray(raw)) return raw as ReceiptSample[];
    return [];
}

/** Count analyses stats for a single sample */
function countAnalysesStats(sample: ReceiptSample): { distributed: number; completed: number; total: number } {
    const analyses: ReceiptAnalysis[] = (sample.analyses ?? []).filter((a) => a?.analysisId);
    const total = analyses.length;
    // distributed = analyses that have been handed over (have technicianId or status is not Pending)
    const distributed = analyses.filter((a) => a.technicianId || (a.analysisStatus && a.analysisStatus !== "Pending")).length;
    // completed = analyses with status Approved/DataEntered or have result
    const completed = analyses.filter((a) => a.analysisStatus === "Approved" || a.analysisStatus === "DataEntered" || a.analysisResult != null).length;
    return { distributed, completed, total };
}

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
};

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

function toReceiptStatusLabelKey(status: ReceiptStatus): string {
    if (status === "Draft") return "reception.receipts.status.draft";
    if (status === "Received") return "reception.receipts.status.receive";
    if (status === "Processing") return "reception.receipts.status.processing";
    if (status === "Completed") return "reception.receipts.status.completed";
    if (status === "Reported") return "reception.receipts.status.reported";
    if (status === "Cancelled") return "reception.receipts.status.cancelled";
    return "";
}

function getReceiptStatusLabel(status: string, t: (k: string, opt?: Record<string, unknown>) => unknown): string {
    const s = status as ReceiptStatus;
    const key = toReceiptStatusLabelKey(s);
    if (!key) return status; // fallback
    return String(t(key, { defaultValue: status }));
}

function getReceiptStatusBadge(status: ReceiptStatus, t: (k: string, opt?: Record<string, unknown>) => unknown) {
    const key = toReceiptStatusLabelKey(status);
    const label = key ? String(t(key, { defaultValue: status })) : String(status);

    switch (status) {
        case "Draft":
        case "Received":
            return (
                <Badge variant="outline" className="text-muted-foreground border-border">
                    {label}
                </Badge>
            );

        case "Processing":
            return (
                <Badge variant="default" className="bg-warning text-warning-foreground hover:bg-warning/90">
                    {label}
                </Badge>
            );

        case "Completed":
            return (
                <Badge variant="default" className="bg-success text-success-foreground hover:bg-success/90">
                    {label}
                </Badge>
            );

        case "Reported":
            return (
                <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {label}
                </Badge>
            );

        case "Cancelled":
            return <Badge variant="destructive">{label}</Badge>;

        default:
            return (
                <Badge variant="secondary" className="text-muted-foreground">
                    {label}
                </Badge>
            );
    }
}



export function ReceiptsTable({ items, activeTab, selectedRowKey, onSelectRow, onView, onDelete, onOpenShipment, openingReceiptId }: Props) {
    const { t } = useTranslation();
    const dash = String(t("common.noData"));

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <span className="inline-flex items-center gap-2">
                                {String(t("reception.sampleReception.receiptInfo"))}
                            </span>
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {activeTab === "processing" ? (
                                <span className="inline-flex items-center gap-2">
                                    {String(t("reception.sampleReception.table.processing.status"))}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">{String(t("reception.sampleReception.table.returnResults.tracking"))}</span>
                            )}
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{String(t("reception.sampleReception.table.processing.deadline"))}</th>

                        {activeTab === "processing" ? (
                            <>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" style={{ minWidth: 200 }}>
                                    {String(t("lab.samples.sampleId", { defaultValue: "Mẫu thử" }))}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {String(t("lab.analyses.progress", { defaultValue: "Tiến độ PT" }))}
                                </th>
                            </>
                        ) : (
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
                        const daysLeft = safeDaysLeft(receipt.receiptDeadline);

                        const r = receipt as any;
                        const trackingNo = (typeof r.shipmentTrackingNumber === "string" ? r.shipmentTrackingNumber : null);
                        const shipmentId = (typeof r.shipmentId === "string" ? r.shipmentId : null);

                        const clientEmail = (receipt.client as { clientEmail?: string | null } | null)?.clientEmail ?? null;
                        const clientAddress = (receipt.client as { clientAddress?: string | null } | null)?.clientAddress ?? null;
                        const clientPhone = (receipt.client as { clientPhone?: string | null } | null)?.clientPhone ?? null;

                        const rowKey = receipt.receiptId;
                        const isSelected = selectedRowKey === rowKey;

                        // ── Processing tab: render multi-row per receipt ─────
                        if (activeTab === "processing") {
                            const samples = getReceiptSamples(receipt);
                            const rowCount = Math.max(samples.length, 1);

                            return (
                                <React.Fragment key={receipt.receiptId}>
                                    {samples.length > 0 ? (
                                        samples.map((sample, sIdx) => {
                                            const stats = countAnalysesStats(sample);
                                            const isFirstRow = sIdx === 0;
                                            return (
                                                <tr
                                                    key={`${receipt.receiptId}-${sample.sampleId}`}
                                                    className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""} ${sIdx > 0 ? "border-t border-border/30" : ""}`}
                                                    onClick={() => onSelectRow(rowKey, receipt.receiptId)}
                                                >
                                                    {isFirstRow && (
                                                        <>
                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                <div className="space-y-1">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onView(receipt.receiptId);
                                                                        }}
                                                                        className="font-semibold text-primary hover:text-primary/80 hover:underline"
                                                                        disabled={openingReceiptId === receipt.receiptId}
                                                                    >
                                                                        {receipt.receiptCode ?? dash}
                                                                    </button>
                                                                    <div className="text-sm text-foreground">{receipt.client?.clientName ?? dash}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {parseIsoDateOnly(receipt.receiptDate, dash)} {receipt.createdBy?.identityName ? `- ${receipt.createdBy.identityName}` : ""}
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                {getReceiptStatusBadge(receipt.receiptStatus, t)}
                                                            </td>

                                                            <td className="px-4 py-4 align-top" rowSpan={rowCount}>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="font-medium text-foreground">{parseIsoDateOnly(receipt.receiptDeadline, dash)}</span>
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
                                                                        <Badge variant="outline" className="text-muted-foreground w-fit">
                                                                            {dash}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* ── Sample column (single line) ── */}
                                                    <td className="px-4 py-3" style={{ minWidth: 200 }}>
                                                        <span className="text-sm">
                                                            <span className="font-semibold text-foreground">{sample.sampleId}</span>{" "}
                                                            <span className="text-muted-foreground">{(sample as any).sampleName || sample.sampleTypeName || ""}</span>
                                                        </span>
                                                    </td>

                                                    {/* ── Analyses progress column: completed / distributed / total ── */}
                                                    <td className="px-4 py-3">
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
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        /* No samples – single row */
                                        <tr className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""}`} onClick={() => onSelectRow(rowKey, receipt.receiptId)}>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onView(receipt.receiptId);
                                                        }}
                                                        className="font-semibold text-primary hover:text-primary/80 hover:underline"
                                                        disabled={openingReceiptId === receipt.receiptId}
                                                    >
                                                        {receipt.receiptCode ?? dash}
                                                    </button>
                                                    <div className="text-sm text-foreground">{receipt.client?.clientName ?? dash}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {parseIsoDateOnly(receipt.receiptDate, dash)} {receipt.createdBy?.identityName ? `- ${receipt.createdBy.identityName}` : ""}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">{getReceiptStatusBadge(receipt.receiptStatus, t)}</td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-medium text-foreground">{parseIsoDateOnly(receipt.receiptDeadline, dash)}</span>
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
                                                        <Badge variant="outline" className="text-muted-foreground w-fit">
                                                            {dash}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">-</td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        }

                        // ── Other tabs: Original single-row layout ──────────────────
                        return (
                            <tr key={receipt.receiptId} className={`hover:bg-accent/30 transition-colors ${isSelected ? "bg-accent/20" : ""}`} onClick={() => onSelectRow(rowKey, receipt.receiptId)}>
                                <td className="px-4 py-4">
                                    <div className="space-y-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onView(receipt.receiptId);
                                            }}
                                            className="font-semibold text-primary hover:text-primary/80 hover:underline"
                                            disabled={openingReceiptId === receipt.receiptId}
                                        >
                                            {receipt.receiptCode ?? dash}
                                        </button>
                                        <div className="text-sm text-foreground">{receipt.client?.clientName ?? dash}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {parseIsoDateOnly(receipt.receiptDate, dash)} {receipt.createdBy?.identityName ? `- ${receipt.createdBy.identityName}` : ""}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="gap-2 shrink-0 border-primary/20 hover:bg-primary/5 text-primary w-fit min-w-[120px] justify-start px-3 py-1.5 h-auto" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenShipment?.(receipt.receiptId);
                                        }}
                                        disabled={openingReceiptId === receipt.receiptId}
                                    >
                                        <Truck className="h-4 w-4 shrink-0 mt-0.5" />
                                        <div className="flex flex-col items-start text-xs text-left max-w-[150px] overflow-hidden">
                                            {trackingNo ? (
                                                <span className="font-semibold truncate w-full" title={trackingNo || undefined}>{trackingNo}</span>
                                            ) : !shipmentId ? (
                                                <span className="font-medium whitespace-nowrap">{String(t("reception.sampleReception.tracking.none", { defaultValue: "Tạo Vận Đơn" }))}</span>
                                            ) : null}
                                            
                                            {shipmentId && (
                                                <span className="font-mono opacity-60 text-[10px] truncate w-full" title={shipmentId || undefined}>
                                                    #{shipmentId}
                                                </span>
                                            )}
                                        </div>
                                    </Button>
                                </td>

                                <td className="px-4 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-medium text-foreground">{parseIsoDateOnly(receipt.receiptDeadline, dash)}</span>
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
                                            <Badge variant="outline" className="text-muted-foreground w-fit">
                                                {dash}
                                            </Badge>
                                        )}
                                    </div>
                                </td>

                                <td className="px-4 py-4 text-sm">
                                    <div className="space-y-1">
                                        <div className="text-foreground">{clientAddress ?? dash}</div>
                                        <div className="text-muted-foreground">
                                            {String(t("reception.sampleReception.contact.phoneLabel"))} {clientPhone ?? dash}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {String(t("reception.sampleReception.contact.emailLabel"))} {clientEmail ?? dash}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                    <RowActionIcons
                                        onView={() => onView(receipt.receiptId)}
                                        onDelete={() => onDelete(receipt.receiptId)}
                                        showEdit={false}
                                        disabled={openingReceiptId === receipt.receiptId}
                                    />
                                </td>
                            </tr>
                        );
                    })}

                    {items.length === 0 ? (
                        <tr>
                            <td colSpan={activeTab === "processing" ? 5 : 5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                {String(t("common.noData"))}
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}
