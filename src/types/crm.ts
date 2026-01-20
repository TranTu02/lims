import type { BaseEntity } from "./common";

export interface ClientContact {
    contactId?: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    contactPosition?: string;
    contactAddress?: string;
}

export interface InvoiceInfo {
    taxAddress?: string;
    taxCode?: string;
    taxName?: string;
    taxEmail?: string;
}

export interface Client extends BaseEntity {
    clientId: string;
    clientName: string;
    legalId?: string;
    clientAddress?: string;
    clientPhone?: string;
    clientEmail?: string;
    clientSaleScope: "public" | "private";
    availableByIds?: string[];
    availableByName?: string[];
    contacts: ClientContact[]; // Alias for clientContacts
    invoiceInfo?: InvoiceInfo;
    totalOrderAmount: number;
}

// Cấu trúc sample trong Order/Quote (Theo Section III.2)
export interface OrderSampleAnalysis {
    matrixId: string;
    parameterId?: string;
    parameterName?: string; // Optional snapshot
    feeBeforeTax: number;
    taxRate: number;
    feeAfterTax: number;
    protocolCode?: string;
    quantity?: number;
    unitPrice?: number;
    discountRate?: number;
}

export interface OrderSampleItem {
    sampleId?: string; // Null nếu tạo mới
    userSampleId?: string;
    sampleName: string;
    sampleTypeId: string;
    sampleTypeName?: string;
    analyses: OrderSampleAnalysis[];
}

export interface Transaction {
    amount: number;
    date: string;
    method: string;
    note?: string;
}

export interface Order extends BaseEntity {
    orderId: string;
    quoteId?: string;
    clientId: string;
    client: Partial<Client>; // Snapshot
    contactPerson: Partial<ClientContact>; // Snapshot
    salePersonId?: string;
    salePerson?: string; // Name snapshot
    saleCommissionPercent?: number;
    samples: OrderSampleItem[];
    totalAmount: number;
    totalFeeBeforeTax: number;
    totalFeeBeforeTaxAndDiscount: number;
    totalTaxValue: number;
    totalDiscountValue: number;
    orderStatus: "Pending" | "Processing" | "Completed" | "Cancelled";
    taxRate: number;
    discountRate: number;
    paymentStatus: "Unpaid" | "Partial" | "Paid" | "Debt";
    transactions: Transaction[];
    orderUri?: string;
    requestForm?: string; // HTML content
    receiptId?: string;
}

export interface Quote extends BaseEntity {
    quoteId: string;
    quoteCode?: string;
    clientId: string;
    client: Partial<Client>; // Snapshot
    salePersonId?: string;
    salePerson?: { id: string; name: string };
    contactPerson?: Partial<ClientContact>;
    samples: OrderSampleItem[];
    totalFeeBeforeTax: number;
    totalFeeBeforeTaxAndDiscount: number;
    totalTaxValue: number;
    totalDiscountValue: number;
    taxRate: number;
    discount: number;
    totalAmount: number;
    quoteStatus: "Draft" | "Sent" | "Approved" | "Expired";
}
