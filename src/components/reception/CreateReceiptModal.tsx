import { useState, useEffect } from "react";
import { X, Search, Plus, Copy, Trash2, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { mockOrders } from "@/types/mockdata";
import type { Order, OrderSampleItem, OrderSampleAnalysis } from "@/types/crm";

interface FormAnalysis extends OrderSampleAnalysis {
    id: string;
}

interface FormSample extends Omit<OrderSampleItem, "analyses"> {
    id: string;
    analyses: FormAnalysis[];
}

interface CreateReceiptModalProps {
    onClose: () => void;
    order?: Order | null;
}

export function CreateReceiptModal({ onClose, order }: CreateReceiptModalProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(order || null);
    const [showManualForm, setShowManualForm] = useState(false);

    // Receipt form data
    const [receiptData, setReceiptData] = useState({
        receiptCode: "",
        receivedDate: new Date().toISOString().split("T")[0],
        receivedTime: new Date().toTimeString().slice(0, 5),
        receivedBy: "",
        deadline: "",
        notes: "",
        clientInfo: {
            clientName: "",
            legalId: "",
            clientAddress: "",
            clientPhone: "",
            clientEmail: "",
            contactName: "",
            contactPhone: "",
            contactEmail: "",
        },
        samples: [] as FormSample[],
    });

    const handleSearchOrder = () => {
        const found = mockOrders.find((o) => o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || o.client.clientName?.toLowerCase().includes(searchTerm.toLowerCase()));

        if (found) {
            setSelectedOrder(found);
            mapOrderToForm(found);
        }
    };

    const mapOrderToForm = (orderToMap: Order) => {
        setReceiptData({
            ...receiptData,
            clientInfo: {
                clientName: orderToMap.client.clientName || "",
                legalId: orderToMap.client.legalId || "",
                clientAddress: orderToMap.client.clientAddress || "",
                clientPhone: orderToMap.client.clientPhone || "",
                clientEmail: orderToMap.client.clientEmail || "",
                contactName: orderToMap.contactPerson?.contactName || "",
                contactPhone: orderToMap.contactPerson?.contactPhone || "",
                contactEmail: orderToMap.contactPerson?.contactEmail || "",
            },
            samples: orderToMap.samples.map((s, i) => ({
                ...s,
                id: s.sampleId || `sample-${Date.now()}-${i}`,
                analyses: s.analyses.map((a, j) => ({
                    ...a,
                    id: `analysis-${Date.now()}-${i}-${j}`,
                })),
            })),
        });
    };

    const handleCreateWithoutOrder = () => {
        setShowManualForm(true);
        setSelectedOrder(null);
        setReceiptData({
            ...receiptData,
            clientInfo: {
                clientName: "",
                legalId: "",
                clientAddress: "",
                clientPhone: "",
                clientEmail: "",
                contactName: "",
                contactPhone: "",
                contactEmail: "",
            },
            samples: [
                {
                    id: "new-sample-1",
                    sampleName: "",
                    sampleTypeId: "",
                    sampleTypeName: "",
                    analyses: [
                        {
                            id: "new-analysis-1",
                            matrixId: "",
                            parameterId: "",
                            parameterName: "",
                            protocolCode: "",
                            feeBeforeTax: 0,
                            taxRate: 0,
                            feeAfterTax: 0,
                        },
                    ],
                },
            ],
        });
    };

    const handleDuplicateSample = (sampleIndex: number) => {
        const sampleToCopy = receiptData.samples[sampleIndex];
        const newSample: FormSample = {
            ...sampleToCopy,
            id: `new-sample-${Date.now()}`,
            analyses: sampleToCopy.analyses.map((analysis) => ({
                ...analysis,
                id: `new-analysis-${Date.now()}-${Math.random()}`,
            })),
        };

        const newSamples = [...receiptData.samples];
        newSamples.splice(sampleIndex + 1, 0, newSample);
        setReceiptData({ ...receiptData, samples: newSamples });
    };

    const handleAddAnalysis = (sampleIndex: number) => {
        const newSamples = [...receiptData.samples];
        newSamples[sampleIndex].analyses.push({
            id: `new-analysis-${Date.now()}`,
            matrixId: "",
            parameterId: "",
            parameterName: "",
            protocolCode: "",
            feeBeforeTax: 0,
            taxRate: 0,
            feeAfterTax: 0,
        });
        setReceiptData({ ...receiptData, samples: newSamples });
    };

    const handleRemoveAnalysis = (sampleIndex: number, analysisIndex: number) => {
        const newSamples = [...receiptData.samples];
        newSamples[sampleIndex].analyses.splice(analysisIndex, 1);
        setReceiptData({ ...receiptData, samples: newSamples });
    };

    const handleRemoveSample = (sampleIndex: number) => {
        const newSamples = receiptData.samples.filter((_, idx) => idx !== sampleIndex);
        setReceiptData({ ...receiptData, samples: newSamples });
    };

    const handleSave = () => {
        console.log("Saving receipt:", {
            ...receiptData,
            orderId: selectedOrder?.orderId,
        });
        onClose();
    };

    // Initialize form from order prop
    useEffect(() => {
        if (order) {
            setSelectedOrder(order);
            mapOrderToForm(order);
        }
    }, [order]);

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-4 bg-white rounded-lg shadow-xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">{selectedOrder ? "Tạo tiếp nhận mới từ đơn hàng" : "Tạo phiếu tiếp nhận mẫu"}</h2>
                        <p className="text-xs text-gray-600 mt-0.5">
                            {selectedOrder ? `Đơn hàng: ${selectedOrder.orderId} - ${selectedOrder.client.clientName}` : "Tạo phiếu tiếp nhận từ đơn hàng hoặc nhập thủ công"}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Search Order Section */}
                    {!showManualForm && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <Label className="text-sm font-medium mb-2 block">Tìm kiếm đơn hàng</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nhập mã đơn hàng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearchOrder()}
                                    className="flex-1"
                                />
                                <Button onClick={handleSearchOrder} className="flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Tìm
                                </Button>
                                <Button variant="outline" onClick={handleCreateWithoutOrder} className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Tạo không qua đơn hàng
                                </Button>
                            </div>

                            {selectedOrder && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">Đơn hàng: {selectedOrder.orderId}</p>
                                            <p className="text-xs text-blue-700 mt-1">Khách hàng: {selectedOrder.client.clientName}</p>
                                        </div>
                                        <Badge variant="default" className="bg-blue-600 text-xs">
                                            {selectedOrder.orderStatus}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Form - Split Layout */}
                    {(selectedOrder || showManualForm) && (
                        <div className="flex gap-4">
                            {/* Left: Client Info - 1/3 */}
                            <div className="w-1/3 space-y-3">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 className="h-4 w-4 text-gray-600" />
                                        <h3 className="text-sm font-semibold text-gray-900">Thông tin khách hàng</h3>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-xs text-gray-600">Tên khách hàng</Label>
                                            <Input
                                                value={receiptData.clientInfo.clientName}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, clientName: e.target.value },
                                                    })
                                                }
                                                className="mt-1 h-8 text-sm"
                                                disabled={!showManualForm}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Mã số thuế / CMND</Label>
                                            <Input
                                                value={receiptData.clientInfo.legalId}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, legalId: e.target.value },
                                                    })
                                                }
                                                className="mt-1 h-8 text-sm"
                                                disabled={!showManualForm}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Địa chỉ</Label>
                                            <Textarea
                                                value={receiptData.clientInfo.clientAddress}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, clientAddress: e.target.value },
                                                    })
                                                }
                                                className="mt-1 text-sm"
                                                rows={2}
                                                disabled={!showManualForm}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Số điện thoại</Label>
                                            <Input
                                                value={receiptData.clientInfo.clientPhone}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, clientPhone: e.target.value },
                                                    })
                                                }
                                                className="mt-1 h-8 text-sm"
                                                disabled={!showManualForm}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Email</Label>
                                            <Input
                                                value={receiptData.clientInfo.clientEmail}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, clientEmail: e.target.value },
                                                    })
                                                }
                                                className="mt-1 h-8 text-sm"
                                                disabled={!showManualForm}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="h-4 w-4 text-gray-600" />
                                        <h3 className="text-sm font-semibold text-gray-900">Người liên hệ</h3>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-xs text-gray-600">Tên người liên hệ</Label>
                                            <Input
                                                value={receiptData.clientInfo.contactName}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, contactName: e.target.value },
                                                    })
                                                }
                                                className="mt-1 h-8 text-sm"
                                                disabled={!showManualForm}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Số điện thoại</Label>
                                            <Input
                                                value={receiptData.clientInfo.contactPhone}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, contactPhone: e.target.value },
                                                    })
                                                }
                                                className="mt-1 h-8 text-sm"
                                                disabled={!showManualForm}
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Email</Label>
                                            <Input
                                                value={receiptData.clientInfo.contactEmail}
                                                onChange={(e) =>
                                                    setReceiptData({
                                                        ...receiptData,
                                                        clientInfo: { ...receiptData.clientInfo, contactEmail: e.target.value },
                                                    })
                                                }
                                                className="mt-1 h-8 text-sm"
                                                disabled={!showManualForm}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin tiếp nhận</h3>

                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <Label className="text-xs text-gray-600">Mã phiếu tiếp nhận</Label>
                                            <Input
                                                value={receiptData.receiptCode}
                                                onChange={(e) => setReceiptData({ ...receiptData, receiptCode: e.target.value })}
                                                className="mt-1 h-8 text-sm"
                                                placeholder="TNM2501-XXX"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Ngày tiếp nhận</Label>
                                            <Input
                                                type="date"
                                                value={receiptData.receivedDate}
                                                onChange={(e) => setReceiptData({ ...receiptData, receivedDate: e.target.value })}
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Giờ tiếp nhận</Label>
                                            <Input
                                                type="time"
                                                value={receiptData.receivedTime}
                                                onChange={(e) => setReceiptData({ ...receiptData, receivedTime: e.target.value })}
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Người tiếp nhận</Label>
                                            <Input value={receiptData.receivedBy} onChange={(e) => setReceiptData({ ...receiptData, receivedBy: e.target.value })} className="mt-1 h-8 text-sm" />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Hạn trả kết quả</Label>
                                            <Input
                                                type="date"
                                                value={receiptData.deadline}
                                                onChange={(e) => setReceiptData({ ...receiptData, deadline: e.target.value })}
                                                className="mt-1 h-8 text-sm"
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs text-gray-600">Ghi chú</Label>
                                            <Textarea
                                                value={receiptData.notes}
                                                onChange={(e) => setReceiptData({ ...receiptData, notes: e.target.value })}
                                                className="mt-1 text-sm"
                                                rows={3}
                                                placeholder="Ghi chú về phiếu tiếp nhận..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Samples & Analyses - 2/3 */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900">Danh sách mẫu thử & chỉ tiêu</h3>
                                </div>

                                {receiptData.samples.map((sample, sampleIndex) => (
                                    <div key={sample.id} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label className="text-xs text-gray-600">Tên mẫu</Label>
                                                    <Input
                                                        value={sample.sampleName}
                                                        onChange={(e) => {
                                                            const newSamples = [...receiptData.samples];
                                                            newSamples[sampleIndex].sampleName = e.target.value;
                                                            setReceiptData({ ...receiptData, samples: newSamples });
                                                        }}
                                                        className="mt-1 h-8 text-sm"
                                                        placeholder="Nhập tên mẫu..."
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-gray-600">Loại mẫu</Label>
                                                    <Input
                                                        value={sample.sampleTypeName}
                                                        onChange={(e) => {
                                                            const newSamples = [...receiptData.samples];
                                                            newSamples[sampleIndex].sampleTypeName = e.target.value;
                                                            setReceiptData({ ...receiptData, samples: newSamples });
                                                        }}
                                                        className="mt-1 h-8 text-sm"
                                                        placeholder="Nhập loại mẫu..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                <Button size="sm" variant="outline" onClick={() => handleDuplicateSample(sampleIndex)} className="h-8 w-8 p-0" title="Sao chép mẫu">
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                                {receiptData.samples.length > 1 && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRemoveSample(sampleIndex)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        title="Xóa mẫu"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Analyses Table */}
                                        <div className="mt-3">
                                            <Label className="text-xs text-gray-600 mb-2 block">Danh sách chỉ tiêu</Label>
                                            <div className="bg-white rounded-md border overflow-hidden">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-100 border-b">
                                                        <tr>
                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500">Tên chỉ tiêu</th>
                                                            <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500">Phương pháp</th>
                                                            <th className="px-2 py-1.5 text-right text-xs font-medium text-gray-500">Đơn giá</th>
                                                            <th className="px-2 py-1.5 text-center text-xs font-medium text-gray-500 w-16"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y">
                                                        {sample.analyses.map((analysis, analysisIndex) => (
                                                            <tr key={analysis.id} className="hover:bg-gray-50">
                                                                <td className="px-2 py-1.5">
                                                                    <Input
                                                                        value={analysis.parameterName}
                                                                        onChange={(e) => {
                                                                            const newSamples = [...receiptData.samples];
                                                                            newSamples[sampleIndex].analyses[analysisIndex].parameterName = e.target.value;
                                                                            setReceiptData({ ...receiptData, samples: newSamples });
                                                                        }}
                                                                        className="h-7 text-xs"
                                                                        placeholder="Tên chỉ tiêu..."
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-1.5">
                                                                    <Input
                                                                        value={analysis.protocolCode}
                                                                        onChange={(e) => {
                                                                            const newSamples = [...receiptData.samples];
                                                                            newSamples[sampleIndex].analyses[analysisIndex].protocolCode = e.target.value;
                                                                            setReceiptData({ ...receiptData, samples: newSamples });
                                                                        }}
                                                                        className="h-7 text-xs"
                                                                        placeholder="Phương pháp..."
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-1.5">
                                                                    <Input
                                                                        type="number"
                                                                        value={analysis.feeAfterTax}
                                                                        onChange={(e) => {
                                                                            const newSamples = [...receiptData.samples];
                                                                            newSamples[sampleIndex].analyses[analysisIndex].feeAfterTax = parseFloat(e.target.value) || 0;
                                                                            setReceiptData({ ...receiptData, samples: newSamples });
                                                                        }}
                                                                        className="h-7 text-xs text-right"
                                                                        placeholder="0"
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-1.5 text-center">
                                                                    {sample.analyses.length > 1 && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleRemoveAnalysis(sampleIndex, analysisIndex)}
                                                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                <div className="p-2 bg-gray-50 border-t">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleAddAnalysis(sampleIndex)}
                                                        className="w-full h-7 text-xs flex items-center justify-center gap-1.5"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Thêm chỉ tiêu
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(selectedOrder || showManualForm) && (
                    <div className="flex items-center justify-end gap-2 px-4 py-3 border-t bg-gray-50">
                        <Button variant="outline" onClick={onClose}>
                            Hủy
                        </Button>
                        <Button onClick={handleSave} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo phiếu tiếp nhận
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
