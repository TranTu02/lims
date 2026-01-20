import type { BaseEntity } from "./common";

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
