import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Format a value for display.
 * Returns "--" if value is null or undefined.
 */
export const formatDisplayValue = (value: any): string => {
    if (value === null || value === undefined || value === "") {
        return "--";
    }
    return String(value);
};

export const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return "--";
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatDate = (date: string | Date | undefined | null): string => {
    if (!date) return "--";
    try {
        return format(new Date(date), "dd/MM/yyyy", { locale: vi });
    } catch (e) {
        return "--";
    }
};

export const formatDateTime = (date: string | Date | undefined | null): string => {
    if (!date) return "--";
    try {
        return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: vi });
    } catch (e) {
        return "--";
    }
};
