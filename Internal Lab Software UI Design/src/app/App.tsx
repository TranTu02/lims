import { useState } from 'react';
import { 
  ClipboardList, 
  FlaskConical, 
  BookOpen, 
  FolderOpen, 
  Package,
  Menu,
  X,
  UserCog,
  Shield,
  HandshakeIcon,
  Sun,
  Moon,
  Monitor,
  Languages,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SampleReception } from '@/app/components/SampleReception';
import { TechnicianWorkspace } from '@/app/components/TechnicianWorkspace';
import { LibraryDashboard } from '@/app/components/LibraryDashboard';
import { DocumentCenter } from '@/app/components/DocumentCenter';
import { InventoryDashboard } from '@/app/components/InventoryDashboard';
import { HRManagement } from '@/app/components/HRManagement';
import { LabManagerDashboard } from '@/app/components/LabManagerDashboard';
import { TesterAssignment } from '@/app/components/TesterAssignment';
import { HandoverManagement } from '@/app/components/HandoverManagement';
import { StoredSamples } from '@/app/components/StoredSamples';
import { NotificationPanel } from '@/app/components/NotificationPanel';
import { Button } from '@/app/components/ui/button';

type View = 'reception' | 'technician' | 'library' | 'protocols' | 'documents' | 'inventory' | 'hr' | 'manager' | 'assignment' | 'handover' | 'stored-samples';
type Theme = 'light' | 'dark' | 'system';
type Language = 'vi' | 'en';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('reception');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('vi');

  const navigation = [
    {
      id: 'reception' as const,
      name: 'Tiếp nhận mẫu',
      icon: ClipboardList,
      description: 'Quản lý phiếu tiếp nhận và mẫu',
    },
    {
      id: 'technician' as const,
      name: 'KTV Workspace',
      icon: FlaskConical,
      description: 'Công việc kiểm nghiệm viên',
    },
    {
      id: 'manager' as const,
      name: 'Quản lý Lab',
      icon: Shield,
      description: 'Duyệt kết quả & quản lý đầu ra',
    },
    {
      id: 'handover-group' as const,
      name: 'Bàn giao mẫu - phép thử',
      icon: HandshakeIcon,
      description: 'Phân công & bàn giao',
      subItems: [
        {
          id: 'assignment' as const,
          name: 'Phân công KTV',
          description: 'Phân công kiểm nghiệm viên'
        },
        {
          id: 'handover' as const,
          name: 'Bàn giao',
          description: 'Bàn giao mẫu và phép thử'
        },
        {
          id: 'stored-samples' as const,
          name: 'Mẫu lưu',
          description: 'Quản lý mẫu đã lưu trữ'
        }
      ]
    },
    {
      id: 'library-group' as const,
      name: 'Danh mục chỉ tiêu',
      icon: BookOpen,
      description: 'Parameters & Protocols',
      subItems: [
        {
          id: 'library' as const,
          name: 'Chỉ tiêu',
          description: 'Danh sách chỉ tiêu'
        },
        {
          id: 'protocols' as const,
          name: 'Phương pháp',
          description: 'Danh sách phương pháp'
        }
      ]
    },
    {
      id: 'documents' as const,
      name: 'Tài liệu',
      icon: FolderOpen,
      description: 'Quản lý tài liệu',
    },
    {
      id: 'inventory' as const,
      name: 'Kho & Tài sản',
      icon: Package,
      description: 'Hóa chất, thiết bị, vật tư',
    },
    {
      id: 'hr' as const,
      name: 'Quản lý Nhân sự',
      icon: UserCog,
      description: 'Quản lý thông tin nhân sự',
    },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'reception':
        return <SampleReception />;
      case 'technician':
        return <TechnicianWorkspace />;
      case 'manager':
        return <LabManagerDashboard />;
      case 'library':
        return <LibraryDashboard viewType="parameters" />;
      case 'protocols':
        return <LibraryDashboard viewType="protocols" />;
      case 'documents':
        return <DocumentCenter />;
      case 'inventory':
        return <InventoryDashboard />;
      case 'hr':
        return <HRManagement />;
      case 'assignment':
        return <TesterAssignment />;
      case 'handover':
        return <HandoverManagement />;
      case 'stored-samples':
        return <StoredSamples />;
      default:
        return <SampleReception />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? (sidebarCollapsed ? 'w-16' : 'w-64') : 'w-0'
        } bg-white border-r transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {!sidebarCollapsed ? (
          <>
            {/* Expanded Sidebar */}
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Lab Mgmt</h1>
                <p className="text-xs text-gray-600 mt-0.5">Quản lý phòng lab</p>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Thu gọn"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const hasSubItems = 'subItems' in item && item.subItems;
                const isExpanded = expandedGroup === item.id;
                
                if (hasSubItems) {
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => setExpandedGroup(isExpanded ? null : item.id)}
                        className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100`}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 text-gray-500`} />
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{item.description}</div>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="ml-3 mt-0.5 space-y-0.5">
                          {item.subItems.map((subItem: any) => {
                            const isSubActive = currentView === subItem.id;
                            return (
                              <button
                                key={subItem.id}
                                onClick={() => setCurrentView(subItem.id)}
                                className={`w-full flex items-start gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                                  isSubActive
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <div className="text-left">
                                  <div className="text-sm font-medium">{subItem.name}</div>
                                  <div className="text-xs text-gray-600 mt-0.5">{subItem.description}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                    <div className="text-left">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Settings */}
            <div className="p-3 border-t space-y-2">
              {/* Language */}
              <div>
                <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  Ngôn ngữ
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setLanguage('vi')}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      language === 'vi'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    VI
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      language === 'en'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div>
                <div className="text-xs text-gray-500 mb-1.5">Giao diện</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                      theme === 'light'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Sun className="h-3 w-3" />
                    <span className="text-xs">Light</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                      theme === 'dark'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Moon className="h-3 w-3" />
                    <span className="text-xs">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                      theme === 'system'
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Monitor className="h-3 w-3" />
                    <span className="text-xs">Auto</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 border-t">
              <div className="text-xs text-gray-500 text-center">
                Version 2.2.2
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Collapsed Sidebar */}
            <div className="p-2 border-b flex flex-col items-center gap-2">
              <div className="h-10 w-10 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Mở rộng"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const hasSubItems = 'subItems' in item && item.subItems;
                
                if (hasSubItems) {
                  const isAnySubActive = item.subItems.some((sub: any) => sub.id === currentView);
                  return (
                    <div key={item.id} className="space-y-0.5">
                      <button
                        onClick={() => {
                          if (expandedGroup === item.id) {
                            setExpandedGroup(null);
                          } else {
                            setExpandedGroup(item.id);
                          }
                        }}
                        className={`w-full p-2 rounded-lg transition-colors flex items-center justify-center ${
                          isAnySubActive ? 'bg-blue-50' : 'hover:bg-gray-100'
                        }`}
                        title={item.name}
                      >
                        <Icon className={`h-5 w-5 ${isAnySubActive ? 'text-blue-700' : 'text-gray-500'}`} />
                      </button>
                      {expandedGroup === item.id && item.subItems.map((subItem: any, idx: number) => {
                        const isSubActive = currentView === subItem.id;
                        const firstLetter = subItem.name.charAt(0).toUpperCase();
                        return (
                          <button
                            key={subItem.id}
                            onClick={() => setCurrentView(subItem.id)}
                            className={`w-full p-1.5 rounded transition-colors flex items-center justify-center text-xs font-medium ${
                              isSubActive
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={subItem.name}
                          >
                            {firstLetter}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`w-full p-2 rounded-lg transition-colors flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-50'
                        : 'hover:bg-gray-100'
                    }`}
                    title={item.name}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} />
                  </button>
                );
              })}
            </nav>

            <div className="p-2 border-t flex flex-col items-center gap-1">
              <button
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Ngôn ngữ"
              >
                <Languages className="h-4 w-4 text-gray-500" />
              </button>
              <button
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Giao diện"
              >
                {theme === 'light' && <Sun className="h-4 w-4 text-gray-500" />}
                {theme === 'dark' && <Moon className="h-4 w-4 text-gray-500" />}
                {theme === 'system' && <Monitor className="h-4 w-4 text-gray-500" />}
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-7 w-7 p-0"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {navigation.find((n) => {
                  if (n.id === currentView) return true;
                  if ('subItems' in n && n.subItems) {
                    return n.subItems.some((sub: any) => sub.id === currentView);
                  }
                  return false;
                })?.name || 
                navigation.flatMap((n) => 'subItems' in n && n.subItems ? n.subItems : [])
                  .find((sub: any) => sub.id === currentView)?.name}
              </h2>
              <p className="text-xs text-gray-600">
                {navigation.find((n) => n.id === currentView)?.description ||
                navigation.flatMap((n) => 'subItems' in n && n.subItems ? n.subItems : [])
                  .find((sub: any) => sub.id === currentView)?.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-600">Quản trị viên</div>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {renderView()}
        </main>
      </div>
    </div>
  );
}