import type { BaseEntity } from "./common";

export interface ChemicalSku extends BaseEntity {
    chemicalSkuId: string;
    chemicalName: string;
    chemicalCasNumber?: string | null;
    chemicalBaseUnit?: string | null;
    chemicalTotalAvailableQty?: number | null;
    chemicalReorderLevel?: number | null;
    chemicalHazardClass?: string | null;
    openedExpDays?: number | null;
    chemicalSkuOldId?: string | null;

    // Virtual fields available on get/full
    items?: ChemicalInventory[];
}

export interface SupplierContact {
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
}

export interface ChemicalSupplier extends BaseEntity {
    chemicalSupplierId: string;
    supplierName: string;
    supplierTaxCode?: string | null;
    supplierAddress?: string | null;
    supplierContactPerson?: SupplierContact[] | null;
    supplierStatus?: string | null; // Active, Inactive, Blacklisted
    supplierEvaluationScore?: number | null;
    supplierIsoCertifications?: string[] | null;
}

export interface ChemicalSkuSupplier extends BaseEntity {
    chemicalSku_chemicalSupplierId: string;
    chemicalSkuId: string;
    chemicalSupplierId: string;
    catalogNumber?: string | null;
    brandManufacturer?: string | null;
    packagingSize?: number | null;
    leadTimeDays?: number | null;

    // Virtual fields
    chemicalSku?: ChemicalSku;
    chemicalSupplier?: ChemicalSupplier;
}

export type ChemicalInventoryStatus = "Quarantined" | "New" | "InUse" | "Empty" | "Expired" | "Disposed" | "Pending" | string;

export interface ChemicalInventory extends BaseEntity {
    chemicalInventoryId: string;
    chemicalSkuId: string;
    chemicalName?: string | null; // Snapshot from SKU
    chemicalCasNumber?: string | null; // Snapshot from SKU
    chemicalSupplierId?: string | null;
    lotNumber?: string | null;
    manufacturerName?: string | null;
    manufacturerCountry?: string | null;
    inventoryCoaDocumentIds?: string[] | null;
    inventoryInvoiceDocumentIds?: string[] | null;
    inventoryCoaDocuments?: any[] | null;
    inventoryInvoiceDocuments?: any[] | null;
    storageConditions?: string | null;
    currentAvailableQty: number;
    totalGrossWeight?: number | null;
    mfgDate?: string | null; // ISO Date string
    expDate?: string | null;
    openedDate?: string | null;
    openedExpDate?: string | null;
    openedExpDays?: number | null;
    chemicalInventoryStatus: ChemicalInventoryStatus;
    storageBinLocation?: string | null;
    chemicalSkuOldId?: string | null;

    // Virtual fields
    chemicalSku?: ChemicalSku;
    chemicalSupplier?: ChemicalSupplier;
}

export type ChemicalTransactionType = "IMPORT" | "EXPORT" | "ADJUSTMENT" | string;
export type ChemicalTransactionBlockStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | string;

export interface ChemicalTransactionBlock extends BaseEntity {
    chemicalTransactionBlockId: string;
    transactionType: ChemicalTransactionType;
    chemicalTransactionBlockStatus?: ChemicalTransactionBlockStatus | null;
    referenceDocument?: string | null;
    chemicalBlockCoaDocumentIds?: string[] | null;
    chemicalBlockInvoiceDocumentIds?: string[] | null;
    chemicalBlockCoaDocuments?: any[] | null;
    chemicalBlockInvoiceDocuments?: any[] | null;
    createdBy?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;

    // Virtual fields
    chemicalTransactions?: ChemicalTransaction[];
    chemicalTransactionBlockDetails?: ChemicalTransactionBlockDetail[];
}

// Bảng tạm — chi tiết dự kiến chưa thực thi
export interface ChemicalTransactionBlockDetail extends BaseEntity {
    chemicalTransactionBlockDetailId: string;
    chemicalTransactionBlockId: string;
    transactionType?: ChemicalTransactionType | null;
    chemicalSkuId?: string | null;
    chemicalName?: string | null;
    chemicalCasNumber?: string | null;
    chemicalSkuOldId?: string | null;
    chemicalInventoryId?: string | null;
    changeQty: number;
    totalWeight?: number | null;
    chemicalTransactionBlockDetailUnit?: string | null;
    parameterName?: string | null;
    analysisId?: string | null;
    chemicalTransactionBlockDetailNote?: string | null;
}

export interface ChemicalTransaction extends BaseEntity {
    chemicalTransactionId: string;
    chemicalTransactionBlockId: string;
    transactionType?: ChemicalTransactionType | null;
    chemicalSkuId?: string | null;
    chemicalName?: string | null;
    chemicalCasNumber?: string | null;
    chemicalSkuOldId?: string | null;
    chemicalInventoryId?: string | null;
    changeQty: number;
    totalWeight?: number | null;
    chemicalTransactionUnit?: string | null;
    parameterName?: string | null;
    analysisId?: string | null;
    chemicalTransactionNote?: string | null;

