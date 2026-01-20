import { useState, useMemo } from "react";
import { X, Edit, Save, Upload, FileText, Printer, FileCheck, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Receipt, Sample, Analysis } from "@/types/lab";

// import { SampleHandoverModal } from '@/components/handover/SampleHandoverModal'; // Commented out if not available or strictly needed yet
import { mockAnalyses } from "@/types/mockdata";

interface ReceiptWithSamples extends Receipt {
    samples: Sample[];
}

interface ReceiptDetailModalProps {
    receipt: ReceiptWithSamples;
    onClose: () => void;
    onSampleClick: (sample: Sample) => void;
}

// Mock types for UI only features not yet in backend types
interface SampleImage {
    id: string;
    url: string;
    caption?: string;
    uploadedDate: string;
}

export function ReceiptDetailModal({ receipt, onClose, onSampleClick }: ReceiptDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedReceipt, setEditedReceipt] = useState(receipt);
    const [showEmailModal, setShowEmailModal] = useState(false);
    // Mock images for now
    const [sampleImages] = useState<SampleImage[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [emailForm, setEmailForm] = useState({
        from: "lab@company.com",
        to: receipt.client?.clientEmail || "",
        subject: `Xác nhận tiếp nhận mẫu - ${receipt.receiptCode}`,
        content: `Kính gửi ${receipt.client?.clientName},\n\nChúng tôi xác nhận đã tiếp nhận mẫu thử theo thông tin sau:\n- Mã tiếp nhận: ${receipt.receiptCode}\n- Ngày tiếp nhận: ${receipt.receiptDate?.split("T")[0]}\n- Hạn trả kết quả: ${receipt.receiptDeadline?.split("T")[0]}\n\nTrân trọng,\nPhòng thí nghiệm`,
        attachments: [] as string[],
    });

    // Derived analyses for all samples in this receipt
    const receiptAnalyses = useMemo(() => {
        const sampleIds = receipt.samples.map((s) => s.sampleId);
        return mockAnalyses.filter((a) => sampleIds.includes(a.sampleId));
    }, [receipt.samples]);

    const getAnalysesForSample = (sampleId: string) => {
        return receiptAnalyses.filter((a) => a.sampleId === sampleId);
    };

    const handleSave = () => {
        // Save logic here
        console.log("Saving receipt:", editedReceipt);
        setIsEditing(false);
    };

    const handlePrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? sampleImages.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev === sampleImages.length - 1 ? 0 : prev + 1));
    };

    const getAnalysisStatusBadge = (status: Analysis["analysisStatus"]) => {
        switch (status) {
            case "Pending":
                return (
                    <Badge variant="outline" className="text-xs">
                        Chờ xử lý
                    </Badge>
                );
            case "Testing":
                return (
                    <Badge variant="default" className="bg-blue-500 text-xs">
                        Đang thực hiện
                    </Badge>
                );
            case "Approved":
                return (
                    <Badge variant="default" className="bg-green-500 text-xs">
                        Hoàn thành
                    </Badge>
                );
            case "Review":
                return (
                    <Badge variant="default" className="bg-orange-500 text-xs">
                        Chờ duyệt
                    </Badge>
                );
            case "Rejected":
                return (
                    <Badge variant="destructive" className="text-xs">
                        Từ chối
                    </Badge>
                );
        }
    };

    const handleEmailChange = (field: string, value: string) => {
        setEmailForm({
            ...emailForm,
            [field]: value,
        });
    };

    const handleSendEmail = () => {
        // Send email logic here
        console.log("Sending email:", emailForm);
        setShowEmailModal(false);
        // Mock update email sent status
        // setEditedReceipt({...});
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-4 bg-white rounded-lg shadow-xl z-50 flex flex-col">
                {/* Header - Thu hẹp padding */}
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Chi tiết phiếu tiếp nhận: {receipt.receiptCode}</h2>
                        <p className="text-xs text-gray-600 mt-0.5">Thông tin chi tiết phiếu tiếp nhận và danh sách mẫu thử</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => console.log("Print label")} variant="outline" className="flex items-center gap-1.5 text-xs">
                            <Printer className="h-3.5 w-3.5" />
                            In tem
                        </Button>
                        <Button size="sm" onClick={() => console.log("Export handover")} variant="outline" className="flex items-center gap-1.5 text-xs">
                            <FileCheck className="h-3.5 w-3.5" />
                            Xuất biên bản
                        </Button>
                        {!isEditing ? (
                            <Button size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-xs">
                                <Edit className="h-3.5 w-3.5" />
                                Sửa
                            </Button>
                        ) : (
                            <>
                                <Button size="sm" onClick={handleSave} className="flex items-center gap-1.5 text-xs">
                                    <Save className="h-3.5 w-3.5" />
                                    Lưu
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="text-xs">
                                    Hủy
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Receipt Information with Image Sidebar */}
                    <div className="flex gap-4">
                        {/* Receipt Info - Left Side */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông tin phiếu tiếp nhận</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <Label className="text-sm text-gray-600">Mã phiếu</Label>
                                    <div className="mt-1 font-medium text-gray-900">{receipt.receiptCode}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Khách hàng</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedReceipt.client?.clientName || ""}
                                            onChange={(e) => setEditedReceipt({ ...editedReceipt, client: { ...editedReceipt.client, clientName: e.target.value } })}
                                            className="mt-1"
                                        />
                                    ) : (
                                        <div className="mt-1 font-medium text-gray-900">{receipt.client?.clientName}</div>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Địa chỉ</Label>
                                    <div className="mt-1 text-gray-900">{receipt.client?.clientAddress}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Liên hệ</Label>
                                    <div className="mt-1 text-gray-900">
                                        {receipt.client?.clientPhone} - {receipt.client?.clientEmail}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Gửi mail tiếp nhận</Label>
                                    <div className="mt-1">
                                        <Button size="sm" variant="outline" className="flex items-center gap-2" onClick={() => setShowEmailModal(true)}>
                                            <Mail className="h-4 w-4" />
                                            Gửi mail ngay
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Ngày tiếp nhận</Label>
                                    <div className="mt-1 text-gray-900">{receipt.receiptDate?.split("T")[0]}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Người tiếp nhận</Label>
                                    <div className="mt-1 text-gray-900">{receipt.createdById}</div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Hạn trả kết quả</Label>
                                    {isEditing ? (
                                        <Input
                                            value={editedReceipt.receiptDeadline?.split("T")[0] || ""}
                                            onChange={(e) => setEditedReceipt({ ...editedReceipt, receiptDeadline: e.target.value })}
                                            className="mt-1"
                                            type="date"
                                        />
                                    ) : (
                                        <div className="mt-1 text-gray-900">{receipt.receiptDeadline?.split("T")[0]}</div>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Trạng thái</Label>
                                    <div className="mt-1">
                                        <Badge variant="outline">{receipt.receiptStatus}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Ưu tiên</Label>
                                    <div className="mt-1">
                                        <Badge variant={receipt.receiptPriority === "Urgent" ? "destructive" : "secondary"}>{receipt.receiptPriority}</Badge>
                                    </div>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3">
                                    <Label className="text-sm text-gray-600">Ghi chú</Label>
                                    {isEditing ? (
                                        <Textarea
                                            value={editedReceipt.receiptNote || ""}
                                            onChange={(e) => setEditedReceipt({ ...editedReceipt, receiptNote: e.target.value })}
                                            className="mt-1"
                                            rows={3}
                                        />
                                    ) : (
                                        <div className="mt-1 text-gray-900">{receipt.receiptNote || "-"}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Image Sidebar - Right Side (Mocked) */}
                        {sampleImages.length > 0 && (
                            <div className="w-80 bg-gray-50 rounded-lg p-3">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Ảnh mẫu</h3>
                                <div className="relative bg-white rounded-lg overflow-hidden mb-3">
                                    <img
                                        src={sampleImages[currentImageIndex].url}
                                        alt={sampleImages[currentImageIndex].caption || `Hình ảnh ${currentImageIndex + 1}`}
                                        className="w-full h-64 object-contain"
                                    />
                                    {sampleImages.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevImage}
                                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={handleNextImage}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Samples and Analyses Table */}
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Danh sách mẫu thử và phép thử</h3>
                        <div className="bg-white border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã mẫu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên mẫu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại mẫu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên chỉ tiêu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương pháp</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thực hiện</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {receipt.samples.map((sample) => {
                                            const analyses = getAnalysesForSample(sample.sampleId);
                                            return (
                                                <>
                                                    {analyses.length > 0 ? (
                                                        analyses.map((analysis, index) => (
                                                            <tr key={analysis.analysisId} className="hover:bg-gray-50">
                                                                {index === 0 && (
                                                                    <>
                                                                        <td className="px-4 py-3 align-top border-r bg-blue-50/30" rowSpan={analyses.length}>
                                                                            <button
                                                                                onClick={() => onSampleClick(sample)}
                                                                                className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-sm"
                                                                            >
                                                                                {sample.sampleId}
                                                                            </button>
                                                                        </td>
                                                                        <td className="px-4 py-3 align-top border-r bg-blue-50/30" rowSpan={analyses.length}>
                                                                            <div className="text-sm text-gray-900">{sample.sampleClientInfo}</div>
                                                                        </td>
                                                                        <td className="px-4 py-3 align-top border-r bg-blue-50/30" rowSpan={analyses.length}>
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {sample.sampleTypeName}
                                                                            </Badge>
                                                                        </td>
                                                                    </>
                                                                )}
                                                                <td className="px-4 py-3 text-sm text-gray-900">{analysis.parameterName}</td>
                                                                <td className="px-4 py-3 text-xs text-gray-600">{analysis.protocolCode}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{analysis.technicianId}</td>
                                                                <td className="px-4 py-3">{getAnalysisStatusBadge(analysis.analysisStatus)}</td>
                                                                <td className="px-4 py-3">
                                                                    {analysis.analysisResult ? (
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {analysis.analysisResult} {analysis.analysisUnit}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-sm text-gray-400">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        // Render a row for sample even if no analyses
                                                        <tr key={sample.sampleId} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 align-top border-r bg-blue-50/30">
                                                                <button onClick={() => onSampleClick(sample)} className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-sm">
                                                                    {sample.sampleId}
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-3 align-top border-r bg-blue-50/30">
                                                                <div className="text-sm text-gray-900">{sample.sampleClientInfo}</div>
                                                            </td>
                                                            <td className="px-4 py-3 align-top border-r bg-blue-50/30">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {sample.sampleTypeName}
                                                                </Badge>
                                                            </td>
                                                            <td colSpan={5} className="px-4 py-3 text-center text-gray-400 text-sm">
                                                                Chưa có chỉ tiêu
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Digital Records / Attached Files - Mocked for now */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Hồ sơ điện tử</h3>
                            <Button size="sm" variant="outline" className="flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Tải lên file
                            </Button>
                        </div>

                        <div className="bg-white border rounded-lg overflow-hidden">
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>Chưa có file đính kèm</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Modal */}
            {showEmailModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowEmailModal(false)}></div>
                    <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-3xl mx-auto bg-white rounded-lg shadow-xl z-[60] flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Gửi email xác nhận</h2>
                                <p className="text-sm text-gray-600 mt-1">Gửi email xác nhận tiếp nhận mẫu thử</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowEmailModal(false)} className="h-10 w-10 p-0">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm text-gray-600">Từ</Label>
                                    <Input value={emailForm.from} onChange={(e) => handleEmailChange("from", e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Đến</Label>
                                    <Input value={emailForm.to} onChange={(e) => handleEmailChange("to", e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Tiêu đề</Label>
                                    <Input value={emailForm.subject} onChange={(e) => handleEmailChange("subject", e.target.value)} className="mt-1" />
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Nội dung</Label>
                                    <Textarea value={emailForm.content} onChange={(e) => handleEmailChange("content", e.target.value)} className="mt-1" rows={10} />
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-600">Đính kèm</Label>
                                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                                        {emailForm.attachments.map((attachment, index) => (
                                            <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md">
                                                <FileCheck className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-900">{attachment}</span>
                                            </div>
                                        ))}
                                        <Button size="sm" variant="outline" className="flex items-center gap-2">
                                            <Upload className="h-4 w-4" />
                                            Tải lên file
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 p-6 border-t">
                            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
                                Hủy
                            </Button>
                            <Button onClick={handleSendEmail} className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Gửi email
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
