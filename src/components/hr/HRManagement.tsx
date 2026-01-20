import { useState } from 'react';
import { Users, UserPlus, Search, Edit, Trash2, Shield, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  role: 'admin' | 'manager' | 'technician' | 'receptionist';
  status: 'active' | 'inactive';
  joinDate: string;
  groups?: string[];
}

interface LabGroup {
  id: string;
  groupName: string;
  description: string;
  members: string[];
  leaderId: string;
}

const mockEmployees: Employee[] = [
  {
    id: 'emp1',
    employeeCode: 'EMP001',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@lab.com',
    phone: '0901234567',
    position: 'Trưởng phòng',
    department: 'Phòng Thử nghiệm',
    role: 'manager',
    status: 'active',
    joinDate: '01/01/2020',
    groups: ['Nhóm kim loại nặng', 'Nhóm hóa lý'],
  },
  {
    id: 'emp2',
    employeeCode: 'EMP002',
    fullName: 'Trần Thị B',
    email: 'tranthib@lab.com',
    phone: '0902345678',
    position: 'KTV chính',
    department: 'Phòng Thử nghiệm',
    role: 'technician',
    status: 'active',
    joinDate: '15/03/2021',
    groups: ['Nhóm kim loại nặng'],
  },
  {
    id: 'emp3',
    employeeCode: 'EMP003',
    fullName: 'Lê Văn C',
    email: 'levanc@lab.com',
    phone: '0903456789',
    position: 'KTV',
    department: 'Phòng Thử nghiệm',
    role: 'technician',
    status: 'active',
    joinDate: '10/06/2021',
    groups: ['Nhóm hóa lý'],
  },
  {
    id: 'emp4',
    employeeCode: 'EMP004',
    fullName: 'Phạm Thị D',
    email: 'phamthid@lab.com',
    phone: '0904567890',
    position: 'KTV',
    department: 'Phòng Thử nghiệm',
    role: 'technician',
    status: 'active',
    joinDate: '20/08/2022',
    groups: ['Nhóm kim loại nặng', 'Nhóm vi sinh'],
  },
  {
    id: 'emp5',
    employeeCode: 'EMP005',
    fullName: 'Hoàng Văn E',
    email: 'hoangvane@lab.com',
    phone: '0905678901',
    position: 'Nhân viên tiếp nhận',
    department: 'Bộ phận Tiếp nhận',
    role: 'receptionist',
    status: 'active',
    joinDate: '05/02/2023',
  },
  {
    id: 'emp6',
    employeeCode: 'EMP006',
    fullName: 'Võ Thị F',
    email: 'vothif@lab.com',
    phone: '0906789012',
    position: 'Quản trị viên',
    department: 'IT & Hành chính',
    role: 'admin',
    status: 'active',
    joinDate: '01/01/2019',
  },
];

const mockLabGroups: LabGroup[] = [
  {
    id: 'grp1',
    groupName: 'Nhóm kim loại nặng',
    description: 'Phân tích kim loại nặng bằng ICP-MS, AAS',
    members: ['emp1', 'emp2', 'emp4'],
    leaderId: 'emp2',
  },
  {
    id: 'grp2',
    groupName: 'Nhóm hóa lý',
    description: 'Phân tích các chỉ tiêu hóa lý: pH, COD, BOD, TSS, TDS',
    members: ['emp1', 'emp3'],
    leaderId: 'emp3',
  },
  {
    id: 'grp3',
    groupName: 'Nhóm vi sinh',
    description: 'Phân tích vi sinh vật: E.Coli, Coliform, Tổng vi khuẩn',
    members: ['emp4'],
    leaderId: 'emp4',
  },
];

const getRoleBadge = (role: Employee['role']) => {
  switch (role) {
    case 'admin':
      return <Badge variant="default" className="bg-purple-600">Quản trị viên</Badge>;
    case 'manager':
      return <Badge variant="default" className="bg-blue-600">Trưởng phòng</Badge>;
    case 'technician':
      return <Badge variant="outline">KTV</Badge>;
    case 'receptionist':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Tiếp nhận</Badge>;
  }
};

export function HRManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filteredEmployees = mockEmployees.filter((emp) => {
    const matchesSearch = searchTerm
      ? emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      : true;

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'lab') return matchesSearch && emp.role === 'technician';
    return matchesSearch;
  });

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Quản lý nhân sự</h1>
            <p className="text-gray-600 mt-1">Quản lý tài khoản, thông tin và phân bổ nhân viên</p>
          </div>
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            <Users className="h-4 w-4 mr-2" />
            Tất cả nhân viên ({mockEmployees.length})
          </TabsTrigger>
          <TabsTrigger value="lab">
            <Shield className="h-4 w-4 mr-2" />
            Nhân sự Lab ({mockEmployees.filter(e => e.role === 'technician').length})
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="h-4 w-4 mr-2" />
            Nhóm công việc ({mockLabGroups.length})
          </TabsTrigger>
        </TabsList>

        {/* All Employees Tab */}
        <TabsContent value="all" className="mt-6 space-y-4">
          {/* Search */}
          <div className="bg-white rounded-lg border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên, mã NV, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nhân viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mã NV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Chức vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phòng ban
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quyền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {getInitials(employee.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">{employee.fullName}</div>
                            <div className="text-sm text-gray-500">{employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline">{employee.employeeCode}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{employee.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{employee.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{employee.department}</td>
                      <td className="px-6 py-4">{getRoleBadge(employee.role)}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={employee.status === 'active' ? 'default' : 'outline'}
                          className={employee.status === 'active' ? 'bg-green-500' : ''}
                        >
                          {employee.status === 'active' ? 'Hoạt động' : 'Ngưng hoạt động'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Xem hồ sơ">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Chỉnh sửa">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Lab Staff Tab */}
        <TabsContent value="lab" className="mt-6 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm KTV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                        {getInitials(employee.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.fullName}</h3>
                      <p className="text-sm text-gray-600">{employee.position}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{employee.employeeCode}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900 truncate ml-2">{employee.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Điện thoại:</span>
                    <span className="text-gray-900">{employee.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ngày vào:</span>
                    <span className="text-gray-900">{employee.joinDate}</span>
                  </div>
                </div>

                {employee.groups && employee.groups.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-gray-600 mb-2">Thuộc nhóm:</div>
                    <div className="flex flex-wrap gap-1">
                      {employee.groups.map((group, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {group}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="h-3 w-3 mr-1" />
                    Sửa
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="h-3 w-3 mr-1" />
                    Hồ sơ
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Tạo nhóm mới
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockLabGroups.map((group) => {
              const leader = mockEmployees.find((e) => e.id === group.leaderId);
              const members = mockEmployees.filter((e) => group.members.includes(e.id));

              return (
                <div key={group.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{group.groupName}</h3>
                      <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {leader && (
                    <div className="mb-4 pb-4 border-b">
                      <div className="text-xs text-gray-600 mb-2">Trưởng nhóm:</div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                            {getInitials(leader.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{leader.fullName}</div>
                          <div className="text-xs text-gray-600">{leader.position}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs text-gray-600">
                        Thành viên ({members.length})
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs">
                        <UserPlus className="h-3 w-3 mr-1" />
                        Thêm
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center gap-2 text-sm">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                              {getInitials(member.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-900">{member.fullName}</span>
                          {member.id === group.leaderId && (
                            <Badge variant="outline" className="text-xs ml-auto">
                              Trưởng nhóm
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
