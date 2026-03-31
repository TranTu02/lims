import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Upload, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateProtocol, useUpdateProtocol, useProtocolDetail, type Protocol } from "@/api/library";
import { ChemicalBomTable, type ChemicalBomItem } from "../shared/ChemicalBomTable";
import { EquipmentSnapshotTable, type EquipmentSnapshotItem } from "../shared/EquipmentSnapshotTable";
import { LabToolSnapshotTable, type LabToolSnapshotItem } from "../shared/LabToolSnapshotTable";
import { AccreditationTagInput } from "../shared/AccreditationTagInput";
import type { AccreditationValue } from "../shared/AccreditationTagInput";
import { ProtocolMatrixManager } from "./ProtocolMatrixManager";
import { SearchSelectPicker, type PickerItem } from "@/components/shared/SearchSelectPicker";
import { searchDocuments } from "@/api/documents";
import { DocumentUploadModal } from "@/components/document/DocumentUploadModal";

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
    const [protocolTitle, setProtocolTitle] = useState("");
    const [protocolSource, setProtocolSource] = useState("");
    const [protocolDescription, setProtocolDescription] = useState("");
    const [turnaroundDays, setTurnaroundDays] = useState<number | "">("");
    const [accreditationKeys, setAccreditationKeys] = useState<AccreditationValue>({});
    
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
            setProtocolTitle(String(protocolDetail.protocolTitle || ""));
            setProtocolSource(String(protocolDetail.protocolSource || ""));
            setProtocolDescription(String(protocolDetail.protocolDescription || ""));
            setTurnaroundDays(protocolDetail.turnaroundDays ?? "");
            setAccreditationKeys((protocolDetail.protocolAccreditation as AccreditationValue) || {});

            const allDocs = protocolDetail.documents || [];
            
            // Initializing SOP Documents
            const sops = allDocs.filter(d => (d as any).documentType === "PROTOCOL_SOP");
            if (sops.length > 0) {
                setSopDocumentIds(sops.map(d => d.documentId));
                setSelectedSopDocs(sops.map(d => ({ 
                    id: d.documentId, 
                    label: d.documentTitle || d.jsonContent?.documentTitle || d.file?.fileName || d.documentId, 
                    sublabel: d.documentId 
                })));
            } else if (protocolDetail.sopDocumentIds?.length) {
                const ids = protocolDetail.sopDocumentIds;
                setSopDocumentIds(ids);
                setSelectedSopDocs(ids.map(id => ({ id, label: id, sublabel: "" })));
            }
            
            // Initializing Protocol Documents
            const pDocs = allDocs.filter(d => (d as any).documentType === "PROTOCOL_DOC" || !(d as any).documentType);
            if (pDocs.length > 0) {
                setProtocolDocumentIds(pDocs.map(d => d.documentId));
                setSelectedProtocolDocs(pDocs.map(d => ({ 
                    id: d.documentId, 
                    label: d.documentTitle || d.jsonContent?.documentTitle || d.file?.fileName || d.documentId, 
                    sublabel: d.documentId 
                })));
            } else if (protocolDetail.protocolDocumentIds?.length) {
                const ids = protocolDetail.protocolDocumentIds;
                setProtocolDocumentIds(ids);
                setSelectedProtocolDocs(ids.map(id => ({ id, label: id, sublabel: "" })));
            }

            setEquipments(protocolDetail.equipments || []);
            setLabTools(protocolDetail.labTools || []);

            if (protocolDetail.chemicals && Array.isArray(protocolDetail.chemicals)) {
                setChemicals(
                    protocolDetail.chemicals.map((c: any) => ({
                        chemicalSkuId: c.chemicalSkuId || "",
                        chemicalName: c.chemicalName || "",
                        consumedQty: c.consumedQty || "",
                        unit: c.chemicalBaseUnit || c.unit || "",
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
        const titleTrimmed = String(protocolTitle || "").trim();

        const payloadChemicals =
            chemicals.length > 0
                ? chemicals.map((c) => ({
                      chemicalSkuId: c.chemicalSkuId || "",
                      chemicalName: c.chemicalName || "",
                      consumedQty: c.consumedQty || "",
                      chemicalBaseUnit: c.unit || "",
                  }))
                : [];

        const payload = {
            protocolCode: codeTrimmed,
            protocolTitle: titleTrimmed || null,
            protocolSource: sourceTrimmed || "Manual",
            protocolDescription: descTrimmed || undefined,
            protocolAccreditation: Object.keys(accreditationKeys).length > 0 ? accreditationKeys : undefined,
            turnaroundDays: turnaroundDays === "" ? undefined : Number(turnaroundDays),
            sopDocumentIds: sopDocumentIds.length > 0 ? sopDocumentIds : undefined,
            protocolDocumentIds: protocolDocumentIds.length > 0 ? protocolDocumentIds : undefined,
            equipmentIds: equipments.map(e => e.equipmentId).filter(Boolean),
            equipments: equipments.filter(e => e.equipmentId || e.equipmentName),
            labToolIds: labTools.map(l => l.labToolId).filter(Boolean),
            labTools: labTools.filter(l => l.labToolId || l.labToolName),
            chemicals: payloadChemicals,
        };

        if (isEdit) {
            const result = await updateP.mutateAsync({
                body: {
                    ...payload,
                    protocolId: protocolId!,
                },
            });
            onSuccess?.(result);
        } else {
            const result = await createP.mutateAsync({
                body: payload,
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
                style={{ maxHeight: "95vh", height: "90vh" }}
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
                    <div className={`p-5 space-y-6 overflow-y-auto ${isEdit ? "w-[55%] border-r border-border" : "w-full"}`}>
                        {isFetching ? (
                            <div className="flex items-center gap-2 justify-center p-8 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" /> {String(t("common.loading"))}
                            </div>
                        ) : (
                            <>
                                {/* Basic Info Section */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground uppercase">{String(t("library.protocols.protocolCode"))} *</label>
                                            <Input value={protocolCode} onChange={(e) => setProtocolCode(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground uppercase">{String(t("library.protocols.protocolSource"))}</label>
                                            <Input value={protocolSource} onChange={(e) => setProtocolSource(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-muted-foreground uppercase">{String(t("library.protocols.protocolDescription"))}</label>
                                        <Input value={protocolDescription} onChange={(e) => setProtocolDescription(e.target.value)} placeholder="Nhập mô tả phương pháp..." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground uppercase">{String(t("library.protocols.protocolAccreditation.title"))}</label>
                                            <AccreditationTagInput value={accreditationKeys} onChange={setAccreditationKeys} disabled={isPending} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground uppercase">{String(t("library.protocols.turnaroundDays"))}</label>
                                            <Input 
                                                type="number" 
                                                min="0"
                                                value={turnaroundDays} 
                                                onChange={(e) => setTurnaroundDays(e.target.value === "" ? "" : Number(e.target.value))} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Documents Section */}
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                                                <FileText className="h-4 w-4 text-primary" />
                                                {String(t("library.protocols.create.protocolDocuments", { defaultValue: "Tài liệu đính kèm" }))}
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setUploadDocOpen(true)} className="h-7 text-[10px]">
                                                <Upload className="h-3 w-3 mr-1" /> {String(t("common.upload"))}
                                            </Button>
                                        </div>
                                        <SearchSelectPicker
                                            label={String(t("library.protocols.create.protocolDocuments", { defaultValue: "Tài liệu đính kèm" }))}
                                            selected={selectedProtocolDocs}
                                            onChange={(items) => {
                                                setSelectedProtocolDocs(items);
                                                setProtocolDocumentIds(items.map(i => i.id));
                                            }}
                                            onSearch={async (q) => {
                                                const res = await searchDocuments(q, "PROTOCOL_DOC");
                                                return res.map(d => ({ id: d.documentId, label: d.documentTitle || d.documentId, sublabel: d.documentId }));
                                            }}
                                            placeholder={String(t("library.protocols.create.searchDoc", { defaultValue: "Tìm tài liệu trong hệ thống..." }))}
                                        />
                                    </div>
                                </div>

                                {/* Resource Tables */}
                                <div className="space-y-8 pt-4 border-t border-border">
                                    <div className="space-y-2">
                                        <ChemicalBomTable items={chemicals} onChange={setChemicals} disabled={isPending} />
                                    </div>

                                    <div className="space-y-2">
                                        <EquipmentSnapshotTable items={equipments} onChange={setEquipments} disabled={isPending} />
                                    </div>

                                    <div className="space-y-2">
                                        <LabToolSnapshotTable items={labTools} onChange={setLabTools} disabled={isPending} />
                                    </div>
                                </div>

                                {/* SOP Section (Optional/Additional) */}
                                <div className="space-y-3 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            {String(t("library.protocols.create.sopDocuments", { defaultValue: "Hồ sơ SOP (Quy trình chuẩn)" }))}
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setUploadSopOpen(true)} className="h-7 text-[10px]">
                                            <Upload className="h-3 w-3 mr-1" /> {String(t("common.upload"))}
                                        </Button>
                                    </div>
                                    <SearchSelectPicker
                                        label={String(t("library.protocols.create.sopDocuments", { defaultValue: "Hồ sơ SOP (Quy trình chuẩn)" }))}
                                        selected={selectedSopDocs}
                                        onChange={(items) => {
                                            setSelectedSopDocs(items);
                                            setSopDocumentIds(items.map(i => i.id));
                                        }}
                                        onSearch={async (q) => {
                                            const res = await searchDocuments(q, "PROTOCOL_SOP");
                                            return res.map(d => ({ id: d.documentId, label: d.documentTitle || d.documentId, sublabel: d.documentId }));
                                        }}
                                        placeholder={String(t("library.protocols.create.searchSop"))}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Matrix Column */}
                    {isEdit && protocolId && (
                        <div className="w-[45%] p-5 overflow-y-auto bg-muted/5">
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
