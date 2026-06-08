export interface Equipment {
    equipmentId: string;
    equipmentName: string;
    equipmentManufactuer?: string | null;
    equipmentModel?: string | null;
    equipmentSpecification?: string | null;
    equipmentLastCalibration?: string | null;
    equipmentDocumentIds?: string[] | null;
    identityChargeIds?: string[] | null;
    createdAt?: string;
    createdById?: string | null;
    modifiedAt?: string;
    modifiedById?: string | null;
    deletedAt?: string | null;
    
    // Details joined from full view
    availableBy?: { identityId: string; identityName: string }[] | null;
    documents?: { documentId: string; documentTitle: string; fileId?: string | null }[] | null;
    logs?: EquipmentLog[] | null;
}

export interface EquipmentLog {
    equipmentLogId: string;
    equipmentId: string;
    equipmentLogType: "Usage" | "Maintenance" | "Calibration" | "Incident";
    equipmentLogDescription?: string | null;
    equipmentLogLocation?: string | null;
    equipmentLogData?: Record<string, any> | null;
    commonKeys?: string[] | null;
    actionTime?: string;
    createdAt?: string;
    createdById?: string | null;
    modifiedAt?: string;
    modifiedById?: string | null;
    deletedAt?: string | null;
}

export interface TechnicianOption {
    identityId: string;
    identityName: string;
    identityRoles: string[];
}
