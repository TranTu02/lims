import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useAssetLogsList } from "@/api/generalInventory";

export function AssetActivityLogsTab() {
    const { t } = useTranslation();
    const [search, setSearch] = useState("");

    const { data: page, isLoading } = useAssetLogsList({ query: { search } });
    const items = page?.data || [];

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={String(t("inventory.general.assetLogs.search", { defaultValue: "Tìm kiếm nhật ký..." }))}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <TableRow>
                            <TableHead className="w-[120px]">{String(t("inventory.general.assetLogs.logId", { defaultValue: "Mã Log" }))}</TableHead>
                            <TableHead className="w-[150px]">{String(t("inventory.general.assetLogs.assetId", { defaultValue: "Mã Tài sản" }))}</TableHead>
                            <TableHead className="w-[130px]">{String(t("inventory.general.assetLogs.table", { defaultValue: "Phân loại" }))}</TableHead>
                            <TableHead className="w-[120px]">{String(t("inventory.general.assetLogs.logType", { defaultValue: "Sự kiện" }))}</TableHead>
                            <TableHead>{String(t("inventory.general.assetLogs.description", { defaultValue: "Mô tả" }))}</TableHead>
                            <TableHead className="w-[150px]">Vị trí</TableHead>
                            <TableHead className="w-[150px]">{String(t("inventory.general.assetLogs.actionTime", { defaultValue: "Thời gian" }))}</TableHead>
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
                                    {String(t("common.noData", { defaultValue: "Chưa có nhật ký nào" }))}
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.logId}>
                                    <TableCell className="font-medium text-xs font-mono">{item.logId}</TableCell>
                                    <TableCell className="font-mono text-xs text-primary">{item.assetId}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                            {item.assetTable === "labInventories" ? "THIẾT BỊ" : item.assetTable === "labTools" ? "DỤNG CỤ" : (item.assetTable || "-")}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="text-[10px] uppercase">
                                            {item.logType || "-"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">{item.logDescription || "-"}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.logLocation || "-"}</TableCell>
                                    <TableCell>{item.actionTime ? new Date(item.actionTime).toLocaleString("vi-VN") : "-"}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
