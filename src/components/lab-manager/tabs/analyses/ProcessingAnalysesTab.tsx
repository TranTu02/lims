import { useEffect } from "react";
import { TestTube2, Clock, PlayCircle, CheckCircle2, UserCircle, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProcessingAnalyses } from "../../hooks/useProcessingAnalyses";

export function ProcessingAnalysesTab() {
    const { loading, analyses, fetchAnalyses } = useProcessingAnalyses();

    useEffect(() => {
        fetchAnalyses();
    }, [fetchAnalyses]);

    return (
        <div className="flex flex-col h-full bg-background rounded-b-lg border-x border-b border-border shadow-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border-b border-border shrink-0 bg-muted/10">
                <div className="p-4 flex flex-col items-center justify-center border-r border-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Đang chờ</div>
                    <div className="text-2xl font-bold text-foreground">{analyses.filter(a => a.status === 'Ready').length}</div>
                    <Badge variant="outline" className="mt-1 bg-background text-[10px]">Ready</Badge>
                </div>
                <div className="p-4 flex flex-col items-center justify-center border-r border-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Đang thử nghiệm</div>
                    <div className="text-2xl font-bold text-primary">{analyses.filter(a => a.status === 'Testing').length}</div>
                    <Badge variant="default" className="mt-1 text-[10px]">Testing</Badge>
                </div>
                <div className="p-4 flex flex-col items-center justify-center border-r border-border">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Chờ duyệt KQ</div>
                    <div className="text-2xl font-bold text-amber-600">{analyses.filter(a => a.status === 'TechReview').length}</div>
                    <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-600 border-amber-200 text-[10px]">Review</Badge>
                </div>
                <div className="p-4 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Hoàn tất</div>
                    <div className="text-2xl font-bold text-emerald-600">{analyses.filter(a => a.status === 'Approved').length}</div>
                    <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">Done</Badge>
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background shrink-0">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <TestTube2 className="h-5 w-5 text-primary" />
                    Quản lý tiến độ phân tích
                </h2>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1 font-bold">
                        {analyses.length} chỉ tiêu active
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 border-rose-200 text-rose-600 bg-rose-50 font-medium">
                        {analyses.filter(a => a.priority === 'Urgent' || a.priority === 'High').length} Ưu tiên
                    </Badge>
                </div>
            </div>

            {/* Analysis List */}
            <div className="flex-1 overflow-auto bg-background">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 sticky top-0 z-10 border-b border-border">
                        <tr>
                            <th className="px-5 py-3 font-medium">Mã Phiếu / Mẫu</th>
                            <th className="px-5 py-3 font-medium">Chỉ tiêu & Phương pháp</th>
                            <th className="px-5 py-3 font-medium">KTV Phân tích</th>
                            <th className="px-5 py-3 font-medium">Hạn trả (Deadline)</th>
                            <th className="px-5 py-3 font-medium ">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {analyses.map((item) => {
                            const isUrgent = item.priority === 'Urgent' || item.priority === 'High';
                            const isLate = new Date(item.deadline) < new Date();
                            
                            return (
                                <tr key={item.id} className="hover:bg-muted/30 group transition-colors">
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-semibold text-foreground">{item.receiptId}</div>
                                        <div className="text-muted-foreground text-xs mt-1 font-mono">{item.sampleId}</div>
                                        {isUrgent && (
                                            <div className="mt-2">
                                                <Badge variant="destructive" className="bg-rose-500 text-white border-none text-[10px] px-1.5 py-0 uppercase font-black tracking-tight animate-pulse">
                                                    {item.priority}
                                                </Badge>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 align-top">
                                        <div className="font-medium text-primary text-sm line-clamp-1">{item.parameterName}</div>
                                        <div className="text-muted-foreground mt-1.5 text-xs bg-muted/60 px-2 py-1 rounded inline-block">{item.method}</div>
                                    </td>
                                    <td className="px-5 py-4 align-top">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                                {item.technicianName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{item.technicianName}</div>
                                                <div className="text-[10px] text-muted-foreground">Phòng Hóa Lý</div>
                                            </div>
                                        </div>
                                        {item.notes && (
                                            <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700 leading-relaxed max-w-[180px]">
                                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <span className="italic line-clamp-2">{item.notes}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-5 py-4 align-middle">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                                <Clock className={`h-3.5 w-3.5 ${isLate ? 'text-rose-600' : 'text-muted-foreground'}`} />
                                                <span>{new Date(item.deadline).toLocaleString("vi-VN", {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            {isLate ? (
                                                <Badge variant="destructive" className="text-[10px]">Trễ hạn</Badge>
                                            ) : (
                                                <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[65%]" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 align-middle ">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                                                <PlayCircle className="h-4 w-4 text-emerald-600" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                                                <UserCircle className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full">
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {item.status === 'Approved' && (
                                            <div className="p-1 px-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                                                <CheckCircle2 className="h-3 w-3" />
                                                DONE
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}

                        {analyses.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="py-20 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 bg-muted/20 rounded-full">
                                            <TestTube2 className="h-10 w-10 opacity-30" />
                                        </div>
                                        <p>Không tìm thấy chỉ tiêu nào đang xử lý.</p>
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
