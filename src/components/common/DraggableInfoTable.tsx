import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InfoRow {
    label: string;
    value: string;
}

interface DraggableInfoTableProps {
    title: string;
    data: InfoRow[];
    isEditing: boolean;
    onChange: (data: InfoRow[]) => void;
}

export function DraggableInfoTable({ title, data, isEditing, onChange }: DraggableInfoTableProps) {
    const { t } = useTranslation();
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newData = [...data];
        const draggedItem = newData[draggedIndex];
        newData.splice(draggedIndex, 1);
        newData.splice(index, 0, draggedItem);

        onChange(newData);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleAddRow = () => {
        onChange([...data, { label: "", value: "" }]);
    };

    const handleDelete = (index: number) => {
        const newData = data.filter((_, i) => i !== index);
        onChange(newData);
    };

    const handleChange = (index: number, field: "label" | "value", value: string) => {
        const newData = [...data];
        newData[index] = { ...newData[index], [field]: value };
        onChange(newData);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
                {isEditing && (
                    <Button size="sm" variant="outline" onClick={handleAddRow} className="h-7 gap-1 text-xs">
                        <Plus className="h-3 w-3" />
                        {t("common.add")}
                    </Button>
                )}
            </div>

            <div className="border border-border rounded-lg overflow-hidden bg-background">
                <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            {isEditing && <th className="w-8 px-2 py-2"></th>}
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.field")}</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">{t("common.value")}</th>
                            {isEditing && <th className="w-16 px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase">{t("common.delete")}</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.length > 0 ? (
                            data.map((row, index) => (
                                <tr
                                    key={index}
                                    draggable={isEditing}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`${isEditing ? "cursor-move" : ""} hover:bg-muted/20 ${draggedIndex === index ? "opacity-50" : ""}`}
                                >
                                    {isEditing && (
                                        <td className="px-2 py-2">
                                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </td>
                                    )}
                                    <td className="px-3 py-2">
                                        {isEditing ? (
                                            <Input
                                                value={row.label}
                                                onChange={(e) => handleChange(index, "label", e.target.value)}
                                                className="h-7 text-sm bg-background"
                                                placeholder={t("common.placeholder.enterField")}
                                            />
                                        ) : (
                                            <span className="text-sm text-foreground">{row.label}</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        {isEditing ? (
                                            <Input
                                                value={row.value}
                                                onChange={(e) => handleChange(index, "value", e.target.value)}
                                                className="h-7 text-sm bg-background"
                                                placeholder={t("common.placeholder.enterValue")}
                                            />
                                        ) : (
                                            <span className="text-sm text-foreground font-medium">{row.value}</span>
                                        )}
                                    </td>
                                    {isEditing && (
                                        <td className="px-2 py-2 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(index)}
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isEditing ? 4 : 2} className="px-3 py-4 text-center text-sm text-muted-foreground">
                                    {isEditing ? t("common.placeholder.clickToAdd") : t("common.noData")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
