import type { BaseEntity } from "./common";

export interface ChemicalSku extends BaseEntity {
    chemicalSkuId: string;
    chemicalName: string;
    chemicalCASNumber?: string | null;
    chemicalBaseUnit?: string | null;
    chemicalTotalAvailableQty?: number | null;
    chemicalReorderLevel?: number | null;
    chemicalHazardClass?: string | null;

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

export type ChemicalInventoryStatus = "Quarantined" | "New" | "InUse" | "Empty" | "Expired" | "Disposed" | string;

export interface ChemicalInventory extends BaseEntity {
    chemicalInventoryId: string;
    chemicalSkuId: string;
    chemicalSupplierId?: string | null;
    lotNumber?: string | null;
    manufacturerName?: string | null;
    manufacturerCountry?: string | null;
    inventoryCOADocumentIds?: string[] | null;
    currentAvailableQty: number;
    mfgDate?: string | null; // ISO Date string
    expDate?: string | null;
    openedDate?: string | null;
    openedExpDate?: string | null;
    inventoryStatus: ChemicalInventoryStatus;
    storageBinLocation?: string | null;

    // Virtual fields
    chemicalSku?: ChemicalSku;
    chemicalSupplier?: ChemicalSupplier;
}

export type ChemicalTransactionType = "IMPORT" | "EXPORT" | "ADJUSTMENT" | string;

export interface ChemicalTransactionBlock extends BaseEntity {
    chemicalTransactionBlockId: string;
    transactionType: ChemicalTransactionType;
    referenceDocument?: string | null;
    createdBy?: string | null;

    // Virtual fields
    transactions?: ChemicalTransaction[];
}

export interface ChemicalTransaction extends BaseEntity {
    chemicalTransactionId: string;
    chemicalTransactionBlockId: string;
    actionType?: string | null; // INITIAL_ISSUE, SUPPLEMENTAL, RETURN, WASTE...
    chemicalSkuId?: string | null;
    chemicalName?: string | null;
    casNumber?: string | null;
    chemicalInventoryId?: string | null;
    changeQty: number;
    unit?: string | null;
    testName?: string | null;
    analysisId?: string | null;
    note?: string | null;

    // Virtual fields
    chemicalTransactionBlock?: ChemicalTransactionBlock;
    chemicalInventory?: ChemicalInventory;
    chemicalSku?: ChemicalSku;
}

// API Payloads
export interface AllocateChemicalPayload {
    chemicalSkuId: string;
    requiredQty: number;
    analysisId: string;
    testName: string;
    allocatedBy?: string;
}

export interface ReturnChemicalPayload {
    chemicalInventoryId: string;
    returnQty: number;
    analysisId: string;
    testName: string;
    returnedBy?: string;
}

export interface RecalcChemicalPayload {
    chemicalSkuId: string;
}

export interface CreateTransactionBlockFullPayload {
    chemicalTransactionBlock: Partial<ChemicalTransactionBlock>;
    chemicalTransactions: Partial<ChemicalTransaction>[];
}
