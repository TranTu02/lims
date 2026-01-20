import { useState } from 'react';
import { Search, Plus, FileText, X, Download, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Pagination } from '@/app/components/ui/pagination';

interface Protocol {
  protocolId: string;
  protocolCode: string;
  protocolSource: string;
  protocolAccreditation: {
    VILAS?: boolean;
    TDC?: boolean;
  };
  description?: string;
  executionGuide?: string;
  executionTime?: string;
  equipment?: string[];
  chemicals?: string[];
  applicableTests?: string[];
  relatedFiles?: {
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize: string;
  }[];
  // Audit fields
  createdAt?: string;
  createdById?: string;
}

interface Matrix {
  matrixId: string;
  parameterId?: string;
  protocolId?: string;
  sampleTypeId: string;
  protocolCode: string;
  protocolSource?: string;
  protocolAccreditation?: {
    VILAS?: boolean;
    TDC?: boolean;
  };
  parameterName: string;
  sampleTypeName: string;
  feeBeforeTax: number;
  taxRate: number;
  feeAfterTax: number;
  LOD?: string;
  LOQ?: string;
  thresholdLimit?: string;
  turnaroundTime?: number;
  technicianGroupId?: string;
}

interface Parameter {
  parameterId: string;
  parameterName: string;
  parameterNameEn?: string;
  parameterGroup?: string;
  displayStyle?: {
    decimalPlaces?: number;
    format?: string;
  };
  technicianAlias?: string;
  matrices: Matrix[];
  // Audit fields
  createdAt?: string;
  createdById?: string;
}

