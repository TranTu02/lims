import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useLabInventoryList, useDeleteLabInventory, type LabInventory } from "@/api/generalInventory";
import { EquipmentEditModal } from "./EquipmentEditModal";
import { EquipmentDetailPanel } from "./EquipmentDetailPanel";
import { Badge } from "@/components/ui/badge";

export function EquipmentTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<LabInventory | null | "CREATE">(null);

    const { data: page, isLoading } = useLabInventoryList({ query: { search } });
    const items = page?.data || [];

    const del = useDeleteLabInventory();

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={String(t("inventory.general.equipment.search", { defaultValue: "Tìm kiếm thiết bị..." }))}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
                <Button onClick={() => setEditItem("CREATE")} className="h-9">
                    <Plus className="mr-2 h-4 w-4" />
                    {String(t("inventory.general.equipment.create", { defaultValue: "Thêm Thiết bị" }))}
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden gap-4 p-4 pr-4 pl-0 pt-0">
            <div className={`flex-1 overflow-auto bg-background rounded-lg border border-border ${selectedId ? "hidden lg:block" : ""}`}>
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[150px]">{String(t("inventory.general.equipment.id", { defaultValue: "Mã TB" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.equipment.name", { defaultValue: "Tên thiết bị" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.equipment.code", { defaultValue: "Mã/Số thẻ TS" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.equipment.status", { defaultValue: "Trạng thái" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.equipment.lastCal", { defaultValue: "HC gần nhất" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.equipment.nextCal", { defaultValue: "Hạn HC" }))}</TableHead>
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
                                    {String(t("common.noData", { defaultValue: "Chưa có thiết bị nào" }))}
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
                                    <TableCell>{item.labInventoryName}</TableCell>
                                    <TableCell>{item.labInventoryCode || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant={item.labInventoryStatus === "Ready" ? "default" : "secondary"}>
                                            {item.labInventoryStatus || "Ready"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.labInventoryLastCalibrationDate ? item.labInventoryLastCalibrationDate.split("T")[0] : "-"}</TableCell>
                                    <TableCell>{item.labInventoryNextCalibrationDate ? item.labInventoryNextCalibrationDate.split("T")[0] : "-"}</TableCell>
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
