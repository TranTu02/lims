import { useState } from 'react';
import { X, Save, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Analysis {
  id: string;
  parameterName: string;
  protocol: string;
  location: string;
  unit: string;
  assignedTo: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed' | 'approved';
}

interface Sample {
  id: string;
  code: string;
  name: string;
  sampleType: string;
  analyses: Analysis[];
}

interface Receipt {
  id: string;
  receiptCode: string;
  customer: string;
  samples: Sample[];
}

interface SampleHandoverModalProps {
  receipt: Receipt;
  onClose: () => void;
  onSave: (handoverData: any) => void;
}

const mockTechnicians = [
  { id: 'tech1', name: 'Nguyễn Văn A', specialty: 'Hóa lý' },
  { id: 'tech2', name: 'Trần Thị B', specialty: 'Kim loại nặng' },
  { id: 'tech3', name: 'Lê Văn C', specialty: 'Vi sinh' },
  { id: 'tech4', name: 'Phạm Thị D', specialty: 'Hóa lý' },
];

export function SampleHandoverModal({ receipt, onClose, onSave }: SampleHandoverModalProps) {
  const [assignments, setAssignments] = useState<{
    [key: string]: { technicianId: string; notes: string };
  }>({});

  const handleAssignmentChange = (analysisId: string, technicianId: string) => {
    setAssignments({
      ...assignments,
      [analysisId]: {
        ...assignments[analysisId],
        technicianId,
      },
    });
  };

  const handleNotesChange = (analysisId: string, notes: string) => {
    setAssignments({
      ...assignments,
      [analysisId]: {
        ...assignments[analysisId],
        notes,
      },
    });
  };

  const handleSave = () => {
    onSave(assignments);
    onClose();
  };

  const getTechnicianName = (techId: string) => {
    const tech = mockTechnicians.find((t) => t.id === techId);
    return tech ? tech.name : '';
  };

  const totalTests = receipt.samples.reduce(
    (acc, sample) => acc + sample.analyses.length,
    0
  );
  const assignedTests = Object.keys(assignments).filter(
    (key) => assignments[key]?.technicianId
  ).length;

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
              Bàn giao mẫu & phép thử
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Phiếu: {receipt.receiptCode} - {receipt.customer}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline">
                Tổng số phép thử: {totalTests}
              </Badge>
              <Badge variant="default" className="bg-green-600">
                Đã bàn giao: {assignedTests}
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Chưa bàn giao: {totalTests - assignedTests}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Lưu bàn giao
            </Button>
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
                      Nơi thực hiện
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Hạn trả
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bàn giao cho KTV
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ghi chú bàn giao
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
                                <span className="font-medium text-gray-900 text-sm">
                                  {sample.code}
                                </span>
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
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {analysis.location}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {analysis.deadline}
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={assignments[analysis.id]?.technicianId || ''}
                              onValueChange={(value) =>
                                handleAssignmentChange(analysis.id, value)
                              }
                            >
                              <SelectTrigger className="w-48 h-9">
                                <SelectValue placeholder="Chọn KTV..." />
                              </SelectTrigger>
                              <SelectContent>
                                {mockTechnicians.map((tech) => (
                                  <SelectItem key={tech.id} value={tech.id}>
                                    <div className="flex items-center justify-between gap-2">
                                      <span>{tech.name}</span>
                                      <Badge variant="outline" className="text-xs ml-2">
                                        {tech.specialty}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {assignments[analysis.id]?.technicianId && (
                              <div className="text-xs text-gray-500 mt-1">
                                Đã giao cho:{' '}
                                {getTechnicianName(assignments[analysis.id].technicianId)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Textarea
                              value={assignments[analysis.id]?.notes || ''}
                              onChange={(e) => handleNotesChange(analysis.id, e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-full min-w-[200px] h-9 text-sm resize-none"
                              rows={1}
                            />
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Assignment */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Bàn giao nhanh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockTechnicians.map((tech) => {
                const assignedCount = Object.values(assignments).filter(
                  (a) => a?.technicianId === tech.id
                ).length;
                return (
                  <div
                    key={tech.id}
                    className="bg-white rounded-lg p-4 border hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{tech.name}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {tech.specialty}
                        </Badge>
                      </div>
                      <Badge variant="default" className="bg-blue-600">
                        {assignedCount}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {assignedCount} phép thử được giao
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
