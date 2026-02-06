export type IsoDateString = string;

export type IdentitySnapshot = {
  identityId: string;
  identityName: string;
  alias?: string | null;
};

export type AnalysisStatusDb =
  | "Pending"
  | "Testing"
  | "DataEntered"
  | "TechReview"
  | "Approved"
  | "ReTest"
  | "Cancelled";

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
    createdBy?: unknown;
  };
  

export type AnalysisDetail = {
  analysisId: string;
  sampleId: string;

  matrixId: string | null;
  parameterId: string | null;
  parameterName: string | null;

  analysisStatus: AnalysisStatusDb;

  analysisResult: string | null;
  analysisResultStatus: AnalysisResultStatusDb | null;

  analysisCompletedAt: IsoDateString | null;

  technician: IdentitySnapshot | null;

  createdAt: IsoDateString;
  createdBy: IdentitySnapshot;
};


export type AnalysesGetListBody = {
  page?: number;
  itemsPerPage?: number;

  sampleId?: string;
  parameterName?: string | null;
  analysisStatus?: AnalysisStatusDb;
  analysisResultStatus?: AnalysisResultStatusDb;
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
  equipmentId?: string | null;

  analysisStartedAt?: IsoDateString | null;
  analysisUncertainty?: string | null;

  analysisMethodLOD?: string | null;
  analysisMethodLOQ?: string | null;
  analysisUnit?: string | null;

  handoverInfo?: unknown[] | null;
  analysisReportDisplay?: Record<string, string | undefined> | null;

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
  equipmentId?: string | null;

  analysisStartedAt?: IsoDateString | null;
  analysisUncertainty?: string | null;

  analysisMethodLOD?: string | null;
  analysisMethodLOQ?: string | null;
  analysisUnit?: string | null;

  handoverInfo?: unknown[] | null;
  analysisReportDisplay?: Record<string, string | undefined> | null;

  analysisLocation?: string | null;
  protocolCode?: string | null;

  qaReview?: Record<string, unknown> | null;
  rawData?: Record<string, unknown> | null;

  analysisNotes?: string | null;
  createdAt?: IsoDateString;
};

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
