import { useState } from 'react';
import { FileText, Upload, Download, Eye, FileSpreadsheet, Image as ImageIcon, File } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface Document {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'excel' | 'image' | 'other';
  refId?: string;
  refType?: string;
  uploadedBy: string;
  uploadedDate: string;
  fileSize: string;
}

const mockDocuments = {
  receipt: [
    {
      id: 'd1',
      fileName: 'Phiếu yêu cầu TNM2501-001.pdf',
      fileType: 'pdf' as const,
      refId: 'TNM2501-001',
      refType: 'Receipt',
      uploadedBy: 'Nguyễn Văn A',
      uploadedDate: '15/01/2026',
      fileSize: '245 KB',
    },
    {
      id: 'd2',
      fileName: 'Hợp đồng Công ty ABC.pdf',
      fileType: 'pdf' as const,
      refId: 'TNM2501-001',
      refType: 'Receipt',
      uploadedBy: 'Trần Thị B',
      uploadedDate: '15/01/2026',
      fileSize: '1.2 MB',
    },
    {
      id: 'd3',
      fileName: 'Email khách hàng - Yêu cầu bổ sung.pdf',
      fileType: 'pdf' as const,
      refId: 'TNM2501-002',
      refType: 'Receipt',
      uploadedBy: 'Nguyễn Văn A',
      uploadedDate: '16/01/2026',
      fileSize: '180 KB',
    },
  ],
  lab: [
    {
      id: 'd4',
      fileName: 'Nhật ký thử nghiệm pH - Batch 2501.xlsx',
      fileType: 'excel' as const,
      refId: 'TNM2501-001-S01',
      refType: 'Sample',
      uploadedBy: 'KTV Lê Văn C',
      uploadedDate: '16/01/2026',
      fileSize: '95 KB',
    },
    {
      id: 'd5',
      fileName: 'Sắc ký đồ Pb - Mẫu S01.png',
      fileType: 'image' as const,
      refId: 'TNM2501-003-S01',
      refType: 'Analysis',
      uploadedBy: 'KTV Phạm Thị D',
      uploadedDate: '17/01/2026',
      fileSize: '520 KB',
    },
    {
      id: 'd6',
      fileName: 'Raw data ICP-MS - 17012026.xlsx',
      fileType: 'excel' as const,
      refId: 'Batch-170126',
      refType: 'Batch',
      uploadedBy: 'KTV Phạm Thị D',
      uploadedDate: '17/01/2026',
      fileSize: '1.8 MB',
    },
  ],
  report: [
    {
      id: 'd7',
      fileName: 'Phiếu kết quả TNM2501-002 (Scan).pdf',
      fileType: 'pdf' as const,
      refId: 'TNM2501-002',
      refType: 'Receipt',
      uploadedBy: 'Trưởng phòng E',
      uploadedDate: '17/01/2026',
      fileSize: '1.5 MB',
    },
    {
      id: 'd8',
      fileName: 'Bản nháp kết quả TNM2501-001.docx',
      fileType: 'other' as const,
      refId: 'TNM2501-001',
      refType: 'Receipt',
      uploadedBy: 'KTV Lê Văn C',
      uploadedDate: '17/01/2026',
      fileSize: '340 KB',
    },
  ],
  sop: [
    {
      id: 'd9',
      fileName: 'SOP-001 Quy trình lấy mẫu nước.pdf',
      fileType: 'pdf' as const,
      uploadedBy: 'Admin',
      uploadedDate: '01/01/2026',
      fileSize: '2.1 MB',
    },
    {
      id: 'd10',
      fileName: 'ISO 17025-2017 Hướng dẫn áp dụng.pdf',
      fileType: 'pdf' as const,
      uploadedBy: 'Admin',
      uploadedDate: '01/01/2026',
      fileSize: '5.3 MB',
    },
    {
      id: 'd11',
      fileName: 'Quy trình vận hành ICP-MS.pdf',
      fileType: 'pdf' as const,
      uploadedBy: 'Kỹ thuật viên',
      uploadedDate: '10/01/2026',
      fileSize: '1.7 MB',
    },
  ],
  other: [
    {
      id: 'd12',
      fileName: 'Báo cáo tài chính Q4-2025.xlsx',
      fileType: 'excel' as const,
      uploadedBy: 'Kế toán',
      uploadedDate: '05/01/2026',
      fileSize: '450 KB',
    },
  ],
};

