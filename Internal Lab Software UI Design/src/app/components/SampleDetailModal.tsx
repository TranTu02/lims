import { useState } from 'react';
import { X, Edit, Save, Plus, Trash2, Upload, FileText, Download } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { DraggableInfoTable } from '@/app/components/DraggableInfoTable';

interface Analysis {
  id: string;
  parameterId?: string; // Mã chỉ tiêu
  parameterName: string;
  protocol: string;
  location: string;
  unit: string;
  assignedTo: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
  result?: string;
}

interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedDate: string;
}

interface Sample {
  id: string;
  code: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  sampleType: string;
  receivedCondition: string;
  storageCondition: string;
  notes: string;
  analyses: Analysis[];
  attachedFiles?: AttachedFile[];
  receiptCode?: string;
  receiptId?: string;
  // New fields from schema
  productType?: string; // Phân loại sản phẩm
  sampleVolume?: string; // Lượng mẫu
  sampleWeight?: number; // Lượng mẫu quy ra g
  physicalState?: string; // Trạng thái vật lý
  sampleInfo?: { label: string; value: string }[]; // Thông tin chi tiết sản phẩm
  sampleReceiptInfo?: { label: string; value: string }[]; // Thông tin thử nghiệm
}

interface SampleDetailModalProps {
  sample: Sample;
  onClose: () => void;
  onReceiptClick?: (receiptId: string) => void;
}

