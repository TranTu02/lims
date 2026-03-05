import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateProtocol, useUpdateProtocol, useProtocolDetail, type Protocol } from "@/api/library";
import { ChemicalBomTable, type ChemicalBomItem } from "../shared/ChemicalBomTable";
import { ProtocolMatrixManager } from "./ProtocolMatrixManager";

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
    const [chemicals, setChemicals] = useState<ChemicalBomItem[]>([]);

    useEffect(() => {
        if (protocolDetail && isEdit) {
            setProtocolCode(String(protocolDetail.protocolCode || ""));
            setProtocolSource(String(protocolDetail.protocolSource || ""));
            setProtocolDescription(String(protocolDetail.protocolDescription || ""));

            if (protocolDetail.chemicals && Array.isArray(protocolDetail.chemicals)) {
                setChemicals(
                    protocolDetail.chemicals.map((c: any) => ({
                        chemicalSkuId: c.chemicalSkuId || c.chemicalId || "",
                        chemicalName: c.chemicalName || "",
                        consumedQty: c.consumedQty || c.amountUsed || "",
                        unit: c.unit || c.measurementUnit || "",
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
                      unit: c.unit || "",
                  }))
                : [];

        if (isEdit) {
            const result = await updateP.mutateAsync({
                body: {
                    protocolId: protocolId!,
                    protocolCode: codeTrimmed,
                    protocolSource: sourceTrimmed || "Manual",
                    protocolDescription: descTrimmed || null,
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

                                <div className="mt-6 border-t pt-4">
                                    <ChemicalBomTable items={chemicals} onChange={setChemicals} disabled={isPending} />
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
        </div>
    );
}
