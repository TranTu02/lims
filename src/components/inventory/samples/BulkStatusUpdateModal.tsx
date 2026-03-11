import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBulkUpdateSamples } from "@/api/samples";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
    open: boolean;
    onClose: () => void;
    sampleIds: string[];
    onSuccess?: () => void;
};

export function BulkStatusUpdateModal({ open, onClose, sampleIds, onSuccess }: Props) {
    const { t } = useTranslation();
    const updateMutation = useBulkUpdateSamples();
    const [selectedStatus, setSelectedStatus] = useState<string>("Disposed");
    const [note, setNote] = useState<string>("");

    const handleConfirm = async () => {
        if (!sampleIds.length) return;

        try {
            await updateMutation.mutateAsync({
                sampleIds,
                updateData: {
                    sampleStatus: selectedStatus as any,
                    sampleDisposalDate: new Date().toISOString(), // set it as disposed string
                    // we could add a note column but for now skip it
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
                    <DialogTitle>Tiêu hủy / Trả mẫu hàng loạt</DialogTitle>
                    <DialogDescription>Cập nhật trạng thái tiêu hủy hoặc trả lại cho {sampleIds.length} mẫu đã chọn.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Hành động</Label>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="-- Chọn --" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Disposed">Tiêu hủy</SelectItem>
                                <SelectItem value="Returned">Trả khách</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2 mt-2">
                        <Label>Ghi chú (Tùy chọn)</Label>
                        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lý do..." />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={updateMutation.isPending}>
                        {String(t("common.cancel"))}
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={updateMutation.isPending || !selectedStatus}>
                        {updateMutation.isPending ? String(t("common.loading")) : String(t("common.apply"))}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
