import { Search, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
    titleKey: string;
    subtitleKey: string;
    totalCount: number;

    searchValue: string;
    onSearchChange: (next: string) => void;

    rightSlot?: React.ReactNode;

    onAdd?: (() => void) | null;
    addLabelKey?: string;
    searchPlaceholderKey?: string;
};

export function LibraryHeader(props: Props) {
    const { t } = useTranslation();
    const { titleKey, subtitleKey, totalCount, searchValue, onSearchChange, rightSlot, onAdd, searchPlaceholderKey } = props;

    return (
        <div className="bg-background rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">{String(t(titleKey))}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{String(t(subtitleKey, { count: totalCount }))}</p>
                </div>

                <div className="flex items-center gap-2">
                    {rightSlot}
                    {onAdd ? (
                        <Button size="sm" className="gap-2" onClick={onAdd} type="button">
                            <Plus className="h-4 w-4" />
                            {String(t("common.create"))}
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholderKey ? String(t(searchPlaceholderKey)) : String(t("common.search"))}
                        className="pl-10 bg-background border-border"
                    />
                </div>
            </div>
        </div>
    );
}
