import type { BaseEntity } from "./common";
import type { Order } from "./crm";

export interface OpaiLog extends BaseEntity {
    messageOpaiId: string;
    role: "user" | "assistant" | "system";
    content: string;
    tokenUsage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    contextId?: string;
}

export interface Shipment extends BaseEntity {
    shipmentId: string;
    trackingNumber: string;
    provider: string;
    status: string;
    shipOrder?: Partial<Order>; // Snapshot
}
