export type IsoDateString = string;

export type IdentitySnapshot = {
    identityId: string;
    identityName: string;
    alias?: string | null;
};

export type AnalysisStatusDb = "Pending" | "Testing" | "DataEntered" | "TechReview" | "Approved" | "ReTest" | "Complained" | "Cancelled";

export type AnalysisResultStatusDb = "Pass" | "Fail" | "NotEvaluated";

export type AnalysisListItem = {
    analysisId: string;
    sampleId: string;
    parameterName: string | null;
    analysisStatus: AnalysisStatusDb;
    analysisResultStatus: AnalysisResultStatusDb | null;
    createdAt: string;

    matrixId?: string | null;
    parameterId?: string | null;
    analysisResult?: string | number | null;
    analysisCompletedAt?: string | null;
    technician?: unknown | null;
    technicians?: IdentitySnapshot[] | null;
    technicianGroupId?: string | null;
    technicianGroupName?: string | null;
    involvedIds?: string[] | null;
    analysisMarks?: string[] | null;
    analysisPriority?: number | null;
    protocolCode?: string | null;
    createdBy?: unknown;

    analysisDocumentId?: string | null;
    analysisDocument?: Record<string, unknown> | null;
};

export type AnalysisDetail = {
    analysisId: string;
    sampleId: string;

    matrixId: string | null;
    parameterId: string | null;
    parameterName: string | null;
    
    sampleTypeId?: string | null;
    sampleTypeName?: string | null;
    equipmentId?: string | null;

    analysisStatus: AnalysisStatusDb;

    analysisResult: string | null;
    analysisResultStatus: AnalysisResultStatusDb | null;

    analysisCompletedAt: IsoDateString | null;
    analysisStartedAt?: IsoDateString | null;
    analysisDeadline?: IsoDateString | null;
    analysisUncertainty?: string | null;
    methodLOD?: string | null;
    methodLOQ?: string | null;
    analysisUnit?: string | null;
    analysisNotes?: string | null;
    handoverInfo?: unknown[] | null;
    displayStyle?: Record<string, unknown> | null;
    rawInputData?: Record<string, unknown> | null;
    resultHistory?: Record<string, unknown>[] | null;
    consumablesUsed?: Record<string, unknown>[] | null;
    retestReason?: string | null;

    technician: IdentitySnapshot | null;
    technicians?: IdentitySnapshot[] | null;
    technicianGroupId?: string | null;
    technicianGroupName?: string | null;

    analysisLocation?: string | null;
    protocolCode?: string | null;
    rawData?: Record<string, unknown> | null;
    involvedIds?: string[] | null;
    analysisMarks?: string[] | null;
    analysisPriority?: number | null;

    createdAt: IsoDateString;
    createdBy: IdentitySnapshot;
    
    analysisDocumentId?: string | null;
    analysisDocument?: Record<string, unknown> | null;
};

export type AnalysesGetListBody = {
    page?: number;
    itemsPerPage?: number;

    analysisId?: string;
    sampleId?: string;
    matrixId?: string;
    parameterId?: string;
    parameterName?: string | null;
    analysisStatus?: AnalysisStatusDb;
    analysisResultStatus?: AnalysisResultStatusDb;

    search?: string | null;
    filters?: Record<string, unknown>;
    analysisMarks?: string[];
    analysisPriority?: number;
    sortColumn?: string;
    sortDirection?: "ASC" | "DESC";

    [key: string]: unknown;
};

export type AnalysesCreateBody = {
    sampleId: string;

    matrixId?: string | null;
    parameterId?: string | null;
    parameterName?: string | null;

    analysisStatus: AnalysisStatusDb;

    analysisResult?: string | null;
    analysisResultStatus?: AnalysisResultStatusDb | null;

    analysisCompletedAt?: IsoDateString | null;

    technicianId?: string | null;
    technicianIds?: string[] | null;
    technicianGroupId?: string | null;
    technicianGroupName?: string | null;
    equipmentId?: string | null;

    analysisStartedAt?: IsoDateString | null;
    analysisUncertainty?: string | null;

    methodLOD?: string | null;
    methodLOQ?: string | null;
    analysisUnit?: string | null;

    handoverInfo?: unknown[] | null;
    displayStyle?: Record<string, string | undefined> | null;

    analysisLocation?: string | null;
    protocolCode?: string | null;

    qaReview?: Record<string, unknown> | null;
    rawData?: Record<string, unknown> | null;

    analysisNotes?: string | null;
};

export type AnalysesUpdateBody = {
    analysisId: string;

    sampleId?: string;
    matrixId?: string | null;
    parameterId?: string | null;
    parameterName?: string | null;

    analysisStatus?: AnalysisStatusDb;
    analysisResult?: string | null;
    analysisResultStatus?: AnalysisResultStatusDb | null;
    analysisCompletedAt?: IsoDateString | null;

    technicianId?: string | null;
    technicianIds?: string[] | null;
    technicianGroupId?: string | null;
    technicianGroupName?: string | null;
    equipmentId?: string | null;

    analysisStartedAt?: IsoDateString | null;
    analysisUncertainty?: string | null;

    methodLOD?: string | null;
    methodLOQ?: string | null;
    analysisUnit?: string | null;

    handoverInfo?: unknown[] | null;
    displayStyle?: Record<string, string | undefined> | null;

    analysisLocation?: string | null;
    protocolCode?: string | null;

    qaReview?: Record<string, unknown> | null;
    rawData?: Record<string, unknown> | null;

    analysisNotes?: string | null;
    createdAt?: IsoDateString;
};

export type AnalysesCreateBulkBody = Array<Partial<AnalysesCreateBody> & { sampleId: string; parameterId: string }>;

export type AnalysesBulkUpdateBody = Array<{
    analysisId: string;
    technicianId?: string | null;
    technicianIds?: string[] | null;
    analysisStatus?: AnalysisStatusDb;
    [key: string]: unknown;
}>;

export type AnalysesDeleteBody = {
    analysisId: string;
};

export type AnalysesDeleteResult = {
    analysisId: string;
    deletedAt: IsoDateString;
    deletedBy: IdentitySnapshot;
};

export type ListMeta = {
    page: number;
    itemsPerPage: number;
    total: number;
    totalPages: number;
};
