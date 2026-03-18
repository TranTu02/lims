// src/components/reception/IncomingRequestsTable.tsx
// Bảng hiển thị danh sách Yêu cầu tiếp nhận từ bên ngoài (crm.incomingRequests)

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Zap, Eye, Package, FlaskConical, Filter, X } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import type { IncomingRequestListItem } from "@/types/incomingRequest";
import type { OrderSampleItem } from "@/types/crm";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Đếm tổng số mẫu từ mảng JSONB samples */
export function countSamples(samples?: OrderSampleItem[] | null): number {
    if (!Array.isArray(samples)) return 0;
    return samples.length;
}

/** Đếm tổng số chỉ tiêu từ mảng JSONB samples → analyses */
export function countAnalyses(samples?: OrderSampleItem[] | null): number {
    if (!Array.isArray(samples)) return 0;
    return samples.reduce((sum, s) => sum + (Array.isArray(s.analyses) ? s.analyses.length : 0), 0);
}

// ── Status Badge Helpers ─────────────────────────────────────────────────────

export function getOrderStatusBadge(status: string | null | undefined, t: (k: string, opts?: Record<string, unknown>) => unknown) {
    switch (status) {
        case "Pending":
            return (
                <Badge variant="outline" className="text-xs">
                    {String(t("crm.orders.orderStatus.Pending", { defaultValue: "Chờ xử lý" }))}
                </Badge>
            );
        case "Processing":
            return <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">{String(t("crm.orders.orderStatus.Processing", { defaultValue: "Đang xử lý" }))}</Badge>;
        case "Completed":
            return <Badge className="bg-success/15 text-success border-success/30 text-xs">{String(t("crm.orders.orderStatus.Completed", { defaultValue: "Hoàn thành" }))}</Badge>;
        case "Cancelled":
            return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">{String(t("crm.orders.orderStatus.Cancelled", { defaultValue: "Hủy bỏ" }))}</Badge>;
        default:
            if (!status || status === "-") return null;
            return (
                <Badge variant="secondary" className="text-xs">
                    {status}
                </Badge>
            );
    }
}

export function getPaymentStatusBadge(status: string | null | undefined, t: (k: string, opts?: Record<string, unknown>) => unknown) {
    switch (status) {
        case "Unpaid":
            return (
                <Badge variant="outline" className="border-destructive/40 text-destructive text-xs">
                    {String(t("crm.orders.paymentStatus.Unpaid", { defaultValue: "Chưa TT" }))}
                </Badge>
            );
        case "Partial":
        case "Partially":
            return <Badge className="bg-warning/15 text-warning border-warning/30 text-xs">{String(t("crm.orders.paymentStatus.Partial", { defaultValue: "TT một phần" }))}</Badge>;
        case "Paid":
            return <Badge className="bg-success/15 text-success border-success/30 text-xs">{String(t("crm.orders.paymentStatus.Paid", { defaultValue: "Đã TT" }))}</Badge>;
        case "Variance":
            return <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">{String(t("crm.orders.paymentStatus.Variance", { defaultValue: "Chênh lệch" }))}</Badge>;
        case "Debt":
            return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">{String(t("crm.orders.paymentStatus.Debt", { defaultValue: "Công nợ" }))}</Badge>;
        default:
            if (!status) return null;
            return (
                <Badge variant="secondary" className="text-xs">
                    {status}
                </Badge>
            );
    }
}

export function getIncomingStatusBadge(status: string | null | undefined, t: (k: string, opts?: Record<string, unknown>) => unknown) {
    switch (status) {
        case "New":
            return <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">{String(t("reception.incomingRequests.status.New", { defaultValue: "Mới" }))}</Badge>;
        case "Processing":
            return <Badge className="bg-warning/15 text-warning border-warning/30 text-xs">{String(t("reception.incomingRequests.status.Processing", { defaultValue: "Đang xử lý" }))}</Badge>;
        case "Converted":
            return <Badge className="bg-success/15 text-success border-success/30 text-xs">{String(t("reception.incomingRequests.status.Converted", { defaultValue: "Đã chuyển" }))}</Badge>;
        case "Rejected":
            return <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-xs">{String(t("reception.incomingRequests.status.Rejected", { defaultValue: "Từ chối" }))}</Badge>;
        default:
            return (
                <Badge variant="secondary" className="text-xs">
                    {status ?? "-"}
                </Badge>
            );
    }
}

// ── Props ────────────────────────────────────────────────────────────────────
interface IncomingRequestsTableProps {
    items: IncomingRequestListItem[];
    isLoading?: boolean;
    filters?: { receiptId: string[]; paymentStatus: string[] };
    onFiltersChange?: (next: { receiptId: string[]; paymentStatus: string[] }) => void;
    onConvert: (item: IncomingRequestListItem) => void;
    onViewDetail?: (requestId: string) => void;
    onViewReceipt?: (receiptId: string) => void;
}

// ── Simple Filter Popover ────────────────────────────────────────────────────
interface SimpleFilterPopoverProps {
    title: string;
    options: { label: string; value: string }[];
    selected: string[];
    onApply: (values: string[]) => void;
    onClear: () => void;
}

