import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TestTube2, Clock, PlayCircle, CheckCircle2, UserCircle, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProcessingAnalyses } from "../../hooks/useProcessingAnalyses";

export function ProcessingAnalysesTab() {
    const { t } = useTranslation();
    const { loading, analyses, fetchAnalyses } = useProcessingAnalyses();

    useEffect(() => {
        fetchAnalyses();
    }, [fetchAnalyses]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Assigned': return <Clock className="h-4 w-4 text-muted-foreground" />;
            case 'InProgress': return <PlayCircle className="h-4 w-4 text-blue-500" />;
            case 'Completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Assigned': return <Badge variant="outline" className="text-muted-foreground border-border/50 bg-muted/20">Mới được giao</Badge>;
            case 'InProgress': return <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">Đang thực hiện</Badge>;
            case 'Completed': return <Badge variant="default" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none">Hoàn thành</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border-x border-b border-border shadow-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-muted/10">
                <div>
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                        <TestTube2 className="h-5 w-5 text-purple-500" />
                        Chỉ tiêu đang thực hiện
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">Quản lý và theo dõi tiến độ phân tích chi tiết đến từng phép thử, nhân viên</p>
                </div>

                <div className="flex items-center gap-4">
                     <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="px-2 py-0.5 rounded-full font-medium">Tổng: {analyses.length}</Badge>
                        <Badge variant="outline" className="px-2 py-0.5 rounded-full border-blue-200 text-blue-600 bg-blue-50">Đang chạy: {analyses.filter(a => a.status === 'InProgress').length}</Badge>
                    </div>
                </div>
            </div>

             {/* List */}
             <div className="flex-1 overflow-auto bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-5 py-4 font-medium border-b border-border w-[20%]">Mẫu / Phiếu nhận</th>
                            <th className="px-5 py-4 font-medium border-b border-border w-[25%]">Thông tin Phép thử</th>
                            <th className="px-5 py-4 font-medium border-b border-border w-[20%]">Người thực hiện</th>
                            <th className="px-5 py-4 font-medium border-b border-border w-[20%]">Trạng thái & Hạn</th>
                            <th className="px-5 py-4 font-medium border-b border-border  w-[15%]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {analyses.map((item) => {
                             const isLate = new Date(item.deadline) < new Date() && item.status !== 'Completed';

                            return (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                                    {/* Mẫu / Phiếu */}
                                    <td className="px-5 py-4 align-top">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-foreground text-sm">{item.sampleId}</div>
                                             {item.priority === 'Urgent' && (
                                                <Badge variant="destructive" className="px-1 py-0 h-4 text-[9px] uppercase tracking-wider">Khẩn</Badge>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground mt-1 text-xs">{item.receiptId}</div>
                                       
                                        {/* Priority badge */}
                                        {item.priority === 'High' && (
                                            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 font-medium">
                                                <AlertTriangle className="h-3 w-3" />
                                                Ưu tiên cao
                                            </div>
                                        )}
                                    </td>

                                    {/* Parameter */}
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-medium text-primary text-sm line-clamp-2" title={item.parameterName}>{item.parameterName}</div>
                                        {item.method && (
                                            <div className="text-muted-foreground mt-1 text-xs px-1.5 py-0.5 bg-muted inline-flex rounded font-mono">{item.method}</div>
                                        )}
                                         {item.notes && (
                                            <div className="mt-2 text-xs truncate max-w-[200px] text-amber-600 italic bg-amber-50 px-1.5 py-0.5 rounded border border-amber-50" title={item.notes}>
                                                Lưu ý: {item.notes}
                                            </div>
                                        )}
                                    </td>

                                    {/* Technician */}
                                    <td className="px-5 py-4 align-top">
                                        <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                                            <div className="h-6 w-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                <UserCircle className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <span className="truncate">{item.technicianName}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1.5 ml-8 flex flex-col gap-0.5">
                                            <span>Giao: {new Date(item.assignedAt).toLocaleDateString("vi-VN")} {new Date(item.assignedAt).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>

                                    {/* Status & Timeline */}
                                    <td className="px-5 py-4 align-top">
                                       <div className="flex flex-col items-start gap-2 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(item.status)}
                                                {getStatusBadge(item.status)}
                                            </div>
                                            <div className={`flex items-center gap-1.5 ${isLate ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                                                <Clock className={`h-3.5 w-3.5 ${isLate ? '' : 'opacity-70'}`} />
                                                <span>Hạn: {new Date(item.deadline).toLocaleDateString("vi-VN")} {new Date(item.deadline).toLocaleTimeString("vi-VN", {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                       </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-5 py-4 align-middle ">
                                        <div className="flex justify-start flex-col items-start gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="h-7 text-xs px-2.5 bg-background shadow-xs hover:bg-muted"
                                            >
                                                Chia lại việc
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 ease-in-out w-8 h-8 p-0"
                                                title="Xem chi tiết phép thử"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                         {analyses.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-muted-foreground bg-muted/5">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 bg-background rounded-full border border-border/50 shadow-sm">
                                            <TestTube2 className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <p>Không có chỉ tiêu nào đang thực hiện.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        
                        {loading && analyses.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-3 animate-pulse">
                                         <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                         <p>Đang tải dữ liệu chỉ tiêu...</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    );
}
