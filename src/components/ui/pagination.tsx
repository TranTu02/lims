import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages?: number;
    itemsPerPage?: number;
    totalItems?: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export function Pagination({ currentPage, totalPages = 1, itemsPerPage = 10, totalItems = 0, onPageChange, onItemsPerPageChange }: PaginationProps) {
    const { t } = useTranslation();

    const hasItems = totalItems > 0;

    const safeTotalPages = Math.max(1, totalPages);
    const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

    const startItem = hasItems ? (safeCurrentPage - 1) * itemsPerPage + 1 : 0;
    const endItem = hasItems ? Math.min(safeCurrentPage * itemsPerPage, totalItems) : 0;

    const canGoPrev = safeCurrentPage > 1;
    const canGoNext = safeCurrentPage < safeTotalPages;

    const handleItemsPerPageChange = (next: number) => {
        onItemsPerPageChange?.(next);
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
            {/* Items per page selector */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{t("common.pagination.itemsPerPagePrefix")}</span>

                <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-input rounded px-2 py-1 text-sm bg-background text-foreground"
                    aria-label={t("common.pagination.itemsPerPageAria")}
                >
                    {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                <span className="text-muted-foreground">{t("common.pagination.itemsPerPageSuffix")}</span>
            </div>

            {/* Page info and navigation */}
            <div className="flex items-center gap-6">
                <div className="text-sm text-muted-foreground">
                    {t("common.pagination.range", {
                        start: startItem,
                        end: endItem,
                        total: totalItems,
                    })}
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={!canGoPrev} className="h-8 w-8 p-0" aria-label={t("common.pagination.firstPage")}>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => onPageChange(safeCurrentPage - 1)} disabled={!canGoPrev} className="h-8 w-8 p-0" aria-label={t("common.pagination.prevPage")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 mx-2">
                        {(() => {
                            const pages: (number | string)[] = [];
                            if (safeTotalPages <= 7) {
                                for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
                            } else {
                                if (safeCurrentPage <= 4) {
                                    pages.push(1, 2, 3, 4, 5, "...", safeTotalPages);
                                } else if (safeCurrentPage >= safeTotalPages - 3) {
                                    pages.push(1, "...", safeTotalPages - 4, safeTotalPages - 3, safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
                                } else {
                                    pages.push(1, "...", safeCurrentPage - 2, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, safeCurrentPage + 2, "...", safeTotalPages);
                                }
                            }

                            return pages.map((pageNum, idx) => {
                                if (pageNum === "...") {
                                    return (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground w-8 text-center text-sm">
                                            ...
                                        </span>
                                    );
                                }
                                return (
                                    <Button
                                        key={`page-${pageNum}`}
                                        variant={safeCurrentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onPageChange(pageNum as number)}
                                        className="h-8 w-8 p-0"
                                        aria-label={t("common.pagination.page", { page: pageNum })}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            });
                        })()}
                    </div>

                    <Button variant="outline" size="sm" onClick={() => onPageChange(safeCurrentPage + 1)} disabled={!canGoNext} className="h-8 w-8 p-0" aria-label={t("common.pagination.nextPage")}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => onPageChange(safeTotalPages)} disabled={!canGoNext} className="h-8 w-8 p-0" aria-label={t("common.pagination.lastPage")}>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
