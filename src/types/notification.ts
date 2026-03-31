export type EmailRecipient = {
    name?: string | null;
    email: string;
};

export type EmailAttachment = {
    fileId?: string;
    documentId?: string;
    fileName?: string;
    fileUrl?: string; // Optional if backend can fetch by ID
};

export interface SendEmailBody {
    to: string | string[] | EmailRecipient[];
    cc?: string | string[] | EmailRecipient[];
    bcc?: string | string[] | EmailRecipient[];
    subject: string;
    content: string; // HTML content
    attachments?: string[] | EmailAttachment[]; // List of fileIds or objects
    templateId?: string; // Optional if using a predefined template
    refId?: string; // Optional reference (e.g., receiptId, sampleId)
    refType?: string; // e.g., 'receipt', 'sample', 'report'
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
}
