import { useState } from "react";
import { BookOpen, X } from "lucide-react";

interface HelpBubbleProps {
    /** Relative path from the component folder to the guide HTML file */
    guidePath: string;
    /** Tooltip label */
    label?: string;
}

/**
 * Floating help bubble (bottom-right corner).
 * Click to open the corresponding guild HTML guide in an iframe overlay.
 */
export function HelpBubble({ guidePath, label = "Hướng dẫn" }: HelpBubbleProps) {
    const [open, setOpen] = useState(false);

    // Files placed in public/guild/ are served at /guild/<name> by Vite (dev & build)
    const resolvedUrl = `/guild/${guidePath}`;

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(true)}
                title={label}
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    zIndex: 9000,
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 20px rgba(37, 99, 235, 0.45)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 28px rgba(37,99,235,.6)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 20px rgba(37, 99, 235, 0.45)";
                }}
            >
                <BookOpen size={22} />
            </button>

            {/* Tooltip label */}
            {!open && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "82px",
                        right: "16px",
                        zIndex: 9000,
                        background: "#1e293b",
                        color: "#e2e8f0",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "6px",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(0,0,0,.25)",
                    }}
                >
                    {label}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "-5px",
                            right: "20px",
                            width: 0,
                            height: 0,
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: "5px solid #1e293b",
                        }}
                    />
                </div>
            )}

            {/* Fullscreen iframe overlay */}
            {open && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0,0,0,.6)",
                        display: "flex",
                        alignItems: "stretch",
                        justifyContent: "flex-end",
                        backdropFilter: "blur(2px)",
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setOpen(false);
                    }}
                >
                    <div
                        style={{
                            width: "min(1100px, 95vw)",
                            height: "100vh",
                            background: "#0f172a",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "-8px 0 40px rgba(0,0,0,.4)",
                            animation: "slideIn .25s ease",
                        }}
                    >
                        {/* Header bar */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 16px",
                                background: "#1e293b",
                                borderBottom: "1px solid #334155",
                                flexShrink: 0,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <BookOpen size={16} color="#60a5fa" />
                                <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>{label}</span>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                                <X size={14} /> Đóng
                            </button>
                        </div>

                        {/* Iframe */}
                        <iframe
                            src={resolvedUrl}
                            style={{
                                flex: 1,
                                border: "none",
                                width: "100%",
                            }}
                            title="Hướng dẫn sử dụng"
                        />
                    </div>

                    <style>{`
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to   { transform: translateX(0);    opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
}
