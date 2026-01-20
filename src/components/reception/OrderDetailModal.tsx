import React from "react";
import { X, Calendar, User, Package, FileText, Phone, Mail, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/crm";

interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
    onCreateReceipt: (order: Order) => void;
}

export function OrderDetailModal({ order, onClose, onCreateReceipt }: OrderDetailModalProps) {
    const formatCurrency = (amount: string | number | undefined) => {
        if (amount === undefined) return "0 ₫";
        const num = typeof amount === "string" ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold">Chi tiết đơn hàng</h2>
                        <Badge variant="outline" className="text-base">
                            {order.orderId}
                        </Badge>
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
                            <Badge variant="default" className="bg-blue-500">
                                Đã thanh toán
                            </Badge>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Customer & Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Customer Info */}
                        <div className="border rounded-lg p-4">
                            <h3 className="font-semibold text-sm mb-3 text-gray-700">Thông tin khách hàng</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Tên công ty:</span>
                                    <div className="font-medium text-gray-900">{order.client?.clientName}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">Mã số thuế:</span>
                                    <div className="font-medium text-gray-900">{order.client?.legalId}</div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div className="text-gray-700">{order.client?.clientAddress}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <div className="text-gray-700">{order.client?.clientPhone}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <div className="text-gray-700">{order.client?.clientEmail}</div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Person Info */}
                        <div className="border rounded-lg p-4">
                            <h3 className="font-semibold text-sm mb-3 text-gray-700">Người liên hệ</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-500">Họ tên:</span>
                                    <div className="font-medium text-gray-900">{order.contactPerson?.contactName}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <div className="text-gray-700">{order.contactPerson?.contactPhone}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <div className="text-gray-700">{order.contactPerson?.contactEmail}</div>
                                </div>
                                {order.salePerson && (
                                    <div className="mt-3 pt-3 border-t">
                                        <span className="text-gray-500">Sale phụ trách:</span>
                                        <div className="font-medium text-gray-900">{order.salePerson}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Info */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-sm mb-3 text-gray-700">Thông tin đơn hàng</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Ngày tạo:</span>
                                <div className="font-medium text-gray-900">{formatDate(order.createdAt as string)}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Số mẫu:</span>
                                <div className="font-medium text-gray-900">{order.samples.length}</div>
                            </div>
                            <div>
                                <span className="text-gray-500">Tổng chỉ tiêu:</span>
                                <div className="font-medium text-gray-900">{order.samples.reduce((sum, s) => sum + s.analyses.length, 0)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Samples & Analyses */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                            <h3 className="font-semibold text-sm text-gray-700">Danh sách mẫu & chỉ tiêu</h3>
                        </div>
                        <div className="divide-y">
                            {order.samples.map((sample, sampleIndex) => (
                                <div key={sampleIndex} className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-blue-600" />
                                                <span className="font-semibold text-gray-900">
                                                    Mẫu #{sampleIndex + 1}: {sample.sampleName}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 ml-6">{sample.sampleTypeName}</div>
                                        </div>
                                        <Badge variant="outline" className="text-base">
                                            {sample.analyses.length} chỉ tiêu
                                        </Badge>
                                    </div>

                                    {/* Analysis Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 border-y">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">STT</th>
                                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Tên chỉ tiêu</th>
                                                    <th className="px-3 py-2 text-left text-gray-600 font-medium">Phương pháp</th>
                                                    <th className="px-3 py-2 text-center text-gray-600 font-medium">SL</th>
                                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Đơn giá</th>
                                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Thuế (%)</th>
                                                    <th className="px-3 py-2 text-right text-gray-600 font-medium">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {sample.analyses.map((analysis, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2 text-gray-600">{idx + 1}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="font-medium text-gray-900">{analysis.parameterName}</div>
                                                            <div className="text-gray-500">ID: {analysis.parameterId}</div>
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-700">{analysis.protocolCode || "-"}</td>
                                                        <td className="px-3 py-2 text-center text-gray-900">{analysis.quantity || 1}</td>
                                                        <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(analysis.unitPrice)}</td>
                                                        <td className="px-3 py-2 text-right text-gray-900">{analysis.taxRate}%</td>
                                                        <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(analysis.feeAfterTax)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Attached Files/Documents */}
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                            <h3 className="font-semibold text-sm text-gray-700">Tài liệu tiếp nhận</h3>
                        </div>
                        <div className="p-4">
                            <div className="text-sm text-gray-500 text-center py-3">Chưa có tài liệu đính kèm</div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-semibold text-sm mb-3 text-gray-700">Tổng kết thanh toán</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tổng trước thuế:</span>
                                <span className="font-medium text-gray-900">{formatCurrency(order.totalFeeBeforeTax)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Thuế VAT:</span>
                                <span className="font-medium text-gray-900">{formatCurrency(order.totalTaxValue)}</span>
                            </div>
                            {order.totalDiscountValue > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Giảm giá:</span>
                                    <span className="font-medium">-{formatCurrency(order.totalDiscountValue)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-gray-300">
                                <span className="font-semibold text-gray-900">Tổng cộng:</span>
                                <span className="font-bold text-lg text-blue-600">{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Đóng
                    </Button>
                    {!order.receiptId && (
                        <Button
                            variant="default"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                                onCreateReceipt(order);
                                onClose();
                            }}
                        >
                            Tạo phiếu tiếp nhận
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
