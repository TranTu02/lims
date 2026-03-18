import { useState, useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/**
 * AccreditationBadges — hiển thị các key có giá trị true trong protocolAccreditation
 */
export function AccreditationBadges({
    value,
    emptyText,
    className,
}: {
    value: Record<string, boolean> | null | undefined;
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
            {activeKeys.map((key) => (
                <Badge key={key} variant="secondary" className={`text-xs font-semibold tracking-wide${className ? ` ${className}` : ""}`}>
                    {key}
                </Badge>
            ))}
        </div>
    );
}

/**
 * AccreditationTagInput — Tag-input để thêm/xóa các mã chứng nhận (VILAS997, TDC, ISO...)
 * onChange trả về Record<string, boolean>
 */
export function AccreditationTagInput({
    value,
    onChange,
    disabled,
    placeholder,
}: {
    value: Record<string, boolean>;
    onChange: (v: Record<string, boolean>) => void;
    disabled?: boolean;
    placeholder?: string;
}) {
    const { t } = useTranslation();
    const [inputVal, setInputVal] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const activeKeys = Object.entries(value)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k);

    const addKey = (raw: string) => {
        const key = raw.trim().toUpperCase();
        if (!key) return;
        onChange({ ...value, [key]: true });
        setInputVal("");
    };

    const removeKey = (key: string) => {
        const next = { ...value };
        delete next[key];
        onChange(next);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addKey(inputVal);
        } else if (e.key === "Backspace" && !inputVal && activeKeys.length > 0) {
            removeKey(activeKeys[activeKeys.length - 1]);
        }
    };

    return (
        <div
            className={`flex flex-wrap gap-1.5 px-2 py-1.5 min-h-[38px] border border-input rounded-md bg-background cursor-text ${disabled ? "opacity-60 pointer-events-none" : ""}`}
            onClick={() => inputRef.current?.focus()}
        >
            {activeKeys.map((key) => (
                <span
                    key={key}
                    className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs font-semibold px-2 py-0.5 rounded-full"
                >
                    {key}
                    {!disabled && (
                        <button
                            type="button"
                            className="hover:text-destructive transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeKey(key);
                            }}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </span>
            ))}
            {!disabled && (
                <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                    <Input
                        ref={inputRef}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => { if (inputVal.trim()) addKey(inputVal); }}
                        placeholder={placeholder ?? String(t("library.protocols.protocolAccreditation.inputPlaceholder", { defaultValue: "Nhập mã (VD: VILAS997)..." }))}
                        className="border-0 shadow-none p-0 h-6 text-sm focus-visible:ring-0 bg-transparent w-full"
                    />
                    {inputVal.trim() && (
                        <button
                            type="button"
                            className="shrink-0 text-primary hover:text-primary/80"
                            onClick={() => addKey(inputVal)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
