import type { BaseEntity, LabelValue } from "./common";
import type { Order, Client } from "./crm";

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
    shipmentId?: string;
    orderId?: string;
    order?: Partial<Order>; // Snapshot
    clientId?: string;
    client?: Partial<Client>; // Snapshot
    shipmentTrackingNumber?: string;
    senderInfo?: Record<string, any>;
    conditionCheck?: Record<string, any>;
    reportConfig?: ReportConfig;
    receptionistId?: string;
    isBlindCoded?: boolean;
    receiptReceivedImageFileIds?: string[] | null;
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
    parentSampleId?: string;
    custodyLog?: Record<string, any>[];
    retentionServiceFee?: number;
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
    methodLOD?: string; // Snapshot
    methodLOQ?: string; // Snapshot
    analysisUnit?: string; // Snapshot
    handoverInfo?: Record<string, any>[];
    displayStyle?: Record<string, any>;
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
    analysisDeadline?: string;
    rawInputData?: Record<string, any>;
    resultHistory?: Record<string, any>[];
    consumablesUsed?: Record<string, any>[];
    retestReason?: string;
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
