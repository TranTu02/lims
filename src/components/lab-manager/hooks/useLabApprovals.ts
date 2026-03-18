import { useState, useCallback } from "react";
import api from "@/api/client";
import { toast } from "sonner";
import type { AnalysisStatusDb } from "@/types/analysis";

export interface Analysis {
    analysisId: string;
    receiptId: string;
    sampleId: string;
    parameterName: string;
    protocolCode: string;
    resultValue: string;
    resultUnit: string;
    analysisResultStatus: string;
    analysisNotes: string;
    analysisStatus: string;
    submitLastResultAt: string;
    labTestFileId?: string;
    technicianName?: string;
    technicianAlias?: string;
    reviewerNotes?: string;
    retestReason?: string;
    analysisMarks?: string[];
    analysisDocumentId?: string;
}

export function useLabApprovals() {
    const [loading, setLoading] = useState(false);
    const [dataEntered, setDataEntered] = useState<Analysis[]>([]);
    const [techReview, setTechReview] = useState<Analysis[]>([]);

    const fetchDataEntered = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get<any[]>("/v2/analyses/get/list", {
                query: { 
                    analysisStatus: "DataEntered",
                    page: 1, 
                    itemsPerPage: 50 
                }
            });
            
            if (res.data) {
                const mapped = res.data.map((item: any) => ({
                    ...item,
                    technicianName: item.technician?.identityName,
                    technicianAlias: item.technician?.alias,
                    resultValue: item.resultValue || "N/A",
                }));
                setDataEntered(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch DataEntered:", error);
            toast.error("Lỗi khi tải danh sách chờ soát xét");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTechReview = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get<any[]>("/v2/analyses/get/list", {
                query: { 
                    analysisStatus: "TechReview",
                    page: 1, 
                    itemsPerPage: 50 
                }
            });
            
            if (res.data) {
                const mapped = res.data.map((item: any) => ({
                    ...item,
                    technicianName: item.technician?.identityName,
                    technicianAlias: item.technician?.alias,
                    resultValue: item.resultValue || "N/A",
                }));
                setTechReview(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch TechReview:", error);
            toast.error("Lỗi khi tải danh sách chờ duyệt");
        } finally {
            setLoading(false);
        }
    }, []);

    const changeStatus = async (
        analysisId: string,
        newStatus: string,
        extraData?: { reviewerNotes?: string; retestReason?: string }
    ) => {
        try {
            setLoading(true);
            await api.post("/v2/analyses/update", {
                body: {
                    analysisId,
                    analysisStatus: newStatus as AnalysisStatusDb,
                    ...extraData,
                }
            });
            toast.success("Cập nhật trạng thái thành công");
            return true;
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Cập nhật trạng thái thất bại");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        dataEntered,
        techReview,
        fetchDataEntered,
        fetchTechReview,
        changeStatus,
    };
}