// Generate mock protocols (25 items)
const generateProtocols = (): Protocol[] => {
  const groups = ['Hoá lý cơ bản', 'Kim loại', 'Vi sinh', 'Hữu cơ', 'Anion', 'Dinh dưỡng'];
  const protocols: Protocol[] = [];
  
  const protocolData = [
    { code: 'TCVN 6492:2011', name: 'Chất lượng nước - Xác định pH', group: 'Hoá lý cơ bản' },
    { code: 'SMEWW 3125B', name: 'Metals by ICP-MS', group: 'Kim loại' },
    { code: 'TCVN 6187-2:2009', name: 'Vi sinh vật trong nước - E.coli', group: 'Vi sinh' },
    { code: 'SMEWW 5220C', name: 'Chemical Oxygen Demand (COD)', group: 'Hữu cơ' },
    { code: 'SMEWW 5210B', name: 'Biochemical Oxygen Demand (BOD)', group: 'Hữu cơ' },
    { code: 'TCVN 6194:1996', name: 'Xác định tổng chất rắn lơ lửng (TSS)', group: 'Hoá lý cơ bản' },
    { code: 'SMEWW 2540D', name: 'Total Suspended Solids', group: 'Hoá lý cơ bản' },
    { code: 'TCVN 6185:2015', name: 'Xác định nitrate (NO3-)', group: 'Anion' },
    { code: 'SMEWW 4500-NH3', name: 'Nitrogen Ammonia', group: 'Dinh dưỡng' },
    { code: 'TCVN 6202:2008', name: 'Xác định phosphate (PO4 3-)', group: 'Dinh dưỡng' },
    { code: 'EPA 7196', name: 'Chromium, Hexavalent', group: 'Kim loại' },
    { code: 'SMEWW 3111B', name: 'Arsenic by ICP-MS', group: 'Kim loại' },
    { code: 'TCVN 6193:1996', name: 'Xác định độ đục', group: 'Hoá lý cơ bản' },
    { code: 'SMEWW 2130B', name: 'Turbidity', group: 'Hoá lý cơ bản' },
    { code: 'TCVN 6186-1:2009', name: 'Coliform tổng số', group: 'Vi sinh' },
    { code: 'SMEWW 9221B', name: 'Fecal Coliform', group: 'Vi sinh' },
    { code: 'TCVN 6222:2011', name: 'Xác định sulfate (SO4 2-)', group: 'Anion' },
    { code: 'SMEWW 4500-Cl', name: 'Chloride', group: 'Anion' },
    { code: 'EPA 8260B', name: 'Volatile Organic Compounds', group: 'Hữu cơ' },
    { code: 'SMEWW 5310B', name: 'Total Organic Carbon (TOC)', group: 'Hữu cơ' },
    { code: 'TCVN 6000:1995', name: 'Độ dẫn điện', group: 'Hoá lý cơ bản' },
    { code: 'SMEWW 2510B', name: 'Conductivity', group: 'Hoá lý cơ bản' },
    { code: 'EPA 7470A', name: 'Mercury by CVAA', group: 'Kim loại' },
    { code: 'TCVN 9595:2013', name: 'Xác định cyanide', group: 'Anion' },
    { code: 'SMEWW 4500-CN', name: 'Cyanide', group: 'Anion' },
  ];
  
  protocolData.forEach((data, index) => {
    protocols.push({
      protocolId: `p${index + 1}`,
      protocolCode: data.code,
      protocolSource: 'TCVN',
      protocolAccreditation: {
        VILAS: true,
        TDC: true,
      },
      description: `Phương pháp xác định ${data.name.toLowerCase()}`,
      executionGuide: `1. Chuẩn bị mẫu\n2. Tiến hành phân tích\n3. Đọc kết quả\n4. Ghi nhận và tính toán`,
      executionTime: `${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 2) + 2} giờ`,
      equipment: ['Thiết bị chính', 'Dụng cụ phụ trợ', 'Máy tính'],
      chemicals: ['Hóa chất A', 'Hóa chất B', 'Dung dịch chuẩn'],
      applicableTests: ['Nước thải', 'Nước mặt', 'Nước ngầm'],
      relatedFiles: [
        { fileId: `f${index * 2 + 1}`, fileName: `${data.code}.pdf`, mimeType: 'application/pdf', fileSize: '1.2 MB' },
        { fileId: `f${index * 2 + 2}`, fileName: `QT-${index + 1}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileSize: '450 KB' }
      ]
    });
  });
  
  return protocols;
};

// Generate mock parameters (30 items)
const generateParameters = (): Parameter[] => {
  const groups = ['Hoá lý cơ bản', 'Kim loại', 'Vi sinh', 'Hữu cơ', 'Anion', 'Dinh dưỡng'];
  const parameters: Parameter[] = [];
  
  const parameterData = [
    { code: 'PAR-001', name: 'pH', nameEn: 'pH', group: 'Hoá lý cơ bản', protocol: 'TCVN 6492:2011' },
    { code: 'PAR-002', name: 'COD', nameEn: 'Chemical Oxygen Demand', group: 'Hữu cơ', protocol: 'SMEWW 5220C' },
    { code: 'PAR-003', name: 'BOD5', nameEn: 'Biochemical Oxygen Demand', group: 'Hữu cơ', protocol: 'SMEWW 5210B' },
    { code: 'PAR-004', name: 'TSS', nameEn: 'Total Suspended Solids', group: 'Hoá lý cơ bản', protocol: 'SMEWW 2540D' },
    { code: 'PAR-005', name: 'Độ đục', nameEn: 'Turbidity', group: 'Hoá lý cơ bản', protocol: 'SMEWW 2130B' },
    { code: 'PAR-006', name: 'Độ dẫn điện', nameEn: 'Conductivity', group: 'Hoá lý cơ bản', protocol: 'SMEWW 2510B' },
    { code: 'PAR-007', name: 'Nitrate', nameEn: 'Nitrate (NO3-)', group: 'Anion', protocol: 'TCVN 6185:2015' },
    { code: 'PAR-008', name: 'Amoni', nameEn: 'Ammonia (NH3)', group: 'Dinh dưỡng', protocol: 'SMEWW 4500-NH3' },
    { code: 'PAR-009', name: 'Phosphate', nameEn: 'Phosphate (PO4 3-)', group: 'Dinh dưỡng', protocol: 'TCVN 6202:2008' },
    { code: 'PAR-010', name: 'Sulfate', nameEn: 'Sulfate (SO4 2-)', group: 'Anion', protocol: 'TCVN 6222:2011' },
    { code: 'PAR-011', name: 'Chloride', nameEn: 'Chloride (Cl-)', group: 'Anion', protocol: 'SMEWW 4500-Cl' },
    { code: 'PAR-012', name: 'Cyanide', nameEn: 'Cyanide (CN-)', group: 'Anion', protocol: 'SMEWW 4500-CN' },
    { code: 'PAR-013', name: 'Lead', nameEn: 'Lead (Pb)', group: 'Kim loại', protocol: 'SMEWW 3125B' },
    { code: 'PAR-014', name: 'Cadmium', nameEn: 'Cadmium (Cd)', group: 'Kim loại', protocol: 'SMEWW 3125B' },
    { code: 'PAR-015', name: 'Arsenic', nameEn: 'Arsenic (As)', group: 'Kim loại', protocol: 'SMEWW 3111B' },
    { code: 'PAR-016', name: 'Mercury', nameEn: 'Mercury (Hg)', group: 'Kim loại', protocol: 'EPA 7470A' },
    { code: 'PAR-017', name: 'Chromium VI', nameEn: 'Chromium Hexavalent', group: 'Kim loại', protocol: 'EPA 7196' },
    { code: 'PAR-018', name: 'Copper', nameEn: 'Copper (Cu)', group: 'Kim loại', protocol: 'SMEWW 3125B' },
    { code: 'PAR-019', name: 'Zinc', nameEn: 'Zinc (Zn)', group: 'Kim loại', protocol: 'SMEWW 3125B' },
    { code: 'PAR-020', name: 'Iron', nameEn: 'Iron (Fe)', group: 'Kim loại', protocol: 'SMEWW 3125B' },
    { code: 'PAR-021', name: 'E.coli', nameEn: 'Escherichia coli', group: 'Vi sinh', protocol: 'TCVN 6187-2:2009' },
    { code: 'PAR-022', name: 'Coliform tổng số', nameEn: 'Total Coliform', group: 'Vi sinh', protocol: 'TCVN 6186-1:2009' },
    { code: 'PAR-023', name: 'Coliform phân', nameEn: 'Fecal Coliform', group: 'Vi sinh', protocol: 'SMEWW 9221B' },
    { code: 'PAR-024', name: 'TOC', nameEn: 'Total Organic Carbon', group: 'Hữu cơ', protocol: 'SMEWW 5310B' },
    { code: 'PAR-025', name: 'VOC', nameEn: 'Volatile Organic Compounds', group: 'Hữu cơ', protocol: 'EPA 8260B' },
    { code: 'PAR-026', name: 'Dầu mỡ', nameEn: 'Oil & Grease', group: 'Hữu cơ', protocol: 'SMEWW 5520B' },
    { code: 'PAR-027', name: 'Phenol', nameEn: 'Phenol', group: 'Hữu cơ', protocol: 'SMEWW 5530C' },
    { code: 'PAR-028', name: 'Nickel', nameEn: 'Nickel (Ni)', group: 'Kim loại', protocol: 'SMEWW 3125B' },
    { code: 'PAR-029', name: 'Manganese', nameEn: 'Manganese (Mn)', group: 'Kim loại', protocol: 'SMEWW 3125B' },
    { code: 'PAR-030', name: 'Fluoride', nameEn: 'Fluoride (F-)', group: 'Anion', protocol: 'SMEWW 4500-F' },
  ];
  
  parameterData.forEach((data, index) => {
    const sampleTypes = ['Nước thải', 'Nước mặt', 'Nước ngầm', 'Nước sinh hoạt'];
    const matrices: Matrix[] = sampleTypes.slice(0, Math.floor(Math.random() * 3) + 2).map((type, idx) => ({
      matrixId: `m${index * 10 + idx + 1}`,
      parameterId: data.code,
      protocolId: `p${index + 1}`,
      sampleTypeId: `ST-${index * 10 + idx + 1}`,
      protocolCode: data.protocol,
      protocolSource: 'TCVN',
      protocolAccreditation: {
        VILAS: true,
        TDC: true,
      },
      parameterName: data.name,
      sampleTypeName: type,
      feeBeforeTax: Math.floor(Math.random() * 500000) + 50000,
      taxRate: 10,
      feeAfterTax: Math.floor(Math.random() * 500000) + 50000,
      LOD: (Math.random() * 0.1).toFixed(3),
      LOQ: (Math.random() * 0.5).toFixed(3),
      thresholdLimit: (Math.random() * 1).toFixed(3),
      turnaroundTime: Math.floor(Math.random() * 5) + 1,
      technicianGroupId: `TG-${index * 10 + idx + 1}`,
    }));
    
    parameters.push({
      parameterId: `${index + 1}`,
      parameterName: data.name,
      parameterNameEn: data.nameEn,
      parameterGroup: data.group,
      displayStyle: {
        decimalPlaces: 2,
        format: '0.00',
      },
      technicianAlias: `TA-${index + 1}`,
      matrices,
    });
  });
  
  return parameters;
};

const mockProtocols = generateProtocols();
const mockParameters = generateParameters();

interface LibraryDashboardProps {
  viewType: 'parameters' | 'protocols';
}

export function LibraryDashboard({ viewType }: LibraryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);
  const [protocolToView, setProtocolToView] = useState<Protocol | null>(null);
  const [expandedMatrix, setExpandedMatrix] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const groups = ['all', ...Array.from(new Set(mockParameters.map(p => p.parameterGroup)))];
  
  const filteredParameters = mockParameters.filter(param => {
    const matchesSearch = param.parameterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         param.parameterNameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || param.parameterGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });
  
  const filteredProtocols = mockProtocols.filter(protocol => {
    const matchesSearch = protocol.protocolCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (protocol.description && protocol.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Calculate pagination
  const totalItems = viewType === 'parameters' ? filteredParameters.length : filteredProtocols.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const paginatedParameters = filteredParameters.slice(startIndex, endIndex);
  const paginatedProtocols = filteredProtocols.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setCurrentPage(1);
    // itemsPerPage would be updated here
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {viewType === 'parameters' ? 'Danh sách chỉ tiêu' : 'Danh sách phương pháp'}
            </h1>
            <p className="text-sm text-gray-600 mt-0.5">
              {viewType === 'parameters' 
                ? `Tổng số: ${filteredParameters.length} chỉ tiêu` 
                : `Tổng số: ${filteredProtocols.length} phương pháp`}
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm mới
          </Button>
        </div>
        
        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={viewType === 'parameters' ? 'Tìm kiếm chỉ tiêu...' : 'Tìm kiếm phương pháp...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả nhóm</option>
            {groups.slice(1).map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {viewType === 'parameters' ? (
        <div className="flex gap-4">
          {/* Parameters List */}
          <div className="flex-1 bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mã
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên chỉ tiêu
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên tiếng Anh
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nhóm
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Số lượng Matrix
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedParameters.map((param) => (
                    <tr
                      key={param.parameterId}
                      onClick={() => setSelectedParameter(param)}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedParameter?.parameterId === param.parameterId ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {param.parameterId}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {param.parameterName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {param.parameterNameEn}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">
                          {param.parameterGroup}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {param.matrices.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="border-t p-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>

          {/* Parameter Detail */}
          {selectedParameter && (
            <div className="w-96 bg-white rounded-lg border p-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedParameter.parameterName}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {selectedParameter.parameterNameEn}
                </p>
                <div className="mt-2 flex gap-2">
                  <Badge variant="secondary">{selectedParameter.parameterGroup}</Badge>
                  <Badge variant="outline">{selectedParameter.parameterId}</Badge>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Matrices ({selectedParameter.matrices.length})
                </div>
                <div className="space-y-2">
                  {selectedParameter.matrices.map((matrix) => (
                    <div key={matrix.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedMatrix(expandedMatrix === matrix.id ? null : matrix.id)}
                        className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {matrix.sampleTypeName}
                          </div>
                          <div className="text-xs text-gray-600 mt-0.5">
                            {matrix.unit}
                          </div>
                        </div>
                        {expandedMatrix === matrix.id ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {expandedMatrix === matrix.id && (
                        <div className="px-3 py-2 space-y-2 bg-white border-t">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-gray-500">Mã Matrix</div>
                              <div className="font-medium text-gray-900">{matrix.matrixId}</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Phí sau thuế</div>
                              <div className="font-medium text-gray-900">
                                {matrix.feeAfterTax.toLocaleString('vi-VN')} đ
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">LOD</div>
                              <div className="font-medium text-gray-900">
                                {matrix.lod?.toFixed(3)} {matrix.unit}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-500">LOQ</div>
                              <div className="font-medium text-gray-900">
                                {matrix.loq?.toFixed(3)} {matrix.unit}
                              </div>
                            </div>
                          </div>
                          <div className="pt-2 border-t">
                            <button
                              onClick={() => {
                                const protocol = mockProtocols.find(p => p.code === matrix.protocolCode);
                                if (protocol) setProtocolToView(protocol);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {matrix.protocolCode} - {matrix.protocolName}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Protocols Table */
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã phương pháp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tên phương pháp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nhóm
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian thực hiện
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số file đính kèm
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedProtocols.map((protocol) => (
                  <tr key={protocol.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {protocol.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{protocol.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{protocol.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {protocol.group}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {protocol.executionTime}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {protocol.relatedFiles.length} file
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Xem chi tiết"
                          onClick={() => setProtocolToView(protocol)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="border-t p-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </div>
      )}

      {/* Protocol Detail Modal */}
      {protocolToView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{protocolToView.name}</h2>
                <p className="text-sm text-gray-600 mt-0.5">{protocolToView.code}</p>
              </div>
              <button
                onClick={() => setProtocolToView(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Thông tin chung</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Nhóm phương pháp</div>
                    <Badge variant="secondary" className="mt-1">
                      {protocolToView.group}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Thời gian thực hiện</div>
                    <div className="text-sm text-gray-900 mt-1">{protocolToView.executionTime}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Mô tả</div>
                <p className="text-sm text-gray-600">{protocolToView.description}</p>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Hướng dẫn thực hiện</div>
                <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-lg">
                  {protocolToView.executionGuide}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Thiết bị cần thiết</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {protocolToView.equipment.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Hóa chất</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {protocolToView.chemicals.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-gray-400">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Tài liệu đính kèm ({protocolToView.relatedFiles.length})
                </div>
                <div className="space-y-2">
                  {protocolToView.relatedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          <div className="text-xs text-gray-500">{file.type} • {file.size}</div>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}