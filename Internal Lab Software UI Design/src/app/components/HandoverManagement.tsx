import { useState } from 'react';
import { Scan, CheckCircle, Printer, FileDown } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

interface Analysis {
  id: string;
  parameterName: string;
  protocol: string;
  location: string;
  unit: string;
  deadline: string;
  status: string;
}

interface Sample {
  id: string;
  code: string;
  name: string;
  sampleType: string;
  receivedCondition: string;
  storageCondition: string;
  analyses: Analysis[];
}

interface HandoverRecord {
  testerCode: string;
  testerName: string;
  sampleCode: string;
  sample: Sample;
  handoverDate: string;
}

const mockSamples: Record<string, Sample> = {
  'TNM2501-001-S01': {
    id: 's1',
    code: 'TNM2501-001-S01',
    name: 'Mẫu nước thải điểm 1',
    sampleType: 'Nước thải',
    receivedCondition: 'Đạt yêu cầu',
    storageCondition: 'Lạnh (4°C)',
    analyses: [
      {
        id: 'a1',
        parameterName: 'pH',
        protocol: 'ISO 11888-1',
        location: 'Lab 1',
        unit: 'pH',
        deadline: '16/01/2026',
        status: 'pending'
      },
      {
        id: 'a2',
        parameterName: 'COD',
        protocol: 'ISO 6060',
        location: 'Lab 2',
        unit: 'mg/L',
        deadline: '17/01/2026',
        status: 'pending'
      },
      {
        id: 'a3',
        parameterName: 'BOD',
        protocol: 'ISO 5815',
        location: 'Lab 3',
        unit: 'mg/L',
        deadline: '18/01/2026',
        status: 'pending'
      }
    ]
  }
};

const mockTesters: Record<string, string> = {
  'KTV001': 'Nguyễn Văn A',
  'KTV002': 'Trần Thị B',
  'KTV003': 'Lê Văn C'
};

