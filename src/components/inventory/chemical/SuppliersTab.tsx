import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw } from "lucide-react";
import { TableFilterPopover } from "./TableFilterPopover";
import { useChemicalSuppliersList } from "@/api/chemical";
import { SupplierEditModal } from "./SupplierEditModal";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChemicalSupplier } from "@/types/chemical";
import { SupplierDetailPanel } from "./SupplierDetailPanel";
import { Badge } from "@/components/ui/badge";

function SupplierStatusBadge({ status }: { status?: string | null }) {
    const { t } = useTranslation();
    const SUPPLIER_STATUS_MAP: Record<string, { label: string; cls: string }> = {
        Active: {
            label: t("inventory.chemical.suppliers.statusLabels.Active", { defaultValue: "Đang hoạt động" }),
            cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        },
        Inactive: {
            label: t("inventory.chemical.suppliers.statusLabels.Inactive", { defaultValue: "Ngừng hoạt động" }),
            cls: "bg-muted text-muted-foreground",
        },
        Blacklisted: {
            label: t("inventory.chemical.suppliers.statusLabels.Blacklisted", { defaultValue: "Đã đưa vào danh sách đen" }),
            cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        },
    };
    const s = status ? SUPPLIER_STATUS_MAP[status] : undefined;
    if (s) return <Badge className={s.cls}>{s.label}</Badge>;
    return <Badge variant="outline">{status ?? "-"}</Badge>;
}

export function SuppliersTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [submittedSearch, setSubmittedSearch] = useState("");
    const [activeSup, setActiveSup] = useState<ChemicalSupplier | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [filters, setFilters] = useState<{
        supplierStatus: string[];
    }>({ supplierStatus: [] });

    const {
        data: result,
        isLoading,
        error,
        refetch,
    } = useChemicalSuppliersList({
        query: {
            search: submittedSearch,
            page,
            itemsPerPage,
            sortColumn: "createdAt",
            sortDirection: "DESC",
            ...filters,
        },
    });

    const handleSearch = () => {
        setSubmittedSearch(search);
        setPage(1);
    };

    if (error) {
        return <div className="p-4 text-destructive bg-destructive/10 rounded-md">{(error as any).message || t("common.loadError", { defaultValue: "Không thể tải dữ liệu" })}</div>;
    }

    return (
        <div className="h-full flex gap-4 overflow-hidden">
            <div className="flex flex-col flex-1 space-y-3 min-w-0 overflow-hidden">
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="supplier-search"
                                placeholder={t("inventory.chemical.suppliers.searchPlaceholder", { defaultValue: "Tìm tên, mã số thuế..." })}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="pl-8"
                            />
                        </div>
                        <Button variant="outline" size="sm" type="button" onClick={handleSearch}>
                            {String(t("common.search", { defaultValue: "Tìm kiếm" }))}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => refetch()} title="Tải lại">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                    <Button variant="default" type="button" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {String(t("inventory.chemical.suppliers.addSupplier", { defaultValue: "Thêm Nhà Cung Cấp" }))}
                    </Button>
                </div>

                {/* Table */}
                <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 relative flex flex-col min-w-0">
                    <div className="overflow-x-auto relative h-full flex-1">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b border-border sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("inventory.chemical.suppliers.chemicalSupplierId", { defaultValue: "Mã NCC" }))}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("inventory.chemical.suppliers.supplierName", { defaultValue: "Tên Nhà Cung Cấp" }))}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("inventory.chemical.suppliers.supplierTaxCode", { defaultValue: "Mã số thuế" }))}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("inventory.chemical.suppliers.phone", { defaultValue: "Điện thoại" }))}
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("inventory.chemical.suppliers.email", { defaultValue: "Email" }))}
                                    </th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        <TableFilterPopover
                                            title={String(t("inventory.chemical.suppliers.supplierStatus", { defaultValue: "Trạng thái" }))}
                                            type="enum"
                                            value={filters.supplierStatus}
                                            options={[
                                                { label: "Đang hoạt động (Active)", value: "Active" },
                                                { label: "Ngừng hoạt động (Inactive)", value: "Inactive" },
                                                { label: "Bị cấm (Blacklisted)", value: "Blacklisted" },
                                            ]}
                                            onChange={(v) => {
                                                setFilters((f) => ({ ...f, supplierStatus: v }));
                                                setPage(1);
                                            }}
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
                                        {String(t("inventory.chemical.suppliers.evalScore", { defaultValue: "Điểm ĐG" }))}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 7 }).map((__, j) => (
                                                <td key={j} className="p-3">
                                                    <Skeleton className="h-4 w-24" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (result?.data as any[])?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                            {String(t("common.noData", { defaultValue: "Không có dữ liệu" }))}
                                        </td>
                                    </tr>
                                ) : (
                                    (result?.data as any[])?.map((sup) => {
                                        const contact = sup.supplierContactPerson?.[0];
                                        return (
                                            <tr
                                                key={sup.chemicalSupplierId}
                                                className={`hover:bg-muted/30 cursor-pointer transition-colors ${activeSup?.chemicalSupplierId === sup.chemicalSupplierId ? "bg-muted" : ""}`}
                                                onClick={() => setActiveSup(sup)}
                                            >
                                                <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-primary font-medium">{sup.chemicalSupplierId ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap font-medium">{sup.supplierName ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{sup.supplierTaxCode ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{contact?.contactPhone ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{contact?.contactEmail ?? "-"}</td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                                    <SupplierStatusBadge status={sup.supplierStatus} />
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-right font-medium">{sup.supplierEvaluationScore ?? "-"}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {result?.pagination && (
                        <Pagination
                            currentPage={page}
                            totalPages={result.pagination.totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={result.pagination.total}
                            onPageChange={(p) => setPage(p)}
                            onItemsPerPageChange={(iper) => {
                                setItemsPerPage(iper);
                                setPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {activeSup && (
                <SupplierDetailPanel
                    supplier={activeSup}
                    onClose={() => setActiveSup(null)}
                    onEdit={(sup: ChemicalSupplier) => {
                        console.log("Edit Supplier", sup);
                    }}
                />
            )}

            {createOpen && <SupplierEditModal supplier={null} onClose={() => setCreateOpen(false)} />}
        </div>
    );
}
