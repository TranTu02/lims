import { useState, useMemo } from "react";
import { X, Edit, Save, Plus, Trash2, Upload, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { DraggableInfoTable } from "@/components/common/DraggableInfoTable";

import type { Sample, Analysis } from "@/types/lab";
import type { FileEntity } from "@/types/document";

import { mockAnalyses, mockReceipts } from "@/types/mockdata";

interface SampleDetailModalProps {
    sample: Sample;
    onClose: () => void;
    onReceiptClick?: (receiptId: string) => void;
}

export function SampleDetailModal({ sample, onClose, onReceiptClick }: SampleDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedSample, setEditedSample] = useState(sample);

    // Initialize analyses from mock data based on sampleId
    const initialAnalyses = useMemo(() => {
        return mockAnalyses.filter((a) => a.sampleId === sample.sampleId);
    }, [sample.sampleId]);

    const [editedAnalyses, setEditedAnalyses] = useState<Analysis[]>(initialAnalyses);
    // Mock attached files state for now as it is not in the core Sample type yet
    const [attachedFiles] = useState<FileEntity[]>([]);

    // Derived receipt info
    const relatedReceipt = useMemo(() => {
        return mockReceipts.find((r) => r.receiptId === sample.receiptId);
    }, [sample.receiptId]);

    const handleSave = () => {
        // Save logic here (would call API to update sample and analyses)
        console.log("Saving sample:", { ...editedSample, analyses: editedAnalyses });
        setIsEditing(false);
    };

    const handleAnalysisChange = (id: string, field: keyof Analysis, value: any) => {
        setEditedAnalyses((prev) => prev.map((a) => (a.analysisId === id ? { ...a, [field]: value } : a)));
    };

    const handleAddAnalysis = () => {
        const newAnalysis: Analysis = {
            analysisId: `new-${Date.now()}`,
            sampleId: sample.sampleId,
            matrixId: "", // To be filled
            technicianId: "",
            analysisStatus: "Pending",
            analysisResultStatus: "NotEvaluated",
            createdAt: new Date().toISOString(),
            createdById: "CURRENT_USER",
            modifiedAt: new Date().toISOString(),
            modifiedById: "CURRENT_USER",
            parameterName: "",
            protocolCode: "",
            analysisLocation: "",
            analysisUnit: "",
        };
        setEditedAnalyses([...editedAnalyses, newAnalysis]);
    };

    const handleDeleteAnalysis = (id: string) => {
        setEditedAnalyses((prev) => prev.filter((a) => a.analysisId !== id));
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
            case "Review":
                return (
                    <Badge variant="default" className="bg-orange-500 text-xs">
                        Chờ duyệt
                    </Badge>
                );
            case "Approved":
                return (
                    <Badge variant="default" className="bg-purple-600 text-xs">
                        Đã duyệt
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

    const getSampleStatusBadge = (status: Sample["sampleStatus"]) => {
        switch (status) {
            case "Received":
                return <Badge variant="outline">Chờ xử lý</Badge>;
            case "Analyzing":
                return (
                    <Badge variant="default" className="bg-blue-500">
                        Đang phân tích
                    </Badge>
                );
            case "Stored":
                return (
                    <Badge variant="default" className="bg-green-500">
                        Lưu kho
                    </Badge>
                );
            case "Disposed":
                return <Badge variant="secondary">Hủy bỏ</Badge>;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose}></div>

            {/* Modal */}
            <div className="fixed inset-4 bg-white rounded-lg shadow-xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Chi tiết mẫu thử: {sample.sampleId}</h2>
                        <p className="text-sm text-gray-600 mt-1">Thông tin mẫu thử và các phép thử liên quan</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Chỉnh sửa
                            </Button>
                        ) : (
                            <>
                                <Button onClick={handleSave} className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    Lưu
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedSample(sample);
                                        setEditedAnalyses(initialAnalyses);
                                    }}
                                >
                                    Hủy
                                </Button>
                            </>
                        )}
                        <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Receipt Reference */}
                    {relatedReceipt && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-sm text-gray-600">Thuộc phiếu tiếp nhận</Label>
                                    <div className="mt-1">
                                        {onReceiptClick ? (
                                            <button onClick={() => onReceiptClick(relatedReceipt.receiptId)} className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                                                {relatedReceipt.receiptCode}
                                            </button>
                                        ) : (
                                            <div className="text-lg font-semibold text-gray-900">{relatedReceipt.receiptCode}</div>
                                        )}
                                    </div>
                                </div>
                                <Badge variant="default" className="bg-blue-600">
                                    Mã tiếp nhận
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Sample Information */}
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Thông tin mẫu thử</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-sm text-gray-600">Mã mẫu</Label>
                                <div className="mt-1 font-medium text-gray-900">{sample.sampleId}</div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Tên mẫu (KH)</Label>
                                {isEditing ? (
                                    <Input value={editedSample.sampleClientInfo || ""} onChange={(e) => setEditedSample({ ...editedSample, sampleClientInfo: e.target.value })} className="mt-1" />
                                ) : (
                                    <div className="mt-1 text-gray-900">{sample.sampleClientInfo}</div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Loại mẫu</Label>
                                {isEditing ? (
                                    <Input value={editedSample.sampleTypeName || ""} onChange={(e) => setEditedSample({ ...editedSample, sampleTypeName: e.target.value })} className="mt-1" />
                                ) : (
                                    <div className="mt-1">
                                        <Badge variant="outline">{sample.sampleTypeName}</Badge>
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Trạng thái mẫu</Label>
                                <div className="mt-1">{getSampleStatusBadge(sample.sampleStatus)}</div>
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Phân loại sản phẩm</Label>
                                {isEditing ? (
                                    <Input
                                        value={editedSample.productType || ""}
                                        onChange={(e) => setEditedSample({ ...editedSample, productType: e.target.value })}
                                        className="mt-1"
                                        placeholder="Hàng hóa chứa chất cấm, nguy hiểm..."
                                    />
                                ) : (
                                    <div className="mt-1 text-gray-900">{sample.productType || "-"}</div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Lượng mẫu</Label>
                                {isEditing ? (
                                    <Input
                                        value={editedSample.sampleVolume || ""}
                                        onChange={(e) => setEditedSample({ ...editedSample, sampleVolume: e.target.value })}
                                        className="mt-1"
                                        placeholder="1 chai 500ml, túi 20g..."
                                    />
                                ) : (
                                    <div className="mt-1 text-gray-900">{sample.sampleVolume || "-"}</div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Lượng mẫu (g)</Label>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        value={editedSample.sampleWeight || ""}
                                        onChange={(e) => setEditedSample({ ...editedSample, sampleWeight: parseFloat(e.target.value) || undefined })}
                                        className="mt-1"
                                        placeholder="Khối lượng quy ra gram"
                                    />
                                ) : (
                                    <div className="mt-1 text-gray-900">{sample.sampleWeight ? `${sample.sampleWeight}g` : "-"}</div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Trạng thái vật lý</Label>
                                {isEditing ? (
                                    <Input
                                        value={editedSample.physicalState || ""}
                                        onChange={(e) => setEditedSample({ ...editedSample, physicalState: e.target.value })}
                                        className="mt-1"
                                        placeholder="Solid, Liquid, Gas..."
                                    />
                                ) : (
                                    <div className="mt-1 text-gray-900">{sample.physicalState || "-"}</div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Điều kiện bảo quản</Label>
                                {isEditing ? (
                                    <Input value={editedSample.samplePreservation || ""} onChange={(e) => setEditedSample({ ...editedSample, samplePreservation: e.target.value })} className="mt-1" />
                                ) : (
                                    <div className="mt-1 text-gray-900">{sample.samplePreservation || "-"}</div>
                                )}
                            </div>
                            <div>
                                <Label className="text-sm text-gray-600">Vị trí lưu kho</Label>
                                {isEditing ? (
                                    <Input value={editedSample.sampleStorageLoc || ""} onChange={(e) => setEditedSample({ ...editedSample, sampleStorageLoc: e.target.value })} className="mt-1" />
                                ) : (
                                    <div className="mt-1 text-gray-900">{sample.sampleStorageLoc || "-"}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Product and Testing Information - Using JSONB LabelValue */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Product Details */}
                        <DraggableInfoTable
                            title="Thông tin chi tiết sản phẩm"
                            data={(editedSample.sampleInfo || []).map((i) => ({ ...i, value: String(i.value) }))}
                            isEditing={isEditing}
                            onChange={(data) => setEditedSample({ ...editedSample, sampleInfo: data.map((d) => ({ ...d, value: d.value })) })}
                        />

                        {/* Receipt/Testing Information */}
                        <DraggableInfoTable
                            title="Thông tin thử nghiệm"
                            data={(editedSample.sampleReceiptInfo || []).map((i) => ({ ...i, value: String(i.value) }))}
                            isEditing={isEditing}
                            onChange={(data) => setEditedSample({ ...editedSample, sampleReceiptInfo: data.map((d) => ({ ...d, value: d.value })) })}
                        />
                    </div>

                    {/* Analyses Information - Table Format */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Danh sách phép thử</h3>
                            {isEditing && (
                                <Button onClick={handleAddAnalysis} size="sm" className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Thêm phép thử
                                </Button>
                            )}
                        </div>

                        <div className="bg-white border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã chỉ tiêu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên chỉ tiêu</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương pháp</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nơi thực hiện</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thực hiện</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
                                            {isEditing && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {editedAnalyses.map((analysis, index) => (
                                            <tr key={analysis.analysisId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.parameterId || ""}
                                                            onChange={(e) => handleAnalysisChange(analysis.analysisId, "parameterId", e.target.value)}
                                                            className="h-8 text-sm"
                                                            placeholder="PAR-XXX"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-600 font-mono">{analysis.parameterId || "-"}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.parameterName || ""}
                                                            onChange={(e) => handleAnalysisChange(analysis.analysisId, "parameterName", e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-900">{analysis.parameterName}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.protocolCode || ""}
                                                            onChange={(e) => handleAnalysisChange(analysis.analysisId, "protocolCode", e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-700">{analysis.protocolCode}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.analysisLocation || ""}
                                                            onChange={(e) => handleAnalysisChange(analysis.analysisId, "analysisLocation", e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-900">{analysis.analysisLocation}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.analysisUnit || ""}
                                                            onChange={(e) => handleAnalysisChange(analysis.analysisId, "analysisUnit", e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-900">{analysis.analysisUnit}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isEditing ? (
                                                        <Input
                                                            value={analysis.technicianId || ""}
                                                            onChange={(e) => handleAnalysisChange(analysis.analysisId, "technicianId", e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-gray-900">{analysis.technicianId}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{getAnalysisStatusBadge(analysis.analysisStatus)}</td>
                                                <td className="px-4 py-3">
                                                    {analysis.analysisResult ? (
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {analysis.analysisResult} {analysis.analysisUnit}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                {isEditing && (
                                                    <td className="px-4 py-3">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteAnalysis(analysis.analysisId)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
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
                            {attachedFiles.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên file</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kích thước</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người tải lên</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tải lên</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {attachedFiles.map((file) => (
                                                <tr key={file.fileId} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-gray-400" />
                                                            <span className="text-sm text-gray-900">{file.fileName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="text-xs">
                                                            {file.mimeType}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{file.fileSize}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{file.createdById}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{file.createdAt}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <Download className="h-4 w-4" />
                                                            </Button>
                                                            {isEditing && (
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>Chưa có file đính kèm</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
