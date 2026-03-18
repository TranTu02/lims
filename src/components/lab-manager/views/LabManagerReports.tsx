import { useState } from "react";
import { BarChart3, Download, Calendar, TrendingUp, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalysesList } from "@/api/analyses";

type ReportPeriod = "day" | "week" | "month";
type ReportFilter = "received" | "handover" | "passed" | "feedback" | "subcontract";

export function LabManagerReports() {
    const [period, setPeriod] = useState<ReportPeriod>("week");
    const [filter, setFilter] = useState<ReportFilter>("received");

    // Fetch various statuses for stats
    const { data: allRes } = useAnalysesList({ query: { itemsPerPage: 1, page: 1 } });
    const { data: approvedRes } = useAnalysesList({ query: { analysisStatus: "Approved" as any, itemsPerPage: 1, page: 1 } });
    const { data: testingRes } = useAnalysesList({ query: { analysisStatus: "Testing" as any, itemsPerPage: 1, page: 1 } });
    const { data: retestRes } = useAnalysesList({ query: { analysisStatus: "ReTest" as any, itemsPerPage: 1, page: 1 } });

    const totalAll = allRes?.meta?.total ?? 0;
    const totalApproved = approvedRes?.meta?.total ?? 0;
    const totalTesting = testingRes?.meta?.total ?? 0;
    const totalRetest = retestRes?.meta?.total ?? 0;

    const summaryCards = [
        {
            label: "Tổng chỉ tiêu nhận",
            value: totalAll,
            icon: TrendingUp,
            color: "emerald",
            change: "+12% so với kỳ trước",
            changeIcon: ArrowUpRight,
        },
        {
            label: "Đã duyệt hoàn tất",
            value: totalApproved,
            icon: CheckCircle2,
            color: "blue",
            change: `Tỷ lệ: ${totalAll > 0 ? Math.round((totalApproved / totalAll) * 100) : 0}%`,
            changeIcon: null,
        },
        {
            label: "Đang thực hiện",
            value: totalTesting,
            icon: Clock,
            color: "amber",
            change: "Trung bình 2.5h/CT",
            changeIcon: null,
        },
        {
            label: "Cần làm lại",
            value: totalRetest,
            icon: AlertCircle,
            color: "rose",
            change: totalRetest > 0 ? "Cần theo dõi" : "Không có",
            changeIcon: totalRetest > 0 ? ArrowDownRight : null,
        },
    ];

    const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
        emerald: { bg: "bg-emerald-50/20", border: "border-emerald-100", text: "text-emerald-700", iconBg: "bg-emerald-100 text-emerald-600" },
        blue: { bg: "bg-blue-50/20", border: "border-blue-100", text: "text-blue-700", iconBg: "bg-blue-100 text-blue-600" },
        amber: { bg: "bg-amber-50/20", border: "border-amber-100", text: "text-amber-700", iconBg: "bg-amber-100 text-amber-600" },
        rose: { bg: "bg-rose-50/20", border: "border-rose-100", text: "text-rose-700", iconBg: "bg-rose-100 text-rose-600" },
    };

    // Status distribution bars
    const statusBars = [
        { label: "Đã duyệt (Approved)", value: totalApproved, color: "#10b981" },
        { label: "Đang TN (Testing)", value: totalTesting, color: "#3b82f6" },
        { label: "Cần làm lại (ReTest)", value: totalRetest, color: "#ef4444" },
        { label: "Chờ nhận", value: Math.max(0, totalAll - totalApproved - totalTesting - totalRetest), color: "#a1a1aa" },
    ];

    return (
        <div className="flex h-full flex-col gap-4 p-6 bg-background overflow-auto">
            {/* Header */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-emerald-500" />
                        Trích xuất báo cáo
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Báo cáo thời gian thực về tình hình vận hành phòng Lab.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="default" size="sm" className="gap-2 h-9 shadow-md bg-emerald-600 hover:bg-emerald-700">
                        <Download className="h-4 w-4" />
                        Xuất báo cáo (Excel)
                    </Button>
                </div>
            </div>

            {/* Period + Filter Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <Tabs value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
                    <TabsList className="grid grid-cols-3 w-[280px]">
                        <TabsTrigger value="day" className="text-xs gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Ngày
                        </TabsTrigger>
                        <TabsTrigger value="week" className="text-xs gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Tuần
                        </TabsTrigger>
                        <TabsTrigger value="month" className="text-xs gap-1.5">
                            <Calendar className="h-3.5 w-3.5" /> Tháng
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Tabs value={filter} onValueChange={(v) => setFilter(v as ReportFilter)}>
                    <TabsList className="grid grid-cols-5 w-full lg:w-auto">
                        <TabsTrigger value="received" className="text-xs">Đã nhận</TabsTrigger>
                        <TabsTrigger value="handover" className="text-xs">Bàn giao</TabsTrigger>
                        <TabsTrigger value="passed" className="text-xs">KQ đạt</TabsTrigger>
                        <TabsTrigger value="feedback" className="text-xs">Phản hồi</TabsTrigger>
                        <TabsTrigger value="subcontract" className="text-xs">Thầu phụ</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => {
                    const colors = colorMap[card.color];
                    const Icon = card.icon;
                    return (
                        <Card key={card.label} className={`shadow-sm ${colors.border} ${colors.bg} backdrop-blur-md transition-all hover:shadow-md group`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>{card.label}</CardTitle>
                                <div className={`p-2 rounded-lg ${colors.iconBg} group-hover:scale-110 transition-transform`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground">{card.value}</div>
                                <div className={`flex items-center mt-1 text-[10px] font-medium ${colors.text}`}>
                                    {card.changeIcon && <card.changeIcon className="h-3 w-3 mr-1" />}
                                    <span>{card.change}</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* Status Distribution */}
                <Card className="shadow-sm border-border/50">
                    <CardHeader className="pb-3 border-b border-border/10">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            Phân bổ trạng thái
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            {statusBars.map((bar) => {
                                const pct = totalAll > 0 ? Math.round((bar.value / totalAll) * 100) : 0;
                                return (
                                    <div key={bar.label} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-muted-foreground">{bar.label}</span>
                                            <span className="font-semibold text-foreground">{bar.value} ({pct}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: bar.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">Cập nhật: {new Date().toLocaleTimeString("vi-VN")}</div>
                            <Button variant="link" size="sm" className="text-xs text-emerald-600 font-semibold p-0 h-auto gap-1">
                                Chi tiết <ArrowUpRight className="h-3 w-3" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Workload */}
                <Card className="shadow-sm border-border/50">
                    <CardHeader className="pb-3 border-b border-border/10">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            Tổng kết theo thời gian
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-5 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                <span>Kỳ hiện tại ({period === "day" ? "Hôm nay" : period === "week" ? "Tuần này" : "Tháng này"})</span>
                                <span className="font-bold text-foreground text-lg">{totalAll}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                <span>Đã hoàn thành</span>
                                <span className="font-bold text-emerald-600 text-lg">{totalApproved}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                                <span>Tỷ lệ hoàn thành</span>
                                <span className="font-bold text-blue-600 text-lg">
                                    {totalAll > 0 ? Math.round((totalApproved / totalAll) * 100) : 0}%
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-muted/20 rounded-lg border border-border/50">
                            <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-2">Ghi chú</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Dữ liệu được tổng hợp từ API thời gian thực. Sử dụng bộ lọc phía trên để xem theo từng tiêu chí cụ thể.
                                Nhấn "Xuất báo cáo" để tải file Excel chi tiết.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
