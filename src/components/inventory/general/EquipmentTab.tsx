import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";

import { useLabInventoryList, useDeleteLabInventory, type LabInventory } from "@/api/generalInventory";
import { EquipmentEditModal } from "./EquipmentEditModal";
import { EquipmentDetailPanel } from "./EquipmentDetailPanel";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

const SKU_TYPES = ["Equipment", "Tool", "Material"];
const INVENTORY_STATUSES = ["Ready", "InUse", "Maintenance", "Faulty"];

export function EquipmentTab() {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<LabInventory | null | "CREATE">(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("labInventoryStatus")?.split(",").filter(Boolean) || [];
    const typeFilter = searchParams.get("labSkuType")?.split(",").filter(Boolean) || [];

    const updateSearchParam = (key: string, value: string | null) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (value) next.set(key, value);
            else next.delete(key);
            // Reset page strictly on filter changes except for page parameter
            if (key !== "page") next.delete("page");
            return next;
        }, { replace: true });
    };

    const safePage = parseInt(searchParams.get("page") || "1", 10);
    const safeItemsPerPage = parseInt(searchParams.get("itemsPerPage") || "20", 10);

    const { data: page, isLoading } = useLabInventoryList({ 
        query: { 
            page: safePage,
            itemsPerPage: safeItemsPerPage,
            search,
            labInventoryStatus: statusFilter.length > 0 ? statusFilter : null,
            labSkuType: typeFilter.length > 0 ? typeFilter : null,
        } 
    });
    const items = page?.data || [];
    const meta = page?.meta;

    const del = useDeleteLabInventory();

    const toggleStatusFilter = (status: string) => {
        const newArr = statusFilter.includes(status) ? statusFilter.filter(s => s !== status) : [...statusFilter, status];
        updateSearchParam("labInventoryStatus", newArr.length > 0 ? newArr.join(",") : null);
    };

    const toggleTypeFilter = (type: string) => {
        const newArr = typeFilter.includes(type) ? typeFilter.filter(t => t !== type) : [...typeFilter, type];
        updateSearchParam("labSkuType", newArr.length > 0 ? newArr.join(",") : null);
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <div className="flex items-center gap-4">
                    <div className="relative w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={String(t("inventory.general.equipment.search", { defaultValue: "Tìm kiếm vật tư/kho..." }))}
                            value={search}
                            onChange={(e) => updateSearchParam("search", e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                <Button onClick={() => setEditItem("CREATE")} className="h-9">
                    <Plus className="mr-2 h-4 w-4" />
                    {String(t("inventory.general.equipment.create", { defaultValue: "Thêm Vật tư/Kho" }))}
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden gap-4 p-4 pr-4 pl-0 pt-0">
            <div className={`flex-1 overflow-auto bg-background rounded-lg border border-border ${selectedId ? "hidden lg:block" : ""}`}>
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[120px]">Mã kho</TableHead>
                            <TableHead className="w-[120px]">Mã vật tư</TableHead>
                            <TableHead>Tên vật tư</TableHead>
                            <TableHead className="w-[120px]">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 -ml-3 hover:bg-muted font-semibold">
                                            Phân loại
                                            <Filter className={`ml-2 h-3.5 w-3.5 ${typeFilter.length > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {SKU_TYPES.map(type => (
                                            <DropdownMenuCheckboxItem
                                                key={type}
                                                checked={typeFilter.includes(type)}
                                                onCheckedChange={() => toggleTypeFilter(type)}
                                            >
                                                {type}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableHead>
                            <TableHead className="w-[80px]">Số lượng</TableHead>
                            <TableHead className="w-[140px]">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 -ml-3 hover:bg-muted font-semibold">
                                            Trạng thái
                                            <Filter className={`ml-2 h-3.5 w-3.5 ${statusFilter.length > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        {INVENTORY_STATUSES.map(s => (
                                            <DropdownMenuCheckboxItem
                                                key={s}
                                                checked={statusFilter.includes(s)}
                                                onCheckedChange={() => toggleStatusFilter(s)}
                                            >
                                                {s}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableHead>
                            <TableHead>Vị trí</TableHead>
                            <TableHead className="w-[50px] text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    {String(t("common.loading", { defaultValue: "Đang tải..." }))}
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    {String(t("common.noData", { defaultValue: "Chưa có dữ liệu kho" }))}
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow 
                                    key={item.labInventoryId}
                                    className={`cursor-pointer ${selectedId === item.labInventoryId ? "bg-muted/50" : ""}`}
                                    onClick={() => setSelectedId(item.labInventoryId)}
                                >
                                    <TableCell className="font-medium text-xs font-mono">{item.labInventoryId}</TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">{item.labSkuId || "-"}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={item.labSkuName || ""}>
                                        {item.labSkuName || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] px-1 h-5">
                                            {item.labSkuType || "Tool"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">{item.labInventoryQty || 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.labInventoryStatus === "Ready" ? "default" : "secondary"} className="text-[10px]">
                                            {item.labInventoryStatus || "Ready"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                                        {item.labInventoryLocation || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditItem(item); }}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    {String(t("common.edit", { defaultValue: "Chỉnh sửa" }))}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm(String(t("common.confirmDelete", { defaultValue: "Xác nhận xóa?" })))) {
                                                            del.mutate(item.labInventoryId);
                                                            if (selectedId === item.labInventoryId) setSelectedId(null);
                                                        }
                                                    }}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    {String(t("common.delete", { defaultValue: "Xóa" }))}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                
                {meta && meta.totalPages && meta.totalPages > 1 && (
                    <div className="p-4 border-t border-border">
                        <Pagination 
                            currentPage={safePage} 
                            totalPages={meta.totalPages} 
                            itemsPerPage={safeItemsPerPage} 
                            totalItems={meta.total || 0}
                            onPageChange={(page) => updateSearchParam("page", String(page))}
                            onItemsPerPageChange={(items) => {
                                updateSearchParam("itemsPerPage", String(items));
                                updateSearchParam("page", "1");
                            }}
                        />
                    </div>
                )}
            </div>

            {selectedId && (
                <EquipmentDetailPanel
                    labInventoryId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onEdit={(i) => setEditItem(i)}
                />
            )}
            </div>

            {editItem && (
                <EquipmentEditModal
                    item={editItem !== "CREATE" ? editItem : undefined}
                    onClose={() => setEditItem(null)}
                />
            )}
        </div>
    );
}
