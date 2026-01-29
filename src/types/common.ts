// Base Interface cho Audit Columns (áp dụng cho hầu hết các bảng)
export interface BaseEntity {
    createdAt: string; // ISO Date string
    createdById: string;
    modifiedAt: string; // ISO Date string
    modifiedById: string;
    deletedAt?: string | null; // ISO Date string (Soft Delete)
}

// Cấu trúc JSONB phổ biến
export interface LabelValue {
    label: string;
    value: string | number | boolean;
}

export interface AddressInfo {
    address: string;
    ward?: string;
    district?: string;
    city?: string;
    country?: string;
}

export type EntityInfo = {
  type: "staff" | string;
};

export type MoneyValue = number | string;

export type MaybeMoney = MoneyValue | null;
export type MaybeNumber = number | string | null;
