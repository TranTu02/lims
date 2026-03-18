import { useState, useCallback } from "react";
import api from "@/api/client";
import { toast } from "sonner";

export interface ProcessingAnalysis {
    id: string;
    sampleId: string;
    receiptId: string;
    parameterName: string;
    technicianName: string;
    status: string; // 'Assigned', 'InProgress', 'Completed'
    assignedAt: string;
    deadline: string;
    priority: "Normal" | "High" | "Urgent";
    notes?: string;
    method?: string;
}

export function useProcessingAnalyses() {
    const [loading, setLoading] = useState(false);
    const [analyses, setAnalyses] = useState<ProcessingAnalysis[]>([]);

    const fetchAnalyses = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<any[]>("/v2/analyses/get/processing", {
                query: { page: 1, itemsPerPage: 100 }
            });

            if (res.data) {
                const mapped = res.data.map((item: any) => ({
                    id: item.analysisId || item.id,
                    sampleId: item.sampleId,
                    receiptId: item.receiptId,
                    parameterName: item.parameterName,
                    technicianName: item.technician?.identityName || "N/A",
                    status: item.analysisStatus || item.status,
                    assignedAt: item.assignedAt || item.createdAt,
                    deadline: item.analysisDeadline || item.deadline || "",
                    priority: item.priority || "Normal",
                    notes: item.analysisNotes || item.notes,
                    method: item.protocolCode || item.method
                }));
                setAnalyses(mapped);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách chỉ tiêu:", error);
            toast.error("Không thể tải danh sách chỉ tiêu");
        } finally {
            setLoading(false);
        }
    }, []);

    const assignTechnician = async (analysisId: string, technicianId: string) => {
        try {
            await api.post("/v2/analyses/update", {
                body: { analysisId, technicianId }
            });
            toast.success("Đã phân công lại kiểm nghiệm viên");
            fetchAnalyses();
        } catch (error) {
            toast.error("Phân công lại thất bại");
        }
    }

    return {
        loading,
        analyses,
        fetchAnalyses,
        assignTechnician
    };
}
