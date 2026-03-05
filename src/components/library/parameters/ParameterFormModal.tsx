import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateParameter, useUpdateParameter, useParameterFull } from "@/api/library";
import { ParameterMatrixManager } from "./ParameterMatrixManager";

type Props = {
    onClose: () => void;
    parameterId?: string;
    initialData?: {
        parameterName: string;
    };
    onSuccess?: (p: any) => void;
};

type FormState = {
    parameterName: string;
};

export function ParameterFormModal({ onClose, parameterId, initialData, onSuccess }: Props) {
    const { t } = useTranslation();
    const createP = useCreateParameter();
    const updateP = useUpdateParameter();

    const isEdit = Boolean(parameterId);
    const detailQ = useParameterFull(parameterId || "");

    const [form, setForm] = useState<FormState>({
        parameterName: String(initialData?.parameterName ?? ""),
    });

    useEffect(() => {
        if (isEdit && detailQ.data) {
            setForm({
                parameterName: String(detailQ.data.parameterName ?? ""),
            });
        }
    }, [isEdit, detailQ.data]);

    const submit = async () => {
        const name = String(form.parameterName || "").trim();
        if (!name) return;

        if (isEdit) {
            const res = await updateP.mutateAsync({
                body: {
                    parameterId: parameterId!,
                    parameterName: name,
                },
            });
            onSuccess?.(res);
        } else {
            const res = await createP.mutateAsync({
                body: {
                    parameterName: name,
                },
            });
            onSuccess?.(res);
        }

        onClose();
    };

    const isPending = createP.isPending || updateP.isPending;
    const canSubmit = String(form.parameterName || "").trim().length > 0 && !isPending && !detailQ.isLoading;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 text-left">
            <div
                className={`bg-background rounded-lg border border-border w-full flex flex-col overflow-hidden shadow-xl transition-all duration-300 ${isEdit ? "max-w-[80vw] w-[900px]" : "max-w-lg"}`}
                style={{ maxHeight: "85vh" }}
            >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background z-10">
                    <div className="text-base font-semibold text-foreground">
                        {isEdit ? String(t("library.parameters.edit.title", { defaultValue: "Sửa chỉ tiêu" })) : String(t("library.parameters.create.title", { defaultValue: "Tạo chỉ tiêu" }))}
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        {String(t("common.close"))}
                    </Button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT COLUMN - Main Form */}
                    <div className={`p-5 space-y-4 overflow-y-auto flex flex-col ${isEdit ? "w-1/2 border-r border-border" : "w-full"}`}>
                        {isEdit && detailQ.isLoading ? (
                            <div className="flex items-center justify-center h-20">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-4 flex-1">
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{String(t("library.parameters.create.parameterName", { defaultValue: "Tên chỉ tiêu" }))}</div>
                                    <Input
                                        value={form.parameterName}
                                        onChange={(e) => setForm((s) => ({ ...s, parameterName: e.target.value }))}
                                        placeholder={String(t("library.parameters.create.parameterNamePlaceholder", { defaultValue: "Nhập tên chỉ tiêu..." }))}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={onClose} type="button">
                                {String(t("common.cancel"))}
                            </Button>
                            <Button onClick={() => void submit()} disabled={!canSubmit} type="button">
                                {isPending ? String(t("common.saving")) : String(t("common.save"))}
                            </Button>
                        </div>

                        {createP.isError || updateP.isError ? (
                            <div className="text-sm text-destructive">{String(t("library.parameters.create.error", { defaultValue: "Có lỗi xảy ra khi lưu chỉ tiêu" }))}</div>
                        ) : null}
                    </div>

                    {/* RIGHT COLUMN - Matrix Manager */}
                    {isEdit && parameterId && (
                        <div className="w-1/2 p-5 overflow-y-auto bg-muted/5 relative">
                            <ParameterMatrixManager parameterId={parameterId} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