export function SampleDetailModal({ sample, onClose, onReceiptClick }: SampleDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSample, setEditedSample] = useState(sample);
  const [editedAnalyses, setEditedAnalyses] = useState(sample.analyses);

  const handleSave = () => {
    // Save logic here
    console.log('Saving sample:', { ...editedSample, analyses: editedAnalyses });
    setIsEditing(false);
  };

  const handleAnalysisChange = (id: string, field: keyof Analysis, value: string) => {
    setEditedAnalyses(prev =>
      prev.map(a => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleAddAnalysis = () => {
    const newAnalysis: Analysis = {
      id: `new-${Date.now()}`,
      parameterName: '',
      protocol: '',
      location: '',
      unit: '',
      assignedTo: '',
      deadline: '',
      status: 'pending',
    };
    setEditedAnalyses([...editedAnalyses, newAnalysis]);
  };

  const handleDeleteAnalysis = (id: string) => {
    setEditedAnalyses(prev => prev.filter(a => a.id !== id));
  };

  const getAnalysisStatusBadge = (status: Analysis['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-xs">Chờ xử lý</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-500 text-xs">Đang thực hiện</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 text-xs">Hoàn thành</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-purple-600 text-xs">Đã duyệt</Badge>;
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
            <h2 className="text-2xl font-semibold text-gray-900">
              Chi tiết mẫu thử: {sample.code}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Thông tin mẫu thử và các phép thử liên quan
            </p>
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
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setEditedSample(sample);
                  setEditedAnalyses(sample.analyses);
                }}>
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
          {sample.receiptCode && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-gray-600">Thuộc phiếu tiếp nhận</Label>
                  <div className="mt-1">
                    {sample.receiptId && onReceiptClick ? (
                      <button
                        onClick={() => onReceiptClick(sample.receiptId!)}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {sample.receiptCode}
                      </button>
                    ) : (
                      <div className="text-lg font-semibold text-gray-900">{sample.receiptCode}</div>
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
                <div className="mt-1 font-medium text-gray-900">{sample.code}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Tên mẫu</Label>
                {isEditing ? (
                  <Input
                    value={editedSample.name}
                    onChange={(e) => setEditedSample({ ...editedSample, name: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.name}</div>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Loại mẫu</Label>
                {isEditing ? (
                  <Input
                    value={editedSample.sampleType}
                    onChange={(e) => setEditedSample({ ...editedSample, sampleType: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    <Badge variant="outline">{sample.sampleType}</Badge>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Trạng thái mẫu</Label>
                <div className="mt-1">
                  {sample.status === 'pending' ? (
                    <Badge variant="outline" className="text-gray-600">Chờ xử lý</Badge>
                  ) : sample.status === 'in-progress' ? (
                    <Badge variant="default" className="bg-blue-500">Đang thực hiện</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500">Hoàn thành</Badge>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Tình trạng tiếp nhận</Label>
                {isEditing ? (
                  <Input
                    value={editedSample.receivedCondition}
                    onChange={(e) => setEditedSample({ ...editedSample, receivedCondition: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.receivedCondition}</div>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Điều kiện bảo quản</Label>
                {isEditing ? (
                  <Input
                    value={editedSample.storageCondition}
                    onChange={(e) => setEditedSample({ ...editedSample, storageCondition: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.storageCondition}</div>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Phân loại sản phẩm</Label>
                {isEditing ? (
                  <Input
                    value={editedSample.productType || ''}
                    onChange={(e) => setEditedSample({ ...editedSample, productType: e.target.value })}
                    className="mt-1"
                    placeholder="Hàng hóa chứa chất cấm, nguy hiểm..."
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.productType || '-'}</div>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Lượng mẫu</Label>
                {isEditing ? (
                  <Input
                    value={editedSample.sampleVolume || ''}
                    onChange={(e) => setEditedSample({ ...editedSample, sampleVolume: e.target.value })}
                    className="mt-1"
                    placeholder="1 chai 500ml, túi 20g..."
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.sampleVolume || '-'}</div>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Lượng mẫu (g)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedSample.sampleWeight || ''}
                    onChange={(e) => setEditedSample({ ...editedSample, sampleWeight: parseFloat(e.target.value) || undefined })}
                    className="mt-1"
                    placeholder="Khối lượng quy ra gram"
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.sampleWeight ? `${sample.sampleWeight}g` : '-'}</div>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Trạng thái vật lý</Label>
                {isEditing ? (
                  <Input
                    value={editedSample.physicalState || ''}
                    onChange={(e) => setEditedSample({ ...editedSample, physicalState: e.target.value })}
                    className="mt-1"
                    placeholder="Solid, Liquid, Gas..."
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.physicalState || '-'}</div>
                )}
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label className="text-sm text-gray-600">Ghi chú</Label>
                {isEditing ? (
                  <Textarea
                    value={editedSample.notes}
                    onChange={(e) => setEditedSample({ ...editedSample, notes: e.target.value })}
                    className="mt-1"
                    rows={2}
                  />
                ) : (
                  <div className="mt-1 text-gray-900">{sample.notes}</div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Product and Testing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Details */}
            <DraggableInfoTable
              title="Thông tin chi tiết sản phẩm"
              data={editedSample.sampleInfo || []}
              isEditing={isEditing}
              onChange={(data) => setEditedSample({ ...editedSample, sampleInfo: data })}
            />

            {/* Receipt/Testing Information */}
            <DraggableInfoTable
              title="Thông tin thử nghiệm"
              data={editedSample.sampleReceiptInfo || []}
              isEditing={isEditing}
              onChange={(data) => setEditedSample({ ...editedSample, sampleReceiptInfo: data })}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn trả</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kết quả</th>
                      {isEditing && (
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {editedAnalyses.map((analysis, index) => (
                      <tr key={analysis.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={analysis.parameterId || ''}
                              onChange={(e) => handleAnalysisChange(analysis.id, 'parameterId', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="PAR-XXX"
                            />
                          ) : (
                            <span className="text-xs text-gray-600 font-mono">{analysis.parameterId || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={analysis.parameterName}
                              onChange={(e) => handleAnalysisChange(analysis.id, 'parameterName', e.target.value)}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{analysis.parameterName}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={analysis.protocol}
                              onChange={(e) => handleAnalysisChange(analysis.id, 'protocol', e.target.value)}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-xs text-gray-700">{analysis.protocol}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={analysis.location}
                              onChange={(e) => handleAnalysisChange(analysis.id, 'location', e.target.value)}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{analysis.location}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={analysis.unit}
                              onChange={(e) => handleAnalysisChange(analysis.id, 'unit', e.target.value)}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{analysis.unit}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={analysis.assignedTo}
                              onChange={(e) => handleAnalysisChange(analysis.id, 'assignedTo', e.target.value)}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{analysis.assignedTo}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <Input
                              value={analysis.deadline}
                              onChange={(e) => handleAnalysisChange(analysis.id, 'deadline', e.target.value)}
                              className="h-8 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900">{analysis.deadline}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{getAnalysisStatusBadge(analysis.status)}</td>
                        <td className="px-4 py-3">
                          {analysis.result ? (
                            <span className="text-sm font-medium text-gray-900">
                              {analysis.result} {analysis.unit}
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
                              onClick={() => handleDeleteAnalysis(analysis.id)}
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

          {/* Digital Records / Attached Files */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Hồ sơ điện tử</h3>
              <Button size="sm" variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Tải lên file
              </Button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
              {sample.attachedFiles && sample.attachedFiles.length > 0 ? (
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
                      {sample.attachedFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{file.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">{file.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{file.size}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{file.uploadedBy}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{file.uploadedDate}</td>
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