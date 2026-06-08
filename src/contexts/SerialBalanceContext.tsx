import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

export interface ParsedReading {
    id: string;
    date: string;
    time: string;
    raw: string;
    value: number | null;
    unit: string;
    isStable: boolean;
    sampleId?: string;
    identityId?: string;
    identityName?: string;
}

export interface SerialConfig {
    baudRate: number;
    dataBits: 7 | 8;
    stopBits: 1 | 2;
    parity: "none" | "even" | "odd";
    skipEmpty: boolean;
    stableOnly: boolean;
    autoCopy: boolean;
    autoFill: boolean; // Auto fill in bulk entry modal
    autoNext: boolean; // Auto jump to next row in bulk entry modal
}

interface SerialBalanceContextType {
    isSupported: boolean;
    isConnected: boolean;
    isConnecting: boolean;
    port: any | null;
    latestReading: ParsedReading | null;
    readingsList: ParsedReading[];
    config: SerialConfig;
    activeSampleId: string;
    setActiveSampleId: (id: string) => void;
    connect: () => Promise<boolean>;
    disconnect: () => Promise<void>;
    updateConfig: (newConfig: Partial<SerialConfig>) => void;
    clearReadings: () => void;
}

const DEFAULT_CONFIG: SerialConfig = {
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: "none",
    skipEmpty: true,
    stableOnly: false,
    autoCopy: false,
    autoFill: false,
    autoNext: false,
};

const SerialBalanceContext = createContext<SerialBalanceContextType | undefined>(undefined);

export function useSerialBalance() {
    const context = useContext(SerialBalanceContext);
    if (!context) {
        throw new Error("useSerialBalance must be used within a SerialBalanceProvider");
    }
    return context;
}

export function parseSerialData(raw: string): { value: number | null; unit: string; isStable: boolean } {
    const clean = raw.trim();
    if (!clean) {
        return { value: null, unit: "", isStable: false };
    }

    let isStable = true;
    let value: number | null = null;
    let unit = "g";

    // 1. Check stability indicators:
    // Standard formats send '?' or 'US' when unstable, 'ST' or '+' or empty space when stable.
    if (clean.includes("?") || clean.startsWith("US") || clean.includes("unstable") || clean.includes("Dynamic")) {
        isStable = false;
    }

    // 2. Extract numeric weight and unit using regex:
    // Matches positive/negative numbers (with decimals) and trailing characters for units (g, mg, kg, ct, etc.)
    const numRegex = /(-?\s*[0-9]+\.[0-9]+|-?\s*[0-9]+)\s*([a-zA-Z]+)?/;
    const match = clean.match(numRegex);

    if (match) {
        // remove extra spaces inside numbers e.g. "+  0.123" -> "+0.123"
        const numStr = match[1].replace(/\s+/g, "");
        const parsed = parseFloat(numStr);
        if (!isNaN(parsed)) {
            value = parsed;
        }
        if (match[2]) {
            unit = match[2].trim();
        }
    }

    return { value, unit, isStable };
}

