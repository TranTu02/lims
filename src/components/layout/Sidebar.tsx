import { Inbox, TestTube2, Activity, Users, ArrowRightLeft, Archive, BookOpen, FileText, Package, Briefcase, Settings, LayoutDashboard, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const MENU_ITEMS = [
    { key: "reception", label: "Tiếp nhận mẫu", icon: Inbox },
    { key: "technician", label: "KTV Workspace", icon: TestTube2 },
    { key: "manager", label: "Quản lý Lab", icon: Activity },
    { key: "assignment", label: "Phân công KTV", icon: Users },
    { key: "handover", label: "Bàn giao", icon: ArrowRightLeft },
    { key: "stored-samples", label: "Mẫu lưu", icon: Archive },
    { key: "library", label: "Thư viện chỉ tiêu", icon: BookOpen },
    { key: "protocols", label: "Thư viện phương pháp", icon: FlaskConical },
    { key: "document", label: "Tài liệu", icon: FileText },
    { key: "inventory", label: "Kho & Tài sản", icon: Package },
    { key: "hr", label: "Quản lý Nhân sự", icon: Briefcase },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                <LayoutDashboard className="h-6 w-6 text-sidebar-primary mr-2" />
                <span className="font-bold text-xl text-sidebar-foreground tracking-tight">LIMS Lab</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {MENU_ITEMS.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                        <Button
                            key={item.key}
                            variant="ghost"
                            onClick={() => onTabChange(item.key)}
                            className={cn(
                                "w-full justify-start text-sm font-medium h-10 px-3 transition-colors",
                                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                            )}
                        >
                            <item.icon className={cn("mr-3 h-4 w-4", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70")} />
                            {item.label}
                        </Button>
                    );
                })}
            </nav>

            {/* Footer / User Profile Stub */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar">
                <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent/50 cursor-pointer transition-colors">
                    <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary">
                        <Settings className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-sidebar-foreground">Cấu hình</span>
                        <span className="text-xs text-sidebar-foreground/70">System Settings</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
