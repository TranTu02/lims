import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBulkUpdateSamples } from "@/api/samples";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const STORAGE_LOCATIONS = [
    { id: "Tu_Lanh_A", name: "Tủ Lạnh A" },
    { id: "Tu_Lanh_B", name: "Tủ Lạnh B" },
    { id: "Tu_Dong_C", name: "Tủ Đông C" },
    { id: "Ke_Kho_1", name: "Kệ Khô 1" },
    { id: "Ke_Kho_2", name: "Kệ Khô 2" },
];

type Props = {
    open: boolean;
    onClose: () => void;
    sampleIds: string[];
    onSuccess?: () => void;
};

export function BulkStorageUpdateModal({ open, onClose, sampleIds, onSuccess }: Props) {
    const { t } = useTranslation();
    const updateMutation = useBulkUpdateSamples();
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [customLocation, setCustomLocation] = useState<string>("");

    const handleConfirm = async () => {
        if (!sampleIds.length) return;

        const loc = selectedLocation === "custom" ? customLocation.trim() : selectedLocation;
        if (!loc) return;

        try {
            await updateMutation.mutateAsync({
                sampleIds,
                updateData: {
                    sampleStorageLoc: loc,
                    sampleStatus: "Retained", // Usually moving to storage also means saving it
                },
            });
            onSuccess?.();
            onClose();
        } catch (error) {
            // Error managed by mutation hook
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Sắp xếp vị trí hàng loạt</DialogTitle>
                    <DialogDescription>Cập nhật vị trí lưu kho cho {sampleIds.length} mẫu đã chọn.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Chọn vị trí lưu</Label>
                        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- Chọn vị trí --" />
                            </SelectTrigger>
                            <SelectContent>
                                {STORAGE_LOCATIONS.map((loc) => (
                                    <SelectItem key={loc.id} value={loc.name}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom">Nhập vị trí khác...</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedLocation === "custom" && (
                        <div className="grid gap-2 mt-2">
                            <Label>Nhập vị trí</Label>
                            <Input value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} placeholder="VD: Kệ 3, Tủ C..." />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
                        {String(t("common.cancel"))}
                    </Button>
                    <Button onClick={handleConfirm} disabled={updateMutation.isPending || !selectedLocation || (selectedLocation === "custom" && !customLocation.trim())}>
                        {updateMutation.isPending ? String(t("common.loading")) : String(t("common.apply"))}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
