import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';

interface StoredSample {
  id: string;
  code: string;
  name: string;
  description: string;
  handoverDate: string;
  handoverPerson: string;
  sampleType: string;
  productCategory: string;
  condition: string;
  quantity: number;
  unit: string;
  notes: string;
  parameters: {
    id: string;
    name: string;
    group: string;
    status: string;
    result?: string;
    unit?: string;
    performer?: string;
  }[];
}

const mockStoredSamples: StoredSample[] = [
  {
    id: '1',
    code: 'TNM2501-001-S01',
    name: 'Mẫu nước thải điểm 1',
    description: 'Nước thải công nghiệp từ nhà máy sản xuất',
    handoverDate: '15/01/2026 10:30',
    handoverPerson: 'Nguyễn Văn A',
    sampleType: 'Nước thải',
    productCategory: 'Môi trường',
    condition: 'Bảo quản lạnh',
    quantity: 2,
    unit: 'Lít',
    notes: 'Cần phân tích trong vòng 48h',
    parameters: [
      { id: 'p1', name: 'pH', group: 'Hoá lý cơ bản', status: 'in-progress', result: '7.2', unit: 'pH', performer: 'Trần Văn B' },
      { id: 'p2', name: 'COD', group: 'Ô nhiễm', status: 'pending', unit: 'mg/L', performer: 'Lê Thị C' },
      { id: 'p3', name: 'BOD', group: 'Ô nhiễm', status: 'pending', unit: 'mg/L', performer: 'Nguyễn Văn D' }
    ]
  },
  {
    id: '2',
    code: 'TNM2501-002-S01',
    name: 'Mẫu nước sinh hoạt',
    description: 'Nước máy từ trạm xử lý nước',
    handoverDate: '14/01/2026 14:20',
    handoverPerson: 'Trần Thị B',
    sampleType: 'Nước sạch',
    productCategory: 'Nước uống',
    condition: 'Bảo quản nhiệt độ phòng',
    quantity: 1,
    unit: 'Lít',
    notes: 'Mẫu đạt yêu cầu',
    parameters: [
      { id: 'p4', name: 'Phosphate', group: 'Dinh dưỡng', status: 'completed', result: '0.5', unit: 'mg/L', performer: 'Phạm Văn E' },
      { id: 'p5', name: 'E. coli', group: 'Vi sinh', status: 'in-progress', unit: 'CFU/100mL', performer: 'Hoàng Thị F' }
    ]
  },
  {
    id: '3',
    code: 'TNM2501-003-S01',
    name: 'Mẫu thực phẩm chức năng',
    description: 'Viên uống sâm Hàn Quốc',
    handoverDate: '16/01/2026 09:15',
    handoverPerson: 'Lê Văn C',
    sampleType: 'Thực phẩm chức năng',
    productCategory: 'Dược liệu',
    condition: 'Bảo quản khô ráo',
    quantity: 500,
    unit: 'Gram',
    notes: 'Kiểm tra hàm lượng ginsenoside',
    parameters: [
      { id: 'p6', name: 'Ginsenoside', group: 'Định tính dược liệu', status: 'pending', unit: 'mg/g', performer: 'Võ Văn G' }
    ]
  },
  {
    id: '4',
    code: 'TNM2501-003-S02',
    name: 'Mẫu đất nông nghiệp',
    description: 'Đất canh tác tại vùng ngoại thành',
    handoverDate: '16/01/2026 11:00',
    handoverPerson: 'Phạm Thị D',
    sampleType: 'Đất',
    productCategory: 'Môi trường',
    condition: 'Bảo quản khô',
    quantity: 2,
    unit: 'Kg',
    notes: 'Phân tích kim loại nặng',
    parameters: [
      { id: 'p7', name: 'Cadmium', group: 'Kim loại', status: 'in-progress', result: '0.8', unit: 'mg/kg', performer: 'Đặng Văn H' },
      { id: 'p8', name: 'Lead', group: 'Kim loại', status: 'pending', unit: 'mg/kg', performer: 'Bùi Thị I' }
    ]
  },
  {
    id: '5',
    code: 'TNM2501-004-S01',
    name: 'Mẫu thực phẩm',
    description: 'Thịt gà đông lạnh',
    handoverDate: '17/01/2026 08:45',
    handoverPerson: 'Nguyễn Văn E',
    sampleType: 'Thực phẩm',
    productCategory: 'Thực phẩm tươi sống',
    condition: 'Bảo quản đông lạnh -18°C',
    quantity: 1,
    unit: 'Kg',
    notes: 'Kiểm tra vi sinh',
    parameters: [
      { id: 'p9', name: 'E. coli', group: 'Vi sinh', status: 'completed', result: '<10', unit: 'CFU/g', performer: 'Ngô Văn J' },
      { id: 'p10', name: 'Salmonella', group: 'Vi sinh', status: 'in-progress', unit: 'CFU/25g', performer: 'Lý Thị K' }
    ]
  }
];

