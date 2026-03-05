import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useCreateSampleType, useUpdateSampleType, useSampleTypeFull } from "@/api/library";
import { SampleTypeMatrixManager } from "./SampleTypeMatrixManager";

type Props = {
    onClose: () => void;
    sampleTypeId?: string;
    initialData?: {
        sampleTypeName: string;
        displayDefault: string;
        displayEng: string;
    };
    onSuccess?: (item: any) => void;
};

type FormState = {
    sampleTypeName: string;
    displayDefault: string;
    displayEng: string;
};

function toOptionalTrimmed(v: any): string | undefined {
    const x = String(v || "").trim();
    return x.length > 0 ? x : undefined;
}

export function SampleTypeFormModal(props: Props) {
    const { t } = useTranslation();
    const { onClose, sampleTypeId } = props;

    const create = useCreateSampleType();
    const update = useUpdateSampleType();

    const isEdit = Boolean(sampleTypeId);
    const detailQ = useSampleTypeFull(sampleTypeId || "");

    const [form, setForm] = useState<FormState>({
        sampleTypeName: String(props.initialData?.sampleTypeName ?? ""),
        displayDefault: String(props.initialData?.displayDefault ?? ""),
        displayEng: String(props.initialData?.displayEng ?? ""),
    });

    useEffect(() => {
        if (isEdit && detailQ.data) {
            setForm({
                sampleTypeName: String(detailQ.data.sampleTypeName ?? ""),
                displayDefault: String(detailQ.data.displayTypeStyle?.default ?? ""),
                displayEng: String(detailQ.data.displayTypeStyle?.eng ?? ""),
            });
        }
    }, [isEdit, detailQ.data]);

    const submit = async () => {
        const name = String(form.sampleTypeName || "").trim();
        if (!name) return;

        const displayDefault = toOptionalTrimmed(form.displayDefault);
        const displayEng = toOptionalTrimmed(form.displayEng);

        const displayTypeStyle: Record<string, string> = {};
        if (displayDefault) displayTypeStyle.default = displayDefault;
        if (displayEng) displayTypeStyle.eng = displayEng;

        const hasDisplayTypeStyle = Object.keys(displayTypeStyle).length > 0;

        if (isEdit) {
            const res = await update.mutateAsync({
                body: {
                    sampleTypeId: sampleTypeId!,
                    sampleTypeName: name,
                    displayTypeStyle: hasDisplayTypeStyle ? displayTypeStyle : undefined,
                },
            });
            props.onSuccess?.(res);
        } else {
            const res = await create.mutateAsync({
                body: {
                    sampleTypeName: name,
                    displayTypeStyle: hasDisplayTypeStyle ? displayTypeStyle : undefined,
                },
            });
            props.onSuccess?.(res);
        }

        onClose();
    };

    const isPending = create.isPending || update.isPending;
    const canSubmit = String(form.sampleTypeName || "").trim().length > 0 && !isPending && !detailQ.isLoading;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 text-left">
            <div
                className={`bg-background rounded-lg border border-border w-full flex flex-col overflow-hidden shadow-xl transition-all duration-300 ${isEdit ? "max-w-[80vw] w-[900px]" : "max-w-lg"}`}
                style={{ maxHeight: "85vh" }}
            >
                <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0 bg-background z-10">
                    <div className="text-base font-semibold text-foreground">
                        {isEdit ? String(t("library.sampleTypes.edit.title", { defaultValue: "Sửa dạng mẫu" })) : String(t("library.sampleTypes.create.title", { defaultValue: "Tạo dạng mẫu" }))}
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
                                    <div className="text-sm font-medium text-foreground">{String(t("library.sampleTypes.create.sampleTypeName"))}</div>
                                    <Input
                                        value={form.sampleTypeName}
                                        onChange={(e) => setForm((s) => ({ ...s, sampleTypeName: e.target.value }))}
                                        placeholder={String(t("library.sampleTypes.create.sampleTypeNamePlaceholder"))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{String(t("library.sampleTypes.create.displayDefault"))}</div>
                                    <Input
                                        value={form.displayDefault}
                                        onChange={(e) => setForm((s) => ({ ...s, displayDefault: e.target.value }))}
                                        placeholder={String(t("library.sampleTypes.create.displayDefaultPlaceholder"))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-foreground">{String(t("library.sampleTypes.create.displayEng"))}</div>
                                    <Input
                                        value={form.displayEng}
                                        onChange={(e) => setForm((s) => ({ ...s, displayEng: e.target.value }))}
                                        placeholder={String(t("library.sampleTypes.create.displayEngPlaceholder"))}
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

                        {create.isError || update.isError ? <div className="text-sm text-destructive">{String(t("library.sampleTypes.create.error"))}</div> : null}
                    </div>

                    {/* RIGHT COLUMN - Matrix Manager */}
                    {isEdit && sampleTypeId && (
                        <div className="w-1/2 p-5 overflow-y-auto bg-muted/5 relative">
                            <SampleTypeMatrixManager sampleTypeId={sampleTypeId} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
