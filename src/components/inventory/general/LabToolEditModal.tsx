import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { useCreateLabSku, useUpdateLabSku, type LabSku } from "@/api/generalInventory";

export function LabToolEditModal({ item, onClose }: { item?: LabSku; onClose: () => void }) {
    const { t } = useTranslation();
    const createItem = useCreateLabSku();
    const updateItem = useUpdateLabSku();

    const [formData, setFormData] = useState({
        labSkuId: "",
        labSkuName: "",
        labSkuCode: "",
        labSkuType: "Tool",
        labSkuUnit: "",
        labSkuManufacturer: "",
        labSkuModel: "",
        requiresCalibration: false,
    });

    useEffect(() => {
        if (item) {
            setFormData({
                labSkuId: item.labSkuId || "",
                labSkuName: item.labSkuName || "",
                labSkuCode: item.labSkuCode || "",
                labSkuType: item.labSkuType || "Tool",
                labSkuUnit: item.labSkuUnit || "",
                labSkuManufacturer: item.labSkuManufacturer || "",
                labSkuModel: item.labSkuModel || "",
                requiresCalibration: !!item.requiresCalibration,
            });
        }
    }, [item]);

    const isPending = createItem.isPending || updateItem.isPending;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.labSkuId || !formData.labSkuName) {
            alert("Mã và Tên Danh mục (SKU) không được để trống.");
            return;
        }

        const payload = {
            ...formData,
            labSkuCode: formData.labSkuCode || null,
            labSkuManufacturer: formData.labSkuManufacturer || null,
            labSkuModel: formData.labSkuModel || null,
            labSkuUnit: formData.labSkuUnit || null,
        };

        if (item) {
            updateItem.mutate({ body: payload }, { onSuccess: onClose });
        } else {
            createItem.mutate({ body: payload }, { onSuccess: onClose });
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {item ? "Sửa Danh mục (SKU)" : "Thêm Danh mục (SKU)"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Mã Danh mục (SKU ID) *</Label>
                        <Input
                            name="labSkuId"
                            value={formData.labSkuId}
                            onChange={handleChange}
                            disabled={!!item || isPending}
                            placeholder="SKU-TOOL-001"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tên Danh mục *</Label>
                        <Input
                            name="labSkuName"
                            value={formData.labSkuName}
                            onChange={handleChange}
                            disabled={isPending}
                            placeholder="Micropipette Agilent..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Mã SKU nội bộ</Label>
                            <Input
                                name="labSkuCode"
                                value={formData.labSkuCode}
                                onChange={handleChange}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Loại</Label>
                            <Input
                                name="labSkuType"
                                value={formData.labSkuType}
                                onChange={handleChange}
                                disabled={isPending}
                                placeholder="Tool / Equipment / Material"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Đơn vị tính</Label>
                            <Input
                                name="labSkuUnit"
                                value={formData.labSkuUnit}
                                onChange={handleChange}
                                disabled={isPending}
                                placeholder="Cái, Bộ, Máy..."
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                            <Checkbox 
                                id="requiresCalibration" 
                                checked={formData.requiresCalibration}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresCalibration: !!checked }))}
                                disabled={isPending}
                            />
                            <Label htmlFor="requiresCalibration" className="text-xs">Yêu cầu hiệu chuẩn</Label>
                        </div>
                    </div>
                    
                    <DialogFooter className="pt-4 mt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                            {String(t("common.cancel", { defaultValue: "Hủy" }))}
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {String(t("common.save", { defaultValue: "Lưu" }))}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
