import { useCallback } from "react";
import { Trash2, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type LabSku } from "@/api/generalInventory";
import { LabSkuSearchDropdown } from "./LabSkuSearchDropdown";

export type LabToolSnapshotItem = {
    labToolId: string;
    labToolName: string;
    labToolType?: string | null;
};

type Props = {
    items: LabToolSnapshotItem[];
    onChange: (items: LabToolSnapshotItem[]) => void;
    onLoadFromProtocol?: () => void;
    disabled?: boolean;
};

export function LabToolSnapshotTable({ items, onChange, onLoadFromProtocol, disabled }: Props) {
    const { t } = useTranslation();

    const existingIds = items.map((i) => i.labToolId);

    const toggleItem = useCallback(
        (sku: LabSku) => {
            if (existingIds.includes(sku.labSkuId)) {
                // remove
                onChange(items.filter((i) => i.labToolId !== sku.labSkuId));
            } else {
                // add
                onChange([
                    ...items,
                    {
                        labToolId: sku.labSkuId,
                        labToolName: sku.labSkuName,
                        labToolType: sku.labSkuType || "",
                    },
                ]);
            }
        },
        [items, onChange, existingIds],
    );

    const removeItem = (idx: number) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const updateField = (idx: number, field: keyof LabToolSnapshotItem, value: string) => {
        onChange(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    {String(t("library.protocols.labToolTitle", { defaultValue: "Dụng cụ sử dụng" }))}
                </div>
                {onLoadFromProtocol && !disabled && (
                    <Button type="button" variant="outline" size="sm" onClick={onLoadFromProtocol} className="gap-1.5 h-7 text-[10px]">
                        <Download className="h-3.5 w-3.5" />
                        {String(t("library.matrices.loadFromProtocol", { defaultValue: "Lấy từ P.Pháp" }))}
                    </Button>
                )}
            </div>

            {!disabled && (
                <LabSkuSearchDropdown 
                    onSelect={toggleItem} 
                    existingIds={existingIds} 
                    skuType="Tool" 
                    placeholder={String(t("library.protocols.searchTool", { defaultValue: "Tìm dụng cụ (SKU)..." }))} 
                />
            )}

            {items.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[30%]">ID</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[40%]">Tên dụng cụ</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[20%]">Loại</th>
                                <th className="px-3 py-2 w-[10%]" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {items.map((item, idx) => (
                                <tr key={`${item.labToolId}-${idx}`} className="hover:bg-muted/30">
                                    <td className="px-3 py-1.5">
                                        <Input
                                            className="h-7 text-xs font-mono bg-muted/50"
                                            value={item.labToolId}
                                            readOnly
                                            placeholder="TOOL_..."
                                            disabled={disabled}
                                        />
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <Input
                                            className="h-7 text-xs bg-muted/50"
                                            value={item.labToolName}
                                            readOnly
                                            placeholder="Tên dụng cụ..."
                                            disabled={disabled}
                                        />
                                    </td>
                                    <td className="px-3 py-1.5">
                                        <Input
                                            className="h-7 text-xs bg-muted/50"
                                            value={item.labToolType || ""}
                                            readOnly
                                            placeholder="Loại..."
                                            disabled={disabled}
                                        />
                                    </td>
                                    <td className="px-2 py-1.5 text-center">
                                        {!disabled && (
                                            <Button variant="ghost" size="icon" type="button" className="h-7 w-7" onClick={() => removeItem(idx)}>
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {items.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded-md">
                    {String(t("library.protocols.emptyTool", { defaultValue: "Chưa có dụng cụ. Tìm kiếm và thêm ở trên." }))}
                </div>
            )}
        </div>
    );
}
