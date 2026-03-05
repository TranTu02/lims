import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, X, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { Matrix } from "@/api/library";
import { useParameterFull } from "@/api/library";

import type { ParameterWithMatrices } from "../hooks/useLibraryData";
import { MatricesAccordionItem } from "./MatricesAccordionItem";

type Props = {
    selected: ParameterWithMatrices | null;
    onClose: () => void;
    onSelectProtocolId: (protocolId: string) => void;
    onEdit?: (parameter: ParameterWithMatrices) => void;
};

export function ParameterDetailPanel(props: Props) {
    const { t } = useTranslation();
    const { selected, onClose, onSelectProtocolId, onEdit } = props;

    const parameterId = selected?.parameterId ?? null;

    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data: fullData, isLoading, isError, error } = useParameterFull(parameterId);

    if (!selected) return null;

    const matrices = (fullData?.matrices ?? []) as Matrix[];

    const unit = selected.displayStyleResolved.default || selected.displayStyleResolved.eng || t("common.noData");

    return (
        <div className="w-96 lg:w-[450px] shrink-0 bg-background rounded-lg border border-border p-4 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto sticky top-[72px]">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="text-lg font-semibold text-foreground">{selected.parameterName}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">{selected.parameterId}</Badge>
                        <Badge variant="outline">{unit}</Badge>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(selected)} type="button" title={String(t("common.edit"))}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClose} type="button">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-sm font-medium text-foreground">{String(t("library.parameters.detail.matrices", { count: matrices.length }))}</div>

                    {isLoading ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {String(t("common.loading"))}
                        </div>
                    ) : null}
                </div>

                {isError ? (
                    <div className="bg-background border border-border rounded-lg p-3 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-foreground">{String(t("common.errorTitle"))}</div>
                            <div className="text-sm text-muted-foreground">{error instanceof Error ? error.message : t("library.matrices.errors.loadFailed")}</div>
                        </div>
                    </div>
                ) : null}

                {!isLoading && !isError ? (
                    <>
                        <div className="space-y-2">
                            {matrices.map((m) => (
                                <MatricesAccordionItem
                                    key={m.matrixId}
                                    matrix={m}
                                    expanded={expandedId === m.matrixId}
                                    onToggle={() => setExpandedId((cur) => (cur === m.matrixId ? null : m.matrixId))}
                                    onSelectProtocolId={onSelectProtocolId}
                                />
                            ))}
                        </div>

                        {matrices.length === 0 ? <div className="text-sm text-muted-foreground">{String(t("common.noData"))}</div> : null}
                    </>
                ) : null}
            </div>
        </div>
    );
}
