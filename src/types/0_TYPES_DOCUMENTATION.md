Chào bạn, dựa trên tài liệu thiết kế cơ sở dữ liệu **LIMS Multi-Lab SaaS Platform v2.3**, tôi đã chuyển đổi các bảng thành các **TypeScript Interfaces** được tổ chức theo từng module.

Tôi đã áp dụng các quy tắc sau:

1.  **Type Mapping:** `text` $\rightarrow$ `string`, `numeric` $\rightarrow$ `number`, `timestamp` $\rightarrow$ `string` (ISO Date format), `jsonb` $\rightarrow$ Interface chi tiết (nếu có mô tả) hoặc `Record<string, any>`.
2.  **Base Interface:** Tạo `BaseEntity` chứa các trường Audit chung.
3.  **Strict Typing:** Các trường có tập giá trị cố định (Status, Type) được định nghĩa bằng **Union Types**.

---

### 1. Common / Shared Types

Các type dùng chung cho toàn hệ thống.

```typescript
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
```

---

### 2. Module Identity (`identity`)

```typescript
export type IdentityRole = {
    admin?: boolean;
    customerService?: boolean;
    technician?: boolean;
    collaborator?: boolean;
    administrative?: boolean;
    accountant?: boolean;
    sampleManager?: boolean;
    superAdmin?: boolean;
    dispatchClerk?: boolean;
    documentManagementSpecialist?: boolean;
    bot?: boolean;
    IT?: boolean;
    marketingCommunications?: boolean;
    qualityControl?: boolean;
    [key: string]: boolean | undefined;
};

export interface Identity extends BaseEntity {
    identityId: string;
    email: string;
    identityName?: string;
    alias?: string;
    roles: IdentityRole;
    permissions?: Record<string, any>; // Cấu trúc permission cụ thể tùy logic
    password?: string; // Thường không trả về password hash ở FE
    identityStatus: "active" | "inactive";
}

export interface Session extends Omit<BaseEntity, "createdById" | "modifiedById"> {
    sessionId: string;
    identityId: string;
    sessionExpiry: string;
    sessionStatus: "active" | "expired" | "revoked";
    ipAddress?: string;
    sessionDomain?: string;
    createdAt: string;
    modifiedAt: string;
}
```

---

### 3. Module CRM (`crm`)

```typescript
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
}

export interface OrderSampleItem {
    sampleId?: string; // Null nếu tạo mới
    userSampleId?: string;
    sampleName: string;
    sampleTypeId: string;
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
```

---

### 4. Module Library (`library`)

```typescript
export interface Matrix extends BaseEntity {
    matrixId: string;
    parameterId?: string;
    protocolId?: string;
    sampleTypeId: string;
    protocolCode?: string;
    protocolSource?: string;
    protocolAccreditation?: Record<string, boolean>; // e.g. { VILAS: true }
    parameterName?: string;
    sampleTypeName?: string;
    feeBeforeTax: number;
    taxRate: number;
    feeAfterTax: number;
    LOD?: string;
    LOQ?: string;
    thresholdLimit?: string;
    turnaroundTime?: number;
    technicianGroupId?: string;
}

export interface Protocol extends BaseEntity {
    protocolId: string;
    protocolCode: string;
    protocolSource?: string;
    protocolAccreditation?: Record<string, boolean>;
}

export interface Parameter extends BaseEntity {
    parameterId: string;
    parameterName: string;
    displayStyle?: Record<string, any>;
    technicianAlias?: string;
}

export interface SampleType extends BaseEntity {
    sampleTypeId: string;
    sampleTypeName: string;
    displayTypeStyle?: {
        eng?: string;
        default?: string;
        [key: string]: string | undefined;
    };
}

export interface ParameterGroup extends BaseEntity {
    groupId: string;
    groupName: string;
    matrixIds: string[];
    groupNote?: string;
    sampleTypeId: string;
    sampleTypeName?: string;
    feeBeforeTaxAndDiscount: number;
    discountRate: number;
    feeBeforeTax: number;
    taxRate: number;
    feeAfterTax: number;
}
```

