import { useState, useEffect } from "react";
import {
    Inbox,
    TestTube2,
    Activity,
    Users,
    ArrowRightLeft,
    Archive,
    BookOpen,
    FileText,
    Package,
    Briefcase,
    LayoutDashboard,
    FlaskConical,
    ChevronLeft,
    ChevronRight,
    Languages,
    Sun,
    Moon,
    Monitor,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/config/theme/ThemeContext";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    sidebarOpen?: boolean;
}

const navigation = [
    { id: "reception", name: "Tiếp nhận mẫu", icon: Inbox, description: "Quản lý phiếu & mẫu" },
    { id: "technician", name: "KTV Workspace", icon: TestTube2, description: "Công việc kiểm nghiệm" },
    { id: "manager", name: "Quản lý Lab", icon: Activity, description: "Duyệt KQ & Báo cáo" },
    { id: "assignment", name: "Phân công KTV", icon: Users, description: "Phân công chỉ tiêu" },
    { id: "handover", name: "Bàn giao", icon: ArrowRightLeft, description: "Bàn giao liên phòng" },
    { id: "stored-samples", name: "Mẫu lưu", icon: Archive, description: "Kho mẫu lưu" },
    {
        id: "libraries",
        name: "Thư viện",
        icon: BookOpen,
        description: "Danh mục hệ thống",
        subItems: [
            { id: "library", name: "Chỉ tiêu", description: "Thư viện chỉ tiêu" },
            { id: "protocols", name: "Phương pháp", description: "Thư viện phương pháp" },
        ],
    },
    { id: "document", name: "Tài liệu", icon: FileText, description: "Văn bản & Biểu mẫu" },
    { id: "inventory", name: "Kho & Tài sản", icon: Package, description: "Hóa chất & Thiết bị" },
    { id: "hr", name: "Nhân sự", icon: Briefcase, description: "Quản lý nhân viên" },
];

