import { useState, useCallback } from "react";
import api from "@/api/client";
import { toast } from "sonner";

export interface ProcessingSample {
    receiptId: string;
    sampleId: string;
    customerName: string;
    sampleName: string;
    receivedAt: string;
    deadline: string;
    status: string;
    totalAnalyses: number;
    completedAnalyses: number;
    notes?: string;
}

export function useProcessingSamples() {
    const [loading, setLoading] = useState(false);
    const [samples, setSamples] = useState<ProcessingSample[]>([]);

    const fetchSamples = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get<any[]>("/v2/samples/get/processing", {
                query: { page: 1, itemsPerPage: 100 }
            });

            if (res.data) {
                const mapped = res.data.map((item: any) => ({
                    receiptId: item.receiptId,
                    sampleId: item.sampleId,
                    customerName: item.customer?.identityName || "N/A",
                    sampleName: item.sampleName,
                    receivedAt: item.createdAt,
                    deadline: item.sampleDeadline || item.deadline || "",
                    status: item.sampleStatus || item.status,
                    totalAnalyses: item.totalAnalyses || 0,
                    completedAnalyses: item.completedAnalyses || 0,
                    notes: item.sampleNotes || item.notes
                }));
                setSamples(mapped);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách mẫu:", error);
            toast.error("Không thể tải danh sách mẫu đang xử lý");
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        samples,
        fetchSamples
    };
}
