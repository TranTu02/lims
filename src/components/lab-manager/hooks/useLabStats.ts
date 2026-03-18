import { useState, useCallback } from "react";
import api from "@/api/client";
import { toast } from "sonner";

export interface LabStatSummary {
    totalSamples: number;
    completedToday: number;
    pendingReview: number;
    lateSamples: number;
}

export interface ChartData {
    label: string;
    value: number;
    color?: string;
}

export function useLabStats() {
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<LabStatSummary>({
        totalSamples: 0,
        completedToday: 0,
        pendingReview: 0,
        lateSamples: 0
    });
    const [statusData, setStatusData] = useState<ChartData[]>([]);
    const [workloadData, setWorkloadData] = useState<ChartData[]>([]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch analysis status options with counts
            const res = await api.post<any[]>("/v2/analyses/get/options", {
                body: { 
                    filterFrom: "analysisStatus",
                    otherFilters: []
                }
            });

            if (res.data) {
                const colors: Record<string, string> = {
                    "Pending": "#94a3b8",
                    "Testing": "#3b82f6",
                    "DataEntered": "#f59e0b",
                    "TechReview": "#f97316",
                    "Approved": "#10b981",
                    "ReTest": "#ef4444"
                };

                const mappedStatusData = res.data.map((item: any) => ({
                    label: item.filterValue,
                    value: item.count,
                    color: colors[item.filterValue] || "#64748b"
                }));
                setStatusData(mappedStatusData);

                // Update summary based on status counts
                const total = res.data.reduce((acc, curr) => acc + curr.count, 0);
                const pendingReview = res.data.find(i => i.filterValue === "DataEntered")?.count || 0;
                const approved = res.data.find(i => i.filterValue === "Approved")?.count || 0;

                setSummary({
                    totalSamples: total,
                    completedToday: approved,
                    pendingReview: pendingReview,
                    lateSamples: 0 // Mocking late samples for now
                });
            }

            // Fetch technician workload
            const techRes = await api.post<any[]>("/v2/analyses/get/options", {
                body: { 
                    filterFrom: "technicianId",
                    otherFilters: []
                }
            });
            if (techRes.data) {
                setWorkloadData(techRes.data.slice(0, 5).map((item: any) => ({
                    label: item.filterValue, // This might be ID, ideally we'd map to name
                    value: item.count
                })));
            }

        } catch (error) {
            console.error("Lỗi khi tải thống kê:", error);
            toast.error("Không thể tải dữ liệu thống kê");
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        summary,
        statusData,
        workloadData,
        fetchStats
    };
}
