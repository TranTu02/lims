import { useState } from 'react';
import { X, Edit, Save, Upload, FileText, Download, Trash2, UserPlus, ChevronLeft, ChevronRight, Printer, FileCheck, Mail } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { SampleHandoverModal } from '@/app/components/SampleHandoverModal';

interface Analysis {
  id: string;
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

interface SampleImage {
  id: string;
  url: string;
  caption?: string;
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
}

interface Receipt {
  id: string;
  receiptCode: string;
  customer: string;
  receivedDate: string;
  receivedTime: string;
  receivedBy: string;
  deadline: string;
  daysLeft: number;
  status: 'new' | 'processing' | 'completed' | 'overdue';
  samples: Sample[];
  customerType: 'company' | 'individual';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  requestType: string;
  paymentStatus: string;
  notes: string;
  attachedFiles?: AttachedFile[];
  sampleImages?: SampleImage[];
  emailSent?: {
    sentAt: string;
    sentBy: string;
  } | null;
}

interface ReceiptDetailModalProps {
  receipt: Receipt;
  onClose: () => void;
  onSampleClick: (sample: Sample) => void;
}

export function ReceiptDetailModal({ receipt, onClose, onSampleClick }: ReceiptDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReceipt, setEditedReceipt] = useState(receipt);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({
    from: 'lab@company.com',
    to: receipt.email,
    subject: `Xác nhận tiếp nhận mẫu - ${receipt.receiptCode}`,
    content: `Kính gửi ${receipt.customer},\n\nChúng tôi xác nhận đã tiếp nhận mẫu thử theo thông tin sau:\n- Mã tiếp nhận: ${receipt.receiptCode}\n- Ngày tiếp nhận: ${receipt.receivedDate} ${receipt.receivedTime}\n- Hạn trả kết quả: ${receipt.deadline}\n\nTrân trọng,\nPhòng thí nghiệm`,
    attachments: [] as string[]
  });

  const sampleImages = receipt.sampleImages || [];

  const handleSave = () => {
    // Save logic here
    console.log('Saving receipt:', editedReceipt);
    setIsEditing(false);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? sampleImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === sampleImages.length - 1 ? 0 : prev + 1
    );
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

  const handleEmailChange = (field: string, value: string) => {
    setEmailForm({
      ...emailForm,
      [field]: value
    });
  };

  const handleEmailAttachment = (file: string) => {
    setEmailForm({
      ...emailForm,
      attachments: [...emailForm.attachments, file]
    });
  };

