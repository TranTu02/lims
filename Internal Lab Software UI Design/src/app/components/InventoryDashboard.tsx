import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Package, Wrench, FlaskConical, FileText, Search } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import { Alert, AlertDescription } from '@/app/components/ui/alert';

interface Chemical {
  id: string;
  name: string;
  casNo: string;
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  currentStock: number;
  maxCapacity: number;
  unit: string;
  status: 'ok' | 'warning' | 'critical';
}

interface Equipment {
  id: string;
  name: string;
  equipmentCode: string;
  calibrationDate: string;
  nextCalibration: string;
  daysUntilCalibration: number;
  status: 'active' | 'maintenance' | 'overdue';
  location: string;
}

interface Glassware {
  id: string;
  name: string;
  category: string;
  totalStock: number;
  inUse: number;
  broken: number;
  available: number;
}

const mockChemicals: Chemical[] = [
  {
    id: 'c1',
    name: 'H₂SO₄ 98%',
    casNo: '7664-93-9',
    batchNumber: 'L12345',
    expiryDate: '20/12/2026',
    daysUntilExpiry: 336,
    currentStock: 800,
    maxCapacity: 1000,
    unit: 'mL',
    status: 'ok',
  },
  {
    id: 'c2',
    name: 'Methanol HPLC Grade',
    casNo: '67-56-1',
    batchNumber: 'M99887',
    expiryDate: '25/01/2026',
    daysUntilExpiry: 7,
    currentStock: 50,
    maxCapacity: 1000,
    unit: 'mL',
    status: 'critical',
  },
  {
    id: 'c3',
    name: 'HNO₃ 65%',
    casNo: '7697-37-2',
    batchNumber: 'N54321',
    expiryDate: '15/03/2026',
    daysUntilExpiry: 56,
    currentStock: 300,
    maxCapacity: 500,
    unit: 'mL',
    status: 'ok',
  },
  {
    id: 'c4',
    name: 'Acetonitrile HPLC',
    casNo: '75-05-8',
    batchNumber: 'A77889',
    expiryDate: '10/02/2026',
    daysUntilExpiry: 23,
    currentStock: 150,
    maxCapacity: 1000,
    unit: 'mL',
    status: 'warning',
  },
  {
    id: 'c5',
    name: 'Standard Pb 1000ppm',
    casNo: '-',
    batchNumber: 'STD-Pb-001',
    expiryDate: '30/01/2026',
    daysUntilExpiry: 12,
    currentStock: 10,
    maxCapacity: 100,
    unit: 'mL',
    status: 'warning',
  },
];

const mockEquipment: Equipment[] = [
  {
    id: 'e1',
    name: 'ICP-MS Agilent 7900',
    equipmentCode: 'EQ-001',
    calibrationDate: '15/12/2025',
    nextCalibration: '15/06/2026',
    daysUntilCalibration: 148,
    status: 'active',
    location: 'Phòng kim loại nặng',
  },
  {
    id: 'e2',
    name: 'pH Meter Mettler Toledo',
    equipmentCode: 'EQ-015',
    calibrationDate: '10/01/2026',
    nextCalibration: '10/02/2026',
    daysUntilCalibration: 23,
    status: 'active',
    location: 'Phòng hóa lý',
  },
  {
    id: 'e3',
    name: 'HPLC Shimadzu',
    equipmentCode: 'EQ-008',
    calibrationDate: '05/10/2025',
    nextCalibration: '05/01/2026',
    daysUntilCalibration: -13,
    status: 'overdue',
    location: 'Phòng hữu cơ',
  },
  {
    id: 'e4',
    name: 'Cân phân tích Sartorius',
    equipmentCode: 'EQ-022',
    calibrationDate: '20/01/2026',
    nextCalibration: '20/04/2026',
    daysUntilCalibration: 92,
    status: 'active',
    location: 'Phòng chuẩn bị mẫu',
  },
  {
    id: 'e5',
    name: 'Tủ sấy Memmert',
    equipmentCode: 'EQ-030',
    calibrationDate: '01/12/2025',
    nextCalibration: '01/03/2026',
    daysUntilCalibration: 42,
    status: 'maintenance',
    location: 'Phòng vi sinh',
  },
];

const mockGlassware: Glassware[] = [
  {
    id: 'g1',
    name: 'Bình định mức 100mL',
    category: 'Bình định mức',
    totalStock: 50,
    inUse: 15,
    broken: 3,
    available: 32,
  },
  {
    id: 'g2',
    name: 'Pipet 10mL',
    category: 'Pipet',
    totalStock: 30,
    inUse: 8,
    broken: 2,
    available: 20,
  },
  {
    id: 'g3',
    name: 'Beaker 250mL',
    category: 'Cốc thủy tinh',
    totalStock: 40,
    inUse: 12,
    broken: 1,
    available: 27,
  },
  {
    id: 'g4',
    name: 'Erlenmeyer 500mL',
    category: 'Bình tam giác',
    totalStock: 25,
    inUse: 5,
    broken: 0,
    available: 20,
  },
];

