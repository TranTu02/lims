import { LibraryDashboard } from "@/components/library/LibraryDashboard";

interface LibraryPageProps {
    viewType?: "parameters" | "protocols";
}

export function LibraryPage({ viewType = "parameters" }: LibraryPageProps) {
    return (
        <div className="h-full">
            <LibraryDashboard viewType={viewType} />
        </div>
    );
}
