import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MainContent } from "./MainContent";

interface LayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    title: string;
    description: string;
}

export function Layout({ children, activeTab, onTabChange, title, description }: LayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-[var(--font-family)] relative">
            {/* Desktop Sidebar Navigation */}
            <div className="hidden md:flex h-full shrink-0">
                <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
            </div>

            {/* Mobile Sidebar Navigation (Flyout Drawer) */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity duration-300"
                    onClick={() => setIsMobileOpen(false)}
                >
                    <div 
                        className="w-64 h-full bg-background shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Sidebar 
                            activeTab={activeTab} 
                            onTabChange={(tab) => {
                                onTabChange(tab);
                                setIsMobileOpen(false); // auto close on click
                            }}
                            sidebarOpen={true}
                            onMobileClose={() => setIsMobileOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden transition-all">
                {/* Top Header */}
                <Header 
                    title={title} 
                    description={description} 
                    onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
                />

                {/* Page Content */}
                <MainContent>{children}</MainContent>
            </div>
        </div>
    );
}
