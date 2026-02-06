// src/types/operations/receipt.ts

export type IsoDateString = string;

export type IdentitySnapshot = {
  identityId: string;
  identityName: string;
  alias?: string | null;
  [key: string]: unknown;
};

export type ClientInvoiceInfo = {
  taxAddress?: string | null;
  taxCode?: string | null;
  taxName?: string | null;
  taxEmail?: string | null;
  [key: string]: unknown;
};

export type ClientSnapshot = {
  clientId: string;
  clientName: string;
  legalId?: string | null;
  clientAddress?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  invoiceInfo?: ClientInvoiceInfo | null;
  [key: string]: unknown;
};

export type ContactPerson = {
  contactId?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactPosition?: string | null;
  contactAddress?: string | null;
  [key: string]: unknown;
};

export type ReportRecipient = {
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverAddress?: string | null;
  receiverEmail?: string | null;
  [key: string]: unknown;
};

export type ReceiptPriority = "Normal" | "Urgent" | (string & {});
export type ReceiptDeliveryMethod = "HandOver" | "Post" | (string & {});

export type ReceiptStatus =
  | "Draft"
  | "Received"
  | "Processing"
  | "Completed"
  | "Reported"
  | "Cancelled"
  | (string & {});

export type SampleStatus =
  | "Received"
  | "InPrep"
  | "Distributed"
  | "Analyzing"
  | "Retained"
  | "Disposed"
  | "Returned"
  | (string & {});

export type AnalysisStatus =
  | "Pending"
  | "Testing"
  | "DataEntered"
  | "TechReview"
  | "ReTest"
  | "Review"
  | "Approved"
  | "Cancelled"
  | (string & {});

export type ReceiptListItem = {
  receiptId: string;
  receiptCode: string;
  receiptStatus: ReceiptStatus;

  receiptDate?: IsoDateString | null;
  receiptDeadline?: IsoDateString | null;

  receiptTrackingNo?: string | null;
  trackingNumber?: string | null;

  client?: Pick<
    ClientSnapshot,
    "clientId" | "clientName" | "clientEmail" | "clientPhone" | "clientAddress"
  > | null;

  createdAt?: IsoDateString | null;
  createdBy?: IdentitySnapshot | null;

  [key: string]: unknown;
};

export type ReceiptOrderSnapshot = {
  orderCode?: string | null;
  totalAmount?: number | string | null;
  [key: string]: unknown;
};

export type ReceiptSenderInfo = {
  name?: string | null;
  phone?: string | null;
  [key: string]: unknown;
};

export type ReceiptConditionCheck = {
  seal?: string | null;
  temp?: string | null;
  [key: string]: unknown;
};

export type ReceiptReportConfig = {
  language?: string | null;
  copies?: number | null;
  sendSoftCopy?: boolean | null;
  [key: string]: unknown;
};

export type SampleInfoItem = {
  label: string;
  value: string;
  [key: string]: unknown;
};

export type AnalysisQaReview = {
  reviewerId?: string | null;
  comment?: string | null;
  timestamp?: IsoDateString | null;
  [key: string]: unknown;
};

export type AnalysisRawData = {
  fileId?: string | null;
  url?: string | null;
  [key: string]: unknown;
};

export type ReceiptAnalysis = {
  analysisId: string;
  sampleId?: string | null;

  matrixId?: string | null;
  parameterId?: string | null;
  parameterName?: string | null;
  protocolCode?: string | null;

  technicianId?: string | null;
  technicianIds?: string[] | null;

  equipmentId?: string | null;

  analysisStatus: AnalysisStatus;
  analysisResult?: string | number | null;
  analysisResultStatus?: string | null;

  analysisStartedAt?: IsoDateString | null;
  analysisCompletedAt?: IsoDateString | null;

  analysisUncertainty?: string | null;
  analysisMethodLOD?: string | null;
  analysisMethodLOQ?: string | null;
  analysisUnit?: string | null;

  handoverInfo?: unknown[] | null;
  analysisReportDisplay?: Record<string, unknown> | null;
  analysisLocation?: string | null;

  qaReview?: AnalysisQaReview | null;
  rawData?: AnalysisRawData | null;

  createdAt?: IsoDateString | null;

  technician?: IdentitySnapshot | null;

  [key: string]: unknown;
};

