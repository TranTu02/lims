import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useLabSkusList, useDeleteLabSku, type LabSku } from "@/api/generalInventory";
import { LabToolEditModal } from "./LabToolEditModal";
import { Badge } from "@/components/ui/badge";

export function LabToolsTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [editItem, setEditItem] = useState<LabSku | null | "CREATE">(null);

    const { data: page, isLoading } = useLabSkusList({ query: { search } });
    const items = page?.data || [];

    const del = useDeleteLabSku();

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm danh mục (SKU)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
                <Button onClick={() => setEditItem("CREATE")} className="h-9">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm Danh mục (SKU)
                </Button>
            </div>

            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[150px]">Mã SKU ID</TableHead>
                            <TableHead>Tên Danh mục</TableHead>
                            <TableHead>Mã SKU nội bộ</TableHead>
                            <TableHead>Kiểu</TableHead>
                            <TableHead>Hãng/Model</TableHead>
                            <TableHead>Hiệu chuẩn</TableHead>
                            <TableHead className="w-[100px] text-right" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    {String(t("common.loading", { defaultValue: "Đang tải..." }))}
                                </TableCell>
                            </TableRow>
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    {String(t("common.noData", { defaultValue: "Chưa có danh mục nào" }))}
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.labSkuId}>
                                    <TableCell className="font-medium text-xs font-mono">{item.labSkuId}</TableCell>
                                    <TableCell>{item.labSkuName}</TableCell>
                                    <TableCell>{item.labSkuCode || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {item.labSkuType || "Tool"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {item.labSkuManufacturer || "-"} / {item.labSkuModel || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.requiresCalibration ? "destructive" : "secondary"} className="scale-75 origin-left">
                                            {item.requiresCalibration ? "Yêu cầu" : "Không"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditItem(item)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    {String(t("common.edit", { defaultValue: "Chỉnh sửa" }))}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        if (confirm("Xác nhận xóa danh mục này?")) {
                                                            del.mutate(item.labSkuId);
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
            </div>

            {editItem && (
                <LabToolEditModal
                    item={editItem !== "CREATE" ? editItem : undefined}
                    onClose={() => setEditItem(null)}
                />
            )}
        </div>
    );
}
