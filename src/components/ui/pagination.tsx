import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages?: number;
    itemsPerPage?: number;
    totalItems?: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export function Pagination({ currentPage, totalPages = 1, itemsPerPage = 10, totalItems = 0, onPageChange, onItemsPerPageChange = () => {} }: PaginationProps) {
    const itemsPerPageOptions = [10, 20, 50, 100];

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Hiển thị</span>
                <select value={itemsPerPage} onChange={(e) => onItemsPerPageChange(Number(e.target.value))} className="border border-input rounded px-2 py-1 text-sm bg-background text-foreground">
                    {itemsPerPageOptions.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <span className="text-muted-foreground">/ trang</span>
            </div>

            {/* Page info and navigation */}
            <div className="flex items-center gap-6">
                {/* Page info */}
                <div className="text-sm text-muted-foreground">
                    {startItem}-{endItem} trên tổng {totalItems}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => onPageChange(pageNum)} className="h-8 w-8 p-0">
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