---

### 5. Module Lab (`lab`)

```typescript
export interface ReportConfig {
    language?: string;
    copies?: number;
    sendSoftCopy?: boolean;
}

export interface Receipt extends BaseEntity {
    receiptId: string;
    receiptCode: string;
    receiptStatus: "Pending" | "Processing" | "Done" | "Cancelled";
    receiptDate: string;
    receiptDeadline: string;
    receiptNote?: string;
    receiptPriority: "Normal" | "Urgent" | "Flash";
    receiptDeliveryMethod: "HandOver" | "Post" | "Pickup";
    receiptTrackingNo?: string;
    orderId?: string;
    order?: Partial<Order>; // Snapshot
    clientId?: string;
    client?: Partial<Client>; // Snapshot
    trackingNumber?: string;
    senderInfo?: Record<string, any>;
    conditionCheck?: Record<string, any>;
    reportConfig?: ReportConfig;
}

export interface Sample extends BaseEntity {
    sampleId: string;
    receiptId: string;
    sampleTypeId: string;
    productType?: string;
    sampleTypeName?: string;
    sampleClientInfo?: string;
    sampleInfo: LabelValue[];
    sampleReceiptInfo: LabelValue[];
    sampleStatus: "Received" | "Analyzing" | "Stored" | "Disposed";
    sampleVolume?: string;
    sampleWeight?: number;
    samplePreservation?: string;
    sampleStorageLoc?: string;
    sampleRetentionDate?: string;
    sampleDisposalDate?: string;
    sampleIsReference?: boolean;
    samplingInfo?: Record<string, any>;
    physicalState?: string;
}

export interface Analysis extends BaseEntity {
    analysisId: string;
    sampleId: string;
    matrixId: string;
    parameterId?: string;
    technicianId?: string;
    technicianIds?: string[];
    equipmentId?: string;
    analysisStatus: "Pending" | "Testing" | "Review" | "Approved" | "Rejected";
    analysisResult?: string;
    analysisResultStatus: "Pass" | "Fail" | "NotEvaluated";
    analysisStartedAt?: string;
    analysisCompletedAt?: string;
    analysisUncertainty?: string;
    analysisMethodLOD?: string; // Snapshot
    analysisMethodLOQ?: string; // Snapshot
    analysisUnit?: string; // Snapshot
    handoverInfo?: Record<string, any>[];
    analysisReportDisplay?: Record<string, any>;
    parameterName?: string; // Snapshot
    analysisLocation?: string;
    protocolCode?: string; // Snapshot
    qaReview?: {
        reviewerId: string;
        comment: string;
        timestamp: string;
    };
    rawData?: {
        fileId: string;
        url: string;
    };
}

export interface Equipment extends BaseEntity {
    equipmentId: string;
    equipmentName: string;
    equipmentCode: string;
    equipmentStatus: "Active" | "Maintenance" | "Broken";
    equipmentCalibDate?: string;
    equipmentNextCalib?: string;
    equipmentLog?: Record<string, any>;
}

export interface InventoryItem extends BaseEntity {
    itemId: string;
    itemName: string;
    itemType: "Chemical" | "Glassware" | "Consumable" | "StandardSubstance";
    itemStockQty: number;
    itemUnit: string;
    itemLotNo?: string;
    itemExpiryDate?: string;
    itemLocation?: string;
    itemCasNo?: string;
}
```

---

### 6. Module Document (`document`)

```typescript
export interface FileEntity extends BaseEntity {
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    uris: string[];
    fileTags: string[];
    opaiFile?: Record<string, any>;
}

export interface DocumentEntity extends BaseEntity {
    documentId: string;
    fileId: string;
    refId?: string;
    refType?: "Receipt" | "Order" | string;
    jsonContent?: Record<string, any>;
}

export interface Report extends BaseEntity {
    reportId: string;
    receiptId: string;
    sampleId: string;
    header?: string; // HTML
    content?: string; // HTML
    footer?: string; // HTML
}
```

---

### 7. Module Service (`service`)

```typescript
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
```
