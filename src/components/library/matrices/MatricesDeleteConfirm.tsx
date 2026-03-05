import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useDeleteMatrix } from "@/api/library";

type Props = {
    open: boolean;
    matrixId: string | null;
    onClose: () => void;
    onDeleted: (matrixId: string) => void;
};

export function MatricesDeleteConfirm(props: Props) {
    const { t } = useTranslation();
    const { open, matrixId, onClose, onDeleted } = props;

    const delM = useDeleteMatrix();

    const submit = async () => {
        if (!matrixId) return;
        onClose();

        try {
            await delM.mutateAsync({ params: { matrixId } });
            onDeleted(matrixId);
        } catch {
            // toast error đã xử lý trong hook
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg border border-border w-full max-w-md shadow-xl">
                <div className="p-6 space-y-6">
                    <div className="text-sm text-foreground text-center">{String(t("library.matrices.cofirmDelete"))}</div>

                    <div className="flex items-center justify-center gap-4">
                        <Button variant="outline" onClick={onClose} type="button" disabled={delM.isPending}>
                            {String(t("common.cancel"))}
                        </Button>

                        <Button variant="destructive" onClick={() => void submit()} disabled={delM.isPending || !matrixId} type="button">
                            {delM.isPending ? String(t("common.deleting")) : String(t("common.delete"))}
                        </Button>
                    </div>

                    {delM.isError ? <div className="text-sm text-destructive">{String(t("library.matrices.delete.error"))}</div> : null}
                </div>
            </div>
        </div>
    );
}
