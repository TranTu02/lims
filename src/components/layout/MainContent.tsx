import type { ReactNode } from "react";

interface MainContentProps {
    children: ReactNode;
}

export function MainContent({ children }: MainContentProps) {
    return (
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-4rem)]">
            <div className="mx-auto animate-in fade-in duration-500">{children}</div>
        </main>
    );
}