  const handleSendEmail = () => {
    // Send email logic here
    console.log('Sending email:', emailForm);
    setShowEmailModal(false);
    setEditedReceipt({
      ...editedReceipt,
      emailSent: {
        sentAt: new Date().toISOString(),
        sentBy: 'lab@company.com'
      }
    });
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
            <h2 className="text-lg font-semibold text-gray-900">
              Chi tiết phiếu tiếp nhận: {receipt.receiptCode}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Thông tin chi tiết phiếu tiếp nhận và danh sách mẫu thử
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => console.log('Print label')} variant="outline" className="flex items-center gap-1.5 text-xs">
              <Printer className="h-3.5 w-3.5" />
              In tem
            </Button>
            <Button size="sm" onClick={() => console.log('Export handover')} variant="outline" className="flex items-center gap-1.5 text-xs">
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
                      value={editedReceipt.customer}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, customer: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 font-medium text-gray-900">{receipt.customer}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Loại khách hàng</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {receipt.customerType === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Người liên hệ</Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.contactPerson}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, contactPerson: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">{receipt.contactPerson}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Số điện thoại</Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.phone}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, phone: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">{receipt.phone}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.email}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, email: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">{receipt.email}</div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm text-gray-600">Địa chỉ</Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.address}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, address: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">{receipt.address}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Gửi mail tiếp nhận</Label>
                  <div className="mt-1">
                    {editedReceipt.emailSent ? (
                      <div className="text-sm">
                        <div className="text-gray-900 font-medium">
                          {new Date(editedReceipt.emailSent.sentAt).toLocaleString('vi-VN')}
                        </div>
                        <div className="text-gray-600 text-xs">
                          Đã gửi bởi: {editedReceipt.emailSent.sentBy}
                        </div>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={() => setShowEmailModal(true)}
                      >
                        <Mail className="h-4 w-4" />
                        Gửi mail ngay
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Ngày tiếp nhận</Label>
                  <div className="mt-1 text-gray-900">
                    {receipt.receivedDate} {receipt.receivedTime}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Người tiếp nhận</Label>
                  <div className="mt-1 text-gray-900">{receipt.receivedBy}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Hạn trả kết quả</Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.deadline}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, deadline: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">{receipt.deadline}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Loại yêu cầu</Label>
                  {isEditing ? (
                    <Input
                      value={editedReceipt.requestType}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, requestType: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">{receipt.requestType}</div>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Trạng thái thanh toán</Label>
                  <div className="mt-1">
                    <Badge variant="default" className="bg-green-600">
                      {receipt.paymentStatus}
                    </Badge>
                  </div>
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <Label className="text-sm text-gray-600">Ghi chú</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedReceipt.notes}
                      onChange={(e) => setEditedReceipt({ ...editedReceipt, notes: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <div className="mt-1 text-gray-900">{receipt.notes}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Sidebar - Right Side */}
            {sampleImages.length > 0 && (
              <div className="w-80 bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Ảnh mẫu</h3>
                {/* Image Display */}
                <div className="relative bg-white rounded-lg overflow-hidden mb-3">
                  <img
                    src={sampleImages[currentImageIndex].url}
                    alt={sampleImages[currentImageIndex].caption || `Hình ảnh ${currentImageIndex + 1}`}
                    className="w-full h-64 object-contain"
                  />
                  {sampleImages[currentImageIndex].caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs">{sampleImages[currentImageIndex].caption}</p>
                    </div>
                  )}
                  {/* Navigation Buttons */}
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
                  {/* Image Counter */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-0.5 rounded-full text-xs">
                    {currentImageIndex + 1} / {sampleImages.length}
                  </div>
                </div>

                {/* Thumbnail List */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {sampleImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {sampleImages[currentImageIndex].uploadedDate && (
                  <p className="text-xs text-gray-500 mt-2">
                    Ngày tải lên: {sampleImages[currentImageIndex].uploadedDate}
                  </p>
                )}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mã mẫu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên mẫu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Loại mẫu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tên chỉ tiêu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Phương pháp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Người thực hiện
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Hạn trả
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Kết quả
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {receipt.samples.map((sample) => (
                      <>
                        {sample.analyses.map((analysis, index) => (
                          <tr key={analysis.id} className="hover:bg-gray-50">
                            {index === 0 && (
                              <>
                                <td
                                  className="px-4 py-3 align-top border-r bg-blue-50/30"
                                  rowSpan={sample.analyses.length}
                                >
                                  <button
                                    onClick={() => onSampleClick(sample)}
                                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline text-sm"
                                  >
                                    {sample.code}
                                  </button>
                                </td>
                                <td
                                  className="px-4 py-3 align-top border-r bg-blue-50/30"
                                  rowSpan={sample.analyses.length}
                                >
                                  <div className="text-sm text-gray-900">{sample.name}</div>
                                </td>
                                <td
                                  className="px-4 py-3 align-top border-r bg-blue-50/30"
                                  rowSpan={sample.analyses.length}
                                >
                                  <Badge variant="outline" className="text-xs">
                                    {sample.sampleType}
                                  </Badge>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {analysis.parameterName}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {analysis.protocol}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {analysis.assignedTo}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {analysis.deadline}
                            </td>
                            <td className="px-4 py-3">{getAnalysisStatusBadge(analysis.status)}</td>
                            <td className="px-4 py-3">
                              {analysis.result ? (
                                <div className="text-sm font-medium text-gray-900">
                                  {analysis.result} {analysis.unit}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
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
              {receipt.attachedFiles && receipt.attachedFiles.length > 0 ? (
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
                      {receipt.attachedFiles.map((file) => (
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

      {/* Email Modal */}
      {showEmailModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowEmailModal(false)}></div>
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-3xl mx-auto bg-white rounded-lg shadow-xl z-[60] flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Gửi email xác nhận
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Gửi email xác nhận tiếp nhận mẫu thử
                </p>
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
                  <Input
                    value={emailForm.from}
                    onChange={(e) => handleEmailChange('from', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Đến</Label>
                  <Input
                    value={emailForm.to}
                    onChange={(e) => handleEmailChange('to', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Tiêu đề</Label>
                  <Input
                    value={emailForm.subject}
                    onChange={(e) => handleEmailChange('subject', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Nội dung</Label>
                  <Textarea
                    value={emailForm.content}
                    onChange={(e) => handleEmailChange('content', e.target.value)}
                    className="mt-1"
                    rows={10}
                  />
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