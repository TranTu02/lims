import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useCreateLabInventory, useUpdateLabInventory, type LabInventory } from "@/api/generalInventory";

import { SearchSelectPicker, type PickerItem } from "@/components/library/protocols/SearchSelectPicker";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";
import { searchDocuments } from "@/api/documents";

export function EquipmentEditModal({ item, onClose }: { item?: LabInventory; onClose: () => void }) {
    const { t } = useTranslation();
    const createItem = useCreateLabInventory();
    const updateItem = useUpdateLabInventory();

    const [formData, setFormData] = useState({
        labInventoryId: "",
        labInventoryName: "",
        labInventoryCode: "",
        labInventoryStatus: "Ready",
        labInventoryLocation: "",
        labInventoryManufacturer: "",
        labInventoryModel: "",
        labInventorySerial: "",
        labInventoryImportDate: "",
        labInventoryWarrantyExpiryDate: "",
        labInventoryLastCalibrationDate: "",
        labInventoryNextCalibrationDate: "",
        labInventoryNotes: "",
    });

    const [documentIds, setDocumentIds] = useState<string[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<PickerItem[]>([]);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                labInventoryId: item.labInventoryId || "",
                labInventoryName: item.labInventoryName || "",
                labInventoryCode: item.labInventoryCode || "",
                labInventoryStatus: item.labInventoryStatus || "Ready",
                labInventoryLocation: item.labInventoryLocation || "",
                labInventoryManufacturer: item.labInventoryManufacturer || "",
                labInventoryModel: item.labInventoryModel || "",
                labInventorySerial: item.labInventorySerial || "",
                labInventoryImportDate: item.labInventoryImportDate ? item.labInventoryImportDate.split("T")[0] : "",
                labInventoryWarrantyExpiryDate: item.labInventoryWarrantyExpiryDate ? item.labInventoryWarrantyExpiryDate.split("T")[0] : "",
                labInventoryLastCalibrationDate: item.labInventoryLastCalibrationDate ? item.labInventoryLastCalibrationDate.split("T")[0] : "",
                labInventoryNextCalibrationDate: item.labInventoryNextCalibrationDate ? item.labInventoryNextCalibrationDate.split("T")[0] : "",
                labInventoryNotes: item.labInventoryNotes || "",
            });

            // If we have documents preloaded, map them. Or simply read from item.labInventoryDocumentIds
            const docs = item.labInventoryDocumentIds || [];
            
            // Try to map from item.labInventoryDocuments if full data is active, else just ids
            const mappedDocs = (item.labInventoryDocuments || []).map((d: any) => ({
                id: d.documentId,
                label: d.documentTitle || d.documentId,
                sublabel: d.documentId,
            }));

            if (mappedDocs.length > 0) {
                setDocumentIds(mappedDocs.map(x => x.id));
                setSelectedDocs(mappedDocs);
            } else if (docs.length > 0) {
                setDocumentIds(docs);
                setSelectedDocs(docs.map(id => ({ id, label: id, sublabel: "" })));
            }
        }
    }, [item]);

    const isPending = createItem.isPending || updateItem.isPending;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const searchDocumentsFn = useCallback(async (q: string): Promise<PickerItem[]> => {
        try {
            const docs = await searchDocuments(q);
            return docs.map((d) => ({
                id: d.documentId,
                label: d.documentTitle || d.documentId,
                sublabel: d.documentId,
            }));
        } catch {
            return [];
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.labInventoryId || !formData.labInventoryName) {
            alert("Mã và Tên Thiết bị không được bỏ trống.");
            return;
        }

        const payload = {
            labInventoryId: formData.labInventoryId,
            labInventoryName: formData.labInventoryName,
            labInventoryCode: formData.labInventoryCode || null,
            labInventoryStatus: formData.labInventoryStatus || null,
            labInventoryLocation: formData.labInventoryLocation || null,
            labInventoryManufacturer: formData.labInventoryManufacturer || null,
            labInventoryModel: formData.labInventoryModel || null,
            labInventorySerial: formData.labInventorySerial || null,
            labInventoryImportDate: formData.labInventoryImportDate || null,
            labInventoryWarrantyExpiryDate: formData.labInventoryWarrantyExpiryDate || null,
            labInventoryLastCalibrationDate: formData.labInventoryLastCalibrationDate || null,
            labInventoryNextCalibrationDate: formData.labInventoryNextCalibrationDate || null,
            labInventoryNotes: formData.labInventoryNotes || null,
            labInventoryDocumentIds: documentIds.length ? documentIds : null,
        };

        if (item) {
            updateItem.mutate({ body: payload }, { onSuccess: onClose });
        } else {
            createItem.mutate({ body: payload }, { onSuccess: onClose });
        }
    };

    return (
        <>
            <Dialog open onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[700px] p-0 flex flex-col max-h-[90vh]">
                    <DialogHeader className="px-6 border-b py-4">
                        <DialogTitle>
                            {item ? String(t("inventory.general.equipment.edit", { defaultValue: "Sửa Thiết bị" })) : String(t("inventory.general.equipment.create", { defaultValue: "Thêm Thiết bị" }))}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                        {/* 1. Basic Information */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm">Thông tin cơ bản</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.id"))} *</Label>
                                    <Input
                                        name="labInventoryId"
                                        value={formData.labInventoryId}
                                        onChange={handleChange}
                                        disabled={!!item || isPending}
                                        placeholder="EQ-HPLC-01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.name"))} *</Label>
                                    <Input
                                        name="labInventoryName"
                                        value={formData.labInventoryName}
                                        onChange={handleChange}
                                        disabled={isPending}
                                        placeholder="Agilent 1260 HPLC..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.code"))}</Label>
                                    <Input
                                        name="labInventoryCode"
                                        value={formData.labInventoryCode}
                                        onChange={handleChange}
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.status"))}</Label>
                                    <Input
                                        name="labInventoryStatus"
                                        value={formData.labInventoryStatus}
                                        onChange={handleChange}
                                        disabled={isPending}
                                        placeholder="Ready"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label>{String(t("inventory.general.equipment.location", { defaultValue: "Vị trí đặt" }))}</Label>
                                    <Input
                                        name="labInventoryLocation"
                                        value={formData.labInventoryLocation}
                                        onChange={handleChange}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Detail Specs */}
                        <div className="space-y-4 pt-2 border-t">
                            <h3 className="font-semibold text-sm">Cấu hình & Nhận diện</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.manufacturer", { defaultValue: "Hãng sản xuất" }))}</Label>
                                    <Input name="labInventoryManufacturer" value={formData.labInventoryManufacturer} onChange={handleChange} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.model", { defaultValue: "Model" }))}</Label>
                                    <Input name="labInventoryModel" value={formData.labInventoryModel} onChange={handleChange} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.serial", { defaultValue: "Số Serial" }))}</Label>
                                    <Input name="labInventorySerial" value={formData.labInventorySerial} onChange={handleChange} disabled={isPending} />
                                </div>
                            </div>
                        </div>

                        {/* 3. Dates & Maintenance */}
                        <div className="space-y-4 pt-2 border-t">
                            <h3 className="font-semibold text-sm">Theo dõi bảo hành & Hiệu chuẩn</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.importDate", { defaultValue: "Ngày nhập" }))}</Label>
                                    <Input type="date" name="labInventoryImportDate" value={formData.labInventoryImportDate} onChange={handleChange} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.warrantyExpiry", { defaultValue: "Hạn bảo hành" }))}</Label>
                                    <Input type="date" name="labInventoryWarrantyExpiryDate" value={formData.labInventoryWarrantyExpiryDate} onChange={handleChange} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.lastCal", { defaultValue: "Hiệu chuẩn gần nhất" }))}</Label>
                                    <Input type="date" name="labInventoryLastCalibrationDate" value={formData.labInventoryLastCalibrationDate} onChange={handleChange} disabled={isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{String(t("inventory.general.equipment.nextCal", { defaultValue: "Hạn hiệu chuẩn" }))}</Label>
                                    <Input type="date" name="labInventoryNextCalibrationDate" value={formData.labInventoryNextCalibrationDate} onChange={handleChange} disabled={isPending} />
                                </div>
                            </div>
                        </div>

                        {/* 4. Notes & Documents */}
                        <div className="space-y-4 pt-2 border-t">
                            <h3 className="font-semibold text-sm">Ghi chú & Tài liệu</h3>
                            <div className="space-y-2">
                                <Label>{String(t("common.notes", { defaultValue: "Ghi chú" }))}</Label>
                                <textarea
                                    name="labInventoryNotes"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.labInventoryNotes}
                                    onChange={handleChange}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <SearchSelectPicker
                                    label={String(t("inventory.general.equipment.documents", { defaultValue: "Tài liệu đính kèm" }))}
                                    selected={selectedDocs}
                                    onChange={(items) => {
                                        setDocumentIds(items.map((i) => i.id));
                                        setSelectedDocs(items);
                                    }}
                                    onSearch={searchDocumentsFn}
                                    placeholder={String(t("documentCenter.headers.allDesc", { defaultValue: "Tìm tài liệu đính kèm..." }))}
                                />
                                <div>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {String(t("inventory.general.equipment.uploadDoc", { defaultValue: "Tải lên tài liệu mới" }))}
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </form>

                    <DialogFooter className="px-6 py-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                            {String(t("common.cancel", { defaultValue: "Hủy" }))}
                        </Button>
                        <Button onClick={handleSubmit} type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {String(t("common.save", { defaultValue: "Lưu" }))}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DocumentUploadModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                fixedDocumentType="EQUIPMENT"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        setDocumentIds((s) => [...s, doc.documentId]);
                        setSelectedDocs((s) => [...s, { id: doc.documentId, label: doc.documentTitle || doc.documentId, sublabel: doc.documentId }]);
                    }
                }}
            />
        </>
    );
}
