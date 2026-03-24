import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useCreateLabTool, useUpdateLabTool, type LabTool } from "@/api/generalInventory";

export function LabToolEditModal({ item, onClose }: { item?: LabTool; onClose: () => void }) {
    const { t } = useTranslation();
    const createItem = useCreateLabTool();
    const updateItem = useUpdateLabTool();

    const [labToolId, setLabToolId] = useState("");
    const [labToolName, setLabToolName] = useState("");
    const [labToolCode, setLabToolCode] = useState("");
    const [labToolType, setLabToolType] = useState("");
    const [labToolStatus, setLabToolStatus] = useState("Ready");
    const [lastCalibrationDate, setLastCalibrationDate] = useState("");
    const [nextCalibrationDate, setNextCalibrationDate] = useState("");

    useEffect(() => {
        if (item) {
            setLabToolId(item.labToolId || "");
            setLabToolName(item.labToolName || "");
            setLabToolCode(item.labToolCode || "");
            setLabToolType(item.labToolType || "");
            setLabToolStatus(item.labToolStatus || "Ready");
            setLastCalibrationDate(item.lastCalibrationDate ? item.lastCalibrationDate.split("T")[0] : "");
            setNextCalibrationDate(item.nextCalibrationDate ? item.nextCalibrationDate.split("T")[0] : "");
        }
    }, [item]);

    const isPending = createItem.isPending || updateItem.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!labToolId || !labToolName) {
            alert("Mã và Tên Dụng cụ không được bỏ trống.");
            return;
        }

        const payload = {
            labToolId,
            labToolName,
            labToolCode: labToolCode || null,
            labToolType: labToolType || null,
            labToolStatus: labToolStatus || null,
            lastCalibrationDate: lastCalibrationDate || null,
            nextCalibrationDate: nextCalibrationDate || null,
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
                        {item ? String(t("inventory.general.labTools.edit", { defaultValue: "Sửa Dụng cụ" })) : String(t("inventory.general.labTools.create", { defaultValue: "Thêm Dụng cụ" }))}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>{String(t("inventory.general.labTools.id"))} *</Label>
                        <Input
                            value={labToolId}
                            onChange={(e) => setLabToolId(e.target.value)}
                            disabled={!!item || isPending}
                            placeholder="TOOL-001"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{String(t("inventory.general.labTools.name"))} *</Label>
                        <Input
                            value={labToolName}
                            onChange={(e) => setLabToolName(e.target.value)}
                            disabled={isPending}
                            placeholder="Micropipette..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{String(t("inventory.general.labTools.code"))}</Label>
                            <Input
                                value={labToolCode}
                                onChange={(e) => setLabToolCode(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{String(t("inventory.general.labTools.type"))}</Label>
                            <Input
                                value={labToolType}
                                onChange={(e) => setLabToolType(e.target.value)}
                                disabled={isPending}
                                placeholder="Pipette..."
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{String(t("inventory.general.labTools.lastCal"))}</Label>
                            <Input
                                type="date"
                                value={lastCalibrationDate}
                                onChange={(e) => setLastCalibrationDate(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{String(t("inventory.general.labTools.nextCal", { defaultValue: "Hạn hiệu chuẩn" }))}</Label>
                            <Input
                                type="date"
                                value={nextCalibrationDate}
                                onChange={(e) => setNextCalibrationDate(e.target.value)}
                                disabled={isPending}
                            />
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
