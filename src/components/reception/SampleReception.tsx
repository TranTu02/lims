import React, { useState, useMemo } from "react";
import { Search, AlertCircle, FileText, Truck, Package, Plus, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ReceiptDetailModal } from "@/components/reception/ReceiptDetailModal";
import { SampleDetailModal } from "@/components/reception/SampleDetailModal";
import { CreateReceiptModal } from "@/components/reception/CreateReceiptModal";
import { OrdersTab } from "@/components/reception/OrdersTab";
import { OrderDetailModal } from "@/components/reception/OrderDetailModal";

import type { Receipt, Sample } from "@/types/lab";
import type { Order } from "@/types/crm";
import { mockReceipts, mockSamples, mockOrders } from "@/types/mockdata";

// Helper type for UI View
type ReceiptWithSamples = Receipt & { samples: Sample[] };

const getStatusBadge = (status: Receipt["receiptStatus"]) => {
    switch (status) {
        case "Pending":
            return (
                <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                    Mới tiếp nhận
                </Badge>
            );
        case "Processing":
            return (
                <Badge variant="default" className="bg-orange-500 dark:bg-orange-600 hover:bg-orange-600">
                    Đang xử lý
                </Badge>
            );
        case "Done":
            return (
                <Badge variant="default" className="bg-green-500 dark:bg-green-600 hover:bg-green-600">
                    Hoàn thành
                </Badge>
            );
        case "Cancelled":
            return <Badge variant="destructive">Hủy</Badge>;
    }
};

const getSampleStatusBadge = (status: Sample["sampleStatus"]) => {
    switch (status) {
        case "Received":
            return (
                <Badge variant="outline" className="text-muted-foreground border-border">
                    Chờ xử lý
                </Badge>
            );
        case "Analyzing":
            return (
                <Badge variant="default" className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600">
                    Đang thực hiện
                </Badge>
            );
        case "Stored":
            return (
                <Badge variant="default" className="bg-green-500 dark:bg-green-600 hover:bg-green-600">
                    Lưu kho
                </Badge>
            );
        case "Disposed":
            return <Badge variant="secondary">Hủy bỏ</Badge>;
    }
};