export function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('chemicals');
  const [searchTerm, setSearchTerm] = useState('');

  const criticalChemicals = mockChemicals.filter((c) => c.status === 'critical').length;
  const warningChemicals = mockChemicals.filter((c) => c.status === 'warning').length;
  const overdueEquipment = mockEquipment.filter((e) => e.status === 'overdue').length;

  const getStockPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const filteredChemicals = mockChemicals.filter((chemical) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      chemical.name.toLowerCase().includes(term) ||
      chemical.casNo.toLowerCase().includes(term) ||
      chemical.batchNumber.toLowerCase().includes(term)
    );
  });

  const filteredGlassware = mockGlassware.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term)
    );
  });

  const filteredEquipment = mockEquipment.filter((equipment) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      equipment.name.toLowerCase().includes(term) ||
      equipment.equipmentCode.toLowerCase().includes(term) ||
      equipment.location.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý kho & tài sản</h1>
        <p className="text-gray-600 mt-1">Hóa chất, vật tư, thiết bị</p>
      </div>

      {/* Alert Section */}
      {(criticalChemicals > 0 || warningChemicals > 0 || overdueEquipment > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap gap-2">
            {criticalChemicals > 0 && (
              <span>
                Có <strong>{criticalChemicals}</strong> hóa chất sắp hết hạn trong 7 ngày tới!
              </span>
            )}
            {warningChemicals > 0 && (
              <span>
                Có <strong>{warningChemicals}</strong> hóa chất cần lưu ý trong 30 ngày tới.
              </span>
            )}
            {overdueEquipment > 0 && (
              <span>
                Có <strong>{overdueEquipment}</strong> thiết bị quá hạn hiệu chuẩn!
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg border p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo tên, mã, CAS No., vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="chemicals">
            <FlaskConical className="h-4 w-4 mr-2" />
            Hóa chất ({mockChemicals.length})
          </TabsTrigger>
          <TabsTrigger value="glassware">
            <Package className="h-4 w-4 mr-2" />
            Dụng cụ ({mockGlassware.length})
          </TabsTrigger>
          <TabsTrigger value="equipment">
            <Wrench className="h-4 w-4 mr-2" />
            Thiết bị ({mockEquipment.length})
          </TabsTrigger>
          <TabsTrigger value="supplies">
            <FileText className="h-4 w-4 mr-2" />
            Văn phòng phẩm
          </TabsTrigger>
        </TabsList>

        {/* Chemicals Tab */}
        <TabsContent value="chemicals" className="mt-6">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên hóa chất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      CAS No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Lô SX
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hạn dùng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-64">
                      Tồn kho thực tế
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredChemicals.map((chemical) => {
                    const stockPercentage = getStockPercentage(
                      chemical.currentStock,
                      chemical.maxCapacity
                    );
                    return (
                      <tr key={chemical.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{chemical.name}</div>
                          <div className="text-sm text-gray-600">
                            Batch: {chemical.batchNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{chemical.casNo}</td>
                        <td className="px-6 py-4 text-gray-700">{chemical.batchNumber}</td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{chemical.expiryDate}</div>
                          {chemical.status === 'critical' ? (
                            <Badge variant="destructive" className="mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Còn {chemical.daysUntilExpiry} ngày
                            </Badge>
                          ) : chemical.status === 'warning' ? (
                            <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 border-orange-200">
                              Còn {chemical.daysUntilExpiry} ngày
                            </Badge>
                          ) : (
                            <div className="text-sm text-gray-600 mt-1">
                              Còn {chemical.daysUntilExpiry} ngày
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={stockPercentage}
                              className={`flex-1 h-3 ${
                                stockPercentage < 10
                                  ? '[&>div]:bg-red-500'
                                  : stockPercentage < 30
                                  ? '[&>div]:bg-orange-500'
                                  : '[&>div]:bg-green-500'
                              }`}
                            />
                            <span className="text-sm font-medium text-gray-900 w-24 text-right">
                              {chemical.currentStock}/{chemical.maxCapacity} {chemical.unit}
                            </span>
                          </div>
                          {stockPercentage < 10 && (
                            <div className="text-xs text-red-600 mt-1">CẢNH BÁO: Sắp hết!</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Glassware Tab */}
        <TabsContent value="glassware" className="mt-6">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên dụng cụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Danh mục
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Tổng SL
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Đang dùng
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Có sẵn
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Vỡ/Hỏng
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredGlassware.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                      <td className="px-6 py-4 text-gray-700">{item.category}</td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="outline">{item.totalStock}</Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="default" className="bg-blue-500">
                          {item.inUse}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant="default" className="bg-green-500">
                          {item.available}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.broken > 0 ? (
                          <Badge variant="destructive">{item.broken}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="mt-6">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tên thiết bị
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mã TB
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vị trí
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hiệu chuẩn gần nhất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hiệu chuẩn tiếp theo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEquipment.map((equipment) => (
                    <tr key={equipment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{equipment.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{equipment.equipmentCode}</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{equipment.location}</td>
                      <td className="px-6 py-4 text-gray-700">{equipment.calibrationDate}</td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{equipment.nextCalibration}</div>
                        {equipment.daysUntilCalibration < 0 ? (
                          <Badge variant="destructive" className="mt-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Quá hạn {Math.abs(equipment.daysUntilCalibration)} ngày
                          </Badge>
                        ) : equipment.daysUntilCalibration < 30 ? (
                          <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 border-orange-200">
                            Còn {equipment.daysUntilCalibration} ngày
                          </Badge>
                        ) : (
                          <div className="text-sm text-gray-600 mt-1">
                            Còn {equipment.daysUntilCalibration} ngày
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {equipment.status === 'active' ? (
                          <Badge variant="default" className="bg-green-500 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Đang hoạt động
                          </Badge>
                        ) : equipment.status === 'maintenance' ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Đang bảo trì
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Quá hạn hiệu chuẩn</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Supplies Tab */}
        <TabsContent value="supplies" className="mt-6">
          <div className="bg-white rounded-lg border p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Quản lý văn phòng phẩm sẽ hiển thị ở đây</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}