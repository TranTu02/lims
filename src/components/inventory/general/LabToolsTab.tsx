import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useLabToolsList, useDeleteLabTool, type LabTool } from "@/api/generalInventory";
import { LabToolEditModal } from "./LabToolEditModal";
import { Badge } from "@/components/ui/badge";

export function LabToolsTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [editItem, setEditItem] = useState<LabTool | null | "CREATE">(null);

    const { data: page, isLoading } = useLabToolsList({ query: { search } });
    const items = page?.data || [];

    const del = useDeleteLabTool();

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={String(t("inventory.general.labTools.search", { defaultValue: "Tìm kiếm dụng cụ..." }))}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
                <Button onClick={() => setEditItem("CREATE")} className="h-9">
                    <Plus className="mr-2 h-4 w-4" />
                    {String(t("inventory.general.labTools.create", { defaultValue: "Thêm Dụng cụ" }))}
                </Button>
            </div>

            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[150px]">{String(t("inventory.general.labTools.id", { defaultValue: "Mã DC" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.labTools.name", { defaultValue: "Tên dụng cụ" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.labTools.code", { defaultValue: "Mã/Số thẻ" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.labTools.type", { defaultValue: "Phân loại" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.labTools.status", { defaultValue: "Trạng thái" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.labTools.lastCal", { defaultValue: "HC gần nhất" }))}</TableHead>
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
                                    {String(t("common.noData", { defaultValue: "Chưa có dụng cụ nào" }))}
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.labToolId}>
                                    <TableCell className="font-medium text-xs font-mono">{item.labToolId}</TableCell>
                                    <TableCell>{item.labToolName}</TableCell>
                                    <TableCell>{item.labToolCode || "-"}</TableCell>
                                    <TableCell>{item.labToolType || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.labToolStatus === "Ready" ? "default" : "secondary"}>
                                            {item.labToolStatus || "Ready"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.lastCalibrationDate || "-"}</TableCell>
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
                                                        if (confirm(String(t("common.confirmDelete", { defaultValue: "Xác nhận xóa?" })))) {
                                                            del.mutate(item.labToolId);
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