export function SampleReception() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<"orders" | "processing" | "return-results">("orders");
    const [selectedReceipt, setSelectedReceipt] = useState<ReceiptWithSamples | null>(null);
    const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
    const [isCreateReceiptModalOpen, setIsCreateReceiptModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Prepare data with join
    const allReceipts: ReceiptWithSamples[] = useMemo(() => {
        return mockReceipts.map((r) => ({
            ...r,
            samples: mockSamples.filter((s) => s.receiptId === r.receiptId),
        }));
    }, []);

    // Filter for Return Results (Done receipts)
    const returnResults = useMemo(() => {
        return allReceipts.filter((r) => r.receiptStatus === "Done");
    }, [allReceipts]);

    // Helper function to find receipt by ID
    const findReceiptById = (receiptId: string) => {
        return allReceipts.find((r) => r.receiptId === receiptId);
    };

    const filteredReceipts = allReceipts.filter((receipt) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const clientName = receipt.client?.clientName || "";
        return (
            receipt.receiptCode.toLowerCase().includes(term) ||
            clientName.toLowerCase().includes(term) ||
            receipt.samples.some((s) => s.sampleId.toLowerCase().includes(term) || s.sampleClientInfo?.toLowerCase().includes(term) || "")
        );
    });

    const filteredReturnResults = returnResults.filter((receipt) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        const clientName = receipt.client?.clientName || "";
        const clientEmail = receipt.client?.clientEmail || "";
        return receipt.receiptCode.toLowerCase().includes(term) || clientName.toLowerCase().includes(term) || clientEmail.toLowerCase().includes(term);
    });

    const totalReceipts = allReceipts.length;
    // Mock 'overdue' logic
    const overdueReceipts = allReceipts.filter((r) => new Date(r.receiptDeadline).getTime() < Date.now()).length;
    const pendingSamples = allReceipts.reduce((acc, r) => acc + r.samples.filter((s) => s.sampleStatus === "Received").length, 0);
    const returnResultsCount = returnResults.length;

    const getDaysLeft = (deadline: string) => {
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 3600 * 24));
        return days;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Modals */}
            {selectedReceipt && (
                <ReceiptDetailModal
                    receipt={selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                    onSampleClick={(sample) => {
                        setSelectedSample(sample);
                        setSelectedReceipt(null);
                    }}
                />
            )}

            {selectedSample && (
                <SampleDetailModal
                    sample={selectedSample}
                    receipt={findReceiptById(selectedSample.receiptId)!}
                    onClose={() => setSelectedSample(null)}
                    onSave={(updatedSample) => {
                        console.log("Saving sample", updatedSample);
                        // Logic to update sample in global state/API would go here
                        setSelectedSample(null);
                    }}
                />
            )}

            {isCreateReceiptModalOpen && <CreateReceiptModal onClose={() => setIsCreateReceiptModalOpen(false)} order={selectedOrder} />}

            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">Tổng phiếu tháng này</div>
                    <div className="text-3xl font-semibold mt-1 text-foreground">{totalReceipts}</div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">Phiếu quá hạn</div>
                    <div className="text-3xl font-semibold mt-1 text-destructive">{overdueReceipts}</div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">Mẫu chưa gán KTV</div>
                    <div className="text-3xl font-semibold mt-1 text-orange-600 dark:text-orange-500">{pendingSamples}</div>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <div className="text-sm text-muted-foreground">Chờ trả kết quả</div>
                    <div className="text-3xl font-semibold mt-1 text-blue-600 dark:text-blue-500">{returnResultsCount}</div>
                </div>
            </div>

            {/* Tab Selection & Search */}
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
                        <Button
                            variant={activeTab === "orders" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("orders")}
                            className={`flex items-center gap-2 ${activeTab === "orders" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                            <Package className="h-4 w-4" />
                            Đơn hàng ({mockOrders.length})
                        </Button>
                        <Button
                            variant={activeTab === "processing" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("processing")}
                            className={`flex items-center gap-2 ${activeTab === "processing" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                            <Package className="h-4 w-4" />
                            Đang xử lý ({allReceipts.length})
                        </Button>
                        <Button
                            variant={activeTab === "return-results" ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setActiveTab("return-results")}
                            className={`flex items-center gap-2 ${activeTab === "return-results" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        >
                            <Truck className="h-4 w-4" />
                            Trả kết quả ({returnResults.length})
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-1 w-full md:w-auto md:max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Tìm kiếm theo mã phiếu, khách hàng, mã mẫu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background" />
                        </div>
                        <Button variant="default" className="flex items-center gap-2" onClick={() => setIsCreateReceiptModalOpen(true)}>
                            <Plus className="h-4 w-4" />
                            Tạo phiếu mới
                        </Button>
                    </div>
                </div>
            </div>

            {/* Orders Tab */}
            {activeTab === "orders" && (
                <>
                    {selectedOrder && !isCreateReceiptModalOpen && (
                        <OrderDetailModal
                            order={selectedOrder}
                            onClose={() => setSelectedOrder(null)}
                            onCreateReceipt={(order) => {
                                setIsCreateReceiptModalOpen(true);
                            }}
                        />
                    )}
                    <OrdersTab
                        orders={mockOrders}
                        onCreateReceipt={(order) => {
                            console.log("Creating receipt for order:", order);
                            setSelectedOrder(order);
                            setIsCreateReceiptModalOpen(true);
                        }}
                        onViewDetail={(order) => {
                            setSelectedOrder(order);
                        }}
                        onReceiptClick={(receiptId) => {
                            console.log("Opening receipt:", receiptId);
                            const receipt = findReceiptById(receiptId);
                            if (receipt) {
                                setSelectedReceipt(receipt);
                            }
                        }}
                    />
                </>
            )}

            {/* Processing Tab */}
            {activeTab === "processing" && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Thông tin tiếp nhận</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mã mẫu</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tên/TT Mẫu</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Trạng thái mẫu</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Chỉ tiêu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredReceipts.map((receipt) => {
                                    const daysLeft = getDaysLeft(receipt.receiptDeadline);
                                    return (
                                        <React.Fragment key={receipt.receiptId}>
                                            {receipt.samples.length > 0 ? (
                                                receipt.samples.map((sample, sampleIndex) => (
                                                    <tr key={sample.sampleId} className="hover:bg-accent/30 transition-colors">
                                                        {sampleIndex === 0 && (
                                                            <td className="px-4 py-4 align-top border-r border-border bg-muted/20" rowSpan={receipt.samples.length}>
                                                                <div className="space-y-1">
                                                                    <button onClick={() => setSelectedReceipt(receipt)} className="font-semibold text-primary hover:text-primary/80 hover:underline">
                                                                        {receipt.receiptCode}
                                                                    </button>
                                                                    <div className="text-sm text-foreground">{receipt.client?.clientName}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {receipt.receiptDate.split("T")[0]} - {receipt.createdById}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        )}
                                                        {sampleIndex === 0 && (
                                                            <td className="px-4 py-4 align-top border-r border-border bg-muted/20" rowSpan={receipt.samples.length}>
                                                                <div className="space-y-2">
                                                                    {getStatusBadge(receipt.receiptStatus)}
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                                        <span className="font-medium text-foreground">{receipt.receiptDeadline.split("T")[0]}</span>
                                                                    </div>
                                                                    {daysLeft < 0 ? (
                                                                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            Quá hạn!
                                                                        </Badge>
                                                                    ) : daysLeft <= 2 ? (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 w-fit"
                                                                        >
                                                                            Còn {daysLeft} ngày
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-muted-foreground w-fit">
                                                                            Còn {daysLeft} ngày
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3">
                                                            <span className="font-medium text-foreground text-sm">{sample.sampleId}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-foreground text-sm">{sample.sampleClientInfo}</span>
                                                            <div className="text-xs text-muted-foreground">{sample.sampleTypeName}</div>
                                                        </td>
                                                        <td className="px-4 py-3">{getSampleStatusBadge(sample.sampleStatus)}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="text-xs text-muted-foreground">{Math.floor(Math.random() * 5) + 1} chỉ tiêu</div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr key={receipt.receiptId}>
                                                    <td className="px-4 py-4 border-r border-border bg-muted/20">
                                                        <div className="space-y-1">
                                                            <button onClick={() => setSelectedReceipt(receipt)} className="font-semibold text-primary hover:underline">
                                                                {receipt.receiptCode}
                                                            </button>
                                                            <div className="text-sm text-foreground">{receipt.client?.clientName}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 border-r border-border bg-muted/20">{getStatusBadge(receipt.receiptStatus)}</td>
                                                    <td className="px-4 py-4 text-center text-muted-foreground" colSpan={4}>
                                                        Chưa có mẫu
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
                </div>
            )}

            {/* Return Results Tab */}
            {activeTab === "return-results" && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Thông tin tiếp nhận</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vận đơn</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hạn trả</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Liên hệ</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mẫu</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredReturnResults.map((receipt) => {
                                    return (
                                        <tr key={receipt.receiptId} className="hover:bg-accent/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="space-y-1">
                                                    <div className="font-semibold text-foreground">{receipt.receiptCode}</div>
                                                    <div className="text-sm text-foreground">{receipt.client?.clientName}</div>
                                                    <div className="text-xs text-muted-foreground">{receipt.receiptDate.split("T")[0]}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {receipt.receiptTrackingNo ? (
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="h-3 w-3 text-green-600 dark:text-green-500" />
                                                        <span className="text-sm font-medium text-foreground">{receipt.receiptTrackingNo}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Chưa có vận đơn</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm text-foreground">{receipt.receiptDeadline.split("T")[0]}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="space-y-1 text-sm">
                                                    <div className="text-foreground">{receipt.client?.clientAddress}</div>
                                                    <div className="text-muted-foreground">📞 {receipt.client?.clientPhone}</div>
                                                    <div className="text-muted-foreground">✉️ {receipt.client?.clientEmail}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <Badge variant="outline" className="text-base text-foreground">
                                                    {receipt.samples.length} mẫu
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={() => setSelectedReceipt(receipt)}>
                                                        <FileText className="h-3 w-3" />
                                                        Xem
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
                                                        disabled={!!receipt.receiptTrackingNo}
                                                    >
                                                        <Truck className="h-3 w-3" />
                                                        Tạo vận đơn
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
                </div>
            )}
        </div>
    );
}