export type ReceiptSample = {
  sampleId: string;
  receiptId?: string | null;

  sampleName?: string | null;

  sampleTypeId?: string | null;
  sampleTypeName?: string | null;

  productType?: string | null;
  sampleClientInfo?: string | null;

  sampleInfo?: SampleInfoItem[] | null;
  sampleReceiptInfo?: SampleInfoItem[] | null;

  sampleStatus?: SampleStatus | null;

  sampleVolume?: string | null;
  sampleWeight?: string | null;

  samplePreservation?: string | null;
  sampleStorageLoc?: string | null;

  sampleRetentionDate?: IsoDateString | null;
  sampleDisposalDate?: IsoDateString | null;

  sampleIsReference?: boolean | null;

  samplingInfo?: Record<string, unknown> | null;
  physicalState?: string | null;

  createdAt?: IsoDateString | null;
  createdBy?: Pick<
    IdentitySnapshot,
    "identityId" | "identityName" | "alias"
  > | null;

  analyses?: ReceiptAnalysis[] | null;

  [key: string]: unknown;
};

export type ReceiptDetail = {
  receiptId: string;
  receiptCode: string;
  receiptStatus: ReceiptStatus;

  receiptDate?: IsoDateString | null;
  receiptDeadline?: IsoDateString | null;
  receiptNote?: string | null;

  receiptPriority?: ReceiptPriority | null;
  receiptDeliveryMethod?: ReceiptDeliveryMethod | null;

  receiptTrackingNo?: string | null;
  trackingNumber?: string | null;

  orderId?: string | null;
  order?: ReceiptOrderSnapshot | null;

  clientId?: string | null;
  client?: ClientSnapshot | null;

  contactPerson?: ContactPerson | null;
  reportRecipient?: ReportRecipient | null;

  senderInfo?: ReceiptSenderInfo | null;
  conditionCheck?: ReceiptConditionCheck | null;
  reportConfig?: ReceiptReportConfig | null;

  createdAt?: IsoDateString | null;
  createdBy?: IdentitySnapshot | null;

  samples?: ReceiptSample[] | null;

  [key: string]: unknown;
};


export type ReceiptsCreateBody = {
  receiptCode?: string | null;
  receiptStatus?: ReceiptStatus | null;

  client?: {
    clientId?: string | null;
    clientName?: string | null;
    invoiceInfo?: ClientInvoiceInfo | null;
    [key: string]: unknown;
  } | null;

  contactPerson?: ContactPerson | null;

  receiptDate?: IsoDateString | null;
  receiptDeadline?: IsoDateString | null;

  receiptPriority?: ReceiptPriority | null;
  receiptDeliveryMethod?: ReceiptDeliveryMethod | null;

  trackingNumber?: string | null;

  [key: string]: unknown;
};

export type ReceiptsCreateFullBody = {
  receiptStatus?: ReceiptStatus | null;

  client?: {
    clientId?: string | null;
    clientName?: string | null;
    [key: string]: unknown;
  } | null;

  receiptDate?: IsoDateString | null;

  samples?: Array<{
    sampleName?: string | null;
    sampleTypeId?: string | null;

    sampleVolume?: string | null;
    samplePreservation?: string | null;

    sampleInfo?: SampleInfoItem[] | null;

    analyses?: Array<{
      matrixId?: string | null;
      [key: string]: unknown;
    }> | null;

    [key: string]: unknown;
  }> | null;

  [key: string]: unknown;
};

export type ReceiptsUpdateBody = {
  receiptId: string;

  receiptStatus?: ReceiptStatus | null;

  reportRecipient?: ReportRecipient | null;

  [key: string]: unknown;
};

export type ReceiptsDeleteBody = {
  receiptId: string;
};

export type ReceiptDeleteResult = {
  receiptId: string;
  deletedAt?: IsoDateString | null;
  deletedBy?: Pick<
    IdentitySnapshot,
    "identityId" | "identityName" | "alias"
  > | null;
  [key: string]: unknown;
};
