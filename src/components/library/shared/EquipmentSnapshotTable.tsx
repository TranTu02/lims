import { Trash2, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EquipmentSnapshotItem = {
    equipmentId: string;
    equipmentName: string;
    equipmentType?: string | null;
};

type Props = {
    items: EquipmentSnapshotItem[];
    onChange: (items: EquipmentSnapshotItem[]) => void;
    disabled?: boolean;
};

export function EquipmentSnapshotTable({ items, onChange, disabled }: Props) {
    const { t } = useTranslation();

    const addItem = () => {
        onChange([...items, { equipmentId: "", equipmentName: "", equipmentType: "" }]);
    };

    const removeItem = (idx: number) => {
        onChange(items.filter((_, i) => i !== idx));
    };

    const updateField = (idx: number, field: keyof EquipmentSnapshotItem, value: string) => {
        onChange(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                    {String(t("library.protocols.equipmentTitle", { defaultValue: "Thiết bị sử dụng" }))}
                </div>
                {!disabled && (
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-[10px]">
                        <Plus className="h-3 w-3 mr-1" /> {String(t("common.add"))}
                    </Button>
                )}
            </div>

            <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[30%]">ID</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[40%]">Tên thiết bị</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase w-[20%]">Loại</th>
                            <th className="px-3 py-2 w-[10%]" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-3 py-4 text-center text-xs text-muted-foreground italic">
                                    {String(t("common.noData"))}
                                </td>
                            </tr>
                        )}
                        {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-muted/30">
                                <td className="px-3 py-1.5">
                                    <Input
                                        className="h-7 text-xs font-mono"
                                        value={item.equipmentId}
                                        onChange={(e) => updateField(idx, "equipmentId", e.target.value)}
                                        placeholder="EQP_..."
                                        disabled={disabled}
                                    />
                                </td>
                                <td className="px-3 py-1.5">
                                    <Input
                                        className="h-7 text-xs"
                                        value={item.equipmentName}
                                        onChange={(e) => updateField(idx, "equipmentName", e.target.value)}
                                        placeholder="Tên máy..."
                                        disabled={disabled}
                                    />
                                </td>
                                <td className="px-3 py-1.5">
                                    <Input
                                        className="h-7 text-xs"
                                        value={item.equipmentType || ""}
                                        onChange={(e) => updateField(idx, "equipmentType", e.target.value)}
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
        </div>
    );
}
