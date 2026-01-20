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
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden font-[var(--font-family)]">
            {/* Sidebar Navigation */}
            <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-[500px] h-full overflow-hidden transition-all">
                {/* Top Header */}
                <Header title={title} description={description} />

                {/* Page Content */}
                <MainContent>{children}</MainContent>
            </div>
        </div>
    );
}
