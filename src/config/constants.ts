// Pagination
export const PAGINATION_SIZE = [20, 50, 100, 200] as const;
export type PaginationSize = (typeof PAGINATION_SIZE)[number];
export const DEFAULT_PAGINATION_SIZE: PaginationSize = 20;

// Upload Limits
export const MAX_UPLOAD = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];

// Date Formats (date-fns pattern)
export const DATE_FORMAT = {
    short: "dd/MM/yyyy",
    full: "dd/MM/yyyy HH:mm",
    api: "yyyy-MM-dd", // ISO 8601 subset for API params
};

// Caching Rules (React Query Stale Times)
export const STALE_TIMES = {
    ZERO: 0, // Always fetch fresh data (Operational Data: Orders, Samples)
    SHORT: 30 * 1000, // 30s (Dashboards, real-time-ish views)
    MEDIUM: 5 * 60 * 1000, // 5 mins (Master Data, Lists that rarely change)
    LONG: 60 * 60 * 1000, // 1 hour (Settings, Static configs)
    INFINITY: Infinity, // Never stale until explicit invalidate (User Profile, Enumerations)
} as const;

// Currency & Number Formatting Requirements
export const NUMBER_FORMAT_OPTIONS = {
    currency: {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    },
    float: {
        maximumFractionDigits: 2,
    },
    integer: {
        maximumFractionDigits: 0,
    },
};

// System Default Values
export const DEFAULT_COUNTRY = "VN";
export const DEFAULT_CURRENCY = "VND";
export const DEFAULT_TAX_RATE = 0.08; // 8% standard VAT
