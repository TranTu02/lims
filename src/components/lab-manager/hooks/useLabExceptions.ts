import { useState, useCallback } from "react";
import api from "@/api/client";
import { toast } from "sonner";
// import type { AnalysisStatusDb } from "@/types/analysis"; // Not needed if not used

export interface ExceptionSample {
    receiptId: string;
    sampleId: string;
    customerName: string;
    createdAt: string;
    deadline?: string;
    status: string;
    type: "urgent" | "complaint";
    reason?: string;
}

export interface ExceptionAnalysis {
    analysisId: string;
    receiptId: string;
    sampleId: string;
    parameterName: string;
    technicianName: string;
    status: string;
    type: "retest" | "complaint" | "subcontract";
    reason?: string;
}

export function useLabExceptions() {
    const [loading, setLoading] = useState(false);
    
    const [urgentSamples, setUrgentSamples] = useState<ExceptionSample[]>([]);
    const [complaintSamples, setComplaintSamples] = useState<ExceptionSample[]>([]);
    const [retestAnalyses, setRetestAnalyses] = useState<ExceptionAnalysis[]>([]);
    const [subcontractAnalyses, setSubcontractAnalyses] = useState<ExceptionAnalysis[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Urgent (example using priority search)
            const urgentRes = await api.get<any[]>("/v2/samples/get/list", {
                query: { search: "Urgent", page: 1, itemsPerPage: 50 }
            });
            if (urgentRes.data) {
                setUrgentSamples(urgentRes.data.map((item: any) => ({
                    receiptId: item.receiptId,
                    sampleId: item.sampleId,
                    customerName: item.customer?.identityName || "N/A",
                    createdAt: item.createdAt,
                    deadline: item.sampleDeadline || item.deadline,
                    status: item.sampleStatus || item.status,
                    type: "urgent",
                    reason: item.notes || "Yêu cầu khẩn"
                })));
            }

            // Fetch Retest
            const retestRes = await api.get<any[]>("/v2/analyses/get/list", {
                query: { analysisStatus: "ReTest", page: 1, itemsPerPage: 50 }
            });
            if (retestRes.data) {
                setRetestAnalyses(retestRes.data.map((item: any) => ({
                    analysisId: item.analysisId,
                    receiptId: item.receiptId,
                    sampleId: item.sampleId,
                    parameterName: item.parameterName,
                    technicianName: item.technician?.identityName || "N/A",
                    status: item.analysisStatus,
                    type: "retest",
                    reason: item.retestReason || item.notes
                })));
            }

            // Fetch Complaints
            const complaintRes = await api.get<any[]>("/v2/samples/get/list", {
                query: { sampleStatus: "Complaint", page: 1, itemsPerPage: 50 }
            });
            if (complaintRes.data) {
                setComplaintSamples(complaintRes.data.map((item: any) => ({
                    receiptId: item.receiptId,
                    sampleId: item.sampleId,
                    customerName: item.customer?.identityName || "N/A",
                    createdAt: item.createdAt,
                    status: item.sampleStatus || item.status,
                    type: "complaint",
                    reason: item.sampleNotes || "Khiếu nại khách hàng"
                })));
            }

            // Fetch Subcontract or others if needed
            const subcontractRes = await api.get<any[]>("/v2/analyses/get/list", {
                query: { analysisStatus: "Sending", page: 1, itemsPerPage: 50 }
            });
            if (subcontractRes.data) {
                setSubcontractAnalyses(subcontractRes.data.map((item: any) => ({
                    analysisId: item.analysisId,
                    receiptId: item.receiptId,
                    sampleId: item.sampleId,
                    parameterName: item.parameterName,
                    technicianName: item.technician?.identityName || "N/A",
                    status: item.analysisStatus,
                    type: "subcontract",
                    reason: item.analysisNotes || "Gửi nhà thầu phụ"
                })));
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu Exceptions:", error);
            toast.error("Không thể tải danh sách ngoại lệ");
        } finally {
            setLoading(false);
        }
    }, []);

    const processException = async (id: string, action: "approve" | "reject", note?: string) => {
        setLoading(true);
        try {
            // Placeholder for real action
            await api.post("/v2/analyses/update", {
                body: { 
                    analysisId: id, 
                    analysisStatus: action === "approve" ? "Testing" : "Cancelled",
                    analysisNotes: note
                }
            });
            toast.success(`Xử lý thành công (${action})`);
            fetchData();
            return true;
        } catch (error) {
            toast.error("Lỗi khi xử lý");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        urgentSamples,
        complaintSamples,
        retestAnalyses,
        subcontractAnalyses,
        fetchData,
        processException
    };
}
