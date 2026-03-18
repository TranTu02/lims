import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ordersGetFull } from "@/api/crm/orders";
import { incomingRequestsCreate, incomingRequestsKeys } from "@/api/incomingRequests";
import { 
    countSamples, 
    countAnalyses, 
    getOrderStatusBadge, 
    getPaymentStatusBadge 
} from "@/components/reception/IncomingRequestsTable";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function parseIsoDateOnly(iso?: string | null, fallback = "--"): string {
    if (!iso) return fallback;
    const t = iso.split("T")[0];
    return t ? t : fallback;
}

interface CreateIncomingRequestFromOrderModalProps {
    open: boolean;
    onClose: () => void;
}

export function CreateIncomingRequestFromOrderModal({ open, onClose }: CreateIncomingRequestFromOrderModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const [orderCode, setOrderCode] = useState("");
    const [fetching, setFetching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fetchedOrder, setFetchedOrder] = useState<any | null>(null);

    // Reset state when opened
    useEffect(() => {
        if (open) {
            setOrderCode("");
            setFetchedOrder(null);
            setFetching(false);
            setSubmitting(false);
        }
    }, [open]);

    if (!open) return null;

    const handleFetchOrder = async () => {
        const q = orderCode.trim();
        if (!q) return;

        setFetching(true);
        setFetchedOrder(null);
        try {
            const res = await ordersGetFull({ params: { orderId: q } });
            const orderInfo = ((res as any).data ?? res) as any;

            if (orderInfo) {
                setFetchedOrder(orderInfo);
            }
        } catch (error) {
            toast.error(String(t("common.toast.requestFailed", { defaultValue: "Lỗi kết nối hoặc không tìm thấy đơn hàng." })));
        } finally {
            setFetching(false);
        }
    };

    const handleCreate = async () => {
        if (!fetchedOrder) return;

        setSubmitting(true);
        try {
            // Map the fetched order fields to incomingRequests creation body.
            // Just copying the order fields that matter since it's a clone.
            const body = {
                orderId: fetchedOrder.orderId,
                client: fetchedOrder.client,
                clientId: fetchedOrder.clientId,
                contactPerson: fetchedOrder.contactPerson,
                senderInfo: {
                    senderName: fetchedOrder.client?.clientName,
                    senderPhone: fetchedOrder.contactPerson?.contactPhone,
                    senderEmail: fetchedOrder.contactPerson?.contactEmail,
                    senderAddress: fetchedOrder.client?.clientAddress,
                },
                requestContent: fetchedOrder.notes ?? "",
                salePersonId: fetchedOrder.salePersonId,
                salePerson: fetchedOrder.salePerson,
                samples: fetchedOrder.samples ?? [],
                totalAmount: fetchedOrder.totalAmount,
                totalFeeBeforeTax: fetchedOrder.totalFeeBeforeTax,
                totalFeeBeforeTaxAndDiscount: fetchedOrder.totalFeeBeforeTaxAndDiscount,
                totalTaxValue: fetchedOrder.totalTaxValue,
                totalDiscountValue: fetchedOrder.totalDiscountValue,
                taxRate: fetchedOrder.taxRate,
                discountRate: fetchedOrder.discountRate,
                orderStatus: fetchedOrder.orderStatus,
                paymentStatus: fetchedOrder.paymentStatus,
                receiptId: fetchedOrder.receiptId, // if it exists
                incomingStatus: "New", // Default to new
            };

            const res = await incomingRequestsCreate({ body });

            if (!(res as any).success && "success" in res && (res as any).success === false) {
                throw new Error((res as any).error?.message || "Failed");
            }

            toast.success(String(t("reception.incomingRequests.createSuccess", { defaultValue: "Tạo yêu cầu tiếp nhận thành công" })));
            await queryClient.invalidateQueries({ queryKey: incomingRequestsKeys.all });
            onClose();
        } catch (error) {
            toast.error(String(t("reception.incomingRequests.createError", { defaultValue: "Tạo yêu cầu thất bại" })));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border text-foreground bg-muted/30">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">{String(t("reception.incomingRequests.createFromOrder", { defaultValue: "Tạo yêu cầu từ đơn hàng" }))}</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4 text-foreground">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">{String(t("crm.orders.orderId", { defaultValue: "Mã / Số tham chiếu đơn hàng" }))}</label>
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="ORD-..."
                                value={orderCode}
                                onChange={(e) => setOrderCode(e.target.value)}
                                className="flex-1 h-9"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleFetchOrder();
                                }}
                            />
                            <Button variant="secondary" size="sm" onClick={handleFetchOrder} disabled={fetching || !orderCode.trim()} className="h-9">
                                {fetching ? <span className="animate-spin mr-2 border-2 border-current border-t-transparent rounded-full h-4 w-4" /> : <Search className="h-4 w-4 mr-2" />}
                                {String(t("common.search", { defaultValue: "Tìm kiếm" }))}
                            </Button>
                        </div>
                    </div>

                    {fetchedOrder && (
                        <div className="mt-4 border border-border rounded-lg overflow-hidden bg-card">
                            <div className="bg-muted/40 p-3 border-b border-border flex items-center justify-between">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                                    <FileText className="h-4 w-4" />
                                    {fetchedOrder.orderId ?? fetchedOrder.orderCode ?? "Thông tin đơn hàng"}
                                </h3>
                                <div className="flex gap-2">
                                    {getOrderStatusBadge(fetchedOrder.orderStatus, t)}
                                    {getPaymentStatusBadge(fetchedOrder.paymentStatus, t)}
                                </div>
                            </div>

                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Khách hàng</p>
                                        <p className="font-medium text-foreground leading-tight">{fetchedOrder.client?.clientName || fetchedOrder.clientId || "-"}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Ngày đặt</p>
                                        <p className="font-medium">{parseIsoDateOnly(fetchedOrder.orderDate ?? fetchedOrder.createdAt)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Người liên hệ</p>
                                        <p className="text-foreground">{fetchedOrder.contactPerson?.contactName || "-"}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Nhân viên kinh doanh</p>
                                        <p className="text-foreground">{fetchedOrder.salePerson ?? "-"}</p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Danh sách mẫu</p>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Badge variant="outline" className="h-5 px-1.5 font-normal">
                                                {countSamples(fetchedOrder.samples)} Mẫu
                                            </Badge>
                                            <Badge variant="outline" className="h-5 px-1.5 font-normal">
                                                {countAnalyses(fetchedOrder.samples)} Chỉ tiêu
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border bg-muted/10">
                                        {(fetchedOrder.samples ?? []).map((s: any, idx: number) => (
                                            <div key={idx} className="p-2 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="text-muted-foreground font-mono">#{idx + 1}</span>
                                                    <span className="truncate font-medium text-foreground" title={s.sampleName}>
                                                        {s.sampleName || "Mẫu không tên"}
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground shrink-0 ml-2">{(s.analyses ?? []).length} chỉ tiêu</span>
                                            </div>
                                        ))}
                                        {(!fetchedOrder.samples || fetchedOrder.samples.length === 0) && <div className="p-3 text-center text-xs text-muted-foreground italic">Không có mẫu thử</div>}
                                    </div>
                                </div>

                                {fetchedOrder.notes && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Ghi chú</p>
                                        <p className="text-xs text-foreground bg-muted p-2 rounded border border-border italic line-clamp-3">{fetchedOrder.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-muted/10 grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={onClose} className="w-full">
                        {String(t("common.cancel", { defaultValue: "Hủy bỏ" }))}
                    </Button>
                    <Button variant="default" onClick={handleCreate} disabled={!fetchedOrder || submitting} className="w-full">
                        {submitting && <span className="animate-spin mr-2 border-2 border-current border-t-transparent rounded-full h-4 w-4" />}
                        {String(t("reception.incomingRequests.create", { defaultValue: "Tạo yêu cầu" }))}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Global modal wrapper function for rendering from Custom Event
export function CreateIncomingRequestFromOrderModalWrapper() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onOpen = () => setOpen(true);
        document.addEventListener("open-create-incoming-from-order", onOpen);
        return () => document.removeEventListener("open-create-incoming-from-order", onOpen);
    }, []);

    return <CreateIncomingRequestFromOrderModal open={open} onClose={() => setOpen(false)} />;
}
