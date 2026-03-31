import api from "@/api/client";
import type { FileInfo } from "./files";

export type DocumentStatus = "Draft" | "Issued" | "Revised" | "Cancelled";

export interface DocumentInfo {
    documentId: string;
    documentTitle?: string | null;
    createdAt: string;
    modifiedAt: string;
    createdById?: string;
    fileId: string;
    refId?: string | null;
    refType?: string | null;
    commonKeys?: string[];
    documentStatus?: DocumentStatus | null;
    documentType?: string | null;
    jsonContent?: Record<string, any>;
    deletedAt?: string | null;
}

/** Document with nested FileInfo under the `file` key (document.files schema) */
export interface DocumentFullInfo extends DocumentInfo {
    file: FileInfo;
}

export interface DocumentUrlResponse {
    url: string;
    expiresIn: number;
    documentId: string;
    fileId: string;
}

export interface DocumentCreateRefBody {
    fileId?: string;
    refType?: string;
    refId?: string;
    classifierCode?: string;
    documentType?: string;
    commonKeys?: string[];
    jsonContent?: Record<string, any>;
}

export interface DocumentUpdateBody {
    documentId: string;
    classifierCode?: string;
    commonKeys?: string[];
    jsonContent?: Record<string, any>;
}

import { useQuery } from "@tanstack/react-query";

function assertSuccess<T>(res: { success?: boolean; data?: T; error?: { message?: string } | null }): T {
    if ("success" in res && res.success === false) {
        throw new Error(res.error?.message ?? "Unknown API error");
    }
    return (res.data !== undefined ? res.data : res) as T;
}

export const documentApi = {
    list: (query?: Record<string, unknown>) => api.get<DocumentInfo[]>("/v2/documents/get/list", { query }),
    detail: (id: string) => api.get<DocumentInfo>("/v2/documents/get/detail", { query: { id } }),
    full: (id: string) => api.get<DocumentFullInfo>("/v2/documents/get/full", { query: { id } }),
    url: (id: string, expiresIn?: number) => api.get<DocumentUrlResponse>("/v2/documents/get/url", { query: { id, expiresIn } }),
    create: (body: FormData | DocumentCreateRefBody) => api.post<DocumentInfo>("/v2/documents/create", { body }),
    update: (body: DocumentUpdateBody) => api.post<DocumentInfo>("/v2/documents/update", { body }),
    delete: (body: { documentId: string }) => api.post<{ success: boolean; documentId: string; status: string }>("/v2/documents/delete", { body }),
};

export function useDocumentDetail(id: string | null) {
    return useQuery({
        queryKey: ["documents", "detail", id],
        queryFn: async () => assertSuccess(await documentApi.detail(id!)),
        enabled: Boolean(id),
    });
}

export function useDocumentUrl(id: string | null, expiresIn?: number) {
    return useQuery({
        queryKey: ["documents", "url", id, expiresIn],
        queryFn: async () => assertSuccess(await documentApi.url(id!, expiresIn)),
        enabled: Boolean(id),
    });
}

/** Search documents by title for use in picker components */
export async function searchDocuments(searchTerm: string, documentType?: string): Promise<DocumentInfo[]> {
    const res = await documentApi.list({ search: searchTerm, documentType, itemsPerPage: 30, page: 1 });
    const raw = res as unknown as { data?: DocumentInfo[]; pagination?: unknown };
    return Array.isArray(raw.data) ? raw.data : [];
}