    // Virtual fields
    chemicalTransactionBlock?: ChemicalTransactionBlock;
    chemicalInventory?: ChemicalInventory;
    chemicalSku?: ChemicalSku;
}

// --- AUDIT (Kiểm kê kho) ---
export type ChemicalAuditBlockStatus = "DRAFT" | "IN_PROGRESS" | "PENDING_APPROVAL" | "COMPLETED" | "CANCELLED" | string;

export interface ChemicalAuditBlock extends BaseEntity {
    chemicalAuditBlockId: string;
    auditName?: string | null;
    auditScope?: string | null; // ALL, LOCATION, HAZARD_CLASS, SKU
    auditScopeValue?: string | null;
    chemicalAuditBlockStatus?: ChemicalAuditBlockStatus | null;
    chemicalTransactionBlockId?: string | null;
    assignedTo?: string | null;
    createdBy?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    note?: string | null;

    // Virtual fields
    details?: ChemicalAuditDetail[];
}

export interface ChemicalAuditDetail extends BaseEntity {
    chemicalAuditDetailId: string;
    chemicalAuditBlockId: string;
    chemicalSkuId?: string | null;
    chemicalSkuOldId?: string | null;
    chemicalInventoryId?: string | null;
    systemAvailableQty?: number | null;
    systemChemicalInventoryStatus?: string | null;
    actualAvailableQty?: number | null;
    actualChemicalInventoryStatus?: string | null;
    varianceQty?: number | null;
    isScanned?: boolean | null;
    chemicalAuditDetailNote?: string | null;

    // Virtual fields
    chemicalSku?: ChemicalSku;
    chemicalInventory?: ChemicalInventory;
}

// API Payloads
export interface AllocateChemicalPayload {
    chemicalSkuId: string;
    requiredQty: number;
    analysisId: string;
    parameterName: string;
    allocatedBy?: string;
}

export interface ReturnChemicalPayload {
    chemicalInventoryId: string;
    returnQty: number;
    analysisId: string;
    parameterName: string;
    returnedBy?: string;
}

export interface RecalcChemicalPayload {
    chemicalSkuId: string;
}

export interface CreateTransactionBlockFullPayload {
    chemicalTransactionBlock: Partial<ChemicalTransactionBlock>;
    chemicalTransactionBlockDetails: Partial<ChemicalTransactionBlockDetail>[];
}

// --- NEW API Payloads ---

// POST /v2/chemicaltransactionblocks/approve
export interface ApproveTransactionBlockPayload {
    chemicalTransactionBlockId: string;
}

// POST /v2/chemicaltransactionblocks/estimate
export interface EstimateChemicalPayload {
    analyses: { analysisId: string }[];
}

export interface EstimateDetail {
    analysisId: string;
    chemicalSkuId: string;
    chemicalName: string;
    chemicalCasNumber?: string | null;
    changeQty: number;
    unit: string;
    parameterName?: string | null;
}

export interface EstimateSummary {
    chemicalSkuId: string;
    chemicalName: string;
    chemicalCasNumber?: string | null;
    totalChangeQty: number;
    unit: string;
    analysisIds: string[];
}

export interface EstimateResponse {
    details: EstimateDetail[];
    summary: EstimateSummary[];
}

// POST /v2/chemicaltransactionblocks/allocate
export interface AllocateStockPayload {
    requiredChemicals: EstimateSummary[];
    selectedInventories?: { chemicalInventoryId: string; chemicalSkuId: string }[];
}

export interface AllocateTransactionDetail {
    chemicalSkuId: string;
    chemicalName: string;
    chemicalCasNumber?: string | null;
    chemicalInventoryId: string;
    changeQty: number;
    chemicalTransactionBlockDetailUnit: string;
    parameterName?: string | null;
    analysisId: string;
    transactionType: string;
    currentAvailableQty?: number;
}

export interface AllocatePickingItem {
    chemicalInventoryId: string;
    chemicalSkuId: string;
    chemicalName?: string | null;
    chemicalCasNumber?: string | null;
    analysisIds: (string | null)[];
    totalChangeQty: number;
}

export interface AllocateStockResponse {
    transactionDetails: AllocateTransactionDetail[];
    pickingList: AllocatePickingItem[];
}

// POST /v2/chemicalinventories/separate
export interface SeparateChemicalInventoryItem extends Record<string, any> {
    currentAvailableQty: number;
    totalGrossWeight?: number | null;
    storageBinLocation?: string | null;
    chemicalInventoryStatus?: string | null;
}

export interface SeparateChemicalInventoryPayload {
    chemicalInventoryId: string;
    note?: string | null;
    originalTotalGrossWeight?: number | null;
    separationChemicals: SeparateChemicalInventoryItem[];
}
