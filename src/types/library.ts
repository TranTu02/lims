import type { BaseEntity } from "./common";

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
    protocolName?: string;
    protocolGroup?: string;
    protocolSource?: string;
    protocolAccreditation?: Record<string, boolean>;
    description?: string;
    executionGuide?: string;
    executionTime?: string;
    equipment?: string[];
    chemicals?: string[];
    // relatedFiles?: FileEntity[]; // This would require importing FileEntity or keeping it separate.
    // For now we might skip relatedFiles in the type or use a loose type if needed, but let's stick to simple fields first.
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
