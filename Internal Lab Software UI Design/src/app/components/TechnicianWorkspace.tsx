import { useState } from 'react';
import { FileText, Edit, Send, FileQuestion, Search } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Pagination } from '@/app/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Textarea } from '@/app/components/ui/textarea';

interface Task {
  id: string;
  sampleCode: string;
  parameterName: string;
  receivedDate: string;
  protocol: string;
  resultValue: string;
  unit: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'waiting-approval' | 'redo';
  notes: string;
}

const mockTasks: Task[] = [
  {
    id: 't1',
    sampleCode: 'TNM2501-001-S01',
    parameterName: 'pH',
    receivedDate: '16/01/2026',
    protocol: 'TCVN 6492:2011',
    resultValue: '',
    unit: '-',
    assignedTo: 'Nguyễn Văn A',
    status: 'pending',
    notes: '',
  },
  {
    id: 't2',
    sampleCode: 'TNM2501-001-S02',
    parameterName: 'COD',
    receivedDate: '16/01/2026',
    protocol: 'SMEWW 5220C',
    resultValue: '',
    unit: 'mg/L',
    assignedTo: 'Nguyễn Văn A',
    status: 'pending',
    notes: '',
  },
  {
    id: 't3',
    sampleCode: 'TNM2501-003-S01',
    parameterName: 'Pb',
    receivedDate: '17/01/2026',
    protocol: 'SMEWW 3125B',
    resultValue: '',
    unit: 'mg/L',
    assignedTo: 'Nguyễn Văn A',
    status: 'pending',
    notes: '',
  },
];

const mockWaitingApprovalTasks: Task[] = [
  {
    id: 'tw1',
    sampleCode: 'TNM2501-002-S01',
    parameterName: 'E.Coli',
    receivedDate: '15/01/2026',
    protocol: 'TCVN 6187-2:2009',
    resultValue: '<3',
    unit: 'MPN/100mL',
    assignedTo: 'Nguyễn Văn A',
    status: 'waiting-approval',
    notes: 'Kết quả đạt tiêu chuẩn',
  },
  {
    id: 'tw2',
    sampleCode: 'TNM2501-001-S03',
    parameterName: 'TSS',
    receivedDate: '16/01/2026',
    protocol: 'SMEWW 2540D',
    resultValue: '45',
    unit: 'mg/L',
    assignedTo: 'Nguyễn Văn A',
    status: 'waiting-approval',
    notes: '',
  },
];

const mockRedoTasks: Task[] = [
  {
    id: 'tr1',
    sampleCode: 'TNM2501-001-S01',
    parameterName: 'BOD5',
    receivedDate: '15/01/2026',
    protocol: 'SMEWW 5210B',
    resultValue: '125',
    unit: 'mg/L',
    assignedTo: 'Nguyễn Văn A',
    status: 'redo',
    notes: 'Kết quả vượt ngưỡng, yêu cầu thực hiện lại để xác nhận',
  },
];

export function TechnicianWorkspace() {
  const [tasks, setTasks] = useState(mockTasks);
  const [activeTab, setActiveTab] = useState('todo');
  const [searchTerm, setSearchTerm] = useState('');

  const handleResultChange = (taskId: string, value: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, resultValue: value } : task
      )
    );
  };

  const handleNotesChange = (taskId: string, value: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, notes: value } : task
      )
    );
  };

  const TaskTable = ({ tasks, showResult = false }: { tasks: Task[]; showResult?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Mã mẫu
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Tên chỉ tiêu
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Ngày nhận bàn giao
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Phương pháp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Kết quả
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Đơn vị
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Người phụ trách
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Ghi chú
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900 text-sm">
                {task.sampleCode}
              </td>
              <td className="px-4 py-3 text-gray-700 text-sm">
                {task.parameterName}
              </td>
              <td className="px-4 py-3 text-gray-700 text-sm">
                {task.receivedDate}
              </td>
              <td className="px-4 py-3 text-gray-700 text-sm">
                {task.protocol}
              </td>
              <td className="px-4 py-3">
                {showResult ? (
                  <span className="text-gray-900 font-medium text-sm">
                    {task.resultValue}
                  </span>
                ) : (
                  <Input
                    type="text"
                    value={task.resultValue}
                    onChange={(e) => handleResultChange(task.id, e.target.value)}
                    placeholder="Nhập KQ"
                    className="w-24 h-8 text-sm"
                  />
                )}
              </td>
              <td className="px-4 py-3 text-gray-700 text-sm">
                {task.unit}
              </td>
              <td className="px-4 py-3 text-gray-700 text-sm">
                {task.assignedTo}
              </td>
              <td className="px-4 py-3">
                {task.status === 'pending' ? (
                  <Badge variant="outline" className="text-xs">
                    Chưa thực hiện
                  </Badge>
                ) : task.status === 'in-progress' ? (
                  <Badge variant="default" className="bg-blue-500 text-xs">
                    Đang thực hiện
                  </Badge>
                ) : task.status === 'waiting-approval' ? (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                    Chờ duyệt
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Thực hiện lại
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 max-w-xs">
                {showResult ? (
                  <span className="text-sm text-gray-600 line-clamp-2">
                    {task.notes || '-'}
                  </span>
                ) : (
                  <Textarea
                    value={task.notes}
                    onChange={(e) => handleNotesChange(task.id, e.target.value)}
                    placeholder="Ghi chú..."
                    className="w-full min-w-[150px] h-8 text-sm resize-none"
                    rows={1}
                  />
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Xem chi tiết"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  {!showResult && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                        title="Gửi yêu cầu duyệt"
                        disabled={!task.resultValue}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {task.status === 'redo' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                      title="Gửi yêu cầu"
                    >
                      <FileQuestion className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Workbench</h1>
        <p className="text-gray-600 mt-1">KTV: Nguyễn Văn A</p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Tổng công việc:</div>
            <Badge variant="outline" className="text-base">
              {tasks.length + mockWaitingApprovalTasks.length + mockRedoTasks.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Chưa thực hiện:</div>
            <Badge variant="default" className="text-base bg-orange-500">
              {tasks.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Chờ duyệt:</div>
            <Badge variant="outline" className="text-base bg-yellow-50 text-yellow-700 border-yellow-200">
              {mockWaitingApprovalTasks.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">Thực hiện lại:</div>
            <Badge variant="destructive" className="text-base">
              {mockRedoTasks.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="todo">Chưa thực hiện ({tasks.length})</TabsTrigger>
            <TabsTrigger value="waiting">Chờ duyệt ({mockWaitingApprovalTasks.length})</TabsTrigger>
            <TabsTrigger value="redo">Thực hiện lại ({mockRedoTasks.length})</TabsTrigger>
          </TabsList>
          
          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã mẫu, chỉ tiêu, phương pháp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <TabsContent value="todo" className="mt-0">
          <div className="bg-white rounded-lg border overflow-hidden">
            <TaskTable tasks={tasks} />
            <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
          </div>
        </TabsContent>

        <TabsContent value="waiting" className="mt-0">
          <div className="bg-white rounded-lg border overflow-hidden">
            <TaskTable tasks={mockWaitingApprovalTasks} showResult={true} />
            <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
          </div>
        </TabsContent>

        <TabsContent value="redo" className="mt-0">
          <div className="bg-white rounded-lg border overflow-hidden">
            <TaskTable tasks={mockRedoTasks} />
            <Pagination totalPages={1} currentPage={1} onPageChange={() => {}} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}