export function Sidebar({ activeTab, onTabChange, sidebarOpen = true }: SidebarProps) {
    const { i18n } = useTranslation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>("libraries"); // Default expand for demo
    const [language, setLanguageState] = useState(i18n.language?.startsWith("en") ? "en" : "vi");
    const { theme, setTheme } = useTheme();

    const currentView = activeTab;
    const setCurrentView = (id: string) => onTabChange(id);

    const setLanguage = (lang: string) => {
        setLanguageState(lang);
        i18n.changeLanguage(lang);
    };

    // Update expanded group if active tab is in a subgroup
    useEffect(() => {
        const parentGroup = navigation.find((item) => "subItems" in item && item.subItems?.some((sub) => sub.id === activeTab));
        if (parentGroup) {
            setExpandedGroup(parentGroup.id);
        }
    }, [activeTab]);

    return (
        <aside className={`${sidebarOpen ? (sidebarCollapsed ? "w-16" : "w-64") : "w-0"} bg-background border-r border-border transition-all duration-300 overflow-hidden flex flex-col`}>
            {!sidebarCollapsed ? (
                <>
                    {/* Expanded Sidebar */}
                    <div className="p-3 border-b flex items-center justify-between h-16">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <LayoutDashboard className="h-6 w-6 text-blue-600 shrink-0" />
                            <div>
                                <h1 className="text-lg font-bold text-foreground truncate">LIMS Lab</h1>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">Quản lý phòng lab</p>
                            </div>
                        </div>
                        <button onClick={() => setSidebarCollapsed(true)} className="p-1.5 hover:bg-muted rounded transition-colors shrink-0" title="Thu gọn">
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;
                            const hasSubItems = "subItems" in item && item.subItems;
                            const isExpanded = expandedGroup === item.id;

                            if (hasSubItems) {
                                // Check if any subitem is active to highlight parent
                                const isParentActive = item.subItems?.some((sub) => sub.id === currentView);

                                return (
                                    <div key={item.id}>
                                        <button
                                            onClick={() => setExpandedGroup(isExpanded ? null : item.id)}
                                            className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors ${
                                                isParentActive && !isExpanded ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isParentActive ? "text-primary" : "text-muted-foreground"}`} />
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{item.name}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</div>
                                            </div>
                                        </button>
                                        {isExpanded && (
                                            <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-2">
                                                {item.subItems?.map((subItem: any) => {
                                                    const isSubActive = currentView === subItem.id;
                                                    return (
                                                        <button
                                                            key={subItem.id}
                                                            onClick={() => setCurrentView(subItem.id)}
                                                            className={`w-full flex items-start gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                                                                isSubActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                                                            }`}
                                                        >
                                                            <div className="text-left min-w-0">
                                                                <div className="text-sm font-medium truncate">{subItem.name}</div>
                                                                <div className="text-xs text-muted-foreground mt-0.5 truncate">{subItem.description}</div>
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
                                        isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-muted"
                                    }`}
                                >
                                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{item.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Settings */}
                    <div className="p-3 border-t space-y-2 shrink-0">
                        {/* Language */}
                        <div>
                            <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Languages className="h-3 w-3" />
                                Ngôn ngữ
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button
                                    onClick={() => setLanguage("vi")}
                                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                                        language === "vi" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                                    }`}
                                >
                                    VI
                                </button>
                                <button
                                    onClick={() => setLanguage("en")}
                                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                                        language === "en" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-muted"
                                    }`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>

                        {/* Theme */}
                        <div>
                            <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                                <Sun className="h-3 w-3" />
                                Giao diện
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button
                                    onClick={() => setTheme("light")}
                                    className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                                        theme === "light" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <Sun className="h-3 w-3" />
                                    <span className="text-xs">Light</span>
                                </button>
                                <button
                                    onClick={() => setTheme("dark")}
                                    className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                                        theme === "dark" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <Moon className="h-3 w-3" />
                                    <span className="text-xs">Dark</span>
                                </button>
                                <button
                                    onClick={() => setTheme("system")}
                                    className={`px-1.5 py-1 text-xs rounded border transition-colors flex flex-col items-center gap-0.5 ${
                                        theme === "system" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                                >
                                    <Monitor className="h-3 w-3" />
                                    <span className="text-xs">Auto</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-3 border-t shrink-0 border-border">
                        <div className="text-xs text-muted-foreground text-center">Version 2.2.2</div>
                    </div>
                </>
            ) : (
                <>
                    {/* Collapsed Sidebar */}
                    <div className="p-2 border-b border-border flex flex-col items-center gap-2 h-16 justify-center">
                        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">L</span>
                        </div>
                        <button onClick={() => setSidebarCollapsed(false)} className="p-1.5 hover:bg-muted rounded transition-colors" title="Mở rộng">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;
                            const hasSubItems = "subItems" in item && item.subItems;

                            if (hasSubItems) {
                                const isAnySubActive = item.subItems?.some((sub: any) => sub.id === currentView);
                                return (
                                    <div key={item.id} className="space-y-1">
                                        <button
                                            onClick={() => {
                                                if (expandedGroup === item.id) {
                                                    setExpandedGroup(null);
                                                } else {
                                                    setExpandedGroup(item.id);
                                                }
                                            }}
                                            className={`w-full p-2 rounded-lg transition-colors flex items-center justify-center relative group ${isAnySubActive ? "bg-primary/10" : "hover:bg-muted"}`}
                                            title={item.name}
                                        >
                                            <Icon className={`h-5 w-5 ${isAnySubActive ? "text-primary" : "text-muted-foreground"}`} />
                                            {/* Tooltip on hover could go here if needed */}
                                        </button>

                                        {expandedGroup === item.id &&
                                            item.subItems?.map((subItem: any, idx: number) => {
                                                const isSubActive = currentView === subItem.id;
                                                const firstLetter = subItem.name.charAt(0).toUpperCase();
                                                return (
                                                    <button
                                                        key={subItem.id}
                                                        onClick={() => setCurrentView(subItem.id)}
                                                        className={`w-full p-1.5 rounded transition-colors flex items-center justify-center text-xs font-medium ${
                                                            isSubActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                                    className={`w-full p-2 rounded-lg transition-colors flex items-center justify-center ${isActive ? "bg-primary/10" : "hover:bg-muted"}`}
                                    title={item.name}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : "text-muted-foreground"}`} />
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-2 border-t border-border flex flex-col items-center gap-1 shrink-0">
                        <button className="p-1.5 hover:bg-muted rounded transition-colors" title="Ngôn ngữ" onClick={() => setLanguage(language === "en" ? "vi" : "en")}>
                            <Languages className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                            title="Giao diện"
                            onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
                        >
                            {theme === "light" && <Sun className="h-4 w-4 text-muted-foreground" />}
                            {theme === "dark" && <Moon className="h-4 w-4 text-muted-foreground" />}
                            {theme === "system" && <Monitor className="h-4 w-4 text-muted-foreground" />}
                        </button>
                    </div>
                </>
            )}
        </aside>
    );
}
