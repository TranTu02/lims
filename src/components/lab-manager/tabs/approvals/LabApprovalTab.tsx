import { useState } from "react";
import { DataEnteredList } from "./DataEnteredList";
import { TechReviewList } from "./TechReviewList";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function LabApprovalTab() {
    const [viewMode, setViewMode] = useState<"dataEntered" | "techReview">("dataEntered");

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border-x border-b border-border shadow-sm p-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Control Bar */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Xử lý chỉ tiêu chờ duyệt</h2>
                    <p className="text-sm text-muted-foreground mt-1">Danh sách các chỉ tiêu cần sự can thiệp của Quản lý hoặc QA</p>
                </div>

                <div className="bg-muted/50 p-1.5 rounded-lg border border-border inline-flex items-center">
                    <RadioGroup 
                        value={viewMode} 
                        onValueChange={(v) => setViewMode(v as "dataEntered" | "techReview")}
                        className="flex items-center gap-0"
                    >
                        <div className={`relative px-4 py-2 rounded-md transition-all cursor-pointer ${
                            viewMode === "dataEntered" ? "bg-background shadow-sm text-blue-600" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="dataEntered" id="dataEntered" className="hidden" />
                                <Label htmlFor="dataEntered" className="cursor-pointer font-medium">Chờ soát xét (Leader)</Label>
                            </div>
                        </div>

                        <div className="w-px h-6 bg-border mx-1"></div>

                        <div className={`relative px-4 py-2 rounded-md transition-all cursor-pointer ${
                            viewMode === "techReview" ? "bg-background shadow-sm text-emerald-600" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="techReview" id="techReview" className="hidden" />
                                <Label htmlFor="techReview" className="cursor-pointer font-medium">Chờ duyệt chốt (QA)</Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            {/* List Content Area */}
            <div className="flex-1 min-h-0 relative">
                <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === "dataEntered" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
                    <DataEnteredList />
                </div>
                <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === "techReview" ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}>
                    <TechReviewList />
                </div>
            </div>
        </div>
    );
}