export function HandoverManagement() {
  const [testerCode, setTesterCode] = useState('');
  const [sampleCode, setSampleCode] = useState('');
  const [handoverData, setHandoverData] = useState<HandoverRecord | null>(null);
  const [showHandoverDocument, setShowHandoverDocument] = useState(false);
  const [handoverDocument, setHandoverDocument] = useState({
    title: 'BIÊN BẢN BÀN GIAO MẪU THỬ',
    date: new Date().toLocaleDateString('vi-VN'),
    content: ''
  });

  const handleScanTester = () => {
    // Simulate QR scan
    const testerName = mockTesters[testerCode];
    if (testerName) {
      console.log('Tester found:', testerName);
    } else {
      alert('Không tìm thấy kiểm nghiệm viên');
    }
  };

  const handleScanSample = () => {
    // Simulate QR scan
    const sample = mockSamples[sampleCode];
    const testerName = mockTesters[testerCode];
    
    if (!testerName) {
      alert('Vui lòng quét mã kiểm nghiệm viên trước');
      return;
    }
    
    if (sample) {
      setHandoverData({
        testerCode,
        testerName,
        sampleCode,
        sample,
        handoverDate: new Date().toLocaleString('vi-VN')
      });
      
      // Generate handover document content
      const content = `
Căn cứ quy trình quản lý mẫu thử của Phòng thí nghiệm;
Căn cứ vào nhu cầu thực tế công việc;

Hôm nay, ngày ${new Date().toLocaleDateString('vi-VN')}, tại Phòng thí nghiệm, chúng tôi gồm:

BÊN GIAO (Người quản lý mẫu):
- Họ và tên: [Người quản lý mẫu]
- Chức vụ: Quản lý mẫu

BÊN NHẬN (Kiểm nghiệm viên):
- Họ và tên: ${testerName}
- Mã KTV: ${testerCode}

Cùng thống nhất bàn giao mẫu thử như sau:

I. THÔNG TIN MẪU THỬ:
- Mã mẫu: ${sample.code}
- Tên mẫu: ${sample.name}
- Loại mẫu: ${sample.sampleType}
- Tình trạng tiếp nhận: ${sample.receivedCondition}
- Điều kiện bảo quản: ${sample.storageCondition}

II. DANH SÁCH PHÉP THỬ CẦN THỰC HIỆN:
${sample.analyses.map((a, idx) => `${idx + 1}. ${a.parameterName} (${a.protocol}) - Vị trí: ${a.location} - Hạn: ${a.deadline}`).join('\n')}

III. CAM KẾT:
- Bên nhận cam kết thực hiện các phép thử theo đúng phương pháp quy định
- Bên nhận cam kết bảo quản mẫu đúng quy định trong quá trình thực hiện
- Bên nhận cam kết hoàn thành đúng thời hạn đã cam kết

Biên bản được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.
      `.trim();
      
      setHandoverDocument({
        ...handoverDocument,
        content
      });
    } else {
      alert('Không tìm thấy mẫu thử');
    }
  };

  const handleConfirmHandover = () => {
    setShowHandoverDocument(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    console.log('Exporting to PDF...');
    alert('Chức năng xuất PDF đang được phát triển');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bàn giao mẫu - phép thử</h2>
        <p className="text-sm text-gray-600">
          Quét mã kiểm nghiệm viên và mã mẫu để thực hiện bàn giao
        </p>
      </div>

      {/* Scan Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tester Scan */}
        <div className="bg-white rounded-lg border p-6">
          <Label className="text-sm text-gray-600 mb-2 block">Quét mã kiểm nghiệm viên</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Quét hoặc nhập mã KTV..."
                value={testerCode}
                onChange={(e) => setTesterCode(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleScanTester()}
              />
            </div>
            <Button onClick={handleScanTester} variant="outline">
              <Scan className="h-4 w-4" />
            </Button>
          </div>
          {testerCode && mockTesters[testerCode] && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">{mockTesters[testerCode]}</div>
                  <div className="text-sm text-gray-600">Mã: {testerCode}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sample Scan */}
        <div className="bg-white rounded-lg border p-6">
          <Label className="text-sm text-gray-600 mb-2 block">Quét mã mẫu thử</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Quét hoặc nhập mã mẫu..."
                value={sampleCode}
                onChange={(e) => setSampleCode(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleScanSample()}
              />
            </div>
            <Button onClick={handleScanSample} variant="outline">
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Handover Information */}
      {handoverData && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b bg-blue-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              Thông tin bàn giao
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Handover Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Kiểm nghiệm viên</Label>
                <div className="mt-1 font-medium text-gray-900">{handoverData.testerName}</div>
                <div className="text-sm text-gray-600">Mã: {handoverData.testerCode}</div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Thời gian bàn giao</Label>
                <div className="mt-1 font-medium text-gray-900">{handoverData.handoverDate}</div>
              </div>
            </div>

            {/* Sample Information */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Thông tin mẫu thử</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Mã mẫu</Label>
                    <div className="mt-1 font-medium text-blue-600">{handoverData.sample.code}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Tên mẫu</Label>
                    <div className="mt-1 text-gray-900">{handoverData.sample.name}</div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Loại mẫu</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{handoverData.sample.sampleType}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Tình trạng tiếp nhận</Label>
                    <div className="mt-1 text-gray-900">{handoverData.sample.receivedCondition}</div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm text-gray-600">Điều kiện bảo quản</Label>
                    <div className="mt-1 text-gray-900">{handoverData.sample.storageCondition}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analyses to Perform */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Danh sách phép thử cần thực hiện</h4>
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chỉ tiêu</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phương pháp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vị trí</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn vị</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn trả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {handoverData.sample.analyses.map((analysis, index) => (
                      <tr key={analysis.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {analysis.parameterName}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{analysis.protocol}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{analysis.location}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{analysis.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{analysis.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="flex items-center justify-end">
              <Button onClick={handleConfirmHandover} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Xác nhận bàn giao
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Handover Document Modal */}
      {showHandoverDocument && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowHandoverDocument(false)}></div>
          <div className="fixed inset-4 bg-white rounded-lg shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Biên bản bàn giao</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Xem trước và xuất biên bản bàn giao mẫu thử
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  In
                </Button>
                <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
                  <FileDown className="h-4 w-4" />
                  Xuất PDF
                </Button>
                <Button variant="ghost" onClick={() => setShowHandoverDocument(false)}>
                  Đóng
                </Button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto bg-white border rounded-lg p-8 space-y-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">{handoverDocument.title}</h1>
                  <p className="text-sm text-gray-600 mt-2">Ngày {handoverDocument.date}</p>
                </div>
                <Textarea
                  value={handoverDocument.content}
                  onChange={(e) => setHandoverDocument({ ...handoverDocument, content: e.target.value })}
                  className="min-h-[600px] font-mono text-sm"
                />
                <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">BÊN GIAO</div>
                    <div className="text-sm text-gray-600 mt-1">(Ký, ghi rõ họ tên)</div>
                    <div className="mt-20 border-t border-gray-300 pt-2">
                      <div className="text-sm text-gray-700">[Người quản lý mẫu]</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">BÊN NHẬN</div>
                    <div className="text-sm text-gray-600 mt-1">(Ký, ghi rõ họ tên)</div>
                    <div className="mt-20 border-t border-gray-300 pt-2">
                      <div className="text-sm text-gray-700">{handoverData?.testerName}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
