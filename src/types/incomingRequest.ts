// src/types/incomingRequest.ts
// Types cho bảng crm.incomingRequests — Yêu cầu tiếp nhận từ bên ngoài

import type { BaseEntity } from "./common";
import type { ClientSnapshot, ContactPerson, ReportRecipient } from "./receipt";
import type { OrderSampleItem } from "./crm";

// ── Sender Info ──────────────────────────────────────────────────────────────
export interface IncomingRequestSenderInfo {
    senderName?: string | null;
    senderPhone?: string | null;
    senderEmail?: string | null;
    senderAddress?: string | null;
    senderId?: string | null;
    [key: string]: unknown;
}

// ── Status Literals ──────────────────────────────────────────────────────────
export type IncomingStatus = "New" | "Processing" | "Converted" | "Rejected" | (string & {});
export type IncomingOrderStatus = "Pending" | "Processing" | "Completed" | "Cancelled" | (string & {});
export type IncomingPaymentStatus = "Unpaid" | "Partial" | "Paid" | "Debt" | (string & {});

// ── List Item (dùng cho bảng danh sách) ──────────────────────────────────────
export interface IncomingRequestListItem extends BaseEntity {
    requestId: string;
    requestDate?: string | null;

    senderInfo?: IncomingRequestSenderInfo | null;
    requestContent?: string | null;
    documentIds?: string[] | null;

    quoteId?: string | null;
    clientId?: string | null;
    client?: ClientSnapshot | null;
    contactPerson?: ContactPerson | null;
    reportRecipient?: ReportRecipient | null;

    salePersonId?: string | null;
    salePerson?: string | null;
    saleCommissionPercent?: number | null;

    samples?: OrderSampleItem[] | null;

    totalAmount?: number | string | null;
    totalFeeBeforeTax?: number | string | null;
    totalFeeBeforeTaxAndDiscount?: number | string | null;
    totalTaxValue?: number | string | null;
    totalDiscountValue?: number | string | null;
    taxRate?: number | string | null;
    discountRate?: number | string | null;

    incomingStatus?: IncomingStatus | null;
    linkedOrderId?: string | null;
    orderUri?: string | null;
    requestForm?: string | null;

    orderId?: string | null;
    receiptId?: string | null;

    orderStatus?: IncomingOrderStatus | null;
    paymentStatus?: IncomingPaymentStatus | null;

    [key: string]: unknown;
}

// ── Detail (dùng cho modal xem chi tiết) ─────────────────────────────────────
export interface IncomingRequestDetail extends IncomingRequestListItem {
    createdBy?: {
        identityId: string;
        identityName: string;
        alias?: string | null;
    } | null;
    modifiedBy?: {
        identityId: string;
        identityName: string;
        alias?: string | null;
    } | null;
}

// ── Body cho API Create / Update ─────────────────────────────────────────────
export interface IncomingRequestCreateBody {
    requestContent?: string | null;
    senderInfo?: IncomingRequestSenderInfo | null;
    clientId?: string | null;
    client?: Partial<ClientSnapshot> | null;
    contactPerson?: ContactPerson | null;
    reportRecipient?: ReportRecipient | null;
    salePersonId?: string | null;
    salePerson?: string | null;
    samples?: OrderSampleItem[] | null;
    [key: string]: unknown;
}

export interface IncomingRequestUpdateBody {
    requestId: string;
    incomingStatus?: IncomingStatus | null;
    receiptId?: string | null;
    [key: string]: unknown;
}
