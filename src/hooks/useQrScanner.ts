import { useEffect, useRef, useCallback } from "react";

type QrScannerOptions = {
    /** Khoảng thời gian tối đa giữa 2 ký tự liên tiếp (ms). Máy quét thường nhập rất nhanh < 50ms */
    charIntervalMs?: number;
    /** Độ dài chuỗi tối thiểu để coi là quét QR (tránh nhầm với nhấn phím đơn lẻ) */
    minLength?: number;
    /** Chỉ bật khi modal/component đang active */
    enabled?: boolean;
    /** Prefix ký tự để lọc (tùy chọn) */
    prefix?: string;
};

/**
 * Hook lắng nghe toàn cục sự kiện bàn phím để phát hiện QR scanner.
 *
 * Cách hoạt động:
 * - Máy quét QR hoạt động như bàn phím, nhập từng ký tự rất nhanh (< ~50ms/ký tự) rồi gửi Enter.
 * - Hook buffer các ký tự; nếu khoảng cách giữa 2 ký tự < charIntervalMs → đây là quét QR.
 * - Khi nhận Enter → gọi callback với chuỗi đã buffer.
 *
 * @param onScan - Callback nhận chuỗi quét được
 * @param options - Tùy chọn
 */
export function useQrScanner(onScan: (value: string) => void, options: QrScannerOptions = {}) {
    const { charIntervalMs = 80, minLength = 3, enabled = true } = options;

    const bufferRef = useRef<string>("");
    const lastKeyTimeRef = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onScanRef = useRef(onScan);
    onScanRef.current = onScan;

    const flush = useCallback(() => {
        const val = bufferRef.current.trim();
        bufferRef.current = "";
        if (val.length >= minLength) {
            onScanRef.current(val);
        }
    }, [minLength]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Bỏ qua nếu người dùng đang focus vào các element nhập liệu (input, textarea, select)
            // -> tránh xung đột với việc gõ thủ công
            const target = e.target as HTMLElement;
            const tagName = target.tagName.toLowerCase();
            const isEditableInput = (tagName === "input" && (target as HTMLInputElement).type !== "hidden") || tagName === "textarea" || tagName === "select" || target.isContentEditable;

            if (isEditableInput) return;

            const now = Date.now();
            const timeDiff = now - lastKeyTimeRef.current;
            lastKeyTimeRef.current = now;

            if (e.key === "Enter") {
                // Scan hoàn tất
                if (timerRef.current) clearTimeout(timerRef.current);
                flush();
                return;
            }

            // Ký tự in được
            if (e.key.length === 1) {
                // Nếu khoảng cách giữa 2 ký tự quá lớn → người gõ tay, reset buffer
                if (timeDiff > charIntervalMs && bufferRef.current.length > 0) {
                    bufferRef.current = "";
                }

                bufferRef.current += e.key;

                // Auto-flush sau timeout (phòng trường hợp scanner không gửi Enter)
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => {
                    flush();
                }, 300);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [enabled, charIntervalMs, flush]);
}
