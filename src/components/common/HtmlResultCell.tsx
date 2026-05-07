import { useState, useRef } from "react";
import { convertResultToHtml, htmlToResultShorthand } from "@/utils/resultHtml";

interface HtmlResultCellProps {
    /** The stored value — may be plain text or contain <sup>/<sub>/× */
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}

/**
 * Inline editable cell for `analysisResult`.
 *
 * - **Blur state**: renders the value as HTML (dangerouslySetInnerHTML).
 * - **Focus state**: shows a plain-text input where the user can type shorthand:
 *     `^` → toggle <sup>,  `_` → toggle <sub>,  `*` → ×
 * - On **blur**: the raw input is converted to HTML and stored.
 */
export function HtmlResultCell({ value, onChange, placeholder = "Nhập KQ...", className = "", inputClassName = "" }: HtmlResultCellProps) {
    const [editing, setEditing] = useState(false);
    // Raw shorthand text while editing
    const [draft, setDraft] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFocus = () => {
        // Convert stored HTML → shorthand for editing
        setDraft(htmlToResultShorthand(value || ""));
        setEditing(true);
        // focus happens automatically via autoFocus
    };

    const handleBlur = () => {
        // Convert shorthand → HTML and propagate
        const converted = convertResultToHtml(draft);
        onChange(converted);
        setEditing(false);
    };

    if (editing) {
        return (
            <input
                ref={inputRef}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={[
                    "h-8 w-full min-w-[120px] max-w-[220px] rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                    inputClassName,
                ].join(" ")}
            />
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleFocus}
            onFocus={handleFocus}
            title="Click để chỉnh sửa"
            className={[
                "min-h-[28px] min-w-[60px] max-w-[220px] cursor-text rounded px-1 py-0.5 text-sm",
                "hover:bg-muted/50 transition-colors",
                !value ? "text-muted-foreground italic" : "",
                className,
            ].join(" ")}
            // We trust our own utility to produce safe limited HTML (sup/sub/×)
            dangerouslySetInnerHTML={{ __html: value || `<span class="text-muted-foreground">${placeholder}</span>` }}
        />
    );
}
