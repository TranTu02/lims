export type IsoDateString = string;

export type IdentitySnapshot = {
  identityId: string;
  identityName: string;
  alias?: string | null;
  [key: string]: unknown;
};

type ExtensibleString<T extends string> = T | (string & Record<never, never>);

export const SAMPLE_STATUS_VALUES = ["Received", "Analyzing", "Stored", "Disposed"] as const;
export type SampleStatus = ExtensibleString<(typeof SAMPLE_STATUS_VALUES)[number]>;

export const ANALYSIS_STATUS_VALUES = ["Assigned", "Testing", "Completed"] as const;
export type AnalysisStatus = ExtensibleString<(typeof ANALYSIS_STATUS_VALUES)[number]>;

export const ANALYSIS_RESULT_STATUS_VALUES = ["NotEvaluated", "Pass", "Fail"] as const;
export type AnalysisResultStatus = ExtensibleString<
  (typeof ANALYSIS_RESULT_STATUS_VALUES)[number]
>;

// --- List item ( /v2/samples/get/list -> data: SampleListItem[] )
export type SampleListItem = {
  sampleId: string;
  receiptId: string;

  sampleTypeName?: string | null;
  sampleStatus?: SampleStatus | null;

  sampleVolume?: string | null;
  createdAt?: IsoDateString | null;
};

export type AnalysisReportDisplay = {
  eng?: string | null;
  default?: string | null;
  [key: string]: unknown;
};

export type SampleAnalysis = {
  analysisId: string;
  sampleId: string;

  matrixId?: string | null;

  parameterId?: string | null;
  parameterName?: string | null;

  technicianId?: string | null;
  technicianIds?: string[] | null;

  equipmentId?: string | null;

  analysisStatus?: AnalysisStatus | null;

  analysisResult?: string | null;
  analysisResultStatus?: AnalysisResultStatus | null;

  analysisStartedAt?: IsoDateString | null;
  analysisCompletedAt?: IsoDateString | null;

  analysisUncertainty?: string | null;

  analysisMethodLOD?: string | null;
  analysisMethodLOQ?: string | null;
  analysisUnit?: string | null;

  handoverInfo?: unknown | null;
  analysisReportDisplay?: AnalysisReportDisplay | null;

  analysisLocation?: string | null;
  protocolCode?: string | null;

  qaReview?: unknown | null;
  rawData?: unknown | null;

  createdAt?: IsoDateString | null;
  createdById?: string | null;

  modifiedAt?: IsoDateString | null;
  modifiedById?: string | null;

  [key: string]: unknown;
};

export type SampleInfoValue = Record<string, unknown> | unknown[];
export type SampleDetail = {
  sampleId: string;
  receiptId: string;

  sampleTypeId?: string | null;
  sampleTypeName?: string | null;

  productType?: string | null;

  sampleClientInfo?: string | null;

  sampleInfo?: SampleInfoValue | null;
  sampleReceiptInfo?: SampleInfoValue | null;

  sampleStatus?: SampleStatus | null;

  sampleVolume?: string | null;
  sampleWeight?: string | null;

  samplePreservation?: string | null;
  sampleStorageLoc?: string | null;

  sampleRetentionDate?: IsoDateString | null;
  sampleDisposalDate?: IsoDateString | null;

  sampleIsReference?: boolean | null;

  samplingInfo?: unknown | null;
  physicalState?: string | null;

  createdAt?: IsoDateString | null;

  createdById?: string | null;
  createdBy?: IdentitySnapshot | null;

  modifiedAt?: IsoDateString | null;
  modifiedById?: string | null;

  analyses: SampleAnalysis[];

  [key: string]: unknown;
};

export type SamplesCreateBody = {
  receiptId: string;
  sampleTypeId: string;

  sampleClientInfo?: string | null;
  sampleVolume?: string | null;

  [key: string]: unknown;
};

export type SamplesUpdateBody = {
  sampleId: string;

  sampleStatus?: SampleStatus | null;
  sampleStorageLoc?: string | null;

  [key: string]: unknown;
};

export type StandardListQuery = {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SamplesGetListInput = {
  query?: StandardListQuery;
  sort?: Record<string, unknown>;
};

export type SamplesGetFullInput = {
  sampleId: string;
};
