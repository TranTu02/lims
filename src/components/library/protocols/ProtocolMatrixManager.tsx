import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProtocolFull, useDeleteMatrix } from "@/api/library";
import { MatricesCreateModal } from "../matrices/MatricesCreateModal";
import { MatricesEditModal } from "../matrices/MatricesEditModal";

export function ProtocolMatrixManager({ protocolId }: { protocolId: string }) {
    const { t } = useTranslation();
    const { data: fullData, isLoading, refetch } = useProtocolFull(protocolId);
    const deleteMatrix = useDeleteMatrix();

    const parentProtocol = (fullData as any)?.data || fullData;
    const matrices = parentProtocol?.matrices || [];

    const protocolCode = parentProtocol?.protocolCode || protocolId;
    const protocolSource = parentProtocol?.protocolSource || "";
    // Note: currentProtocolChemicals from parent can override snapshot chemicals if needed. Here we pass the snapshot.
    const chemicals = parentProtocol?.chemicals;

    const [editingMatrixId, setEditingMatrixId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleDelete = async (matrixId: string) => {
        if (!confirm(String(t("library.matrices.cofirmDelete", { defaultValue: "Bạn có chắc chắn muốn xóa nền mẫu này?" })))) return;
        await deleteMatrix.mutateAsync({ params: { matrixId } });
        refetch();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const lockedProtocol = parentProtocol
        ? {
              id: protocolId,
              code: protocolCode,
              source: protocolSource,
              chemicals: chemicals,
          }
        : undefined;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">
                    {String(t("library.parameters.edit.matrixSection", { defaultValue: "Ma trận (Nền mẫu)" }))} ({matrices.length})
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {String(t("common.create", { defaultValue: "Thêm mới" }))}
                </Button>
            </div>

            <div className="space-y-4">
                {matrices.length > 0 ? (
                    matrices.map((m: any) => (
                        <div key={m.matrixId} className="border border-border rounded-md p-3 flex flex-col gap-1 bg-muted/20">
                            <div className="flex items-start justify-between">
                                <span className="text-sm font-medium">
                                    {m.sampleTypeName || m.sampleTypeId} - {m.parameterName || m.parameterId}
                                </span>
                                <div className="flex gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingMatrixId(m.matrixId)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => void handleDelete(m.matrixId)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs mt-1 text-muted-foreground">
                                <span>
                                    {String(t("library.matrices.feeBeforeTax", { defaultValue: "Giá (Chưa VAT)" }))}: {m.feeBeforeTax?.toLocaleString()}
                                </span>
                                <span>
                                    {String(t("library.matrices.turnaroundTime", { defaultValue: "Thời gian (Ngày)" }))}: {m.turnaroundTime}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-muted-foreground border border-dashed rounded-md p-6 text-center">
                        {String(t("common.noData", { defaultValue: "Chưa có ma trận. Vui lòng thêm mới." }))}
                    </div>
                )}
            </div>

            <MatricesCreateModal
                open={isCreating}
                onClose={() => {
                    setIsCreating(false);
                    refetch();
                }}
                lockedProtocol={lockedProtocol}
            />

            <MatricesEditModal
                open={!!editingMatrixId}
                matrixId={editingMatrixId}
                onClose={() => {
                    setEditingMatrixId(null);
                    refetch();
                }}
                lockedProtocolId={protocolId}
            />
        </div>
    );
}
