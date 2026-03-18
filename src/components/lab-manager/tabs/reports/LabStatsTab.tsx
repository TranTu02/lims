import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
    BarChart3, 
    TrendingUp, 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLabStats } from "../../hooks/useLabStats";

export function LabStatsTab() {
    const { t } = useTranslation();
    const { loading, summary, statusData, workloadData, fetchStats } = useLabStats();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading && summary.totalSamples === 0) {
        return (
            <div className="flex items-center justify-center h-full animate-pulse">
                <div className="text-center">
                    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Đang tính toán số liệu thống kê...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border-x border-b border-border shadow-sm animate-in fade-in zoom-in-95 duration-200 overflow-auto">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-muted/10 sticky top-0 z-20 backdrop-blur-sm">
                <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-emerald-500" />
                        Tổng hợp & Thống kê hiệu suất
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Báo cáo thời gian thực về tình hình vận hành của phòng Lab</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2 h-9">
                        <Calendar className="h-4 w-4" />
                        7 ngày qua
                    </Button>
                    <Button variant="default" size="sm" className="gap-2 h-9 shadow-md bg-emerald-600 hover:bg-emerald-700">
                        <Download className="h-4 w-4" />
                        Xuất báo cáo (Excel)
                    </Button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-emerald-100 bg-emerald-50/20 backdrop-blur-md transition-all hover:shadow-md group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Tổng mẫu nhận</CardTitle>
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{summary.totalSamples}</div>
                            <div className="flex items-center mt-1 text-[10px] font-medium text-emerald-600">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                <span>+12% so với tuần trước</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-blue-100 bg-blue-50/20 backdrop-blur-md transition-all hover:shadow-md group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-700">Hoàn tất hôm nay</CardTitle>
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{summary.completedToday}</div>
                            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">Tỷ lệ hoàn thành: 9.6%</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-amber-100 bg-amber-50/20 backdrop-blur-md transition-all hover:shadow-md group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-700">Đang chờ soát xét</CardTitle>
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600 group-hover:scale-110 transition-transform">
                                <Clock className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{summary.pendingReview}</div>
                            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">~ 2.5 giờ trung bình/mẫu</p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-rose-100 bg-rose-50/20 backdrop-blur-md transition-all hover:shadow-md group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-rose-700">Mẫu trễ hạn</CardTitle>
                            <div className="p-2 bg-rose-100 rounded-lg text-rose-600 group-hover:scale-110 transition-transform">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-rose-600">{summary.lateSamples}</div>
                            <div className="flex items-center mt-1 text-[10px] font-medium text-rose-500">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                <span>Giảm 2 mẫu so với hôm qua</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    {/* Status Distribution */}
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="pb-3 border-b border-border/10">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Phân bổ trạng thái mẫu
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {statusData.map((item) => {
                                    const percent = Math.round((item.value / summary.totalSamples) * 100) || item.value; // adjustment for mock
                                    return (
                                        <div key={item.label} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-medium text-muted-foreground">{item.label}</span>
                                                <span className="font-semibold text-foreground">{item.value} mẩu ({percent}%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full transition-all duration-700 ease-out"
                                                    style={{ width: `${percent}%`, backgroundColor: item.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">Dữ liệu được cập nhật lúc: {new Date().toLocaleTimeString()}</div>
                                <Button variant="link" size="sm" className="text-xs text-emerald-600 font-semibold p-0 h-auto gap-1">
                                    Chi tiết <ArrowUpRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Workload Distribution */}
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="pb-3 border-b border-border/10">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" />
                                Khối lượng việc theo KNV
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-5">
                                {workloadData.map((item, idx) => {
                                    const maxVal = Math.max(...workloadData.map(w => w.value));
                                    const width = (item.value / maxVal) * 100;
                                    return (
                                        <div key={item.label} className="flex items-center gap-4">
                                            <div className="w-24 text-xs font-medium text-foreground truncate">{item.label}</div>
                                            <div className="flex-1 h-3 bg-muted rounded-sm overflow-hidden relative">
                                                <div 
                                                    className={`h-full transition-all duration-700 ease-out ${idx % 2 === 0 ? 'bg-purple-500' : 'bg-indigo-400'}`}
                                                    style={{ width: `${width}%` }}
                                                />
                                            </div>
                                            <div className="w-8 text-xs font-bold text-right text-muted-foreground">{item.value}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-10 p-4 bg-muted/20 rounded-lg border border-border/50">
                                <h4 className="text-[11px] font-bold uppercase text-muted-foreground mb-2">Nhân viên xuất sắc trong tháng</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                        VC
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold">Lê Văn C</div>
                                        <div className="text-[10px] text-muted-foreground">Hoàn thành 48 chỉ tiêu (Vượt 15% mục tiêu)</div>
                                    </div>
                                    <Badge className="ml-auto bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[9px]">🥇 Top 1</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
