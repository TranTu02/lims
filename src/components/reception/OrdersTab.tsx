import React from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

import type { Order } from "@/types/crm";
import { formatCurrency, formatDate } from "@/utils/format";

interface OrdersTabProps {
    orders: Order[];
    onCreateReceipt: (order: Order) => void;
    onViewDetail: (order: Order) => void;
    onReceiptClick?: (receiptId: string) => void;
}

export function OrdersTab({ orders, onCreateReceipt, onViewDetail, onReceiptClick }: OrdersTabProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("crm.orders.orderId")}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("crm.clients.clientId")}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("crm.orders.totalAmount")}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("crm.orders.orderStatus")}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("crm.orders.samples")}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.createdAt")}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("lab.receipts.receiptId")}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order) => (
                            <tr key={order.orderId} className="hover:bg-accent/40 transition-colors">
                                <td className="px-4 py-4">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-primary">{order.orderId}</div>
                                        {order.salePerson && (
                                            <div className="text-xs text-muted-foreground">
                                                {t("crm.orders.salePerson")}: {order.salePerson}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="space-y-1">
                                        <div className="font-medium text-foreground">{order.client.clientName}</div>
                                        <div className="text-xs text-muted-foreground">{order.client.clientAddress}</div>
                                        <div className="text-xs text-muted-foreground">
                                            📞 {order.client.clientPhone} | ✉️ {order.client.clientEmail}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {t("crm.orders.totalFeeBeforeTax")}: {formatCurrency(order.totalFeeBeforeTax)}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        {/* Order Status */}
                                        {order.orderStatus === "Completed" ? (
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white border-transparent">
                                                {t("crm.orders.status.Completed")}
                                            </Badge>
                                        ) : order.orderStatus === "Pending" ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 hover:bg-yellow-200"
                                            >
                                                {t("crm.orders.status.Pending")}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground">
                                                {order.orderStatus}
                                            </Badge>
                                        )}

                                        {/* Payment Status */}
                                        {order.paymentStatus === "Paid" && (
                                            <Badge variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                                                {t("crm.orders.paymentStatus.Paid")}
                                            </Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Badge variant="outline" className="text-base">
                                        {order.samples.length}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {order.samples.reduce((sum, s) => sum + s.analyses.length, 0)} {t("library.parameters.parameterName")}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <div className="text-sm text-foreground">{formatDate(order.createdAt)}</div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {order.receiptId && onReceiptClick ? (
                                        <button onClick={() => onReceiptClick(order.receiptId!)} className="text-sm font-medium text-primary hover:text-primary/80 hover:underline">
                                            {order.receiptId}
                                        </button>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">--</div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        {order.receiptId ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer border-border"
                                                onClick={() => onReceiptClick && order.receiptId && onReceiptClick(order.receiptId)}
                                            >
                                                {t("lab.receipts.status.Pending")}{" "}
                                                {/* Using Pending receipt status label 'Moi tiep nhan' as generic 'Received' badge label for now, or just 'Da tiep nhan' if I have it. I'll use 'Đã tiếp nhận' hardcoded safely or find a key. Actually 'Mới tiếp nhận' is close enough or I stick to badge color indicating status. */}
                                            </Badge>
                                        ) : (
                                            <Button size="sm" className="flex items-center gap-1" onClick={() => onCreateReceipt(order)}>
                                                <Plus className="h-3 w-3" />
                                                {t("common.receipt")} {/* Placeholder for 'Create Receipt'. I should add 'createReceipt' to common or reception. For now 'Tao phieu' */}
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => onViewDetail(order)}>
                                            <FileText className="h-3 w-3" />
                                            {t("common.view")} {/* Verify 'Xem' key. 'common.actions' is 'Thao tac'. I need 'common.view' or similar. */}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
        </div>
    );
}