function SimpleFilterPopover({ title, options, selected, onApply, onClear }: SimpleFilterPopoverProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [localSelected, setLocalSelected] = useState<string[]>(selected);

    const toggle = (v: string) => {
        setLocalSelected((cur) => cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v]);
    };

    const apply = () => { onApply(localSelected); setOpen(false); };
    const clear = () => { onClear(); setLocalSelected([]); setOpen(false); };

    return (
        <Popover open={open} onOpenChange={(v) => { setOpen(v); if(v) setLocalSelected(selected); }}>
            <PopoverTrigger asChild>
                <button type="button" className="relative group/filter hover:bg-muted p-1 rounded-md cursor-pointer transition-colors" onClick={(e) => e.stopPropagation()}>
                    <Filter className="h-3.5 w-3.5 text-muted-foreground group-hover/filter:text-foreground" />
                    {selected.length > 0 && <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-0" onClick={(e) => e.stopPropagation()}>
                <div className="p-2 border-b text-sm font-medium flex items-center justify-between">
                    <span>{title}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}><X className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                    {options.map((opt) => {
                        const isChecked = localSelected.includes(opt.value);
                        return (
                            <div key={opt.value} className="flex items-center gap-3 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors" onClick={() => toggle(opt.value)}>
                                <Checkbox checked={isChecked} onCheckedChange={() => toggle(opt.value)} className="pointer-events-none" />
                                <span className="text-sm font-medium leading-none">{opt.label}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="p-2 border-t flex flex-col gap-2 bg-muted/20">
                    <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={clear}>{String(t("common.clear", { defaultValue: "Xóa" }))}</Button>
                    <Button variant="default" size="sm" className="w-full text-xs h-7" onClick={apply}>{String(t("common.apply", { defaultValue: "Áp dụng" }))}</Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ── Main Table ───────────────────────────────────────────────────────────────
export function IncomingRequestsTable({ items, isLoading, filters, onFiltersChange, onConvert, onViewDetail, onViewReceipt }: IncomingRequestsTableProps) {
    const { t } = useTranslation();

    const columns = useMemo(
        () => [
            { key: "requestId", label: String(t("reception.incomingRequests.columns.requestId", { defaultValue: "Mã yêu cầu" })), width: "12%" },
            { key: "client", label: String(t("reception.incomingRequests.columns.clientName", { defaultValue: "Khách hàng" })), width: "18%" },
            { key: "salePerson", label: String(t("reception.incomingRequests.columns.salePerson", { defaultValue: "NVKD" })), width: "12%" },
            { key: "incomingStatus", label: String(t("reception.incomingRequests.columns.incomingStatus", { defaultValue: "Tình trạng" })), width: "10%" },
            { key: "orderStatus", label: String(t("reception.incomingRequests.columns.orderStatus", { defaultValue: "Đơn hàng" })), width: "10%" },
            { 
                key: "paymentStatus", 
                label: (
                    <div className="flex items-center gap-1">
                        {String(t("reception.incomingRequests.columns.paymentStatus", { defaultValue: "Thanh toán" }))}
                        <SimpleFilterPopover
                            title={String(t("reception.incomingRequests.columns.paymentStatus", { defaultValue: "Thanh toán" }))}
                            options={[
                                { label: String(t("crm.orders.paymentStatus.Unpaid", { defaultValue: "Chưa TT" })), value: "Unpaid" },
                                { label: String(t("crm.orders.paymentStatus.Partial", { defaultValue: "TT một phần" })), value: "Partial" },
                                { label: String(t("crm.orders.paymentStatus.Paid", { defaultValue: "Đã TT" })), value: "Paid" },
                                { label: String(t("crm.orders.paymentStatus.Variance", { defaultValue: "Chênh lệch" })), value: "Variance" },
                                { label: String(t("crm.orders.paymentStatus.Debt", { defaultValue: "Công nợ" })), value: "Debt" },
                            ]}
                            selected={filters?.paymentStatus ?? []}
                            onApply={(v) => { if (onFiltersChange) onFiltersChange({ ...(filters ?? { receiptId: [], paymentStatus: [] }), paymentStatus: v }); }}
                            onClear={() => { if (onFiltersChange) onFiltersChange({ ...(filters ?? { receiptId: [], paymentStatus: [] }), paymentStatus: [] }); }}
                        />
                    </div>
                ),
                width: "12%" 
            },
            { key: "samples", label: String(t("reception.incomingRequests.columns.sampleCount", { defaultValue: "Mẫu" })), width: "7%" },
            { key: "analyses", label: String(t("reception.incomingRequests.columns.analysisCount", { defaultValue: "Chỉ tiêu" })), width: "7%" },
            { 
                key: "actions", 
                label: (
                    <div className="flex items-center gap-1">
                        {String(t("common.actions", { defaultValue: "Thao tác" }))}
                        <SimpleFilterPopover
                            title={String(t("common.actions", { defaultValue: "Thao tác" }))}
                            options={[
                                { label: "Đã tạo phiếu", value: "IS NOT NULL" },
                                { label: "Chưa tạo phiếu", value: "IS NULL" },
                            ]}
                            selected={filters?.receiptId ?? []}
                            onApply={(v) => { if (onFiltersChange) onFiltersChange({ ...(filters ?? { receiptId: [], paymentStatus: [] }), receiptId: v }); }}
                            onClear={() => { if (onFiltersChange) onFiltersChange({ ...(filters ?? { receiptId: [], paymentStatus: [] }), receiptId: [] }); }}
                        />
                    </div>
                ),
                width: "12%" 
            },
        ],
        [t, filters, onFiltersChange],
    );

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-3 p-4">
                <div className="h-4 w-44 bg-muted rounded" />
                <div className="h-9 w-full bg-muted rounded" />
                <div className="h-40 w-full bg-muted rounded" />
            </div>
        );
    }



    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={{ width: col.width }} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {items.map((item) => {
                        const sCount = countSamples(item.samples);
                        const aCount = countAnalyses(item.samples);
                        const isConverted = item.incomingStatus === "Converted" || Boolean(item.receiptId);

                        return (
                            <tr
                                key={item.requestId}
                                className={`hover:bg-muted/30 transition-colors cursor-pointer ${isConverted ? "opacity-60" : ""}`}
                                onClick={() => {
                                    if (onViewDetail) onViewDetail(item.requestId);
                                }}
                            >
                                {/* Mã yêu cầu */}
                                <td className="px-3 py-2.5">
                                    <div className="font-medium text-foreground text-xs">{item.requestId ?? "-"}</div>
                                </td>

                                {/* Khách hàng */}
                                <td className="px-3 py-2.5">
                                    <div className="text-xs text-foreground line-clamp-1">{item.client?.clientName ?? item.senderInfo?.senderName ?? "-"}</div>
                                    {item.client?.clientPhone || item.senderInfo?.senderPhone ? (
                                        <div className="text-[10px] text-muted-foreground mt-0.5">{item.client?.clientPhone ?? item.senderInfo?.senderPhone}</div>
                                    ) : null}
                                </td>

                                {/* NVKD */}
                                <td className="px-3 py-2.5 text-xs text-foreground">{item.salePerson ?? "-"}</td>

                                {/* Tình trạng */}
                                <td className="px-3 py-2.5">{getIncomingStatusBadge(item.incomingStatus, t)}</td>

                                {/* Đơn hàng */}
                                <td className="px-3 py-2.5 min-w-[120px]">
                                    {item.orderId ? <div className="font-semibold text-xs text-foreground mb-1 whitespace-nowrap">{item.orderId}</div> : null}
                                    {getOrderStatusBadge(item.orderStatus, t)}
                                </td>

                                {/* Thanh toán */}
                                <td className="px-3 py-2.5">{getPaymentStatusBadge(item.paymentStatus, t)}</td>

                                {/* Số mẫu */}
                                <td className="px-3 py-2.5 text-center">
                                    <Badge variant="outline" className="text-[11px] px-1.5 gap-0.5">
                                        <Package className="h-3 w-3" />
                                        {sCount}
                                    </Badge>
                                </td>

                                {/* Số chỉ tiêu */}
                                <td className="px-3 py-2.5 text-center">
                                    <Badge variant="outline" className="text-[11px] px-1.5 gap-0.5">
                                        <FlaskConical className="h-3 w-3" />
                                        {aCount}
                                    </Badge>
                                </td>

                                {/* Thao tác */}
                                <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onViewDetail) onViewDetail(item.requestId);
                                            }}
                                            title={String(t("common.viewDetail", { defaultValue: "Xem chi tiết" }))}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>

                                        {!isConverted && sCount > 0 ? (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="h-7 gap-1 text-xs px-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onConvert(item);
                                                }}
                                                title={String(t("reception.incomingRequests.fastConvert", { defaultValue: "Tạo phiếu nhanh" }))}
                                            >
                                                <Zap className="h-3 w-3" />
                                                {String(t("reception.incomingRequests.fastConvert", { defaultValue: "Tạo phiếu nhanh" }))}
                                            </Button>
                                        ) : item.receiptId ? (
                                            <button
                                                className="font-medium text-primary hover:underline text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onViewReceipt) onViewReceipt(item.receiptId!);
                                                }}
                                            >
                                                {item.receiptId}
                                            </button>
                                        ) : isConverted ? (
                                            <Badge className="bg-success/10 text-success border-success/20 text-[10px]">
                                                {String(t("reception.incomingRequests.status.Converted", { defaultValue: "Đã chuyển" }))}
                                            </Badge>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className="py-16 text-center text-muted-foreground">
                                <div className="flex flex-col items-center justify-center">
                                    <Package className="h-10 w-10 mb-3 opacity-40" />
                                    <span className="text-sm">{String(t("reception.incomingRequests.emptyState", { defaultValue: "Chưa có yêu cầu tiếp nhận nào" }))}</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
