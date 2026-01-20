import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

import type { Order } from "@/types/crm";

interface OrdersTabProps {
    orders: Order[];
    onCreateReceipt: (order: Order) => void;
    onViewDetail: (order: Order) => void;
    onReceiptClick?: (receiptId: string) => void;
}

export function OrdersTab({ orders, onCreateReceipt, onViewDetail, onReceiptClick }: OrdersTabProps) {
    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    return (
        <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn hàng</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Số mẫu</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mã tiếp nhận</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map((order) => (
                            <tr key={order.orderId} className="hover:bg-gray-50">
                                <td className="px-4 py-4">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-blue-600">{order.orderId}</div>
                                        {order.salePerson && <div className="text-xs text-gray-500">Sale: {order.salePerson}</div>}
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="space-y-1">
                                        <div className="font-medium text-gray-900">{order.client.clientName}</div>
                                        <div className="text-xs text-gray-600">{order.client.clientAddress}</div>
                                        <div className="text-xs text-gray-500">
                                            📞 {order.client.clientPhone} | ✉️ {order.client.clientEmail}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="space-y-1">
                                        <div className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                                        <div className="text-xs text-gray-500">Trước thuế: {formatCurrency(order.totalFeeBeforeTax)}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        {order.orderStatus === "Completed" ? (
                                            <Badge variant="default" className="bg-green-500">
                                                Đã xác nhận
                                            </Badge>
                                        ) : order.orderStatus === "Pending" ? (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                Chờ xử lý
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">{order.orderStatus}</Badge>
                                        )}
                                        {order.paymentStatus === "Paid" && (
                                            <Badge variant="default" className="bg-blue-500 text-xs">
                                                Đã thanh toán
                                            </Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <Badge variant="outline" className="text-base">
                                        {order.samples.length}
                                    </Badge>
                                    <div className="text-xs text-gray-500 mt-1">{order.samples.reduce((sum, s) => sum + s.analyses.length, 0)} chỉ tiêu</div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    {order.receiptId && onReceiptClick ? (
                                        <button onClick={() => onReceiptClick(order.receiptId!)} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                            {order.receiptId}
                                        </button>
                                    ) : (
                                        <div className="text-sm text-gray-400">Chưa có</div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        {order.receiptId ? (
                                            <Badge variant="default" className="bg-gray-500" onClick={() => onReceiptClick && order.receiptId && onReceiptClick(order.receiptId)}>
                                                Đã tiếp nhận
                                            </Badge>
                                        ) : (
                                            <Button size="sm" variant="default" className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700" onClick={() => onCreateReceipt(order)}>
                                                <Plus className="h-3 w-3" />
                                                Tạo tiếp nhận
                                            </Button>
                                        )}
                                        <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => onViewDetail(order)}>
                                            <FileText className="h-3 w-3" />
                                            Xem
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
