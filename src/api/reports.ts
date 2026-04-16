import { useQuery } from "@tanstack/react-query";
import api, { type ApiResponse } from "@/api/client";

export type ReportPreviewResponse = {
    url: string;
    expiresIn: number;
    reportId: string;
    documentId: string;
};

export const reportApi = {
    getPreview: (reportId: string) => 
        api.get<ReportPreviewResponse>("/v2/reports/get/preview", { query: { reportId } }),
    
    getBySample: (sampleId: string) => 
        api.get<string[]>("/v2/reports/get/by-sample", { query: { sampleId } }),

    getDetail: (reportId: string) =>
        api.get<any>("/v2/reports/get/detail", { query: { reportId } }),
};

function assertSuccess<T>(res: ApiResponse<T>): T {
    if (!res.success) {
        throw new Error(res.error?.message ?? "An unknown error occurred");
    }
    return res.data as T;
}

export function useReportPreview(reportId: string | null, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ["reports", "preview", reportId],
        queryFn: async () => assertSuccess(await reportApi.getPreview(reportId!)),
        enabled: (opts?.enabled ?? true) && Boolean(reportId),
    });
}

export function useReportsBySample(sampleId: string | null, opts?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ["reports", "by-sample", sampleId],
        queryFn: async () => assertSuccess(await reportApi.getBySample(sampleId!)),
        enabled: (opts?.enabled ?? true) && Boolean(sampleId),
    });
}
