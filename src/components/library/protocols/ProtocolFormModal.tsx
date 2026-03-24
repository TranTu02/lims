import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateProtocol, useUpdateProtocol, useProtocolDetail, type Protocol } from "@/api/library";
import { ChemicalBomTable, type ChemicalBomItem } from "../shared/ChemicalBomTable";
import { EquipmentSnapshotTable, type EquipmentSnapshotItem } from "../shared/EquipmentSnapshotTable";
import { LabToolSnapshotTable, type LabToolSnapshotItem } from "../shared/LabToolSnapshotTable";
import { ProtocolMatrixManager } from "./ProtocolMatrixManager";
import { SearchSelectPicker, type PickerItem } from "./SearchSelectPicker";
import { searchDocuments } from "@/api/documents";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";
import { Upload, FileText } from "lucide-react";

type Props = {
    onClose: () => void;
    protocolId?: string; // If provided, fetches and edits this protocol.
    initialData?: {
        protocolCode: string;
    };
    onSuccess?: (protocol: Protocol) => void;
};

export function ProtocolFormModal({ onClose, protocolId, initialData, onSuccess }: Props) {
    const { t } = useTranslation();
    const isEdit = Boolean(protocolId);

    const { data: protocolDetail, isLoading: isFetching } = useProtocolDetail({
        params: { protocolId: protocolId || "" },
    });

    const createP = useCreateProtocol();
    const updateP = useUpdateProtocol();

    const [protocolCode, setProtocolCode] = useState(String(initialData?.protocolCode || ""));
    const [protocolSource, setProtocolSource] = useState("");
    const [protocolDescription, setProtocolDescription] = useState("");
    const [turnaroundDays, setTurnaroundDays] = useState<number | "">("");
    const [chemicals, setChemicals] = useState<ChemicalBomItem[]>([]);
    
    // Document States
    const [sopDocumentIds, setSopDocumentIds] = useState<string[]>([]);
    const [selectedSopDocs, setSelectedSopDocs] = useState<PickerItem[]>([]);
    const [protocolDocumentIds, setProtocolDocumentIds] = useState<string[]>([]);
    const [selectedProtocolDocs, setSelectedProtocolDocs] = useState<PickerItem[]>([]);

    const [uploadSopOpen, setUploadSopOpen] = useState(false);
    const [uploadDocOpen, setUploadDocOpen] = useState(false);

    // Equipment & Lab Tools
    const [equipments, setEquipments] = useState<EquipmentSnapshotItem[]>([]);
    const [labTools, setLabTools] = useState<LabToolSnapshotItem[]>([]);

    useEffect(() => {
        if (protocolDetail && isEdit) {
            setProtocolCode(String(protocolDetail.protocolCode || ""));
            setProtocolSource(String(protocolDetail.protocolSource || ""));
            setProtocolDescription(String(protocolDetail.protocolDescription || ""));
            setTurnaroundDays(protocolDetail.turnaroundDays ?? "");

            const sopIds = protocolDetail.sopDocumentIds || [];
            setSopDocumentIds(sopIds);
            setSelectedSopDocs(sopIds.map(id => ({ id, label: id, sublabel: "" })));
            
            const docIds = protocolDetail.protocolDocumentIds || [];
            setProtocolDocumentIds(docIds);
            setSelectedProtocolDocs(docIds.map(id => ({ id, label: id, sublabel: "" })));

            setEquipments(protocolDetail.equipments || []);
            setLabTools(protocolDetail.labTools || []);

            if (protocolDetail.chemicals && Array.isArray(protocolDetail.chemicals)) {
                setChemicals(
                    protocolDetail.chemicals.map((c: any) => ({
                        chemicalSkuId: c.chemicalSkuId || c.chemicalId || "",
                        chemicalName: c.chemicalName || "",
                        consumedQty: c.consumedQty || c.amountUsed || "",
                        unit: c.chemicalBaseUnit || c.unit || c.measurementUnit || "",
                    })),
                );
            }
        }
    }, [protocolDetail, isEdit]);

    const submit = async () => {
        const codeTrimmed = String(protocolCode || "").trim();
        if (!codeTrimmed) return;

        const sourceTrimmed = String(protocolSource || "").trim();
        const descTrimmed = String(protocolDescription || "").trim();

        const payloadChemicals =
            chemicals.length > 0
                ? chemicals.map((c) => ({
                      chemicalSkuId: c.chemicalSkuId || "",
                      chemicalName: c.chemicalName || "",
                      consumedQty: c.consumedQty || "",
                      chemicalBaseUnit: c.unit || "",
                  }))
                : [];

        if (isEdit) {
            const result = await updateP.mutateAsync({
                body: {
                    protocolId: protocolId!,
                    protocolCode: codeTrimmed,
                    protocolSource: sourceTrimmed || "Manual",
                    protocolDescription: descTrimmed || null,
                    turnaroundDays: turnaroundDays === "" ? null : Number(turnaroundDays),
                    sopDocumentIds: sopDocumentIds.length > 0 ? sopDocumentIds : null,
                    protocolDocumentIds: protocolDocumentIds.length > 0 ? protocolDocumentIds : null,
                    equipmentIds: equipments.map(e => e.equipmentId).filter(Boolean),
                    equipments: equipments.filter(e => e.equipmentId || e.equipmentName),
                    labToolIds: labTools.map(l => l.labToolId).filter(Boolean),
                    labTools: labTools.filter(l => l.labToolId || l.labToolName),
                    chemicals: payloadChemicals,
                },
            });
            onSuccess?.(result);
        } else {
            const result = await createP.mutateAsync({
                body: {
                    protocolCode: codeTrimmed,
                    protocolSource: sourceTrimmed || "Manual",
                    protocolDescription: descTrimmed || null,
                    turnaroundDays: turnaroundDays === "" ? null : Number(turnaroundDays),
                    sopDocumentIds: sopDocumentIds.length > 0 ? sopDocumentIds : null,
                    protocolDocumentIds: protocolDocumentIds.length > 0 ? protocolDocumentIds : null,
                    equipmentIds: equipments.map(e => e.equipmentId).filter(Boolean),
                    equipments: equipments.filter(e => e.equipmentId || e.equipmentName),
                    labToolIds: labTools.map(l => l.labToolId).filter(Boolean),
                    labTools: labTools.filter(l => l.labToolId || l.labToolName),
                    chemicals: payloadChemicals,
                },
            });
            onSuccess?.(result);
        }
        onClose();
    };

    const isPending = createP.isPending || updateP.isPending;
    const canSubmit = String(protocolCode || "").trim().length > 0 && !isPending;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div
                className={`bg-background rounded-lg border border-border w-full ${isEdit ? "max-w-6xl" : "max-w-2xl"} shadow-xl flex flex-col overflow-hidden transition-all duration-300`}
                style={{ maxHeight: "85vh", minHeight: 600 }}
            >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                    <div className="text-base font-semibold text-foreground">
                        {isEdit ? String(t("common.edit")) : String(t("common.create"))} {String(t("library.protocols.create.title", { defaultValue: "Phương pháp" }))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        {String(t("common.close"))}
                    </Button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Form Column */}
                    <div className={`p-5 space-y-4 overflow-y-auto flex flex-col ${isEdit ? "w-1/2 border-r border-border" : "w-full"}`}>
                        {isFetching ? (
                            <div className="flex items-center gap-2 justify-center p-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" /> {String(t("common.loading"))}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        {String(t("library.protocols.create.protocolCode", { defaultValue: "Mã phương pháp" }))} <span className="text-destructive">*</span>
                                    </label>
                                    <Input value={protocolCode} onChange={(e) => setProtocolCode(e.target.value)} placeholder="Enter Code" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">{String(t("library.protocols.create.protocolSource", { defaultValue: "Nguồn gốc" }))}</label>
                                    <Input value={protocolSource} onChange={(e) => setProtocolSource(e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">{String(t("library.protocols.create.protocolDescription", { defaultValue: "Mô tả" }))}</label>
                                    <Input value={protocolDescription} onChange={(e) => setProtocolDescription(e.target.value)} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">{String(t("library.protocols.create.turnaroundDays", { defaultValue: "Dự kiến số ngày hoàn thành" }))}</label>
                                    <Input 
                                        type="number" 
                                        min="0"
                                        value={turnaroundDays} 
                                        onChange={(e) => setTurnaroundDays(e.target.value === "" ? "" : Number(e.target.value))} 
                                    />
                                </div>

                                <div className="mt-6 border-t pt-4">
                                    <ChemicalBomTable items={chemicals} onChange={setChemicals} disabled={isPending} />
                                </div>

                                <div className="mt-6 border-t pt-4 space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                                                <FileText className="h-4 w-4" />
                                                {String(t("library.protocols.create.sopDocuments", { defaultValue: "Hồ sơ SOP" }))}
                                            </label>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setUploadSopOpen(true)} className="h-7 text-[10px]">
                                                <Upload className="h-3 w-3 mr-1" /> {String(t("common.upload"))}
                                            </Button>
                                        </div>
                                        <SearchSelectPicker
                                            label={String(t("library.protocols.create.selectSop", { defaultValue: "Chọn hồ sơ SOP" }))}
                                            selected={selectedSopDocs}
                                            onChange={(items) => {
                                                setSelectedSopDocs(items);
                                                setSopDocumentIds(items.map(i => i.id));
                                            }}
                                            onSearch={async (q) => {
                                                const res = await searchDocuments(q);
                                                return res.map(d => ({ id: d.documentId, label: d.documentTitle || d.documentId, sublabel: d.documentId }));
                                            }}
                                            placeholder={String(t("library.protocols.create.searchSop", { defaultValue: "Tìm hồ sơ SOP..." }))}
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                                                <FileText className="h-4 w-4" />
                                                {String(t("library.protocols.create.protocolDocuments", { defaultValue: "Tài liệu phương pháp" }))}
                                            </label>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setUploadDocOpen(true)} className="h-7 text-[10px]">
                                                <Upload className="h-3 w-3 mr-1" /> {String(t("common.upload"))}
                                            </Button>
                                        </div>
                                        <SearchSelectPicker
                                            label={String(t("library.protocols.create.selectDoc", { defaultValue: "Chọn tài liệu" }))}
                                            selected={selectedProtocolDocs}
                                            onChange={(items) => {
                                                setSelectedProtocolDocs(items);
                                                setProtocolDocumentIds(items.map(i => i.id));
                                            }}
                                            onSearch={async (q) => {
                                                const res = await searchDocuments(q);
                                                return res.map(d => ({ id: d.documentId, label: d.documentTitle || d.documentId, sublabel: d.documentId }));
                                            }}
                                            placeholder={String(t("library.protocols.create.searchDoc", { defaultValue: "Tìm tài liệu phương pháp..." }))}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 border-t pt-4">
                                    <EquipmentSnapshotTable items={equipments} onChange={setEquipments} disabled={isPending} />
                                </div>

                                <div className="mt-8 border-t pt-4">
                                    <LabToolSnapshotTable items={labTools} onChange={setLabTools} disabled={isPending} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Matrix Column */}
                    {isEdit && protocolId && (
                        <div className="w-1/2 p-5 overflow-y-auto bg-muted/5 relative">
                            <ProtocolMatrixManager protocolId={protocolId} />
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 flex items-center justify-end gap-2 border-t border-border bg-muted/10 shrink-0">
                    <Button variant="outline" onClick={onClose} type="button" disabled={isPending}>
                        {String(t("common.cancel"))}
                    </Button>
                    <Button onClick={submit} disabled={!canSubmit || isFetching} type="button">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {String(t("common.save"))}
                    </Button>
                </div>
            </div>

            <DocumentUploadModal
                open={uploadSopOpen}
                onClose={() => setUploadSopOpen(false)}
                fixedDocumentType="PROTOCOL_SOP"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        const newId = doc.documentId;
                        const newItem = { id: newId, label: doc.documentTitle || newId, sublabel: newId };
                        setSopDocumentIds(prev => [...prev, newId]);
                        setSelectedSopDocs(prev => [...prev, newItem]);
                    }
                }}
            />

            <DocumentUploadModal
                open={uploadDocOpen}
                onClose={() => setUploadDocOpen(false)}
                fixedDocumentType="PROTOCOL_DOC"
                onSuccess={(doc) => {
                    if (doc?.documentId) {
                        const newId = doc.documentId;
                        const newItem = { id: newId, label: doc.documentTitle || newId, sublabel: newId };
                        setProtocolDocumentIds(prev => [...prev, newId]);
                        setSelectedProtocolDocs(prev => [...prev, newItem]);
                    }
                }}
            />
        </div>
    );
}