export function SerialBalanceProvider({ children }: { children: React.ReactNode }) {
    const [isSupported, setIsSupported] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [latestReading, setLatestReading] = useState<ParsedReading | null>(null);
    const [readingsList, setReadingsList] = useState<ParsedReading[]>([]);
    const [activeSampleId, setActiveSampleId] = useState("");

    const activeSampleIdRef = useRef("");
    useEffect(() => {
        activeSampleIdRef.current = activeSampleId;
    }, [activeSampleId]);
    
    // Load config from localStorage
    const [config, setConfig] = useState<SerialConfig>(() => {
        try {
            const saved = localStorage.getItem("lims_serial_config");
            return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
        } catch {
            return DEFAULT_CONFIG;
        }
    });

    const portRef = useRef<any | null>(null);
    const readerRef = useRef<any | null>(null);
    const keepReadingRef = useRef(true);
    const configRef = useRef(config);

    // Keep config ref updated for the read loop
    useEffect(() => {
        configRef.current = config;
        try {
            localStorage.setItem("lims_serial_config", JSON.stringify(config));
        } catch (e) {
            console.error("Failed to save serial config:", e);
        }
    }, [config]);

    // Check compatibility on mount
    useEffect(() => {
        const supported = typeof navigator !== "undefined" && "serial" in navigator;
        setIsSupported(supported);
    }, []);

    const clearReadings = useCallback(() => {
        setReadingsList([]);
        setLatestReading(null);
    }, []);

    const updateConfig = useCallback((newConfig: Partial<SerialConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
    }, []);

    const disconnect = useCallback(async () => {
        keepReadingRef.current = false;

        // Cancel reader
        if (readerRef.current) {
            try {
                await readerRef.current.cancel();
            } catch (e) {
                console.error("Error cancelling reader:", e);
            }
            readerRef.current = null;
        }

        // Close port
        if (portRef.current) {
            try {
                await portRef.current.close();
            } catch (e) {
                console.error("Error closing serial port:", e);
            }
            portRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
    }, []);

    const startReading = useCallback(async (port: any) => {
        keepReadingRef.current = true;
        let buffer = "";
        const decoder = new TextDecoder();

        while (keepReadingRef.current && port.readable) {
            try {
                const reader = port.readable.getReader();
                readerRef.current = reader;

                while (keepReadingRef.current) {
                    const { value, done } = await reader.read();
                    if (done) {
                        break;
                    }
                    if (value) {
                        // Buffer incoming data to handle serial packet fragmentation
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split(/\r?\n/);
                        buffer = lines.pop() || ""; // last line might be incomplete, keep in buffer

                        for (const line of lines) {
                            const trimmedLine = line.trim();
                            
                            // Check skip empty filter
                            if (!trimmedLine && configRef.current.skipEmpty) {
                                continue;
                            }

                            // Parse serial weight data
                            const parsed = parseSerialData(trimmedLine);

                            // Check stable filter
                            if (configRef.current.stableOnly && !parsed.isStable) {
                                continue;
                            }

                            const now = new Date();
                            const datePart = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
                            const timePart = now.toLocaleTimeString("vi-VN", { hour12: false });
                            const msPart = String(now.getMilliseconds()).padStart(3, "0");

                            let identityId = "";
                            let identityName = "";
                            try {
                                const savedUser = localStorage.getItem("user");
                                if (savedUser) {
                                    const parsedUser = JSON.parse(savedUser);
                                    identityId = parsedUser.identityId || "";
                                    identityName = parsedUser.identityName || "";
                                }
                            } catch {}

                            const newReading: ParsedReading = {
                                id: Math.random().toString(36).substring(2, 9),
                                date: datePart,
                                time: `${datePart} ${timePart}.${msPart}`,
                                raw: line, // keep original raw for debugging
                                value: parsed.value,
                                unit: parsed.unit,
                                isStable: parsed.isStable,
                                sampleId: activeSampleIdRef.current || undefined,
                                identityId,
                                identityName,
                            };

                            setLatestReading(newReading);
                            setReadingsList((prev) => {
                                // Cap the list at 100 rows to prevent memory leak/UI lag
                                const next = [newReading, ...prev];
                                return next.slice(0, 100);
                            });

                            // Auto-copy to clipboard if enabled and reading is stable
                            if (configRef.current.autoCopy && parsed.isStable && parsed.value !== null) {
                                navigator.clipboard.writeText(String(parsed.value)).catch(() => {});
                            }
                        }
                    }
                }
            } catch (e: any) {
                // Ignore errors caused by manual closing
                if (keepReadingRef.current) {
                    console.error("Serial read error:", e);
                    toast.error(`Mất kết nối cổng Serial: ${e.message || "Lỗi không xác định"}`);
                    disconnect();
                }
                break;
            } finally {
                if (readerRef.current) {
                    try {
                        readerRef.current.releaseLock();
                    } catch {}
                    readerRef.current = null;
                }
            }
        }
    }, [disconnect]);

    const connect = useCallback(async (): Promise<boolean> => {
        const nav = navigator as any;
        if (!nav || !nav.serial) {
            toast.error("Trình duyệt không hỗ trợ Web Serial API!");
            return false;
        }

        setIsConnecting(true);
        try {
            // Request port from user
            const port = await nav.serial.requestPort();
            portRef.current = port;

            // Open port with current configs
            await port.open({
                baudRate: configRef.current.baudRate,
                dataBits: configRef.current.dataBits,
                stopBits: configRef.current.stopBits,
                parity: configRef.current.parity,
            });

            setIsConnected(true);
            setIsConnecting(false);
            toast.success("Kết nối cân phân tích thành công!");
            
            // Start listening loop
            startReading(port);
            return true;
        } catch (e: any) {
            console.error("Serial connection error:", e);
            if (e.name !== "NotFoundError") {
                toast.error(`Lỗi kết nối cổng COM: ${e.message || "Hãy thử lại"}`);
            }
            portRef.current = null;
            setIsConnected(false);
            setIsConnecting(false);
            return false;
        }
    }, [startReading]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return (
        <SerialBalanceContext.Provider
            value={{
                isSupported,
                isConnected,
                isConnecting,
                port: portRef.current,
                latestReading,
                readingsList,
                config,
                activeSampleId,
                setActiveSampleId,
                connect,
                disconnect,
                updateConfig,
                clearReadings,
            }}
        >
            {children}
        </SerialBalanceContext.Provider>
    );
}
