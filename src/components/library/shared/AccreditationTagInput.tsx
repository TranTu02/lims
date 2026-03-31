import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, MinusCircle, PlusCircle } from "lucide-react";

import { useEnumList } from "@/api/chemical";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface AccreditationData {
    registrationDate?: string | null;
    expirationDate?: string | null;
}
export interface AccreditationValue {
    [key: string]: AccreditationData | boolean;
}

/**
 * AccreditationBadges — hiển thị các key đang active trong protocolAccreditation
 */
export function AccreditationBadges({
    value,
    emptyText,
    className,
}: {
    value: Record<string, any> | null | undefined;
    emptyText?: string;
    className?: string;
}) {
    const { t } = useTranslation();
    const activeKeys = Object.entries(value ?? {})
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k);

    if (activeKeys.length === 0) {
        return (
            <Badge variant="outline" className="font-normal text-muted-foreground">
                {emptyText ?? String(t("common.noData"))}
            </Badge>
        );
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {activeKeys.map((key) => {
                const data = value?.[key];
                const hasDates = typeof data === "object" && data !== null && (data.registrationDate || data.expirationDate);
                return (
                    <Badge key={key} variant="secondary" className={`text-xs font-semibold tracking-wide flex flex-col items-start gap-0.5 px-2 py-1 h-auto${className ? ` ${className}` : ""}`}>
                        <span className="uppercase">{key}</span>
                        {hasDates && (
                            <span className="text-[10px] font-normal opacity-70 italic lowercase">
                                {data.registrationDate || "-"} / {data.expirationDate || "-"}
                            </span>
                        )}
                    </Badge>
                );
            })}
        </div>
    );
}

/**
 * AccreditationTagInput — Quản lý công nhận theo danh mục Enum
 * Hỗ trợ nhập ngày cấp/hết hạn cho từng mã
 */
export function AccreditationTagInput({
    value,
    onChange,
    disabled,
}: {
    value: AccreditationValue;
    onChange: (v: AccreditationValue) => void;
    disabled?: boolean;
}) {
    const { t } = useTranslation();
    const { data: enumList, isLoading } = useEnumList("protocolAccreditation", { enabled: true });

    const possibleTypes = useMemo(() => (Array.isArray(enumList) ? (enumList as string[]) : []), [enumList]);

    const isEnabled = (key: string) => Boolean(value[key]);

    const toggle = (key: string) => {
        if (isEnabled(key)) {
            const next = { ...value };
            delete next[key];
            onChange(next);
        } else {
            onChange({ ...value, [key]: { registrationDate: null, expirationDate: null } });
        }
    };

    const updateDate = (key: string, field: keyof AccreditationData, val: string) => {
        const current = value[key];
        const data = typeof current === "object" && current !== null ? { ...current } : { registrationDate: null, expirationDate: null };
        data[field] = val || null;
        onChange({ ...value, [key]: data });
    };

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {String(t("common.loading"))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5">
                {possibleTypes.map((type) => {
                    const active = isEnabled(type);
                    const data = typeof value[type] === "object" ? (value[type] as AccreditationData) : {};

                    return (
                        <div key={type} className={`group flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-lg border transition-all ${active ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-muted/10 border-border opacity-70"}`}>
                            {/* Header: Label + Toggle */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                                <button
                                    type="button"
                                    onClick={() => toggle(type)}
                                    disabled={disabled}
                                    className={`shrink-0 transition-colors ${active ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    {active ? <Check className="h-5 w-5 fill-primary/10" /> : <PlusCircle className="h-5 w-5" />}
                                </button>
                                <span className={`text-sm font-bold uppercase tracking-wide ${active ? "text-primary" : "text-muted-foreground"}`}>
                                    {type}
                                </span>
                            </div>

                            {/* Inputs: only shown when active */}
                            {active && (
                                <div className="flex flex-1 items-center gap-4 w-full">
                                    <div className="flex flex-1 items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground uppercase whitespace-nowrap">{String(t("library.protocols.registrationDate", { defaultValue: "Cấp:" }))}</span>
                                        <Input
                                            type="text"
                                            value={data.registrationDate || ""}
                                            onChange={(e) => updateDate(type, "registrationDate", e.target.value)}
                                            placeholder="DD/MM/YYYY"
                                            className="h-8 text-xs bg-background border-primary/10 focus-visible:ring-primary/20"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <div className="flex flex-1 items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground uppercase whitespace-nowrap">{String(t("library.protocols.expirationDate", { defaultValue: "Hết hạn:" }))}</span>
                                        <Input
                                            type="text"
                                            value={data.expirationDate || ""}
                                            onChange={(e) => updateDate(type, "expirationDate", e.target.value)}
                                            placeholder="DD/MM/YYYY"
                                            className="h-8 text-xs bg-background border-primary/10 focus-visible:ring-primary/20"
                                            disabled={disabled}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggle(type)}
                                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                                        title="Disable"
                                    >
                                        <MinusCircle className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {!active && (
                                <div className="text-xs text-muted-foreground italic opacity-50 flex-1">
                                    {String(t("library.protocols.clickToEnable", { defaultValue: "Bấm để kích hoạt phạm vi này" }))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {possibleTypes.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg text-muted-foreground opacity-50 italic">
                        {String(t("common.noData"))}
                    </div>
                )}
            </div>
        </div>
    );
}