const getFileIcon = (fileType: Document['fileType']) => {
  switch (fileType) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'excel':
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    case 'image':
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
};

export function DocumentCenter() {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const DocumentList = ({ documents }: { documents: Document[] }) => (
    <div className="divide-y divide-gray-200">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
            selectedDoc?.id === doc.id ? 'bg-blue-50' : ''
          }`}
          onClick={() => setSelectedDoc(doc)}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">{getFileIcon(doc.fileType)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{doc.fileName}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-600">
                <span>{doc.uploadedBy}</span>
                <span>•</span>
                <span>{doc.uploadedDate}</span>
                <span>•</span>
                <span>{doc.fileSize}</span>
                {doc.refId && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {doc.refType}: {doc.refId}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Trung tâm tài liệu</h1>
              <Button className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Tải lên tài liệu
              </Button>
            </div>

            <Tabs defaultValue="receipt">
              <TabsList className="w-full justify-start flex-wrap h-auto">
                <TabsTrigger value="receipt">
                  Tiếp nhận ({mockDocuments.receipt.length})
                </TabsTrigger>
                <TabsTrigger value="lab">Thử nghiệm ({mockDocuments.lab.length})</TabsTrigger>
                <TabsTrigger value="report">Báo cáo ({mockDocuments.report.length})</TabsTrigger>
                <TabsTrigger value="sop">SOP/Quy trình ({mockDocuments.sop.length})</TabsTrigger>
                <TabsTrigger value="other">Khác ({mockDocuments.other.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="receipt" className="mt-4">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">
                      Tài liệu tiếp nhận
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Phiếu yêu cầu, hợp đồng, email khách hàng
                    </p>
                  </div>
                  <DocumentList documents={mockDocuments.receipt} />
                </div>
              </TabsContent>

              <TabsContent value="lab" className="mt-4">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">
                      Tài liệu thử nghiệm
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Nhật ký thử nghiệm, raw data, sắc ký đồ
                    </p>
                  </div>
                  <DocumentList documents={mockDocuments.lab} />
                </div>
              </TabsContent>

              <TabsContent value="report" className="mt-4">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">
                      Báo cáo & Phiếu kết quả
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Phiếu kết quả bản cứng (scan), bản nháp
                    </p>
                  </div>
                  <DocumentList documents={mockDocuments.report} />
                </div>
              </TabsContent>

              <TabsContent value="sop" className="mt-4">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">
                      SOP & Quy trình
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Tài liệu hướng dẫn, tiêu chuẩn ISO
                    </p>
                  </div>
                  <DocumentList documents={mockDocuments.sop} />
                </div>
              </TabsContent>

              <TabsContent value="other" className="mt-4">
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-medium text-gray-900">
                      Tài liệu khác
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Admin, tài chính, khác
                    </p>
                  </div>
                  <DocumentList documents={mockDocuments.other} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg border p-6 sticky top-6">
            {selectedDoc ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div>{getFileIcon(selectedDoc.fileType)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{selectedDoc.fileName}</h3>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <div className="text-sm text-gray-600">Người tải lên</div>
                    <div className="font-medium text-gray-900">{selectedDoc.uploadedBy}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Ngày tải lên</div>
                    <div className="font-medium text-gray-900">{selectedDoc.uploadedDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Kích thước</div>
                    <div className="font-medium text-gray-900">{selectedDoc.fileSize}</div>
                  </div>
                  {selectedDoc.refId && (
                    <div>
                      <div className="text-sm text-gray-600">Liên kết</div>
                      <Badge variant="outline" className="mt-1">
                        {selectedDoc.refType}: {selectedDoc.refId}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Xem trước
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Tải xuống
                  </Button>
                </div>

                {/* Preview area */}
                <div className="pt-4 border-t">
                  <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[300px] flex items-center justify-center">
                    <div className="text-gray-500">
                      {getFileIcon(selectedDoc.fileType)}
                      <p className="mt-2 text-sm">Xem trước tài liệu</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Chọn tài liệu để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
