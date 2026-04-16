import { useTranslation } from "react-i18next";
import { useIdentityGroupsList } from "@/api/identityGroups";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type Props = {
    value: string;
    onValueChange: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
};

export function IdentityGroupSelect({ value, onValueChange, placeholder, disabled }: Props) {
    const { t } = useTranslation();
    const { data: listRes, isLoading } = useIdentityGroupsList({ 
        query: { itemsPerPage: 100 } 
    });

    const groups = listRes?.data || [];

    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
            <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder || String(t("hr.fields.identityGroup"))}>
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {String(t("common.loading"))}
                        </div>
                    ) : (
                        groups.find(g => g.identityGroupId === value)?.identityGroupName || value
                    )}
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {groups.map(g => (
                    <SelectItem key={g.identityGroupId} value={g.identityGroupId}>
                        {g.identityGroupName} ({g.identityGroupId})
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