export function StoredSamples() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSamples, setExpandedSamples] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const filteredSamples = mockStoredSamples.filter((sample) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      sample.code.toLowerCase().includes(term) ||
      sample.name.toLowerCase().includes(term) ||
      sample.description.toLowerCase().includes(term) ||
      sample.sampleType.toLowerCase().includes(term)
    );
  });

  const toggleExpand = (sampleId: string) => {
    if (expandedSamples.includes(sampleId)) {
      setExpandedSamples(expandedSamples.filter(id => id !== sampleId));
    } else {
      setExpandedSamples([...expandedSamples, sampleId]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-xs">Chờ xử lý</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-500 text-xs">Đang thực hiện</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 text-xs">Hoàn thành</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getConditionBadge = (condition: string) => {
    if (condition.includes('lạnh') || condition.includes('đông')) {
      return <Badge variant="default" className="bg-blue-600 text-xs">{condition}</Badge>;
    }
    return <Badge variant="outline" className="text-xs">{condition}</Badge>;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSamples.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Mẫu lưu</h2>
        <p className="text-sm text-gray-600">
          Danh sách các mẫu đang được lưu trữ và phân tích tại phòng thí nghiệm
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Tổng mẫu lưu</div>
          <div className="text-3xl font-semibold mt-1">{mockStoredSamples.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Đang phân tích</div>
          <div className="text-3xl font-semibold mt-1 text-blue-600">
            {mockStoredSamples.filter(s => s.parameters.some(p => p.status === 'in-progress')).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Hoàn thành</div>
          <div className="text-3xl font-semibold mt-1 text-green-600">
            {mockStoredSamples.filter(s => s.parameters.every(p => p.status === 'completed')).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">Chờ xử lý</div>
          <div className="text-3xl font-semibold mt-1 text-orange-600">
            {mockStoredSamples.filter(s => s.parameters.some(p => p.status === 'pending')).length}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo mã mẫu, tên mẫu, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Samples List */}
      <div className="space-y-3">
        {currentItems.map((sample) => {
          const isExpanded = expandedSamples.includes(sample.id);
          return (
            <div key={sample.id} className="bg-white rounded-lg border overflow-hidden">
              {/* Sample Header */}
              <button
                onClick={() => toggleExpand(sample.id)}
                className="w-full p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 text-left">
                    <div>
                      <div className="text-xs text-gray-500">Mã mẫu</div>
                      <div className="font-medium text-blue-600 text-sm mt-1">{sample.code}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Tên mẫu</div>
                      <div className="text-sm text-gray-900 mt-1">{sample.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Loại mẫu</div>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">{sample.sampleType}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Phân loại</div>
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">{sample.productCategory}</Badge>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Tình trạng</div>
                      <div className="mt-1">
                        {getConditionBadge(sample.condition)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Số lượng</div>
                      <div className="text-sm text-gray-900 mt-1">
                        {sample.quantity} {sample.unit}
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t bg-gray-50 p-4 space-y-4">
                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Mô tả mẫu</div>
                      <div className="text-sm text-gray-900 mt-1">{sample.description}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Ngày bàn giao</div>
                      <div className="text-sm text-gray-900 mt-1">{sample.handoverDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Người bàn giao</div>
                      <div className="text-sm text-gray-900 mt-1">{sample.handoverPerson}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-500">Ghi chú</div>
                      <div className="text-sm text-gray-900 mt-1">{sample.notes}</div>
                    </div>
                  </div>

                  {/* Parameters Table */}
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2">Danh sách chỉ tiêu:</div>
                    <div className="bg-white border rounded-lg overflow-x-auto">
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Chỉ tiêu
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Nhóm chỉ tiêu
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Kết quả
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Đơn vị
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Người thực hiện
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {sample.parameters.map((param) => (
                            <tr key={param.id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-900">{param.name}</td>
                              <td className="px-3 py-2">
                                <Badge variant="secondary" className="text-xs">{param.group}</Badge>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {param.result || '-'}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {param.unit || '-'}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                {param.performer || '-'}
                              </td>
                              <td className="px-3 py-2">{getStatusBadge(param.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          totalItems={filteredSamples.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
